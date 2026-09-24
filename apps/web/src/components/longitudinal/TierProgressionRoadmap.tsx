import React from 'react';
import {
  CheckCircle,
  Clock,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { TierProgressionItem } from '../../types/longitudinalHealth';

interface TierProgressionRoadmapProps {
  pathway: HealthPathway;
  tiers: TierProgressionItem[];
}

export const TierProgressionRoadmap: React.FC<TierProgressionRoadmapProps> = ({
  pathway,
  tiers,
}) => {
  const isMale = pathway === 'male';

  const themeColor = isMale ? 'var(--color-medical-primary-hover, #0288D1)' : 'var(--female-primary, #F43F7D)';
  const themeBgLight = isMale ? 'var(--color-medical-primary-soft, #F0F9FF)' : 'var(--female-primary-light, #FDE6EF)';
  const themeBorder = isMale ? 'var(--color-medical-primary-border, #BAE6FD)' : 'var(--female-border, rgba(244,63,125,0.2))';

  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Assessment Depth Progression
            </h2>
            <span
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: themeBgLight,
                color: themeColor,
                borderColor: themeBorder,
              }}
            >
              Clinical Evidence Progression
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5 font-sans">
            {isMale
              ? 'Progression across BioPulse AI hypogonadism assessment tiers.'
              : 'Progression across BioPulse AI multi-modal PCOS assessment tiers.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {tiers.map((tier) => {
          return (
            <div
              key={tier.tier}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                tier.is_completed
                  ? isMale
                    ? 'bg-[var(--color-medical-primary-soft,#F0F9FF)]/40 border-[var(--color-medical-primary-border,#BAE6FD)]'
                    : 'bg-[#FDE6EF]/30 border-[#F43F7D]/25'
                  : 'bg-[#FAFAFC] border-[#EAECF0] opacity-80'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#667085]">
                    Tier {tier.tier_number}
                  </span>
                  {tier.is_completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                      <CheckCircle className="w-3 h-3 text-[#16A36A]" aria-hidden="true" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#667085] bg-[#F2F4F7] px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-[#98A2B3]" aria-hidden="true" />
                      Next Assessment Step
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-[#111318]">{tier.label}</h3>
                <p className="text-xs text-[#475569] leading-relaxed">{tier.description}</p>
              </div>

              <div className="pt-2 border-t border-[#EAECF0] text-[11px] font-mono text-[#667085]">
                {tier.is_completed && tier.completed_at_display ? (
                  <span>Logged: {tier.completed_at_display}</span>
                ) : (
                  <span>Next assessment step unlocks further clinical evidence</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TierProgressionRoadmap;
