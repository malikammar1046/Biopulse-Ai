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
import { evaluateAdamResponses } from '../../utils/adamScoring';

interface MaleScreeningCardProps {
  hasAssessment: boolean;
  probabilityPercent: number | null;
  riskCategory?: string;
  riskLabel?: string;
  assessmentLevel?: string;
  updatedAt?: string | null;
  threshold?: number;
  adamResponses?: Record<string, boolean | null | undefined> | null;
  adamScore?: number | null;
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
  adamResponses,
  adamScore,
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

  // 4. Dynamic Tier Titles & Summaries (Apple Clarity)
  const isTier2 = assessmentLevel === 'tier_1_2' || assessmentLevel === 'tier_2';
  const tierName = isTier2 ? 'Tier 2' : 'Tier 1';
  const tierSummary = isTier2
    ? 'Your result includes verified clinical laboratory biomarkers and hormone pattern analysis.'
    : 'Your current screening evaluates self-reported vitality indicators, the validated ADAM clinical questionnaire, and baseline anthropometrics.';

  // Threshold calculations (0.1808 is the calibrated screening cutoff)
  const cutoffDisplay = Number((threshold * 100).toFixed(1)); // 18.1%
  const isAboveThreshold = (probabilityPercent / 100) >= threshold;

  // Evaluate ADAM clinical screening criteria independently
  const adamEval = evaluateAdamResponses(adamResponses);

  // Map category to calm patient-friendly label & badge variant
  const normalizedCategory = riskCategory?.toLowerCase() || 'lower';
  const badgeVariant =
    normalizedCategory === 'higher' || normalizedCategory === 'elevated' || isAboveThreshold
      ? 'danger'
      : normalizedCategory === 'intermediate' || normalizedCategory === 'moderate'
      ? 'warning'
      : 'success';

  const categoryLabel =
    riskLabel ||
    (isAboveThreshold
      ? 'Higher Screening Risk'
      : 'Lower Screening Risk');

  // SVG circular geometry with calibrated threshold tick at 18.08%
  // Circumference = 2 * PI * 40 = 251.327
  const ringCircumference = 251.327;
  const progressOffset = ringCircumference - (ringCircumference * Math.min(Math.max(probabilityPercent, 0), 100)) / 100;

  // Threshold tick angle: in SVG with -rotate-90, 0 is at 12 o'clock, alpha = 2 * PI * threshold
  const thresholdAngle = 2 * Math.PI * threshold;
  const tickCos = Math.cos(thresholdAngle);
  const tickSin = Math.sin(thresholdAngle);
  const tickX1 = 50 + 34 * tickCos;
  const tickY1 = 50 + 34 * tickSin;
  const tickX2 = 50 + 46 * tickCos;
  const tickY2 = 50 + 46 * tickSin;

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

        {/* Risk Percentage & Gauge Indicator with Visual Cutoff Reference */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-1 px-1">
          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                Screening Probability Score
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isAboveThreshold
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isAboveThreshold ? `↑ Above ${cutoffDisplay}% screening cutoff` : `↓ Below ${cutoffDisplay}% screening cutoff`}
              </span>
            </div>

            <div className="flex items-baseline justify-center sm:justify-start gap-2.5">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111318]">
                {probabilityPercent}%
              </span>
              <span className="text-xs text-[#667085] font-medium">
                (screening threshold: {cutoffDisplay}%)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-md pt-0.5">
              {isAboveThreshold
                ? `Estimated probability exceeds the ${cutoffDisplay}% screening cutoff for lower morning serum testosterone. ${tierSummary}`
                : `Estimated probability remains below the ${cutoffDisplay}% screening cutoff for lower morning serum testosterone. ${tierSummary}`}
            </p>
          </div>

          {/* Minimalist Apple Circular Indicator with Red Cutoff Marker */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-26 h-26 sm:w-28 sm:h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-[#E2E8F0]"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Progress arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`transition-all duration-700 ease-out ${
                    isAboveThreshold ? 'text-[#D97706]' : 'text-[#0868B9]'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Calibrated Screening Threshold Notch at 18.08% */}
                <line
                  x1={tickX1}
                  y1={tickY1}
                  x2={tickX2}
                  y2={tickY2}
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Ring Center: Status relative to 18.1% cutoff */}
              <div className="absolute flex flex-col items-center justify-center text-center px-1">
                <span
                  className={`text-[11px] font-bold leading-tight ${
                    isAboveThreshold ? 'text-amber-800' : 'text-[#0868B9]'
                  }`}
                >
                  {isAboveThreshold ? 'Above Cutoff' : 'Below Cutoff'}
                </span>
                <span className="text-[9px] text-[#667085] font-medium leading-none mt-0.5">
                  Cutoff {cutoffDisplay}%
                </span>
              </div>
            </div>

            {/* Gauge Legend */}
            <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-[#667085]">
              <span className="flex items-center gap-1 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAboveThreshold ? 'bg-[#D97706]' : 'bg-[#0868B9]'
                  }`}
                />
                Score: {probabilityPercent}%
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-1 bg-rose-500 rounded-xs" />
                Cutoff: {cutoffDisplay}%
              </span>
            </div>
          </div>
        </div>

        {/* Dual Clinical Screening Section: ADAM Symptoms vs Statistical ML Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#EAECF0]">
          {/* Panel 1: ADAM Clinical Screen */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                ADAM Clinical Screen
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  adamEval.statusText === 'Positive'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : adamEval.statusText === 'Negative'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {adamEval.statusText}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#0F172A]">
              {adamEval.totalAnswered > 0
                ? `${adamEval.yesCount} of ${adamEval.totalAnswered} indicators`
                : adamScore !== null && adamScore !== undefined
                ? `${adamScore} positive indicators`
                : 'Not Completed'}
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Symptom-based clinical screen (Morley criteria: libido, erections, or ≥3 stamina items).
            </p>
          </div>

          {/* Panel 2: Statistical Low-Testosterone ML Estimate */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Statistical Low-T Model
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  isAboveThreshold
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                {isAboveThreshold ? 'Above Cutoff' : 'Below Cutoff'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#0F172A]">
              {probabilityPercent}% <span className="text-xs font-normal text-[#64748B]">/ {cutoffDisplay}% cutoff</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Calibrated statistical estimate trained on NHANES morning serum testosterone.
            </p>
          </div>
        </div>

        {/* 2-Tier Progressive Roadmap Indicator (NO Tier 3) */}
        <div className="pt-5 border-t border-[#EAECF0]">
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
          <div className="pt-4 border-t border-[#EAECF0]">
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
      <div className="pt-5 border-t border-[#EAECF0] space-y-4">
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
