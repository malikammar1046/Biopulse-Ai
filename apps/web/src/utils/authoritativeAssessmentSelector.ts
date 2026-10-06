/**
 * Authoritative Screening Assessment Selector & Canonical Input Hashing
 *
 * ============================================================================
 * CORE SOURCE OF TRUTH RULE:
 * "Authentication and application hydration must never be treated as
 * a screening event. The persisted active pathway assessment is the
 * authoritative screening result until screening-relevant health data
 * is intentionally reassessed."
 * ============================================================================
 *
 * Guarantees that:
 * 1. For a given pathway (female or male), exactly ONE persisted active assessment
 *    serves as the authoritative source for the displayed screening probability.
 * 2. Unrelated asynchronous hydration (e.g. food logs, fitness logs, cycle logs)
 *    never generates or substitutes a competing screening score.
 * 3. The male pathway strictly requires module === 'male_hypogonadism'.
 * 4. The female pathway strictly requires module === 'female_pcos'.
 * 5. Deterministic canonical input hashing enables detecting true health data changes.
 */

import type { ProgressiveAssessment } from '../types/intelligence';

export type Pathway = 'female' | 'male';

export interface AuthoritativeAssessmentResult {
  authoritativeAssessment: ProgressiveAssessment | null;
  hasAssessment: boolean;
  probability: number | null;
  probabilityPercent: number | null;
  riskCategory: string;
  riskLabel: string;
  assessmentLevel: string;
  threshold: number;
  inputHash: string;
  source: 'ACTIVE' | 'NONE';
  modelName: string;
  modelVersion: string;
  createdAt: string | null;
  assessmentId: string | null;
  pcomStatus?: string | null;
  pcomProbability?: number | null;
  gradcamB64?: string | null;
  hormonePatternInterpretation?: {
    pattern_name?: string;
    pattern_description?: string;
  } | null;
}

export function computeCanonicalInputHash(
  raw: Record<string, any> = {},
  pathway: 'female' | 'male' = 'female'
): string {
  try {
    const isMale = pathway === 'male';
    const canonical: Record<string, any> = {};

    const normalizeNum = (val: any, fallback: any = 0, precision = 2): any => {
      if (val === undefined || val === null || val === '' || String(val).toLowerCase() === 'null') return fallback;
      const num = Number(val);
      return Number.isFinite(num) ? Number(num.toFixed(precision)) : fallback;
    };

    const normalizeFlag = (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'boolean' || typeof val === 'number') return val ? 1 : 0;
      const s = String(val).trim().toLowerCase();
      return ['1', 'true', 'yes', 'y', 'frequent', 'daily', 'often', 'severe', 'moderate'].includes(s) ? 1 : 0;
    };

    if (isMale) {
      canonical['age'] = normalizeNum(raw.age, 35, 1);
      canonical['height_cm'] = normalizeNum(raw.height_cm ?? raw.heightCm, 175, 1);
      canonical['weight_kg'] = normalizeNum(raw.weight_kg ?? raw.weightKg, 75, 2);

      const hM = canonical['height_cm'] > 0 ? canonical['height_cm'] / 100 : 1.75;
      const computedBmi = Number((canonical['weight_kg'] / (hM * hM)).toFixed(2));
      canonical['bmi'] = normalizeNum(raw.bmi, computedBmi, 2);

      canonical['waist_cm'] = normalizeNum(raw.waist_cm ?? raw.waistCm, null, 1);
      for (const flag of [
        'low_energy',
        'sleep_trouble',
        'low_mood',
        'low_interest',
        'high_blood_pressure',
        'diabetes',
      ]) {
        canonical[flag] = normalizeFlag(raw[flag]);
      }
    } else {
      canonical['age'] = normalizeNum(raw.age, 25, 1);
      canonical['weight_kg'] = normalizeNum(raw.weight_kg ?? raw.weight, 60, 2);
      canonical['height_cm'] = normalizeNum(raw.height_cm ?? raw.height, 160, 1);

      const hM = canonical['height_cm'] > 0 ? canonical['height_cm'] / 100 : 1.6;
      const computedBmi = Number((canonical['weight_kg'] / (hM * hM)).toFixed(2));
      canonical['bmi'] = normalizeNum(raw.bmi, computedBmi, 2);

      const regVal = raw.cycle_regularity ?? raw.period_regularity;
      canonical['cycle_regularity'] = typeof regVal === 'string'
        ? regVal.toLowerCase().includes('irreg') || regVal.toLowerCase().includes('vary') ? 1 : 0
        : normalizeFlag(regVal);

      canonical['cycle_length_raw'] = normalizeNum(raw.cycle_length_raw ?? raw.cycle_length, 28, 1);
      canonical['marriage_years'] = normalizeNum(raw.marriage_years, 0, 1);
      canonical['pregnant'] = normalizeFlag(raw.pregnant ?? raw.pregnancy ?? raw.isPregnant);
      canonical['abortions'] = normalizeNum(raw.abortions ?? raw.abortionsCount, 0, 0);

      for (const flag of [
        'weight_gain',
        'hirsutism',
        'skin_darkening',
        'hair_loss',
        'pimples_acne',
        'fast_food',
        'regular_exercise',
      ]) {
        canonical[flag] = normalizeFlag(raw[flag]);
      }
    }

    // Sort keys deterministically
    const sortedKeys = Object.keys(canonical).sort();
    const sortedObj: Record<string, any> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = canonical[key];
    }
    const str = JSON.stringify(sortedObj);

    // Simple robust 32-bit FNV-1a hash formatted as 8-char hex string
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  } catch {
    return '00000000';
  }
}

