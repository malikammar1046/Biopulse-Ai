/**
 * BioPulse AI Mobile — PCOS Screening & Intelligence Assessment Service
 *
 * Connects directly to the authoritative Django PCOS-ML and Supabase backend services.
 * Implements Tier 1 assessment execution, active assessment querying, canonical risk band
 * resolution, SHAP factor normalization, and non-diagnostic clinical progression.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, mobileSupabaseAuth } from '../lib/supabase';

declare const process: {
  env: Record<string, string | undefined>;
};

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const BACKEND_API_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api';

const DEFAULT_TIMEOUT_MS = 25000;

// ---------------------------------------------------------------------------
// Canonical Types
// ---------------------------------------------------------------------------

export type RiskCategory = 'lower' | 'intermediate' | 'higher' | 'insufficient_data';
export type AssessmentLevel = 'tier_1' | 'tier_1_2' | 'tier_1_3' | 'tier_1_2_3';

export interface ShapFactor {
  feature_key: string;
  feature_name: string;
  patient_label?: string;
  patient_value?: string;
  impact_score: number;
  direction: 'increases_risk' | 'decreases_risk' | 'positive' | 'negative' | 'higher' | 'lower' | 'neutral';
  explanation_share_percent?: number;
  relative_influence?: number;
  description?: string;
  patient_explanation?: string;
}

export interface ProgressiveAssessment {
  id?: string;
  assessment_id?: string;
  patient_id?: string;
  has_assessment?: boolean;
  module?: 'female_pcos' | 'male_hypogonadism' | string;
  assessment_level: AssessmentLevel;
  tiers_included: number[];
  model_name?: string;
  model_version?: string;
  probability: number;
  probability_percent: number;
  threshold: number;
  risk_category: RiskCategory | string;
  risk_label?: string;
  explanations?: ShapFactor[];
  shap_explanation?: {
    factors?: ShapFactor[];
    explained_fold_count?: number;
    additivity_verified?: boolean;
    [key: string]: any;
  } | null;
  limitations?: string[];
  next_available_tier?: number | null;
  next_step?: string;
  disclaimer?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface FemaleTier1Inputs {
  age: number;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  cycle_regularity: 'regular' | 'irregular' | 'not_sure' | number;
  cycle_length_raw: number;
  hirsutism?: number | boolean;
  weight_gain?: number | boolean;
  skin_darkening?: number | boolean;
  hair_loss?: number | boolean;
  pimples_acne?: number | boolean;
  fast_food?: number | boolean;
  regular_exercise?: number | boolean;
  waist_inch?: number;
  hip_inch?: number;
  marriage_years?: number;
  is_pregnant?: boolean;
}

// ---------------------------------------------------------------------------
// Human Labels & Feature Metadata
// ---------------------------------------------------------------------------

export const FEATURE_CANONICAL_LABELS: Record<string, { label: string; icon: string }> = {
  hirsutism: { label: 'Excess hair growth', icon: 'cut-outline' },
  'hair growth(Y/N)': { label: 'Excess hair growth', icon: 'cut-outline' },
  cycle_regularity: { label: 'Irregular menstrual cycle', icon: 'calendar-outline' },
  'Cycle(R/I)': { label: 'Irregular menstrual cycle', icon: 'calendar-outline' },
  pimples_acne: { label: 'Pimples / Acne', icon: 'sparkles-outline' },
  'Pimples(Y/N)': { label: 'Pimples / Acne', icon: 'sparkles-outline' },
  weight_gain: { label: 'Weight gain', icon: 'scale-outline' },
  'Weight gain(Y/N)': { label: 'Weight gain', icon: 'scale-outline' },
  skin_darkening: { label: 'Skin darkening', icon: 'color-palette-outline' },
  'Skin darkening (Y/N)': { label: 'Skin darkening', icon: 'color-palette-outline' },
  hair_loss: { label: 'Hair thinning / loss', icon: 'fitness-outline' },
  'hair(Y/N)': { label: 'Hair thinning / loss', icon: 'fitness-outline' },
  bmi: { label: 'Body Mass Index (BMI)', icon: 'speedometer-outline' },
  'BMI': { label: 'Body Mass Index (BMI)', icon: 'speedometer-outline' },
  cycle_length_raw: { label: 'Cycle duration variability', icon: 'time-outline' },
  'Cycle length(days)': { label: 'Cycle duration variability', icon: 'time-outline' },
  age: { label: 'Age profile', icon: 'person-outline' },
  'Age (yrs)': { label: 'Age profile', icon: 'person-outline' },
  waist_hip_ratio: { label: 'Waist-to-hip ratio', icon: 'body-outline' },
  fast_food: { label: 'Dietary intake balance', icon: 'restaurant-outline' },
  regular_exercise: { label: 'Physical activity level', icon: 'walk-outline' },
};

export function getFeatureLabel(key: string, fallback?: string): string {
  if (FEATURE_CANONICAL_LABELS[key]) {
    return FEATURE_CANONICAL_LABELS[key].label;
  }
  const clean = key.replace(/__.*$/, '').replace(/[\(\)\/\_]/g, ' ').trim();
  return fallback || clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function getFeatureIconName(key: string): any {
  if (FEATURE_CANONICAL_LABELS[key]) {
    return FEATURE_CANONICAL_LABELS[key].icon;
  }
  return 'analytics-outline';
}

// ---------------------------------------------------------------------------
// Canonical Risk Band Resolution
// ---------------------------------------------------------------------------

export interface RiskBandDisplay {
  category: RiskCategory;
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  summaryText: string;
  progressPercent: number;
}

export const FEMALE_DEFAULT_THRESHOLD = 0.25;
export const MALE_DEFAULT_THRESHOLD = 0.45;

export function resolveRiskBand(
  probability: number,
  category?: string,
  threshold: number = FEMALE_DEFAULT_THRESHOLD,
  lowCutoff: number = 0.18
): RiskBandDisplay {
  const normCategory = (category || '').toLowerCase().trim();

  let resolvedCat: RiskCategory;
  if (normCategory.includes('higher') || normCategory.includes('high')) {
    resolvedCat = 'higher';
  } else if (normCategory.includes('intermediate') || normCategory.includes('mod')) {
    resolvedCat = 'intermediate';
  } else if (normCategory.includes('lower') || normCategory.includes('low')) {
    resolvedCat = 'lower';
  } else {
    // Canonical backend fallback if category string absent
    if (probability >= threshold) {
      resolvedCat = 'higher';
    } else if (probability >= lowCutoff) {
      resolvedCat = 'intermediate';
    } else {
      resolvedCat = 'lower';
    }
  }

  const probPercent = Math.round(probability * 100);

  if (resolvedCat === 'higher') {
    return {
      category: 'higher',
      label: 'Higher Likelihood',
      color: '#E0316A',
      badgeBg: '#FCE8EF',
      badgeBorder: '#F8CAD9',
      badgeTextColor: '#E0316A',
      summaryText:
        'Several of your current screening factors are associated with PCOS. Consider discussing these findings with a qualified healthcare professional.',
      progressPercent: Math.min(100, Math.max(0, probPercent)),
    };
  }

  if (resolvedCat === 'intermediate') {
    return {
      category: 'intermediate',
      label: 'Intermediate Likelihood',
      color: '#D97706',
      badgeBg: '#FEF3C7',
      badgeBorder: '#FDE68A',
      badgeTextColor: '#B45309',
      summaryText:
        'Some of your current health patterns are associated with PCOS, but the result is not conclusive. Additional information or clinical review may be helpful.',
      progressPercent: Math.min(100, Math.max(0, probPercent)),
    };
  }

  return {
    category: 'lower',
    label: 'Lower Likelihood',
    color: '#059669',
    badgeBg: '#D1FAE5',
    badgeBorder: '#A7F3D0',
    badgeTextColor: '#047857',
    summaryText:
      'Your current screening pattern shows fewer features associated with PCOS. Continue regular preventive health tracking.',
    progressPercent: Math.min(100, Math.max(0, probPercent)),
  };
}

// ---------------------------------------------------------------------------
// Progression & Recommendations Engine
// ---------------------------------------------------------------------------

export interface NextActionInfo {
  title: string;
  description: string;
  buttonLabel: string;
  tier: number;
}

export function resolveNextAction(assessment?: ProgressiveAssessment | null): NextActionInfo {
  const level = assessment?.assessment_level || 'tier_1';
  const nextTier = assessment?.next_available_tier;

  if (level === 'tier_1_2_3') {
    return {
      title: 'Next Best Action',
      description:
        'Comprehensive multimodal screening is complete. Discuss your synthesized clinical ultrasound assessment with an endocrinologist.',
      buttonLabel: 'Book Specialist Consultation →',
      tier: 3,
    };
  }

  if (level === 'tier_1_2' || nextTier === 3) {
    return {
      title: 'Next Best Action',
      description:
        'Your clinical lab markers have been synthesized. Schedule a pelvic ultrasound to complete multimodal morphological analysis.',
      buttonLabel: 'Upload Pelvic Ultrasound →',
      tier: 3,
    };
  }

  // Tier 1 Default (Matches Screenshot Progression)
  return {
    title: 'Next Best Action',
    description:
      'Consider getting basic hormone tests (FSH, LH, TSH, Prolactin) to confirm your risk and learn more about your hormonal health.',
    buttonLabel: 'Book Lab Test →',
    tier: 2,
  };
}

// ---------------------------------------------------------------------------
// Remote API Client Methods
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch the user's current authoritative active assessment
 */
