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

export function resolveRiskBand(
  probability: number,
  category?: string,
  threshold: number = 0.38,
  lowCutoff: number = 0.20
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
      label: 'Higher Risk',
      color: '#E0316A',
      badgeBg: '#FCE8EF',
      badgeBorder: '#F8CAD9',
      badgeTextColor: '#E0316A',
      summaryText:
        'Your responses indicate a higher likelihood of PCOS. This is a screening result, not a medical diagnosis.',
      progressPercent: Math.min(100, Math.max(0, probPercent)),
    };
  }

  if (resolvedCat === 'intermediate') {
    return {
      category: 'intermediate',
      label: 'Intermediate Risk',
      color: '#D97706',
      badgeBg: '#FEF3C7',
      badgeBorder: '#FDE68A',
      badgeTextColor: '#B45309',
      summaryText:
        'Your responses indicate moderate pattern variability. Longitudinal monitoring and clinical review are suggested.',
      progressPercent: Math.min(100, Math.max(0, probPercent)),
    };
  }

  return {
    category: 'lower',
    label: 'Lower Risk',
    color: '#059669',
    badgeBg: '#D1FAE5',
    badgeBorder: '#A7F3D0',
    badgeTextColor: '#047857',
    summaryText:
      'Your responses align with standard baseline biological rhythms. Continue regular preventive health tracking.',
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
            threshold: Number(row.threshold ?? 0.38),
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
): { isValid: boolean; error?: string } {
  if (!basicInfo.dateOfBirth) {
    return { isValid: false, error: 'Date of birth is required.' };
  }
  if (!basicInfo.age || basicInfo.age < 12 || basicInfo.age > 65) {
    return { isValid: false, error: 'Age must be between 12 and 65 years.' };
  }
  if (!basicInfo.heightCm || basicInfo.heightCm < 100 || basicInfo.heightCm > 240) {
    return { isValid: false, error: 'Height must be between 100 and 240 cm.' };
  }
  if (!basicInfo.weightKg || basicInfo.weightKg < 30 || basicInfo.weightKg > 250) {
    return { isValid: false, error: 'Weight must be between 30 and 250 kg.' };
  }
  if (!cycleHealth.cycleLength || cycleHealth.cycleLength < 21 || cycleHealth.cycleLength > 45) {
    return { isValid: false, error: 'Average cycle length must be between 21 and 45 days.' };
  }
  if (!cycleHealth.lastPeriodDate) {
    return { isValid: false, error: 'Last period start date is required.' };
  }
  return { isValid: true };
}

