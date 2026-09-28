import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayersThree01,
  ShieldTick,
  AlertTriangle,
  AlertCircle,
  Target02,
  Beaker01,
  UploadCloud01,
  CheckCircle,
  ClipboardCheck,
  BarChart01,
  Clock,
  RefreshCw01,
  InfoCircle,
  Heart,
  Calendar,
  Activity,
  ActivityHeart,
  Scales01,
  File06,
  XClose,
  ArrowRight,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { ClinicalLabsModal } from '../adaptive/ClinicalLabsModal';
import { UltrasoundUploadModal } from '../adaptive/UltrasoundUploadModal';
import { AssessmentHistoryModal } from '../adaptive/AssessmentHistoryModal';
import { PatientShapExplanation } from '../explainability/PatientShapExplanation';

/**
 * Botanical Petal Artwork SVG matching reference screenshot top-right decoration
 */
const BotanicalPetalArtwork: React.FC = () => (
  <svg
    className="w-16 h-16 sm:w-20 sm:h-20 text-[#FDE6EF] opacity-80 pointer-events-none select-none shrink-0"
    viewBox="0 0 100 100"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M30 75 C 30 45, 55 25, 75 20 C 70 45, 50 65, 30 75 Z"
      fill="#FDE6EF"
    />
    <path
      d="M50 85 C 50 60, 70 45, 88 40 C 85 62, 68 78, 50 85 Z"
      fill="#FDE6EF"
      opacity="0.8"
    />
    <path
      d="M20 60 C 25 38, 45 22, 60 18 C 52 38, 38 52, 20 60 Z"
      fill="#FDE6EF"
      opacity="0.6"
    />
  </svg>
);

export interface RiskRangeConfig {
  lowCutoffPercent: number;
  highCutoffPercent: number;
  lowLabel: string;
  intermediateLabel: string;
  highLabel: string;
}

/**
 * Derives authoritative risk thresholds and range labels from the active assessment configuration.
 * Consumes real model threshold configuration (e.g. Tier 1: 20% low cutoff, 38% screening cutoff;
 * Tier 2/3: 18% low cutoff, 29% screening cutoff).
 */
export function getAuthoritativeRiskRanges(assessment: any): RiskRangeConfig {
  const level = assessment?.assessment_level;
  const isTier2Or3 = level === 'tier_1_2' || level === 'tier_1_2_3' || level === 'tier_1_3';

  const defaultHigh = isTier2Or3 ? 29 : 38;
  const defaultLow = isTier2Or3 ? 18 : 20;

  const highCutoff =
    assessment?.threshold !== undefined && assessment?.threshold !== null
      ? Math.round(Number(assessment.threshold) * 100)
      : defaultHigh;

  const lowCutoff = defaultLow;

  return {
    lowCutoffPercent: lowCutoff,
    highCutoffPercent: highCutoff,
    lowLabel: `0 – ${lowCutoff}%`,
    intermediateLabel: `${lowCutoff} – ${highCutoff}%`,
    highLabel: `${highCutoff}%+`,
  };
}

export interface NormalizedFactor {
  title: string;
  explanation: string;
  direction: 'decreases_risk' | 'increases_risk' | 'neutral';
  iconType: string;
}

/**
 * Safely extracts up to 3 real factors strictly from actual explanation payload.
 * Never fabricates sample factors and never infers direction from the title.
 */
