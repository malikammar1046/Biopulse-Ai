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
  onRetry?: () => void;
  loading?: boolean;
  isOnboarded?: boolean;
  screeningState?: 'not_started' | 'processing' | 'ready' | 'error';
  gradcamB64?: string | null;
  pcomStatus?: string | null;
}

export const FemaleScreeningCard: React.FC<FemaleScreeningCardProps> = ({
  hasAssessment,
  probabilityPercent,
  riskCategory = 'lower',
  riskLabel: _riskLabel,
  assessmentLevel = 'tier_1',
  updatedAt,
  threshold: _threshold = 0.25,
  onStartScreening,
  onViewAssessment,
  onAddLabs,
  onRetry,
  loading = false,
  isOnboarded = false,
  screeningState,
  gradcamB64,
  pcomStatus,
}) => {
  // 1. Loading / Processing State
  if (screeningState === 'processing' || (loading && (!hasAssessment || probabilityPercent === null))) {
    return (
      <FemaleLoadingState
        title="Calculating your screening result..."
        message="Analyzing your symptoms, cycle patterns, and biometrics..."
      />
    );
  }

  // 2. Error State (When user is onboarded but assessment calculation is missing or failed)
  if (screeningState === 'error' || (isOnboarded && (!hasAssessment || probabilityPercent === null) && !loading)) {
    return (
      <FemaleEmptyState
        badge="Screening Notice"
        title="We couldn't prepare your result"
        description="Your onboarding profile is saved, but your initial screening calculation was interrupted. You can calculate your screening result now."
        actionLabel="Calculate Screening Result"
        onAction={onRetry || onStartScreening}
        icon={Activity}
      />
    );
  }

  // 3. Not Started State (Only shown when not loading and user has not completed onboarding)
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
  const tierStatusBadge = isTier3 || isTier2 ? 'Comprehensive screening' : 'Tier 1 screening';
  const tierSummary = isTier3
    ? 'Your current screening combines your health profile, symptoms, clinical laboratory values, and ultrasound imaging.'
    : isTier2
    ? 'Your current screening result combines your health profile, symptoms and available laboratory information.'
    : 'Your current screening result is based on your health profile, cycle information, symptoms and lifestyle factors.';

  // Map category to calm patient-friendly label & badge variant
  const normalizedCategory = riskCategory?.toLowerCase() || 'lower';
  const badgeVariant =
    normalizedCategory === 'higher' || normalizedCategory === 'elevated'
      ? 'pink'
      : normalizedCategory === 'intermediate' || normalizedCategory === 'moderate'
      ? 'warning'
      : normalizedCategory === 'unavailable'
      ? 'neutral'
      : 'success';

  const categoryLabel =
    normalizedCategory === 'higher' || normalizedCategory === 'elevated'
      ? 'Higher likelihood'
      : normalizedCategory === 'intermediate' || normalizedCategory === 'moderate'
      ? 'Intermediate likelihood'
      : normalizedCategory === 'unavailable'
      ? 'Assessment unavailable'
      : 'Lower likelihood';

  const nextStepAdvice = isTier2
    ? (normalizedCategory === 'higher' || normalizedCategory === 'elevated'
      ? 'Consider discussing your screening result and relevant symptoms with a qualified healthcare professional.'
      : normalizedCategory === 'intermediate' || normalizedCategory === 'moderate'
      ? 'Consider discussing persistent symptoms and lab findings with a healthcare professional.'
      : 'Continue monitoring your health patterns and consult a clinician if symptoms persist.')
    : (normalizedCategory === 'higher' || normalizedCategory === 'elevated'
      ? 'Adding recommended laboratory results will build a more informed assessment. Consider discussing symptoms with a healthcare professional.'
      : normalizedCategory === 'intermediate' || normalizedCategory === 'moderate'
      ? 'Add recommended laboratory results to build a more informed assessment.'
      : 'Continue tracking your health and repeat assessment if your information changes.');

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
                {tierStatusBadge} {updatedAt ? `· Updated ${updatedAt}` : ''}
              </span>
            </div>
          </div>

          <FemaleStatusBadge variant={badgeVariant}>
            {categoryLabel}
          </FemaleStatusBadge>
        </div>

        {/* Likelihood Percentage & Gauge Indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-1 px-1">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-xs font-medium text-[#667085] block">
              Estimated screening likelihood
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111318]">
                {probabilityPercent}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-md pt-1">
              {tierSummary}
            </p>
            <div className="pt-2 text-xs text-[#027A48] bg-[#ECFDF3] rounded-xl px-3 py-2 border border-[#D1FADF]/60 max-w-md">
              <span className="font-semibold text-[#027A48] block mb-0.5">Next step</span>
              <span className="text-[#05603A]">{nextStepAdvice}</span>
            </div>
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
          This is a screening estimate, not a diagnosis. Does not confirm or rule out PCOS. Consult a physician for diagnostic evaluation.
        </p>
      </div>
    </FemaleCard>
  );
};
