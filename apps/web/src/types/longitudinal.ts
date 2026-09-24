/**
 * VITASense — Longitudinal Monitoring & Progress Tracking Types (Phase 8)
 *
 * Defines the core types for deterministic, observational health tracking over time.
 * Strict Principles:
 *   1. Derived solely from real user records (cycle, symptoms, food, water, fitness, meds, verified labs).
 *   2. Never fabricates predictions, trend percentages, or fake AI forecasts.
 *   3. Honest insufficient-data states when history is too limited.
 *   4. Strict pathway isolation (female OvaSense, male AndroSense, universal General).
 *   5. Strict trust boundaries: quarantined OCR values are excluded from trusted trends.
 *   6. Non-diagnostic: observational statements with clear medical disclaimers.
 */

import type { HealthPathway } from './onboarding';
import type { DataSourceProvenance, ExplainableInsight } from './researchIntelligence';
import type { TimelineEvent } from './timeline';

// ---------------------------------------------------------------------------
// Monitoring Timeframe & Status
// ---------------------------------------------------------------------------

export type MonitoringPeriod = '7d' | '30d' | '90d' | '180d' | 'all';

export type TrendState =
  | 'improving'
  | 'stable'
  | 'changing'
  | 'developing_pattern'
  | 'insufficient_data';

export type TrendDirection =
  | 'increased'
  | 'decreased'
  | 'unchanged'
  | 'variable'
  | 'insufficient';

export type TrendCategory =
  | 'symptoms'
  | 'cycle'
  | 'nutrition'
  | 'movement'
  | 'water'
  | 'sleep'
  | 'medications'
  | 'reports'
  | 'screening'
  | 'profile';

// ---------------------------------------------------------------------------
// Core Trend Metric
// ---------------------------------------------------------------------------

export interface TrendMetric {
  id: string;
  category: TrendCategory;
  title: string;
  trendState: TrendState;
  direction: TrendDirection;
  /** WHAT CHANGED: Patient-friendly observable change */
  whatChanged: string;
  /** OVER WHAT PERIOD: Plain-English timeframe (e.g., "Across your last 8 logged entries...") */
  overWhatPeriod: string;
  /** BASED ON: Real records and provenance trust level */
  basedOn: DataSourceProvenance;
  /** LIMITATION: What cannot be concluded clinically */
  limitation: string;
  /** Non-prescriptive next step */
  actionTip?: string;
  /** Optional numeric values for chart points */
  currentValue?: number | string;
  previousValue?: number | string;
  unit?: string;
  pathway: HealthPathway;
}

// ---------------------------------------------------------------------------
// Period-over-Period Comparison (e.g. Current 30d vs Previous 30d)
// ---------------------------------------------------------------------------

export interface PeriodComparisonSummary {
  id: string;
  category: TrendCategory;
  metricLabel: string;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  currentValue: number | string;
  previousValue: number | string;
  unit?: string;
  direction: TrendDirection;
  /** Patient-friendly observation (e.g. "Logged water on 4 more days this month than last month") */
  observation: string;
  evidence: DataSourceProvenance;
  limitation: string;
  hasSufficientData: boolean;
}

// ---------------------------------------------------------------------------
// Symptom Longitudinal Statistics
// ---------------------------------------------------------------------------

export interface RecurringSymptomStat {
  name: string;
  currentCount: number;
  previousCount: number;
  changeDirection: TrendDirection;
  mostCommonSeverity: string;
  cyclePhasesLogged?: string[];
}

export interface SymptomLongitudinalStats {
  totalLoggedCurrentPeriod: number;
  totalLoggedPreviousPeriod: number;
  trendState: TrendState;
  topRecurringSymptoms: RecurringSymptomStat[];
  frequencySummary: string;
  intensitySummary: string;
  /** OvaSense only: symptom clustering relative to menstrual phases */
  phaseClusters?: Array<{
    phaseName: string;
    symptomCount: number;
    percentage: number;
  }>;
  hasSufficientData: boolean;
  insufficientDataReason?: string;
  evidence: DataSourceProvenance;
  limitation: string;
}

// ---------------------------------------------------------------------------
// OvaSense: Cycle Longitudinal Statistics (Female Pathway Only)
// ---------------------------------------------------------------------------

