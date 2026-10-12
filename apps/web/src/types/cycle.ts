export type MenstrualFlow = 'spotting' | 'light' | 'medium' | 'heavy';

export type CyclePhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'overdue';

export type RegularityStatus = 'regular' | 'irregular' | 'variable' | 'insufficient_data';

export type CycleLengthSource =
  | 'calculated_history'
  | 'profile_baseline'
  | 'default_estimate'
  | 'insufficient_history';

export type OvulationEstimateStatus =
  | 'estimated'
  | 'irregular_uncertain'
  | 'insufficient_data'
  | 'anovulatory_risk'
  | 'clinical_observed';

export interface OvulationEstimate {
  status: OvulationEstimateStatus;
  ovulationDay: number | null;
  ovulationDate: string | null;           // ISO YYYY-MM-DD
  ovulationDateFormatted: string | null;  // e.g. "Aug 26, 2026"
  fertileWindowStartDay: number | null;
  fertileWindowEndDay: number | null;
  fertileWindowStartDate: string | null; // ISO YYYY-MM-DD
  fertileWindowEndDate: string | null;   // ISO YYYY-MM-DD
  fertileWindowFormatted: string | null; // e.g. "Aug 21 – Aug 27"
  confidence: 'none' | 'low' | 'moderate';
  isApproximate: boolean;
  uncertaintyExplanation?: string;
  clinicalDisclaimer: string;
}

export interface PhaseRangeItem {
  start: number;
  end: number;
  display: string;
}

export interface PhaseDayRanges {
  period: string; // e.g. "Days 1–5"
  follicular: string; // e.g. "Days 6–13"
  fertile: string; // e.g. "Days 10–15" or "Timing Variable"
  ovulation: string; // e.g. "Day ~14" or "Uncertain"
  luteal: string; // e.g. "Days 16–28"
  menstrual: PhaseRangeItem;
  follicularRange: PhaseRangeItem;
  ovulationRange: PhaseRangeItem;
  lutealRange: PhaseRangeItem;
  fertileWindow: PhaseRangeItem | null;
}

export interface CycleRecord {
  id: string;
  userId: string;
  periodStartDate: string; // ISO Date YYYY-MM-DD
  periodEndDate: string;   // ISO Date YYYY-MM-DD
  flow: MenstrualFlow;
  symptoms?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CycleRecordInput {
  periodStartDate: string; // ISO Date YYYY-MM-DD
  periodEndDate: string;   // ISO Date YYYY-MM-DD
  flow: MenstrualFlow;
  symptoms?: string[];
  notes?: string;
}

export interface CyclePhaseInfo {
  key: CyclePhaseKey;
  name: string;
  displayName: string;
  tag: string;
  badgeColor: string;
  cardColor: string;
  textColor: string;
  description: string;
  guidance: string;
}

export interface CycleHistoryItem {
  id: string;
  monthYear: string; // e.g. "Aug 2026"
  startDateFormatted: string; // e.g. "Aug 12, 2026"
  endDateFormatted: string;   // e.g. "Aug 16, 2026"
  rawStartDate: string;
  rawEndDate: string;
  cycleLengthDays: number | null; // e.g. 28 days (measured to next cycle start)
  periodDurationDays: number;     // e.g. 5 days
  flow: MenstrualFlow;
  symptoms: string[];
  notes?: string;
  isLatest: boolean;
  isIrregularInterval?: boolean;
  isProlongedGap?: boolean;
}

export interface CycleSummaryStats {
  hasData: boolean;
  totalRecordsCount: number;
  completedCyclesCount: number;
  currentCycleDay: number | null;
  totalCycleDays: number;
  periodDuration: number;
  estimatedPhase: CyclePhaseInfo | null;
  periodStatus: string;
  isOverdue: boolean;
  daysOverdue: number;
  nextPeriodDays: number | null;
  nextPeriodDate: string | null;
  rawNextPeriodDate: string | null;
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  cycleLengthSource: CycleLengthSource;
  regularityStatus: RegularityStatus;
  regularityLabel: string;
  regularityDescription: string;
  dataConfidence: 'high' | 'moderate' | 'preliminary' | 'insufficient';
  isCycleActive: boolean;
  activePeriodDay: number | null; // e.g. Day 3 of 5 if currently on period
  lastPeriodStartDate: string | null;
  lastPeriodEndDate: string | null;
  ovulation: OvulationEstimate;
  ovulationEstimate: OvulationEstimate;
  phaseDayRanges: PhaseDayRanges;
  clinicalNotice?: string;
  clinicalNotices?: string[];
  history: CycleHistoryItem[];
}
