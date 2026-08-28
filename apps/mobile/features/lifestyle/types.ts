export interface LifestyleLogEntry {
  id: string;
  date: string;
  sleepHours?: number;
  stressLevel?: 1 | 2 | 3 | 4 | 5;
  activityMinutes?: number;
  waterIntakeLiters?: number;
}
