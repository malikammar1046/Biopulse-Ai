import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ArrowRight,
  Brain,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Shield,
  Loader2,
  Layers,
  RefreshCw,
  Info,
  Check,
  HelpCircle,
} from 'lucide-react';
import type { DigitalTwinInsight } from '../../types/dashboard';
import type { IntelligenceAssessment, FeatureDetail } from '../../types/intelligence';
import {
  fetchBackendAssessment,
  getRiskPatternDisplay,
  formatProbability,
  formatConfidence,
  getCompletenessColor,
} from '../../services/intelligenceService';

interface DigitalTwinProps {
  insight: DigitalTwinInsight; // local fallback context (for prompt guidance only)
  onOpenChat: (prompt?: string) => void;
}

type LoadState = 'idle' | 'loading' | 'ml' | 'insufficient_data' | 'error';

// Standard 16 model features metadata fallback if backend details array is empty
const DEFAULT_16_FEATURES: { name: string; label: string; category: 'clinical' | 'cycle' | 'symptom' | 'lifestyle' }[] = [
  { name: ' Age (yrs)', label: 'Age', category: 'clinical' },
  { name: 'Weight (Kg)', label: 'Body Weight', category: 'clinical' },
  { name: 'Height(Cm) ', label: 'Height', category: 'clinical' },
  { name: 'BMI', label: 'Body Mass Index (BMI)', category: 'clinical' },
  { name: 'Cycle(R/I)', label: 'Menstrual Cycle Regularity', category: 'cycle' },
  { name: 'Cycle length(days)', label: 'Cycle Length', category: 'cycle' },
  { name: 'Marraige Status (Yrs)', label: 'Marriage Status', category: 'clinical' },
  { name: 'Pregnant(Y/N)', label: 'Pregnancy Status', category: 'clinical' },
  { name: 'No. of aborptions', label: 'Prior Pregnancy Loss History', category: 'clinical' },
  { name: 'Weight gain(Y/N)', label: 'Recent Weight Changes', category: 'symptom' },
  { name: 'hair growth(Y/N)', label: 'Excess Facial / Body Hair (Hirsutism)', category: 'symptom' },
  { name: 'Skin darkening (Y/N)', label: 'Skin Darkening (Acanthosis Nigricans)', category: 'symptom' },
  { name: 'Hair loss(Y/N)', label: 'Hair Thinning / Loss (Alopecia)', category: 'symptom' },
  { name: 'Pimples(Y/N)', label: 'Acne & Skin Breakouts', category: 'symptom' },
  { name: 'Fast food (Y/N)', label: 'Fast-Food / Processed Intake', category: 'lifestyle' },
  { name: 'Reg.Exercise(Y/N)', label: 'Regular Physical Exercise', category: 'lifestyle' },
];

