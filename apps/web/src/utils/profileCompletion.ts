import type { UserProfile } from '../types/onboarding';

export interface MissingFieldItem {
  id: string;
  label: string;
  section: string;
  stepNumber: number;
  actionText: string;
  isRequired: boolean;
}

export interface ProfileCompletionResult {
  percentage: number; // 0 to 100
  isComplete: boolean;
  score: number;
  maxScore: number;
  missingFields: MissingFieldItem[];
  nextAction: MissingFieldItem | null;
  sectionScores: Record<string, { earned: number; total: number; percentage: number }>;
}

/**
 * Calculates current age in years given a YYYY-MM-DD date string.
 */
export function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 0 && age <= 120 ? age : null;
}

/**
 * Computes dynamic time-of-day greeting (e.g. "Good morning, Jane")
 */
export function getTimeBasedGreeting(fullName?: string): string {
  const hour = new Date().getHours();
  let timeOfDay = 'morning';

  if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 || hour < 4) {
    timeOfDay = 'evening';
  }

  const firstName = fullName?.trim() ? fullName.trim().split(' ')[0] : '';
  if (!firstName) return `Good ${timeOfDay}`;
  return `Good ${timeOfDay}, ${firstName}`;
}

export interface CycleMetricsResult {
  hasLoggedPeriod: boolean;
  cycleDay: number;
  totalCycleDays: number;
  phaseKey: 'period' | 'follicular' | 'ovulation' | 'luteal';
  phaseName: string;
  nextPeriodDays: number;
  nextPeriodDate: string;
  phaseDescription: string;
}

/**
 * Dynamically computes cycle day, current biological phase, and estimated next period date
 */
export function calculateCycleMetrics(
  lastPeriodDate?: string,
  cycleLength: number | 'irregular' = 28,
  periodDuration: number = 5
): CycleMetricsResult {
  const totalCycleDays = typeof cycleLength === 'number' ? cycleLength : 28;
  const safeDuration = Math.max(1, Math.min(periodDuration, 10));

  if (!lastPeriodDate) {
    return {
      hasLoggedPeriod: false,
      cycleDay: 1,
      totalCycleDays,
      phaseKey: 'follicular',
      phaseName: 'Cycle Baseline Setup',
      nextPeriodDays: totalCycleDays,
      nextPeriodDate: 'Date not recorded yet',
      phaseDescription: 'Log your last menstrual period date to activate real-time hormone and cycle predictions.',
    };
  }

  const lastDate = new Date(lastPeriodDate);
  if (isNaN(lastDate.getTime())) {
    return {
      hasLoggedPeriod: false,
      cycleDay: 1,
      totalCycleDays,
      phaseKey: 'follicular',
      phaseName: 'Follicular Phase',
      nextPeriodDays: totalCycleDays,
      nextPeriodDate: 'Date not recorded yet',
      phaseDescription: 'Log your last menstrual period date to track cycle patterns.',
    };
  }

  const today = new Date();
  // Reset timestamps to midnight for pure calendar day differences
  const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffMs = todayMidnight.getTime() - lastMidnight.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const cycleDay = (diffDays % totalCycleDays) + 1;
  const midpoint = Math.floor(totalCycleDays / 2);

  let phaseKey: 'period' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
  let phaseName = 'Follicular Phase';
  let phaseDescription = 'Rising estrogen stimulates follicle maturation and steady energy.';

  if (cycleDay <= safeDuration) {
    phaseKey = 'period';
    phaseName = 'Menstrual Phase';
    phaseDescription = 'Uterine shedding and baseline estrogen & progesterone levels. Rest and gentle hydration recommended.';
  } else if (cycleDay < midpoint) {
    phaseKey = 'follicular';
    phaseName = 'Follicular Phase';
    phaseDescription = 'Estrogen is naturally rising. Ideal for creative focus, strength training, and insulin sensitivity.';
  } else if (cycleDay >= midpoint && cycleDay <= midpoint + 1) {
    phaseKey = 'ovulation';
    phaseName = 'Ovulation Window';
    phaseDescription = 'LH surge triggers mature follicle release. Peak energy and fertile window.';
  } else {
    phaseKey = 'luteal';
    phaseName = 'Luteal Phase';
    phaseDescription = 'Progesterone dominance supports uterine lining. Calorie-dense complex carbs and restorative movement recommended.';
  }

  const nextPeriodDays = Math.max(1, totalCycleDays - cycleDay + 1);
  const nextDateObj = new Date(todayMidnight.getTime() + nextPeriodDays * 24 * 60 * 60 * 1000);
  const nextPeriodDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(nextDateObj);

  return {
    hasLoggedPeriod: true,
    cycleDay,
    totalCycleDays,
    phaseKey,
    phaseName,
    nextPeriodDays,
    nextPeriodDate,
    phaseDescription,
  };
}

