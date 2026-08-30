export type MenstrualFlow = 'light' | 'medium' | 'heavy';

export type CyclePhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

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
}

export interface CycleSummaryStats {
  hasData: boolean;
  totalRecordsCount: number;
  currentCycleDay: number | null;
  totalCycleDays: number;
  periodDuration: number;
  estimatedPhase: CyclePhaseInfo | null;
  periodStatus: string;
  nextPeriodDays: number | null;
  nextPeriodDate: string | null;
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  isCycleActive: boolean;
  activePeriodDay: number | null; // e.g. Day 3 of 5 if currently on period
  lastPeriodStartDate: string | null;
  lastPeriodEndDate: string | null;
  history: CycleHistoryItem[];
}
