/**
 * apps/web/src/services/nutritionService.ts
 *
 * Client API service for BioPulse Nutrition & 7-Day Meal Planning endpoints.
 * Uses authenticated Bearer token from Supabase session.
 */

import { supabase } from '../lib/supabase';
import type {
  FoodLogEntry,
  NutritionPlanSummary,
  NutritionPreferences,
  NutritionReadiness,
  NutritionReminderPreferences,
  NutritionTargets,
  PlanAdherenceSummary,
  WeeklyNutritionPlan,
} from '../types/nutrition';

const BACKEND_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_BACKEND_API_URL) ||
  'http://127.0.0.1:8000/api';

const NUTRITION_BASE_URL = `${BACKEND_API_URL}/v1/health/nutrition`;

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

class NutritionService {
  // ─── Readiness ───────────────────────────────────────────────────────────────

  async getReadiness(): Promise<NutritionReadiness> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/readiness/`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to check nutrition readiness (${res.status})`);
    }
    return res.json();
  }

  // ─── Targets ─────────────────────────────────────────────────────────────────

  async getTargets(): Promise<NutritionTargets> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/targets/`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch nutrition targets (${res.status})`);
    }
    return res.json();
  }

  // ─── Plan Management ─────────────────────────────────────────────────────────

  async getCurrentPlan(): Promise<WeeklyNutritionPlan | null> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/current/`, { method: 'GET', headers });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to retrieve current plan (${res.status})`);
    }
    return res.json();
  }

  async generateWeeklyPlan(): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/weekly/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to generate weekly meal plan (${res.status})`);
    }
    return res.json();
  }

  async regeneratePlan(): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/regenerate/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to regenerate meal plan (${res.status})`);
    }
    return res.json();
  }

  async getPlanHistory(limit = 10): Promise<NutritionPlanSummary[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/history/?limit=${limit}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to retrieve plan history (${res.status})`);
    }
    return res.json();
  }

  async getPlanById(planId: string): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to retrieve plan ${planId} (${res.status})`);
    }
    return res.json();
  }

  async activatePlan(planId: string): Promise<{ message: string; plan_id: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/activate/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to activate plan (${res.status})`);
    }
    return res.json();
  }

  async lockMeal(
    planId: string,
    dayIndex: number,
    mealRole: string,
    locked: boolean
  ): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/lock/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ day_index: dayIndex, meal_role: mealRole, locked }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update meal lock (${res.status})`);
    }
  }

  async swapMeal(
    planId: string,
    dayIndex: number,
    mealRole: string,
    customDish?: string
  ): Promise<{ message: string; swapped_meal: any; plan_data: any }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/swap/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ day_index: dayIndex, meal_role: mealRole, custom_dish: customDish }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to swap meal (${res.status})`);
    }
    return res.json();
  }

  async regenerateDay(
    planId: string,
    dayIndex: number
  ): Promise<{ message: string; day: any; plan_data: any }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/regenerate-day/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ day_index: dayIndex }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to regenerate day (${res.status})`);
    }
    return res.json();
  }

  async modifyPlanByAI(
    planId: string,
    prompt: string
  ): Promise<{ message: string; modifications: string[]; plan_data: any }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/modify/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to modify plan (${res.status})`);
    }
    return res.json();
  }


  // ─── Preferences ─────────────────────────────────────────────────────────────

  async getPreferences(): Promise<NutritionPreferences> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/preferences/`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch nutrition preferences (${res.status})`);
    }
    return res.json();
  }

  async updatePreferences(preferences: Partial<NutritionPreferences>): Promise<NutritionPreferences> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/preferences/`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(preferences),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update nutrition preferences (${res.status})`);
    }
    return res.json();
  }

  // ─── Food Logging ─────────────────────────────────────────────────────────────

  async logMeal(entry: Omit<FoodLogEntry, 'id' | 'user_id'>): Promise<FoodLogEntry> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/log/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to log meal (${res.status})`);
    }
    return res.json();
  }

  async getMealLogs(date?: string, limit = 50): Promise<{ entries: FoodLogEntry[]; count: number }> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ limit: String(limit) });
    if (date) params.append('date', date);
    const res = await fetch(`${NUTRITION_BASE_URL}/log/?${params}`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch meal logs (${res.status})`);
    }
    return res.json();
  }

  /** Mark a planned meal as eaten — creates a food log entry from plan data */
  async markMealAsEaten(entry: {
    meal_type: string;
    food_name: string;
    plan_id: string;
    day_index: number;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    portion_description?: string;
  }): Promise<FoodLogEntry> {
    return this.logMeal({
      ...entry,
      logged_at: new Date().toISOString(),
    } as Omit<FoodLogEntry, 'id' | 'user_id'>);
  }

  // ─── Adherence ────────────────────────────────────────────────────────────────

  async getAdherence(): Promise<{
    today: PlanAdherenceSummary;
    week: PlanAdherenceSummary & { days_engaged: number; days_total: number };
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/adherence/`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch adherence (${res.status})`);
    }
    return res.json();
  }

  // ─── Reminders ───────────────────────────────────────────────────────────────

  async getReminders(): Promise<NutritionReminderPreferences> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/reminders/`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch reminders (${res.status})`);
    }
    return res.json();
  }

  async updateReminders(prefs: NutritionReminderPreferences): Promise<NutritionReminderPreferences> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/reminders/`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(prefs),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update reminders (${res.status})`);
    }
    return res.json();
  }
}

export const nutritionService = new NutritionService();
