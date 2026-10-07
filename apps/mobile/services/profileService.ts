/**
 * BioPulse Mobile — Profile Service
 *
 * Dedicated service for user profile management.
 * Strictly scoped to the authenticated user ID and bearer token from Supabase Auth.
 * Never accepts arbitrary user IDs from the UI.
 */

import { SUPABASE_URL, getSupabaseHeaders, safeRequest, ApiResponse } from './api';
import { HealthPathway } from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface UserProfileEntity {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  pathway: HealthPathway | null;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  bloodType?: string;
  maritalStatus?: string;
  isPregnant?: boolean;
  avatarUrl?: string;
  isOnboarded: boolean;
  emergencyContacts: EmergencyContact[];
  // Clinical lifestyle & cycle baseline
  cycleLength?: string;
  periodDuration?: number;
  lastPeriodDate?: string;
  periodRegularity?: string;
  commonSymptoms?: string[];
  sleepHours?: number;
  fastFoodIntake?: string;
  regularExercise?: boolean;
  activityLevel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  pathway?: HealthPathway | null;
  heightCm?: number;
  weightKg?: number;
  waistCm?: number;
  hipCm?: number;
  bloodType?: string;
  maritalStatus?: string;
  isPregnant?: boolean;
  avatarUrl?: string;
  isOnboarded?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  cycleLength?: string;
  periodDuration?: number;
  lastPeriodDate?: string;
  periodRegularity?: string;
  commonSymptoms?: string[];
  sleepHours?: number;
  fastFoodIntake?: string;
  regularExercise?: boolean;
  activityLevel?: string;
}

// ============================================================================
// HELPER: ROW MAPPER
// ============================================================================

