import React from 'react';
import {
  CheckCircle,
  Clock,
  LayersThree01,
  ShieldTick,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { TierProgressionItem } from '../../types/longitudinalHealth';

interface TierProgressionRoadmapProps {
  pathway: HealthPathway;
  tiers: TierProgressionItem[];
}

export const TierProgressionRoadmap: React.FC<TierProgressionRoadmapProps> = ({
  pathway,
  tiers = [],
}) => {
  const isMale = pathway === 'male';

  const themeColor = isMale ? '#0288D1' : '#F43F7D';
  const themeBgLight = isMale ? '#F0F9FF' : '#FDE6EF';
  const themeBorder = isMale ? '#BAE6FD' : '#FBCFE8';

  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
            <LayersThree01 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Clinical Assessment Depth Roadmap
            </h2>
            <p className="text-xs text-[#667085] font-sans">
              {isMale
                ? 'Progression across BioPulse AI hypogonadism multi-tier evidence models.'
                : 'Progression across BioPulse AI multi-modal PCOS assessment tiers.'}
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
          Evidence Progression
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          return (
            <div
              key={tier.tier}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3.5 shadow-2xs ${
                tier.is_completed
                  ? isMale
                    ? 'bg-gradient-to-br from-[#F0F9FF]/70 to-white border-[#BAE6FD]'
                    : 'bg-gradient-to-br from-[#FDE6EF]/60 to-white border-[#FBCFE8]'
                  : 'bg-[#FAFAFC] border-[#EAECF0] opacity-80'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#667085]">
                    Tier {tier.tier_number}
                  </span>
                  {tier.is_completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                      <CheckCircle className="w-3 h-3 text-[#16A36A]" aria-hidden="true" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#667085] bg-[#F2F4F7] px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-[#98A2B3]" aria-hidden="true" />
                      Next Step
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-[#111318] tracking-tight">{tier.label}</h3>
                <p className="text-xs text-[#475467] leading-relaxed font-sans">{tier.description}</p>
              </div>

              <div className="pt-2.5 border-t border-[#EAECF0] text-[11px] font-mono text-[#667085] flex items-center justify-between">
                {tier.is_completed && tier.completed_at_display ? (
                  <span>Verified: {tier.completed_at_display}</span>
                ) : (
                  <span>Upload lab reports to unlock</span>
                )}
                {tier.is_completed && <ShieldTick className="w-3.5 h-3.5 text-[#16A36A]" aria-hidden="true" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TierProgressionRoadmap;