export async function fetchActiveScreeningAssessment(userId?: string): Promise<ProgressiveAssessment | null> {
  const session = mobileSupabaseAuth.getSession();
  const token = session?.access_token;
  const targetUser = userId || session?.user?.id;

  // 1. Try authoritative backend endpoint if token available
  if (token) {
    try {
      const response = await fetchWithTimeout(`${BACKEND_API_URL}/v1/intelligence/assessment/active/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && (data.probability !== undefined || data.has_assessment)) {
          return data as ProgressiveAssessment;
        }
      }
    } catch {
      // Backend request notice: fall through to Supabase REST
    }
  }

  // 2. Query Supabase screening_assessments directly via REST
  if (targetUser) {
    try {
      const supaUrl = `${SUPABASE_URL}/rest/v1/screening_assessments?patient_id=eq.${targetUser}&module=eq.female_pcos&is_active=eq.true&order=created_at.desc&limit=1`;
      const response = await fetchWithTimeout(supaUrl, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          return {
            id: row.id,
            assessment_id: row.id,
            patient_id: row.patient_id,
            module: row.module || 'female_pcos',
            assessment_level: row.assessment_level || 'tier_1',
            tiers_included: row.tiers_included || [1],
            model_name: row.model_name || 'Extra Trees + Platt Sigmoid Calibration (Tier 1)',
            model_version: row.model_version || 'PCOS-ML v1.2-T1',
            probability: Number(row.probability ?? 0),
            probability_percent: Number(row.probability_percent ?? (Number(row.probability ?? 0) * 100)),
            threshold: Number(row.threshold ?? 0.25),
            risk_category: row.risk_category || 'lower',
            risk_label: row.risk_label,
            explanations: row.explanations || [],
            shap_explanation: row.shap_explanation || null,
            limitations: row.limitations || [],
            next_available_tier: row.next_available_tier ?? 2,
            disclaimer: row.disclaimer,
            created_at: row.created_at,
          };
        }
      }
    } catch {
      // Supabase REST error notice
    }
  }

  return null;
}

export interface AssessmentSubmissionResult {
  data: ProgressiveAssessment | null;
  error: string | null;
  statusCode?: number;
}

/**
 * Submit Tier 1 Female Screening Inputs to the live ML model with explicit error reporting
 */
export async function submitFemaleTier1AssessmentWithStatus(
  inputs: FemaleTier1Inputs,
  userId?: string
): Promise<AssessmentSubmissionResult> {
  const session = mobileSupabaseAuth.getSession();
  const token = session?.access_token;

  if (!token) {
    return {
      data: null,
      error: 'Authentication required. Please sign in or register before submitting your assessment.',
      statusCode: 401,
    };
  }

  try {
    const response = await fetchWithTimeout(`${BACKEND_API_URL}/v1/intelligence/assessment/tier1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(inputs),
    });

    if (response.ok) {
      const data = await response.json();
      return { data: data as ProgressiveAssessment, error: null, statusCode: response.status };
    }

    let errorDetail = 'Assessment service error';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errJson.details || errJson.message || `Error status ${response.status}`;
    } catch {
      errorDetail = `Assessment submission failed with HTTP ${response.status}.`;
    }

    return { data: null, error: errorDetail, statusCode: response.status };
  } catch (err: any) {
    return {
      data: null,
      error:
        err?.message ||
        'Unable to connect to BioPulse screening service. Please check your network connection and retry.',
    };
  }
}

