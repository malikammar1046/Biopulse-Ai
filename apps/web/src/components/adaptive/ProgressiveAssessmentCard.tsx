import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart01,
  LayersThree01,
  Beaker01,
  Image01,
  Clock,
  LineChartUp01,
  LineChartDown01,
  AlertCircle,
  CheckCircle,
  InfoCircle,
  Eye,
  ShieldTick,
  RefreshCw01,
  XClose,
} from '@untitledui/icons';
import type { ProgressiveAssessment } from '../../types/intelligence';
import { getRiskPatternDisplay } from '../../services/intelligenceService';
import { useUserHealth } from '../../context/UserHealthContext';
import { AssessmentChangeSummary } from './AssessmentChangeSummary';

interface ProgressiveAssessmentCardProps {
  assessment: ProgressiveAssessment | null;
  loading: boolean;
  onOpenClinicalModal: () => void;
  onOpenUltrasoundModal: () => void;
  onOpenHistoryModal: () => void;
  onRefresh: () => void;
  notification?: { message: string; type: 'success' | 'error' } | null;
  onDismissNotification?: () => void;
}

export const ProgressiveAssessmentCard: React.FC<ProgressiveAssessmentCardProps> = ({
  assessment,
  loading,
  onOpenClinicalModal,
  onOpenUltrasoundModal,
  onOpenHistoryModal,
  onRefresh,
  notification,
  onDismissNotification,
}) => {
  const { assessmentNotification, dismissAssessmentNotification, assessmentHistory } = useUserHealth();
  const activeNotification = notification !== undefined ? notification : assessmentNotification;
  const handleDismiss = onDismissNotification || dismissAssessmentNotification;

  const previousAssessment = React.useMemo(() => {
    if (!assessment) return null;
    if (assessment.replaced_assessment_id) {
      const match = assessmentHistory.find(
        (h) => h.id === assessment.replaced_assessment_id || h.assessment_id === assessment.replaced_assessment_id
      );
      if (match) return match;
    }
    return (
      assessmentHistory.find(
        (h) => h.id !== assessment.id && h.assessment_id !== assessment.assessment_id
      ) || null
    );
  }, [assessment, assessmentHistory]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeNotification) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, 5000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeNotification, handleDismiss]);

  const [showGradCamModal, setShowGradCamModal] = useState(false);

  const getGradcamSrc = (b64?: string | null) => {
    if (!b64) return '';
    if (b64.startsWith('data:')) return b64;
    return `data:image/png;base64,${b64}`;
  };

  const isMale =
    assessment?.module === 'male_hypogonadism' ||
    assessment?.model_name?.toLowerCase().includes('logistic') ||
    assessment?.model_name?.toLowerCase().includes('male');

  if (loading && !assessment) {
    return (
      <div className="p-8 rounded-[32px] bg-white border border-slate-200 text-slate-900 shadow-xs flex items-center justify-center min-h-[220px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw01
            className={`w-8 h-8 animate-spin ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`}
            aria-hidden="true"
          />
          <p className="text-sm font-sans text-slate-500">
            Evaluating progressive clinical assessment...
          </p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-8 rounded-[32px] bg-white border border-slate-200 text-slate-900 shadow-xs flex flex-col items-center justify-center min-h-[200px] text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-display text-slate-900">
            No Active Assessment
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            Complete your initial health inputs to generate your personalized Tier 1 screening result.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={`px-5 py-2.5 rounded-2xl text-white text-xs font-bold font-sans cursor-pointer shadow-xs transition-all ${
            isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
          }`}
        >
          Initialize Tier 1 Screening
        </button>
      </div>
    );
  }

  const level = assessment.assessment_level;
  const isTier1 = level === 'tier_1';
  const isTier2 = level === 'tier_1_2';
  const isTier1_3 = level === 'tier_1_3';
  const isTier3Multimodal = level === 'tier_1_2_3';
  const hasUltrasoundOnly = Boolean(
    !isMale && (isTier1_3 || assessment.status_code === 'tier_1_3_model_unavailable')
  );

  // Determine if Tier 2 was evaluated with partial clinical evidence
  const isPartialTier2 =
    isTier2 &&
    (assessment.tier_2_available_count === undefined ||
      assessment.tier_2_total_count === undefined ||
      assessment.tier_2_available_count < assessment.tier_2_total_count);

  // Dynamic Level Titles
  const getLevelBadgeText = () => {
    if (isMale) {
      if (isTier2) return isPartialTier2 ? 'Tier 1 + Available Clinical Evidence' : 'Tier 1 + Complete Clinical Assessment';
      return 'Tier 1 Biometric Assessment';
    }
    if (isTier3Multimodal) return 'Tier 1 + Clinical Assessment with Independent Ultrasound Morphology';
    if (isTier2) return isPartialTier2 ? 'Tier 1 + Available Clinical Evidence' : 'Tier 1 + Clinical Assessment';
    if (hasUltrasoundOnly) return 'Tier 1 + Ultrasound Assessment';
    return 'Tier 1 Assessment';
  };

  const getLevelDescription = () => {
    if (isMale) {
      if (isTier2) {
        if (isPartialTier2) {
          return 'This assessment synthesized available clinical and laboratory results. You can provide additional tests to refine the model estimate.';
        }
        return 'Cumulative screening model synthesizing 16 lifestyle, biometric, and clinical laboratory biomarkers.';
      }
      return 'Screening model utilizing 11 non-invasive features (demographics, body composition, sleep, and energy indicators).';
    }
    if (isTier3Multimodal) {
      return 'Current Tier 2 model-derived screening estimate anchored in 32 validated lifestyle and laboratory biomarkers, accompanied by independent ultrasound PCOM morphology.';
    }
    if (isTier2) {
      if (isPartialTier2) {
        return 'This assessment used the clinical results currently available. You can add more results later to refine it.';
      }
      return 'Cumulative screening model synthesizing 32 features (demographics, cycle rhythms, symptoms, and clinical laboratory biomarkers).';
    }
    if (hasUltrasoundOnly) {
      return 'Tier 1 biometrics evaluated. Pelvic ultrasound analyzed for morphology; clinical lab data needed for combined multimodal AI scoring.';
    }
    return 'Screening model utilizing 16 non-invasive features (cycle regularity, biometrics, symptoms, and lifestyle indicators).';
  };

  const currentCategory = assessment.risk_category || 'lower';
  const patternDisplay = getRiskPatternDisplay(currentCategory);
  const probPct = `${assessment.probability_percent?.toFixed(1) ?? (assessment.probability * 100).toFixed(1)}%`;

  const badgeClass = isMale
    ? 'bg-sky-50 border-sky-200/80 text-[#0288D1]'
    : 'bg-pink-50 border-pink-200/80 text-pink-700';

  const primaryBtnClass = isMale
    ? 'bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-xs'
    : 'bg-[#F43F7D] hover:bg-[#DC326C] text-white shadow-xs';

  const secondaryBtnClass = isMale
    ? 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0288D1]'
    : 'bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700';

  return (
    <div className="relative p-6 sm:p-8 rounded-[32px] bg-white text-slate-900 shadow-xs border border-slate-200/90 space-y-6 overflow-hidden">
      {/* ── 1. Top Level Badge & History Action ──────────────────────────── */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`px-3.5 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${badgeClass}`}>
            <LayersThree01 className={`w-3.5 h-3.5 ${isMale ? 'text-[#0288D1]' : 'text-pink-600'}`} aria-hidden="true" />
            <span>{getLevelBadgeText()}</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {assessment.model_version || (isMale ? 'Male Hypogonadism ML' : 'PCOS-ML')}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenHistoryModal}
          className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-sans text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>Assessment History</span>
        </button>
      </div>

      {/* ── 2. Transient Assessment Notification Banner ──────────────────────── */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            key={activeNotification.message}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
            aria-live="polite"
            className={`relative z-10 p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-sans ${
              activeNotification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeNotification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              )}
              <span>
                <strong>{activeNotification.type === 'error' ? 'Notice:' : 'Updated Result:'}</strong>{' '}
                {activeNotification.message.replace(/^Updated Result:\s*/i, '')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <XClose className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Notice when Tier 1 + Ultrasound is missing Clinical Labs ──────── */}
      {hasUltrasoundOnly && assessment.notice && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs font-sans"
        >
          <InfoCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Clinical Labs Required for Combined Multimodal Fusion
            </p>
            <p className="text-slate-600 leading-relaxed">{assessment.notice}</p>
          </div>
        </motion.div>
      )}

      {/* ── 4. Main Risk & Statistical Probability Hero ───────────────────── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Probability Score & Classification */}
        <div className="lg:col-span-7 space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Statistical Screening Probability
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 tracking-tight">
                {probPct}
              </span>
              <span
                className={`text-xs font-bold font-mono uppercase px-3 py-1 rounded-full border ${patternDisplay.badgeClass}`}
              >
                {patternDisplay.label}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
            {getLevelDescription()}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
            <span>
              Screening Policy: <strong className="text-slate-900">{assessment.screening_policy_version ? `Policy ${assessment.screening_policy_version.toUpperCase()}` : 'Policy v2'}</strong>
            </span>
            <span>·</span>
            <span>
              Active Status: <strong className="text-emerald-600">Current Authoritative</strong>
            </span>
          </div>
        </div>

        {/* Right: Ultrasound / PCOM Snapshot (if processed for Tier 3 or Tier 1+3) */}
        {!isMale && (isTier3Multimodal || hasUltrasoundOnly) && assessment.pcom_status && (
          <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                <Image01 className="w-3.5 h-3.5 text-pink-600" aria-hidden="true" />
                <span>Pelvic Ultrasound Analysis</span>
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  assessment.pcom_status === 'PCOM Detected'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : assessment.pcom_status === 'PCOM Not Detected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {assessment.pcom_status}
              </span>
            </div>

            {assessment.gradcam_b64 && (
              <div
                className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200"
                onClick={() => setShowGradCamModal(true)}
              >
                <img
                  src={getGradcamSrc(assessment.gradcam_b64)}
                  alt="Grad-CAM spatial heatmap"
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 text-[11px] font-sans text-white flex items-center gap-1">
                    <Eye className="w-3 h-3" aria-hidden="true" /> Inspect Spatial Heatmap
                  </span>
                </div>
              </div>
            )}

            {isTier3Multimodal && assessment.fusion_details && (
              <div className="text-[11px] font-mono text-slate-600 space-y-1.5 pt-1.5 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Clinical Risk (Tier 2):</span>
                  <strong className="text-slate-900">
                    {(assessment.fusion_details.clinical_probability * 100).toFixed(1)}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>PCOM Model Output:</span>
                  <strong className="text-slate-900">
                    {assessment.fusion_details.ultrasound_pcom_probability !== undefined && assessment.fusion_details.ultrasound_pcom_probability !== null
                      ? `${(assessment.fusion_details.ultrasound_pcom_probability * 100).toFixed(1)}%`
                      : assessment.pcom_status === 'Indeterminate'
                      ? 'Indeterminate'
                      : 'Unavailable'}
                  </strong>
                </div>
                <p className="text-[10px] text-slate-500 font-sans leading-normal pt-0.5">
                  AI-estimated PCOM-like morphology finding. Not a confirmed clinical criterion or medical diagnosis.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Right: Male Pituitary-Gonadal Hormone Evaluator (Tier 2 only) */}
        {isMale && isTier2 && assessment.hormone_pattern_interpretation && (
          <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                <Beaker01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                <span>Pituitary-Gonadal Signaling</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0288D1] border border-sky-200">
                {assessment.hormone_pattern_interpretation.pattern_name}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {assessment.hormone_pattern_interpretation.pattern_description}
            </p>

            {assessment.hormone_pattern_interpretation.direct_measurements && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px] font-mono">
                {assessment.hormone_pattern_interpretation.direct_measurements.total_testosterone && (
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Total Testosterone</span>
                    <span className="text-slate-900 font-bold">
                      {assessment.hormone_pattern_interpretation.direct_measurements.total_testosterone.value}{' '}
                      {assessment.hormone_pattern_interpretation.direct_measurements.total_testosterone.unit}
                    </span>
                  </div>
                )}
                {assessment.hormone_pattern_interpretation.direct_measurements.calculated_free_testosterone && (
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Free Testosterone</span>
                    <span className="text-slate-900 font-bold">
                      {assessment.hormone_pattern_interpretation.direct_measurements.calculated_free_testosterone.value}{' '}
                      {assessment.hormone_pattern_interpretation.direct_measurements.calculated_free_testosterone.unit}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 5. TreeSHAP Influential Factors ─────────────────────────────────── */}
      {assessment.explanations && assessment.explanations.length > 0 && (
        <div className="relative z-10 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BarChart01 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Primary Contributing Factors {isMale ? '(Clinical Rules)' : '(TreeSHAP)'}</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Direction of influence</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {assessment.explanations.slice(0, 4).map((exp: any, idx: number) => {
              const isPositive = exp.direction === 'positive' || exp.direction === 'increases_risk';
              const factorName = exp.friendly_name || exp.human_label || exp.feature_name || exp.feature;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-900 font-sans truncate">
                      {factorName}
                    </span>
                    {isPositive ? (
                      <LineChartUp01 className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />
                    ) : (
                      <LineChartDown01 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                    {exp.description ||
                      exp.patient_explanation ||
                      (isPositive
                        ? 'Associated with higher screening probability.'
                        : 'Associated with lower screening probability.')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. Progressive Next Steps & Tier Actions ───────────────────────── */}
      <div className="relative z-10 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {isMale ? (
            <>
              {isTier1 && (
                <button
                  type="button"
                  onClick={onOpenClinicalModal}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${primaryBtnClass}`}
                >
                  <Beaker01 className="w-4 h-4" aria-hidden="true" />
                  <span>Add Clinical Labs (Tier 2)</span>
                </button>
              )}
              {isTier2 && (
                <button
                  type="button"
                  onClick={onOpenClinicalModal}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${secondaryBtnClass}`}
                >
                  <Beaker01 className="w-4 h-4" aria-hidden="true" />
                  <span>{isPartialTier2 ? 'Add More Clinical Results' : 'Update Clinical Labs'}</span>
                </button>
              )}
            </>
          ) : (
            <>
              {isTier1 && (
                <>
                  <button
                    type="button"
                    onClick={onOpenClinicalModal}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${primaryBtnClass}`}
                  >
                    <Beaker01 className="w-4 h-4" aria-hidden="true" />
                    <span>Add Clinical Labs (Tier 2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenUltrasoundModal}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${secondaryBtnClass}`}
                  >
                    <Image01 className="w-4 h-4" aria-hidden="true" />
                    <span>Upload Ultrasound (Tier 3)</span>
                  </button>
                </>
              )}

              {hasUltrasoundOnly && (
                <button
                  type="button"
                  onClick={onOpenClinicalModal}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${primaryBtnClass}`}
                >
                  <Beaker01 className="w-4 h-4" aria-hidden="true" />
                  <span>Add Clinical Labs for Complete Assessment</span>
                </button>
              )}

              {isTier2 && (
                <>
                  <button
                    type="button"
                    onClick={onOpenClinicalModal}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${secondaryBtnClass}`}
                  >
                    <Beaker01 className="w-4 h-4" aria-hidden="true" />
                    <span>{isPartialTier2 ? 'Add More Clinical Results' : 'Update Clinical Labs'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenUltrasoundModal}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all ${primaryBtnClass}`}
                  >
                    <Image01 className="w-4 h-4" aria-hidden="true" />
                    <span>Add Ultrasound for Complete Multimodal Assessment</span>
                  </button>
                </>
              )}

              {isTier3Multimodal && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-sans font-bold">
                  <ShieldTick className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Complete Multimodal Assessment Active</span>
                </div>
              )}
            </>
          )}
        </div>

        <span className="text-[10px] font-mono text-slate-400 text-center sm:text-right">
          Non-diagnostic statistical risk screening
        </span>
      </div>

      {/* ── 7. Evidence Completeness Pill (Tier 2) ─────────────────────────── */}
      {isTier2 && assessment.tier_2_available_count !== undefined && (
        <div className="relative z-10 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isMale ? 'bg-[#0288D1]' : 'bg-[#F43F7D]'}`} />
            <span className="text-slate-600 font-sans">
              <strong>Evidence Completeness:</strong> {assessment.tier_2_available_count} of{' '}
              {assessment.tier_2_total_count || (isMale ? 19 : 15)} clinical & lab tests provided (
              {assessment.evidence_completeness_percent ??
                Math.round(
                  (assessment.tier_2_available_count / (assessment.tier_2_total_count || (isMale ? 19 : 15))) *
                    100
                )}
              %)
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenClinicalModal}
            className={`font-semibold cursor-pointer ${
              isMale ? 'text-[#0288D1] hover:underline' : 'text-pink-600 hover:underline'
            }`}
          >
            {isPartialTier2 ? 'Add Remaining Tests →' : 'Review Entered Labs →'}
          </button>
        </div>
      )}

      {/* ── Grad-CAM Inspection Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showGradCamModal && assessment.gradcam_b64 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-2xl w-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-slate-900">
                    Grad-CAM Morphological Focus
                  </h3>
                  <p className="text-xs text-slate-500">
                    Neural activation overlay identifying visual cues in pelvic ultrasound.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGradCamModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <XClose className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
                <img
                  src={getGradcamSrc(assessment.gradcam_b64)}
                  alt="Full-size Grad-CAM Heatmap"
                  className="w-full max-h-[60vh] object-contain"
                />
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Warm colors indicate regions that weighed most heavily in determining ovarian morphology.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reassessment Change Explanation */}
      {assessment && previousAssessment && (
        <AssessmentChangeSummary
          currentAssessment={assessment}
          previousAssessment={previousAssessment}
        />
      )}
    </div>
  );
};
