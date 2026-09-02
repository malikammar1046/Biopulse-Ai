export type ActivityType =
  | 'walking'
  | 'strength'
  | 'yoga'
  | 'stretching'
  | 'cycling'
  | 'low_impact_cardio'
  | 'mobility'
  | 'rest_recovery'
  | 'other';

export type EnergyFeelingLevel = 'low_energy' | 'okay' | 'good' | 'great';

export interface FitnessLogEntry {
  id: string;
  userId: string;
  activityType: ActivityType;
  activityName: string;
  durationMinutes: number;
  energyLevel?: EnergyFeelingLevel;
  notes?: string;
  occurredAt: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface FitnessLogInput {
  activityType: ActivityType;
  activityName: string;
  durationMinutes: number;
  energyLevel?: EnergyFeelingLevel;
  notes?: string;
  occurredAt?: string; // YYYY-MM-DD (defaults to today)
}

export interface SuggestedMovementRoutine {
  id: string;
  title: string;
  category: ActivityType;
  durationMinutes: number;
  intensity: 'Gentle' | 'Moderate' | 'Low-Impact' | 'Restorative';
  focus: string;
  whyThisPhase: string;
  steps: string[];
  isCompletedToday?: boolean;
}

export interface WeeklyFitnessDaySummary {
  date: string; // YYYY-MM-DD
  dayName: string;
  dayShort: string;
  totalMinutes: number;
  activityCount: number;
  activities: FitnessLogEntry[];
  targetMinutes: number;
}

export interface WeeklyFitnessStats {
  totalMinutesThisWeek: number;
  targetMinutesThisWeek: number;
  activeDaysCount: number;
  totalActivitiesCount: number;
  averageMinutesPerActiveDay: number;
  dailySummaries: WeeklyFitnessDaySummary[];
}
