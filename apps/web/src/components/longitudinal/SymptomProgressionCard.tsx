import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Minus,
  InfoCircle,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type {
  MaleVitalitySummary,
  FactorComparisonItem,
} from '../../types/longitudinalHealth';

interface SymptomProgressionCardProps {
  pathway: HealthPathway;
  maleVitalitySummary?: MaleVitalitySummary | null;
  symptomComparisons: FactorComparisonItem[];
  hasSingleAssessment?: boolean;
}

export const SymptomProgressionCard: React.FC<SymptomProgressionCardProps> = ({
  pathway,
  maleVitalitySummary,
  symptomComparisons,
  hasSingleAssessment = false,
}) => {
  const isMale = pathway === 'male';

  const themeColor = isMale ? 'var(--color-medical-primary-hover, #0288D1)' : 'var(--female-primary, #F43F7D)';
  const themeBgLight = isMale ? 'var(--color-medical-primary-soft, #F0F9FF)' : 'var(--female-primary-light, #FDE6EF)';
  const themeBorder = isMale ? 'var(--color-medical-primary-border, #BAE6FD)' : 'var(--female-border, rgba(244,63,125,0.2))';

  const getStatusBadge = (direction: string, _clinicalSignificance?: string) => {
    switch (direction) {
      case 'newly_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2.5 py-0.5 rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            <AlertCircle className="w-3 h-3" aria-hidden="true" /> Newly Reported
          </span>
        );
      case 'no_longer_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2.5 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
            <CheckCircle className="w-3 h-3" aria-hidden="true" /> No Longer Reported
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2.5 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            <Minus className="w-3 h-3" aria-hidden="true" /> Unchanged
          </span>
        );
      case 'baseline_recorded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2.5 py-0.5 rounded-full bg-[#F8F9FC] text-[#475569] border border-[#EAECF0]">
            <InfoCircle className="w-3 h-3" aria-hidden="true" /> Baseline
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2.5 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            {direction.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
      {/* ── Card Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
            {isMale ? 'Vitality & Hypogonadism Symptom Tracking' : 'Symptom & Ovulatory Progression'}
          </h2>
          <p className="text-xs text-[#667085] mt-0.5 font-sans">
            {isMale
              ? 'Longitudinal monitoring of vitality indicators and fatigue progression.'
              : 'Tracking of hyperandrogenism and ovulatory cycle symptom stability over time.'}
          </p>
        </div>

        <span
          className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border self-start sm:self-center"
          style={{
            backgroundColor: themeBgLight,
            color: themeColor,
            borderColor: themeBorder,
          }}
        >
          {isMale ? 'Vitality Metrics' : 'Symptom Phenotype'}
        </span>
      </div>

      {/* ── Male Specific: Dynamic Vitality Score Summary (Constraint 1) ── */}
      {isMale && maleVitalitySummary && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-medical-primary-soft,#F0F9FF)] border border-[var(--color-medical-primary-border,#BAE6FD)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-medical-primary-hover,#0288D1)] font-bold block">
                Vitality & Symptom Summary
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold font-display text-[#0F172A]">
                  {maleVitalitySummary.current_display}
                </span>
                {maleVitalitySummary.previous_display && !hasSingleAssessment && (
                  <span className="text-xs font-mono text-[#475569]">
                    (Previously: {maleVitalitySummary.previous_display})
                  </span>
                )}
              </div>
            </div>

            {maleVitalitySummary.delta_reported_count !== null && !hasSingleAssessment && (
              <div className="self-start sm:self-center">
                {maleVitalitySummary.delta_reported_count < 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {Math.abs(maleVitalitySummary.delta_reported_count)} fewer vitality symptoms reported
                  </span>
                ) : maleVitalitySummary.delta_reported_count > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    +{maleVitalitySummary.delta_reported_count} newly reported vitality symptoms
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
                    <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                    Symptom score unchanged
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-[#0369A1] font-sans leading-relaxed">
            Evaluates key hypogonadal symptoms including energy levels, sleep quality, libido, and mood indicators derived directly from your questionnaire responses.
          </p>
        </div>
      )}

      {/* ── Symptom Breakdown Rows ── */}
      {symptomComparisons.length === 0 ? (
        <div className="py-8 text-center rounded-xl bg-[#F8F9FC] border border-[#EAECF0] space-y-1">
          <InfoCircle className="w-5 h-5 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-xs text-[#667085]">
            No specific symptom questionnaire features recorded for comparison.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {symptomComparisons.map((sym) => (
            <div
              key={sym.factor_key}
              className="p-3.5 rounded-xl border border-[#EAECF0] bg-white hover:border-[#D0D5DD] transition-all flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-[#111318]">{sym.label}</span>
                {getStatusBadge(sym.direction, sym.clinical_significance)}
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-[#F2F4F7]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#667085]">
                    {hasSingleAssessment ? 'Status:' : 'Observed:'}
                  </span>
                  {!hasSingleAssessment && (
                    <>
                      <span className="text-[#667085]">{sym.previous_display}</span>
                      <span className="text-[#98A2B3]">→</span>
                    </>
                  )}
                  <span className="font-bold text-[#111318]">{sym.current_display}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SymptomProgressionCard;
