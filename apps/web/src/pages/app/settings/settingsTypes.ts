import type { LucideIcon } from 'lucide-react';
import {
  User,
  HeartPulse,
  Activity,
  Utensils,
  Target,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type { UserProfile } from '../../../types/onboarding';

export type SettingsTabId =
  | 'personal'
  | 'health'
  | 'screening'
  | 'lifestyle'
  | 'nutrition'
  | 'goals'
  | 'account';

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  isPathwaySpecific?: boolean;
}

export function getSettingsTabs(isMale: boolean): SettingsTabItem[] {
  return [
    {
      id: 'personal',
      label: 'Personal Information',
      description: 'Identity, demographics & biometrics',
      icon: User,
    },
    {
      id: 'health',
      label: 'Health Profile',
      description: 'Medical history, conditions & vitals',
      icon: HeartPulse,
    },
    {
      id: 'screening',
      label: isMale ? 'Male Hormonal Health' : 'PCOS Screening Profile',
      description: isMale
        ? 'ADAM symptoms & metabolic markers'
        : 'Cycle, symptoms & reproductive history',
      icon: isMale ? Activity : Calendar,
      isPathwaySpecific: true,
    },
    {
      id: 'lifestyle',
      label: 'Lifestyle & Habits',
      description: 'Activity, exercise, sleep & routines',
      icon: Activity,
    },
    {
      id: 'nutrition',
      label: 'Nutrition Preferences',
      description: 'Dietary habits, allergies & readiness',
      icon: Utensils,
    },
    {
      id: 'goals',
      label: 'Goals & Preferences',
      description: 'Health focus & coaching cadence',
      icon: Target,
    },
    {
      id: 'account',
      label: 'Account & Privacy',
      description: 'Security, contacts & data controls',
      icon: ShieldCheck,
    },
  ];
}

/**
 * Checks if a specific field modification impacts the active screening assessment model.
 */
export function isAssessmentField(fieldPath: string, isMale: boolean): boolean {
  const universal = ['dateOfBirth', 'heightCm', 'weightKg'];
  if (universal.includes(fieldPath)) return true;

  if (isMale) {
    const maleFields = [
      'waistCm',
      'mensHealth.energyLevel',
      'mensHealth.sleepQuality',
      'mensHealth.sexDrive',
      'mensHealth.moodChanges',
      'mensHealth.muscleStrengthChanges',
      'mensHealth.erectileDifficulties',
      'mensHealth.bodyHairChanges',
      'lifestyle.sleepHours',
      'medical.conditions',
    ];
    return maleFields.includes(fieldPath);
  } else {
    const femaleFields = [
      'womensHealth.periodRegularity',
      'womensHealth.cycleLength',
      'womensHealth.commonSymptoms',
      'womensHealth.isPregnant',
      'womensHealth.abortionsCount',
      'lifestyle.fastFoodIntake',
      'lifestyle.regularExercise',
    ];
    return femaleFields.includes(fieldPath);
  }
}

/**
 * Determines whether any assessment-relevant fields differ between draft and saved profile.
 */
export function hasAssessmentRelevantEdits(
  draft: UserProfile,
  saved: UserProfile,
  isMale: boolean
): boolean {
  // Universal biometrics
  if (draft.dateOfBirth !== saved.dateOfBirth) return true;
  if (draft.heightCm !== saved.heightCm) return true;
  if (draft.weightKg !== saved.weightKg) return true;

  if (isMale) {
    if (draft.waistCm !== saved.waistCm) return true;
    if (draft.lifestyle?.sleepHours !== saved.lifestyle?.sleepHours) return true;

    const dm = draft.mensHealth;
    const sm = saved.mensHealth;
    if (dm?.energyLevel !== sm?.energyLevel) return true;
    if (dm?.sleepQuality !== sm?.sleepQuality) return true;
    if (dm?.sexDrive !== sm?.sexDrive) return true;
    if (dm?.muscleStrengthChanges !== sm?.muscleStrengthChanges) return true;
    if (dm?.erectileDifficulties !== sm?.erectileDifficulties) return true;
    if (dm?.bodyHairChanges !== sm?.bodyHairChanges) return true;

    const dmFactors = JSON.stringify(dm?.moodChanges || []);
    const smFactors = JSON.stringify(sm?.moodChanges || []);
    if (dmFactors !== smFactors) return true;

    const dCond = JSON.stringify(draft.medical?.conditions || []);
    const sCond = JSON.stringify(saved.medical?.conditions || []);
    if (dCond !== sCond) return true;
  } else {
    const dw = draft.womensHealth;
    const sw = saved.womensHealth;
    if (dw?.periodRegularity !== sw?.periodRegularity) return true;
    if (dw?.cycleLength !== sw?.cycleLength) return true;
    if (dw?.isPregnant !== sw?.isPregnant) return true;
    if (dw?.abortionsCount !== sw?.abortionsCount) return true;

    const dwSymptoms = JSON.stringify(dw?.commonSymptoms || []);
    const swSymptoms = JSON.stringify(sw?.commonSymptoms || []);
    if (dwSymptoms !== swSymptoms) return true;

    if (draft.lifestyle?.fastFoodIntake !== saved.lifestyle?.fastFoodIntake) return true;
    if (draft.lifestyle?.regularExercise !== saved.lifestyle?.regularExercise) return true;
  }

  return false;
}