export function extractNormalizedFactors(explanations: any[] | undefined | null): NormalizedFactor[] {
  if (!Array.isArray(explanations) || explanations.length === 0) {
    return [];
  }

  const validFactors: NormalizedFactor[] = [];

  for (const item of explanations) {
    if (!item) continue;

    let title = '';
    if (typeof item === 'string') {
      title = item;
    } else if (typeof item === 'object') {
      title =
        item.feature_name ||
        item.human_label ||
        item.display_name ||
        item.label ||
        item.name ||
        item.feature_key ||
        item.feature ||
        '';
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      continue;
    }

    // Direction derived strictly from explanation payload
    let direction: 'decreases_risk' | 'increases_risk' | 'neutral' = 'neutral';
    const rawDir = String(
      (typeof item === 'object' && item?.direction) || ''
    ).toLowerCase();

    if (
      rawDir === 'decreases_risk' ||
      rawDir === 'negative' ||
      rawDir === 'protective' ||
      rawDir === 'lower' ||
      rawDir === 'decreased'
    ) {
      direction = 'decreases_risk';
    } else if (
      rawDir === 'increases_risk' ||
      rawDir === 'positive' ||
      rawDir === 'elevated' ||
      rawDir === 'higher' ||
      rawDir === 'increased'
    ) {
      direction = 'increases_risk';
    } else if (
      typeof item === 'object' &&
      typeof item.shap_value === 'number'
    ) {
      if (item.shap_value < 0) direction = 'decreases_risk';
      else if (item.shap_value > 0) direction = 'increases_risk';
    }

    let description = '';
    if (typeof item === 'object') {
      description =
        item.description ||
        item.patient_explanation ||
        item.clinical_explanation ||
        '';
    }
    if (!description) {
      if (direction === 'decreases_risk') {
        description = 'Reported clinical value supports lower screening risk.';
      } else if (direction === 'increases_risk') {
        description = 'Reported clinical value contributes toward higher screening signal.';
      } else {
        description = 'Evaluated feature contribution in multi-tier screening model.';
      }
    }

    const lower = title.toLowerCase();
    let iconType = 'sparkles';
    if (lower.includes('hair') || lower.includes('hirsutism')) iconType = 'hair';
    else if (
      lower.includes('skin') ||
      lower.includes('acanthosis') ||
      lower.includes('darken') ||
      lower.includes('pigment')
    )
      iconType = 'skin';
    else if (
      lower.includes('exercise') ||
      lower.includes('physical') ||
      lower.includes('activity')
    )
      iconType = 'exercise';
    else if (
      lower.includes('cycle') ||
      lower.includes('period') ||
      lower.includes('menstrual')
    )
      iconType = 'cycle';
    else if (
      lower.includes('bmi') ||
      lower.includes('weight') ||
      lower.includes('waist') ||
      lower.includes('hip')
    )
      iconType = 'scale';
    else if (
      lower.includes('follicle') ||
      lower.includes('ultrasound') ||
      lower.includes('ovary') ||
      lower.includes('pcom')
    )
      iconType = 'ultrasound';
    else if (
      lower.includes('lh') ||
      lower.includes('fsh') ||
      lower.includes('testosterone') ||
      lower.includes('glucose') ||
      lower.includes('insulin') ||
      lower.includes('lab')
    )
      iconType = 'labs';

    validFactors.push({
      title,
      explanation: description,
      direction,
      iconType,
    });

    if (validFactors.length >= 3) break;
  }

  return validFactors;
}