/**
 * Reusable weighted profile completion calculator.
 * Strictly adheres to non-diagnostic terminology and required/optional demarcations.
 */
export function calculateProfileCompletion(profile: UserProfile): ProfileCompletionResult {
  const missingFields: MissingFieldItem[] = [];

  let personalScore = 0;
  const personalTotal = 20;
  if (profile.fullName?.trim()) personalScore += 5;
  else missingFields.push({ id: 'fullName', label: 'Full Name', section: 'Personal', stepNumber: 1, actionText: 'Add full name', isRequired: true });

  if (profile.email?.trim()) personalScore += 5;
  else missingFields.push({ id: 'email', label: 'Email Address', section: 'Personal', stepNumber: 1, actionText: 'Add email', isRequired: true });

  if (profile.phone?.trim()) personalScore += 5;
  else missingFields.push({ id: 'phone', label: 'Phone Number', section: 'Personal', stepNumber: 1, actionText: 'Add phone number', isRequired: true });

  if (profile.dateOfBirth?.trim()) personalScore += 3;
  else missingFields.push({ id: 'dateOfBirth', label: 'Date of Birth', section: 'Personal', stepNumber: 1, actionText: 'Add date of birth', isRequired: true });

  if (profile.heightCm && profile.weightKg) personalScore += 2;
  else if (!profile.heightCm || !profile.weightKg) {
    missingFields.push({ id: 'measurements', label: 'Height & Weight', section: 'Personal', stepNumber: 1, actionText: 'Add height and weight', isRequired: false });
  }

  let emergencyScore = 0;
  const emergencyTotal = 15;
  const primaryContact = profile.emergencyContacts?.[0];
  if (primaryContact?.name?.trim() && primaryContact?.phone?.trim()) {
    emergencyScore += 12;
  } else {
    missingFields.push({ id: 'primaryContact', label: 'Primary Emergency Contact', section: 'Emergency & Safety', stepNumber: 2, actionText: 'Add emergency contact', isRequired: true });
  }
  if (profile.emergencyContacts?.length > 1 && profile.emergencyContacts[1]?.name?.trim()) {
    emergencyScore += 3;
  }

  let womensHealthScore = 0;
  const womensHealthTotal = 25;
  if (profile.womensHealth?.cycleLength) womensHealthScore += 8;
  else missingFields.push({ id: 'cycleLength', label: 'Cycle Length', section: "Women's Health", stepNumber: 4, actionText: 'Set average cycle length', isRequired: true });

  if (profile.womensHealth?.lastPeriodDate?.trim()) womensHealthScore += 8;
  else missingFields.push({ id: 'lastPeriodDate', label: 'Last Period Date', section: "Women's Health", stepNumber: 4, actionText: 'Record last period start date', isRequired: true });

  if (profile.womensHealth?.periodRegularity) womensHealthScore += 5;
  else missingFields.push({ id: 'periodRegularity', label: 'Cycle Regularity', section: "Women's Health", stepNumber: 4, actionText: 'Specify period regularity', isRequired: true });

  if (profile.womensHealth?.commonSymptoms?.length > 0) womensHealthScore += 4;
  else missingFields.push({ id: 'commonSymptoms', label: 'Common Symptoms', section: "Women's Health", stepNumber: 4, actionText: 'Record common symptoms', isRequired: false });

  let medicalScore = 0;
  const medicalTotal = 15;
  if (profile.medical?.bloodType && profile.medical.bloodType !== 'Not Sure' && profile.medical.bloodType !== '') {
    medicalScore += 5;
  } else {
    missingFields.push({ id: 'bloodType', label: 'Blood Type', section: 'Medical History', stepNumber: 3, actionText: 'Add blood type', isRequired: false });
  }

  if (profile.medical?.allergies && profile.medical.allergies.length > 0) {
    medicalScore += 3;
  } else {
    missingFields.push({ id: 'allergies', label: 'Allergies', section: 'Medical History', stepNumber: 3, actionText: 'Record known allergies', isRequired: false });
  }

  if (profile.medical?.medications && profile.medical.medications.length > 0) {
    medicalScore += 4;
  } else {
    missingFields.push({ id: 'medications', label: 'Medications & Supplements', section: 'Medical History', stepNumber: 3, actionText: 'Add medications or supplements', isRequired: false });
  }

  if (profile.medical?.conditions && profile.medical.conditions.length > 0) {
    medicalScore += 3;
  }

  let lifestyleScore = 0;
  const lifestyleTotal = 15;
  if (profile.lifestyle?.dietaryPreference) lifestyleScore += 4;
  else missingFields.push({ id: 'dietaryPreference', label: 'Dietary Preference', section: 'Lifestyle', stepNumber: 5, actionText: 'Choose dietary preference', isRequired: true });

  if (profile.lifestyle?.dailyWaterGlasses > 0) lifestyleScore += 4;
  else missingFields.push({ id: 'dailyWaterGlasses', label: 'Daily Hydration Target', section: 'Lifestyle', stepNumber: 5, actionText: 'Set hydration target', isRequired: true });

  if (profile.lifestyle?.activityLevel) lifestyleScore += 4;
  else missingFields.push({ id: 'activityLevel', label: 'Activity Level', section: 'Lifestyle', stepNumber: 5, actionText: 'Set physical activity baseline', isRequired: true });

  if (profile.lifestyle?.sleepHours > 0) lifestyleScore += 3;

  let goalsScore = 0;
  const goalsTotal = 10;
  if (profile.goals?.selectedGoals?.length > 0) goalsScore += 7;
  else missingFields.push({ id: 'selectedGoals', label: 'Health Goals', section: 'Goals', stepNumber: 6, actionText: 'Select health priorities', isRequired: true });

  if (profile.goals?.supportPreference) goalsScore += 3;

  const totalScore = personalScore + emergencyScore + womensHealthScore + medicalScore + lifestyleScore + goalsScore;
  const maxTotalScore = personalTotal + emergencyTotal + womensHealthTotal + medicalTotal + lifestyleTotal + goalsTotal;
  const percentage = Math.min(100, Math.max(0, Math.round((totalScore / maxTotalScore) * 100)));

  // Pick top priority missing action (required first, then optional)
  const requiredMissing = missingFields.find((m) => m.isRequired);
  const nextAction = requiredMissing || missingFields[0] || null;

  return {
    percentage,
    isComplete: percentage >= 95,
    score: totalScore,
    maxScore: maxTotalScore,
    missingFields,
    nextAction,
    sectionScores: {
      personal: { earned: personalScore, total: personalTotal, percentage: Math.round((personalScore / personalTotal) * 100) },
      emergency: { earned: emergencyScore, total: emergencyTotal, percentage: Math.round((emergencyScore / emergencyTotal) * 100) },
      womensHealth: { earned: womensHealthScore, total: womensHealthTotal, percentage: Math.round((womensHealthScore / womensHealthTotal) * 100) },
      medical: { earned: medicalScore, total: medicalTotal, percentage: Math.round((medicalScore / medicalTotal) * 100) },
      lifestyle: { earned: lifestyleScore, total: lifestyleTotal, percentage: Math.round((lifestyleScore / lifestyleTotal) * 100) },
      goals: { earned: goalsScore, total: goalsTotal, percentage: Math.round((goalsScore / goalsTotal) * 100) },
    },
  };
}
