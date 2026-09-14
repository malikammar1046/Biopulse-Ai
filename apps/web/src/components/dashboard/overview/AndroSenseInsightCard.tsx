import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useUserHealth } from '../../../context/UserHealthContext';
import { ROUTES } from '../../../constants/routes';
import { MaleClinicalLabsModal } from '../../adaptive/MaleClinicalLabsModal';

interface AndroSenseInsightCardProps {
  onOpenChat: (prompt?: string) => void;
}

export const AndroSenseInsightCard: React.FC<AndroSenseInsightCardProps> = ({ onOpenChat }) => {
  const navigate = useNavigate();
  const {
    activeAssessment,
    assessmentLoading,
    assessmentNotification,
    dismissAssessmentNotification,
    submitMaleTier1,
    refreshActiveAssessment,
  } = useUserHealth();

  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);
  const [runningTier1, setRunningTier1] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Auto-dismiss transient notification after 5 seconds
  useEffect(() => {
    if (assessmentNotification) {
      const timer = setTimeout(() => {
        dismissAssessmentNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [assessmentNotification, dismissAssessmentNotification]);

  // Is this assessment from the male module?
  const isMaleAssessment =
    activeAssessment?.module === 'male_hypogonadism' ||
    activeAssessment?.model_name?.toLowerCase().includes('logistic') ||
    activeAssessment?.model_name?.toLowerCase().includes('male');

  const assessmentLevel = activeAssessment?.assessment_level;
  const isTier1 = isMaleAssessment && assessmentLevel === 'tier_1';
  const isTier2 = isMaleAssessment && assessmentLevel === 'tier_1_2';
  const hasAssessment = isTier1 || isTier2;

  const probPercent = activeAssessment?.probability_percent ?? (activeAssessment?.probability !== undefined ? Math.round(activeAssessment.probability * 100) : null);
  const riskLabel =
    activeAssessment?.risk_label ||
    (activeAssessment?.risk_category === 'higher' ? 'Higher Screening Risk' : 'Lower Screening Risk');

  const isHigherRisk =
    activeAssessment?.risk_category === 'higher' ||
    (probPercent !== null && probPercent >= ((activeAssessment?.threshold ?? 0.1808) * 100));

  const explanations = activeAssessment?.explanations || [];
  const hormonePattern = activeAssessment?.hormone_pattern_interpretation;

  const handleStartTier1 = async () => {
    setRunningTier1(true);
    setLoadError(false);
    try {
      await submitMaleTier1();
    } catch {
      setLoadError(true);
    } finally {
      setRunningTier1(false);
    }
  };

  const handleRetry = async () => {
    setLoadError(false);
    try {
      await refreshActiveAssessment();
    } catch {
      setLoadError(true);
    }
  };

  return (
    <>
      <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden">
        {/* Auto-dismissing Notification Banner */}
        {assessmentNotification && (
          <div className="relative z-20 -mt-2 -mx-2 mb-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{assessmentNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={dismissAssessmentNotification}
              className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0288D1]">
                  Hypogonadism Screening Assessment
                </span>
                {hasAssessment && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                    {isTier2 ? 'Tier 1 + Clinical Assessment' : 'Tier 1 Screening'}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#64748B]">
                Male Health • Hypogonadism Screening Model
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Non-Diagnostic Screening</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* State 0: Loading State */}
        {/* ------------------------------------------------------------- */}
        {assessmentLoading && !hasAssessment && (
          <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center space-y-3 text-center">
            <RefreshCw className="w-6 h-6 text-[#0288D1] animate-spin" />
            <p className="text-xs font-semibold text-[#0F172A]">
              Loading your hypogonadism screening assessment...
            </p>
            <p className="text-[11px] text-[#64748B]">
              Consulting the calibrated male health screening engine.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* State 0.5: API / Error Fallback */}
        {/* ------------------------------------------------------------- */}
        {loadError && !hasAssessment && !assessmentLoading && (
          <div className="p-6 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] space-y-3 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-[#E11D48] flex items-center gap-2 justify-center sm:justify-start">
                <AlertTriangle className="w-4 h-4" />
                Unable to load your screening assessment
              </h4>
              <p className="text-xs text-[#64748B]">
                Your hypogonadism screening result could not be loaded right now. Please try again.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* State 1: No Assessment Completed Yet */}
        {/* ------------------------------------------------------------- */}
        {!hasAssessment && !assessmentLoading && !loadError && (
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4 relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-lg">
              <h4 className="text-base font-bold text-[#0F172A] flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-[#0288D1]" />
                Hypogonadism Screening Assessment
              </h4>
              <p className="text-xs text-[#0F172A] font-medium leading-relaxed">
                Complete your initial male health screening to receive a personalized screening risk estimate.
              </p>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Your initial screening uses the information supported by the current male hypogonadism screening model.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartTier1}
              disabled={runningTier1 || assessmentLoading}
              className="px-6 py-3 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {runningTier1 ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Tier 1...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Start Tier 1 Screening</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* State 2 & 3: Assessment Completed (Tier 1 or Cumulative Tier 2) */}
        {/* ------------------------------------------------------------- */}
        {hasAssessment && (
          <div className="space-y-4 relative z-10">
            {/* Probability & Risk Score Hero Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Score Tile */}
              <div className="lg:col-span-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-mono uppercase text-[10px] tracking-wider text-[#64748B]">Screening Risk</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isHigherRisk
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isHigherRisk ? (
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                    {riskLabel}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-[#0F172A]">
                    {probPercent !== null ? `${probPercent}%` : '—'}
                  </span>
                  <span className="text-xs text-[#64748B]">Estimated Screening Risk</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        isHigherRisk ? 'bg-rose-500' : 'bg-[#29B6F6]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, probPercent ?? 10))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#64748B] font-mono">
                    <span>0% Low</span>
                    <span>Threshold: {Math.round((activeAssessment?.threshold || 0.1808) * 100)}%</span>
                    <span>100% High</span>
                  </div>
                </div>
              </div>

              {/* Summary & Insights Tile */}
              <div className="lg:col-span-8 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#0288D1] font-bold block">
                      Screening Evidence
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {activeAssessment?.created_at
                        ? new Date(activeAssessment.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Assessment date unavailable'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] leading-snug">
                    {activeAssessment?.summary_text ||
                      (isTier2
                        ? 'Initial screening and available clinical evidence synthesize your hypogonadism risk profile.'
                        : 'Initial screening information from demographics, energy, and body composition patterns.')}
                  </p>
                  {isTier1 && (
                    <p className="text-xs text-[#0288D1] font-medium leading-relaxed">
                      <strong>Next step:</strong> Add Clinical Evidence
                    </p>
                  )}
                  {isTier2 && (
                    <p className="text-xs text-[#0288D1] font-medium leading-relaxed">
                      <strong>Next step:</strong> Additional clinical evidence may further refine this screening estimate.
                    </p>
                  )}
                </div>

                {/* Hormone Pattern Rule Badge (Tier 2) */}
                {hormonePattern && hormonePattern.pattern_name && (
                  <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-2.5 text-xs text-[#0F172A]">
                    <FlaskConical className="w-4 h-4 text-[#0288D1] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#0288D1] block">
                        Pituitary-Gonadal Signaling: {hormonePattern.pattern_name}
                      </span>
                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                        {hormonePattern.pattern_description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contributing Factors Row */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
                Hypogonadism Risk Factors
              </span>
              {explanations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {explanations.slice(0, 3).map((exp, idx) => {
                    const isInc = exp.direction === 'increases_risk' || exp.direction === 'positive';
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-start gap-2 text-xs"
                      >
                        {isInc ? (
                          <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-semibold text-[#0F172A] text-[11px] block">
                            {exp.human_label || exp.feature}
                          </span>
                          <p className="text-[10px] text-[#64748B] line-clamp-2 leading-tight mt-0.5">
                            {exp.patient_explanation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#0288D1] shrink-0" />
                  <span>Detailed contributing factors are not available for this assessment.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informational Guidance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-mono text-[#0288D1] font-bold uppercase block">About this screening</span>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              This screening estimates hypogonadism risk using the information supported by the currently validated model. It does not establish a diagnosis.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-mono text-[#0288D1] font-bold uppercase block">Clinical evaluation</span>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              If your screening result or symptoms raise concern, clinical evaluation and appropriate hormone testing may be considered with a qualified healthcare professional.
            </p>
          </div>
        </div>

        {/* Bottom Action & Routing Line */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <p className="text-[11px] text-[#64748B] max-w-xl leading-relaxed">
            {activeAssessment?.disclaimer ||
              'This assessment is an AI-assisted screening estimate and does not diagnose hypogonadism. A qualified clinician and appropriate hormone testing are required for diagnosis.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Add / Update Clinical Labs Button */}
            <button
              type="button"
              onClick={() => setIsLabsModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-[#0288D1] font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FlaskConical className="w-4 h-4 text-[#0288D1]" />
              <span>{isTier2 ? 'Update Clinical Evidence' : 'Add Clinical Evidence'}</span>
            </button>

            {/* Assessment Profile Page */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.APP.ASSESSMENT)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#0288D1]" />
              <span>Screening Profile</span>
            </button>

            {/* Ask AI */}
            <button
              type="button"
              onClick={() =>
                onOpenChat(
                  'Can you explain my male hypogonadism screening results and what questions I should ask my doctor about testosterone and pituitary signaling?'
                )
              }
              className="px-5 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-sans text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Ask AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Male Clinical Labs Modal */}
      <MaleClinicalLabsModal
        isOpen={isLabsModalOpen}
        onClose={() => setIsLabsModalOpen(false)}
      />
    </>
  );
};
