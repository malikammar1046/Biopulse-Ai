import React from 'react';
import {
  LineChartDown01,
  LineChartUp01,
  Minus,
  CheckCircle,
  AlertCircle,
  InfoCircle,
  LayersThree01,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type {
  ImportantChangeItem,
  ScreeningComparabilityInfo,
} from '../../types/longitudinalHealth';

interface WhatChangedCardProps {
  pathway: HealthPathway;
  changes: ImportantChangeItem[];
  comparability?: ScreeningComparabilityInfo | null;
  hasSingleAssessment?: boolean;
  hasNoAssessments?: boolean;
}

export const WhatChangedCard: React.FC<WhatChangedCardProps> = ({
  pathway,
  changes,
  comparability,
  hasSingleAssessment = false,
  hasNoAssessments = false,
}) => {
  const isMale = pathway === 'male';

  const getDirectionBadge = (item: ImportantChangeItem) => {
    switch (item.direction) {
      case 'increased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartUp01 className="w-3 h-3" aria-hidden="true" /> Increased
          </span>
        );
      case 'decreased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartDown01 className="w-3 h-3" aria-hidden="true" /> Decreased
          </span>
        );
      case 'newly_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            <AlertCircle className="w-3 h-3" aria-hidden="true" /> Newly Reported
          </span>
        );
      case 'no_longer_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
            <CheckCircle className="w-3 h-3" aria-hidden="true" /> Resolved
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            <Minus className="w-3 h-3" aria-hidden="true" /> Unchanged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            <InfoCircle className="w-3 h-3" aria-hidden="true" /> {item.change_display || 'Observed'}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'screening':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            Screening
          </span>
        );
      case 'laboratory':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Verified Lab
          </span>
        );
      case 'symptom':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Symptom Log
          </span>
        );
      case 'cycle':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            Menstrual Cycle
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
            Biometric
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              What Changed?
            </h2>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                isMale
                  ? 'bg-[var(--color-medical-primary-soft,#F0F9FF)] text-[var(--color-medical-primary-hover,#0288D1)] border-[var(--color-medical-primary-border,#BAE6FD)]'
                  : 'bg-[var(--female-primary-light,#FDE6EF)] text-[#DC326C] border-[var(--female-border,rgba(244,63,125,0.2))]'
              }`}
            >
              Priority Progression
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1 font-sans">
            Objective deterministic changes identified between your latest assessment and historical baseline.
          </p>
        </div>

        {comparability?.state === 'cross_tier' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono self-start sm:self-center">
            <LayersThree01 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Cross-Tier: Biometrics compared; screening risk separated</span>
          </div>
        )}
      </div>

      {/* ── Baseline / Single Assessment Notice ── */}
      {hasSingleAssessment && (
        <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#EAECF0] flex items-start gap-3">
          <InfoCircle className="w-4 h-4 text-[var(--color-medical-primary-hover,#0288D1)] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-xs text-[#475569]">
            <p className="font-semibold text-[#111318]">Baseline Assessment Established</p>
            <p>
              Your initial clinical assessment has established your authoritative baseline. As you log follow-up assessments or verified lab reports, objective deltas and clinical trajectories will appear here automatically.
            </p>
          </div>
        </div>
      )}

      {/* ── Zero Assessments Notice ── */}
      {hasNoAssessments && (
        <div className="p-6 text-center rounded-xl bg-[#F8F9FC] border border-[#EAECF0] space-y-2">
          <InfoCircle className="w-6 h-6 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-sm font-semibold text-[#111318]">No Assessment Records</p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Complete your initial clinical screening questionnaire to establish your personalized health progress baseline.
          </p>
        </div>
      )}

      {/* ── Important Changes List ── */}
      {!hasNoAssessments && !hasSingleAssessment && changes.length === 0 && (
        <div className="p-6 text-center rounded-xl bg-[#F8F9FC] border border-[#EAECF0] space-y-2">
          <InfoCircle className="w-5 h-5 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-xs text-[#667085]">
            No significant metric shifts detected between the selected assessment points. Measurements remain stable.
          </p>
        </div>
      )}

      {!hasNoAssessments && changes.length > 0 && (
        <div className="space-y-3">
          {changes.map((item, idx) => (
            <div
              key={`${item.factor_key}-${idx}`}
              className="p-3.5 sm:p-4 rounded-xl border border-[#EAECF0] bg-white hover:border-[#D0D5DD] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#98A2B3]">#{idx + 1}</span>
                  {getCategoryBadge(item.category)}
                  <h3 className="text-sm font-semibold text-[#111318]">{item.label}</h3>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">{item.explanation}</p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F2F4F7]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#667085] line-through">
                    {item.previous_display}
                  </span>
                  <span className="text-xs text-[#98A2B3]">→</span>
                  <span className="text-xs font-mono font-bold text-[#111318]">
                    {item.current_display}
                  </span>
                </div>
                {getDirectionBadge(item)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatChangedCard;
