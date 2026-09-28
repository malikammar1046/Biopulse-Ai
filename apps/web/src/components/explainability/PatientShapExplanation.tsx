import React, { useState } from 'react';
import {
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
} from 'lucide-react';
import type {
  PatientShapExplanationPayload,
  PatientShapFactor,
  LongitudinalShapComparison,
} from '../../types/intelligence';
import { FactorDetailModal } from './FactorDetailModal';
import { TechnicalShapTable } from './TechnicalShapTable';
import { ShapContributionBarChart } from './ShapContributionBarChart';

interface PatientShapExplanationProps {
  payload: PatientShapExplanationPayload;
  longitudinalComparison?: LongitudinalShapComparison | null;
  pathway?: string;
  className?: string;
}

export const PatientShapExplanation: React.FC<PatientShapExplanationProps> = ({
  payload,
  longitudinalComparison,
  pathway = 'female_pcos',
  className = '',
}) => {
  const [selectedFactor, setSelectedFactor] = useState<PatientShapFactor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTechnicalOpen, setIsTechnicalOpen] = useState(false);
  const [showAllFactors, setShowAllFactors] = useState(false);

  const isFemale = pathway === 'female_pcos';

  const handleOpenFactor = (factor: PatientShapFactor) => {
    setSelectedFactor(factor);
    setIsModalOpen(true);
  };

  const topHigher = payload.top_higher_factors || [];
  const topLower = payload.top_lower_factors || [];
  const topMixed = payload.top_mixed_factors || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Level 1: Main Patient-Centered Explanation Section */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        {/* Subtle soft ambient glow in the top right */}
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isFemale ? 'bg-pink-100/50' : 'bg-sky-100/50'
          }`}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-2xs ${
                  isFemale
                    ? 'bg-pink-50 text-pink-700 border-pink-200/70'
                    : 'bg-sky-50 text-[#0288D1] border-sky-200/70'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Model Explainability
              </span>
              <span className="text-xs text-slate-400 font-medium">5-Fold Calibrated Ensemble</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Why did BioPulse give me this screening result?
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              BioPulse calculates your screening probability ({payload.final_calibrated_percent}%) by
              evaluating your profile across 5 validation folds. Here are the primary factors that
              influenced this result before final probability calibration:
            </p>
          </div>
        </div>

        {/* Factor Columns: Pushed Higher vs Pushed Lower */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* Pushed Higher Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border ${
                  isFemale
                    ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                    : 'bg-amber-50 text-amber-600 border-amber-200/60'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Factors that pushed your result higher
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {topHigher.length}
              </span>
            </div>

            {topHigher.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
                No dominant risk-elevating factors were detected in this assessment.
              </div>
            ) : (
              <div className="space-y-3">
                {topHigher.map((factor) => (
                  <div
                    key={factor.feature_key}
                    onClick={() => handleOpenFactor(factor)}
                    className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-rose-50/20 border border-slate-200/90 hover:border-rose-300 shadow-xs hover:shadow-md transition-all cursor-pointer relative"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-rose-950 transition-colors">
                            {factor.patient_label}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                              factor.fold_agreement.stability === 'mixed'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                                : factor.influence_level === 'strong'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                                : factor.influence_level === 'moderate'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                                : 'bg-sky-50 text-[#0288D1] border-sky-200/70'
                            }`}
                          >
                            {factor.fold_agreement.stability === 'mixed' ? 'Mixed influence' : `${factor.influence_level} influence`}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-1">
                          Your recorded value:{' '}
                          <span className="font-semibold text-slate-800">
                            {factor.patient_value}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-xs font-semibold text-[#F43F7D] hover:text-[#DC326C] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0 cursor-pointer"
                      >
                        Why?
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {factor.simple_description}
                    </p>

                    {/* Fold agreement indicator */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Explanation Share: {factor.explanation_share_percent}%</span>
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        {factor.fold_agreement.stability === 'mixed'
                          ? 'Mixed Fold Agreement'
                          : `${factor.fold_agreement.agreeing_folds_count}/5 Folds Consistent`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pushed Lower Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Factors that supported a lower result
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {topLower.length}
              </span>
            </div>

            {topLower.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
                No dominant risk-lowering factors were identified in this assessment.
              </div>
            ) : (
              <div className="space-y-3">
                {topLower.map((factor) => (
                  <div
                    key={factor.feature_key}
                    onClick={() => handleOpenFactor(factor)}
                    className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-emerald-50/20 border border-slate-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer relative"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-950 transition-colors">
                            {factor.patient_label}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                              factor.fold_agreement.stability === 'mixed'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                                : factor.influence_level === 'strong'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                : factor.influence_level === 'moderate'
                                ? 'bg-teal-50 text-teal-700 border-teal-200/70'
                                : 'bg-sky-50 text-[#0288D1] border-sky-200/70'
                            }`}
                          >
                            {factor.fold_agreement.stability === 'mixed' ? 'Mixed influence' : `${factor.influence_level} influence`}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-1">
                          Your recorded value:{' '}
                          <span className="font-semibold text-slate-800">
                            {factor.patient_value}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0 cursor-pointer"
                      >
                        Why?
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {factor.simple_description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Explanation Share: {factor.explanation_share_percent}%</span>
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        {factor.fold_agreement.stability === 'mixed'
                          ? 'Mixed Fold Agreement'
                          : `${factor.fold_agreement.agreeing_folds_count}/5 Folds Consistent`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Factors with Mixed Model Influence Callout */}
        {topMixed.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">
                Factors with Mixed Model Influence ({topMixed.length})
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Different fitted components of the screening model used these factors differently, so their direction is less stable across validation folds:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topMixed.map((factor) => (
                <div
                  key={factor.feature_key}
                  onClick={() => handleOpenFactor(factor)}
                  className="p-3 rounded-xl bg-white border border-amber-200/70 hover:border-amber-400 cursor-pointer transition-colors text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-900 block truncate">
                      {factor.patient_label}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block">
                      Value: {factor.patient_value}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 shrink-0">
                    Mixed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relative Influence Bar Chart Overview */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-sm text-slate-900">
                Relative Factor Influence Breakdown
              </h3>
            </div>
            <button
              onClick={() => setShowAllFactors(!showAllFactors)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {showAllFactors ? 'Show Top Factors' : `View All ${payload.factors.length} Factors`}
            </button>
          </div>
          <ShapContributionBarChart
            factors={payload.factors}
            pathway={pathway}
            onSelectFactor={handleOpenFactor}
            maxDisplay={showAllFactors ? payload.factors.length : 8}
          />
        </div>

        {/* Longitudinal Differential Section: "What changed since my previous comparable assessment?" */}
        {longitudinalComparison && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-slate-900">
                What changed since my previous comparable assessment?
              </h3>
            </div>

            {!longitudinalComparison.is_comparable ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
                {longitudinalComparison.message ||
                  'Historical model explanation is not directly comparable because the explanation method or screening tier has changed.'}
              </div>
            ) : longitudinalComparison.comparisons && longitudinalComparison.comparisons.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Comparing this assessment against your previous record from{' '}
                  {longitudinalComparison.previous_assessment_date
                    ? new Date(longitudinalComparison.previous_assessment_date).toLocaleDateString()
                    : 'earlier'}
                  :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {longitudinalComparison.comparisons.slice(0, 4).map((comp) => (
                    <div
                      key={comp.feature_key}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{comp.patient_label}</span>
                        {comp.value_changed && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                            Value Changed
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {comp.patient_narrative}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
                Key model factors remained consistent with your previous assessment.
              </div>
            )}
          </div>
        )}

        {/* About This Explanation Card */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-500">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">
              About AI Factor Attribution (SHAP)
            </span>
            <p className="leading-relaxed">
              These factors explain how the screening algorithm weighted your answers and biomarkers
              mathematically before probability calibration. A factor marked as &quot;higher&quot; is
              not a medical diagnosis or a direct cause of disease, but a statistical pattern
              observed in clinical training populations. Always discuss screening results with a qualified
              clinician.
            </p>
          </div>
        </div>
      </div>

      {/* Level 3: Collapsible Technical Table */}
      <TechnicalShapTable
        payload={payload}
        isOpen={isTechnicalOpen}
        onToggle={() => setIsTechnicalOpen(!isTechnicalOpen)}
        onSelectFactor={handleOpenFactor}
      />

      {/* Level 2: Interactive Factor Detail Modal */}
      <FactorDetailModal
        factor={selectedFactor}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFactor(null);
        }}
        pathway={pathway}
      />
    </div>
  );
};
