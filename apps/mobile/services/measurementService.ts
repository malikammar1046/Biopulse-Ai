/**
 * BioPulse Mobile — Measurement Service
 *
 * Dedicated service for:
 * - Patient metric observations (public.patient_metric_observations)
 * - Authoritative BMI computation without duplicate/diverging math
 * - Profile measurement synchronization (public.profiles)
 *
 * Scoped strictly to authenticated user session.
 */

import { SUPABASE_URL, getSupabaseHeaders, safeRequest, ApiResponse } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type MetricKey = 'weight_kg' | 'height_cm' | 'waist_circumference' | 'bmi' | string;

export interface MetricObservation {
  id: string;
  userId: string;
  module: string;
  metricKey: MetricKey;
  value: number;
  unit: string;
  observedAt: string;
  source: string;
  sourceRecordId?: string | null;
  createdAt?: string;
}

export interface LogObservationInput {
  metricKey: MetricKey;
  value: number;
  unit?: string;
  module?: string;
  observedAt?: string;
  source?: string;
  sourceRecordId?: string | null;
}

export interface MeasurementSetInput {
  weightKg?: number;
  heightCm?: number;
  waistCm?: number;
  observedAt?: string;
  source?: string;
  module?: string;
}

// ============================================================================
// AUTHORITATIVE CALCULATION HELPERS
// ============================================================================

/**
 * Authoritative BMI calculation matching backend:
 * BMI = weight_kg / (height_m ^ 2) rounded to 1 decimal place.
 */
export function calculateAuthoritativeBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBmiCategory(bmi: number): string {
  if (bmi <= 0) return 'Not recorded';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// ============================================================================
// MEASUREMENT SERVICE CLASS
// ============================================================================

export class MeasurementService {
  /**
   * Log an individual metric observation into public.patient_metric_observations
   */
  static async logObservation(
    userId: string,
    token: string,
    input: LogObservationInput
  ): Promise<ApiResponse<MetricObservation>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const defaultUnits: Record<string, string> = {
      weight_kg: 'kg',
      height_cm: 'cm',
      waist_circumference: 'cm',
      bmi: 'kg/m²',
    };

    const payload = {
      user_id: userId,
      module: input.module || 'shared',
      metric_key: input.metricKey,
      value: input.value,
      unit: input.unit || defaultUnits[input.metricKey] || '',
      observed_at: input.observedAt || new Date().toISOString(),
      source: input.source || 'user_entry',
      source_record_id: input.sourceRecordId || null,
    };

    const url = `${SUPABASE_URL}/rest/v1/patient_metric_observations`;
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
        id: String(row.id || 'obs_new'),
        userId: row.user_id,
        module: row.module,
        metricKey: row.metric_key,
        value: Number(row.value),
        unit: row.unit,
        observedAt: row.observed_at,
        source: row.source,
        sourceRecordId: row.source_record_id,
        createdAt: row.created_at || new Date().toISOString(),
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Log a set of measurements (e.g. weight, height, waist),
   * authoritatively computes BMI if possible, and synchronizes public.profiles.
   */
  static async logMeasurementSet(
    userId: string,
    token: string,
    input: MeasurementSetInput
  ): Promise<ApiResponse<{ observations: MetricObservation[]; bmi?: number }>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const observedAt = input.observedAt || new Date().toISOString();
    const source = input.source || 'user_entry';
    const moduleName = input.module || 'measurements';

    const observations: MetricObservation[] = [];

    // 1. Insert individual metric observations
    if (input.weightKg !== undefined && input.weightKg > 0) {
      const wRes = await this.logObservation(userId, token, {
        metricKey: 'weight_kg',
        value: input.weightKg,
        unit: 'kg',
        module: moduleName,
        observedAt,
        source,
      });
      if (wRes.data) observations.push(wRes.data);
    }

    if (input.heightCm !== undefined && input.heightCm > 0) {
      const hRes = await this.logObservation(userId, token, {
        metricKey: 'height_cm',
        value: input.heightCm,
        unit: 'cm',
        module: moduleName,
        observedAt,
        source,
      });
      if (hRes.data) observations.push(hRes.data);
    }

    if (input.waistCm !== undefined && input.waistCm > 0) {
      const waistRes = await this.logObservation(userId, token, {
        metricKey: 'waist_circumference',
        value: input.waistCm,
        unit: 'cm',
        module: moduleName,
        observedAt,
        source,
      });
      if (waistRes.data) observations.push(waistRes.data);
    }

    // 2. Authoritative BMI calculation
    let calculatedBmi: number | undefined;
    if (input.weightKg && input.heightCm) {
      calculatedBmi = calculateAuthoritativeBmi(input.weightKg, input.heightCm);
      if (calculatedBmi > 0) {
        const bmiRes = await this.logObservation(userId, token, {
          metricKey: 'bmi',
          value: calculatedBmi,
          unit: 'kg/m²',
          module: moduleName,
          observedAt,
          source: 'authoritative_calculation',
        });
        if (bmiRes.data) observations.push(bmiRes.data);
      }
    }

    // 3. Synchronize public.profiles table
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.weightKg !== undefined && input.weightKg > 0) profileUpdates.weight_kg = input.weightKg;
    if (input.heightCm !== undefined && input.heightCm > 0) profileUpdates.height_cm = input.heightCm;
    if (input.waistCm !== undefined && input.waistCm > 0) profileUpdates.waist_cm = input.waistCm;

    if (Object.keys(profileUpdates).length > 1) {
      await safeRequest(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: getSupabaseHeaders(token),
        body: JSON.stringify(profileUpdates),
      });
    }

    return {
      data: { observations, bmi: calculatedBmi },
      error: null,
      status: 200,
    };
  }

  /**
   * Fetch historical observations for time-series charts
   */
  static async getObservations(
    userId: string,
    token: string,
    metricKey?: MetricKey,
    limit = 30
  ): Promise<ApiResponse<MetricObservation[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    let url = `${SUPABASE_URL}/rest/v1/patient_metric_observations?user_id=eq.${userId}&order=observed_at.desc&limit=${limit}&select=*`;
    if (metricKey) {
      url += `&metric_key=eq.${metricKey}`;
    }

    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const observations: MetricObservation[] = (res.data || []).map((row: any) => ({
      id: String(row.id),
      userId: row.user_id,
      module: row.module,
      metricKey: row.metric_key,
      value: Number(row.value),
      unit: row.unit,
      observedAt: row.observed_at,
      source: row.source,
      sourceRecordId: row.source_record_id,
      createdAt: row.created_at,
    }));

    return { data: observations, error: null, status: 200 };
  }

  /**
   * Delete a metric observation
   */
  static async deleteObservation(
    observationId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    if (!observationId || !token) {
      return { data: false, error: 'Observation ID and token required.', status: 400 };
    }

    const url = `${SUPABASE_URL}/rest/v1/patient_metric_observations?id=eq.${observationId}`;
    const res = await safeRequest(url, {
      method: 'DELETE',
      headers: getSupabaseHeaders(token),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }
}

export const measurementService = MeasurementService;