/**
 * Submit Tier 1 Female Screening Inputs to the live ML model
 */
export async function submitFemaleTier1Assessment(
  inputs: FemaleTier1Inputs,
  userId?: string
): Promise<ProgressiveAssessment | null> {
  const res = await submitFemaleTier1AssessmentWithStatus(inputs, userId);
  return res.data;
}

/**
 * Transform UI Onboarding State into authoritative Female Tier 1 API Payload
 */
export function buildFemaleTier1Inputs(
  basicInfo: {
    age?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
    marriageYears?: number;
    pregnancyStatus?: string;
  },
  cycleHealth: {
    regularity?: string;
    cycleLength?: number;
  },
  symptoms: string[],
  lifestyle: {
    fastFoodIntake?: string;
    exerciseFrequency?: string;
  }
): FemaleTier1Inputs {
  return {
    age: Number(basicInfo.age) || 24,
    weight_kg: Number(basicInfo.weightKg) || 58,
    height_cm: Number(basicInfo.heightCm) || 162,
    bmi: Number(basicInfo.bmi) || 22.1,
    cycle_regularity: (cycleHealth.regularity === 'irregular' ? 'irregular' : 'regular') as 'regular' | 'irregular',
    cycle_length_raw: Number(cycleHealth.cycleLength) || 28,
    hirsutism: symptoms.includes('hirsutism') ? 1 : 0,
    weight_gain: symptoms.includes('weight_gain') ? 1 : 0,
    skin_darkening: symptoms.includes('skin_darkening') ? 1 : 0,
    hair_loss: symptoms.includes('hair_loss') ? 1 : 0,
    pimples_acne: symptoms.includes('pimples_acne') ? 1 : 0,
    fast_food: lifestyle.fastFoodIntake === 'frequently' ? 1 : 0,
    regular_exercise: lifestyle.exerciseFrequency === 'none' ? 0 : 1,
    marriage_years: Number(basicInfo.marriageYears) || 0,
    is_pregnant: basicInfo.pregnancyStatus === 'currently_pregnant',
  };
}

