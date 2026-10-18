import React, { useState } from 'react';
import { Layers, Info, ShieldAlert, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UltrasoundExplainabilityData } from '../../types/intelligence';

interface UltrasoundExplainabilitySectionProps {
  data: UltrasoundExplainabilityData;
  className?: string;
}

export const UltrasoundExplainabilitySection: React.FC<UltrasoundExplainabilitySectionProps> = ({
  data,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ur' || i18n.dir?.() === 'rtl';
  const [viewMode, setViewMode] = useState<'side-by-side' | 'heatmap' | 'original'>('side-by-side');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const safeImageSrc = (b64?: string | null) => {
    if (!b64) return '';
    return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
  };

  const isValidImage = (b64?: string | null) => {
    if (!b64) return false;
    // Guard against 1x1 dummy pixel fallbacks which stretch into solid color blocks
    if (b64.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB') || b64.trim().length < 200) {
      return false;
    }
    return true;
  };

  const isPcomDetected = data.pcom_status === 'PCOM Detected';
  const isIndeterminate = data.pcom_status === 'Indeterminate';
  const pcomPercent = data.pcom_percentage ?? data.pcom_confidence_percent ?? (data.pcom_probability != null ? Math.round(data.pcom_probability * 100) : null);

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs relative overflow-hidden ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50/50 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/70">
              <Layers className="w-3.5 h-3.5" />
              {t('screening.explainability.tier3_badge', 'Tier 3 Ultrasound Attribution')}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isPcomDetected
                  ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                  : isIndeterminate
                  ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
              }`}
            >
              {isPcomDetected ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {data.pcom_status} {pcomPercent != null ? `(${pcomPercent}%)` : ''}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold font-display text-slate-900">
            {t('screening.explainability.ultrasound_title', 'Ultrasound Visual Attention Map (Grad-CAM)')}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
            {t(
              'screening.explainability.ultrasound_subtitle',
              'Gradient-weighted Class Activation Mapping highlights pixel regions in your transvaginal scan that most strongly activated the convolutional vision model.'
            )}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto text-xs font-medium text-slate-600 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('screening.explainability.side_by_side', 'Side-by-Side')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'heatmap'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('screening.explainability.heatmap_only', 'Heatmap')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'original'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            {t('screening.explainability.original_scan', 'Original Scan')}
          </button>
        </div>
      </div>

      {/* Image Display Area */}
      <div className="mb-5">
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Image */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-3 relative shadow-inner">
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                {t('screening.explainability.original_image_label', 'Input Ultrasound (224×224)')}
              </span>
              {data.original_image_b64 ? (
                <img
                  src={safeImageSrc(data.original_image_b64)}
                  alt="Original Transvaginal Ultrasound"
                  className="w-full max-w-[280px] h-auto object-contain rounded-lg aspect-square"
                />
              ) : (
                <div className="w-full h-56 flex items-center justify-center text-xs text-slate-400">
                  {t('screening.explainability.no_original_image', 'Original scan loaded')}
                </div>
              )}
              <span className="text-[11px] text-slate-400 mt-2">
                {t('screening.explainability.greyscale_scan', 'Greyscale Transvaginal Ultrasound')}
              </span>
            </div>

            {/* Grad-CAM Heatmap */}
            <div className="rounded-2xl border border-teal-200/80 overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-3 relative shadow-inner">
              <span className="absolute top-3 left-3 bg-teal-900/90 backdrop-blur-xs text-teal-200 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-teal-700 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {t('screening.explainability.gradcam_label', 'Grad-CAM Attention Map')}
              </span>
              {isValidImage(data.gradcam_b64) ? (
                <img
                  src={safeImageSrc(data.gradcam_b64)}
                  alt="Grad-CAM Activation Heatmap"
                  className="w-full max-w-[280px] h-auto object-contain rounded-lg aspect-square"
                />
              ) : (
                <div className="w-full h-56 flex items-center justify-center text-xs text-slate-400">
                  {t('screening.explainability.no_heatmap', 'Heatmap unavailable')}
                </div>
              )}
              <div className="flex items-center gap-2 text-[11px] text-teal-300 mt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>{t('screening.explainability.warm_colors', 'Warm colors (red/yellow) indicate highest model attention')}</span>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="max-w-md mx-auto rounded-2xl border border-teal-200 overflow-hidden bg-slate-900 p-4 flex flex-col items-center relative shadow-inner">
            <span className="absolute top-3 left-3 bg-teal-900/90 backdrop-blur-xs text-teal-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {t('screening.explainability.gradcam_label', 'Grad-CAM Attention Map')}
            </span>
            {isValidImage(data.gradcam_b64) ? (
              <img
                src={safeImageSrc(data.gradcam_b64)}
                alt="Grad-CAM Activation Heatmap"
                className="w-full max-w-[320px] h-auto object-contain rounded-lg aspect-square"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-xs text-slate-400">
                {t('screening.explainability.no_heatmap', 'Heatmap unavailable')}
              </div>
            )}
            <p className="text-xs text-teal-300 mt-3 text-center">
              {t('screening.explainability.warm_colors_desc', 'Red and yellow regions signify image patches with the greatest positive gradient attribution toward the predicted class.')}
            </p>
          </div>
        )}

        {viewMode === 'original' && (
          <div className="max-w-md mx-auto rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 p-4 flex flex-col items-center relative shadow-inner">
            <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-700">
              {t('screening.explainability.original_scan_label', 'Original Input Scan')}
            </span>
            {data.original_image_b64 ? (
              <img
                src={safeImageSrc(data.original_image_b64)}
                alt="Original Transvaginal Scan"
                className="w-full max-w-[320px] h-auto object-contain rounded-lg aspect-square"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-xs text-slate-400">
                {t('screening.explainability.no_original_image', 'Original scan loaded')}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3 text-center">
              {t('screening.explainability.unmodified_scan_desc', 'Unmodified grayscale ultrasound frame analyzed by the deep convolutional neural network.')}
            </p>
          </div>
        )}
      </div>

      {/* Model Focus & Clinical Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
          <span className="font-semibold text-slate-900 block flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            {t('screening.explainability.attention_focus_title', 'Convolutional Focus Area')}
          </span>
          <p className="leading-relaxed text-slate-600">
            {data.attention_focus ||
              'Model activations concentrated on the peripheral follicular distribution and dense central ovarian stroma.'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
          <span className="font-semibold text-slate-900 block flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600" />
            {t('screening.explainability.rotterdam_title', 'Rotterdam Criterion 3 Context')}
          </span>
          <p className="leading-relaxed text-slate-600">
            {t(
              'screening.explainability.rotterdam_desc',
              'Polycystic ovarian morphology (PCOM) corresponds to ≥20 follicles per ovary and/or ovarian volume ≥10 mL, evaluated independently from clinical lab risk.'
            )}
          </p>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Clinical Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold block">
            {t('screening.explainability.clinical_disclaimer_title', 'Important Medical Explainability Limitation')}
          </span>
          <p className="leading-relaxed text-amber-800 text-[11px]">
            {data.clinical_disclaimer ||
              'Visual heatmaps represent convolutional neural network activation attribution, NOT confirmed clinical pathology or diagnosed cysts. Image explanations must be interpreted by a licensed radiologist or reproductive endocrinologist.'}
          </p>
        </div>
      </div>

      {/* Technical Expandable Details */}
      <div className="mt-3 text-right">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          {showTechnicalDetails
            ? t('screening.explainability.hide_technical_vision', 'Hide Vision Architecture Details')
            : t('screening.explainability.view_technical_vision', 'View Vision Architecture Details (Layer & Method)')}
        </button>

        {showTechnicalDetails && (
          <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] text-left space-y-1 border border-slate-800">
            <div>
              <span className="text-teal-400 font-semibold">Method:</span> {data.method}
            </div>
            <div>
              <span className="text-teal-400 font-semibold">Model Architecture:</span>{' '}
              {data.model_architecture}
            </div>
            <div>
              <span className="text-teal-400 font-semibold">Target Layer:</span> {data.target_layer}
            </div>
            <div>
              <span className="text-teal-400 font-semibold">Morphology Score:</span>{' '}
              {data.pcom_probability != null ? data.pcom_probability.toFixed(4) : '--'} ({pcomPercent != null ? `${pcomPercent}%` : '--%'})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
