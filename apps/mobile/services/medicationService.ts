/**
 * BioPulse Mobile — Medication Service
 *
 * Dedicated typed service for:
 * - Active prescription retrieval (public.medications)
 * - Creating, updating, deleting, and disabling medications
 * - Dose tracking & adherence logging (public.medication_logs)
 * - Medication history log retrieval
 *
 * Scoped strictly to authenticated user session.
 */

import { SUPABASE_URL, getSupabaseHeaders, safeRequest, ApiResponse } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'every_other_day'
  | 'as_needed';

export function normalizeFrequency(freq?: string): MedicationFrequency {
  if (!freq) return 'once_daily';
  const lower = freq.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (lower.includes('twice') || lower.includes('2x') || lower.includes('bid')) return 'twice_daily';
  if (lower.includes('three') || lower.includes('3x') || lower.includes('tid')) return 'three_times_daily';
  if (lower.includes('other')) return 'every_other_day';
  if (lower.includes('needed') || lower.includes('prn')) return 'as_needed';
  if (['once_daily', 'twice_daily', 'three_times_daily', 'every_other_day', 'as_needed'].includes(lower)) {
    return lower as MedicationFrequency;
  }
  return 'once_daily';
}

export function formatFrequencyLabel(freq?: string): string {
  const norm = normalizeFrequency(freq);
  switch (norm) {
    case 'once_daily':
      return 'Once daily';
    case 'twice_daily':
      return 'Twice daily';
    case 'three_times_daily':
      return '3 times daily';
    case 'every_other_day':
      return 'Every other day';
    case 'as_needed':
      return 'As needed';
    default:
      return 'Daily';
  }
}

export interface CreateMedicationInput {
  name: string;
  dose: string;
  unit?: string;
  frequency?: string;
  scheduledTimes?: string[];
  startDate?: string;
  endDate?: string | null;
  notes?: string;
  instructions?: string;
  pathway?: 'female' | 'male' | 'all';
}

export interface UpdateMedicationInput {
  name?: string;
  dose?: string;
  unit?: string;
  frequency?: string;
  scheduledTimes?: string[];
  startDate?: string;
  endDate?: string | null;
  notes?: string;
  isActive?: boolean;
}

export interface DoseLogInput {
  medicationId: string;
  status: 'taken' | 'skipped' | 'snoozed' | 'pending';
  scheduledFor?: string;
  scheduledTime?: string;
  takenAt?: string;
  notes?: string;
}

