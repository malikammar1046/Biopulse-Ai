/**
 * ==============================================================================
 * VITASense Phase 4: Adaptive Health Profile & Progressive Screening System
 * ==============================================================================
 * 
 * Defines core types for the 4-tier progressive screening model across:
 * - Female Pathway: OvaSense AI → PCOS Screening
 * - Male Pathway: AndroSense AI → Male Hypogonadism Screening
 * - General Pathway: VITASense → Baseline Health & Wellness Monitoring
 * 
 * Adheres strictly to non-diagnostic clinical boundaries and progressive disclosure.
 */

import type { HealthPathway } from './onboarding';

// ------------------------------------------------------------------------------
// 1. Information Availability & Verification States
// ------------------------------------------------------------------------------

/**
 * Distinguishes the presence and state of a piece of health data.
 * CRITICAL RULE: 'unknown' is NEVER interpreted as 'normal'. Unknown means unknown.
 */
export type InformationAvailability =
  | 'known' // Provided by the user or verified from a report
  | 'unknown' // Not yet provided by the user (missing data)
  | 'not_applicable' // Does not clinically apply to this user or pathway
  | 'pending_verification'; // Extracted from a medical document, awaiting user confirmation

/**
 * Tracks the clinical origin and confirmation level of health information.
 */
export type VerificationStatus =
  | 'self_reported' // Entered manually during onboarding or profile editing
  | 'imported' // Synchronized from external health service / device
  | 'extracted' // Extracted via document processing, unconfirmed
  | 'user_verified' // Confirmed by the patient
  | 'clinician_verified'; // Confirmed by an attending healthcare provider

// ------------------------------------------------------------------------------
// 2. Progressive 4-Tier Model Definitions
// ------------------------------------------------------------------------------

export type TierLevel = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';

/**
 * Health information category within a tier
 */
export type FieldCategory =
  | 'demographics'
  | 'biometrics'
  | 'menstrual'
  | 'symptoms'
  | 'medical_history'
  | 'family_history'
  | 'lifestyle'
  | 'routine_labs'
  | 'hormones'
  | 'imaging'
  | 'screening_questionnaire';

/**
 * Status of an individual tier.
 * Tiers are NEVER presented as "failed". Missing data simply reflects an opportunity
 * for additional assessment depth.
 */
export type TierState =
  | 'not_started'
  | 'in_progress'
  | 'available'
  | 'incomplete'
  | 'ready_for_assessment';

/**
 * Specific timing details required for diurnal biomarkers (e.g. Morning Total Testosterone)
 */
export interface DiurnalTimingDetails {
  morningTest?: boolean;
  fastingStatus?: boolean;
  drawTime?: string; // e.g. "08:30 AM"
  drawDate?: string; // YYYY-MM-DD
}

/**
 * Represents a single health marker or data point within the adaptive profile.
 */
export interface AdaptiveFieldItem {
  id: string; // Unique identifier (e.g. 'cycle_regularity', 'morning_testosterone', 'fasting_glucose')
  tier: TierLevel;
  label: string; // Patient-friendly label
  category: FieldCategory;
  availability: InformationAvailability;
  verification: VerificationStatus;
  valueDisplay?: string | number | boolean | null;
  unit?: string;
  referenceRange?: string;
  recordedAt?: string; // ISO date string
  source?: string; // e.g. 'Onboarding Intake', 'Lab Report', 'Self-Reported'
  whyItMatters: string; // Patient-friendly clinical context
  clinicalNote?: string; // Optional educational context
  timingDetails?: DiurnalTimingDetails; // Dedicated for morning testosterone
  isKeyPredictor?: boolean; // Highlighted feature for screening consideration
  reportId?: string; // Originating medical report ID if extracted from a document
  resultId?: string; // Originating report result ID if extracted from a document
}

/**
 * Summary status for a single tier in the progressive hierarchy.
 */
