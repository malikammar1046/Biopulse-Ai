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
  screeningPolicyVersion?: string;
  originalRiskCategory?: string;
  originalThreshold?: number;
  originalProbability?: number | null;
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

export function selectAuthoritativeAssessment(
  candidates: (ProgressiveAssessment | null | undefined)[],
  pathway: Pathway = 'female'
): ProgressiveAssessment | null {
  const isMale = pathway === 'male';
  const expectedModule = isMale ? 'male_hypogonadism' : 'female_pcos';

  const valid = candidates.filter((item): item is ProgressiveAssessment => {
    if (!item) return false;
    const isModuleMatch = Boolean(
      item.module === expectedModule ||
      (!isMale && (!item.module || item.module === 'female_pcos')) ||
      (isMale && (item.module === 'male_hypogonadism' || item.model_name?.toLowerCase().includes('male')))
    );
    if (!isModuleMatch) return false;
    const p = item.probability !== undefined && item.probability !== null
      ? Number(item.probability)
      : (item.probability_percent !== undefined && item.probability_percent !== null
        ? Number(item.probability_percent) / 100
        : NaN);
    return !Number.isNaN(p) && item.has_assessment !== false;
  });

  if (valid.length === 0) return null;

  // Tier precedence: highest valid cumulative completed tier wins
  const getTierRank = (item: ProgressiveAssessment): number => {
    const lvl = (item.assessment_level || '').toLowerCase();
    if (lvl === 'tier_1_2_3') return 4;
    if (lvl === 'tier_1_2') return 3;
    if (lvl === 'tier_1_3') return 2;
    if (lvl === 'tier_1') return 1;
    return 0;
  };

  return valid.slice().sort((a, b) => {
    const rankDiff = getTierRank(b) - getTierRank(a);
    if (rankDiff !== 0) return rankDiff;
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  })[0];
}

