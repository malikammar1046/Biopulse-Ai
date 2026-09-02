export interface EmergencyContact {
  id?: string;
  name: string; // REQUIRED
  relationship: string; // REQUIRED
  phone: string; // REQUIRED
  isPrimary: boolean;
}

export interface MedicationItem {
  id: string;
  name: string; // REQUIRED
  dosage: string; // OPTIONAL
  frequency: string; // OPTIONAL
  timeOfDay?: string; // OPTIONAL
  takenToday?: boolean; // OPTIONAL
}

export interface MedicalProfile {
  bloodType: string; // OPTIONAL (e.g. 'A+', 'B+', 'O+', 'Not Sure', or '')
  allergies: string[]; // OPTIONAL (defaults to [] or ['None'])
  medications: MedicationItem[]; // OPTIONAL (defaults to [])
  conditions: string[]; // OPTIONAL (defaults to [] or ['None'])
  surgeries: string[]; // OPTIONAL (defaults to [])
  familyHistory: string[]; // OPTIONAL (defaults to [])
}

export interface WomensHealthProfile {
  cycleLength: number | 'irregular'; // REQUIRED (e.g. 28 or 'irregular')
  lastPeriodDate: string; // REQUIRED / OPTIONAL (YYYY-MM-DD)
  periodRegularity: 'very_regular' | 'mostly_regular' | 'sometimes_irregular' | 'often_irregular' | 'not_sure'; // REQUIRED
  periodDuration: number; // REQUIRED (e.g. 5 days)
  commonSymptoms: string[]; // OPTIONAL (e.g. 'Acne & Facial Breakouts', 'Excess Facial / Body Hair', 'Skin Darkening', 'Hair Thinning / Loss', 'Recent Weight Gain')
  currentCycleDay: number; // CALCULATED / STORED
  currentPhase: 'period' | 'follicular' | 'ovulation' | 'luteal'; // CALCULATED / STORED
  // ML Model Clinical & Reproductive Indicators
  maritalStatus?: 'unmarried' | 'married' | 'prefer_not_to_say'; // REQUIRED for ML (default: 'unmarried')
  marriageYears?: number; // REQUIRED for ML (0 if unmarried, or years married)
  isPregnant?: boolean; // REQUIRED for ML (true / false)
  abortionsCount?: number; // REQUIRED for ML (0, 1, 2... prior pregnancy losses)
}

export interface LifestyleProfile {
  dietaryPreference: string; // REQUIRED (e.g. 'Non-Vegetarian / Halal', 'Vegetarian', 'Vegan', etc.)
  dailyWaterGlasses: number; // REQUIRED (e.g. 8)
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active'; // REQUIRED
  exercisePreferences: string[]; // OPTIONAL
  sleepHours: number; // REQUIRED (e.g. 7.5)
  workLifestyle?: string; // OPTIONAL
  // ML Model Lifestyle Indicators
  fastFoodIntake?: 'frequent' | 'occasional' | 'rare_never'; // REQUIRED for ML
  regularExercise?: boolean; // REQUIRED for ML (true / false)
}

export interface HealthGoals {
  selectedGoals: string[]; // REQUIRED (at least 1 recommended)
  supportPreference: 'gentle_nudges' | 'structured_weekly' | 'daily_coaching'; // REQUIRED
}

export interface UserProfile {
  // Required Personal Identifiers
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD

  // Optional Personal & Biometric Attributes
  avatarUrl?: string;
  heightCm?: number | null; // e.g. 165
  weightKg?: number | null; // e.g. 62

  // Status & Timestamps
  isOnboarded: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Domain Sub-Profiles
  emergencyContacts: EmergencyContact[];
  medical: MedicalProfile;
  womensHealth: WomensHealthProfile;
  lifestyle: LifestyleProfile;
  goals: HealthGoals;
}