export interface TierSummary {
  tier: TierLevel;
  name: string; // e.g. "Accessible Information"
  subtitle: string; // e.g. "Self-reported symptoms, biometrics & history"
  status: TierState;
  statusLabel: string; // "Ready for Assessment", "Partially Complete", etc.
  statusSymbol: '✓' | '◐' | '○' | '—'; // Accessible symbol indicator
  totalFieldsCount: number;
  knownCount: number;
  pendingCount: number;
  unknownCount: number;
  completenessPercentage: number; // 0 to 100
  items: AdaptiveFieldItem[];
}

// ------------------------------------------------------------------------------
// 3. Screening Readiness & Gap Analysis
// ------------------------------------------------------------------------------

export type ScreeningReadinessStatus =
  | 'ready_for_initial_screening' // Tier 1 has sufficient accessible information
  | 'additional_information_available' // User has provided Tier 2, 3, or 4 information
  | 'needs_tier1_intake'; // Minimal baseline inputs still needed

export interface InformationGapReport {
  availableItems: AdaptiveFieldItem[];
  pendingVerificationItems: AdaptiveFieldItem[];
  missingPrioritizedItems: AdaptiveFieldItem[];
  totalAvailableCount: number;
  totalMissingCount: number;
}

// ------------------------------------------------------------------------------
// 4. Cost-Aware Prioritization (Placeholder for ML Ranking)
// ------------------------------------------------------------------------------

export interface PrioritizedInformationItem {
  id: string;
  testName: string;
  tier: TierLevel;
  category: FieldCategory;
  estimatedBenefit: 'high' | 'moderate' | 'refinement';
  estimatedBenefitDescription: string;
  estimatedCostTier: '$' | '$$' | '$$$';
  estimatedCostRangeText: string; // e.g. "Low cost (Routine Blood Panel)"
  collectionMethod: 'routine_blood' | 'specialized_serum' | 'clinical_ultrasound';
  clinicalNote: string;
}

// ------------------------------------------------------------------------------
// 5. Model Explainability Placeholder (Prepared for Future ML / SHAP Outputs)
// ------------------------------------------------------------------------------

export interface ExplainabilityFeatureItem {
  featureId: string;
  label: string;
  influenceDirection: 'increases_influence' | 'decreases_influence' | 'moderates_influence';
  patientExplanation: string;
  isKnown: boolean;
}

export interface ExplainabilitySummary {
  headline: string; // "These features had the greatest influence on the model's assessment."
  disclaimer: string;
  features: ExplainabilityFeatureItem[];
}

// ------------------------------------------------------------------------------
// 6. Complete Adaptive Health Profile
// ------------------------------------------------------------------------------

export interface AdaptiveHealthProfile {
  pathway: HealthPathway;
  screeningPathwayName: string; // e.g. "OvaSense PCOS Screening", "AndroSense Hypogonadism Screening"
  isSpecializedPathway: boolean; // true for female & male, false for general
  readinessStatus: ScreeningReadinessStatus;
  readinessLabel: string;
  readinessDescription: string;
  overallCompletenessPercentage: number; // "Information Completeness" (0-100)
  tiers: Record<TierLevel, TierSummary>;
  gaps: InformationGapReport;
  prioritizedRecommendations: PrioritizedInformationItem[];
  explainability: ExplainabilitySummary;
  lastCalculatedAt: string;
}

// ------------------------------------------------------------------------------
// 7. Structured ADAM Questionnaire (Male Tier 1)
// ------------------------------------------------------------------------------

export interface ADAMQuestionItem {
  id: string;
  questionNumber: number;
  prompt: string;
  response: boolean | null; // true = Yes, false = No, null = unanswered
  isCriticalQuestion?: boolean; // Q1 (libido) and Q7 (erections) are clinical focal points
}

export interface ADAMQuestionnaireState {
  questions: ADAMQuestionItem[];
  completedCount: number;
  yesResponsesCount: number;
  hasCriticalYes: boolean;
  status: 'not_started' | 'partial' | 'completed';
}
