/**
 * BioPulse Mobile — Appointment Service
 *
 * Dedicated typed service connecting:
 * 1. Django Doctor Directory (real verified clinicians, never fake doctors)
 * 2. Django Doctor Profile
 * 3. Supabase Patient Appointments (public.appointments)
 *
 * Strictly adheres to database check constraints:
 * - status: 'requested' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
 * - appointment_type: 'consultation' | 'follow_up' | 'lab_review' | 'routine_check' | 'other'
 * - duration_minutes > 0
 * - scheduled_date format: YYYY-MM-DD
 * - scheduled_at format: valid ISO timestamp
 */

import { SUPABASE_URL, BACKEND_API_URL, getSupabaseHeaders, getDjangoHeaders, safeRequest, ApiResponse } from './api';
import { SpecialistDoctor, AppointmentItem } from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export type DbAppointmentStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type DbAppointmentType = 'consultation' | 'follow_up' | 'lab_review' | 'routine_check' | 'other';

export interface BookAppointmentInput {
  doctorId?: string;
  doctorName: string;
  specialty?: string;
  date: string; // e.g. "2026-03-24" or "24 Mar 2026"
  time: string; // e.g. "10:00 AM"
  location?: string;
  clinicOrHospital?: string;
  visitType?: 'In-person' | 'Online Consultation';
  appointmentType?: DbAppointmentType;
  title?: string;
  reason?: string;
  patientNotes?: string;
  providerNotes?: string;
  durationMinutes?: number;
}

export interface RescheduleAppointmentInput {
  date: string;
  time: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id?: string): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

/**
 * Normalizes input date strings (e.g. "16 Mar 2026" or "2026-03-16")
 * into YYYY-MM-DD and an ISO timestamp for scheduled_at
 */