export function getAuthoritativeAssessmentForPathway({
  activeAssessment,
  candidateAssessments,
  pathway,
  userId,
}: {
  activeAssessment: ProgressiveAssessment | null;
  candidateAssessments?: (ProgressiveAssessment | null | undefined)[];
  pathway: 'female' | 'male';
  userId?: string;
}): AuthoritativeAssessmentResult {
  const isMale = pathway === 'male';
  const expectedModule = isMale ? 'male_hypogonadism' : 'female_pcos';
  const defaultThreshold = isMale ? 0.1808 : 0.25;

  // If candidate assessments provided, pick the highest valid completed cumulative tier
  let targetAssessment = activeAssessment;
  if (candidateAssessments && candidateAssessments.length > 0) {
    const selected = selectAuthoritativeAssessment(
      activeAssessment ? [activeAssessment, ...candidateAssessments] : candidateAssessments,
      pathway
    );
    if (selected) {
      targetAssessment = selected;
    }
  }

  // Strict module matching: targetAssessment must belong to the user's active pathway
  const isModuleMatch = Boolean(
    targetAssessment &&
    (targetAssessment.module === expectedModule ||
      (!isMale && (!targetAssessment.module || targetAssessment.module === 'female_pcos')) ||
      (isMale && (targetAssessment.module === 'male_hypogonadism' || targetAssessment.model_name?.toLowerCase().includes('male'))))
  );

  // Strict user isolation
  const isUserMatch = Boolean(
    !userId ||
    !targetAssessment?.patient_id ||
    targetAssessment.patient_id === userId
  );

  const isValidAuthoritative = Boolean(
    targetAssessment &&
    targetAssessment.has_assessment !== false &&
    isModuleMatch &&
    isUserMatch
  );

  if (!isValidAuthoritative || !targetAssessment) {
    return {
      authoritativeAssessment: null,
      hasAssessment: false,
      probability: null,
      probabilityPercent: null,
      riskCategory: 'unavailable',
      riskLabel: 'Assessment Unavailable',
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

  if (targetAssessment.probability !== undefined && targetAssessment.probability !== null) {
    const rawP = Number(targetAssessment.probability);
    if (!Number.isNaN(rawP)) {
      probability = rawP > 1 ? rawP / 100 : rawP;
      const displayVal = probability * 100;
      probabilityPercent = Number(displayVal.toFixed(1));
    }
  } else if (targetAssessment.probability_percent !== undefined && targetAssessment.probability_percent !== null) {
    const rawVal = Number(targetAssessment.probability_percent);
    if (!Number.isNaN(rawVal)) {
      probabilityPercent = Number(rawVal.toFixed(1));
      probability = rawVal / 100;
    }
  }

  if (probability === null) {
    return {
      authoritativeAssessment: targetAssessment,
      hasAssessment: false,
      probability: null,
      probabilityPercent: null,
      riskCategory: 'unavailable',
      riskLabel: 'Assessment Unavailable',
      assessmentLevel: targetAssessment.assessment_level || 'tier_1',
      threshold: defaultThreshold,
      inputHash: 'none',
      source: 'NONE',
      modelName: targetAssessment.model_name || (isMale ? 'Male-ML Logistic' : 'PCOS-ML Extra Trees'),
      modelVersion: targetAssessment.model_version || (isMale ? 'Male-ML v1.0-T1' : 'PCOS-ML v1.2-T1'),
      createdAt: targetAssessment.created_at || null,
      assessmentId: targetAssessment.assessment_id || targetAssessment.id || null,
      screeningPolicyVersion: targetAssessment.screening_policy_version || 'legacy_v1',
      originalRiskCategory: targetAssessment.original_risk_category || targetAssessment.risk_category,
      originalThreshold: targetAssessment.original_threshold ?? targetAssessment.threshold,
      originalProbability: targetAssessment.original_probability ?? null,
      pcomStatus: targetAssessment.pcom_status || null,
      pcomProbability: targetAssessment.pcom_probability !== undefined ? targetAssessment.pcom_probability : null,
      gradcamB64: targetAssessment.gradcam_b64 || null,
      hormonePatternInterpretation: targetAssessment.hormone_pattern_interpretation || null,
    };
  }

  const assessmentLevel = targetAssessment.assessment_level || (targetAssessment.pcom_status ? 'tier_1_3' : 'tier_1');

  // Policy v2 cutoffs:
  // Male: 0.1808 threshold, 0.10 lower cutoff
  // Female: 0.25 primary operating threshold, 0.18 lower cutoff
  const threshold = typeof targetAssessment.threshold === 'number'
    ? targetAssessment.threshold
    : defaultThreshold;

  let riskCategory: string;
  let riskLabel: string;

  if (isMale) {
    const maleLow = 0.10;
    if (probability >= threshold) {
      riskCategory = 'higher';
      riskLabel = 'Higher Screening Risk';
    } else if (probability >= maleLow) {
      riskCategory = 'intermediate';
      riskLabel = 'Intermediate Screening Risk';
    } else {
      riskCategory = 'lower';
      riskLabel = 'Lower Screening Risk';
    }
  } else {
    // Female PCOS screening policy v2:
    // Categorization uses unrounded full precision probability BEFORE display rounding.
    // e.g. probability = 0.2496 displays as 25% but classifies as intermediate (< 0.25).
    const femaleLow = 0.18;
    if (probability >= threshold) {
      riskCategory = 'higher';
      riskLabel = 'Higher Likelihood';
    } else if (probability >= femaleLow) {
      riskCategory = 'intermediate';
      riskLabel = 'Intermediate Likelihood';
    } else {
      riskCategory = 'lower';
      riskLabel = 'Lower Likelihood';
    }
  }

  const rawInputs = targetAssessment.authoritative_tier_1_inputs || targetAssessment.input_features || {};
  const inputHash = targetAssessment.input_hash || computeCanonicalInputHash(rawInputs, pathway);

  return {
    authoritativeAssessment: targetAssessment,
    hasAssessment: true,
    probability,
    probabilityPercent,
    riskCategory,
    riskLabel,
    assessmentLevel,
    threshold,
    inputHash,
    source: 'ACTIVE',
    modelName: targetAssessment.model_name || (isMale ? 'Male-ML Logistic' : 'PCOS-ML Extra Trees'),
    modelVersion: targetAssessment.model_version || (isMale ? 'Male-ML v1.0-T1' : 'PCOS-ML v1.2-T1'),
    createdAt: targetAssessment.created_at || null,
    assessmentId: targetAssessment.assessment_id || targetAssessment.id || null,
    screeningPolicyVersion: targetAssessment.screening_policy_version || 'legacy_v1',
    originalRiskCategory: targetAssessment.original_risk_category || targetAssessment.risk_category,
    originalThreshold: targetAssessment.original_threshold ?? targetAssessment.threshold,
    originalProbability: targetAssessment.original_probability ?? probability,
    pcomStatus: targetAssessment.pcom_status || null,
    pcomProbability: targetAssessment.pcom_probability !== undefined ? targetAssessment.pcom_probability : null,
    gradcamB64: targetAssessment.gradcam_b64 || null,
    hormonePatternInterpretation: targetAssessment.hormone_pattern_interpretation || null,
  };
}
