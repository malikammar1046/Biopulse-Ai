import React from 'react';
import { ArrowRight, Check, Activity } from '@untitledui/icons';
import {
  FemaleCard,
  FemaleStatusBadge,
  FemalePrimaryButton,
  FemaleSecondaryButton,
  FemaleLoadingState,
  FemaleEmptyState,
} from './FemaleDesignPrimitives';

interface FemaleScreeningCardProps {
  hasAssessment: boolean;
  probabilityPercent: number | null;
  riskCategory?: string;
  riskLabel?: string;
  assessmentLevel?: string;
  updatedAt?: string | null;
  threshold?: number;
  onStartScreening: () => void;
  onViewAssessment: () => void;
  onAddLabs?: () => void;
  loading?: boolean;
  gradcamB64?: string | null;
  pcomStatus?: string | null;
}

export const FemaleScreeningCard: React.FC<FemaleScreeningCardProps> = ({
  hasAssessment,
  probabilityPercent,
  riskCategory = 'lower',
  riskLabel,
  assessmentLevel = 'tier_1',
  updatedAt,
  threshold = 0.38,
  onStartScreening,
  onViewAssessment,
  onAddLabs,
  loading = false,
  gradcamB64,
  pcomStatus,
}) => {
  // 1. Loading State
  if (loading && (!hasAssessment || probabilityPercent === null)) {
    return (
      <FemaleLoadingState
        title="Checking Screening Status"
        message="Verifying your latest assessment records..."
      />
    );
  }

  // 2. Empty State (Only shown when not loading)
  if (!hasAssessment || probabilityPercent === null) {
    return (
      <FemaleEmptyState
        badge="Not Started"
        title="No PCOS Assessment Yet"
        description="Complete your initial screening to understand your symptoms, cycle patterns, and baseline risk factors."
        actionLabel="Start Initial Screening"
        onAction={onStartScreening}
        icon={Activity}
      />
    );
  }

  // 3. Dynamic Tier Titles & Summaries (Apple Clarity)
  const isTier2 = assessmentLevel === 'tier_1_2' || assessmentLevel === 'tier_1_2_3';
  const isTier3 = assessmentLevel === 'tier_1_2_3' || assessmentLevel === 'tier_1_3';

  const tierName = isTier3 ? 'Tier 3' : isTier2 ? 'Tier 2' : 'Tier 1';
  const tierSummary = isTier3
    ? 'Your result includes clinical laboratory values and ultrasound analysis.'
    : isTier2
    ? 'Your result includes your verified clinical laboratory values.'
    : 'Your current screening is based on your self-reported symptoms and lifestyle information.';

  // Map category to calm patient-friendly label & badge variant
  const normalizedCategory = riskCategory?.toLowerCase() || 'lower';
  const badgeVariant =
    normalizedCategory === 'higher' || normalizedCategory === 'elevated'
      ? 'danger'
      : normalizedCategory === 'intermediate' || normalizedCategory === 'moderate'
      ? 'warning'
      : 'success';

  const categoryLabel =
    riskLabel ||
    (normalizedCategory === 'higher' || normalizedCategory === 'elevated'
      ? 'Higher Screening Risk'
      : normalizedCategory === 'intermediate' || normalizedCategory === 'moderate'
      ? 'Moderate Screening Risk'
      : 'Lower Screening Risk');

  return (
    <FemaleCard className="flex flex-col justify-between space-y-6 h-full select-none">
      <div className="space-y-5">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EAECF0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE6EF] border border-[#F43F7D]/20 flex items-center justify-center text-[#F43F7D]">
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#111318]">
                PCOS Screening
              </h2>
              <span className="text-[11px] text-[#667085]">
                {tierName} Assessment {updatedAt ? `· Updated ${updatedAt}` : ''}
              </span>
            </div>
          </div>

          <FemaleStatusBadge variant={badgeVariant}>
            {categoryLabel}
          </FemaleStatusBadge>
        </div>

        {/* Risk Percentage & Gauge Indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-1 px-1">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-xs font-medium text-[#667085] block">
              Screening Probability Score
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111318]">
                {probabilityPercent}%
              </span>
              <span className="text-xs text-[#98A2B3] font-medium">
                (threshold {Math.round(threshold * 100)}%)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-md pt-1">
              {tierSummary}
            </p>
          </div>

          {/* Minimalist Apple Circular Indicator */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-[#FDE6EF]"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-[#F43F7D] transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * Math.min(Math.max(probabilityPercent, 0), 100)) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-[#111318]">{tierName}</span>
              <span className="text-[10px] text-[#667085]">Verified</span>
            </div>
          </div>
        </div>

        {/* 3-Tier Progressive Roadmap Indicator */}
        <div className="pt-3 border-t border-[#EAECF0]">
          <span className="text-[11px] font-semibold text-[#667085] block mb-2">
            Screening Progression
          </span>
          <div className="flex items-center gap-2 text-xs">
            {/* Tier 1 */}
            <div className="flex items-center gap-1.5 font-medium text-[#111318]">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center text-[10px] font-bold">
                <Check className="w-3 h-3" aria-hidden="true" />
              </span>
              <span>1. Symptoms</span>
            </div>

            <div className="flex-1 h-0.5 bg-[#EAECF0] mx-1" />

            {/* Tier 2 */}
            <div
              className={`flex items-center gap-1.5 font-medium ${
                isTier2 ? 'text-[#111318]' : 'text-[#98A2B3]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isTier2
                    ? 'bg-[#ECFDF3] text-[#027A48]'
                    : 'border border-[#D0D5DD] bg-white text-[#667085]'
                }`}
              >
                {isTier2 ? <Check className="w-3 h-3" aria-hidden="true" /> : '2'}
              </span>
              <span>2. Labs</span>
            </div>

            <div className="flex-1 h-0.5 bg-[#EAECF0] mx-1" />

            {/* Tier 3 */}
            <div
              className={`flex items-center gap-1.5 font-medium ${
                isTier3 ? 'text-[#111318]' : 'text-[#98A2B3]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isTier3
                    ? 'bg-[#ECFDF3] text-[#027A48]'
                    : 'border border-[#D0D5DD] bg-white text-[#667085]'
                }`}
              >
                {isTier3 ? <Check className="w-3 h-3" aria-hidden="true" /> : '3'}
              </span>
              <span>3. Ultrasound</span>
            </div>
          </div>
        </div>

        {/* Ultrasound Grad-CAM Preview if available */}
        {isTier3 && gradcamB64 && (
          <div className="pt-2 border-t border-[#EAECF0]">
            <div className="p-3 rounded-2xl bg-[#FDE6EF]/30 border border-[#FDE6EF] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={gradcamB64.startsWith('data:') ? gradcamB64 : `data:image/png;base64,${gradcamB64}`}
                  alt="Ultrasound Neural Heatmap"
                  className="w-12 h-12 rounded-xl object-cover border border-[#FDE6EF] shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#DC326C] block">
                    Ultrasound Imaging Focus
                  </span>
                  <p className="text-xs font-semibold text-[#111318] truncate">
                    {pcomStatus || 'Morphological scan analyzed'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onViewAssessment}
                className="text-xs font-semibold text-[#F43F7D] hover:text-[#DC326C] cursor-pointer shrink-0"
              >
                View Analysis →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Actions & Medical Non-Diagnostic Disclaimer */}
      <div className="pt-4 border-t border-[#EAECF0] space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <FemalePrimaryButton onClick={onViewAssessment}>
            <span>View Full Assessment</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </FemalePrimaryButton>

          {!isTier2 && onAddLabs && (
            <FemaleSecondaryButton onClick={onAddLabs}>
              <span>Add Clinical Labs</span>
            </FemaleSecondaryButton>
          )}
        </div>

        <p className="text-[11px] text-[#98A2B3] leading-relaxed">
          Evidence-based screening indicator · Does not constitute a clinical diagnosis. Consult a physician for diagnostic evaluation.
        </p>
      </div>
    </FemaleCard>
  );
};
