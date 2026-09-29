import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Code, Cpu, Layers, Database } from 'lucide-react';
import type { PatientShapExplanationPayload, PatientShapFactor } from '../../types/intelligence';

interface TechnicalShapTableProps {
  payload: PatientShapExplanationPayload;
  isOpen: boolean;
  onToggle: () => void;
  onSelectFactor?: (factor: PatientShapFactor) => void;
}

export const TechnicalShapTable: React.FC<TechnicalShapTableProps> = ({
  payload,
  isOpen,
  onToggle,
  onSelectFactor,
}) => {
  const [filter, setFilter] = useState<'all' | 'higher' | 'lower'>('all');
  const [sortKey, setSortKey] = useState<'share' | 'name' | 'shap'>('share');

  const filteredFactors = payload.factors.filter((f) => {
    if (filter === 'higher') return f.direction === 'higher';
    if (filter === 'lower') return f.direction === 'lower';
    return true;
  });

  const sortedFactors = [...filteredFactors].sort((a, b) => {
    if (sortKey === 'share') return b.explanation_share_percent - a.explanation_share_percent;
    if (sortKey === 'name') return a.patient_label.localeCompare(b.patient_label);
    if (sortKey === 'shap') return Math.abs(b.shap_value) - Math.abs(a.shap_value);
    return 0;
  });

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden mt-6 text-slate-900">
      {/* Accordion Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100 transition-colors text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-200/80 text-slate-700">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900">
                Technical Model Details & Raw SHAP Attribution
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                Schema v{payload.schema_version}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              For clinicians, researchers, FYP evaluators, and algorithmic transparency verification.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>{isOpen ? 'Hide technical details' : 'View model details'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-6 space-y-6 border-t border-slate-100 bg-white">
          {/* Architecture & Verification Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Production Estimator</span>
              </div>
              <div className="font-semibold text-sm text-slate-900 truncate" title={payload.model_name}>
                {payload.model_name}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                {payload.outer_estimator_type} ({payload.calibration_fold_count} folds)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>SHAP Output Space</span>
              </div>
              <div className="font-semibold text-sm text-slate-900">
                {payload.output_space === 'raw' ? 'Pre-Calibration Tree Vote (Probability)' : 'Log-Odds (decision_function)'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Explainer: {payload.explainer_type}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Database className="w-3.5 h-3.5" />
                <span>Additivity Check</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                {payload.additivity_verified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-700">Additivity Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700">Additivity Warning</span>
                  </>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                Error: {payload.additivity_error.toExponential(2)} (tol: 1e-5)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <span>Final Calibrated Result</span>
              </div>
              <div className="font-bold text-lg text-slate-900">
                {payload.final_calibrated_percent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Base E[f(x)]: {payload.ensemble_base_value}
              </div>
            </div>
          </div>

          {/* Multimodal context banner if present */}
          {payload.multimodal_context && (
            <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200/70 text-xs">
              <div className="font-semibold text-pink-900 mb-1">
                Multimodal Fusion Context (Tier 1 + Clinical + Ultrasound)
              </div>
              <p className="text-pink-800 leading-relaxed mb-2">
                {payload.multimodal_context.note}
              </p>
              <div className="flex flex-wrap gap-4 text-pink-900 font-mono text-[11px]">
                <span>Clinical Weight: {(payload.multimodal_context.clinical_weight * 100).toFixed(0)}%</span>
                <span>Ultrasound Weight: {(payload.multimodal_context.ultrasound_weight * 100).toFixed(0)}%</span>
                <span>Clinical Prob: {(payload.multimodal_context.clinical_probability * 100).toFixed(1)}%</span>
                <span>Ultrasound Prob: {(payload.multimodal_context.ultrasound_probability * 100).toFixed(1)}%</span>
                <span>PCOM: {payload.multimodal_context.pcom_status}</span>
              </div>
            </div>
          )}

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Factors ({payload.factors.length})
              </button>
              <button
                onClick={() => setFilter('higher')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filter === 'higher'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pushed Higher ↑
              </button>
              <button
                onClick={() => setFilter('lower')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filter === 'lower'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pushed Lower ↓
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Sort by:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
              >
                <option value="share">Explanation Share (%)</option>
                <option value="shap">Raw |SHAP|</option>
                <option value="name">Feature Name</option>
              </select>
            </div>
          </div>

          {/* Factor Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Feature / Patient Label</th>
                  <th className="py-3 px-4">Recorded Value</th>
                  <th className="py-3 px-4">Ensemble SHAP</th>
                  <th className="py-3 px-4">Share (%)</th>
                  <th className="py-3 px-4">Influence</th>
                  <th className="py-3 px-4">5-Fold Agreement</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedFactors.map((factor) => {
                  const isHigher = factor.direction === 'higher';
                  const isLower = factor.direction === 'lower';
                  return (
                    <tr
                      key={factor.feature_key}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {factor.patient_label}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {factor.feature_key}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {factor.patient_value || 'n/a'}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        <span
                          className={
                            isHigher
                              ? 'text-rose-600'
                              : isLower
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }
                        >
                          {factor.shap_value > 0 ? `+${factor.shap_value}` : factor.shap_value}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isHigher ? 'bg-rose-500' : isLower ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${Math.min(100, factor.explanation_share_percent)}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-700">
                            {factor.explanation_share_percent}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                            factor.influence_level === 'strong'
                              ? 'bg-rose-50 text-rose-800 border-rose-200/70'
                              : factor.influence_level === 'moderate'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                              : factor.influence_level === 'mild'
                              ? 'bg-sky-50 text-[#0288D1] border-sky-200/70'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {factor.influence_level}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                              factor.fold_agreement.stability === 'consistent'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                : factor.fold_agreement.stability === 'moderate'
                                ? 'bg-sky-50 text-sky-700 border-sky-200/70'
                                : 'bg-amber-50 text-amber-700 border-amber-200/70'
                            }`}
                          >
                            {factor.fold_agreement.agreeing_folds_count}/5 folds
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({factor.fold_agreement.stability})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {onSelectFactor && (
                          <button
                            onClick={() => onSelectFactor(factor)}
                            className="text-xs text-[#F43F7D] hover:text-[#DC326C] hover:underline font-semibold cursor-pointer"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Environment & Library Version Stamp */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
            <div>
              <span>Environment: shap v{payload.environment_metadata?.shap_version || '0.45.0'}</span>
              <span className="mx-2">•</span>
              <span>scikit-learn v{payload.environment_metadata?.sklearn_version || '1.4.0'}</span>
              <span className="mx-2">•</span>
              <span>Ref: {payload.environment_metadata?.reference_strategy || 'standardized'}</span>
            </div>
            <div>
              <span>Schema Version: {payload.schema_version}</span>
              <span className="mx-2">•</span>
              <span>Folds: {payload.explained_fold_count}/{payload.calibration_fold_count}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