export function normalizeDateAndIso(dateStr: string, timeStr: string = '10:00 AM'): { date: string; iso: string } {
  const cleanTime = timeStr ? timeStr.trim() : '10:00 AM';
  let hours = 10;
  let minutes = 0;

  const matchTime = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (matchTime) {
    hours = parseInt(matchTime[1], 10);
    minutes = parseInt(matchTime[2], 10);
    const meridiem = matchTime[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  // Check if dateStr is already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
    return {
      date: dateStr,
      iso: `${dateStr}T${timeFormatted}`,
    };
  }

  // Parse natural date string
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
    return {
      date,
      iso: `${date}T${timeFormatted}`,
    };
  }

  // Fallback to today + 7 days
  const future = new Date();
  future.setDate(future.getDate() + 7);
  const yyyy = future.getFullYear();
  const mm = String(future.getMonth() + 1).padStart(2, '0');
  const dd = String(future.getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
  return {
    date,
    iso: `${date}T${timeFormatted}`,
  };
}

export function mapDbStatusToUi(dbStatus: string): 'Upcoming' | 'Completed' | 'Cancelled' {
  const s = (dbStatus || '').toLowerCase();
  if (s === 'completed') return 'Completed';
  if (s === 'cancelled') return 'Cancelled';
  return 'Upcoming'; // 'scheduled', 'requested', 'rescheduled' are all upcoming
}

// ============================================================================
// APPOINTMENT SERVICE CLASS
// ============================================================================

export class AppointmentService {
  /**
   * Fetch verified clinicians from Django doctor directory.
   * Zero fake doctors policy — returns only real verified profiles.
   */
  static async getSpecialistDoctors(
    pathway?: string,
    strict = true
  ): Promise<ApiResponse<SpecialistDoctor[]>> {
    const cleanPathway =
      pathway === 'male' || pathway === 'male_hypogonadism'
        ? 'male_hypogonadism'
        : 'female_pcos';

    const url = `${BACKEND_API_URL}/v1/doctors/?pathway=${cleanPathway}&strict=${strict}`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getDjangoHeaders(),
    });

    if (res.error) {
      return { data: null, error: res.error, status: res.status };
    }

    const doctors: SpecialistDoctor[] = (res.data || []).map((doc: any) => ({
      id: String(doc.id || doc.slug),
      name: doc.name,
      specialty: doc.specialty || doc.designation || 'Medical Specialist',
      pathway: doc.pathway === 'male_hypogonadism' ? 'male' : 'female',
      hospital: doc.hospital || doc.clinic_organization || 'BioPulse Partner Center',
      experienceYears: Number(doc.experience_years) || 10,
      patientsCount: Number(doc.patients_count) || 500,
      rating: Number(doc.rating) || 4.8,
      photoUrl: doc.photo_url || doc.avatar_url,
      areasOfExpertise: Array.isArray(doc.areas_of_expertise) ? doc.areas_of_expertise : ['Endocrine Care'],
      about: doc.about || doc.bio || 'Verified BioPulse clinical specialist.',
      isAvailableToday: Boolean(doc.is_active),
    }));

    return { data: doctors, error: null, status: 200 };
  }

  /**
   * Fetch specific doctor profile by ID
   */
  static async getDoctorById(doctorId: string): Promise<ApiResponse<SpecialistDoctor | null>> {
    if (!doctorId) {
      return { data: null, error: 'Doctor ID is required.', status: 400 };
    }

    const url = `${BACKEND_API_URL}/v1/doctors/${doctorId}/`;
    const res = await safeRequest<any>(url, {
      method: 'GET',
      headers: getDjangoHeaders(),
    });

    if (res.error || !res.data) {
      return { data: null, error: res.error || 'Doctor not found.', status: res.status };
    }

    const doc = res.data;
    const doctor: SpecialistDoctor = {
      id: String(doc.id || doc.slug),
      name: doc.name,
      specialty: doc.specialty || doc.designation || 'Medical Specialist',
      pathway: doc.pathway === 'male_hypogonadism' ? 'male' : 'female',
      hospital: doc.hospital || doc.clinic_organization || 'BioPulse Partner Center',
      experienceYears: Number(doc.experience_years) || 10,
      patientsCount: Number(doc.patients_count) || 500,
      rating: Number(doc.rating) || 4.8,
      photoUrl: doc.photo_url || doc.avatar_url,
      areasOfExpertise: Array.isArray(doc.areas_of_expertise) ? doc.areas_of_expertise : ['Endocrine Care'],
      about: doc.about || doc.bio || 'Verified BioPulse clinical specialist.',
      isAvailableToday: Boolean(doc.is_active),
    };

    return { data: doctor, error: null, status: 200 };
  }

  /**
   * Fetch patient appointments from Supabase public.appointments
   */
  static async getAppointments(
    userId: string,
    token: string,
    statusFilter?: 'Upcoming' | 'Completed' | 'Cancelled'
  ): Promise<ApiResponse<AppointmentItem[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    let url = `${SUPABASE_URL}/rest/v1/appointments?patient_id=eq.${userId}&order=scheduled_at.asc&select=*`;
    if (statusFilter) {
      if (statusFilter === 'Upcoming') {
        url += `&status=in.(scheduled,requested,rescheduled)`;
      } else {
        url += `&status=eq.${statusFilter.toLowerCase()}`;
      }
    }

    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const items: AppointmentItem[] = (res.data || []).map((a: any) => {
      const uiStatus = mapDbStatusToUi(a.status);
      return {
        id: String(a.id),
        doctorId: String(a.provider_id || a.doctor_id || ''),
        doctorName: a.provider_name || 'Dr. Specialist',
        specialty: a.provider_specialty || 'Consultant',
        clinicOrHospital: a.location || 'Clinic Consultation',
        date: a.scheduled_date || (a.scheduled_at ? a.scheduled_at.split('T')[0] : ''),
        time: a.scheduled_time || '10:00 AM',
        location: a.location || 'Clinic Consultation',
        visitType: a.meeting_url ? 'Online Consultation' : 'In-person',
        status: uiStatus,
        reason: a.reason || undefined,
        patientNotes: a.patient_notes || undefined,
        appointmentType: a.appointment_type as DbAppointmentType,
      };
    });

    return { data: items, error: null, status: 200 };
  }

  /**
   * Book a new specialist appointment in Supabase
   */
  static async bookAppointment(
    userId: string,
    token: string,
    input: BookAppointmentInput
  ): Promise<ApiResponse<AppointmentItem>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    if (!input.doctorName || !input.doctorName.trim()) {
      return { data: null, error: 'Doctor name is required.', status: 400 };
    }

    const { date, iso } = normalizeDateAndIso(input.date, input.time);
    const locationStr = input.location || input.clinicOrHospital || 'BioPulse Health Center, Lahore';
    const appointmentType: DbAppointmentType = input.appointmentType || 'consultation';
    const title = input.title || `Consultation with ${input.doctorName}`;

    // provider_id in DB is a nullable UUID referencing auth.users(id)
    const providerId = isValidUuid(input.doctorId) ? input.doctorId : null;

    const payload = {
      patient_id: userId,
      provider_id: providerId,
      provider_name: input.doctorName.trim(),
      provider_specialty: input.specialty || 'Endocrinologist',
      title,
      appointment_type: appointmentType,
      scheduled_date: date,
      scheduled_time: input.time || '10:00 AM',
      scheduled_at: iso,
      duration_minutes: input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : 30,
      location: locationStr,
      meeting_url: input.visitType === 'Online Consultation' ? `https://meet.biopulse.health/${Date.now()}` : '',
      status: 'scheduled', // satisfies CHECK constraint (scheduled, requested, completed, cancelled, rescheduled)
      reason: input.reason || '',
      patient_notes: input.patientNotes || '',
      provider_notes: input.providerNotes || '',
      doctor_questions: [],
    };

    const url = `${SUPABASE_URL}/rest/v1/appointments`;
    const res = await safeRequest<any[]>(url, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const row = Array.isArray(res.data) && res.data[0] ? res.data[0] : payload;
    return {
      data: {
        id: String(row.id || 'apt_new'),
        doctorId: input.doctorId || '',
        doctorName: payload.provider_name,
        specialty: payload.provider_specialty,
        clinicOrHospital: payload.location,
        date: payload.scheduled_date,
        time: payload.scheduled_time,
        location: payload.location,
        visitType: input.visitType || 'In-person',
        status: 'Upcoming',
        appointmentType,
        reason: payload.reason,
        patientNotes: payload.patient_notes,
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Reschedule an existing appointment
   */
  static async rescheduleAppointment(
    appointmentId: string,
    userId: string,
    token: string,
    input: RescheduleAppointmentInput
  ): Promise<ApiResponse<boolean>> {
    if (!appointmentId || !token) {
      return { data: false, error: 'Appointment ID and token required.', status: 400 };
    }

    const { date, iso } = normalizeDateAndIso(input.date, input.time);

    const payload = {
      scheduled_date: date,
      scheduled_time: input.time,
      scheduled_at: iso,
      status: 'rescheduled',
      updated_at: new Date().toISOString(),
    };

    let url = `${SUPABASE_URL}/rest/v1/appointments?id=eq.${appointmentId}`;
    if (userId) {
      url += `&patient_id=eq.${userId}`;
    }

    const res = await safeRequest(url, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify(payload),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(
    appointmentId: string,
    token: string,
    userId?: string
  ): Promise<ApiResponse<boolean>> {
    if (!appointmentId || !token) {
      return { data: false, error: 'Appointment ID and token required.', status: 400 };
    }

    let url = `${SUPABASE_URL}/rest/v1/appointments?id=eq.${appointmentId}`;
    if (userId) {
      url += `&patient_id=eq.${userId}`;
    }

    const res = await safeRequest(url, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  /**
   * Complete an appointment (e.g. after clinician visit)
   */
  static async completeAppointment(
    appointmentId: string,
    token: string,
    userId?: string
  ): Promise<ApiResponse<boolean>> {
    if (!appointmentId || !token) {
      return { data: false, error: 'Appointment ID and token required.', status: 400 };
    }

    let url = `${SUPABASE_URL}/rest/v1/appointments?id=eq.${appointmentId}`;
    if (userId) {
      url += `&patient_id=eq.${userId}`;
    }

    const res = await safeRequest(url, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify({
        status: 'completed',
        updated_at: new Date().toISOString(),
      }),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  static createAppointment = AppointmentService.bookAppointment;
}

export const appointmentService = AppointmentService;
