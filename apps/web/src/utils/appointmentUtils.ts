import type { AppointmentItem } from '../types/appointment';
import type { Doctor } from '../types/doctor';

export interface DaysRemainingResult {
  days: number;
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
}

/**
 * Computes calendar-safe days remaining between today (local 00:00:00) and scheduledDate.
 * Avoids UTC timezone shifts and negative-day glitches.
 */
export function getAppointmentDaysRemaining(scheduledDateStr?: string | null): DaysRemainingResult {
  if (!scheduledDateStr) {
    return { days: 0, label: '', isToday: false, isTomorrow: false, isPast: true };
  }

  // Extract YYYY-MM-DD
  const cleanDate = scheduledDateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length < 3) {
    return { days: 0, label: '', isToday: false, isTomorrow: false, isPast: true };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { days: 0, label: '', isToday: false, isTomorrow: false, isPast: true };
  }

  const targetDate = new Date(year, month, day, 0, 0, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, label: 'Past', isToday: false, isTomorrow: false, isPast: true };
  }
  if (diffDays === 0) {
    return { days: 0, label: 'Today', isToday: true, isTomorrow: false, isPast: false };
  }
  if (diffDays === 1) {
    return { days: 1, label: 'Tomorrow', isToday: false, isTomorrow: true, isPast: false };
  }
  return { days: diffDays, label: `In ${diffDays} days`, isToday: false, isTomorrow: false, isPast: false };
}

/**
 * Determines whether an appointment is currently active and upcoming.
 * True if status is not 'cancelled'/'completed' and scheduled date is today or in the future.
 */
export function isAppointmentUpcoming(appointment?: AppointmentItem | null): boolean {
  if (!appointment) return false;
  if (appointment.status === 'cancelled' || appointment.status === 'completed') {
    return false;
  }
  const { isPast } = getAppointmentDaysRemaining(appointment.scheduledDate);
  return !isPast;
}

/**
 * Returns the nearest upcoming active appointment from an array of appointments.
 * Sorts future/today appointments chronologically by date and time.
 */
export function getNearestUpcomingAppointment(appointments?: AppointmentItem[] | null): AppointmentItem | null {
  if (!appointments || appointments.length === 0) return null;

  const upcoming = appointments.filter(isAppointmentUpcoming);
  if (upcoming.length === 0) return null;

  return upcoming.sort((a, b) => {
    const timeA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`).getTime();
    const timeB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`).getTime();
    return timeA - timeB;
  })[0];
}

export interface EnrichedDoctorDetails {
  image: string | null;
  fee: string | null;
  specialty: string | null;
  pathway: 'female_pcos' | 'male_hypogonadism' | 'both' | null;
  relevanceReason: string | null;
  location: string | null;
}

/**
 * Enriches an appointment with doctor details by matching against loaded canonical doctors.
 */
export function enrichAppointmentWithDoctor(
  appointment: AppointmentItem,
  doctors?: Doctor[] | null
): EnrichedDoctorDetails {
  let matchedDoc: Doctor | undefined;

  if (appointment.providerId && doctors && doctors.length > 0) {
    matchedDoc = doctors.find((d) => String(d.id) === String(appointment.providerId));
  }

  if (!matchedDoc && appointment.providerName && doctors && doctors.length > 0) {
    const cleanApptName = appointment.providerName.toLowerCase().replace(/^(dr\.|prof\.)\s*/i, '').trim();
    matchedDoc = doctors.find((d) => {
      const cleanDocName = d.name.toLowerCase().replace(/^(dr\.|prof\.)\s*/i, '').trim();
      return (
        cleanDocName === cleanApptName ||
        cleanDocName.includes(cleanApptName) ||
        cleanApptName.includes(cleanDocName)
      );
    });
  }

  return {
    image: appointment.providerImage || matchedDoc?.profile_image || null,
    fee: appointment.fee || matchedDoc?.fee || null,
    specialty: appointment.providerSpecialty || matchedDoc?.specialty || null,
    pathway: (matchedDoc?.pathway as any) || null,
    relevanceReason: matchedDoc?.relevance_reason || null,
    location: appointment.location || matchedDoc?.location || null,
  };
}

/**
 * Generates initials from doctor or provider name for clean fallback avatar
 */
export function getDoctorInitials(name?: string | null): string {
  if (!name) return 'DR';
  const clean = name.replace(/^(Dr\.|Prof\.|Assoc\.\s*Prof\.|Assist\s*Prof\.)\s*/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'DR';
}

/**
 * Safely formats YYYY-MM-DD into readable date (e.g. Wednesday, Oct 2, 2026)
 */
export function formatAppointmentDate(scheduledDateStr?: string | null): string {
  if (!scheduledDateStr) return '';
  const cleanDate = scheduledDateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length < 3) return scheduledDateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return scheduledDateStr;

  const d = new Date(year, month, day);

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
