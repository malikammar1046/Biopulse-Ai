import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/onboarding';
import { resolvePathway } from '../types/onboarding';
import { createEmptyUserProfile, DEFAULT_USER_PROFILE } from '../data/mockDashboardData';

export interface DatabaseProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  emergency_contacts: any;
  blood_type: string | null;
  allergies: any;
  medications: any;
  conditions: any;
  surgeries: any;
  family_history: any;
  cycle_length: string | null;
  period_duration: number | null;
  last_period_date: string | null;
  period_regularity: string | null;
  common_symptoms: any;
  dietary_preference: string | null;
  daily_water_glasses: number | null;
  activity_level: string | null;
  exercise_preferences: any;
  sleep_hours: number | null;
  work_lifestyle: string | null;
  selected_goals: any;
  support_preference: string | null;
  gender?: string | null;
  pathway?: string | null;
  waist_cm?: number | null;
  mens_health?: any;
  general_health?: any;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Transforms a Supabase PostgreSQL row into the application UserProfile object.
 */
export function mapDbRowToUserProfile(
  row: Partial<DatabaseProfileRow>,
  fallback?: { id?: string; email?: string; fullName?: string; dateOfBirth?: string; gender?: any; pathway?: any }
): UserProfile {
  const base = createEmptyUserProfile({
    id: row.id || fallback?.id || '',
    email: row.email || fallback?.email || '',
    fullName: row.full_name || fallback?.fullName || '',
    dateOfBirth: row.date_of_birth || fallback?.dateOfBirth || '',
    gender: (row.gender as any) || fallback?.gender,
    pathway: (row.pathway as any) || fallback?.pathway,
    isOnboarded: row.is_onboarded ?? false,
  });

  const parsedCycleLength =
    row.cycle_length === 'irregular'
      ? 'irregular'
      : row.cycle_length && !isNaN(parseInt(row.cycle_length, 10))
      ? parseInt(row.cycle_length, 10)
      : base.womensHealth.cycleLength;

  const resolvedGender = (row.gender as any) || fallback?.gender || base.gender || 'female';
  const resolvedPathway = (row.pathway as any) || fallback?.pathway || resolvePathway(resolvedGender, row.pathway, 'female');

  return {
    id: row.id || base.id,
    fullName: row.full_name ?? base.fullName,
    email: row.email ?? base.email,
    phone: row.phone ?? base.phone,
    dateOfBirth: row.date_of_birth ?? base.dateOfBirth,
    gender: resolvedGender,
    pathway: resolvedPathway,
    avatarUrl: row.avatar_url ?? base.avatarUrl,
    heightCm: row.height_cm ?? base.heightCm,
    weightKg: row.weight_kg ?? base.weightKg,
    waistCm: row.waist_cm ?? base.waistCm,
    isOnboarded: row.is_onboarded ?? false,
    createdAt: row.created_at ?? base.createdAt,
    updatedAt: row.updated_at ?? base.updatedAt,
    emergencyContacts: Array.isArray(row.emergency_contacts)
      ? row.emergency_contacts
      : base.emergencyContacts,
    medical: {
      bloodType: row.blood_type ?? base.medical.bloodType,
      allergies: Array.isArray(row.allergies) ? row.allergies : base.medical.allergies,
      medications: Array.isArray(row.medications) ? row.medications : base.medical.medications,
      conditions: Array.isArray(row.conditions) ? row.conditions : base.medical.conditions,
      surgeries: Array.isArray(row.surgeries) ? row.surgeries : base.medical.surgeries,
      familyHistory: Array.isArray(row.family_history) ? row.family_history : base.medical.familyHistory,
    },
    womensHealth: {
      cycleLength: parsedCycleLength,
      periodDuration: row.period_duration ?? base.womensHealth.periodDuration,
      lastPeriodDate: row.last_period_date ?? base.womensHealth.lastPeriodDate,
      periodRegularity: (row.period_regularity as any) ?? base.womensHealth.periodRegularity,
      commonSymptoms: Array.isArray(row.common_symptoms) ? row.common_symptoms : base.womensHealth.commonSymptoms,
      currentCycleDay: base.womensHealth.currentCycleDay,
      currentPhase: base.womensHealth.currentPhase,
      maritalStatus: (row as any).marital_status ?? base.womensHealth.maritalStatus ?? 'unmarried',
      marriageYears: (row as any).marriage_years ?? base.womensHealth.marriageYears ?? 0,
      isPregnant: (row as any).is_pregnant ?? base.womensHealth.isPregnant ?? false,
      abortionsCount: (row as any).abortions_count ?? base.womensHealth.abortionsCount ?? 0,
    },
    mensHealth: row.mens_health ?? base.mensHealth,
    generalHealth: row.general_health ?? base.generalHealth,
    lifestyle: {
      dietaryPreference: row.dietary_preference ?? base.lifestyle.dietaryPreference,
      dailyWaterGlasses: row.daily_water_glasses ?? base.lifestyle.dailyWaterGlasses,
      activityLevel: (row.activity_level as any) ?? base.lifestyle.activityLevel,
      exercisePreferences: Array.isArray(row.exercise_preferences)
        ? row.exercise_preferences
        : base.lifestyle.exercisePreferences,
      sleepHours: row.sleep_hours ?? base.lifestyle.sleepHours,
      workLifestyle: row.work_lifestyle ?? base.lifestyle.workLifestyle,
      fastFoodIntake: (row as any).fast_food_intake ?? base.lifestyle.fastFoodIntake ?? 'occasional',
      regularExercise: (row as any).regular_exercise ?? base.lifestyle.regularExercise ?? true,
    },
    goals: {
      selectedGoals: Array.isArray(row.selected_goals) ? row.selected_goals : base.goals.selectedGoals,
      supportPreference: (row.support_preference as any) ?? base.goals.supportPreference,
    },
  };
}

