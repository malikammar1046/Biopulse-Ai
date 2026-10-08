/**
 * BioPulse Mobile — Medication Service
 *
 * Dedicated typed service for:
 * - Active prescription retrieval (public.medications)
 * - Creating, updating, and disabling medications
 * - Dose tracking & adherence logging (public.medication_logs)
 */

import { SUPABASE_URL, getSupabaseHeaders, safeRequest, ApiResponse } from './api';
import { MedicationItem } from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateMedicationInput {
  name: string;
  dose: string;
  unit?: string;
  form?: 'tablet' | 'capsule' | 'injection' | 'cream' | 'liquid' | string;
  scheduledTimes: string[];
  frequency?: string;
  instructions?: string;
  notes?: string;
  pathway?: 'female' | 'male' | 'all';
}

export interface UpdateMedicationInput extends Partial<CreateMedicationInput> {
  isActive?: boolean;
}

export interface DoseLogInput {
  medicationId: string;
  status: 'taken' | 'skipped';
  scheduledTime?: string;
  takenAt?: string;
  notes?: string;
}

export interface DoseLogEntity {
  id: string;
  medicationId: string;
  userId: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'taken' | 'skipped';
  notes?: string;
  createdAt: string;
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
    token: string,
    pathwayFilter?: 'female' | 'male' | 'all'
  ): Promise<ApiResponse<MedicationItem[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medications?user_id=eq.${userId}&is_active=eq.true&order=created_at.desc&select=*`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const items: MedicationItem[] = (res.data || [])
      .filter((m: any) => {
        if (!pathwayFilter || pathwayFilter === 'all') return true;
        return !m.pathway || m.pathway === 'all' || m.pathway === pathwayFilter;
      })
      .map((m: any) => ({
        id: String(m.id),
        name: m.name,
        dosage: `${m.dose || ''} ${m.unit || ''}`.trim() || 'Standard Dose',
        scheduledTime: Array.isArray(m.scheduled_times) && m.scheduled_times[0] ? m.scheduled_times[0] : '08:00 AM',
        instructions: m.instructions || m.notes || 'Take with water after meals',
        status: 'pending',
        pathway: (m.pathway as any) || 'all',
      }));

    return { data: items, error: null, status: 200 };
  }

  /**
   * Add a new medication prescription
   */
  static async addMedication(
    userId: string,
    token: string,
    input: CreateMedicationInput
  ): Promise<ApiResponse<MedicationItem>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const payload = {
      user_id: userId,
      name: input.name,
      dose: input.dose,
      unit: input.unit || 'mg',
      form: input.form || 'tablet',
      scheduled_times: input.scheduledTimes.length > 0 ? input.scheduledTimes : ['08:00 AM'],
      frequency: input.frequency || 'Daily',
      instructions: input.instructions || null,
      notes: input.notes || null,
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
    return {
      data: {
        id: String(row.id || 'med_new'),
        name: row.name,
        dosage: `${row.dose} ${row.unit || ''}`.trim(),
        scheduledTime: Array.isArray(row.scheduled_times) && row.scheduled_times[0] ? row.scheduled_times[0] : '08:00 AM',
        instructions: row.instructions || '',
        status: 'pending',
        pathway: (input.pathway as any) || 'all',
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

    const payload: Record<string, any> = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.dose !== undefined) payload.dose = input.dose;
    if (input.unit !== undefined) payload.unit = input.unit;
    if (input.scheduledTimes !== undefined) payload.scheduled_times = input.scheduledTimes;
    if (input.instructions !== undefined) payload.instructions = input.instructions;
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
   * Log an adherence dose event (taken or skipped)
   */
  static async logDose(
    userId: string,
    token: string,
    input: DoseLogInput
  ): Promise<ApiResponse<DoseLogEntity>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const payload = {
      user_id: userId,
      medication_id: input.medicationId,
      status: input.status,
      scheduled_time: input.scheduledTime || '08:00 AM',
      taken_at: input.takenAt || new Date().toISOString(),
      notes: input.notes || null,
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
   * Get dose adherence logs for a date
   */
  static async getDoseLogs(
    userId: string,
    token: string,
    date?: string
  ): Promise<ApiResponse<DoseLogEntity[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    let url = `${SUPABASE_URL}/rest/v1/medication_logs?user_id=eq.${userId}&order=created_at.desc&limit=20`;
    if (date) {
      url += `&taken_at=gte.${date}T00:00:00Z&taken_at=lte.${date}T23:59:59Z`;
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
      scheduledTime: row.scheduled_time,
      takenAt: row.taken_at,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
    }));

    return { data: logs, error: null, status: 200 };
  }
}

export const medicationService = MedicationService;

