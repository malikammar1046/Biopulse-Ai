/**
 * BioPulse Mobile — Tracking Service
 *
 * Reusable, typed service for health tracking domains:
 * - Cycle Tracking (cycle_records)
 * - Symptom Tracking (symptom_records)
 * - Water Tracking (water_logs)
 * - Fitness & Movement Tracking (fitness_logs)
 *
 * All operations are strictly authenticated and scoped by Supabase RLS.
 */

import { SUPABASE_URL, getSupabaseHeaders, safeRequest, ApiResponse } from './api';

// ============================================================================
// CYCLE RECORD TYPES
// ============================================================================

export interface CycleRecord {
  id: string;
  userId: string;
  periodStartDate: string;
  periodEndDate?: string;
  cycleLength: number;
  flow: 'Light' | 'Moderate' | 'Heavy';
  notes?: string;
  createdAt?: string;
}

export interface LogCycleInput {
  periodStartDate: string;
  periodEndDate?: string;
  cycleLength?: number;
  flow?: 'Light' | 'Moderate' | 'Heavy' | string;
  notes?: string;
}

// ============================================================================
// SYMPTOM RECORD TYPES
// ============================================================================

export interface SymptomRecord {
  id: string;
  userId: string;
  symptomType: string;
  category: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  occurredAt: string;
  cycleDay?: number;
  notes?: string;
  createdAt?: string;
}

export interface LogSymptomInput {
  symptomType: string;
  category?: string;
  severity?: 'Mild' | 'Moderate' | 'Severe' | string;
  occurredAt?: string;
  cycleDay?: number;
  notes?: string;
}

// ============================================================================
// WATER LOG TYPES
// ============================================================================

export interface WaterLog {
  id: string;
  userId: string;
  date: string;
  glasses: number;
  targetGlasses: number;
  consumedLiters: number;
  targetLiters: number;
}

// ============================================================================
// FITNESS LOG TYPES
// ============================================================================

export interface FitnessLog {
  id: string;
  userId: string;
  activityType: string;
  activityName: string;
  durationMinutes: number;
  energyLevel?: string;
  occurredAt: string;
  notes?: string;
  createdAt?: string;
}

export interface LogFitnessInput {
  activityType: string;
  activityName: string;
  durationMinutes: number;
  energyLevel?: string;
  occurredAt?: string;
  notes?: string;
}

// ============================================================================
// TRACKING SERVICE CLASS
// ============================================================================

export class TrackingService {
  // --------------------------------------------------------------------------
  // CYCLE RECORDS
  // --------------------------------------------------------------------------

  static async getLatestCycle(
    userId: string,
    token: string
  ): Promise<ApiResponse<CycleRecord | null>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/cycle_records?user_id=eq.${userId}&order=period_start_date.desc&limit=1`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return { data: null, error: null, status: 200 };
    }

    const row = res.data[0];
    return {
      data: {
        id: String(row.id),
        userId: String(row.user_id),
        periodStartDate: row.period_start_date,
        periodEndDate: row.period_end_date,
        cycleLength: Number(row.cycle_length) || 28,
        flow: row.flow === 'heavy' ? 'Heavy' : row.flow === 'light' ? 'Light' : 'Moderate',
        notes: row.notes || '',
        createdAt: row.created_at,
      },
      error: null,
      status: 200,
    };
  }

  static async getCycleHistory(
    userId: string,
    token: string,
    limit = 6
  ): Promise<ApiResponse<CycleRecord[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/cycle_records?user_id=eq.${userId}&order=period_start_date.desc&limit=${limit}`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const records: CycleRecord[] = (res.data || []).map((row: any) => ({
      id: String(row.id),
      userId: String(row.user_id),
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      cycleLength: Number(row.cycle_length) || 28,
      flow: row.flow === 'heavy' ? 'Heavy' : row.flow === 'light' ? 'Light' : 'Moderate',
      notes: row.notes || '',
      createdAt: row.created_at,
    }));

