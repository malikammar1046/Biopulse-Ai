// Types for Unified Longitudinal Health Timeline

export type TimelineCategory =
  | 'cycle'
  | 'symptom'
  | 'report'
  | 'medication'
  | 'nutrition'
  | 'fitness'
  | 'appointment'
  | 'care_circle';

export type TimelineImportance = 'high' | 'medium' | 'low';

export type TimelineDateRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

export interface TimelineMetricPill {
  label: string;
  value: string;
  unit?: string;
  status?: 'normal' | 'attention' | 'positive' | 'warning';
}

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  timestamp: string; // ISO string for sorting
  category: TimelineCategory;
  title: string;
  description: string;
  importance: TimelineImportance;
  metric?: TimelineMetricPill;
  sourceId?: string;
  sourceModule: string;
  cycleDay?: number;
  cyclePhase?: string;
  metadata?: Record<string, any>;
}

export interface HealthPatternCorrelation {
  id: string;
  category:
    | 'cycle_symptom'
    | 'lifestyle_symptom'
    | 'medication_adherence'
    | 'report_comparison'
    | 'lifestyle_movement'
    | 'cycle_regularity';
  title: string;
  observation: string; // Observed data / factual finding
  interpretation: string; // Educational interpretation & guidance
  confidence: 'high' | 'moderate';
  signals: string[];
  actionTip?: string;
}

export interface HealthTrajectoryDataPoint {
  date: string;
  displayDate: string;
  cycleDay?: number;
  phaseName?: string;
  symptomsCount: number;
  symptomSeverityScore: number; // 0 - 10
  movementMinutes: number;
  waterGlasses: number;
  medsAdherencePercent: number;
  hasReport: boolean;
  hasAppointment: boolean;
  eventsCount: number;
}

export interface HealthTrajectorySummary {
  dataPoints: HealthTrajectoryDataPoint[];
  totalLoggedDays: number;
  coveragePercentage: number;
  activeSignals: {
    cycle: boolean;
    symptoms: boolean;
    movement: boolean;
    adherence: boolean;
    hydration: boolean;
  };
}

export interface TimelineFilterState {
  dateRange: TimelineDateRange;
  selectedCategories: TimelineCategory[];
  onlyImportant: boolean;
  searchQuery: string;
}