/**
 * Validates female review inputs before triggering backend inference
 */
/**
 * Validates female review inputs before triggering backend inference
 */
export function validateFemaleReviewInputs(
  basicInfo: {
    dateOfBirth?: string;
    age?: number;
    heightCm?: number;
    weightKg?: number;
  },
  cycleHealth: {
    cycleLength?: number;
    lastPeriodDate?: string;
  }
): { isValid: boolean; error?: string; missingFields?: string[] } {
  const missing: string[] = [];

  if (!basicInfo.dateOfBirth) {
    missing.push('Date of birth');
  }
  if (!basicInfo.age || basicInfo.age < 12 || basicInfo.age > 65) {
    if (!basicInfo.age) missing.push('Age');
    else return { isValid: false, error: 'Age must be between 12 and 65 years.', missingFields: ['Age'] };
  }
  if (!basicInfo.heightCm || basicInfo.heightCm < 100 || basicInfo.heightCm > 240) {
    if (!basicInfo.heightCm) missing.push('Height');
    else return { isValid: false, error: 'Height must be between 100 and 240 cm.', missingFields: ['Height'] };
  }
  if (!basicInfo.weightKg || basicInfo.weightKg < 30 || basicInfo.weightKg > 250) {
    if (!basicInfo.weightKg) missing.push('Weight');
    else return { isValid: false, error: 'Weight must be between 30 and 250 kg.', missingFields: ['Weight'] };
  }
  if (!cycleHealth.cycleLength || cycleHealth.cycleLength < 21 || cycleHealth.cycleLength > 45) {
    if (!cycleHealth.cycleLength) missing.push('Cycle length');
    else return { isValid: false, error: 'Average cycle length must be between 21 and 45 days.', missingFields: ['Cycle length'] };
  }
  if (!cycleHealth.lastPeriodDate) {
    missing.push('Last period start date');
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Missing required screening information: ${missing.join(', ')}. Please provide all clinical measurements before assessing.`,
      missingFields: missing,
    };
  }

  return { isValid: true };
}

/**
 * Validates male review inputs before triggering backend inference
 */
export function validateMaleReviewInputs(
  basicInfo: {
    age?: number;
    heightCm?: number;
    weightKg?: number;
    waistCm?: number;
  },
  adam?: {
    answers?: Record<number, boolean>;
  }
): { isValid: boolean; error?: string; missingFields?: string[] } {
  const missing: string[] = [];

  if (!basicInfo.age || basicInfo.age < 18 || basicInfo.age > 90) {
    if (!basicInfo.age) missing.push('Age');
    else return { isValid: false, error: 'Age must be between 18 and 90 years.', missingFields: ['Age'] };
  }
  if (!basicInfo.heightCm || basicInfo.heightCm < 100 || basicInfo.heightCm > 240) {
    if (!basicInfo.heightCm) missing.push('Height');
    else return { isValid: false, error: 'Height must be between 100 and 240 cm.', missingFields: ['Height'] };
  }
  if (!basicInfo.weightKg || basicInfo.weightKg < 30 || basicInfo.weightKg > 250) {
    if (!basicInfo.weightKg) missing.push('Weight');
    else return { isValid: false, error: 'Weight must be between 30 and 250 kg.', missingFields: ['Weight'] };
  }

  const answeredAdamCount = adam?.answers ? Object.keys(adam.answers).length : 0;
  if (answeredAdamCount < 5) {
    missing.push('ADAM Questionnaire Answers (at least 5 required)');
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Missing required screening information: ${missing.join(', ')}. Please complete all fields before assessing.`,
      missingFields: missing,
    };
  }

  return { isValid: true };
}

