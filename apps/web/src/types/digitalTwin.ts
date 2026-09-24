/**
 * OvaSense — Digital Twin Structured Data Types
 *
 * Represents the structured patient health state on the application side.
 * Conceptual structure:
 *   Patient
 *   ├── Profile
 *   ├── Symptoms
 *   ├── Cycle Data
 *   ├── Lifestyle
 *   ├── Diet
 *   ├── Fitness
 *   ├── Medications
 *   ├── Reports
 *   ├── Assessments
 *   └── Health History
 *
 * Note: The Digital Twin is NOT an AI model; it is the structured representation
 * of patient physiology that can be consumed by AI and clinical intelligence layers.
 */

export interface DigitalTwinProfileNode {
  fullName: string;
  ageYears?: number;
  heightCm?: number;
  weightKg?: number;
  calculatedBmi?: number;
  bloodType?: string;
  isPregnant?: boolean;
}

export interface DigitalTwinSymptomsNode {
  totalLogged30Days: number;
  frequentSymptoms: Array<{ name: string; count: number; typicalSeverity: string }>;
  severeSymptomsRecent: string[];
  lastLoggedDate?: string;
}

export interface DigitalTwinCycleNode {
  currentCycleDay: number;
  currentPhase: string;
  estrogenProgesteroneState: string;
  regularityStatus: string;
  averageCycleLengthDays: number;
  lastPeriodStartDate?: string;
  historicalCycleCount: number;
}

export interface DigitalTwinLifestyleNode {
  averageSleepHours: number;
  sleepAdherence: 'optimal' | 'below_target' | 'above_target' | 'untracked';
  dailyWaterAdherencePercent: number;
  stressLevelReported?: string;
  activityLevel: string;
}

export interface DigitalTwinDietNode {
  dietaryPreference: string;
  totalLoggedMeals30Days: number;
  fastFoodFrequency: string;
  averageDailyCaloriesLogged?: number;
}

export interface DigitalTwinFitnessNode {
  workoutsThisWeek: number;
  weeklyTargetMinutes: number;
  activeMinutesLogged7Days: number;
  preferredActivities: string[];
}

export interface DigitalTwinMedicationsNode {
  activeCount: number;
  activeMedications: Array<{ name: string; dosage: string; frequency: string }>;
  adherenceRate30DaysPercent: number;
}

export interface DigitalTwinReportsNode {
  totalReportsCount: number;
  verifiedBiomarkersCount: number;
  pendingVerificationCount: number;
  latestReportDate?: string;
  keyBiomarkersSummary: Array<{
    testName: string;
    resultValue: string;
    unit?: string;
    referenceRange?: string;
    status: string;
    userVerified: boolean;
  }>;
}

export interface DigitalTwinAssessmentsNode {
  latestCategory?: string;
  statisticalScreeningProbability?: number;
  topInfluencingFactors?: string[];
  lastAssessmentTimestamp?: string;
  questionnaireCompleted: boolean;
}

export interface DigitalTwinHistoryNode {
  trackingSpanDays: number;
  totalEventsLogged: number;
  lastActiveDate: string;
}

export interface DigitalTwinState {
  patientId: string;
  generatedAt: string;
  profile: DigitalTwinProfileNode;
  symptoms: DigitalTwinSymptomsNode;
  cycle: DigitalTwinCycleNode;
  lifestyle: DigitalTwinLifestyleNode;
  diet: DigitalTwinDietNode;
  fitness: DigitalTwinFitnessNode;
  medications: DigitalTwinMedicationsNode;
  reports: DigitalTwinReportsNode;
  assessments: DigitalTwinAssessmentsNode;
  history: DigitalTwinHistoryNode;
}