    return { data: records, error: null, status: 200 };
  }

  static async logCycle(
    userId: string,
    token: string,
    input: LogCycleInput
  ): Promise<ApiResponse<CycleRecord>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const payload = {
      user_id: userId,
      period_start_date: input.periodStartDate,
      period_end_date: input.periodEndDate || null,
      cycle_length: input.cycleLength || 28,
      flow: (input.flow || 'moderate').toLowerCase(),
      notes: input.notes || null,
    };

    const url = `${SUPABASE_URL}/rest/v1/cycle_records`;
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
        id: String(row.id || 'new'),
        userId,
        periodStartDate: row.period_start_date,
        periodEndDate: row.period_end_date,
        cycleLength: Number(row.cycle_length) || 28,
        flow: row.flow === 'heavy' ? 'Heavy' : row.flow === 'light' ? 'Light' : 'Moderate',
        notes: row.notes || '',
      },
      error: null,
      status: 201,
    };
  }

  static async deleteCycleRecord(
    recordId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    if (!recordId || !token) {
      return { data: false, error: 'Record ID and token required.', status: 400 };
    }

    const url = `${SUPABASE_URL}/rest/v1/cycle_records?id=eq.${recordId}`;
    const res = await safeRequest(url, {
      method: 'DELETE',
      headers: getSupabaseHeaders(token),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  // --------------------------------------------------------------------------
  // SYMPTOM RECORDS
  // --------------------------------------------------------------------------

  static async getRecentSymptoms(
    userId: string,
    token: string,
    limit = 10
  ): Promise<ApiResponse<SymptomRecord[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/symptom_records?user_id=eq.${userId}&order=occurred_at.desc&limit=${limit}`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const records: SymptomRecord[] = (res.data || []).map((row: any) => ({
      id: String(row.id),
      userId: String(row.user_id),
      symptomType: row.symptom_type,
      category: row.category || 'other',
      severity: row.severity === 'severe' ? 'Severe' : row.severity === 'mild' ? 'Mild' : 'Moderate',
      occurredAt: row.occurred_at,
      cycleDay: row.cycle_day ? Number(row.cycle_day) : undefined,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));

    return { data: records, error: null, status: 200 };
  }

  static async logSymptom(
    userId: string,
    token: string,
    input: LogSymptomInput
  ): Promise<ApiResponse<SymptomRecord>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const payload = {
      user_id: userId,
      symptom_type: input.symptomType,
      category: input.category || 'physical',
      severity: (input.severity || 'mild').toLowerCase(),
      occurred_at: input.occurredAt || new Date().toISOString().split('T')[0],
      cycle_day: input.cycleDay || null,
      notes: input.notes || null,
    };

    const url = `${SUPABASE_URL}/rest/v1/symptom_records`;
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
        id: String(row.id || 'new'),
        userId,
        symptomType: row.symptom_type,
        category: row.category,
        severity: row.severity === 'severe' ? 'Severe' : row.severity === 'mild' ? 'Mild' : 'Moderate',
        occurredAt: row.occurred_at,
        cycleDay: row.cycle_day,
        notes: row.notes,
      },
      error: null,
      status: 201,
    };
  }

  // --------------------------------------------------------------------------
  // WATER LOGS
  // --------------------------------------------------------------------------

  static async getTodayWaterLog(
    userId: string,
    token: string
  ): Promise<ApiResponse<WaterLog | null>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const url = `${SUPABASE_URL}/rest/v1/water_logs?user_id=eq.${userId}&date=eq.${todayStr}&select=*`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return { data: null, error: null, status: 200 };
    }

    const row = res.data[0];
    const glasses = Number(row.glasses) || 0;
    const target = Number(row.target_glasses) || 8;

    return {
      data: {
        id: String(row.id),
        userId,
        date: row.date,
        glasses,
        targetGlasses: target,
        consumedLiters: parseFloat((glasses * 0.25).toFixed(2)),
        targetLiters: parseFloat((target * 0.25).toFixed(2)),
      },
      error: null,
      status: 200,
    };
  }

  static async logWater(
    userId: string,
    token: string,
    glasses: number,
    targetGlasses = 8
  ): Promise<ApiResponse<WaterLog>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const payload = {
      user_id: userId,
      date: todayStr,
      glasses: Math.max(0, glasses),
      target_glasses: targetGlasses,
    };

    // Upsert on (user_id, date)
    const url = `${SUPABASE_URL}/rest/v1/water_logs?on_conflict=user_id,date`;
    const res = await safeRequest<any[]>(url, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const row = Array.isArray(res.data) && res.data[0] ? res.data[0] : payload;
    const finalGlasses = Number(row.glasses) || glasses;
    const finalTarget = Number(row.target_glasses) || targetGlasses;

    return {
      data: {
        id: String(row.id || 'water_log'),
        userId,
        date: todayStr,
        glasses: finalGlasses,
        targetGlasses: finalTarget,
        consumedLiters: parseFloat((finalGlasses * 0.25).toFixed(2)),
        targetLiters: parseFloat((finalTarget * 0.25).toFixed(2)),
      },
      error: null,
      status: 200,
    };
  }

  // --------------------------------------------------------------------------
  // FITNESS & MOVEMENT LOGS
  // --------------------------------------------------------------------------

  static async getTodayFitnessLogs(
    userId: string,
    token: string
  ): Promise<ApiResponse<FitnessLog[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const url = `${SUPABASE_URL}/rest/v1/fitness_logs?user_id=eq.${userId}&occurred_at=eq.${todayStr}&select=*`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const logs: FitnessLog[] = (res.data || []).map((row: any) => ({
      id: String(row.id),
      userId,
      activityType: row.activity_type || 'walking',
      activityName: row.activity_name || 'Walk',
      durationMinutes: Number(row.duration_minutes) || 0,
      energyLevel: row.energy_level || 'Normal',
      occurredAt: row.occurred_at,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));

    return { data: logs, error: null, status: 200 };
  }

  static async logFitness(
    userId: string,
    token: string,
    input: LogFitnessInput
  ): Promise<ApiResponse<FitnessLog>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const payload = {
      user_id: userId,
      activity_type: input.activityType,
      activity_name: input.activityName,
      duration_minutes: input.durationMinutes,
      energy_level: input.energyLevel || null,
      occurred_at: input.occurredAt || new Date().toISOString().split('T')[0],
      notes: input.notes || null,
    };

    const url = `${SUPABASE_URL}/rest/v1/fitness_logs`;
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
        id: String(row.id || 'fitness_log'),
        userId,
        activityType: row.activity_type,
        activityName: row.activity_name,
        durationMinutes: Number(row.duration_minutes) || 0,
        energyLevel: row.energy_level,
        occurredAt: row.occurred_at,
        notes: row.notes,
      },
      error: null,
      status: 201,
    };
  }
}