export interface CycleLongitudinalStats {
  recordedCyclesCount: number;
  intervals: number[];
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  regularityClassification: 'consistent' | 'variable' | 'insufficient_data';
  trendState: TrendState;
  cycleHistory: Array<{
    cycleIndex: number;
    startDate: string;
    endDate: string;
    durationDays: number;
    cycleLengthDays?: number;
    flow: string;
    symptomsCount: number;
  }>;
  hasSufficientData: boolean;
  insufficientDataReason?: string;
  observation: string;
  evidence: DataSourceProvenance;
  limitation: string;
}

// ---------------------------------------------------------------------------
// AndroSense: Male Endocrine & Lifestyle Longitudinal (Male Pathway Only)
// ---------------------------------------------------------------------------

export interface AndroSenseLongitudinalStats {
  energyLevelCurrent: string;
  energyLevelReportedChanges: string;
  sleepDurationAverage: number;
  sleepAdherence: 'consistent' | 'variable' | 'insufficient_data';
  movementSessionsCurrent: number;
  movementSessionsPrevious: number;
  hydrationComplianceRate: number;
  hasTestosteroneHistory: boolean;
  testosteroneReadings: Array<{
    date: string;
    value: number;
    unit: string;
    drawTiming: string;
    source: 'self_reported' | 'verified_lab';
    userVerified: boolean;
  }>;
  trendState: TrendState;
  observation: string;
  hasSufficientData: boolean;
  evidence: DataSourceProvenance;
  limitation: string;
}

// ---------------------------------------------------------------------------
// Universal General Pathway Longitudinal
// ---------------------------------------------------------------------------

export interface GeneralLongitudinalStats {
  hydrationDaysMetCurrent: number;
  hydrationDaysMetPrevious: number;
  nutritionMealsLoggedCurrent: number;
  fitnessWorkoutsCurrent: number;
  sleepAverageHours: number;
  trendState: TrendState;
  observation: string;
  evidence: DataSourceProvenance;
  limitation: string;
}

// ---------------------------------------------------------------------------
// Lab & Medical Report Longitudinal Tracking
// ---------------------------------------------------------------------------

export interface BiomarkerReading {
  reportId: string;
  reportTitle: string;
  reportDate: string;
  value: number;
  valueString: string;
  unit: string;
  referenceRange: string;
  status: string;
  userVerified: boolean;
}

export interface BiomarkerLongitudinalComparison {
  testName: string;
  unit: string;
  verifiedReadings: BiomarkerReading[];
  latestValue: number;
  latestDate: string;
  previousValue?: number;
  previousDate?: string;
  direction: TrendDirection;
  referenceRange?: string;
  observation: string;
  /** Only true if at least 1 reading is verified */
  isClinicallyVerified: boolean;
  quarantinedDraftCount: number;
  limitation: string;
}

// ---------------------------------------------------------------------------
// Chronological Health Timeline Grouping
// ---------------------------------------------------------------------------

export type TimelineGroupKey = 'today' | 'this_week' | 'earlier';

export interface ChronologicalTimelineGroup {
  groupKey: TimelineGroupKey;
  groupTitle: string;
  events: TimelineEvent[];
}

// ---------------------------------------------------------------------------
// Master Longitudinal Health State
// ---------------------------------------------------------------------------

export interface LongitudinalHealthOverview {
  whatHasChanged: string[];
  whatHasStayedSimilar: string[];
  whatIsImproving: string[];
  whatIsLimited: string[];
}

export interface LongitudinalHealthState {
  pathway: HealthPathway;
  selectedPeriod: MonitoringPeriod;
  periodLabel: string;
  overview: LongitudinalHealthOverview;
  trends: TrendMetric[];
  periodComparisons: PeriodComparisonSummary[];
  symptomLongitudinal: SymptomLongitudinalStats;
  cycleLongitudinal?: CycleLongitudinalStats; // OvaSense only
  androSenseLongitudinal?: AndroSenseLongitudinalStats; // AndroSense only
  generalLongitudinal?: GeneralLongitudinalStats; // General only
  biomarkerComparisons: BiomarkerLongitudinalComparison[];
  quarantinedBiomarkersCount: number;
  groupedTimeline: ChronologicalTimelineGroup[];
  explainableInsights: ExplainableInsight[];
  hasAnyData: boolean;
  totalEventsAnalyzed: number;
}
