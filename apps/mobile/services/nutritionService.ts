/**
 * BioPulse Mobile — Nutrition Service
 *
 * Dedicated typed service connecting:
 * 1. Supabase public.nutrition_food_logs (STRICT: never legacy food_logs)
 * 2. Django Nutrition Engine (/api/v1/health/nutrition/):
 *    - Nutrition targets
 *    - Meal plans & recommendations
 *    - Meal swaps
 *    - Day regeneration
 */

import { SUPABASE_URL, BACKEND_API_URL, getSupabaseHeaders, getDjangoHeaders, safeRequest, ApiResponse } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface NutritionTargets {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterLiters: number;
  recommendedCuisine: 'South Asian' | 'Vegetarian' | 'Low-cost' | string;
}

export interface MealItemEntity {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  portion: string;
  cuisine: string;
  instructions?: string;
  imageUrl?: string;
}

export interface NutritionPlan {
  id: string;
  title: string;
  dietaryPreference: string;
  calorieTarget: number;
  status: 'active' | 'completed' | 'draft';
  days: {
    dayIndex: number;
    dayName: string;
    meals: MealItemEntity[];
  }[];
}

export interface NutritionFoodLog {
  id: string;
  userId: string;
  mealType: string;
  foodName: string;
  portionDescription: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
  notes?: string;
}

export interface LogFoodInput {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  portionDescription?: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  planId?: string;
  planMealId?: string;
  loggedAt?: string;
  notes?: string;
}

export interface SwapMealInput {
  planId: string;
  dayIndex: number;
  mealType: string;
  currentMealId: string;
}

export interface RegenerateDayInput {
  planId: string;
  dayIndex: number;
}

// ============================================================================
// NUTRITION SERVICE CLASS
// ============================================================================

export class NutritionService {
  /**
   * Fetch nutritional targets from Django backend
   */
  static async getNutritionTargets(token: string): Promise<ApiResponse<NutritionTargets>> {
    const url = `${BACKEND_API_URL}/v1/health/nutrition/targets/`;
    const res = await safeRequest<any>(url, {
      method: 'GET',
      headers: getDjangoHeaders(token),
    });

    if (res.data) {
      const d = res.data;
      return {
        data: {
          dailyCalories: Number(d.daily_calories || d.calorie_target) || 1800,
          proteinGrams: Number(d.protein_grams || d.protein_g) || 85,
          carbsGrams: Number(d.carbs_grams || d.carbs_g) || 180,
          fatGrams: Number(d.fat_grams || d.fat_g) || 55,
          waterLiters: Number(d.water_liters) || 2.5,
          recommendedCuisine: d.recommended_cuisine || 'South Asian',
        },
        error: null,
        status: res.status,
      };
    }

    // Default clinical targets if backend has not configured custom plan
    return {
      data: {
        dailyCalories: 1800,
        proteinGrams: 85,
        carbsGrams: 180,
        fatGrams: 55,
        waterLiters: 2.5,
        recommendedCuisine: 'South Asian',
      },
      error: null,
      status: 200,
    };
  }

