/**
 * apps/web/src/types/nutrition.ts
 *
 * TypeScript types for BioPulse Nutrition & 7-Day Meal Planning API.
 * Extended to cover: readiness (structured), meal logging, plan customization,
 * meal locking, reminders, and AI companion integration.
 */

// ─── Readiness ───────────────────────────────────────────────────────────────

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
  personalization_level?: 'LEVEL_1_PROFILE' | 'LEVEL_2_SCREENING' | 'LEVEL_3_FULL' | 'LEVEL_3_CLINICAL' | string;
  blocking_issues?: string[];
  warning_issues?: string[];
  optional_issues?: string[];
  required_biometrics: ReadinessGroup;
  safety_confirmations: ReadinessGroup;
  planning_inputs: PlanningInputsReadiness;
  optional_personalization?: Record<string, any>;
  /** @deprecated Use blocking_issues / warning_issues instead */
  warnings: string[];
  // Structured fields for smart banner display
  available?: string[];        // what IS already present
  missing_required?: string[]; // what is actually required but absent
  missing_optional?: string[]; // what is optional but absent
  recommendations?: string[];  // human-readable suggestions
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export type DietaryPattern = 'omnivore' | 'halal_omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
export type BudgetTier = 'low' | 'medium' | 'flexible';
export type CookingTimePreference = 'quick' | 'moderate' | 'flexible';
export type MealGoal =
  | 'maintain_health'
  | 'weight_reduction'
  | 'weight_gain'
  | 'improve_eating_consistency'
  | 'metabolic_health'
  | 'energy'
  | 'fitness_support';

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
  // Extended fields (Phase 4 wizard)
  goal?: MealGoal | string;
  cooking_access?: 'full_kitchen' | 'basic_kitchen' | 'ready_made' | string;
  preferred_meal_times?: { breakfast?: string; lunch?: string; dinner?: string; snack?: string };
}

// ─── Targets ─────────────────────────────────────────────────────────────────

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

// ─── Meal Plan ────────────────────────────────────────────────────────────────

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
  // Customization
  is_locked?: boolean;
  swap_reason?: string;
}

export interface SingleMeal {
  id?: string;
  role: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | string;
  title: string;
  description?: string;
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  items: PlannedMealItem[];
  // Customization / logging state
  is_locked?: boolean;
  is_logged?: boolean;
  logged_at?: string | null;
  food_log_id?: string | null;
  why_this_meal?: string;
  why_it_fits?: string;
  prep_time_minutes?: number;
  safe_substitutions?: string[];
  key_ingredients?: string[];
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

export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived' | 'needs_review' | string;

export interface WeeklyNutritionPlan {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  replaced_plan_id?: string | null;
  status: PlanStatus;
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
  plan_data?: any;
}

export interface NutritionPlanSummary {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  condition_pathway: string;
  status: PlanStatus;
  created_at: string;
}

// ─── Food Logging ─────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id?: string;
  user_id?: string;
  meal_type: MealType;
  food_name: string;
  portion_description?: string;
  logged_at: string;        // ISO timestamp
  // Optional nutrition (may be unknown for untracked foods)
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  // Plan linkage
  plan_id?: string | null;
  plan_meal_id?: string | null;
  day_index?: number | null;
  notes?: string;
}

export interface FoodLogSummary {
  date: string;
  entries: FoodLogEntry[];
  total_calories?: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  planned_meals_total?: number;
  planned_meals_logged?: number;
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export interface MealReminder {
  meal_type: MealType;
  enabled: boolean;
  time: string;   // "HH:MM" 24-hour format
}

export interface NutritionReminderPreferences {
  enabled: boolean;
  reminders: MealReminder[];
  notification_permission?: 'granted' | 'denied' | 'default' | null;
}

// ─── Wizard State ─────────────────────────────────────────────────────────────

export interface WizardState {
  step: number;
  // Step 1 – Dietary Safety (auto-filled from profile, user confirms/edits)
  dietary_pattern: DietaryPattern | string;
  food_allergies: string[];
  food_intolerances: string[];
  // Step 2 – Food Preferences
  favorite_dishes: string[];
  favorite_ingredients: string[];
  disliked_ingredients: string[];
  preferred_cuisines: string[];
  // Step 3 – Practical Lifestyle
  meals_per_day: 3 | 4 | 5;
  cooking_time_preference: CookingTimePreference;
  budget_tier: BudgetTier;
  cooking_access: string;
  preferred_meal_times: { breakfast?: string; lunch?: string; dinner?: string; snack?: string };
  // Step 4 – Goal
  goal: MealGoal | string;
}

// ─── Adherence / Stats ────────────────────────────────────────────────────────

export interface PlanAdherenceSummary {
  period: 'today' | 'week';
  planned_meals: number;
  logged_meals: number;
  adherence_pct: number;
  days_engaged: number;       // for week
  days_total: number;         // for week
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

