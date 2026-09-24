import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Info, ShieldCheck, Activity, HelpCircle, BookOpen } from 'lucide-react';
import type { PatientShapFactor } from '../../types/intelligence';

interface FactorDetailModalProps {
  factor: PatientShapFactor | null;
  isOpen: boolean;
  onClose: () => void;
  pathway?: string;
}

export const FactorDetailModal: React.FC<FactorDetailModalProps> = ({
  factor,
  isOpen,
  onClose,
  pathway = 'female_pcos',
}) => {
  const isFemale = pathway === 'female_pcos';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !factor) return null;

  const isMixed = factor.fold_agreement?.stability === 'mixed';
  const isHigher = !isMixed && factor.direction === 'higher';
  const isLower = !isMixed && factor.direction === 'lower';

  const getInfluenceBadge = () => {
    if (isMixed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Mixed Model Influence
        </span>
      );
    }
    switch (factor.influence_level) {
      case 'strong':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            Strong Factor
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Moderate Factor
          </span>
        );
      case 'mild':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Mild Factor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Minimal Factor
          </span>
        );
    }
  };

  const getModifiabilityText = () => {
    if (factor.modifiable_status === 'modifiable') {
      return {
        badge: 'Lifestyle Modifiable Factor',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        desc: 'This parameter can often be influenced over time through nutrition, physical activity, sleep hygiene, or lifestyle adjustments.',
      };
    }
    if (factor.modifiable_status === 'partially_modifiable') {
      return {
        badge: 'Clinically Addressable Factor',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        desc: 'This parameter can frequently be evaluated or managed in partnership with your healthcare provider.',
      };
    }
    return {
      badge: 'Baseline / Physiological Context Marker',
      color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800',
      desc: 'This is a biological or demographic baseline marker (such as age) that helps calibrate the screening model for your demographic stage.',
    };
  };

  const modInfo = getModifiabilityText();
  const agreement = factor.fold_agreement;
  const clinRef = factor.clinical_reference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-factor-title"
      >
        {/* Header */}
        <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between ${
          isMixed
            ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-transparent'
            : isHigher 
            ? (isFemale ? 'bg-gradient-to-r from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-transparent' : 'bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-transparent')
            : (isLower ? 'bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-transparent' : 'bg-slate-50 dark:bg-slate-900')
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                {factor.category.toUpperCase()} FACTOR
              </span>
              {getInfluenceBadge()}
            </div>
            <h2 id="modal-factor-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {factor.patient_label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1 & 2: Conceptual Separation - Recorded Value & Model Influence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* RECORDED VALUE */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Recorded Value
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {factor.patient_value || 'Not provided'}
              </span>
            </div>

            {/* MODEL INFLUENCE */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Model Influence
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-sm mt-0.5">
                {isMixed ? (
                  <>
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-amber-700 dark:text-amber-400">
                      Mixed Model Influence
                    </span>
                  </>
                ) : isHigher ? (
                  <>
                    <TrendingUp className={`w-4 h-4 shrink-0 ${isFemale ? 'text-rose-500' : 'text-amber-500'}`} />
                    <span className={isFemale ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}>
                      ↑ Pushed higher
                    </span>
                  </>
                ) : isLower ? (
                  <>
                    <TrendingDown className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ↓ Pushed lower
                    </span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Neutral baseline
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Reference Information (Separated from SHAP) */}
          {clinRef && clinRef.has_reference_range && clinRef.reference_interval && (
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Clinical Reference Information
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Standard Reference Interval: </span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {clinRef.reference_interval}
                  </span>
                </div>
                {clinRef.reference_source && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Source: {clinRef.reference_source}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 pt-2 mt-1">
                Reference interval supplied by clinical guidelines for educational context. SHAP measures algorithmic model influence, not whether a lab result is normal or abnormal.
              </p>
            </div>
          )}

          {/* Patient Explanation */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              What this means for your assessment
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
              {factor.patient_explanation}
            </p>
          </div>

          {/* Model Usage Rationale */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Why the screening model considers this
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {factor.why_model_uses_it}
            </p>
          </div>

          {/* Modifiability Classification (Non-prescriptive) */}
          <div className={`p-4 rounded-xl border ${modInfo.color}`}>
            <div className="flex items-center gap-2 font-semibold mb-1 text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              {modInfo.badge}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {modInfo.desc}
            </p>
          </div>

          {/* 5-Fold Ensemble Stability Transparency */}
          {agreement && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  Model Component Agreement (5 Calibration Folds)
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  agreement.stability === 'consistent'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : agreement.stability === 'moderate'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>
                  {agreement.stability === 'consistent'
                    ? 'Consistent (5/5 folds)'
                    : agreement.stability === 'moderate'
                    ? 'Moderate (4/5 folds)'
                    : 'Mixed Agreement'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {agreement.stability === 'mixed'
                  ? 'Different fitted components of the screening model used this factor differently, so its direction is less stable. Across the 5 calibrated model components, ' + agreement.positive_folds + ' pushed higher and ' + agreement.negative_folds + ' pushed lower. The result displayed is the true calibrated ensemble average.'
                  : `All ${agreement.agreeing_folds_count} of ${agreement.total_folds_count} model components agree on this factor's directional impact.`}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {agreement.fold_values.map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 text-center py-1 px-1 rounded text-[10px] font-mono font-medium ${
                      val > 0.0001
                        ? (isFemale ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300')
                        : val < -0.0001
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                    title={`Fold ${idx + 1}: ${val}`}
                  >
                    F{idx + 1}: {val > 0 ? `+${val}` : val}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Metadata Note */}
          <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span>Ensemble SHAP Value: {factor.shap_value}</span>
            <span>Explanation Share: {factor.explanation_share_percent}%</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
