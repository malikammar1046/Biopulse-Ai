import React from 'react';
import { ArrowRight, Check, Activity } from '@untitledui/icons';
import {
  MaleCard,
  MaleStatusBadge,
  MalePrimaryButton,
  MaleSecondaryButton,
  MaleLoadingState,
  MaleEmptyState,
} from './MaleDesignPrimitives';

interface MaleScreeningCardProps {
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
  hormonePatternInterpretation?: {
    pattern_name?: string;
    pattern_description?: string;
  } | null;
}

export const MaleScreeningCard: React.FC<MaleScreeningCardProps> = ({
  hasAssessment,
  probabilityPercent,
  riskCategory = 'lower',
  riskLabel,
  assessmentLevel = 'tier_1',
  updatedAt,
  threshold = 0.1808,
  onStartScreening,
  onViewAssessment,
  onAddLabs,
  onRetry,
  loading = false,
  isOnboarded = false,
  screeningState,
  hormonePatternInterpretation,
}) => {
  // 1. Loading / Processing State
  if (screeningState === 'processing' || (loading && (!hasAssessment || probabilityPercent === null))) {
    return (
      <MaleLoadingState
        title="Calculating your screening result..."
        message="Evaluating your vitality indicators, ADAM responses, and baseline metabolic factors..."
      />
    );
  }

  // 2. Error State (When user is onboarded but assessment calculation is missing or failed)
  if (screeningState === 'error' || (isOnboarded && (!hasAssessment || probabilityPercent === null) && !loading)) {
    return (
      <MaleEmptyState
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
      <MaleEmptyState
        badge="Not Started"
        title="No Hypogonadism Assessment Yet"
        description="Complete your initial screening to evaluate vitality symptoms, ADAM indicators, and baseline metabolic factors."
        actionLabel="Start Initial Screening"
        onAction={onStartScreening}
        icon={Activity}
      />
    );
  }

  // 3. Dynamic Tier Titles & Summaries (Apple Clarity)
  const isTier2 = assessmentLevel === 'tier_1_2' || assessmentLevel === 'tier_2';
  const tierName = isTier2 ? 'Tier 2' : 'Tier 1';
  const tierSummary = isTier2
    ? 'Your result includes verified clinical laboratory biomarkers and hormone pattern analysis.'
    : 'Your current screening is based on self-reported symptoms, ADAM indicators, and anthropometric baselines.';

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
    <MaleCard className="flex flex-col justify-between space-y-6 h-full select-none">
      <div className="space-y-6">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EAECF0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DDEFFD] border border-[#0868B9]/20 flex items-center justify-center text-[#0868B9]">
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#111318]">
                Hypogonadism Screening
              </h2>
              <span className="text-[11px] text-[#667085]">
                {tierName} Assessment {updatedAt ? `· Updated ${updatedAt}` : ''}
              </span>
            </div>
          </div>

          <MaleStatusBadge variant={badgeVariant}>
            {categoryLabel}
          </MaleStatusBadge>
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
                className="text-[#DDEFFD]"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-[#0868B9] transition-all duration-700 ease-out"
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

        {/* 2-Tier Progressive Roadmap Indicator (NO Tier 3) */}
        <div className="pt-6 border-t border-[#EAECF0]">
          <span className="text-[11px] font-semibold text-[#667085] block mb-2.5">
            Screening Progression
          </span>
          <div className="flex items-center gap-2 text-xs">
            {/* Tier 1 */}
            <div className="flex items-center gap-1.5 font-medium text-[#111318]">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center text-[10px] font-bold">
                <Check className="w-3 h-3" aria-hidden="true" />
              </span>
              <span>1. Symptoms & ADAM</span>
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
              <span>2. Hormone Labs</span>
            </div>
          </div>
        </div>

        {/* Tier 2 Hormone Pattern Summary Preview if available */}
        {isTier2 && hormonePatternInterpretation?.pattern_name && (
          <div className="pt-5 border-t border-[#EAECF0]">
            <div className="p-3.5 rounded-2xl bg-[#DDEFFD]/40 border border-[#BAE6FD] flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0868B9] block">
                  Hormone Pattern Interpretation
                </span>
                <p className="text-xs font-semibold text-[#111318] truncate">
                  {hormonePatternInterpretation.pattern_name}
                </p>
                {hormonePatternInterpretation.pattern_description && (
                  <p className="text-[11px] text-[#667085] line-clamp-1">
                    {hormonePatternInterpretation.pattern_description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onViewAssessment}
                className="text-xs font-semibold text-[#0868B9] hover:text-[#07589D] cursor-pointer shrink-0"
              >
                View Details →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Actions & Medical Non-Diagnostic Disclaimer */}
      <div className="pt-6 border-t border-[#EAECF0] space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <MalePrimaryButton onClick={onViewAssessment}>
            <span>View Full Assessment</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </MalePrimaryButton>

          {!isTier2 && onAddLabs && (
            <MaleSecondaryButton onClick={onAddLabs}>
              <span>Add Hormone Labs</span>
            </MaleSecondaryButton>
          )}
        </div>

        <p className="text-[11px] text-[#98A2B3] leading-relaxed">
          Evidence-based screening estimate · Does not constitute a clinical diagnosis. Consult a physician and obtain a morning fasting total testosterone draw for diagnostic evaluation.
        </p>
      </div>
    </MaleCard>
  );
};

export default MaleScreeningCard;