  /**
   * Fetch active meal plan
   */
  static async getCurrentMealPlan(token: string): Promise<ApiResponse<NutritionPlan | null>> {
    const url = `${BACKEND_API_URL}/v1/health/nutrition/plan/current/`;
    const res = await safeRequest<any>(url, {
      method: 'GET',
      headers: getDjangoHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };
    if (!res.data || !res.data.id) return { data: null, error: null, status: 200 };

    const plan = res.data;
    return {
      data: {
        id: String(plan.id),
        title: plan.title || 'Personalized Endocrine Nutrition Plan',
        dietaryPreference: plan.dietary_preference || 'South Asian',
        calorieTarget: Number(plan.calorie_target) || 1800,
        status: plan.status || 'active',
        days: Array.isArray(plan.days) ? plan.days : [],
      },
      error: null,
      status: 200,
    };
  }

  /**
   * Swap a meal in the current plan for an alternative
   */
  static async swapMeal(
    token: string,
    input: SwapMealInput
  ): Promise<ApiResponse<MealItemEntity>> {
    const url = `${BACKEND_API_URL}/v1/health/nutrition/plan/swap-meal/`;
    const res = await safeRequest<any>(url, {
      method: 'POST',
      headers: getDjangoHeaders(token),
      body: JSON.stringify({
        plan_id: input.planId,
        day_index: input.dayIndex,
        meal_type: input.mealType,
        current_meal_id: input.currentMealId,
      }),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };
    return { data: res.data, error: null, status: 200 };
  }

  /**
   * Regenerate meals for an entire day
   */
  static async regenerateDay(
    token: string,
    input: RegenerateDayInput
  ): Promise<ApiResponse<NutritionPlan>> {
    const url = `${BACKEND_API_URL}/v1/health/nutrition/plan/regenerate-day/`;
    const res = await safeRequest<any>(url, {
      method: 'POST',
      headers: getDjangoHeaders(token),
      body: JSON.stringify({
        plan_id: input.planId,
        day_index: input.dayIndex,
      }),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };
    return { data: res.data, error: null, status: 200 };
  }

  // --------------------------------------------------------------------------
  // FOOD LOGS (STRICTLY public.nutrition_food_logs)
  // --------------------------------------------------------------------------

  /**
   * Fetch today's food logs from public.nutrition_food_logs
   */
  static async getTodayFoodLogs(
    userId: string,
    token: string
  ): Promise<ApiResponse<NutritionFoodLog[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const url = `${SUPABASE_URL}/rest/v1/nutrition_food_logs?user_id=eq.${userId}&logged_at=gte.${todayStr}T00:00:00Z&logged_at=lte.${todayStr}T23:59:59Z&order=logged_at.desc&select=*`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const logs: NutritionFoodLog[] = (res.data || []).map((row: any) => ({
      id: String(row.id),
      userId: String(row.user_id),
      mealType: row.meal_type,
      foodName: row.food_name,
      portionDescription: row.portion_description || '1 serving',
      calories: Number(row.calories) || 0,
      proteinG: Number(row.protein_g) || 0,
      carbsG: Number(row.carbs_g) || 0,
      fatG: Number(row.fat_g) || 0,
      loggedAt: row.logged_at,
      notes: row.notes || '',
    }));

    return { data: logs, error: null, status: 200 };
  }

  /**
   * Log food consumption to public.nutrition_food_logs
   */
  static async logFood(
    userId: string,
    token: string,
    input: LogFoodInput
  ): Promise<ApiResponse<NutritionFoodLog>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const payload = {
      user_id: userId,
      meal_type: input.mealType,
      food_name: input.foodName,
      portion_description: input.portionDescription || '1 serving',
      calories: input.calories,
      protein_g: input.proteinG || 0,
      carbs_g: input.carbsG || 0,
      fat_g: input.fatG || 0,
      plan_id: input.planId || null,
      plan_meal_id: input.planMealId || null,
      logged_at: input.loggedAt || new Date().toISOString(),
      notes: input.notes || null,
    };

    const url = `${SUPABASE_URL}/rest/v1/nutrition_food_logs`;
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
        id: String(row.id || 'nlog_new'),
        userId,
        mealType: row.meal_type,
        foodName: row.food_name,
        portionDescription: row.portion_description,
        calories: Number(row.calories) || 0,
        proteinG: Number(row.protein_g) || 0,
        carbsG: Number(row.carbs_g) || 0,
        fatG: Number(row.fat_g) || 0,
        loggedAt: row.logged_at,
        notes: row.notes,
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Delete an existing food log
   */
  static async deleteFoodLog(
    logId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    if (!logId || !token) {
      return { data: false, error: 'Log ID and token required.', status: 400 };
    }

    const url = `${SUPABASE_URL}/rest/v1/nutrition_food_logs?id=eq.${logId}`;
    const res = await safeRequest(url, {
      method: 'DELETE',
      headers: getSupabaseHeaders(token),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }
}