export interface DoseLogEntity {
  id: string;
  medicationId: string;
  medicationName?: string;
  dosage?: string;
  userId: string;
  scheduledFor: string;
  scheduledTime: string;
  takenAt?: string | null;
  status: 'taken' | 'skipped' | 'missed' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface MedicationEntity {
  id: string;
  userId: string;
  name: string;
  dose: string;
  unit: string;
  dosage: string;
  frequency: MedicationFrequency;
  scheduledTimes: string[];
  scheduledTime: string;
  startDate: string;
  endDate?: string | null;
  notes: string;
  instructions: string;
  isActive: boolean;
  status: 'pending' | 'taken' | 'skipped' | 'snoozed';
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// MEDICATION SERVICE CLASS
// ============================================================================

export class MedicationService {
  /**
   * Fetch active medications for the authenticated user
   */
  static async getMedications(
    userId: string,
    token: string
  ): Promise<ApiResponse<MedicationEntity[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medications?user_id=eq.${userId}&is_active=eq.true&order=created_at.desc&select=*`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const items: MedicationEntity[] = (res.data || []).map((m: any) => {
      const times: string[] = Array.isArray(m.scheduled_times) && m.scheduled_times.length > 0
        ? m.scheduled_times
        : ['08:00'];
      const doseStr = m.dose ? `${m.dose} ${m.unit || ''}`.trim() : 'Standard Dose';

      return {
        id: String(m.id),
        userId: String(m.user_id),
        name: m.name,
        dose: m.dose || '',
        unit: m.unit || 'mg',
        dosage: doseStr,
        frequency: normalizeFrequency(m.frequency),
        scheduledTimes: times,
        scheduledTime: times[0] || '08:00',
        startDate: m.start_date || new Date().toISOString().split('T')[0],
        endDate: m.end_date || null,
        notes: m.notes || '',
        instructions: m.notes || 'Take as directed',
        isActive: Boolean(m.is_active),
        status: 'pending',
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
    });

    return { data: items, error: null, status: 200 };
  }

  /**
   * Add a new medication prescription
   */
  static async addMedication(
    userId: string,
    token: string,
    input: CreateMedicationInput
  ): Promise<ApiResponse<MedicationEntity>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const freq = normalizeFrequency(input.frequency);
    const scheduledTimes = input.scheduledTimes && input.scheduledTimes.length > 0
      ? input.scheduledTimes
      : ['08:00'];
    const notes = (input.notes || input.instructions || '').trim();
    const startDate = input.startDate || new Date().toISOString().split('T')[0];

    const payload = {
      user_id: userId,
      name: input.name.trim(),
      dose: (input.dose || '1').trim(),
      unit: (input.unit || 'mg').trim(),
      frequency: freq,
      scheduled_times: scheduledTimes,
      start_date: startDate,
      end_date: input.endDate || null,
      notes,
      is_active: true,
    };

    const url = `${SUPABASE_URL}/rest/v1/medications`;
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
    const times: string[] = Array.isArray(row.scheduled_times) && row.scheduled_times.length > 0
      ? row.scheduled_times
      : scheduledTimes;

    return {
      data: {
        id: String(row.id || 'med_new'),
        userId,
        name: row.name,
        dose: row.dose,
        unit: row.unit,
        dosage: `${row.dose} ${row.unit || ''}`.trim(),
        frequency: normalizeFrequency(row.frequency),
        scheduledTimes: times,
        scheduledTime: times[0] || '08:00',
        startDate: row.start_date,
        endDate: row.end_date || null,
        notes: row.notes || '',
        instructions: row.notes || 'Take as directed',
        isActive: Boolean(row.is_active),
        status: 'pending',
        createdAt: row.created_at || new Date().toISOString(),
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Update an existing medication
   */
  static async updateMedication(
    medicationId: string,
    token: string,
    input: UpdateMedicationInput
  ): Promise<ApiResponse<boolean>> {
    if (!medicationId || !token) {
      return { data: false, error: 'Medication ID and token required.', status: 400 };
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.dose !== undefined) payload.dose = input.dose.trim();
    if (input.unit !== undefined) payload.unit = input.unit.trim();
    if (input.frequency !== undefined) payload.frequency = normalizeFrequency(input.frequency);
    if (input.scheduledTimes !== undefined) payload.scheduled_times = input.scheduledTimes;
    if (input.startDate !== undefined) payload.start_date = input.startDate;
    if (input.endDate !== undefined) payload.end_date = input.endDate;
    if (input.notes !== undefined) payload.notes = input.notes.trim();
    if (input.isActive !== undefined) payload.is_active = input.isActive;

    const url = `${SUPABASE_URL}/rest/v1/medications?id=eq.${medicationId}`;
    const res = await safeRequest(url, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify(payload),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  /**
   * Soft-delete medication by setting is_active = false
   */
  static async removeMedication(
    medicationId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    return this.updateMedication(medicationId, token, { isActive: false });
  }

  /**
   * Hard-delete medication from database
   */
  static async deleteMedication(
    medicationId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    if (!medicationId || !token) {
      return { data: false, error: 'Medication ID and token required.', status: 400 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medications?id=eq.${medicationId}`;
    const res = await safeRequest(url, {
      method: 'DELETE',
      headers: getSupabaseHeaders(token),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  /**
   * Log an adherence dose event (taken or skipped)
   * Note: DB status check constraint accepts ('taken', 'skipped', 'missed', 'pending').
   * If status is 'snoozed', mapped to 'pending' with notes 'Snoozed 30 mins'.
   */
  static async logDose(
    userId: string,
    token: string,
    input: DoseLogInput
  ): Promise<ApiResponse<DoseLogEntity>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    let dbStatus: 'taken' | 'skipped' | 'missed' | 'pending' = 'taken';
    let extraNotes = input.notes || '';
    if (input.status === 'skipped') {
      dbStatus = 'skipped';
    } else if (input.status === 'snoozed') {
      dbStatus = 'pending';
      extraNotes = extraNotes ? `Snoozed 30 mins: ${extraNotes}` : 'Snoozed 30 mins';
    } else if (input.status === 'pending') {
      dbStatus = 'pending';
    }

    const payload = {
      user_id: userId,
      medication_id: input.medicationId,
      scheduled_for: input.scheduledFor || new Date().toISOString().split('T')[0],
      scheduled_time: input.scheduledTime || '08:00',
      status: dbStatus,
      taken_at: dbStatus === 'taken' ? (input.takenAt || new Date().toISOString()) : null,
      notes: extraNotes,
    };

    const url = `${SUPABASE_URL}/rest/v1/medication_logs`;
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
        id: String(row.id || 'log_new'),
        medicationId: row.medication_id,
        userId: row.user_id,
        scheduledFor: row.scheduled_for,
        scheduledTime: row.scheduled_time,
        takenAt: row.taken_at,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at || new Date().toISOString(),
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Get dose adherence logs for a date or general history
   */
  static async getDoseLogs(
    userId: string,
    token: string,
    date?: string
  ): Promise<ApiResponse<DoseLogEntity[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    let url = `${SUPABASE_URL}/rest/v1/medication_logs?user_id=eq.${userId}&order=created_at.desc&limit=30`;
    if (date) {
      url += `&scheduled_for=eq.${date}`;
    }

    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const logs: DoseLogEntity[] = (res.data || []).map((row: any) => ({
      id: String(row.id),
      medicationId: row.medication_id,
      userId: row.user_id,
      scheduledFor: row.scheduled_for,
      scheduledTime: row.scheduled_time,
      takenAt: row.taken_at,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
    }));

    return { data: logs, error: null, status: 200 };
  }

  /**
   * Fetch medication adherence history joined with medication details
   */
  static async getMedicationHistory(
    userId: string,
    token: string,
    limit = 50
  ): Promise<ApiResponse<DoseLogEntity[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medication_logs?user_id=eq.${userId}&select=*,medications(name,dose,unit)&order=created_at.desc&limit=${limit}`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const logs: DoseLogEntity[] = (res.data || []).map((row: any) => {
      const med = row.medications;
      const medName = med?.name || 'Medication';
      const dosage = med ? `${med.dose || ''} ${med.unit || ''}`.trim() : undefined;

      return {
        id: String(row.id),
        medicationId: row.medication_id,
        medicationName: medName,
        dosage,
        userId: row.user_id,
        scheduledFor: row.scheduled_for,
        scheduledTime: row.scheduled_time,
        takenAt: row.taken_at,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
      };
    });

    return { data: logs, error: null, status: 200 };
  }
}

export const medicationService = MedicationService;
