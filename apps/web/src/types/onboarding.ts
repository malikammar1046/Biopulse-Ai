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

export type UserGender = 'female' | 'male' | 'other' | 'prefer_not_to_say';
export type HealthPathway = 'female' | 'male' | 'general';

export interface MensHealthProfile {
  // Marriage, Kids & Intimacy (Patient-friendly clinical context)
  maritalStatus?: 'unmarried' | 'married';
  marriageYears?: number;
  hasKids?: boolean;
  kidsCount?: number;
  tryingToConceive?: boolean;
  intimacyFrequency?: 'regular' | 'occasional' | 'rare' | 'none';
  intimacySatisfaction?: 'satisfied' | 'mild_concerns' | 'significant_difficulty';

  // Screening symptoms (patient-friendly non-diagnostic language)
  energyLevel: 'high' | 'moderate' | 'low' | 'very_low'; // "Low energy"
  sexDrive: 'normal' | 'reduced' | 'significantly_reduced'; // "Sex drive"
  erectileDifficulties: 'none' | 'occasional' | 'frequent';
  muscleStrengthChanges: 'stable' | 'reduced' | 'significantly_reduced';
  bodyHairChanges: 'no_change' | 'thinning' | 'reduced_growth';
  moodChanges: string[]; // e.g. ['Low Motivation', 'Irritability', 'Brain Fog']
  sleepQuality: 'restful' | 'frequently_waking' | 'poor';
  // Relevant clinical history & medication context
  hadTestosteroneTest?: 'no' | 'yes' | 'unsure';
  testosteroneValue?: number | null; // ng/dL or nmol/L
  testosteroneUnit?: 'ng/dL' | 'nmol/L';
  testDrawTime?: 'morning_fasting' | 'afternoon' | 'unsure';
  priorMedications?: string[]; // e.g. 'Prescription Opioids', 'Steroids / Testosterone Therapy', 'None'
  primaryConcern?: string;
  adamResponses?: Record<string, boolean | null>;
  adamScore?: number;
}

export interface GeneralHealthProfile {
  primaryFocus: string[];
  energyPatterns: string;
  stressLevel: 'low' | 'moderate' | 'high';
}

export interface UserProfile {
  // Required Personal Identifiers
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender?: UserGender;
  pathway?: HealthPathway;
  preferredLanguage?: 'en' | 'ur';

  // Optional Personal & Biometric Attributes
  avatarUrl?: string;
  heightCm?: number | null; // e.g. 165
  weightKg?: number | null; // e.g. 62
  waistCm?: number | null; // e.g. 85

  // Status & Timestamps
  isOnboarded: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Domain Sub-Profiles
  emergencyContacts: EmergencyContact[];
  medical: MedicalProfile;
  womensHealth: WomensHealthProfile;
  mensHealth?: MensHealthProfile;
  generalHealth?: GeneralHealthProfile;
  lifestyle: LifestyleProfile;
  goals: HealthGoals;
}

/**
 * Resolves a reliable HealthPathway from user profile attributes.
 * Defaults to 'female' (the flagship OvaSense clinical pathway) instead of 'general'.
 */
export function resolvePathway(
  gender?: string | null,
  pathway?: string | null,
  fallbackDefault: HealthPathway = 'female'
): HealthPathway {
  if (pathway === 'female' || pathway === 'male' || pathway === 'general') {
    return pathway;
  }
  if (gender === 'female') return 'female';
  if (gender === 'male') return 'male';
  if (gender === 'other' || gender === 'prefer_not_to_say') return 'general';
  return fallbackDefault;
}

