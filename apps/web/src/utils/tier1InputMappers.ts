import type { UserProfile } from '../types/onboarding';

/**
 * Calculates patient age safely from an ISO date of birth string.
 * Defaults to medical reference baseline if date is absent or malformed.
 */
export function calculateAgeFromDob(dob?: string | null, fallbackAge?: number | null): number | null {
  if (!dob) return fallbackAge !== undefined ? fallbackAge : null;
  try {
    const trimmed = dob.trim();
    const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return fallbackAge !== undefined ? fallbackAge : null;

    const birthYear = parseInt(match[1], 10);
    const birthMonth = parseInt(match[2], 10);
    const birthDay = parseInt(match[3], 10);

    const testDate = new Date(birthYear, birthMonth - 1, birthDay);
    if (
      testDate.getFullYear() !== birthYear ||
      testDate.getMonth() !== birthMonth - 1 ||
      testDate.getDate() !== birthDay
    ) {
      return fallbackAge !== undefined ? fallbackAge : null;
    }

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Check future date
    if (
      birthYear > todayYear ||
      (birthYear === todayYear && birthMonth > todayMonth) ||
      (birthYear === todayYear && birthMonth === todayMonth && birthDay > todayDay)
    ) {
      return fallbackAge !== undefined ? fallbackAge : null;
    }

    let age = todayYear - birthYear;
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
      age--;
    }
    return age >= 0 && age < 120 ? age : (fallbackAge !== undefined ? fallbackAge : null);
  } catch {
    return fallbackAge !== undefined ? fallbackAge : null;
  }
}

/**
 * Canonical mapper for Female Tier 1 PCOS inputs.
 * Aligns strictly with PCOS-ML 16-feature ExtraTrees model requirements.
 */
export function deriveFemaleTier1InputsFromProfile(
  profile: Partial<UserProfile> | null | undefined
): Record<string, any> {
  if (!profile) return {};

  const age = calculateAgeFromDob(profile.dateOfBirth, 25);
  const heightCm = Number(profile.heightCm) || 165;
  const weightKg = Number(profile.weightKg) || 62;
  const waistCm = Number(profile.waistCm) || 76;
  const waistInch = waistCm ? Math.round((waistCm / 2.54) * 10) / 10 : 30.0;
  const hipInch = 37.0; // standard clinical population median

  const symptoms = (profile.womensHealth?.commonSymptoms || []).map((s) => String(s).toLowerCase());
  const hirsutism = symptoms.some((s) => s.includes('hair') || s.includes('hirsutism')) ? 1 : 0;
  const skinDarkening = symptoms.some((s) => s.includes('dark') || s.includes('acanthosis')) ? 1 : 0;
  const hairLoss = symptoms.some((s) => s.includes('loss') || s.includes('thinning') || s.includes('alopecia')) ? 1 : 0;
  const pimplesAcne = symptoms.some((s) => s.includes('acne') || s.includes('pimple')) ? 1 : 0;
  const weightGain = symptoms.some((s) => s.includes('weight') || s.includes('gain')) ? 1 : 0;

  const fastFoodStr = String(profile.lifestyle?.fastFoodIntake || '').toLowerCase();
  const fastFood = ['frequent', 'daily', 'often'].includes(fastFoodStr) ? 1 : 0;
  const regularExercise = profile.lifestyle?.regularExercise !== false ? 1 : 0;

  const periodRegStr = String(profile.womensHealth?.periodRegularity || '').toLowerCase();
  const cycleRegularity = periodRegStr.includes('irreg') || periodRegStr.includes('vary') ? 1 : 0;
  const cycleLength = Number(profile.womensHealth?.cycleLength) || 28;

  const marriageYears = Number(profile.womensHealth?.marriageYears) || 0;
  const pregnancy = profile.womensHealth?.isPregnant ? 1 : 0;
  const abortions = Number(profile.womensHealth?.abortionsCount) || 0;

  return {
    age,
    height_cm: heightCm,
    weight_kg: weightKg,
    waist_inch: waistInch,
    hip_inch: hipInch,
    cycle_length_raw: cycleLength,
    cycle_regularity: cycleRegularity,
    hirsutism,
    skin_darkening: skinDarkening,
    hair_loss: hairLoss,
    pimples_acne: pimplesAcne,
    weight_gain: weightGain,
    fast_food: fastFood,
    regular_exercise: regularExercise,
    marriage_years: marriageYears,
    pregnancy,
    abortions,
  };
}

/**
 * Canonical mapper for Male Tier 1 Hypogonadism inputs.
 * Aligns strictly with Male-ML Tier 1 Logistic Regression / ADAM questionnaire requirements.
 */
export function deriveMaleTier1InputsFromProfile(
  profile: Partial<UserProfile> | null | undefined
): Record<string, any> {
  if (!profile) return {};

  // Age: NEVER fabricate 35. If DOB is absent or invalid, pass null so backend flags as unavailable.
  const age = calculateAgeFromDob(profile.dateOfBirth, null);
  const heightCm = Number(profile.heightCm) || 178;
  const weightKg = Number(profile.weightKg) || 80;

  // Waist circumference: NEVER default to 88 cm. If omitted or not answered,
  // pass null so backend leaves it NaN and SimpleImputer uses learned median (97.0 cm).
  const waistCm =
    profile.waistCm !== undefined &&
    profile.waistCm !== null &&
    !isNaN(Number(profile.waistCm)) &&
    Number(profile.waistCm) > 0
      ? Number(profile.waistCm)
      : null;

  const conds = (profile.medical?.conditions || []).join(' ').toLowerCase();
  const isHbp = conds.includes('hypertension') || conds.includes('blood pressure') ? 1 : 0;
  const isDm = conds.includes('diabetes') || conds.includes('insulin resistance') ? 1 : 0;

  const adam = profile.mensHealth?.adamResponses || {};
  const lowEnergy =
    adam.adam_q2 === true ||
    profile.mensHealth?.energyLevel === 'low' ||
    profile.mensHealth?.energyLevel === 'very_low'
      ? 1
      : 0;
  const sleepQuality = String(profile.mensHealth?.sleepQuality || '');
  const sleepTrouble =
    adam.adam_q9 === true ||
    sleepQuality === 'poor' ||
    sleepQuality === 'fair' ||
    sleepQuality === 'frequently_waking'
      ? 1
      : 0;
  const lowMood =
    adam.adam_q6 === true ||
    adam.adam_q5 === true ||
    (profile.mensHealth?.moodChanges && profile.mensHealth.moodChanges.length > 0)
      ? 1
      : 0;
  const sexDrive = String(profile.mensHealth?.sexDrive || '');
  const lowInterest =
    adam.adam_q1 === true ||
    sexDrive === 'reduced' ||
    sexDrive === 'significantly_reduced' ||
    sexDrive === 'low' ||
    sexDrive === 'very_low'
      ? 1
      : 0;

  return {
    age,
    height_cm: heightCm,
    weight_kg: weightKg,
    waist_cm: waistCm,
    low_energy: lowEnergy,
    sleep_trouble: sleepTrouble,
    low_mood: lowMood,
    low_interest: lowInterest,
    high_blood_pressure: isHbp,
    diabetes: isDm,
  };
}
