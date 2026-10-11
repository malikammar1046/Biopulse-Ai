export type StressActivityType =
  | 'deep_breathing'
  | 'box_breathing'
  | 'mindfulness'
  | 'progressive_muscle_relaxation'
  | 'guided_relaxation'
  | 'gentle_stretching'
  | 'relaxation_break'
  | 'other';

export interface StressSessionLog {
  id: string;
  userId: string;
  activityType: StressActivityType;
  activityName: string;
  durationMinutes: number;
  occurredAt: string; // YYYY-MM-DD
  stressBefore?: number | null; // 1 to 10
  stressAfter?: number | null; // 1 to 10
  notes?: string;
  createdAt: string;
}

export interface StressSessionInput {
  activityType: StressActivityType;
  activityName: string;
  durationMinutes: number;
  occurredAt?: string; // YYYY-MM-DD (defaults to today)
  stressBefore?: number | null;
  stressAfter?: number | null;
  notes?: string;
}

export interface StressStats {
  completedSessionsToday: number;
  totalRelaxationMinutesToday: number;
  totalMinutesToday: number;
  averageStressChange?: number;
  recentSessions: StressSessionLog[];
}
