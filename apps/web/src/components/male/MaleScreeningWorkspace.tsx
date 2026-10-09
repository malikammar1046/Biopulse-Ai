import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayersThree01,
  ShieldTick,
  AlertTriangle,
  AlertCircle,
  Target02,
  Beaker01,
  CheckCircle,
  ClipboardCheck,
  BarChart01,
  Clock,
  RefreshCw01,
  InfoCircle,
  Heart,
  Activity,
  Scales01,
  File06,
  XClose,
  ArrowRight,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';
import { MaleClinicalLabsModal } from '../adaptive/MaleClinicalLabsModal';
import { AssessmentHistoryModal } from '../adaptive/AssessmentHistoryModal';
import { ADAMQuestionnaireModal } from '../adaptive/ADAMQuestionnaireModal';
import { PatientShapExplanation } from '../explainability/PatientShapExplanation';
import { AssessmentChangeSummary } from '../adaptive/AssessmentChangeSummary';
import { getAuthoritativeAssessmentForPathway } from '../../utils/authoritativeAssessmentSelector';

export interface MaleRiskRangeConfig {
  lowCutoffPercent: number;
  highCutoffPercent: number;
  lowLabel: string;
  intermediateLabel: string;
  highLabel: string;
}

/**
 * Derives authoritative male risk thresholds and range labels from the active assessment configuration.
 * Consumes calibrated Male-ML screening configuration:
 * - 10.0% lower cutoff
 * - Calibrated operating cutoff: 18.08% for Tier 1, 33.79% for Tier 2
 */
export function getAuthoritativeMaleRiskRanges(assessment: any): MaleRiskRangeConfig {
  const isTier2 = assessment?.assessment_level === 'tier_1_2' || assessment?.assessment_level === 'tier_2';
  const defaultHigh = isTier2 ? 33.79 : 18.08;
  const defaultLow = 10.0;

  const rawThreshold = assessment?.threshold;
  const highCutoff =
    rawThreshold !== undefined && rawThreshold !== null
      ? Number((Number(rawThreshold) * 100).toFixed(1))
      : defaultHigh;

  const lowCutoff = defaultLow;

  return {
    lowCutoffPercent: lowCutoff,
    highCutoffPercent: highCutoff,
    lowLabel: 'Lower Screening Risk',
    intermediateLabel: 'Intermediate Screening Risk',
    highLabel: 'Higher Screening Risk',
  };
}

export interface NormalizedMaleFactor {
  title: string;
  explanation: string;
  direction: 'decreases_risk' | 'increases_risk' | 'neutral';
  iconType: string;
}

/**
 * Safely extracts up to 3 real factors strictly from the actual male explanation payload.
 * Never fabricates sample factors and preserves clinical direction.
 */
export function extractNormalizedMaleFactors(explanations: any[] | undefined | null): NormalizedMaleFactor[] {
  if (!Array.isArray(explanations) || explanations.length === 0) {
    return [];
  }

  const validFactors: NormalizedMaleFactor[] = [];

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
        item.patient_summary ||
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
        description = 'Evaluated feature contribution in screening model.';
      }
    }

    const lower = title.toLowerCase();
    let iconType = 'vitality';
    if (lower.includes('waist') || lower.includes('circumference')) iconType = 'scale';
    else if (lower.includes('bmi') || lower.includes('weight')) iconType = 'scale';
    else if (lower.includes('energy') || lower.includes('fatigue')) iconType = 'activity';
    else if (lower.includes('sleep') || lower.includes('rest')) iconType = 'clock';
    else if (lower.includes('libido') || lower.includes('interest') || lower.includes('mood')) iconType = 'heart';
    else if (lower.includes('blood pressure') || lower.includes('hypertension')) iconType = 'activity';
    else if (lower.includes('diabetes') || lower.includes('glucose') || lower.includes('sugar')) iconType = 'labs';
    else if (lower.includes('t') || lower.includes('shbg') || lower.includes('lh') || lower.includes('fsh') || lower.includes('lab')) iconType = 'labs';

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