function mapRowToProfile(row: any): UserProfileEntity {
  const emerg = Array.isArray(row.emergency_contacts) && row.emergency_contacts[0]
    ? row.emergency_contacts
    : row.emergency_contact_name
    ? [{ name: row.emergency_contact_name, phone: row.emergency_contact_phone || '', relationship: row.emergency_contact_relationship || '' }]
    : [];

  let age = Number(row.age) || 0;
  if (!age && row.date_of_birth) {
    const b = new Date(row.date_of_birth);
    const now = new Date();
    age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
      age--;
    }
  }

  return {
    id: String(row.id),
    fullName: row.full_name || '',
    email: row.email || '',
    dateOfBirth: row.date_of_birth || '',
    age: Math.max(0, age),
    gender: row.gender || '',
    pathway: (row.pathway as HealthPathway) || null,
    heightCm: Number(row.height_cm) || 0,
    weightKg: Number(row.weight_kg) || 0,
    waistCm: Number(row.waist_cm) || 0,
    hipCm: Number(row.hip_cm) || 0,
    bloodType: row.blood_type || '',
    maritalStatus: row.marital_status || 'Single',
    isPregnant: Boolean(row.is_pregnant),
    avatarUrl: row.avatar_url || '',
    isOnboarded: Boolean(row.is_onboarded),
    emergencyContacts: emerg,
    cycleLength: row.cycle_length || '',
    periodDuration: Number(row.period_duration) || 5,
    lastPeriodDate: row.last_period_date || '',
    periodRegularity: row.period_regularity || 'regular',
    commonSymptoms: Array.isArray(row.common_symptoms) ? row.common_symptoms : [],
    sleepHours: Number(row.sleep_hours) || 7,
    fastFoodIntake: row.fast_food_intake || 'occasionally',
    regularExercise: row.regular_exercise !== null ? Boolean(row.regular_exercise) : true,
    activityLevel: row.activity_level || 'moderate',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// PROFILE SERVICE CLASS
// ============================================================================

export class ProfileService {
  /**
   * Fetch patient profile by authenticated session
   */
  static async getProfile(
    userId: string,
    token: string
  ): Promise<ApiResponse<UserProfileEntity>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error || !res.data) {
      return { data: null, error: res.error || 'Profile not found.', status: res.status };
    }

    if (!Array.isArray(res.data) || res.data.length === 0) {
      return { data: null, error: 'Profile record does not exist.', status: 404 };
    }

    return {
      data: mapRowToProfile(res.data[0]),
      error: null,
      status: 200,
    };
  }

  /**
   * Update profile fields in public.profiles table
   */
  static async updateProfile(
    userId: string,
    token: string,
    updates: UpdateProfileInput
  ): Promise<ApiResponse<UserProfileEntity>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.dateOfBirth !== undefined) payload.date_of_birth = updates.dateOfBirth;
    if (updates.age !== undefined) payload.age = updates.age;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.pathway !== undefined) payload.pathway = updates.pathway;
    if (updates.heightCm !== undefined) payload.height_cm = updates.heightCm;
    if (updates.weightKg !== undefined) payload.weight_kg = updates.weightKg;
    if (updates.waistCm !== undefined) payload.waist_cm = updates.waistCm;
    if (updates.hipCm !== undefined) payload.hip_cm = updates.hipCm;
    if (updates.bloodType !== undefined) payload.blood_type = updates.bloodType;
    if (updates.maritalStatus !== undefined) payload.marital_status = updates.maritalStatus;
    if (updates.isPregnant !== undefined) payload.is_pregnant = updates.isPregnant;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.isOnboarded !== undefined) payload.is_onboarded = updates.isOnboarded;
    if (updates.cycleLength !== undefined) payload.cycle_length = updates.cycleLength;
    if (updates.periodDuration !== undefined) payload.period_duration = updates.periodDuration;
    if (updates.lastPeriodDate !== undefined) payload.last_period_date = updates.lastPeriodDate;
    if (updates.periodRegularity !== undefined) payload.period_regularity = updates.periodRegularity;
    if (updates.commonSymptoms !== undefined) payload.common_symptoms = updates.commonSymptoms;
    if (updates.sleepHours !== undefined) payload.sleep_hours = updates.sleepHours;
    if (updates.fastFoodIntake !== undefined) payload.fast_food_intake = updates.fastFoodIntake;
    if (updates.regularExercise !== undefined) payload.regular_exercise = updates.regularExercise;
    if (updates.activityLevel !== undefined) payload.activity_level = updates.activityLevel;

    if (
      updates.emergencyContactName !== undefined ||
      updates.emergencyContactPhone !== undefined ||
      updates.emergencyContactRelationship !== undefined
    ) {
      payload.emergency_contacts = [
        {
          name: updates.emergencyContactName || '',
          phone: updates.emergencyContactPhone || '',
          relationship: updates.emergencyContactRelationship || '',
        },
      ];
    }

    const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
    const res = await safeRequest<any>(url, {
      method: 'PATCH',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (res.error) {
      return { data: null, error: res.error, status: res.status };
    }

    // Return updated profile representation
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: mapRowToProfile(res.data[0]), error: null, status: 200 };
    }

    // Fallback: fetch refreshed profile
    return this.getProfile(userId, token);
  }

  /**
   * Set user pathway persistently
   */
  static async setPathway(
    userId: string,
    token: string,
    pathway: HealthPathway
  ): Promise<ApiResponse<boolean>> {
    const gender = pathway === 'female_pcos' || pathway === 'female' ? 'female' : 'male';
    const res = await this.updateProfile(userId, token, { pathway, gender });
    return {
      data: !res.error,
      error: res.error,
      status: res.status,
    };
  }

  /**
   * Mark onboarding as completed
   */
  static async completeOnboarding(
    userId: string,
    token: string,
    additionalData?: Partial<UpdateProfileInput>
  ): Promise<ApiResponse<boolean>> {
    const res = await this.updateProfile(userId, token, {
      ...additionalData,
      isOnboarded: true,
    });
    return {
      data: !res.error,
      error: res.error,
      status: res.status,
    };
  }
}

export const profileService = ProfileService;

