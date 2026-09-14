import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  FlaskConical,
  ImageIcon,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Info,
  Eye,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import type { ProgressiveAssessment } from '../../types/intelligence';
import { getRiskPatternDisplay } from '../../services/intelligenceService';
import { useUserHealth } from '../../context/UserHealthContext';

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
  const { assessmentNotification, dismissAssessmentNotification } = useUserHealth();
  const activeNotification = notification !== undefined ? notification : assessmentNotification;
  const handleDismiss = onDismissNotification || dismissAssessmentNotification;

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

  if (loading && !assessment) {
    return (
      <div className="p-8 rounded-[32px] bg-[#01579B] border border-[#BAE6FD] text-white shadow-sm flex items-center justify-center min-h-[220px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#BAE6FD] animate-spin" />
          <p className="text-sm font-sans text-sky-100">Evaluating progressive clinical assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-8 rounded-[32px] bg-[#01579B] border border-[#BAE6FD] text-white shadow-sm flex flex-col items-center justify-center min-h-[200px] text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-300" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-display">No Active Assessment</h3>
          <p className="text-xs text-sky-100 max-w-md">
            Complete your initial health inputs to generate your personalized Tier 1 screening result.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-5 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans cursor-pointer shadow-xs transition-all"
        >
          Initialize Tier 1 Screening
        </button>
      </div>
    );
  }

  const isMale =
    assessment.module === 'male_hypogonadism' ||
    assessment.model_name?.toLowerCase().includes('logistic') ||
    assessment.model_name?.toLowerCase().includes('male');

  const level = assessment.assessment_level;
  const isTier1 = level === 'tier_1';
  const isTier2 = level === 'tier_1_2';
  const isTier3Multimodal = level === 'tier_1_2_3';
  const hasUltrasoundOnly = Boolean(
    !isMale && (assessment.status_code === 'tier_1_3_model_unavailable' || (!isTier3Multimodal && assessment.pcom_status))
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
    if (isTier3Multimodal) return 'Complete Tier 1 + Clinical + Ultrasound Assessment';
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
      return 'Comprehensive multimodal screening combining 32 cumulative lifestyle & clinical biomarkers with deep ultrasound vision analysis.';
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
  const thresholdPct = `${Math.round(assessment.threshold * 100)}%`;

  return (
    <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#01579B] text-white shadow-sm border border-[#BAE6FD] space-y-6 overflow-hidden">
      {/* ── 1. Top Level Badge & History Action ──────────────────────────── */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-mono font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#BAE6FD]" />
            <span>{getLevelBadgeText()}</span>
          </span>
          <span className="text-[11px] font-mono text-sky-200">
            {assessment.model_version || (isMale ? 'Male Hypogonadism ML' : 'PCOS-ML')}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenHistoryModal}
          className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-sans text-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-[#BAE6FD]" />
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
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-100'
                : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeNotification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
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
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Notice when Tier 1 + Ultrasound is missing Clinical Labs ──────── */}
      {hasUltrasoundOnly && assessment.notice && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-start gap-3 text-amber-100 text-xs font-sans"
        >
          <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Clinical Labs Required for Combined Multimodal Fusion</p>
            <p className="text-amber-100/90 leading-relaxed">{assessment.notice}</p>
          </div>
        </motion.div>
      )}

      {/* ── 4. Main Risk & Statistical Probability Hero ───────────────────── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Probability Score & Classification */}
        <div className="lg:col-span-7 space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-sky-200">
              Statistical Screening Probability
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
                {probPct}
              </span>
              <span
                className={`text-xs font-bold font-mono uppercase px-3 py-1 rounded-full border ${patternDisplay.badgeClass}`}
              >
                {patternDisplay.label}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-sky-100 font-sans leading-relaxed">
            {getLevelDescription()}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-sky-200">
            <span>
              Calibrated Screening Cutoff: <strong className="text-white">{thresholdPct}</strong>
            </span>
            <span>·</span>
            <span>
              Active Status: <strong className="text-emerald-300">Current Authoritative</strong>
            </span>
          </div>
        </div>

        {/* Right: Ultrasound / PCOM Snapshot (if processed) */}
        {!isMale && assessment.pcom_status && (
          <div className="lg:col-span-5 p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-sky-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#BAE6FD]" />
                <span>Pelvic Ultrasound Analysis</span>
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  assessment.pcom_status === 'PCOM Detected'
                    ? 'bg-rose-400/20 text-rose-200 border-rose-400/40'
                    : 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40'
                }`}
              >
                {assessment.pcom_status}
              </span>
            </div>

            {assessment.gradcam_b64 && (
              <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/15" onClick={() => setShowGradCamModal(true)}>
                <img
                  src={`data:image/jpeg;base64,${assessment.gradcam_b64}`}
                  alt="Grad-CAM spatial heatmap"
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 text-[11px] font-sans text-white flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Inspect Spatial Heatmap
                  </span>
                </div>
              </div>
            )}

            {isTier3Multimodal && assessment.fusion_details && (
              <div className="text-[11px] font-mono text-sky-100 space-y-1 pt-1 border-t border-white/10">
                <div className="flex justify-between">
                  <span>Clinical Weight (95%):</span>
                  <strong className="text-white">{(assessment.fusion_details.clinical_probability * 100).toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ultrasound Weight (5%):</span>
                  <strong className="text-white">{(assessment.fusion_details.ultrasound_pcom_probability * 100).toFixed(1)}%</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right: Male Pituitary-Gonadal Hormone Evaluator (if available) */}
        {isMale && assessment.hormone_pattern_interpretation && (
          <div className="lg:col-span-5 p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-sky-200 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-[#BAE6FD]" />
                <span>Pituitary-Gonadal Signaling</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/25">
                {assessment.hormone_pattern_interpretation.pattern_name}
              </span>
            </div>

            <p className="text-xs text-sky-100 leading-relaxed font-sans">
              {assessment.hormone_pattern_interpretation.pattern_description}
            </p>

            {assessment.hormone_pattern_interpretation.direct_measurements && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                {assessment.hormone_pattern_interpretation.direct_measurements.total_testosterone && (
                  <div className="p-2 rounded-lg bg-black/20">
                    <span className="text-sky-200 block text-[9px] uppercase">Total Testosterone</span>
                    <span className="text-white font-bold">
                      {assessment.hormone_pattern_interpretation.direct_measurements.total_testosterone.value}{' '}
                      {assessment.hormone_pattern_interpretation.direct_measurements.total_testosterone.unit}
                    </span>
                  </div>
                )}
                {assessment.hormone_pattern_interpretation.direct_measurements.calculated_free_testosterone && (
                  <div className="p-2 rounded-lg bg-black/20">
                    <span className="text-sky-200 block text-[9px] uppercase">Free Testosterone</span>
                    <span className="text-white font-bold">
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
        <div className="relative z-10 pt-4 border-t border-white/15 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-sky-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#BAE6FD]" />
              <span>Primary Contributing Factors (TreeSHAP)</span>
            </h4>
            <span className="text-[10px] font-mono text-sky-200">
              Direction of influence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {assessment.explanations.slice(0, 4).map((exp: any, idx: number) => {
              const isPositive = exp.direction === 'positive' || exp.direction === 'increases_risk';
              const factorName = exp.friendly_name || exp.human_label || exp.feature_name || exp.feature;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white font-sans truncate">
                      {factorName}
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-sky-100 leading-tight line-clamp-2">
                    {exp.description || exp.patient_explanation || (isPositive ? 'Associated with higher screening probability.' : 'Associated with lower screening probability.')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. Progressive Next Steps & Tier Actions ───────────────────────── */}
      <div className="relative z-10 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {isMale ? (
            <>
              {isTier1 && (
                <button
                  type="button"
                  onClick={onOpenClinicalModal}
                  className="px-4 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Add Clinical Labs (Tier 2)</span>
                </button>
              )}
              {isTier2 && (
                <button
                  type="button"
                  onClick={onOpenClinicalModal}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 border border-white/25 text-white text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <FlaskConical className="w-4 h-4 text-[#BAE6FD]" />
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
                    className="px-4 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Add Clinical Labs (Tier 2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenUltrasoundModal}
                    className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 border border-white/25 text-white text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-[#BAE6FD]" />
                    <span>Upload Ultrasound (Tier 3)</span>
                  </button>
                </>
              )}

              {hasUltrasoundOnly && (
                <button
                  type="button"
                  onClick={onOpenClinicalModal}
                  className="px-5 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Add Clinical Labs for Complete Assessment</span>
                </button>
              )}

              {isTier2 && (
                <>
                  <button
                    type="button"
                    onClick={onOpenClinicalModal}
                    className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 border border-white/25 text-white text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <FlaskConical className="w-4 h-4 text-[#BAE6FD]" />
                    <span>{isPartialTier2 ? 'Add More Clinical Results' : 'Update Clinical Labs'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenUltrasoundModal}
                    className="px-5 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Add Ultrasound for Complete Multimodal Assessment</span>
                  </button>
                </>
              )}

              {isTier3Multimodal && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-sans font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Complete Multimodal Assessment Active</span>
                </div>
              )}
            </>
          )}
        </div>

        <span className="text-[10px] font-mono text-sky-200 text-center sm:text-right">
          Non-diagnostic statistical risk screening
        </span>
      </div>

      {/* ── 7. Evidence Completeness Pill (Tier 2) ─────────────────────────── */}
      {isTier2 && assessment.tier_2_available_count !== undefined && (
        <div className="relative z-10 p-3.5 rounded-2xl bg-white/10 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#BAE6FD]" />
            <span className="text-sky-100 font-sans">
              <strong>Evidence Completeness:</strong> {assessment.tier_2_available_count} of {assessment.tier_2_total_count || (isMale ? 19 : 15)} clinical & lab tests provided ({assessment.evidence_completeness_percent ?? Math.round((assessment.tier_2_available_count / (assessment.tier_2_total_count || (isMale ? 19 : 15))) * 100)}%)
            </span>
          </div>
          <span className="text-[11px] font-mono text-sky-200">
            Missing values estimated from baseline population medians
          </span>
        </div>
      )}

      {/* Non-diagnostic clinical disclaimer */}
      <p className="relative z-10 text-[9px] text-sky-200/80 leading-relaxed border-t border-white/10 pt-2 font-sans text-center sm:text-left">
        {assessment.disclaimer ||
          (isMale
            ? 'This assessment is an AI-assisted screening estimate and does not diagnose hypogonadism. A qualified clinician and appropriate hormone testing are required for diagnosis.'
            : 'OvaSense AI provides informational screening risk assessments. It does not provide medical diagnoses or prescribe treatment. Please consult a qualified healthcare provider for clinical evaluation.')}
      </p>

      {/* Grad-CAM Modal */}
      <AnimatePresence>
        {showGradCamModal && assessment.gradcam_b64 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowGradCamModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-lg w-full p-6 rounded-[32px] bg-[#01579B] border border-[#BAE6FD] text-white space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display">Ultrasound Spatial Heatmap (Grad-CAM)</h3>
                <button
                  type="button"
                  onClick={() => setShowGradCamModal(false)}
                  className="p-1 rounded-lg hover:bg-white/15 text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <img
                src={`data:image/jpeg;base64,${assessment.gradcam_b64}`}
                alt="Enlarged Grad-CAM Heatmap"
                className="w-full h-auto rounded-2xl border border-white/15"
              />

              <p className="text-xs text-sky-100 font-sans leading-relaxed">
                Grad-CAM highlights regions of the pelvic ultrasound image that most strongly influenced the neural network&apos;s ovarian morphology assessment.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
