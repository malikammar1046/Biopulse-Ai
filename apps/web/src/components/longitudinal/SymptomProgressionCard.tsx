import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Minus,
  InfoCircle,
  Heart,
  Droplets01,
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
  symptomComparisons = [],
  hasSingleAssessment = false,
}) => {
  const isMale = pathway === 'male';

  const themeColor = isMale ? '#0288D1' : '#F43F7D';
  const themeBgLight = isMale ? '#F0F9FF' : '#FDE6EF';
  const themeBorder = isMale ? '#BAE6FD' : '#FBCFE8';

  const getStatusBadge = (direction: string) => {
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
            <CheckCircle className="w-3 h-3" aria-hidden="true" /> Resolved
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
    <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5">
      {/* ── Card Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
            {isMale ? <Heart className="w-5 h-5" aria-hidden="true" /> : <Droplets01 className="w-5 h-5" aria-hidden="true" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              {isMale ? 'Vitality & Hypogonadism Symptom Tracking' : 'Symptom & Ovulatory Progression'}
            </h2>
            <p className="text-xs text-[#667085] font-sans">
              {isMale
                ? 'Longitudinal monitoring of vitality indicators, fatigue, and androgenic symptom stability.'
                : 'Tracking of hyperandrogenism and ovulatory cycle symptom stability over time.'}
            </p>
          </div>
        </div>

        <span
          className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full border self-start sm:self-center"
          style={{
            backgroundColor: themeBgLight,
            color: themeColor,
            borderColor: themeBorder,
          }}
        >
          {isMale ? 'Vitality Metrics' : 'Symptom Phenotype'}
        </span>
      </div>

      {/* ── Male Specific: Dynamic Vitality Score Summary ── */}
      {isMale && maleVitalitySummary && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] border border-[#BAE6FD] space-y-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0288D1] font-bold block">
                Vitality & Symptom Summary
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-display text-[#073B72]">
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

          <p className="text-xs text-[#073B72]/90 leading-relaxed font-sans">
            Evaluates key hypogonadal symptoms including energy levels, sleep quality, libido, and mood indicators derived directly from your questionnaire responses.
          </p>
        </div>
      )}

      {/* ── Symptom Progression List ── */}
      {symptomComparisons.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] text-center space-y-1.5">
          <InfoCircle className="w-5 h-5 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-xs font-medium text-[#475467]">No recurring symptoms logged in this timeframe.</p>
          <p className="text-[11px] text-[#98A2B3]">
            {isMale
              ? 'Log energy levels, sleep quality, and stamina to establish longitudinal patterns.'
              : 'Log menstrual cramps, pelvic discomfort, or acne to track ovulatory stability.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {symptomComparisons.map((item) => (
            <div
              key={item.factor_key}
              className="p-4 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs hover:border-[#D0D5DD] transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#111318] line-clamp-1">
                    {item.label}
                  </h4>
                  <div className="shrink-0">{getStatusBadge(item.direction)}</div>
                </div>
                <p className="text-[11px] text-[#475467] leading-relaxed line-clamp-2 font-sans">
                  {item.explanation || item.current_display}
                </p>
              </div>

              <div className="pt-2 border-t border-[#EAECF0]/80 flex items-center justify-between text-[10px] font-mono text-[#667085]">
                <span>Status: {hasSingleAssessment ? 'Baseline' : item.direction.replace(/_/g, ' ')}</span>
                <span className="font-bold text-[#111318]">{item.current_display}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SymptomProgressionCard;
