/**
 * BioPulse AI — Longitudinal Health API Response Contracts & Types
 * Authoritative interface for historical monitoring across Female PCOS & Male Hypogonadism.
 */

export type MonitoringPeriodFilter = '30d' | '90d' | '180d' | '1y' | 'all';

export interface ObjectiveMetricDelta {
  previous_value: number | null;
  current_value: number | null;
  delta: number | null;
  percent_change: number | null;
  direction: 'increased' | 'decreased' | 'unchanged';
  objective_description: string;
}

export interface CurrentHealthSummary {
  active_assessment_id: string | null;
  assessment_level: string | null;
  screening_probability: number | null;
  screening_probability_percent: number | null;
  risk_category: string | null;
  risk_label: string | null;
  last_assessed_at: string | null;
  key_metrics: Record<string, number | null>;
  metric_deltas: Record<string, ObjectiveMetricDelta>;
}

export interface ScreeningHistoryPoint {
  id: string;
  assessment_level: string;
  tiers_included: number[];
  probability: number;
  probability_percent: number;
  threshold: number;
  risk_category: string;
  risk_label: string;
  created_at: string;
  is_active: boolean;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  source: 'screening_assessment' | 'verified_lab_report' | 'cycle_record' | 'symptom_log';
  is_verified: boolean;
  metadata?: Record<string, any>;
}

export interface MetricSeries {
  metric_key: string;
  label: string;
  unit: string;
  category: 'screening' | 'anthropometric' | 'laboratory' | 'symptom' | 'cycle';
  is_graphable: boolean;
  data_points: MetricDataPoint[];
}

export interface TimelineEventItem {
  id: string;
  event_type: 'screening_assessment' | 'clinical_tier_upgrade' | 'verified_lab_report' | 'symptom_entry' | 'cycle_entry';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LongitudinalHealthResponse {
  patient_id: string;
  module: 'female_pcos' | 'male_hypogonadism';
  period: MonitoringPeriodFilter;
  generated_at: string;
  disclaimer: string;
  current_summary: CurrentHealthSummary;
  screening_history: ScreeningHistoryPoint[];
  metric_series: Record<string, MetricSeries>;
  symptom_history: any[];
  cycle_history?: any[];
  timeline_events: TimelineEventItem[];
}