export interface MaleTier1Inputs {
  age: number;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  waist_cm?: number;
  sleep_hours?: number;
  low_energy_flag?: number;
  decreased_libido_flag?: number;
  exercise_frequency?: string;
  fast_food?: number;
  adam_answers?: Record<string, boolean>;
}

/**
 * Transform UI Male Onboarding State into authoritative Male Tier 1 API Payload
 */
export function buildMaleTier1Inputs(
  basicInfo: {
    age?: number;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    waistCm?: number;
  },
  adam?: {
    answers?: Record<number, boolean>;
  },
  lifestyle?: {
    sleepHours?: number;
    exerciseFrequency?: string;
    fastFoodIntake?: string;
  }
): MaleTier1Inputs {
  const answersRecord: Record<string, boolean> = {};
  if (adam?.answers) {
    Object.entries(adam.answers).forEach(([k, v]) => {
      answersRecord[`q${k}`] = v;
    });
  }

  const weight = Number(basicInfo.weightKg) || 0;
  const height = Number(basicInfo.heightCm) || 0;
  const calculatedBmi = height > 0 ? parseFloat((weight / ((height / 100) ** 2)).toFixed(1)) : 24.0;

  return {
    age: Number(basicInfo.age) || 0,
    weight_kg: weight,
    height_cm: height,
    bmi: Number(basicInfo.bmi) || calculatedBmi,
    waist_cm: basicInfo.waistCm ? Number(basicInfo.waistCm) : undefined,
    sleep_hours: lifestyle?.sleepHours ? Number(lifestyle.sleepHours) : undefined,
    low_energy_flag: adam?.answers && adam.answers[2] ? 1 : 0,
    decreased_libido_flag: adam?.answers && adam.answers[1] ? 1 : 0,
    exercise_frequency: lifestyle?.exerciseFrequency,
    fast_food: lifestyle?.fastFoodIntake === 'frequently' ? 1 : 0,
    adam_answers: answersRecord,
  };
}

/**
 * Submit Tier 1 Male Screening Inputs to the live ML model with explicit error reporting
 */
