/**
 * apps/web/src/services/nutritionService.ts
 *
 * Client API service for BioPulse Nutrition & 7-Day Meal Planning endpoints.
 * Uses authenticated Bearer token from Supabase session.
 */

import { supabase } from '../lib/supabase';
import type {
  NutritionPlanSummary,
  NutritionPreferences,
  NutritionReadiness,
  NutritionTargets,
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
  /**
   * Check nutrition readiness for current authenticated user.
   */
  async getReadiness(): Promise<NutritionReadiness> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/readiness/`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to check nutrition readiness (${res.status})`);
    }
    return res.json();
  }

  /**
   * Fetch calculated Phase 5A targets & Phase 5B condition profile.
   */
  async getTargets(): Promise<NutritionTargets> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/targets/`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch nutrition targets (${res.status})`);
    }
    return res.json();
  }

  /**
   * Retrieve current active 7-day meal plan.
   * Returns null if no active plan exists (HTTP 404).
   */
  async getCurrentPlan(): Promise<WeeklyNutritionPlan | null> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/current/`, {
      method: 'GET',
      headers,
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to retrieve current plan (${res.status})`);
    }
    return res.json();
  }

  /**
   * Generate a fresh 7-day meal plan and store immutable snapshot.
   */
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

  /**
   * Regenerate 7-day meal plan, marking old plan inactive.
   */
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

  /**
   * Retrieve historical plan snapshots.
   */
  async getPlanHistory(limit: number = 10): Promise<NutritionPlanSummary[]> {
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

  /**
   * Retrieve specific plan by ID.
   */
  async getPlanById(planId: string): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to retrieve plan ${planId} (${res.status})`);
    }
    return res.json();
  }

  /**
   * Retrieve normalized saved nutrition preferences for current user.
   */
  async getPreferences(): Promise<NutritionPreferences> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/preferences/`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch nutrition preferences (${res.status})`);
    }
    return res.json();
  }

  /**
   * Update and normalize saved nutrition preferences for current user.
   */
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

  /**
   * Lock or unlock a specific meal in a plan.
   */
  async lockMeal(planId: string, dayName: string, mealType: string, isLocked: boolean): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/lock-meal/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan_id: planId,
        day_name: dayName,
        meal_type: mealType,
        is_locked: isLocked,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to lock/unlock meal (${res.status})`);
    }
    return res.json();
  }

  /**
   * Swap a meal with a deterministic, safe alternative.
   */
  async swapMeal(planId: string, dayName: string, mealType: string): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/swap-meal/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan_id: planId,
        day_name: dayName,
        meal_type: mealType,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to swap meal (${res.status})`);
    }
    return res.json();
  }

  /**
   * Regenerate unlocked meals for a single day.
   */
  async regenerateDay(planId: string, dayName: string): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/regenerate-day/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan_id: planId,
        day_name: dayName,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to regenerate day (${res.status})`);
    }
    return res.json();
  }

  /**
   * Update plan status (e.g. Save & Start Plan -> 'active', with custom start_date).
   */
  async updatePlanStatus(planId: string, status: string, startDate?: string): Promise<WeeklyNutritionPlan> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/plan/${planId}/status/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        status,
        start_date: startDate,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update plan status (${res.status})`);
    }
    return res.json();
  }

  /**
   * Fetch historical or today's food logs.
   */
  async fetchFoodLogs(startDate?: string, endDate?: string): Promise<import('../types/nutrition').FoodLogItem[]> {
    const headers = await getAuthHeaders();
    let url = `${NUTRITION_BASE_URL}/food-logs/`;
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch food logs (${res.status})`);
    }
    return res.json();
  }

  /**
   * Log a meal (either from planned meal or custom entry).
   */
  async logFood(foodData: Partial<import('../types/nutrition').FoodLogItem>): Promise<import('../types/nutrition').FoodLogItem> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/food-logs/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(foodData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to log meal (${res.status})`);
    }
    return res.json();
  }

  /**
   * Delete a food log item.
   */
  async deleteFoodLog(logId: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/food-logs/${logId}/`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete food log (${res.status})`);
    }
    return true;
  }

  /**
   * Get user's meal reminder preferences.
   */
  async getReminders(): Promise<import('../types/nutrition').MealReminderSettings> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/reminders/`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch reminders (${res.status})`);
    }
    return res.json();
  }

  /**
   * Update user's meal reminder preferences.
   */
  async updateReminders(settings: import('../types/nutrition').MealReminderSettings): Promise<import('../types/nutrition').MealReminderSettings> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${NUTRITION_BASE_URL}/reminders/`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update reminders (${res.status})`);
    }
    return res.json();
  }
}

export const nutritionService = new NutritionService();