export interface ProfileCompleteness {
  percentage: number;
  basicComplete: boolean;
  symptomsComplete: boolean;
  lifestyleComplete: boolean;
  specificComplete: boolean;
  missingRequired: string[];
}

/**
 * Calculates genuine completeness percentage based on required and high-value clinical fields.
 */
export function calculateProfileCompleteness(
  profile: UserProfile,
  isMale: boolean
): ProfileCompleteness {
  const missingRequired: string[] = [];

  // 1. Basic Info (4 points)
  let basicScore = 0;
  if (profile.fullName && profile.fullName.trim()) basicScore += 1;
  else missingRequired.push('Full Name');

  if (profile.dateOfBirth && profile.dateOfBirth.trim()) basicScore += 1;
  else missingRequired.push('Date of Birth');

  if (profile.heightCm && profile.heightCm > 0) basicScore += 1;
  else missingRequired.push('Height');

  if (profile.weightKg && profile.weightKg > 0) basicScore += 1;
  else missingRequired.push('Weight');

  const basicComplete = basicScore === 4;

  // 2. Pathway Specific (4 points)
  let specificScore = 0;
  if (isMale) {
    if (profile.waistCm && profile.waistCm > 0) specificScore += 1;
    if (profile.mensHealth?.energyLevel) specificScore += 1;
    else missingRequired.push('Energy Level');

    if (profile.mensHealth?.sexDrive) specificScore += 1;
    else missingRequired.push('Libido / Sex Drive');

    if (profile.mensHealth?.sleepQuality) specificScore += 1;
    else missingRequired.push('Sleep Quality');
  } else {
    if (profile.womensHealth?.periodRegularity) specificScore += 1;
    else missingRequired.push('Cycle Regularity');

    if (profile.womensHealth?.cycleLength !== undefined) specificScore += 1;
    else missingRequired.push('Cycle Length');

    if (profile.womensHealth?.commonSymptoms && profile.womensHealth.commonSymptoms.length > 0) specificScore += 1;
    if (profile.womensHealth?.isPregnant !== undefined) specificScore += 1;
  }
  const specificComplete = specificScore >= 3;

  // 3. Symptoms / Clinical Baseline (3 points)
  let symptomScore = 0;
  if (profile.medical?.bloodType) symptomScore += 1;
  if (profile.medical?.conditions && profile.medical.conditions.length > 0) symptomScore += 1;
  if (profile.medical?.allergies && profile.medical.allergies.length > 0) symptomScore += 1;
  const symptomsComplete = symptomScore >= 2;

  // 4. Lifestyle & Nutrition (3 points)
  let lifestyleScore = 0;
  if (profile.lifestyle?.activityLevel) lifestyleScore += 1;
  if (profile.lifestyle?.sleepHours && profile.lifestyle.sleepHours > 0) lifestyleScore += 1;
  if (profile.lifestyle?.dietaryPreference) lifestyleScore += 1;
  const lifestyleComplete = lifestyleScore >= 2;

  const totalPoints = basicScore + specificScore + symptomScore + lifestyleScore;
  const maxPoints = 14;
  const percentage = Math.min(100, Math.round((totalPoints / maxPoints) * 100));

  return {
    percentage,
    basicComplete,
    symptomsComplete,
    lifestyleComplete,
    specificComplete,
    missingRequired,
  };
}
