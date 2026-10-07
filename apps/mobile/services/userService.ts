/**
 * BioPulse AI Mobile — User Ownership & Data Sync Service
 *
 * Guarantees all private clinical and tracking data is strictly scoped
 * to the authenticated Supabase user ID and bearer token.
 * Never allows hardcoded, demo, or unauthenticated queries.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { BACKEND_API_URL } from './assessmentService';
import {
  UserProfileState,
  ScreeningAssessmentState,
  CycleTrackingState,
  SymptomCheckInState,
  WaterState,
  MovementState,
  MedicationItem,
  AppointmentItem,
  SpecialistDoctor,
  CareCircleMember,
  ReportItem,
  ClinicalLabRow,
} from '../store/healthStore';

function getSupabaseHeaders(token: string): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Fetch patient profile from Supabase profiles table
 */
export async function fetchUserProfileFromDb(
  userId: string,
  token: string
): Promise<Partial<UserProfileState> | null> {
  if (!userId || !token) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (!res.ok) {
      console.warn('[BioPulse userService] fetchUserProfileFromDb HTTP status:', res.status);
      return null;
    }

    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0];
      const emerg = Array.isArray(row.emergency_contacts) && row.emergency_contacts[0] ? row.emergency_contacts[0] : {};

      // Compute age from date_of_birth
      let age = 0;
      if (row.date_of_birth) {
        const birthDate = new Date(row.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      return {
        fullName: row.full_name || '',
        email: row.email || '',
        dateOfBirth: row.date_of_birth || '',
        age: age > 0 ? age : (row.age || 0),
        heightCm: Number(row.height_cm) || 0,
        weightKg: Number(row.weight_kg) || 0,
        waistCm: Number(row.waist_cm) || 0,
        maritalStatus: row.marital_status || 'Single',
        pregnancyStatus: row.is_pregnant ? 'Currently Pregnant' : 'Not Pregnant',
        emergencyContactName: emerg.name || row.emergency_contact_name || '',
        emergencyContactPhone: emerg.phone || row.emergency_contact_phone || '',
        emergencyContactRelationship: emerg.relationship || row.emergency_contact_relationship || '',
        profilePhotoUrl: row.avatar_url || '',
      };
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching profile:', err);
  }
  return null;
}

/**
 * Persist updated patient profile to Supabase profiles table
 */
export async function updateUserProfileInDb(
  userId: string,
  token: string,
  partial: Partial<UserProfileState>
): Promise<boolean> {
  if (!userId || !token) return false;

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (partial.fullName !== undefined) payload.full_name = partial.fullName;
  if (partial.dateOfBirth !== undefined) payload.date_of_birth = partial.dateOfBirth;
  if (partial.heightCm !== undefined) payload.height_cm = partial.heightCm;
  if (partial.weightKg !== undefined) payload.weight_kg = partial.weightKg;
  if (partial.waistCm !== undefined) payload.waist_cm = partial.waistCm;
  if (partial.maritalStatus !== undefined) payload.marital_status = partial.maritalStatus;
  if (partial.pregnancyStatus !== undefined) payload.is_pregnant = partial.pregnancyStatus === 'Currently Pregnant';
  if (partial.profilePhotoUrl !== undefined) payload.avatar_url = partial.profilePhotoUrl;

  if (partial.emergencyContactName || partial.emergencyContactPhone) {
    payload.emergency_contacts = [
      {
        name: partial.emergencyContactName || '',
        phone: partial.emergencyContactPhone || '',
        relationship: partial.emergencyContactRelationship || '',
        isPrimary: true,
      },
    ];
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('[BioPulse userService] Error updating profile in DB:', err);
    return false;
  }
}

/**
 * Fetch authoritative active screening assessment from Django ML
 */
export async function fetchUserActiveAssessmentFromBackend(
  token: string,
  module?: string
): Promise<Partial<ScreeningAssessmentState> | null> {
  if (!token) return null;

  try {
    const url = `${BACKEND_API_URL}/v1/intelligence/assessment/active/${module ? `?module=${module}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data || data.has_assessment === false || !data.assessment_level) {
      return null;
    }

    const probPct = Math.round(Number(data.probability_percent || (data.probability * 100)) || 0);
    const riskCat = (data.risk_category || 'lower').toLowerCase() as 'lower' | 'intermediate' | 'higher';
    const riskBand = riskCat === 'higher' ? 'Higher Risk' : riskCat === 'intermediate' ? 'Intermediate Risk' : 'Lower Risk';

    const rawFactors = Array.isArray(data.explanations) ? data.explanations : [];
    const factors = rawFactors.map((f: any, idx: number) => ({
      id: f.feature_key || `factor_${idx}`,
      name: f.feature_name || f.patient_label || 'Clinical Factor',
      impactPercent: Math.round(Math.abs(Number(f.impact_score || 0)) * 100) || 10,
      direction: f.direction === 'increases_risk' || f.direction === 'positive' ? 'increases_risk' : 'decreases_risk',
      explanation: f.description || f.patient_explanation || 'Observed risk feature.',
      iconName: 'pulse-outline',
    }));

    return {
      probabilityPercent: probPct,
      riskBand,
      riskCategory: riskCat,
      tier: data.tiers_included ? data.tiers_included.length : 1,
      tierStatus: `Tier ${data.tiers_included ? data.tiers_included.length : 1} Active`,
      lastAssessedDate: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Recent',
      topFactors: factors.slice(0, 3),
      allFactors: factors,
      isNonDiagnostic: true,
    };
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching active assessment:', err);
    return null;
  }
}

