/**
 * OvaSense Intelligence API Types
 *
 * Types matching the Django intelligence API response from the authoritative Ovasense-ML model.
 * Strict typing across screening probabilities, threshold classification, data quality, and TreeSHAP.
 */

// ---------------------------------------------------------------------------
// Screening Risk Categories
// ---------------------------------------------------------------------------
export type RiskCategory =
  | 'lower_risk'
  | 'intermediate_risk'
  | 'higher_risk'
  | 'insufficient_data'
  // Backwards compatibility aliases
  | 'lower_pattern'
  | 'moderate_pattern'
  | 'higher_pattern';

export type RiskPattern = RiskCategory;

export type AssessmentMode = 'ml' | 'insufficient_data' | 'error';

// ---------------------------------------------------------------------------
// TreeSHAP Feature Explanation
// ---------------------------------------------------------------------------
export interface ShapExplanation {
  /** Technical feature name (e.g. "hair growth(Y/N)") */
  feature: string;
  /** Patient-friendly label (e.g. "Excess Facial / Body Hair (Hirsutism)") */
  human_label: string;
  /** Direction of contribution toward model risk estimate */
  direction: 'increases_risk' | 'decreases_risk' | 'positive' | 'negative';
  /** Absolute SHAP magnitude (larger = more influential) */
  magnitude: number;
  /** Patient-friendly clinical explanation text */
  patient_explanation: string;
}

export interface FeatureDetail {
  name: string;
  label: string;
  category: 'clinical' | 'symptom' | 'lifestyle' | 'cycle';
  status: 'provided' | 'not_provided';
  display_value: string;
  is_imputed: boolean;
}

// ---------------------------------------------------------------------------
// Data Quality Report
// ---------------------------------------------------------------------------
export interface DataQualityReport {
  completeness_percentage: number;
  quality_level: 'good' | 'limited' | 'insufficient_data';
  missing_features: string[];
  available_features: string[];
  feature_details?: FeatureDetail[];
  cycle_records_count?: number;
  symptom_records_count?: number;
  total_records?: number;
  date_span_days?: number;
}

// ---------------------------------------------------------------------------
// Model Metadata
// ---------------------------------------------------------------------------
export interface ModelMetadata {
  model_name?: string;
  model_version?: string;
  artifact?: string;
  framework?: string;
  classifier?: string;
  algorithm?: string;
  feature_count?: number;
  screening_threshold?: number;
  training_samples?: number;
  clinical_safety_warning?: string;
  disclaimer?: string;
  classes?: string[];
  ready?: boolean;
}

// ---------------------------------------------------------------------------
// Full Assessment Result (from POST /api/v1/intelligence/assessment/)
// ---------------------------------------------------------------------------
export interface IntelligenceAssessment {
  /** Screening risk category */
  risk_category: RiskCategory;
  /** Patient-friendly description of the category */
  risk_category_description: string;
  /** Estimated probability of PCOS [0.0 - 1.0] from Extra Trees pipeline */
  pcos_probability?: number | null;
  /** Estimated probability of Non-PCOS [0.0 - 1.0] */
  non_pcos_probability?: number | null;
  /** Sensitivity-tuned screening cutoff (default: 0.25 under policy v2) */
  screening_threshold?: number;
  /** Boolean flag: true if pcos_probability >= screening_threshold */
  is_higher_risk?: boolean;
  /** Confidence score (highest class probability) */
  confidence: number | null;
  /** Probabilities dictionary */
  probabilities: Record<string, number>;
  /** Data completeness report */
  data_quality: DataQualityReport;
  /** Top TreeSHAP feature explanations */
  explanations: ShapExplanation[];
  /** Model configuration metadata */
  model_metadata: ModelMetadata;
  /** Standard non-diagnostic clinical disclaimer */
  disclaimer: string;
  /** Whether TreeSHAP attributions are present */
  shap_enabled: boolean;
  /** Backend execution mode */
  backend_mode: AssessmentMode;
  /** Non-critical fetch notices */
  fetch_errors: string[];

  // Backwards compatibility aliases
  risk_pattern?: RiskPattern;
  risk_pattern_description?: string;
}

// ---------------------------------------------------------------------------
// Health Snapshot (from GET /api/v1/intelligence/health/)
// ---------------------------------------------------------------------------
export interface HealthSnapshot {
  data_quality: DataQualityReport;
  cycle: {
    records_available: number;
    regularity?: string | null;
    average_length?: string | number | null;
  };
  symptoms: {
    records_available: number;
    categories: Record<string, number>;
  };
  lifestyle: {
    sleep_hours: number | null;
    water_glasses_target: number | null;
    activity_level: string | null;
    fitness_sessions: number;
    food_logs: number;
  };
  medications: {
    active_count: number;
    active_names: string[];
    log_entries: number;
  };
  laboratory: {
    result_count: number;
    available_tests: string[];
  };
}

