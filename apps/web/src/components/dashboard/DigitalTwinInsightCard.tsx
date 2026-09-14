import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import type { DigitalTwinInsight } from '../../types/dashboard';
import { useUserHealth } from '../../context/UserHealthContext';
import {
  getRiskPatternDisplay,
  formatConfidence,
} from '../../services/intelligenceService';

interface DigitalTwinProps {
  insight: DigitalTwinInsight; // local fallback context (for prompt guidance only)
  onOpenChat: (prompt?: string) => void;
}

type LoadState = 'idle' | 'loading' | 'ml' | 'insufficient_data' | 'error';

export const DigitalTwinInsightCard: React.FC<DigitalTwinProps> = ({
  insight,
  onOpenChat,
}) => {
  const navigate = useNavigate();
  const {
    mlAssessment,
    mlAssessmentLoading,
    mlAssessmentError,
    refreshMlAssessment,
    adaptiveProfile,
    activeAssessment,
    assessmentLoading,
    refreshActiveAssessment,
  } = useUserHealth();

  // ---------------------------------------------------------------------------
  // Derived display values prioritizing authoritative progressive PCOS-ML model
  // ---------------------------------------------------------------------------
  const hasActive = Boolean(activeAssessment);
  const probVal = activeAssessment ? activeAssessment.probability : mlAssessment?.pcos_probability;
  const probPercent =
    activeAssessment?.probability_percent !== undefined
      ? activeAssessment.probability_percent
      : probVal !== null && probVal !== undefined
      ? probVal * 100
      : null;

  const isML = Boolean(hasActive || (mlAssessment && mlAssessment.risk_category !== 'insufficient_data'));
  const isInsufficient = !isML && Boolean(mlAssessment?.risk_category === 'insufficient_data');

  const isLoading = (mlAssessmentLoading || assessmentLoading) && !activeAssessment && !mlAssessment;
  const loadState: LoadState = isLoading
    ? 'loading'
    : isInsufficient
    ? 'insufficient_data'
    : isML
    ? 'ml'
    : mlAssessmentError
    ? 'error'
    : mlAssessmentLoading || assessmentLoading
    ? 'loading'
    : 'idle';

  const currentCategory = activeAssessment?.risk_category || mlAssessment?.risk_category || mlAssessment?.risk_pattern || 'lower';
  const patternDisplay = isML ? getRiskPatternDisplay(currentCategory) : null;
  const pcosProbStr = probPercent !== null && probPercent !== undefined ? `${probPercent.toFixed(1)}%` : null;
  const confidenceStr = mlAssessment?.confidence ? formatConfidence(mlAssessment.confidence) : null;
  const threshold = activeAssessment?.threshold ?? mlAssessment?.screening_threshold ?? 0.38;

  const handleRetry = async () => {
    await refreshActiveAssessment();
    await refreshMlAssessment(true);
  };

  const getTierBadgeText = () => {
    if (!isML) return 'Building Profile';
    if (activeAssessment?.assessment_level === 'tier_1_2_3') return 'Complete Multimodal';
    if (activeAssessment?.assessment_level === 'tier_1_2') return 'Tier 1 + Clinical';
    if (activeAssessment?.pcom_status || activeAssessment?.status_code === 'tier_1_3_model_unavailable') return 'Tier 1 + Ultrasound';
    return 'Tier 1 Active';
  };

  const getAssessmentDescription = () => {
    if (activeAssessment?.assessment_level === 'tier_1_2_3') {
      return 'Comprehensive multimodal screening combining 32 cumulative lifestyle & clinical biomarkers with deep ultrasound vision analysis.';
    }
    if (activeAssessment?.assessment_level === 'tier_1_2') {
      return 'Cumulative screening model synthesizing 32 features (demographics, cycle rhythms, symptoms, and clinical laboratory biomarkers).';
    }
    if (activeAssessment?.pcom_status) {
      return 'Tier 1 biometrics evaluated with pelvic ultrasound morphology analysis.';
    }
    if (activeAssessment) {
      return 'Screening model utilizing non-invasive cycle regularity, biometrics, symptoms, and lifestyle indicators.';
    }
    return mlAssessment?.risk_category_description || mlAssessment?.risk_pattern_description || 'Algorithmic screening synthesis of your clinical records.';
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 sm:p-7 rounded-[28px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden">
      {/* ── 1. Header Bar ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
            {loadState === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-display text-[#0F172A]">
                OvaSense PCOS Screening
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                {getTierBadgeText()}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]">
                {adaptiveProfile?.overallCompletenessPercentage || 0}% Complete
              </span>
            </div>
            <span className="text-xs text-[#64748B] font-sans">
              {isML
                ? 'Clinical risk screening powered by progressive intelligence'
                : isInsufficient
                ? 'Health profile in progress — more data needed'
                : loadState === 'error'
                ? 'Could not connect to the ML assessment engine'
                : 'Connecting to OvaSense intelligence engine…'}
            </span>
          </div>
        </div>

        {/* Live status dot */}
        {loadState === 'loading' ? (
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        ) : isML ? (
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
        ) : isInsufficient ? (
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        ) : (
          <button
            type="button"
            onClick={handleRetry}
            title="Retry assessment"
            className="p-1.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── 2. Loading State ──────────────────────────────────────────────── */}
      {loadState === 'loading' && (
        <div className="relative z-10 space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-pulse">
            <Loader2 className="w-5 h-5 text-[#0288D1] animate-spin shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#0F172A] font-sans">
                Analyzing your health profile...
              </p>
              <p className="text-[11px] text-[#64748B]">
                Running progressive screening model & TreeSHAP calculations
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Error State ────────────────────────────────────────────────── */}
      {loadState === 'error' && (
        <div className="relative z-10 space-y-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#0F172A]">Unable to generate screening result</h4>
              <p className="text-xs text-[#475569] leading-relaxed font-sans">
                We couldn&apos;t retrieve your latest screening assessment from the OvaSense intelligence engine.
                Please ensure the backend is running and try again.
              </p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#0F172A] bg-white border border-rose-200 hover:bg-rose-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0288D1]" />
              <span>Retry Assessment</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Insufficient Data State ────────────────────────────────────── */}
      {isInsufficient && (
        <div className="relative z-10 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">Build your health profile</h4>
                <p className="text-xs text-[#475569] leading-relaxed font-sans">
                  We don&apos;t have enough logged health information to generate a reliable screening assessment yet.
                  Add your biometrics and log your menstrual cycle to activate the model.
                </p>
              </div>
            </div>

            {mlAssessment?.data_quality?.missing_features && mlAssessment.data_quality.missing_features.length > 0 && (
              <div className="pt-2 border-t border-amber-200 space-y-1.5">
                <p className="text-[10px] font-mono text-amber-800 uppercase tracking-wide font-bold">
                  Required information missing:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {mlAssessment.data_quality.missing_features.map((feat, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-white text-amber-800 border border-amber-200 font-mono"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Main ML Screening Assessment Result ────────────────────────── */}
      {isML && (
        <div className="relative z-10 space-y-4">
          {/* Main Risk & Probability Score Banner */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#64748B] tracking-wider block">
                  Estimated Screening Probability
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#0F172A] tracking-tight">
                    {pcosProbStr || '—'}
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">PCOS screening score</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                {patternDisplay && (
                  <span
                    className={`text-xs font-bold font-mono uppercase px-3 py-1.5 rounded-full border shadow-xs ${patternDisplay.badgeClass}`}
                  >
                    {patternDisplay.label}
                  </span>
                )}
                <span className="text-[11px] font-mono text-[#64748B]">
                  Screening cutoff: <strong className="text-[#0F172A]">{(threshold * 100).toFixed(0)}%</strong>
                  {confidenceStr && <span className="ml-1 text-[#475569]">· Conf: {confidenceStr}</span>}
                </span>
              </div>
            </div>

            {/* Assessment description */}
            <p className="text-xs sm:text-sm text-[#334155] font-medium leading-relaxed font-sans pt-2 border-t border-[#E2E8F0]">
              {getAssessmentDescription()}
            </p>
          </div>
        </div>
      )}

      {/* ── 6. Action Button & Clinical Non-Diagnostic Disclaimer ────────── */}
      <div className="relative z-10 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onOpenChat(insight.suggestedChatPrompt || 'Explain my PCOS screening assessment and key factors')}
            className="px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Discuss with OvaSense AI</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/assessment')}
            className="px-4 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#0288D1] hover:text-[#01579B] bg-white hover:bg-[#F0F9FF] border border-[#BAE6FD] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-[#0288D1]" />
            <span>3-Tier Screening Profile</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-[#64748B] text-center sm:text-right max-w-[220px]">
          {isML ? 'Trained ML Screening · Non-Diagnostic' : 'Clinical Screening Aid · Non-Diagnostic'}
        </span>
      </div>

      {/* Standard non-diagnostic clinical disclaimer */}
      <p className="relative z-10 text-[9px] text-[#64748B] leading-relaxed border-t border-[#E2E8F0] pt-2 font-sans text-center sm:text-left">
        {activeAssessment?.disclaimer ||
          mlAssessment?.disclaimer ||
          'This assessment is generated by machine learning for informational screening purposes only and does not constitute a medical diagnosis. Consult a qualified healthcare professional for diagnostic evaluation.'}
      </p>
    </div>
  );
};
