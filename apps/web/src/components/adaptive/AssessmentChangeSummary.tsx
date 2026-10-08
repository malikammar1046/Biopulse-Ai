import React from 'react';
import {
  TrendUp01,
  TrendDown01,
  Minus,
  InfoCircle,
  Activity,
  LayersTwo01,
  FileCheck02,
} from '@untitledui/icons';
import type { ProgressiveAssessment } from '../../types/intelligence';

interface AssessmentChangeSummaryProps {
  currentAssessment: ProgressiveAssessment;
  previousAssessment?: ProgressiveAssessment | null;
  className?: string;
}

export const AssessmentChangeSummary: React.FC<AssessmentChangeSummaryProps> = ({
  currentAssessment,
  previousAssessment,
  className = '',
}) => {
  if (!currentAssessment || !previousAssessment) {
    return null;
  }

  // Extract probabilities
  const prevProb =
    previousAssessment.probability_percent != null
      ? Number(previousAssessment.probability_percent)
      : previousAssessment.probability != null
      ? Number(previousAssessment.probability) * 100
      : null;

  const currProb =
    currentAssessment.probability_percent != null
      ? Number(currentAssessment.probability_percent)
      : currentAssessment.probability != null
      ? Number(currentAssessment.probability) * 100
      : null;

  if (prevProb == null || currProb == null) {
    return null;
  }

  const delta = Math.round((currProb - prevProb) * 10) / 10;
  const isIncrease = delta > 0.05;
  const isDecrease = delta < -0.05;

  const currentLevel = currentAssessment.assessment_level || 'tier_1';
  const previousLevel = previousAssessment.assessment_level || 'tier_1';
  const isMale = currentAssessment.module === 'male_hypogonadism';

  const isTier3 = currentLevel === 'tier_1_2_3' || currentLevel === 'tier_1_3';
  const isTier2 = currentLevel === 'tier_1_2';

  // Display names for tiers
  const getTierLabel = (lvl: string): string => {
    if (lvl === 'tier_1_2_3') return 'Tier 3 (Clinical + Ultrasound)';
    if (lvl === 'tier_1_3') return 'Tier 1 & Ultrasound';
    if (lvl === 'tier_1_2') return 'Tier 2 (Clinical Labs)';
    return 'Tier 1 (Questionnaire & Biometrics)';
  };

  // Biomarkers added in Tier 2
  const tier2Inputs = (currentAssessment.tier_2_inputs || currentAssessment.authoritative_tier_2_inputs || {}) as Record<string, any>;
  const changedEvidenceKeys = Object.keys(tier2Inputs).filter(
    (k) => tier2Inputs[k] !== undefined && tier2Inputs[k] !== null && tier2Inputs[k] !== ''
  );

  // Fusion details for Tier 3
  const fusion = currentAssessment.fusion_details;

  // Real SHAP explanations
  const shapExplanations = Array.isArray(currentAssessment.explanations)
    ? currentAssessment.explanations.slice(0, 4)
    : [];

  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5 select-none ${className}`}
      data-testid="assessment-change-summary"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-teal-50 text-[#0E9EAA]">
              <LayersTwo01 className="w-4 h-4" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              What Changed in Your Screening?
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            {isMale
              ? 'Comparison between your previous male assessment and latest clinical update'
              : 'Comparison between your previous result and latest reassessment'}
          </p>
        </div>

        {/* Transition Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
          <span>{getTierLabel(previousLevel)}</span>
          <span className="text-slate-400">→</span>
          <span className="text-[#073B72] font-bold">{getTierLabel(currentLevel)}</span>
        </div>
      </div>

      {/* Delta Metric Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-center">
        <div className="p-2 space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Previous Result
          </div>
          <div className="text-xl font-extrabold text-slate-700">
            {prevProb.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">
            {getTierLabel(previousLevel)}
          </div>
        </div>

        <div className="p-2 space-y-0.5 border-t sm:border-t-0 sm:border-x border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Current Result
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {currProb.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {currentAssessment.risk_label || currentAssessment.risk_category}
          </div>
        </div>

        <div className="p-2 space-y-0.5 border-t sm:border-t-0 border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Change in Score
          </div>
          <div
            className={`text-xl font-extrabold flex items-center justify-center gap-1 ${
              isIncrease
                ? 'text-amber-700'
                : isDecrease
                ? 'text-emerald-700'
                : 'text-slate-700'
            }`}
          >
            {isIncrease ? (
              <TrendUp01 className="w-4 h-4 text-amber-600" aria-hidden="true" />
            ) : isDecrease ? (
              <TrendDown01 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
            <span>
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} pp
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            percentage points
          </div>
        </div>
      </div>

      {/* Narrative Section: Why the score changed */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
          <span>Why the screening score changed</span>
        </h4>

        {isTier3 ? (
          <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs text-slate-700 leading-relaxed space-y-2">
            <p>
              Your result was reassessed after ultrasound evidence was added. The screening probability
              changed after ultrasound morphological evidence was incorporated into the multimodal model.
            </p>

            {/* Multimodal Fusion Breakdown */}
            {fusion && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-pink-200">
                  <span className="block text-slate-500 font-medium">Clinical Weight</span>
                  <strong className="text-slate-900 font-bold">
                    {((fusion.clinical_weight ?? 0.95) * 100).toFixed(0)}%
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-pink-200">
                  <span className="block text-slate-500 font-medium">Ultrasound Weight</span>
                  <strong className="text-slate-900 font-bold">
                    {((fusion.ultrasound_weight ?? 0.05) * 100).toFixed(0)}%
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-pink-200">
                  <span className="block text-slate-500 font-medium">Clinical Prob.</span>
                  <strong className="text-slate-900 font-bold">
                    {(fusion.clinical_probability * 100).toFixed(1)}%
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-pink-200">
                  <span className="block text-slate-500 font-medium">Ultrasound PCOM</span>
                  <strong className="text-slate-900 font-bold">
                    {fusion.ultrasound_pcom_probability != null
                      ? `${(fusion.ultrasound_pcom_probability * 100).toFixed(1)}%`
                      : currentAssessment.pcom_status
                      ? currentAssessment.pcom_status.toUpperCase()
                      : 'Evaluated'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        ) : isTier2 ? (
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 leading-relaxed space-y-2">
            <p>
              Your result was reassessed after clinical evidence was added. The model score changed
              because direct laboratory biomarkers provide objective serum measurements beyond initial self-reported history.
            </p>

            {changedEvidenceKeys.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-semibold text-slate-500">Biomarkers Added:</span>
                {changedEvidenceKeys.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[11px] font-semibold text-blue-900"
                  >
                    <FileCheck02 className="w-3 h-3 text-blue-600" aria-hidden="true" />
                    <span>{k.toUpperCase()}: {tier2Inputs[k]}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <p>
              Your result was updated based on revised non-invasive profile features. Detailed factor
              comparison is unavailable because the model stage/tier changed.
            </p>
          </div>
        )}
      </div>

      {/* Model Explanations (SHAP) */}
      {shapExplanations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Primary Model Contributing Factors
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {shapExplanations.map((exp, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {exp.human_label || exp.feature || 'Clinical Factor'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    {exp.patient_explanation || 'Impacts probability assessment'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                    exp.direction === 'increases_risk' || exp.direction === 'positive'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {exp.direction === 'increases_risk' || exp.direction === 'positive' ? '+ Risk' : 'Protective'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-Diagnostic Disclaimer */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
        <InfoCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          BioPulse AI provides algorithmic screening risk stratification based on multimodal indicators.
          Changes in probability reflect updated statistical weighting and do not represent a definitive
          medical diagnosis or establish clinical causation.
        </span>
      </div>
    </div>
  );
};

export default AssessmentChangeSummary;
