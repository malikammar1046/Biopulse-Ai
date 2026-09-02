import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  ClipboardCheck,
} from 'lucide-react';
import type { DigitalTwinInsight } from '../../types/dashboard';
import { useUserHealth } from '../../context/UserHealthContext';
import {
  getRiskPatternDisplay,
  formatProbability,
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
  } = useUserHealth();

  const assessment = mlAssessment;
  const loadState: LoadState = mlAssessmentLoading && !assessment
    ? 'loading'
    : assessment
    ? assessment.risk_category === 'insufficient_data' || assessment.backend_mode === 'insufficient_data'
      ? 'insufficient_data'
      : 'ml'
    : mlAssessmentError
    ? 'error'
    : mlAssessmentLoading
    ? 'loading'
    : 'idle';

  // ---------------------------------------------------------------------------
  // Derived display values from real Ovasense-ML screening model
  // ---------------------------------------------------------------------------
  const isML = loadState === 'ml' && assessment !== null;
  const isInsufficient = loadState === 'insufficient_data' && assessment !== null;
  const currentCategory = assessment?.risk_category || assessment?.risk_pattern;
  const patternDisplay = isML ? getRiskPatternDisplay(currentCategory) : null;
  const pcosProbStr = isML && assessment?.pcos_probability !== undefined && assessment?.pcos_probability !== null
    ? formatProbability(assessment.pcos_probability)
    : null;
  const confidenceStr = isML ? formatConfidence(assessment?.confidence) : null;
  const threshold = assessment?.screening_threshold ?? 0.38;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[#1C0D2E] via-[#140822] to-[#0F041B] text-white shadow-xl flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden border border-white/10">
      {/* Background volumetric ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#8E3EAF]/25 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#6E2D8B]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* ── 1. Header Bar ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-md shadow-purple-950/40">
            {loadState === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-white">
                OvaSense PCOS Screening
              </h3>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  isML
                    ? 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/30'
                    : isInsufficient
                    ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30'
                    : loadState === 'error'
                    ? 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/30'
                    : 'bg-white/10 text-white/50 border-white/10'
                }`}
              >
                {isML
                  ? 'Trained Model (Joblib)'
                  : isInsufficient
                  ? 'Building Profile'
                  : loadState === 'error'
                  ? 'Backend Offline'
                  : 'Analyzing…'}
              </span>
            </div>
            <span className="text-xs text-[#B4A6C7] font-sans">
              {isML
                ? 'Clinical risk screening powered by TreeSHAP explainability'
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
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24] animate-pulse" />
        ) : isML ? (
          <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse" />
        ) : isInsufficient ? (
          <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] shadow-[0_0_8px_#FBBF24]" />
        ) : (
          <button
            type="button"
            onClick={() => refreshMlAssessment(true)}
            title="Retry assessment"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#CDBDD8] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── 2. Loading State ──────────────────────────────────────────────── */}
      {loadState === 'loading' && (
        <div className="relative z-10 space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse">
            <Loader2 className="w-5 h-5 text-[#D8B4FE] animate-spin shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white font-sans">
                Analyzing your health profile...
              </p>
              <p className="text-[11px] text-[#A797BD]">
                Running OvaSense Extra Trees screening model & TreeSHAP calculations
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
            <div className="h-3 bg-white/5 rounded-full w-full animate-pulse" />
          </div>
        </div>
      )}

      {/* ── 3. Error State ────────────────────────────────────────────────── */}
      {loadState === 'error' && (
        <div className="relative z-10 space-y-3 p-4 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FB7185] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Unable to generate screening result</h4>
              <p className="text-xs text-[#CDBDD8] leading-relaxed font-sans">
                We couldn&apos;t retrieve your latest screening assessment from the OvaSense intelligence engine.
                Please ensure the backend is running and try again.
              </p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => refreshMlAssessment(true)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Assessment</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Insufficient Data State ────────────────────────────────────── */}
      {isInsufficient && assessment && (
        <div className="relative z-10 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Build your health profile</h4>
                <p className="text-xs text-amber-100/90 leading-relaxed font-sans">
                  We don&apos;t have enough logged health information to generate a reliable screening assessment yet.
                  Add your biometrics and log your menstrual cycle to activate the model.
                </p>
              </div>
            </div>

            {assessment.data_quality?.missing_features && assessment.data_quality.missing_features.length > 0 && (
              <div className="pt-2 border-t border-amber-400/15 space-y-1.5">
                <p className="text-[10px] font-mono text-amber-300 uppercase tracking-wide">
                  Required information missing:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {assessment.data_quality.missing_features.map((feat, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-200 border border-amber-400/30 font-mono"
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
      {isML && assessment && (
        <div className="relative z-10 space-y-5">
          {/* Main Risk & Probability Score Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#A797BD] tracking-wider block">
                  Estimated Screening Probability
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                    {pcosProbStr || '—'}
                  </span>
                  <span className="text-xs font-mono text-[#A797BD]">PCOS probability</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`text-xs font-bold font-mono uppercase px-3 py-1.5 rounded-full border shadow-sm ${patternDisplay!.badgeClass}`}
                >
                  {patternDisplay!.label}
                </span>
                <span className="text-[11px] font-mono text-[#A797BD]">
                  Screening cutoff: <strong className="text-white">{(threshold * 100).toFixed(0)}%</strong>
                  {confidenceStr && <span className="ml-1 text-[#CDBDD8]">· Conf: {confidenceStr}</span>}
                </span>
              </div>
            </div>

            {/* Assessment description */}
            <p className="text-xs sm:text-sm text-[#EDE4F7] font-medium leading-relaxed font-sans pt-1 border-t border-white/5">
              {assessment.risk_category_description || assessment.risk_pattern_description}
            </p>
          </div>
        </div>
      )}

      {/* ── 11. Action Button & Clinical Non-Diagnostic Disclaimer ────────── */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onOpenChat(insight.suggestedChatPrompt || 'Explain my PCOS screening assessment and key factors')}
            className="px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Discuss with OvaSense AI</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/assessment')}
            className="px-4 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#E3D5EE] hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-[#FDA4AF]" />
            <span>Update Questionnaire</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-[#A797BD] text-center sm:text-right max-w-[220px]">
          {isML ? 'Trained ML Screening · Non-Diagnostic' : 'Clinical Screening Aid · Non-Diagnostic'}
        </span>
      </div>

      {/* Standard non-diagnostic clinical disclaimer */}
      <p className="relative z-10 text-[9px] text-[#8E7E9F] leading-relaxed border-t border-white/5 pt-2 font-sans text-center sm:text-left">
        {assessment?.disclaimer ||
          'This assessment is generated by machine learning for informational screening purposes only and does not constitute a medical diagnosis. Consult a qualified healthcare professional for diagnostic evaluation.'}
      </p>
    </div>
  );
};
