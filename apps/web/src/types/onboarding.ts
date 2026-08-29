export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay?: string;
  takenToday?: boolean;
}

export interface MedicalProfile {
  bloodType: string;
  allergies: string[];
  medications: MedicationItem[];
  conditions: string[];
  surgeries: string[];
  familyHistory: string[];
}

export interface WomensHealthProfile {
  cycleLength: number | 'irregular';
  lastPeriodDate: string;
  periodRegularity: 'very_regular' | 'mostly_regular' | 'sometimes_irregular' | 'often_irregular' | 'not_sure';
  periodDuration: number;
  commonSymptoms: string[];
  currentCycleDay: number;
  currentPhase: 'period' | 'follicular' | 'ovulation' | 'luteal';
}

export interface LifestyleProfile {
  dietaryPreference: string;
  dailyWaterGlasses: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  exercisePreferences: string[];
  sleepHours: number;
  workLifestyle?: string;
}

export interface HealthGoals {
  selectedGoals: string[];
  supportPreference: 'gentle_nudges' | 'structured_weekly' | 'daily_coaching';
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  avatarUrl?: string;
  isOnboarded: boolean;
  emergencyContacts: EmergencyContact[];
  medical: MedicalProfile;
  womensHealth: WomensHealthProfile;
  lifestyle: LifestyleProfile;
  goals: HealthGoals;
}