export async function submitMaleTier1AssessmentWithStatus(
  inputs: MaleTier1Inputs,
  userId?: string
): Promise<AssessmentSubmissionResult> {
  const session = mobileSupabaseAuth.getSession();
  const token = session?.access_token;

  if (!token) {
    return {
      data: null,
      error: 'Authentication required. Please sign in or register before submitting your assessment.',
      statusCode: 401,
    };
  }

  try {
    const response = await fetchWithTimeout(`${BACKEND_API_URL}/v1/intelligence/assessment/male/tier1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(inputs),
    });

    if (response.ok) {
      const data = await response.json();
      return { data: data as ProgressiveAssessment, error: null, statusCode: response.status };
    }

    let errorDetail = 'Assessment service error';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errJson.details || errJson.message || `Error status ${response.status}`;
    } catch {
      errorDetail = `Assessment submission failed with HTTP ${response.status}.`;
    }

    return { data: null, error: errorDetail, statusCode: response.status };
  } catch (err: any) {
    return {
      data: null,
      error:
        err?.message ||
        'Unable to connect to BioPulse screening service. Please check your network connection and retry.',
    };
  }
}

/**
 * Fetch chronological assessment history from Django or Supabase
 */
export async function fetchAssessmentHistory(
  userId?: string,
  module?: 'female_pcos' | 'male_hypogonadism' | string
): Promise<ProgressiveAssessment[]> {
  const session = mobileSupabaseAuth.getSession();
  const token = session?.access_token;
  const targetUser = userId || session?.user?.id;
  const targetModule = module || 'female_pcos';

  // 1. Try authoritative Django endpoint if token available
  if (token) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_API_URL}/v1/intelligence/assessment/history/?module=${targetModule}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.history)) {
          return data.history as ProgressiveAssessment[];
        }
        if (Array.isArray(data)) {
          return data as ProgressiveAssessment[];
        }
      }
    } catch {
      // Fall through to Supabase
    }
  }

  // 2. Query Supabase screening_assessments directly via REST
  if (targetUser) {
    try {
      const supaUrl = `${SUPABASE_URL}/rest/v1/screening_assessments?patient_id=eq.${targetUser}&module=eq.${targetModule}&order=created_at.desc`;
      const response = await fetchWithTimeout(supaUrl, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows)) {
          return rows.map((row: any) => ({
            id: row.id,
            assessment_id: row.id,
            patient_id: row.patient_id,
            module: row.module,
            assessment_level: row.assessment_level,
            tiers_included: row.tiers_included || [1],
            model_name: row.model_name,
            model_version: row.model_version,
            probability: Number(row.probability ?? 0),
            probability_percent: Number(row.probability_percent ?? (Number(row.probability ?? 0) * 100)),
            threshold: Number(row.threshold ?? (targetModule === 'male_hypogonadism' ? 0.45 : 0.25)),
            risk_category: row.risk_category || 'lower',
            risk_label: row.risk_label,
            explanations: row.explanations || [],
            shap_explanation: row.shap_explanation || null,
            limitations: row.limitations || [],
            next_available_tier: row.next_available_tier,
            disclaimer: row.disclaimer,
            created_at: row.created_at,
            is_active: Boolean(row.is_active),
          }));
        }
      }
    } catch {
      // Supabase REST error
    }
  }

  return [];
}

export const assessmentService = {
  FEMALE_DEFAULT_THRESHOLD,
  MALE_DEFAULT_THRESHOLD,
  fetchActiveScreeningAssessment,
  getLatestAssessment: fetchActiveScreeningAssessment,
  fetchAssessmentHistory,
  submitTier1Screening: submitFemaleTier1AssessmentWithStatus,
  submitFemaleTier1Assessment,
  submitFemaleTier1AssessmentWithStatus,
  submitMaleTier1Screening: submitMaleTier1AssessmentWithStatus,
  submitMaleTier1AssessmentWithStatus,
  validateFemaleReviewInputs,
  validateMaleReviewInputs,
  buildFemaleTier1Inputs,
  buildMaleTier1Inputs,
  resolveRiskBand,
  resolveNextAction,
};



