/**
 * apps/web/src/types/nutrition.ts
 *
 * TypeScript types for BioPulse Nutrition & 7-Day Meal Planning API.
 */

export interface ReadinessGroup {
  status: 'PASS' | 'FAIL';
  missing: string[];
}

export interface PlanningInputsReadiness {
  status: 'PASS' | 'FAIL';
  activity_status: string;
  missing: string[];
}

export interface NutritionReadiness {
  ready: boolean;
  overall_status?: 'READY' | 'WARNINGS' | 'NOT_READY' | string;
  personalization_level?: 'LEVEL_1_PROFILE' | 'LEVEL_2_SCREENING' | 'LEVEL_3_CLINICAL' | string;
  available?: string[];
  missing_required?: string[];
  missing_optional?: string[];
  recommendations?: string[];
  blocking_issues?: string[];
  warning_issues?: string[];
  optional_issues?: string[];
  required_biometrics: ReadinessGroup;
  safety_confirmations: ReadinessGroup;
  planning_inputs: PlanningInputsReadiness;
  optional_personalization?: Record<string, any>;
  warnings: string[];
}

export type DietaryPattern = 'omnivore' | 'halal_omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
export type BudgetTier = 'low' | 'medium' | 'flexible';
export type CookingTimePreference = 'quick' | 'moderate' | 'flexible';

export interface NutritionPreferences {
  food_allergies: string[];
  food_intolerances: string[];
  dietary_pattern: DietaryPattern | string;
  favorite_ingredients: string[];
  disliked_ingredients: string[];
  preferred_cuisines: string[];
  budget_tier: BudgetTier | string;
  cooking_time_preference: CookingTimePreference | string;
  meals_per_day: number;
}

export interface MacroRange {
  min: number;
  max: number;
}

export interface NutritionTargets {
  energy_kcal: number;
  protein_g: MacroRange;
  carbohydrate_g: MacroRange;
  fat_g: MacroRange;
  fiber_ai_g?: number;
  condition_pathway: 'PCOS' | 'MALE_HYPOGONADISM' | 'GENERAL' | string;
  evidence_context_status: 'SCREENING_PATHWAY' | 'UNKNOWN' | string;
  condition_evidence_annotations: string[];
}

export interface PlannedMealItem {
  entity_id: string;
  display_name: string;
  grams: number;
  standard_portion?: string;
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  has_recipe: boolean;
  recipe_note?: string;
}

export interface SingleMeal {
  role: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | string;
  title: string;
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  items: PlannedMealItem[];
  is_locked?: boolean;
  is_logged?: boolean;
  why_it_fits?: string;
  prep_time_minutes?: number;
  safe_substitutions?: string[];
}

export interface TargetAdherence {
  energy: 'WITHIN_RANGE' | 'BELOW_RANGE' | 'ABOVE_RANGE' | string;
  protein: 'WITHIN_RANGE' | 'BELOW_RANGE' | 'ABOVE_RANGE' | string;
  carbohydrate: 'WITHIN_RANGE' | 'BELOW_RANGE' | 'ABOVE_RANGE' | string;
  fat: 'WITHIN_RANGE' | 'BELOW_RANGE' | 'ABOVE_RANGE' | string;
}

export interface DailyNutritionPlan {
  day_index: number;
  day_name: string;
  date: string;
  status: string;
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fiber_g?: number | null;
  fiber_coverage: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' | string;
  target_adherence: TargetAdherence;
  meals: SingleMeal[];
}

export interface NutritionPlanCoverage {
  fiber: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' | string;
  fiber_note?: string;
  recipes: 'FULL' | 'PARTIAL' | 'NONE' | string;
  verified_subset_notice: string;
}

export interface WeeklyNutritionPlan {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  replaced_plan_id?: string | null;
  status: string;
  created_at: string;
  profile_context: {
    condition_pathway: string;
    evidence_context_status: string;
    goal: string;
    activity_level: string;
    dietary_class?: string;
  };
  targets: {
    energy_kcal: number;
    protein_g: MacroRange;
    carbohydrate_g: MacroRange;
    fat_g: MacroRange;
  };
  days_targets_met: number;
  days_with_deviations: number;
  days: DailyNutritionPlan[];
  coverage: NutritionPlanCoverage;
  condition_guidance: string[];
  warnings: string[];
}

export interface NutritionPlanSummary {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  condition_pathway: string;
  status: string;
  created_at: string;
}

export interface FoodLogItem {
  id: string;
  user_id?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'morning_snack' | 'afternoon_snack' | string;
  food_name: string;
  serving: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  notes?: string;
  logged_at: string;
  created_at?: string;
}

export interface MealReminderSettings {
  breakfast_enabled: boolean;
  breakfast_time: string;
  lunch_enabled: boolean;
  lunch_time: string;
  dinner_enabled: boolean;
  dinner_time: string;
  snack_enabled: boolean;
  snack_time: string;
  browser_notifications?: boolean;
}

