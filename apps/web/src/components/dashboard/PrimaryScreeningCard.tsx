import React from 'react';
import { ArrowRight, Check, Activity, Loading01 } from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';

interface PrimaryScreeningCardProps {
  pathway: HealthPathway;
  hasAssessment: boolean;
  probabilityPercent: number | null;
  riskCategory?: string;
  riskLabel?: string;
  assessmentLevel?: string;
  updatedAt?: string | null;
  threshold?: number;
  onStartScreening: () => void;
  onViewAssessment: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  loading?: boolean;
  gradcamB64?: string | null;
  pcomStatus?: string | null;
}

export const PrimaryScreeningCard: React.FC<PrimaryScreeningCardProps> = ({
  pathway,
  hasAssessment,
  probabilityPercent,
  riskCategory = 'lower',
  riskLabel,
  assessmentLevel = 'tier_1',
  updatedAt,
  threshold = 0.1808,
  onStartScreening,
  onViewAssessment,
  onSecondaryAction,
  secondaryActionLabel,
  loading = false,
}) => {
  const isTier2 = assessmentLevel === 'tier_1_2';
  const title = pathway === 'male' ? 'Hypogonadism Screening' : 'PCOS Screening';
  const assessmentLevelLabel = isTier2 ? 'Tier 2 Assessment' : 'Tier 1 Assessment';

  // Contextual Risk Status Badge
  const normalizedCategory = (riskCategory || 'lower').toLowerCase();
  const isHigher = normalizedCategory.includes('high') || normalizedCategory.includes('elevated');
  const isIntermediate = !isHigher && (normalizedCategory.includes('intermediate') || normalizedCategory.includes('moderate'));

  const statusBadge = isHigher ? (
    <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]">
      {riskLabel || 'Higher Risk'}
    </span>
  ) : isIntermediate ? (
    <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-[#FEF7EC] text-[#B54708] border-[#FEDF89]">
      {riskLabel || 'Intermediate Risk'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]">
      {riskLabel || 'Lower Screening Risk'}
    </span>
  );

  // ---------------------------------------------------------------------------
  // 1. Loading State (corresponds to FemaleLoadingState)
  // ---------------------------------------------------------------------------
  if (loading && (!hasAssessment || probabilityPercent === null)) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between text-left space-y-6 h-full select-none animate-pulse">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-medical-primary-muted border border-medical-primary-border flex items-center justify-center text-medical-primary-hover">
                <Activity className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-medical-text-primary">{title}</h2>
                <p className="text-xs text-medical-text-muted">Synchronizing model results...</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-medical-primary-muted text-medical-primary-hover border-medical-primary-border">
              Synchronizing
            </span>
          </div>

          <div className="py-10 flex flex-col items-center justify-center space-y-3">
            <Loading01 className="w-8 h-8 text-medical-primary-hover animate-spin" aria-hidden="true" />
            <p className="text-xs font-semibold text-medical-text-primary">Calibrating Clinical Intelligence</p>
            <p className="text-[11px] text-medical-text-muted">Synthesizing screening inputs...</p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0]">
          <p className="text-[11px] text-medical-text-muted leading-relaxed">
            Evidence-based screening indicator · Does not constitute a clinical diagnosis.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Empty State (corresponds to FemaleEmptyState)
  // ---------------------------------------------------------------------------
  if (!hasAssessment || probabilityPercent === null) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between text-left space-y-6 h-full select-none">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-medical-primary-muted border border-medical-primary-border flex items-center justify-center text-medical-primary-hover">
                <Activity className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-medical-text-primary">{title}</h2>
                <p className="text-xs text-medical-text-muted">Screening Not Started</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-[#F2F4F7] text-[#344054] border-[#EAECF0]">
              Not Started
            </span>
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base sm:text-lg font-semibold text-medical-text-primary">Initial screening required</h3>
            <p className="text-xs sm:text-sm text-medical-text-muted leading-relaxed">
              Complete the ADAM questionnaire to assess potential testosterone deficiency patterns and establish your clinical baseline.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
          <button
            type="button"
            onClick={onStartScreening}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2.5 rounded-xl whitespace-nowrap bg-medical-primary-hover hover:bg-medical-primary-active active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-medical-primary-hover/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Start Screening</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>

          <p className="text-[11px] text-medical-text-muted leading-relaxed">
            Evidence-based screening indicator · Does not constitute a clinical diagnosis. Consult a physician for diagnostic evaluation.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Active Screening State (Exact correspondence to FemaleScreeningCard)
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-left transition-all duration-200 space-y-5 select-none flex flex-col justify-between h-full">
      <div className="space-y-5">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-medical-primary-muted border border-medical-primary-border flex items-center justify-center text-medical-primary-hover">
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-medical-text-primary">
                {title}
              </h2>
              <p className="text-xs text-medical-text-muted">
                {assessmentLevelLabel} {updatedAt ? `· Updated ${updatedAt}` : ''}
              </p>
            </div>
          </div>

          {statusBadge}
        </div>

        {/* Probability Score & Circular Tier Indicator */}
        <div className="flex items-center justify-between gap-6 py-2">
          <div className="space-y-1">
            <span className="text-xs font-medium text-medical-text-muted block">
              Screening Probability Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold font-display text-medical-text-primary">
                {probabilityPercent}%
              </span>
              <span className="text-xs text-medical-text-muted">
                (threshold {Math.round(threshold * 100)}%)
              </span>
            </div>
            <p className="text-xs text-medical-text-muted pt-1 max-w-xs leading-relaxed">
              {isTier2
                ? 'Your result includes verified morning testosterone and metabolic panel.'
                : 'Based on your reported ADAM questionnaire symptoms and clinical profile.'}
            </p>
          </div>

          {/* Clean Circular Tier Indicator (corresponds to Female ring in Male blue) */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-medical-primary-muted"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-medical-primary-hover transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * Math.min(Math.max(probabilityPercent, 0), 100)) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-medical-text-primary">
                {isTier2 ? 'Tier 2' : 'Tier 1'}
              </span>
              <span className="text-[10px] text-medical-text-muted">
                {isTier2 ? 'Verified' : 'Initial'}
              </span>
            </div>
          </div>
        </div>

        {/* Screening Progression (Male 2 tiers: 1. Symptoms, 2. Labs) */}
        <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
          <span className="text-xs font-medium text-medical-text-muted block">
            Screening Progression
          </span>
          <div className="flex items-center gap-2 text-xs">
            {/* Tier 1 */}
            <div className="flex items-center gap-1.5 font-medium text-medical-text-primary">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center text-[10px] font-bold shrink-0">
                <Check className="w-3 h-3" aria-hidden="true" />
              </span>
              <span>1. Symptoms (ADAM)</span>
            </div>

            <div className="flex-1 h-0.5 bg-[#E2E8F0] mx-1" />

            {/* Tier 2 */}
            <div
              className={`flex items-center gap-1.5 font-medium ${
                isTier2 ? 'text-medical-text-primary' : 'text-medical-text-muted'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isTier2
                    ? 'bg-[#ECFDF3] text-[#027A48]'
                    : 'border border-[#CBD5E1] bg-white text-medical-text-muted'
                }`}
              >
                {isTier2 ? <Check className="w-3 h-3" aria-hidden="true" /> : '2'}
              </span>
              <span>2. Hormone Labs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Actions & Clinical Non-Diagnostic Disclaimer */}
      <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onViewAssessment}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2.5 rounded-xl whitespace-nowrap bg-medical-primary-hover hover:bg-medical-primary-active active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-medical-primary-hover/30"
          >
            <span>View Full Assessment</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>

          {!isTier2 && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2.5 rounded-xl whitespace-nowrap bg-white hover:bg-medical-primary-soft active:scale-[0.98] text-medical-primary-hover border border-[#E2E8F0] hover:border-medical-primary-border text-xs sm:text-sm font-semibold shadow-xs transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-medical-primary-hover/20"
            >
              <span>{secondaryActionLabel || 'Add Hormone Labs'}</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-medical-text-muted leading-relaxed">
          Evidence-based screening indicator · Does not constitute a clinical diagnosis. Consult a physician for diagnostic evaluation.
        </p>
      </div>
    </div>
  );
};

export default PrimaryScreeningCard;