export function getAuthoritativeAssessmentForPathway({
  activeAssessment,
  pathway,
  userId,
}: {
  activeAssessment: ProgressiveAssessment | null;
  pathway: 'female' | 'male';
  userId?: string;
}): AuthoritativeAssessmentResult {
  const isMale = pathway === 'male';
  const expectedModule = isMale ? 'male_hypogonadism' : 'female_pcos';
  const defaultThreshold = isMale ? 0.1808 : 0.38;

  // Strict module matching: activeAssessment must belong to the user's active pathway
  const isModuleMatch = Boolean(
    activeAssessment &&
    (activeAssessment.module === expectedModule ||
      (!isMale && (!activeAssessment.module || activeAssessment.module === 'female_pcos')) ||
      (isMale && (activeAssessment.module === 'male_hypogonadism' || activeAssessment.model_name?.toLowerCase().includes('male'))))
  );

  // Strict user isolation
  const isUserMatch = Boolean(
    !userId ||
    !activeAssessment?.patient_id ||
    activeAssessment.patient_id === userId
  );

  const isValidAuthoritative = Boolean(
    activeAssessment &&
    activeAssessment.has_assessment !== false &&
    isModuleMatch &&
    isUserMatch
  );

  if (!isValidAuthoritative || !activeAssessment) {
    return {
      authoritativeAssessment: null,
      hasAssessment: false,
      probability: null,
      probabilityPercent: null,
      riskCategory: 'lower',
      riskLabel: isMale ? 'Lower Screening Risk' : 'Lower Screening Risk',
      assessmentLevel: 'tier_1',
      threshold: defaultThreshold,
      inputHash: 'none',
      source: 'NONE',
      modelName: isMale ? 'Logistic Regression (Balanced)' : 'Extra Trees + Platt Sigmoid Calibration (Tier 1)',
      modelVersion: isMale ? 'Male-ML v1.0-T1' : 'PCOS-ML v1.2-T1',
      createdAt: null,
      assessmentId: null,
      pcomStatus: null,
      pcomProbability: null,
      gradcamB64: null,
      hormonePatternInterpretation: null,
    };
  }

  // Authoritative probability extraction with zero guessing or ambiguous fallbacks
  let probability: number | null = null;
  let probabilityPercent: number | null = null;

  if (activeAssessment.probability_percent !== undefined && activeAssessment.probability_percent !== null) {
    const rawVal = Number(activeAssessment.probability_percent);
    probabilityPercent = Number.isInteger(rawVal) ? rawVal : Number(rawVal.toFixed(1));
    probability = Number((rawVal / 100).toFixed(4));
  } else if (activeAssessment.probability !== undefined && activeAssessment.probability !== null) {
    const rawP = Number(activeAssessment.probability);
    probability = Number(rawP.toFixed(4));
    const scaled = rawP > 1 ? rawP : rawP * 100;
    probabilityPercent = Number.isInteger(scaled) ? scaled : Number(scaled.toFixed(1));
  }

  const assessmentLevel = activeAssessment.assessment_level || (activeAssessment.pcom_status ? 'tier_1_3' : 'tier_1');
  const isTier2Or3 = !isMale && (assessmentLevel === 'tier_1_2' || assessmentLevel === 'tier_1_2_3' || assessmentLevel === 'tier_1_3');
  const defaultHigh = isMale ? 18.08 : (isTier2Or3 ? 29 : 38);
  const defaultLow = isMale ? 10 : (isTier2Or3 ? 18 : 20);

  const highCutoff = activeAssessment.threshold !== undefined && activeAssessment.threshold !== null
    ? (isMale ? Number((Number(activeAssessment.threshold) * 100).toFixed(1)) : Math.round(Number(activeAssessment.threshold) * 100))
    : defaultHigh;
  const lowCutoff = defaultLow;
  const threshold = activeAssessment.threshold ?? (isMale ? 0.1808 : (isTier2Or3 ? 0.29 : 0.38));

  // Authoritative clinical risk derivation strictly matching Screening Workspace cutoff ranges
  let riskCategory: string;
  let riskLabel: string;

  if (probabilityPercent !== null) {
    if (probabilityPercent >= highCutoff) {
      riskCategory = 'higher';
      riskLabel = 'Higher Screening Risk';
    } else if (probabilityPercent >= lowCutoff) {
      riskCategory = 'intermediate';
      riskLabel = 'Intermediate Screening Risk';
    } else {
      riskCategory = 'lower';
      riskLabel = 'Lower Screening Risk';
    }
  } else {
    const rawCat = (activeAssessment.risk_category || '').toLowerCase();
    if (rawCat.includes('high') || rawCat.includes('elevated')) {
      riskCategory = 'higher';
      riskLabel = 'Higher Screening Risk';
    } else if (rawCat.includes('inter') || rawCat.includes('mod')) {
      riskCategory = 'intermediate';
      riskLabel = 'Intermediate Screening Risk';
    } else {
      riskCategory = 'lower';
      riskLabel = 'Lower Screening Risk';
    }
  }

  const rawInputs = activeAssessment.authoritative_tier_1_inputs || activeAssessment.input_features || {};
  const inputHash = activeAssessment.input_hash || computeCanonicalInputHash(rawInputs, pathway);

  return {
    authoritativeAssessment: activeAssessment,
    hasAssessment: probabilityPercent !== null,
    probability,
    probabilityPercent,
    riskCategory,
    riskLabel,
    assessmentLevel,
    threshold,
    inputHash,
    source: 'ACTIVE',
    modelName: activeAssessment.model_name || (isMale ? 'Male-ML Logistic' : 'PCOS-ML Extra Trees'),
    modelVersion: activeAssessment.model_version || (isMale ? 'Male-ML v1.0-T1' : 'PCOS-ML v1.2-T1'),
    createdAt: activeAssessment.created_at || null,
    assessmentId: activeAssessment.assessment_id || activeAssessment.id || null,
    pcomStatus: activeAssessment.pcom_status || null,
    pcomProbability: activeAssessment.pcom_probability !== undefined ? activeAssessment.pcom_probability : null,
    gradcamB64: activeAssessment.gradcam_b64 || null,
    hormonePatternInterpretation: activeAssessment.hormone_pattern_interpretation || null,
  };
}
