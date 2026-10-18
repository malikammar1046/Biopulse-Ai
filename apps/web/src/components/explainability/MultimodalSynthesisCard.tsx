import React from 'react';
import { GitMerge, Activity, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MultimodalSynthesisData } from '../../types/intelligence';

interface MultimodalSynthesisCardProps {
  data: MultimodalSynthesisData;
  className?: string;
}

export const MultimodalSynthesisCard: React.FC<MultimodalSynthesisCardProps> = ({
  data,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ur' || i18n.dir?.() === 'rtl';

  return (
    <div
      className={`rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/40 via-white to-pink-50/30 p-5 sm:p-6 shadow-xs relative overflow-hidden ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100/80 text-violet-800 border border-violet-200">
              <GitMerge className="w-3.5 h-3.5" />
              {t('screening.explainability.multimodal_synthesis_badge', 'Tier 1 + 2 + 3 Complete Multimodal Assessment')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {data.clinical_model}
            </span>
          </div>
          <h3 className="text-lg font-bold font-display text-slate-900">
            {t('screening.explainability.multimodal_synthesis_title', 'Three-Tier Evidence Synthesis')}
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {data.clinical_interpretation}
          </p>
        </div>
      </div>

      {/* Two Pillars: Clinical vs Ultrasound */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Pillar 1: Clinical Model Anchor */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600 border border-pink-200/60">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">
                {t('screening.explainability.pillar_clinical', 'Clinical & Lab Anchor (Tiers 1 & 2)')}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-800">
              {(data.clinical_probability * 100).toFixed(1)}% Risk
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t(
              'screening.explainability.pillar_clinical_desc',
              'Derived from 32 questionnaire, biometric, and laboratory features via calibrated Extra Trees. Governs the quantitative risk estimate.'
            )}
          </p>
        </div>

        {/* Pillar 2: Ultrasound Morphology Corroboration */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200/60">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">
                {t('screening.explainability.pillar_ultrasound', 'Ultrasound Morphology (Tier 3)')}
              </span>
            </div>
            <span className="text-xs font-bold text-teal-700">
              {data.ultrasound_status} ({(data.ultrasound_confidence * 100).toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t(
              'screening.explainability.pillar_ultrasound_desc',
              'Evaluated independently via EfficientNet-B0 Grad-CAM for Rotterdam Criterion 3 polycystic morphology without distorting clinical SHAP attributions.'
            )}
          </p>
        </div>
      </div>

      {/* Attribution Policy Note */}
      <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-200/70 text-xs text-violet-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px] text-violet-950">
          {data.independent_attribution_note}
        </p>
      </div>
    </div>
  );
};
