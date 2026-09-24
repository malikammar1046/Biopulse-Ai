/**
 * BioPulse AI — Longitudinal Health API Response Contracts & Types
 * Authoritative interface for historical monitoring across Female PCOS & Male Hypogonadism.
 */

export type MonitoringPeriodFilter = '30d' | '90d' | '180d' | '1y' | 'all';

export type ScreeningComparabilityState =
  | 'directly_comparable'
  | 'cross_tier'
  | 'model_version_changed'
  | 'model_changed'
  | 'insufficient_metadata'
  | 'baseline'
  | 'no_assessments';

export interface ScreeningComparabilityInfo {
  state: ScreeningComparabilityState;
  is_comparable: boolean;
  message: string;
  previous_tier?: string | null;
  current_tier?: string | null;
  previous_model_version?: string | null;
  current_model_version?: string | null;
  delta_percentage_points?: number | null;
}

export interface ObjectiveMetricDelta {
  metric_key?: string;
  previous_value: number | null;
  current_value: number | null;
  previous_display?: string;
  current_display?: string;
  delta: number | null;
  percent_change: number | null;
  delta_percentage_points?: number | null;
  direction: 'increased' | 'decreased' | 'unchanged' | 'newly_reported' | 'no_longer_reported' | 'baseline_recorded';
  clinical_significance?: 'improved' | 'worsened' | 'neutral' | 'no_interpretation';
  objective_description: string;
  is_changed?: boolean;
}

export interface CurrentHealthSummary {
  active_assessment_id: string | null;
  assessment_level: string | null;
  tier_label?: string;
  screening_probability: number | null;
  screening_probability_percent: number | null;
  risk_category: string | null;
  risk_label: string | null;
  last_assessed_at: string | null;
  last_assessed_display?: string;
  key_metrics: Record<string, number | null>;
  metric_deltas: Record<string, ObjectiveMetricDelta>;
}

export interface ScreeningHistoryPoint {
  id: string;
  assessment_level: string;
  tier_label: string;
  tiers_included: number[];
  probability: number;
  probability_percent: number;
  threshold: number;
  risk_category: string;
  risk_label: string;
  model_name?: string;
  model_version?: string;
  created_at: string;
  observed_at: string;
  date_source: string;
  is_active: boolean;
}

export interface MetricDataPoint {
  id?: string;
  timestamp: string;
  observed_at?: string;
  value: number;
  source: 'screening_assessment' | 'verified_lab_report' | 'cycle_record' | 'symptom_log';
  date_source?: 'assessment' | 'specimen' | 'report' | 'symptom_log' | 'cycle_log' | 'created_at_fallback';
  is_verified: boolean;
  metadata?: Record<string, any>;
}

export interface MetricSeries {
  metric_key: string;
  label: string;
  unit: string;
  category: 'screening' | 'anthropometric' | 'laboratory' | 'symptom' | 'cycle';
  value_type?: string;
  comparison_type?: string;
  clinical_directionality?: string;
  is_graphable: boolean;
  data_points: MetricDataPoint[];
}

export interface ImportantChangeItem {
  priority: number;
  factor_key: string;
  label: string;
  category: 'screening' | 'anthropometric' | 'laboratory' | 'symptom' | 'cycle';
  previous_display: string;
  current_display: string;
  change_display: string;
  direction: 'increased' | 'decreased' | 'unchanged' | 'newly_reported' | 'no_longer_reported' | 'changed';
  clinical_significance: 'improved' | 'worsened' | 'neutral' | 'no_interpretation';
  explanation: string;
}

export interface FactorComparisonItem {
  factor_key: string;
  label: string;
  category: 'screening' | 'anthropometric' | 'laboratory' | 'symptom' | 'cycle';
  unit: string;
  previous_display: string;
  current_display: string;
  delta: number | null;
  direction: 'increased' | 'decreased' | 'unchanged' | 'newly_reported' | 'no_longer_reported' | 'changed' | 'baseline_recorded';
  clinical_significance: 'improved' | 'worsened' | 'neutral' | 'no_interpretation';
  explanation: string;
  is_changed: boolean;
}

export interface TierProgressionItem {
  tier: string;
  tier_number: number;
  label: string;
  is_completed: boolean;
  completed_at_display: string | null;
  description: string;
}

export interface MaleVitalitySymptomItem {
  key: string;
  label: string;
  current_reported: boolean;
  previous_reported: boolean | null;
  delta_direction: 'newly_reported' | 'no_longer_reported' | 'unchanged';
}

export interface MaleVitalitySummary {
  total_evaluated_symptoms: number;
  current_reported_count: number;
  previous_reported_count: number | null;
  delta_reported_count: number | null;
  current_display: string;
  previous_display: string;
  symptoms_breakdown: MaleVitalitySymptomItem[];
}

export interface TimelineEventItem {
  id: string;
  event_type: 'screening_assessment' | 'clinical_tier_upgrade' | 'verified_lab_report' | 'symptom_entry' | 'cycle_entry';
  title: string;
  description: string;
  timestamp: string;
  observed_at?: string;
  date_source?: string;
  metadata?: Record<string, any>;
}

export interface LongitudinalHealthResponse {
  patient_id: string;
  module: 'female_pcos' | 'male_hypogonadism';
  period: MonitoringPeriodFilter;
  generated_at: string;
  tracking_period_display: string;
  tracking_period_days: number;
  total_assessments_recorded: number;
  has_single_assessment_baseline: boolean;
  has_no_assessments: boolean;
  disclaimer: string;
  screening_comparability: ScreeningComparabilityInfo;
  comparison_source_date?: string | null;
  current_summary: CurrentHealthSummary;
  screening_history: ScreeningHistoryPoint[];
  metric_series: Record<string, MetricSeries>;
  male_vitality_summary?: MaleVitalitySummary | null;
  important_changes: ImportantChangeItem[];
  current_vs_previous: FactorComparisonItem[];
  tier_progression: TierProgressionItem[];
  symptom_history: any[];
  cycle_history?: any[];
  timeline_events: TimelineEventItem[];
}