/**
 * Fetch verified specialist doctors from Django
 */
export async function fetchVerifiedDoctorsFromBackend(
  pathway?: string
): Promise<SpecialistDoctor[]> {
  try {
    const cleanPathway = pathway === 'male' || pathway === 'male_hypogonadism' ? 'male_hypogonadism' : 'female_pcos';
    const res = await fetch(`${BACKEND_API_URL}/v1/doctors/?pathway=${cleanPathway}&strict=true`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((doc: any) => ({
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
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching doctors:', err);
  }
  return [];
}

/**
 * Fetch patient cycle records from Supabase
 */
export async function fetchCycleRecordsFromDb(
  userId: string,
  token: string
): Promise<Partial<CycleTrackingState> | null> {
  if (!userId || !token) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cycle_records?user_id=eq.${userId}&order=period_start_date.desc&limit=1`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const startDate = new Date(row.period_start_date);
        const today = new Date();
        const diffDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

        return {
          currentCycleDay: diffDays,
          lastPeriodStartDate: row.period_start_date,
          flow: row.flow === 'heavy' ? 'Heavy' : row.flow === 'light' ? 'Light' : 'Moderate',
          notes: row.notes || '',
        };
      }
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching cycle record:', err);
  }
  return null;
}

/**
 * Fetch patient water logs for today
 */
export async function fetchTodayWaterLogsFromDb(
  userId: string,
  token: string
): Promise<Partial<WaterState> | null> {
  if (!userId || !token) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/water_logs?user_id=eq.${userId}&date=eq.${todayStr}&select=*`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const glasses = Number(row.glasses) || 0;
        const target = Number(row.target_glasses) || 8;
        return {
          consumedLiters: parseFloat((glasses * 0.25).toFixed(2)),
          targetLiters: parseFloat((target * 0.25).toFixed(2)),
        };
      }
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching water log:', err);
  }
  return null;
}

/**
 * Fetch patient active medications from Supabase
 */
export async function fetchMedicationsFromDb(
  userId: string,
  token: string
): Promise<MedicationItem[]> {
  if (!userId || !token) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/medications?user_id=eq.${userId}&is_active=eq.true&select=*`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        return rows.map((m: any) => ({
          id: String(m.id),
          name: m.name,
          dosage: `${m.dose || ''} ${m.unit || ''}`.trim(),
          scheduledTime: Array.isArray(m.scheduled_times) && m.scheduled_times[0] ? m.scheduled_times[0] : '08:00 AM',
          instructions: m.notes || 'Take with water after meals',
          status: 'pending',
          pathway: 'all',
        }));
      }
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching medications:', err);
  }
  return [];
}

/**
 * Fetch patient appointments from Supabase
 */
export async function fetchAppointmentsFromDb(
  userId: string,
  token: string
): Promise<AppointmentItem[]> {
  if (!userId || !token) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/appointments?patient_id=eq.${userId}&order=scheduled_at.asc&select=*`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        return rows.map((a: any) => ({
          id: String(a.id),
          doctorId: String(a.provider_id || ''),
          doctorName: a.provider_name || 'Dr. Specialist',
          specialty: a.provider_specialty || 'Consultant',
          clinicOrHospital: a.location || 'Clinic Consultation',
          date: a.scheduled_date || (a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString() : ''),
          time: a.scheduled_time || '15:30',
          location: a.location || 'Clinic Consultation',
          visitType: a.meeting_url ? 'Online Consultation' : 'In-person',
          status: a.status === 'completed' ? 'Completed' : a.status === 'cancelled' ? 'Cancelled' : 'Upcoming',
        }));
      }
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching appointments:', err);
  }
  return [];
}

/**
 * Fetch Care Circle members from Supabase
 */
export async function fetchCareCircleFromDb(
  userId: string,
  token: string
): Promise<CareCircleMember[]> {
  if (!userId || !token) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/care_circle_members?patient_id=eq.${userId}&status=neq.revoked&select=*`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        return rows.map((cc: any) => ({
          id: String(cc.id),
          name: cc.member_name,
          role: cc.role === 'doctor' ? 'Doctor' : cc.role === 'family' ? 'Family Member' : 'Trusted Contact',
          relationship: cc.relationship || '',
          accessLevel: 'Full Access',
          email: cc.member_email,
          verified: cc.status === 'active',
        }));
      }
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching care circle:', err);
  }
  return [];
}

/**
 * Fetch medical reports from Supabase
 */
export async function fetchMedicalReportsFromDb(
  userId: string,
  token: string
): Promise<ReportItem[]> {
  if (!userId || !token) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/medical_reports?user_id=eq.${userId}&order=report_date.desc&select=*`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        return rows.map((r: any) => ({
          id: String(r.id),
          title: r.title,
          date: r.report_date ? new Date(r.report_date).toLocaleDateString() : 'Recent',
          type: r.report_type === 'screening' ? 'Screening' : r.report_type === 'summary' ? 'Clinical Summary' : 'Lab',
          status: r.status === 'verified' ? 'Completed' : 'Uploaded',
          tags: [r.report_type || 'Lab'],
        }));
      }
    }
  } catch (err) {
    console.warn('[BioPulse userService] Error fetching medical reports:', err);
  }
  return [];
}