/**
 * Maps a camelCase UserProfile object to snake_case for Supabase insertion/updating.
 */
export function mapUserProfileToDbRow(profile: UserProfile, userId: string): Record<string, any> {
  const row: Record<string, any> = {
    id: userId || profile.id,
    full_name: profile.fullName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    date_of_birth: profile.dateOfBirth || null,
    avatar_url: profile.avatarUrl || null,
    height_cm: profile.heightCm ?? null,
    weight_kg: profile.weightKg ?? null,
    emergency_contacts: profile.emergencyContacts || [],
    blood_type: profile.medical?.bloodType || '',
    allergies: profile.medical?.allergies || [],
    medications: profile.medical?.medications || [],
    conditions: profile.medical?.conditions || [],
    surgeries: profile.medical?.surgeries || [],
    family_history: profile.medical?.familyHistory || [],
    cycle_length:
      profile.womensHealth?.cycleLength !== undefined
        ? String(profile.womensHealth.cycleLength)
        : '28',
    period_duration: profile.womensHealth?.periodDuration || 5,
    last_period_date: profile.womensHealth?.lastPeriodDate || null,
    period_regularity: profile.womensHealth?.periodRegularity || 'mostly_regular',
    common_symptoms: profile.womensHealth?.commonSymptoms || [],
    marital_status: profile.womensHealth?.maritalStatus || 'unmarried',
    marriage_years: profile.womensHealth?.marriageYears ?? 0,
    is_pregnant: profile.womensHealth?.isPregnant ?? false,
    abortions_count: profile.womensHealth?.abortionsCount ?? 0,
    dietary_preference: profile.lifestyle?.dietaryPreference || 'Balanced',
    fast_food_intake: profile.lifestyle?.fastFoodIntake || 'occasional',
    regular_exercise: profile.lifestyle?.regularExercise ?? true,
    daily_water_glasses: profile.lifestyle?.dailyWaterGlasses ?? 8,
    activity_level: profile.lifestyle?.activityLevel || 'moderate',
    exercise_preferences: profile.lifestyle?.exercisePreferences || [],
    sleep_hours: profile.lifestyle?.sleepHours ?? 7.5,
    work_lifestyle: profile.lifestyle?.workLifestyle || '',
    selected_goals: profile.goals?.selectedGoals || [],
    support_preference: profile.goals?.supportPreference || 'gentle_nudges',
    is_onboarded: profile.isOnboarded ?? false,
    updated_at: new Date().toISOString(),
  };
  return row;
}