// ---------------------------------------------------------------------------
// Status endpoint response (GET /api/v1/intelligence/status/)
// ---------------------------------------------------------------------------
export interface IntelligenceServiceStatus {
  status: string;
  service: string;
  model: {
    name: string;
    version: string;
    algorithm: string;
    framework?: string;
    feature_count: number;
    screening_threshold?: number;
    classes?: string[];
    shap_enabled: boolean;
    ready: boolean;
  };
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Unified intelligence state (used by intelligenceService.ts)
// ---------------------------------------------------------------------------
export type IntelligenceSource = 'backend_ml' | 'local_fallback' | 'loading' | 'error';

export interface IntelligenceState {
  source: IntelligenceSource;
  assessment: IntelligenceAssessment | null;
  /** The client-side fallback insight (always available as safety net) */
  localInsight?: {
    summary: string;
    detectedPatterns: string[];
  };
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

// ---------------------------------------------------------------------------
// Conversational Intelligence Types (POST /api/v1/intelligence/chat/)
// ---------------------------------------------------------------------------
export interface ChatContextUsage {
  profile: boolean;
  cycle: boolean;
  symptoms: boolean;
  reports: boolean;
  diet: boolean;
  fitness: boolean;
  medications: boolean;
  digital_twin?: boolean;
  ml_screening: boolean;
}

export interface ChatMessagePayload {
  message: string;
  conversation_id?: string;
  conversation_history?: Array<{
    sender: 'user' | 'ai';
    text: string;
  }>;
  client_telemetry?: Record<string, any>;
}

export type ChatSafetyLevel = 'normal' | 'caution' | 'urgent';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface ChatResponsePayload {
  success: boolean;
  message: string;
  reply?: string;
  conversation_id: string;
  context_used: ChatContextUsage;
  safety_level: ChatSafetyLevel;
  needs_clinician: boolean;
  model?: string;
}

// ---------------------------------------------------------------------------
// PCOS-ML Progressive Assessment Types
// ---------------------------------------------------------------------------

export type AssessmentLevel = 'tier_1' | 'tier_1_2' | 'tier_1_3' | 'tier_1_2_3';

export type ProgressiveRiskCategory = 'lower' | 'intermediate' | 'higher' | 'insufficient_data';

export type PCOMStatus = 'PCOM Detected' | 'PCOM Not Visible' | 'Not Assessed';

export interface AssessmentEvidenceUsed {
  tier_1: boolean;
  tier_2: boolean;
  tier_3_ultrasound: boolean;
}

export interface AvailableHistoricalEvidence {
  tier_1: boolean;
  tier_2: boolean;
  tier_3_ultrasound: boolean;
}

export interface FusionDetails {
  clinical_probability: number;
  ultrasound_pcom_probability: number;
  clinical_weight: number;
  ultrasound_weight: number;
  combined_score: number;
  threshold: number;
}

export interface HormonePatternInterpretation {
  is_hypogonadal: boolean;
  pattern_type: string;
  pattern_name: string;
  pattern_description: string;
  pattern_code: string;
  total_testosterone_recorded?: number | null;
  lh_recorded?: number | null;
  fsh_recorded?: number | null;
  prolactin_recorded?: number | null;
  direct_measurements?: Record<string, { value: number; unit?: string; [key: string]: any }>;
  [key: string]: any;
}

export interface DirectLaboratoryValue {
  analyte_key: string;
  label: string;
  value: number;
  unit?: string;
}

export interface ProgressiveAssessment {
  has_assessment?: boolean;
  patient_id?: string;
  assessment_id: string;
  id?: string;
  module?: 'female_pcos' | 'male_hypogonadism' | string;
  assessment_level: AssessmentLevel;
  tiers_included: number[];
  evidence_used?: AssessmentEvidenceUsed;
  available_historical_evidence?: AvailableHistoricalEvidence;
  model_version: string;
  model_name: string;
  probability: number;
  probability_percent: number;
  threshold: number;
  risk_category: ProgressiveRiskCategory | string;
  risk_label?: string;
  screening_policy_version?: string;
  original_risk_category?: string;
  original_threshold?: number;
  original_probability?: number;
  summary_text?: string;
  is_active: boolean;
  replaced_assessment_id?: string | null;
  available_features?: string[];
  missing_features?: string[];
  explanations: ShapExplanation[];
  shap_explanation?: PatientShapExplanationPayload | null;
  longitudinal_shap_comparison?: LongitudinalShapComparison | null;
  limitations: string[];
  next_step?: string;
  next_available_tier?: number | null;
  pcom_status?: string | null;
  pcom_probability?: number | null;
  gradcam_url?: string | null;
  gradcam_b64?: string | null;
  fusion_details?: FusionDetails;
  tier_2_available_count?: number;
  tier_2_total_count?: number;
  tier_2_available_fields?: string[];
  tier_2_missing_fields?: string[];
  evidence_completeness_percent?: number;
  evidence_completeness?: {
    available: number;
    total: number;
    percentage: number;
  };
  hormone_pattern_interpretation?: HormonePatternInterpretation;
  direct_laboratory_values?: DirectLaboratoryValue[];
  tier_2_inputs?: Record<string, any>;
  authoritative_tier_2_inputs?: Record<string, any>;
  input_features?: Record<string, any>;
  authoritative_tier_1_inputs?: Record<string, any>;
  status_code?: string;
  notice?: string;
  disclaimer: string;
  created_at?: string;
  input_hash?: string;
}

// ---------------------------------------------------------------------------
// Fold-Aware Calibrated SHAP Explainability Types
// ---------------------------------------------------------------------------

export interface ShapFoldAgreement {
  fold_values: number[];
  positive_folds: number;
  negative_folds: number;
  zero_folds: number;
  agreeing_folds_count: number;
  total_folds_count: number;
  fold_agreement_ratio: number;
  stability: 'consistent' | 'moderate' | 'mixed';
}

export interface PatientShapFactor {
  feature_key: string;
  patient_label: string;
  patient_value: string;
  raw_value: any;
  shap_value: number;
  absolute_shap: number;
  direction: 'higher' | 'lower' | 'neutral';
  direction_label: string;
  relative_influence: number;
  explanation_share_percent: number;
  influence_level: 'strong' | 'moderate' | 'mild' | 'minimal';
  category: string;
  modifiable_status: 'modifiable' | 'partially_modifiable' | 'non_modifiable';
  simple_description: string;
  why_model_uses_it: string;
  patient_explanation: string;
  fold_agreement: ShapFoldAgreement;
  clinical_reference?: {
    reference_interval?: string | null;
    reference_source?: string | null;
    has_reference_range: boolean;
    disclaimer?: string;
  } | null;
  technical_details?: {
    output_space: string;
    fold_values: number[];
    stability: string;
  };
}

export interface PatientShapExplanationPayload {
  schema_version: string;
  pathway: string;
  tier: string;
  model_name: string;
  model_version: string;
  outer_estimator_type: string;
  base_estimator_type: string;
  calibration_method: string;
  calibration_fold_count: number;
  explained_fold_count: number;
  aggregation_method: string;
  explainer_type: string;
  explained_model_stage: string;
  output_space: string;
  positive_class: number;
  positive_class_index: number;
  ensemble_base_value: number;
  ensemble_reconstructed_output: number;
  final_calibrated_probability: number;
  final_calibrated_percent: number;
  additivity_verified: boolean;
  additivity_error: number;
  environment_metadata: {
    shap_version: string;
    sklearn_version: string;
    reference_strategy: string;
  };
  factors: PatientShapFactor[];
  top_higher_factors: PatientShapFactor[];
  top_lower_factors: PatientShapFactor[];
  top_mixed_factors?: PatientShapFactor[];
  summary: {
    headline: string;
    subheadline: string;
    total_factors_evaluated: number;
    top_higher_count: number;
    top_lower_count: number;
    top_mixed_count?: number;
  };
  multimodal_context?: {
    clinical_weight: number;
    ultrasound_weight: number;
    clinical_probability: number;
    ultrasound_probability: number;
    pcom_status: string;
    pcom_probability: number;
    note: string;
  };
}

export interface LongitudinalFactorComparison {
  feature_key: string;
  patient_label: string;
  category: string;
  previous_value: string;
  current_value: string;
  value_changed: boolean;
  previous_influence_level: 'strong' | 'moderate' | 'mild' | 'minimal';
  current_influence_level: 'strong' | 'moderate' | 'mild' | 'minimal';
  previous_direction: 'higher' | 'lower' | 'neutral';
  current_direction: 'higher' | 'lower' | 'neutral';
  previous_shap_value: number;
  current_shap_value: number;
  previous_share_percent: number;
  current_share_percent: number;
  patient_narrative: string;
}

export interface LongitudinalShapComparison {
  is_comparable: boolean;
  reason?: string;
  message?: string;
  previous_assessment_id?: string;
  previous_assessment_date?: string;
  previous_calibrated_probability?: number;
  current_calibrated_probability?: number;
  total_factors_compared?: number;
  comparisons?: LongitudinalFactorComparison[];
}

export interface MaleClinicalLabInputs {
  shbg_nmol_l?: number | null;
  estradiol_pg_ml?: number | null;
  albumin_g_dl?: number | null;
  hba1c_pct?: number | null;
  glucose_mg_dl?: number | null;
  hemoglobin_g_dl?: number | null;
  hematocrit_pct?: number | null;
  rbc_count?: number | null;
  alt_u_l?: number | null;
  ast_u_l?: number | null;
  total_bilirubin_mg_dl?: number | null;
  creatinine_mg_dl?: number | null;
  bun_mg_dl?: number | null;
  uric_acid_mg_dl?: number | null;
  hdl_mg_dl?: number | null;
  total_testosterone?: number | null;
  lh?: number | null;
  fsh?: number | null;
  prolactin?: number | null;
  [key: string]: any;
}