export const DigitalTwinInsightCard: React.FC<DigitalTwinProps> = ({
  insight,
  onOpenChat,
}) => {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [assessment, setAssessment] = useState<IntelligenceAssessment | null>(null);
  const [showFeaturesList, setShowFeaturesList] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);

  useEffect(() => {
    console.log('[OvaSense UI] DigitalTwinInsightCard mounted');
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch real ML assessment from Django backend
  // ---------------------------------------------------------------------------
  const loadAssessment = useCallback(async (forceRefresh = false) => {
    console.log('[OvaSense UI] Assessment request started');
    setLoadState('loading');
    try {
      const result = await fetchBackendAssessment(forceRefresh);
      if (result) {
        console.log('[OvaSense UI] Assessment response received');
        console.log('[OvaSense UI] Risk category:', result.risk_category);
        console.log('[OvaSense UI] PCOS probability:', result.pcos_probability);
        console.log('[OvaSense UI] SHAP explanations count:', result.explanations?.length || 0);
        console.log('[OvaSense UI] Rendering ML result');
        setAssessment(result);
        if (result.risk_category === 'insufficient_data' || result.backend_mode === 'insufficient_data') {
          setLoadState('insufficient_data');
        } else {
          setLoadState('ml');
        }
      } else {
        console.warn('[OvaSense UI] Assessment result is null — setting error state');
        setLoadState('error');
      }
    } catch (err) {
      console.warn('[OvaSense UI] Assessment fetch error:', err);
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

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
  const completeness = assessment?.data_quality?.completeness_percentage ?? null;
  const qualityLevel = assessment?.data_quality?.quality_level ?? null;
  const threshold = assessment?.screening_threshold ?? 0.38;

  // Build the 16 features list from backend feature_details or synthesized fallback
  const featureDetails: FeatureDetail[] = assessment?.data_quality?.feature_details && assessment.data_quality.feature_details.length > 0
    ? assessment.data_quality.feature_details
    : DEFAULT_16_FEATURES.map((def) => {
        const isMissing = assessment?.data_quality?.missing_features?.some(
          (m) => m.toLowerCase().includes(def.label.toLowerCase()) || def.label.toLowerCase().includes(m.toLowerCase())
        );
        return {
          name: def.name,
          label: def.label,
          category: def.category,
          status: isMissing ? 'not_provided' : 'provided',
          display_value: isMissing ? 'Not provided' : 'Provided',
          is_imputed: Boolean(isMissing),
        };
      });

  const providedCount = featureDetails.filter((f) => f.status === 'provided').length;
  const imputedCount = featureDetails.filter((f) => f.is_imputed).length;

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
            onClick={() => loadAssessment(true)}
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
              onClick={() => loadAssessment(true)}
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

            {/* Context Notice on how score was generated */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-[11px] text-[#D8B4FE] leading-relaxed font-sans flex items-start gap-2">
              <Info className="w-4 h-4 text-[#C084FC] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">How this score was generated</strong>
                OvaSense analyzed the health information currently available in your profile using its trained machine-learning model.
                The model uses a specific set of clinical, symptom, lifestyle, and cycle-related features rather than every question collected during onboarding.
              </div>
            </div>
          </div>

          {/* ── 6. Compact Visual Pipeline Flow ───────────────────────────── */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-[10px] font-mono text-[#A797BD] uppercase tracking-wider">
              Inference Data Pipeline
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                <span className="text-[#A797BD] block">1. Profile Data</span>
                <span className="text-white font-semibold">{providedCount}/16 Provided</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                <span className="text-[#A797BD] block">2. Imputation</span>
                <span className="text-[#D8B4FE] font-semibold">{imputedCount} Handled</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                <span className="text-[#A797BD] block">3. Model</span>
                <span className="text-[#34D399] font-semibold">150 Extra Trees</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                <span className="text-[#A797BD] block">4. Explanations</span>
                <span className="text-[#FB7185] font-semibold">TreeSHAP</span>
              </div>
            </div>
          </div>

          {/* ── 7. Data Quality & Completeness Status ─────────────────────── */}
          {completeness !== null && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-[#A797BD] uppercase tracking-wide">
                  Profile Data Used: <strong className="text-white capitalize">{qualityLevel || 'Standard'}</strong>
                </span>
                <span className="text-white font-bold">{Math.round(completeness)}% Complete</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, completeness)}%`,
                    background: getCompletenessColor(completeness),
                  }}
                />
              </div>
              {qualityLevel === 'limited' && (
                <p className="text-[10px] text-amber-300/80 leading-relaxed font-sans pt-1">
                  Some model inputs were unavailable. The trained model handled supported missing values through its preprocessing pipeline.
                  Your result may be less informative when important information is missing.
                </p>
              )}
            </div>
          )}

          {/* ── 8. TreeSHAP Influencing Factors ───────────────────────────── */}
          {assessment.explanations && assessment.explanations.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#FB7185]" />
                  <span>What influenced your result? (TreeSHAP)</span>
                </h4>
                <span className="text-[10px] font-mono text-[#A797BD]">
                  {assessment.explanations.length} primary factors
                </span>
              </div>

              <div className="space-y-2">
                {assessment.explanations.map((exp, idx) => {
                  const isIncrease = exp.direction === 'increases_risk' || exp.direction === 'positive';
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all flex items-start gap-3"
                    >
                      <div
                        className="w-1.5 shrink-0 self-stretch rounded-full mt-0.5"
                        style={{ background: isIncrease ? '#FB7185' : '#34D399' }}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-xs font-semibold text-white">
                            {exp.human_label}
                          </span>
                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                              isIncrease
                                ? 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/30'
                                : 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30'
                            }`}
                          >
                            {isIncrease ? 'Increased Risk' : 'Protective Factor'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#CDBDD8] font-sans leading-relaxed">
                          {exp.patient_explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 9. Collapsible 16 Model Features Audit Panel ─────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFeaturesList((v) => !v)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-mono text-[#EDE4F7] hover:bg-white/5 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C084FC]" />
                <span className="font-bold">Features used by the ML model</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
                  {providedCount} provided · {imputedCount} imputed
                </span>
              </div>
              {showFeaturesList ? (
                <ChevronUp className="w-4 h-4 text-[#A797BD]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#A797BD]" />
              )}
            </button>

            {showFeaturesList && (
              <div className="p-4 pt-1 space-y-3.5 border-t border-white/5 animate-in slide-in-from-top-1 duration-200">
                {/* Onboarding vs ML explanation note */}
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/20 text-[11px] text-[#CDBDD8] leading-relaxed font-sans">
                  <strong className="text-white block mb-0.5">Important Distinction:</strong>
                  OvaSense collects additional information during onboarding to support cycle tracking, nutrition, and care features.
                  The PCOS screening model only evaluates the <strong>16 specific features</strong> listed below.
                </div>

                {/* 16 Features Table */}
                <div className="divide-y divide-white/5">
                  {featureDetails.map((feat, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#A797BD] w-5">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-white/95">
                          {feat.label}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#A797BD] uppercase">
                          {feat.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pl-7 sm:pl-0 font-mono text-[11px]">
                        {feat.status === 'provided' ? (
                          <span className="text-[#34D399] flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <strong>{feat.display_value}</strong>
                          </span>
                        ) : (
                          <span className="text-[#A797BD] flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-amber-400" />
                            <span className="italic">Not provided · handled by model imputation</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 10. Model Architecture & Transparency Panel ───────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowModelDetails((v) => !v)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-mono text-[#EDE4F7] hover:bg-white/5 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#8E3EAF]" />
                <span className="font-bold">About this screening model</span>
              </div>
              {showModelDetails ? (
                <ChevronUp className="w-4 h-4 text-[#A797BD]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#A797BD]" />
              )}
            </button>

            {showModelDetails && (
              <div className="p-4 pt-1 space-y-3 border-t border-white/5 text-[11px] font-mono text-[#CDBDD8] animate-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-[#A797BD] block">Model Artifact</span>
                    <strong className="text-white">OvaSense Trained Model (Joblib)</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-[#A797BD] block">Classifier Architecture</span>
                    <strong className="text-white">Extra Trees (150 Estimators)</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-[#A797BD] block">Model Input Dimensions</span>
                    <strong className="text-white">16 Clinical & Lifestyle Features</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-[#A797BD] block">Explainability Engine</span>
                    <strong className="text-white">TreeSHAP (Exact Shapley Values)</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-[#A797BD] block">Screening Cutoff Threshold</span>
                    <strong className="text-white">{(threshold * 100).toFixed(0)}% (Sensitivity Tuned)</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-[#A797BD] block">Clinical Diagnostic Status</span>
                    <strong className="text-amber-300">Non-Diagnostic Screening Aid</strong>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-400/5 border border-amber-400/20 text-amber-200/90 font-sans leading-relaxed">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    This screening assessment is designed as an educational risk stratification aid. It does not replace ultrasound imaging, biochemical blood tests, or diagnostic evaluation by a licensed physician.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 11. Action Button & Clinical Non-Diagnostic Disclaimer ────────── */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenChat(insight.suggestedChatPrompt || 'Explain my PCOS screening assessment and key factors')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Discuss with AI Twin</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>

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