export const FemaleScreeningWorkspace: React.FC = () => {
  const {
    activeAssessment,
    submitTier1,
  } = useUserHealth();

  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);
  const [isUltrasoundModalOpen, setIsUltrasoundModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSubmittingT1, setIsSubmittingT1] = useState(false);

  // Status flags
  const hasAssessment = Boolean(activeAssessment && activeAssessment.has_assessment !== false);
  const level = activeAssessment?.assessment_level || 'none';
  const isTier2Done = level === 'tier_1_2' || level === 'tier_1_2_3';
  const isTier3Done = level === 'tier_1_2_3' || level === 'tier_1_3';

  // Canonical normalized probabilityPercent (0–100 scale)
  const probabilityPercent: number | null = (() => {
    if (!hasAssessment) return null;
    if (activeAssessment?.probability_percent != null && !Number.isNaN(Number(activeAssessment.probability_percent))) {
      return Number(activeAssessment.probability_percent);
    }
    if (activeAssessment?.probability != null && !Number.isNaN(Number(activeAssessment.probability))) {
      const p = Number(activeAssessment.probability);
      return p > 1 ? p : p * 100;
    }
    return null;
  })();

  const displayProbability = probabilityPercent != null ? `${probabilityPercent.toFixed(1)}%` : '--%';

  // Authoritative risk range configuration
  const riskRanges = getAuthoritativeRiskRanges(activeAssessment);

  // Clamped position for spectrum bar marker (4% to 96%) - ONLY when probabilityPercent is non-null!
  const clampedMarkerPosition = probabilityPercent != null
    ? Math.min(Math.max(probabilityPercent, 4), 96)
    : null;

  // Dynamic Risk Category
  const categoryRaw = String(activeAssessment?.risk_category || '').toLowerCase();
  const isLowerRisk = categoryRaw.includes('low') || (probabilityPercent !== null && probabilityPercent < riskRanges.lowCutoffPercent);
  const isHigherRisk = categoryRaw.includes('high') || (probabilityPercent !== null && probabilityPercent >= riskRanges.highCutoffPercent);

  // Dynamic Tier Label
  const getTierLabel = () => {
    if (!hasAssessment) return 'Initial Assessment';
    if (level === 'tier_1_2_3') return 'Tier 3 Assessment';
    if (level === 'tier_1_3') return 'Tier 1 & Ultrasound';
    if (level === 'tier_1_2') return 'Tier 2 Assessment';
    return 'Tier 1 Assessment';
  };

  // Model version tag (Only show real version if present, otherwise omit or quiet label)
  const modelTag = activeAssessment?.model_version || (hasAssessment ? `${getTierLabel()} Screening` : null);

  // Dynamic Evidence Description
  const getEvidenceDescription = () => {
    if (!hasAssessment) {
      return 'Complete your non-invasive assessment covering cycle patterns, symptoms, and biometrics.';
    }
    if (isTier3Done) {
      return 'Your screening includes multimodal clinical evidence and pelvic ultrasound follicle analysis.';
    }
    if (isTier2Done) {
      return 'Your screening now includes your available clinical laboratory evidence.';
    }
    return 'Based on 16 non-invasive features including cycle regularity, biometrics, symptoms, and lifestyle indicators.';
  };

  // Top SHAP Factors extracted dynamically from actual explanations
  const topFactors = extractNormalizedFactors(activeAssessment?.explanations);

  const handleStartTier1 = async () => {
    setIsSubmittingT1(true);
    try {
      await submitTier1();
    } finally {
      setIsSubmittingT1(false);
    }
  };

  const renderFactorIcon = (iconType: string) => {
    switch (iconType) {
      case 'skin':
        return <ActivityHeart className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
      case 'hair':
        return <ActivityHeart className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
      case 'exercise':
        return <Activity className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
      case 'cycle':
        return <Calendar className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
      case 'scale':
        return <Scales01 className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
      case 'ultrasound':
        return <UploadCloud01 className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
      case 'labs':
        return <Beaker01 className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
      default:
        return <ActivityHeart className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />;
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Actions Toolbar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-6 relative">
        {/* Right side: Assessment History button + Decorative Botanical Art & Slogan */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F9FAFB] active:bg-[#F2F4F7] text-[#111318] text-sm font-medium rounded-full border border-[#EAECF0] shadow-xs transition-colors"
          >
            <Clock className="w-4 h-4 text-[#667085]" aria-hidden="true" />
            <span>Assessment History</span>
          </button>

          {/* Decorative Petal Art & Slogan (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <BotanicalPetalArtwork />
            <div className="flex flex-col items-start select-none">
              <span className="text-xs italic font-serif text-[#DC326C] tracking-wide leading-tight">
                Healthier tomorrows
                <br />
                for every woman
              </span>
              <span className="w-6 h-0.5 bg-[#F43F7D] rounded-full mt-1 opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary Assessment Area (2 Columns) ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Assessment Card (~68% width on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EAECF0] p-6 sm:p-7 shadow-xs relative flex flex-col justify-between">
          <div>
            {/* Header row: Tier Badge, Model Version, View Details */}
            <div className="flex items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDE6EF] text-[#DC326C]">
                  <LayersThree01 className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
                  {getTierLabel()}
                </span>
                {modelTag && (
                  <span className="text-xs text-[#98A2B3] font-medium hidden sm:inline">
                    {modelTag}
                  </span>
                )}
              </div>

              {hasAssessment && (
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(true)}
                  className="text-xs font-semibold text-[#DC326C] hover:text-[#F43F7D] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View details</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Risk Score Row */}
            <div className="flex flex-wrap items-baseline gap-4 mt-2">
              <span className="text-5xl sm:text-6xl font-extrabold text-[#111318] tracking-tight">
                {displayProbability}
              </span>

              {hasAssessment ? (
                isLowerRisk ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                    <ShieldTick className="w-4 h-4 text-[#12B76A]" aria-hidden="true" />
                    Lower Screening Risk
                  </span>
                ) : isHigherRisk ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                    <AlertCircle className="w-4 h-4 text-[#F04438]" aria-hidden="true" />
                    Higher Screening Risk
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]">
                    <AlertTriangle className="w-4 h-4 text-[#F79009]" aria-hidden="true" />
                    Intermediate Screening Risk
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F2F4F7] text-[#475569] border border-[#E4E7EC]">
                  Screening Not Started
                </span>
              )}
            </div>

            {/* Risk Description */}
            <p className="text-sm text-[#667085] mt-3 leading-relaxed">
              {getEvidenceDescription()}
            </p>

            {/* Screening Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] mt-4 pt-3 border-t border-[#F2F4F7]">
              <span>
                Calibrated screening cutoff:{' '}
                <strong className="text-[#111318] font-semibold">{riskRanges.highCutoffPercent}%</strong>
              </span>
              <span className="text-[#D0D5DD] hidden sm:inline">|</span>
              <span>
                Active status:{' '}
                <strong className={hasAssessment ? 'text-[#12B76A] font-semibold' : 'text-[#667085] font-semibold'}>
                  {hasAssessment ? 'Current authoritative' : 'Pending initial evaluation'}
                </strong>
              </span>
            </div>
          </div>

          {/* Risk Range Horizontal Spectrum */}
          <div className="mt-8 pt-2">
            {/* Dynamic Probability Marker: ONLY render when real probability exists */}
            {hasAssessment && clampedMarkerPosition !== null && (
              <div className="relative w-full h-5 mb-1 select-none">
                <div
                  className="absolute flex items-center gap-1 text-[11px] font-semibold text-[#111318] -top-1"
                  style={{
                    left: `${clampedMarkerPosition}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#12B76A] shrink-0" />
                  <span>{displayProbability}</span>
                </div>
              </div>
            )}

            {/* Spectrum Bar (3 Segments matching authoritative thresholds) */}
            <div className="w-full flex h-2.5 rounded-full overflow-hidden gap-1">
              {/* Lower Risk Segment (Green) */}
              <div
                className="bg-[#32D583] rounded-l-full"
                style={{ width: `${riskRanges.lowCutoffPercent}%` }}
              />
              {/* Intermediate Risk Segment (Neutral) */}
              <div
                className="bg-[#EAECF0]"
                style={{ width: `${riskRanges.highCutoffPercent - riskRanges.lowCutoffPercent}%` }}
              />
              {/* Higher Risk Segment (Soft Pink) */}
              <div className="flex-1 bg-[#FDA29B] rounded-r-full" />
            </div>

            {/* Spectrum Range Labels */}
            <div className="flex justify-between items-start mt-2 text-xs select-none">
              <div className="text-left">
                <span className="block font-semibold text-[#027A48]">Lower Risk</span>
                <span className="text-[11px] text-[#667085]">{riskRanges.lowLabel}</span>
              </div>
              <div className="text-center">
                <span className="block font-medium text-[#667085]">Intermediate Risk</span>
                <span className="text-[11px] text-[#98A2B3]">{riskRanges.intermediateLabel}</span>
              </div>
              <div className="text-right">
                <span className="block font-semibold text-[#B42318]">Higher Risk</span>
                <span className="text-[11px] text-[#98A2B3]">{riskRanges.highLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Recommendation Card (~32% width on desktop) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAECF0] p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header: Target icon + Recommended Next Step */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FDE6EF] flex items-center justify-center text-[#F43F7D]">
                <Target02 className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-bold text-[#F43F7D] tracking-tight">
                Recommended Next Step
              </h2>
            </div>

            {/* Circular Icon Container */}
            <div className="w-16 h-16 rounded-full bg-[#FDE6EF] flex items-center justify-center mx-auto my-5 text-[#F43F7D]">
              {!hasAssessment ? (
                <ClipboardCheck className="w-8 h-8" aria-hidden="true" />
              ) : isTier3Done ? (
                <CheckCircle className="w-8 h-8 text-[#12B76A]" aria-hidden="true" />
              ) : isTier2Done ? (
                <UploadCloud01 className="w-8 h-8" aria-hidden="true" />
              ) : (
                <Beaker01 className="w-8 h-8" aria-hidden="true" />
              )}
            </div>

            {/* Action Title & Subtitle */}
            <div className="text-center space-y-1.5 px-2">
              <h3 className="text-lg font-bold text-[#111318]">
                {!hasAssessment
                  ? 'Complete Initial Screening'
                  : isTier3Done
                  ? 'Screening Complete'
                  : isTier2Done
                  ? 'Upload Ultrasound'
                  : 'Add Clinical Labs'}
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                {!hasAssessment
                  ? 'Answer symptom, cycle, and biometric questions to generate your initial screening baseline.'
                  : isTier3Done
                  ? 'All three screening tiers have been evaluated with multimodal AI verification.'
                  : isTier2Done
                  ? 'Pelvic ultrasound imaging enables multimodal AI feature validation and follicular pattern verification.'
                  : 'Adding hormone and laboratory values (LH, FSH, fasting glucose) can improve confidence in your screening result.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2.5">
            {!hasAssessment ? (
              <button
                type="button"
                onClick={handleStartTier1}
                disabled={isSubmittingT1}
                className="w-full h-11 px-4 bg-[#F43F7D] hover:bg-[#DC326C] active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                <span>{isSubmittingT1 ? 'Evaluating...' : 'Start Initial Screening (Tier 1) →'}</span>
              </button>
            ) : isTier3Done ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(true)}
                  className="w-full h-11 px-4 bg-[#F43F7D] hover:bg-[#DC326C] active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <File06 className="w-4 h-4" aria-hidden="true" />
                  <span>Review Full Screening Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartTier1}
                  disabled={isSubmittingT1}
                  className="w-full h-10 px-4 bg-white hover:bg-[#F9FAFB] active:scale-[0.98] text-[#344054] text-sm font-medium rounded-xl border border-[#D0D5DD] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw01 className="w-4 h-4 text-[#667085]" aria-hidden="true" />
                  <span>Re-evaluate Screening</span>
                </button>
              </>
            ) : isTier2Done ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsUltrasoundModalOpen(true)}
                  className="w-full h-11 px-4 bg-[#F43F7D] hover:bg-[#DC326C] active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud01 className="w-4 h-4" aria-hidden="true" />
                  <span>Upload Ultrasound (Tier 3) →</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLabsModalOpen(true)}
                  className="w-full h-10 px-4 bg-white hover:bg-[#F9FAFB] active:scale-[0.98] text-[#344054] text-sm font-medium rounded-xl border border-[#D0D5DD] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Beaker01 className="w-4 h-4 text-[#667085]" aria-hidden="true" />
                  <span>Edit Clinical Labs (Tier 2)</span>
                </button>
              </>
            ) : (
              /* Tier 1 Complete: Expose ONLY Add Clinical Labs CTA */
              <button
                type="button"
                onClick={() => setIsLabsModalOpen(true)}
                className="w-full h-11 px-4 bg-[#F43F7D] hover:bg-[#DC326C] active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Beaker01 className="w-4 h-4" aria-hidden="true" />
                <span>Add Clinical Labs (Tier 2) →</span>
              </button>
            )}

            {/* Subtle encouragement slogan */}
            <p className="text-[11px] italic text-[#98A2B3] text-center pt-2">
              More data. A clearer picture. A healthier you.
            </p>
          </div>
        </div>
      </div>

      {/* ── Patient-Centered SHAP Explainability Engine ────────────────────── */}
      {hasAssessment && activeAssessment?.shap_explanation ? (
        <PatientShapExplanation
          payload={activeAssessment.shap_explanation}
          longitudinalComparison={activeAssessment.longitudinal_shap_comparison}
          pathway="female_pcos"
        />
      ) : (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4 select-none">
              <span className="w-1 h-2 bg-[#F43F7D] rounded-xs" />
              <span className="w-1 h-3.5 bg-[#F43F7D] rounded-xs" />
              <span className="w-1 h-2.5 bg-[#F43F7D] rounded-xs" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111318] tracking-tight">
              What influenced your result
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#667085]">
            Top factors from your assessment that most contributed to your current screening risk.
          </p>

          {!hasAssessment ? (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 text-center shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#FDE6EF] flex items-center justify-center mx-auto mb-2 text-[#F43F7D]">
                <BarChart01 className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-[#111318]">
                Complete your initial screening to see which factors influence your result.
              </p>
              <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
                Once evaluated, personalized TreeSHAP explainability features will highlight key biometric and lifestyle signals.
              </p>
            </div>
          ) : topFactors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 text-center shadow-xs">
              <p className="text-sm text-[#667085]">
                Factor explanations are not available for this assessment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {topFactors.map((factor, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-[#EAECF0] p-4 sm:p-5 flex items-start gap-3.5 relative shadow-xs"
                >
                  <div className="w-11 h-11 rounded-full bg-[#FDE6EF] flex items-center justify-center shrink-0">
                    {renderFactorIcon(factor.iconType)}
                  </div>
                  <div className="flex-1 pr-6">
                    <h3 className="text-sm font-semibold text-[#111318] leading-snug">
                      {factor.title}
                    </h3>
                    <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                      {factor.explanation}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4">
                    {factor.direction === 'decreases_risk' ? (
                      <span
                        className="w-6 h-6 rounded-full bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center text-xs font-bold"
                        title="Contributes toward lower screening risk"
                      >
                        ↓
                      </span>
                    ) : factor.direction === 'increases_risk' ? (
                      <span
                        className="w-6 h-6 rounded-full bg-[#FEF3F2] text-[#F04438] flex items-center justify-center text-xs font-bold"
                        title="Contributes toward higher screening risk"
                      >
                        ↑
                      </span>
                    ) : (
                      <span
                        className="w-6 h-6 rounded-full bg-[#F2F4F7] text-[#667085] flex items-center justify-center text-xs font-bold"
                        title="Evaluated screening factor"
                      >
                        •
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer Bar ───────────────────────────────────────────────────── */}
      <div className="bg-[#F8F9FA] rounded-xl border border-[#EAECF0] px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#667085]">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <InfoCircle className="w-4 h-4 text-[#475569] shrink-0" aria-hidden="true" />
          <span>
            Non-diagnostic statistical screening estimate. Consult a qualified healthcare professional for clinical diagnosis and care.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#98A2B3] text-[11px] shrink-0 select-none">
          <Heart className="w-3.5 h-3.5 text-[#F43F7D] fill-current" aria-hidden="true" />
          <span>Evidence today. Healthier tomorrows.</span>
        </div>
      </div>

      {/* ── View Details Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDetailsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#EAECF0] shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-3">
                <div className="flex items-center gap-2">
                  <LayersThree01 className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />
                  <h3 className="text-base font-bold text-[#111318]">Assessment Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#F2F4F7] text-[#667085] cursor-pointer"
                  aria-label="Close dialog"
                >
                  <XClose className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#475569]">
                <div className="grid grid-cols-2 gap-2 bg-[#FAFAFC] p-3 rounded-xl border border-[#EAECF0]">
                  <div>
                    <span className="text-[#98A2B3] block">Tier Level</span>
                    <strong className="text-[#111318] text-sm">{getTierLabel()}</strong>
                  </div>
                  <div>
                    <span className="text-[#98A2B3] block">Probability</span>
                    <strong className="text-[#111318] text-sm">{displayProbability}</strong>
                  </div>
                  <div>
                    <span className="text-[#98A2B3] block">Calibrated Cutoff</span>
                    <strong className="text-[#111318] text-sm">{riskRanges.highCutoffPercent}%</strong>
                  </div>
                  {modelTag && (
                    <div>
                      <span className="text-[#98A2B3] block">Model Tag</span>
                      <strong className="text-[#111318] text-sm">{modelTag}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-[#111318] mb-1">Evidence Used</h4>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {getEvidenceDescription()}
                  </p>
                </div>

                {topFactors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-[#111318] mb-2">SHAP Feature Contributions</h4>
                    <div className="space-y-2">
                      {topFactors.map((exp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#F8F9FA] border border-[#EAECF0]">
                          <div className="pr-2">
                            <span className="font-medium text-[#111318]">{exp.title}</span>
                            <span className="block text-[11px] text-[#667085]">{exp.explanation}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            exp.direction === 'decreases_risk'
                              ? 'bg-[#ECFDF3] text-[#12B76A]'
                              : exp.direction === 'increases_risk'
                              ? 'bg-[#FEF3F2] text-[#F04438]'
                              : 'bg-[#F2F4F7] text-[#667085]'
                          }`}>
                            {exp.direction === 'decreases_risk' ? '↓ Lower' : exp.direction === 'increases_risk' ? '↑ Higher' : '• Evaluated'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-full py-2.5 bg-[#F2F4F7] hover:bg-[#EAECF0] text-[#111318] font-semibold text-xs rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {isLabsModalOpen && (
        <ClinicalLabsModal
          isOpen={isLabsModalOpen}
          onClose={() => setIsLabsModalOpen(false)}
        />
      )}

      {isUltrasoundModalOpen && (
        <UltrasoundUploadModal
          isOpen={isUltrasoundModalOpen}
          onClose={() => setIsUltrasoundModalOpen(false)}
        />
      )}

      {isHistoryModalOpen && (
        <AssessmentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
};
