/**
 * apps/web/src/types/lifestyle.ts
 *
 * TypeScript types for BioPulse AI Dynamic Lifestyle Recommendations.
 * Completely independent of the legacy Meal Directory.
 */

export interface MacroTarget {
  name: string;
  grams: number | null;
  calories_kcal: number | null;
  percent_of_energy: number | null;
  guidance: string;
}

export interface DailyTargets {
  daily_calories_kcal: number | null;
  calorie_range_min: number | null;
  calorie_range_max: number | null;
  protein: MacroTarget;
  carbohydrates: MacroTarget;
  fats: MacroTarget;
  fiber_grams: number | null;
  hydration_liters: number | null;
  target_status?: string;
  guidance_note?: string;
}

export interface TargetedFoodSwap {
  trigger_factor: string;
  swap_title: string;
  replace_food: string;
  recommended_alternative: string;
  clinical_mechanism: string;
  impact_level: 'high' | 'moderate';
}

export interface MealConcept {
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  title: string;
  description: string;
  key_ingredients: string[];
  hormonal_benefit: string;
  est_calories: number | null;
}

export interface NutritionPillar {
  strategy_title: string;
  strategy_summary: string;
  key_guidelines: string[];
  daily_targets: DailyTargets;
  targeted_swaps: TargetedFoodSwap[];
  meal_concepts: MealConcept[];
}

export interface WorkoutSession {
  day_name: string;
  focus: string;
  duration_mins: number;
  intensity: 'low' | 'moderate' | 'vigorous';
  modality: string;
  key_movements: string[];
  coaching_cue: string;
}

export interface FitnessPillar {
  protocol_name: string;
  weekly_frequency: string;
  overview: string;
  aerobic_target_minutes: string;
  resistance_target_sessions: string;
  pathway_clinical_benefit: string;
  weekly_schedule: WorkoutSession[];
  recovery_guidance: string;
}

export interface HabitRecommendation {
  category: 'Circadian' | 'Sleep' | 'Stress' | 'Environmental';
  title: string;
  action_item: string;
  timing: string;
  rationale: string;
}

export interface LifestylePillar {
  circadian_headline: string;
  sleep_target_hours: string;
  stress_management_protocol: string;
  recommended_habits: HabitRecommendation[];
}

export interface EvidenceRationale {
  attributed_shap_drivers: string[];
  attributed_lab_markers: string[];
  attributed_symptoms: string[];
  clinical_synthesis: string;
}

export interface RecommendationItem {
  id: string;
  category: 'nutrition' | 'fitness' | 'lifestyle' | 'clinical';
  title: string;
  action_summary: string;
  priority: 'high' | 'moderate' | 'routine';
  status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED';
  why_this_is_recommended: string;
  based_on_patient_data: string[];
  longitudinal_basis: string;
  shap_priority_basis: string | null;
  safety_status: 'ALLOW' | 'MODIFY' | 'WITHHOLD' | 'CLINICIAN_REVIEW';
  evidence_id?: string | null;
  clinician_review: boolean;
  clinician_review_reason?: string | null;
}

export interface ClinicianReviewSummary {
  recommended: boolean;
  reason: string | null;
}

export interface EvidenceMetadata {
  evidence_id: string;
  short_title: string;
  source_organization: string;
  guideline_document: string;
  publication_year: number;
  evidence_category: string;
  clinical_summary: string;
  patient_rationale: string;
}

export interface LifestyleRecommendationsResult {
  user_id: string;
  pathway: string;
  risk_category: string;
  risk_probability_percent: number;
  generated_at: string;
  safety_status: 'ALLOW' | 'MODIFY' | 'WITHHOLD' | 'CLINICIAN_REVIEW';
  missing_data: string[];
  clinician_review: ClinicianReviewSummary;
  safety_notices: string[];
  recommendations: RecommendationItem[];
  disclaimer: string;
  nutrition: NutritionPillar;
  fitness: FitnessPillar;
  lifestyle: LifestylePillar;
  evidence_rationale: EvidenceRationale;
  evidence_registry?: Record<string, EvidenceMetadata>;
  context_version?: string;
}

export interface RecommendationStatusUpdate {
  module?: string;
  recommendation_id: string;
  status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED';
  note?: string;
}

export interface LifestyleSimulationOverride {
  module?: 'female_pcos' | 'male_hypogonadism' | 'ovasense' | 'androsense';
  dietary_preference?: string;
  activity_level?: string;
  allergens?: string[];
}

export interface AIMealSlot {
  name: string;
  description: string;
  why: string;
}

export interface AIDailyMeals {
  day: number;
  day_name: string;
  breakfast: AIMealSlot;
  lunch: AIMealSlot;
  snack: AIMealSlot;
  dinner: AIMealSlot;
}

export interface AIPhysicalActivitySession {
  day_name: string;
  activity: string;
  duration_mins: number;
  intensity: 'low' | 'moderate';
  coaching_cue: string;
}

export interface AILifestylePlan {
  plan_duration_days: number;
  summary: string;
  engine_type: string;
  pathway: string;
  nutrition: {
    goals: string[];
    daily_meals: AIDailyMeals[];
  };
  hydration: {
    guidance: string;
    daily_target_liters: number | null;
  };
  physical_activity: {
    weekly_goal: string;
    schedule: AIPhysicalActivitySession[];
  };
  sleep_and_lifestyle: {
    sleep_guidance: string;
    stress_guidance: string;
    daily_habits: string[];
  };
  personalization_reasons: string[];
  safety_notices: string[];
  disclaimer: string;
  authoritative_daily_targets: {
    daily_calories_kcal: number | null;
    calorie_range_min: number | null;
    calorie_range_max: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fats_g: number | null;
    fiber_g: number | null;
    hydration_liters: number | null;
    target_status?: string;
    guidance_note?: string;
  };
  context_version?: string;
  generated_at: string;
}

export interface RecipeIngredient {
  item: string;
  quantity: string;
  practical_measure: string;
  category?: string;
}

export interface RecipeSubstitution {
  original: string;
  substitute: string;
  reason: string;
}

export interface RecipeNutritionalHighlights {
  estimated_calories_per_serving: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  fiber_grams: number | null;
  key_micronutrients: string[];
  qualitative_summary: string;
}

export interface PersonalizedRecipe {
  recipe_name: string;
  short_description: string;
  meal_type: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  why_suits_profile: string;
  nutritional_highlights: RecipeNutritionalHighlights;
  substitutions: RecipeSubstitution[];
  allergens_excluded: string[];
  disclaimer: string;
  generated_at: string;
}

export interface RecipeGenerationParams {
  module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism';
  meal_type?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  preference?: 'high_protein' | 'quick' | 'budget' | 'heart_healthy' | string;
  custom_notes?: string;
  dietary_preference?: string;
  allergens?: string[];
}

