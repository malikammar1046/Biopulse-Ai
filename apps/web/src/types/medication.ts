export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'every_other_day'
  | 'as_needed';

export type MedicationDoseStatus = 'taken' | 'skipped' | 'missed' | 'pending';

export interface MedicationItem {
  id: string;
  userId: string;
  name: string;
  dose: string;
  unit: string; // mg, mcg, IU, tablet, capsule, sachet, drops, ml
  frequency: MedicationFrequency;
  scheduledTimes: string[]; // e.g. ["08:00"], ["08:00", "20:00"]
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationInput {
  name: string;
  dose: string;
  unit: string;
  frequency: MedicationFrequency;
  scheduledTimes: string[];
  startDate?: string;
  endDate?: string;
  notes?: string;
  isActive?: boolean;
}

export interface MedicationLogEntry {
  id: string;
  userId: string;
  medicationId: string;
  medicationName?: string;
  scheduledFor: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM (e.g. "08:00")
  status: MedicationDoseStatus;
  takenAt?: string; // ISO Timestamp when marked taken
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLogInput {
  medicationId: string;
  scheduledFor: string; // YYYY-MM-DD
  scheduledTime: string;
  status: MedicationDoseStatus;
  takenAt?: string;
  notes?: string;
}

export interface ScheduledDoseItem {
  medicationId: string;
  medicationName: string;
  dose: string;
  unit: string;
  scheduledTime: string; // "08:00"
  timeDisplay: string; // "8:00 AM"
  frequency: MedicationFrequency;
  notes?: string;
  status: MedicationDoseStatus;
  logId?: string;
  takenAtDisplay?: string; // "8:14 AM"
}

export interface TodayMedicationProgress {
  totalScheduled: number;
  takenCount: number;
  remainingCount: number;
  skippedCount: number;
  missedCount: number;
  percentageTaken: number;
  doses: ScheduledDoseItem[];
}

export interface WeeklyAdherenceDaySummary {
  date: string; // YYYY-MM-DD
  dayShort: string; // "Mon"
  dayName: string; // "Monday"
  totalScheduled: number;
  takenCount: number;
  skippedCount: number;
  missedCount: number;
  isFullyAdherent: boolean;
  doses: ScheduledDoseItem[];
}

export interface WeeklyAdherenceStats {
  totalScheduledThisWeek: number;
  totalTakenThisWeek: number;
  totalSkippedThisWeek: number;
  totalMissedThisWeek: number;
  adherencePercentage: number;
  trackedDaysCount: number;
  dailyBreakdown: WeeklyAdherenceDaySummary[];
}
