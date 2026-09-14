/**
 * VITASense — Research Intelligence & Explainable AI (XAI) Types
 *
 * Defines the standard typed insight object and explainability metadata.
 * Designed to answer four fundamental questions:
 *   1. WHAT did VITASense notice? (summary)
 *   2. WHY did it notice it? (why)
 *   3. BASED ON WHAT? (dataSources & contributingFactors with trust levels)
 *   4. HOW CERTAIN? (signalStrength & defensible confidence/pattern state)
 *
 * Strict architectural boundaries:
 *   - Deterministic Health Logic (counts, cycle lengths, consistency)
 *   - Pattern Intelligence (multi-factor observations from user records)
 *   - Machine Learning / TreeSHAP (real ExtraTrees model from Ovasense-ML)
 *   - Future MedGemma Integration (typed contract ready for ML team)
 */

import type { HealthPathway } from './onboarding';
import type { ShapExplanation } from './intelligence';

// ---------------------------------------------------------------------------
// Core Categorical Types
// ---------------------------------------------------------------------------

export type InsightType =
  | 'pattern'
  | 'trend'
  | 'change'
  | 'progress'
  | 'reminder'
  | 'data_quality'
  | 'screening'
  | 'report'
  | 'lifestyle';

export type InsightStatus =
  | 'new'
  | 'active'
  | 'improving'
  | 'stable'
  | 'changing'
  | 'insufficient_data';

/** Patient-friendly signal strength (NEVER fabricated percentages) */
export type SignalStrength =
  | 'early_signal'
  | 'developing_pattern'
  | 'stronger_pattern'
  | 'insufficient_evidence';

/**
 * Data provenance trust levels:
 * - verified: User-confirmed lab reports / biomarkers
 * - user_entered: Directly recorded by user (symptoms, cycle, lifestyle)
 * - calculated: Derived mathematical statistics (BMI, averages, regularity)
 * - unverified: OCR-extracted drafts (NEVER shown as trusted evidence)
 * - model_generated: Only when genuine ML model (e.g. ExtraTrees) ran
 */
export type TrustLevel =
  | 'verified'
  | 'user_entered'
  | 'calculated'
  | 'unverified'
  | 'model_generated';

export type DataSourceKey =
  | 'profile'
  | 'symptoms'
  | 'cycle'
  | 'nutrition'
  | 'movement'
  | 'water'
  | 'medical_reports'
  | 'verified_labs'
  | 'screening_progress';

export type IntelligenceEngineType =
  | 'deterministic'
  | 'pattern'
  | 'ml_tree_shap';

// ---------------------------------------------------------------------------
// Data Provenance & Factor Attribution
// ---------------------------------------------------------------------------

export interface DataSourceProvenance {
  source: DataSourceKey;
  label: string;
  recordCount: number;
  trustLevel: TrustLevel;
  description: string;
  lastUpdated?: string;
  isQuarantined?: boolean; // true if unverified draft OCR
}

export interface ContributingFactor {
  name: string;
  label: string;
  influence: 'positive' | 'negative' | 'neutral' | 'contributing' | 'protective';
  magnitude?: number; // Only present when real TreeSHAP magnitude exists
  category: 'clinical' | 'symptom' | 'lifestyle' | 'cycle' | 'lab';
  explanation: string;
  userValue?: string | number | boolean;
}

// ---------------------------------------------------------------------------
// Standard Explainable Insight Object
// ---------------------------------------------------------------------------

export interface ExplainableInsight {
  id: string;
  title: string;
  /** WHAT did VITASense notice? */
  summary: string;
  /** WHY did it notice it? */
  why: string;
  type: InsightType;
  status: InsightStatus;
  signalStrength?: SignalStrength;
  /** Optional patient-friendly label (e.g., "Developing pattern" or omitted) */
  confidenceLabel?: string;
  /** BASED ON WHAT? Actual data sources used */
  dataSources: DataSourceProvenance[];
  /** Breakdown of contributing factors */
  contributingFactors: ContributingFactor[];
  /** Clear statement of limitations or missing evidence */
  limitations: string;
  /** Safe, non-prescriptive actionable next step */
  recommendedAction: string;
  /** Clear statement of what this insight does NOT mean */
  whatThisDoesNotMean: string;
  /** Relevant pathway (female: OvaSense, male: AndroSense, general: VITASense) */
  pathway: HealthPathway;
  createdAt: string;
  engineType: IntelligenceEngineType;
  /** Real TreeSHAP attributions when backend ML model ran */
  shapAttribution?: {
    isRealShap: boolean;
    explanations: ShapExplanation[];
    screeningThreshold?: number;
    pcosProbability?: number;
    modelName?: string;
    modelVersion?: string;
  };
}

// ---------------------------------------------------------------------------
// Digital Twin Explainability Nodes
// ---------------------------------------------------------------------------

export interface ExplainableDimensionNode {
  id: string;
  title: string;
  category: 'physiology' | 'habits' | 'clinical' | 'screening';
  currentState: string;
  historicalState?: string;
  supportingData: DataSourceProvenance[];
  change: 'improving' | 'stable' | 'changing' | 'developing_pattern' | 'insufficient_data';
  directionOfChange?: 'improving' | 'stable' | 'changing' | 'developing_pattern' | 'insufficient_data';
  changeDescription: string;
  limitation: string;
}

// ---------------------------------------------------------------------------
// Future MedGemma Contract (For ML Team Phases 9–10)
// ---------------------------------------------------------------------------

export interface MedGemmaContract {
  model: string; // e.g. "medgemma-7b-vitasense"
  modelVersion: string;
  inputFeatures: Record<string, any>;
  prediction: string;
  confidence?: number;
  featureImportance?: Array<{ feature: string; score: number }>;
  explanation: string;
  limitations: string[];
  timestamp: string;
  status: 'pending_ml_team_release' | 'ready';
}
