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
  status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS';
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
}

export interface LifestyleSimulationOverride {
  module?: 'female_pcos' | 'male_hypogonadism' | 'ovasense' | 'androsense';
  dietary_preference?: string;
  activity_level?: string;
  allergens?: string[];
}