class ProfileService {
  /**
   * Fetches the user profile from Supabase by user ID.
   */
  async fetchUserProfile(
    userId: string,
    fallback?: { id?: string; email?: string; fullName?: string; dateOfBirth?: string; gender?: any; pathway?: any }
  ): Promise<{ profile: UserProfile | null; error?: string }> {
    if (!isSupabaseConfigured()) {
      // Local demo fallback
      try {
        const cached = localStorage.getItem('ovasense_user_profile_v1');
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            profile: {
              ...parsed,
              gender: fallback?.gender || parsed.gender || 'female',
              pathway: fallback?.pathway || parsed.pathway || 'female',
            },
          };
        }
      } catch {
        // ignore
      }
      return { profile: DEFAULT_USER_PROFILE };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { profile: null, error: error.message };
      }

      if (!data) {
        return { profile: null };
      }

      const profile = mapDbRowToUserProfile(data, fallback);
      return { profile };
    } catch (err: any) {
      return { profile: null, error: err?.message || 'Failed to fetch user profile.' };
    }
  }

  /**
   * Upserts the full profile into Supabase.
   */
  async upsertUserProfile(profile: UserProfile, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      try {
        localStorage.setItem('ovasense_user_profile_v1', JSON.stringify(profile));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }

    try {
      // Persist pathway, gender, waist_cm to auth user metadata so it is safely stored
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profile.fullName || '',
            date_of_birth: profile.dateOfBirth || null,
            gender: profile.gender || null,
            pathway: profile.pathway || null,
            waist_cm: profile.waistCm ?? null,
          },
        });
      } catch {
        // Non-blocking if auth user metadata update encounters network issue
      }

      const payload = mapUserProfileToDbRow(profile, userId);
      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save profile to database.' };
    }
  }

  /**
   * Updates partial fields for a user profile in Supabase.
   */
  async updateProfileFields(
    userId: string,
    currentProfile: UserProfile,
    partialData: Partial<UserProfile>
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    const merged: UserProfile = {
      ...currentProfile,
      ...partialData,
      gender: partialData.gender || currentProfile.gender || 'female',
      pathway: partialData.pathway || currentProfile.pathway || 'female',
      medical: partialData.medical ? { ...currentProfile.medical, ...partialData.medical } : currentProfile.medical,
      womensHealth: partialData.womensHealth
        ? { ...currentProfile.womensHealth, ...partialData.womensHealth }
        : currentProfile.womensHealth,
      mensHealth: partialData.mensHealth
        ? { ...currentProfile.mensHealth, ...partialData.mensHealth }
        : currentProfile.mensHealth,
      generalHealth: partialData.generalHealth
        ? { ...currentProfile.generalHealth, ...partialData.generalHealth }
        : currentProfile.generalHealth,
      lifestyle: partialData.lifestyle
        ? { ...currentProfile.lifestyle, ...partialData.lifestyle }
        : currentProfile.lifestyle,
      goals: partialData.goals ? { ...currentProfile.goals, ...partialData.goals } : currentProfile.goals,
      emergencyContacts:
        partialData.emergencyContacts !== undefined
          ? partialData.emergencyContacts
          : currentProfile.emergencyContacts,
      updatedAt: new Date().toISOString(),
    };

    const res = await this.upsertUserProfile(merged, userId);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    return { success: true, profile: merged };
  }
}

export const profileService = new ProfileService();
