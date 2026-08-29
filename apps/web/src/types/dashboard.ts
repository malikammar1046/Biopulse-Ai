export interface HealthSnapshotMetrics {
  cycleDay: number;
  totalCycleDays: number;
  phaseName: string;
  nextPeriodDays: number;
  nextPeriodDate: string;
  symptomsCountToday: number;
  symptomsList: Array<{ name: string; severity: 'mild' | 'moderate' | 'severe' }>;
  wellnessScore: number;
  wellnessScoreChange: number;
}

export interface TodayReminder {
  id: string;
  title: string;
  time: string;
  category: 'medication' | 'cycle' | 'fitness' | 'hydration' | 'appointment';
  completed: boolean;
}

export interface NutritionData {
  caloriesLogged: number;
  caloriesTarget: number;
  proteinGrams: number;
  proteinTarget: number;
  carbsGrams: number;
  carbsTarget: number;
  fatGrams: number;
  fatTarget: number;
  waterIntakeLiters: number;
  waterTargetLiters: number;
  meals: Array<{
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    calories: number;
    tags: string[];
  }>;
  suggestedMeals: Array<{
    name: string;
    desc: string;
    calories: number;
    benefits: string;
    culturalTag?: string;
  }>;
}

export interface FitnessData {
  workoutsThisWeek: number;
  weeklyGoal: number;
  activeMinutesToday: number;
  walkingMinutes: number;
  strengthMinutes: number;
  caloriesBurned: number;
  suggestedMovement: {
    title: string;
    duration: string;
    intensity: 'low' | 'moderate' | 'restorative';
    reason: string;
    phaseAlignment: string;
  };
}

export interface MedicalReportItem {
  id: string;
  title: string;
  date: string;
  type: 'ultrasound' | 'hormone_panel' | 'vitamin_d' | 'glucose' | 'other';
  status: 'reviewed' | 'uploaded' | 'pending_review';
  summary?: string;
  keyBiomarker?: string;
}

export interface CareCircleContact {
  id: string;
  name: string;
  role: 'doctor' | 'family' | 'caregiver';
  specialty?: string;
  avatar?: string;
  accessLevel: 'full' | 'summary_only' | 'limited';
  nextAppointment?: string;
  permissions: {
    symptoms: boolean;
    reports: boolean;
    medications: boolean;
    dietFitness: boolean;
    privateNotes: boolean;
  };
}

export interface HealthPatternPoint {
  date: string;
  dayLabel: string;
  cyclePhase: 'period' | 'follicular' | 'ovulation' | 'luteal';
  symptomScore: number; // 0 to 10
  activityMinutes: number;
  sleepHours: number;
  nutritionAdherence: number; // percentage
}

export interface DigitalTwinInsight {
  headline: string;
  summary: string;
  highlights: string[];
  detectedPatterns: string[];
  suggestedChatPrompt: string;
}