export const MaleScreeningWorkspace: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    activeAssessment,
    assessmentHistory,
    submitMaleTier1,
    refreshActiveAssessment,
    saveADAMResponses,
  } = useUserHealth();
  const navigate = useNavigate();

  // Authoritative Assessment State strictly bound to male_hypogonadism
  const authoritative = useMemo(() => {
    return getAuthoritativeAssessmentForPathway({
      activeAssessment,
      candidateAssessments: assessmentHistory,
      pathway: 'male',
      userId: userProfile?.id,
    });
  }, [activeAssessment, assessmentHistory, userProfile?.id]);

  const {
    authoritativeAssessment,
    hasAssessment,
    probabilityPercent,
    riskCategory,
    riskLabel,
    assessmentLevel,
  } = authoritative;

  const previousAssessment = useMemo(() => {
    if (!authoritativeAssessment) return null;
    if (authoritativeAssessment.replaced_assessment_id) {
      const match = assessmentHistory.find(
        (h) =>
          h.id === authoritativeAssessment.replaced_assessment_id ||
          h.assessment_id === authoritativeAssessment.replaced_assessment_id
      );
      if (match) return match;
    }
    return (
      assessmentHistory.find(
        (h) =>
          h.id !== authoritativeAssessment.id &&
          h.assessment_id !== authoritativeAssessment.assessment_id &&
          h.module === 'male_hypogonadism'
      ) || null
    );
  }, [authoritativeAssessment, assessmentHistory]);

  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAdamModalOpen, setIsAdamModalOpen] = useState(false);
  const [isSubmittingT1, setIsSubmittingT1] = useState(false);

  // Status flags
  const isTier2Done = assessmentLevel === 'tier_1_2' || assessmentLevel === 'tier_2';

  const displayProbability =
    probabilityPercent != null ? `${probabilityPercent.toFixed(1)}%` : '--%';

  // Authoritative male risk range configuration
  const riskRanges = useMemo(() => {
    return getAuthoritativeMaleRiskRanges(authoritativeAssessment);
  }, [authoritativeAssessment]);

  // Clamped position for spectrum bar marker (4% to 96%) - ONLY when probabilityPercent is non-null
  const clampedMarkerPosition =
    probabilityPercent != null
      ? Math.min(Math.max(probabilityPercent, 4), 96)
      : null;

  // Dynamic Risk Category from authoritative result
  const isHigherRisk = riskCategory === 'higher';
  const isLowerRisk = riskCategory === 'lower';

  // Dynamic Tier Label
  const getTierLabel = () => {
    if (!hasAssessment) return 'Initial Assessment';
    if (isTier2Done) return 'Tier 2 Clinical & Laboratory Assessment';
    return 'Tier 1 Biometric Assessment';
  };

  // Model version tag
  const modelTag =
    authoritativeAssessment?.model_version ||
    (hasAssessment ? `${isTier2Done ? 'Tier 2' : 'Tier 1'} Screening` : null);

  // Dynamic Evidence Description
  const getEvidenceDescription = () => {
    if (!hasAssessment) {
      return 'Complete your non-invasive assessment evaluating vitality indicators, ADAM responses, and baseline metabolic factors.';
    }
    if (isTier2Done) {
      return 'Cumulative screening model synthesizing 16 indirect metabolic and laboratory biomarkers, accompanied by pituitary-gonadal hormone evaluation.';
    }
    return 'Screening model utilizing 11 non-invasive biometric and lifestyle indicators (demographics, body composition, sleep quality, and vitality markers).';
  };

  // Top SHAP Factors extracted dynamically from actual explanations
  const topFactors = useMemo(() => {
    return extractNormalizedMaleFactors(authoritativeAssessment?.explanations);
  }, [authoritativeAssessment?.explanations]);

  const handleStartTier1 = async () => {
    setIsSubmittingT1(true);
    try {
      await submitMaleTier1();
      await refreshActiveAssessment();
    } finally {
      setIsSubmittingT1(false);
    }
  };

  const renderFactorIcon = (iconType: string) => {
    switch (iconType) {
      case 'scale':
        return <Scales01 className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />;
      case 'activity':
        return <Activity className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />;
      case 'labs':
        return <Beaker01 className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />;
      default:
        return <Activity className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />;
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-4 sm:space-y-5 pb-16 text-left select-none">
      {/* ── Top Utility Row ────────────────────────────────────────────── */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsHistoryModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-[#F9FAFB] active:bg-[#F2F4F7] text-[#111318] text-xs sm:text-sm font-medium rounded-full border border-[#EAECF0] shadow-xs transition-colors cursor-pointer"
        >
          <Clock className="w-4 h-4 text-[#667085]" aria-hidden="true" />
          <span>Assessment History</span>
        </button>
      </div>

      {/* ── Primary Assessment Area (2 Columns) ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Assessment Card (~68% width on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EAECF0] p-6 sm:p-7 shadow-xs relative flex flex-col justify-between">
          <div>
            {/* Header row: Tier Badge, Model Version, View Details */}
            <div className="flex items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                  <LayersThree01 className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
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
                  className="text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors inline-flex items-center gap-1 cursor-pointer"
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
                    {riskLabel || 'Lower Screening Risk'}
                  </span>
                ) : isHigherRisk ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                    <AlertCircle className="w-4 h-4 text-[#F04438]" aria-hidden="true" />
                    {riskLabel || 'Higher Screening Risk'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]">
                    <AlertTriangle className="w-4 h-4 text-[#F79009]" aria-hidden="true" />
                    {riskLabel || 'Intermediate Screening Risk'}
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
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isLowerRisk ? 'bg-[#12B76A]' : isHigherRisk ? 'bg-[#F04438]' : 'bg-[#F79009]'
                  }`} />
                  <span>{displayProbability}</span>
                </div>
              </div>
            )}

            {/* Spectrum Bar (3 Segments matching authoritative male thresholds) */}
            <div className="w-full flex h-2.5 rounded-full overflow-hidden gap-1">
              {/* Lower Risk Segment (Green, 0 to 10%) */}
              <div
                className="bg-[#32D583] rounded-l-full"
                style={{ width: `${riskRanges.lowCutoffPercent}%` }}
              />
              {/* Intermediate Risk Segment (Neutral Gray, 10% to Cutoff) */}
              <div
                className="bg-[#EAECF0]"
                style={{ width: `${Math.max(0, riskRanges.highCutoffPercent - riskRanges.lowCutoffPercent)}%` }}
              />
              {/* Higher Risk Segment (Soft Amber/Coral, Cutoff to 100%) */}
              <div className="flex-1 bg-[#FDA29B] rounded-r-full" />
            </div>

            {/* Spectrum Range Labels */}
            <div className="flex justify-between items-start mt-2 text-xs select-none">
              <div className="text-left">
                <span className="block font-semibold text-[#027A48]">Lower Screening Risk</span>
                <span className="text-[11px] text-[#667085]">0% – {riskRanges.lowCutoffPercent}%</span>
              </div>
              <div className="text-center">
                <span className="block font-medium text-[#667085]">Intermediate Risk</span>
                <span className="text-[11px] text-[#98A2B3]">{riskRanges.lowCutoffPercent}% – {riskRanges.highCutoffPercent}%</span>
              </div>
              <div className="text-right">
                <span className="block font-semibold text-[#B42318]">Higher Screening Risk</span>
                <span className="text-[11px] text-[#98A2B3]">≥ {riskRanges.highCutoffPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Recommendation Card (~32% width on desktop) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAECF0] p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header: Target icon + Recommended Next Step */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
                <Target02 className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-bold text-[#0284C7] tracking-tight">
                Recommended Next Step
              </h2>
            </div>

            {/* Circular Icon Container */}
            <div className="w-16 h-16 rounded-full bg-[#E0F2FE] flex items-center justify-center mx-auto my-5 text-[#0284C7]">
              {!hasAssessment ? (
                <ClipboardCheck className="w-8 h-8" aria-hidden="true" />
              ) : isTier2Done ? (
                <CheckCircle className="w-8 h-8 text-[#12B76A]" aria-hidden="true" />
              ) : (
                <Beaker01 className="w-8 h-8" aria-hidden="true" />
              )}
            </div>

            {/* Action Title & Subtitle */}
            <div className="text-center space-y-1.5 px-2">
              <h3 className="text-lg font-bold text-[#111318]">
                {!hasAssessment
                  ? 'Complete Initial Screening'
                  : isTier2Done
                  ? 'Screening Complete'
                  : 'Add Clinical Labs'}
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                {!hasAssessment
                  ? 'Answer lifestyle, vitality, and biometric questions to generate your initial screening baseline.'
                  : isTier2Done
                  ? 'Both non-invasive biometrics and clinical laboratory biomarkers have been synthesized into your Tier 2 result.'
                  : 'Adding fasting metabolic markers (glucose, HbA1c, lipids, liver enzymes) refines screening accuracy to Tier 2.'}
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
                className="w-full h-11 px-4 bg-[#0284C7] hover:bg-[#0277BD] active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                <span>{isSubmittingT1 ? 'Evaluating...' : 'Start Initial Screening (Tier 1) →'}</span>
              </button>
            ) : isTier2Done ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(true)}
                  className="w-full h-11 px-4 bg-[#0284C7] hover:bg-[#0277BD] active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <File06 className="w-4 h-4" aria-hidden="true" />
                  <span>Review Full Screening Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLabsModalOpen(true)}
                  className="w-full h-10 px-4 bg-white hover:bg-[#F9FAFB] active:scale-[0.98] text-[#344054] text-sm font-medium rounded-xl border border-[#D0D5DD] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Beaker01 className="w-4 h-4 text-[#667085]" aria-hidden="true" />
                  <span>Edit Clinical Labs (Tier 2)</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartTier1}
                  disabled={isSubmittingT1}
                  className="w-full h-10 px-4 bg-white hover:bg-[#F9FAFB] active:scale-[0.98] text-[#344054] text-sm font-medium rounded-xl border border-[#D0D5DD] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw01 className="w-4 h-4 text-[#667085]" aria-hidden="true" />
                  <span>Re-evaluate Tier 1</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsLabsModalOpen(true)}
                  className="w-full h-11 px-4 bg-[#0284C7] hover:bg-[#0277BD] active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Beaker01 className="w-4 h-4" aria-hidden="true" />
                  <span>Add Clinical Labs (Tier 2) →</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdamModalOpen(true)}
                  className="w-full h-10 px-4 bg-white hover:bg-[#F0F9FF] active:scale-[0.98] text-[#0284C7] text-sm font-medium rounded-xl border border-[#BAE6FD] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
                  <span>ADAM Symptom Questionnaire</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartTier1}
                  disabled={isSubmittingT1}
                  className="w-full h-10 px-4 bg-white hover:bg-[#F9FAFB] active:scale-[0.98] text-[#344054] text-sm font-medium rounded-xl border border-[#D0D5DD] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw01 className="w-4 h-4 text-[#667085]" aria-hidden="true" />
                  <span>Re-evaluate Tier 1</span>
                </button>
              </>
            )}

            {hasAssessment && (
              <button
                type="button"
                onClick={() => navigate('/doctors?pathway=male_hypogonadism')}
                className="w-full h-10 px-4 bg-white hover:bg-[#F0F9FF] active:scale-[0.98] text-[#0284C7] text-sm font-medium rounded-xl border border-[#BAE6FD] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
                <span>Find Relevant Specialists</span>
              </button>
            )}

            {/* Subtle encouragement slogan */}
            <p className="text-[11px] italic text-[#98A2B3] text-center pt-2">
              More data. A clearer picture. A healthier you.
            </p>
          </div>
        </div>
      </div>

      {/* ── Assessment Change Summary ("What Changed?") ───────────────────── */}
      {hasAssessment && previousAssessment && authoritativeAssessment && (
        <AssessmentChangeSummary
          currentAssessment={authoritativeAssessment}
          previousAssessment={previousAssessment}
        />
      )}

      {/* ── Pituitary-Gonadal Hormone Evaluator Card (Tier 2 only) ──────────── */}
      {hasAssessment && isTier2Done && authoritativeAssessment?.hormone_pattern_interpretation && (
        <div className="bg-white rounded-2xl border border-[#BAE6FD] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F9FF] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
                <Beaker01 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111318]">
                  Pituitary-Gonadal Endocrine Signaling
                </h3>
                <p className="text-xs text-[#667085]">
                  Deterministic pattern evaluation based on LH, FSH, prolactin, and total testosterone relationships.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
              {authoritativeAssessment.hormone_pattern_interpretation.pattern_name || 'Pattern Evaluated'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            {authoritativeAssessment.hormone_pattern_interpretation.pattern_description}
          </p>
        </div>
      )}

      {/* ── Patient-Centered SHAP Explainability Engine ────────────────────── */}
      {hasAssessment && authoritativeAssessment?.shap_explanation ? (
        <PatientShapExplanation
          payload={authoritativeAssessment.shap_explanation}
          longitudinalComparison={authoritativeAssessment.longitudinal_shap_comparison}
          pathway="male_hypogonadism"
        />
      ) : (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4 select-none">
              <span className="w-1 h-2 bg-[#0284C7] rounded-xs" />
              <span className="w-1 h-3.5 bg-[#0284C7] rounded-xs" />
              <span className="w-1 h-2.5 bg-[#0284C7] rounded-xs" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111318] tracking-tight">
              What influenced your result
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#667085]">
            Key biometric and clinical indicators from your assessment that most contributed to your current screening risk.
          </p>

          {!hasAssessment ? (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 text-center shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center mx-auto mb-2 text-[#0284C7]">
                <BarChart01 className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-[#111318]">
                Complete your initial screening to see which factors influence your result.
              </p>
              <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
                Once evaluated, personalized fold-aware SHAP explainability will highlight your key metabolic and vitality drivers.
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
                  <div className="w-11 h-11 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0">
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
            Non-diagnostic statistical screening estimate. Consult a qualified healthcare professional and obtain morning fasting hormone testing for clinical diagnosis.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#98A2B3] text-[11px] shrink-0 select-none">
          <Heart className="w-3.5 h-3.5 text-[#0284C7] fill-current" aria-hidden="true" />
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
                  <LayersThree01 className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />
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
                  <div>
                    <span className="text-[#98A2B3] block">Risk Classification</span>
                    <strong className="text-[#111318] text-sm">{riskLabel || 'Evaluated'}</strong>
                  </div>
                  {modelTag && (
                    <div className="col-span-2">
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
                    <h4 className="font-semibold text-sm text-[#111318] mb-2">Key Factor Contributions</h4>
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
                  className="w-full py-2.5 bg-[#F2F4F7] hover:bg-[#EAECF0] text-[#111318] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
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
        <MaleClinicalLabsModal
          isOpen={isLabsModalOpen}
          onClose={() => setIsLabsModalOpen(false)}
          onSuccess={() => refreshActiveAssessment()}
        />
      )}

      {isHistoryModalOpen && (
        <AssessmentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}

      {isAdamModalOpen && (
        <ADAMQuestionnaireModal
          isOpen={isAdamModalOpen}
          onClose={() => setIsAdamModalOpen(false)}
          onSave={async (adamState) => {
            saveADAMResponses(adamState);
            setIsAdamModalOpen(false);
            await submitMaleTier1();
            await refreshActiveAssessment();
          }}
        />
      )}
    </div>
  );
};
