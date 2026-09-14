import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, Check, Clock, Circle } from 'lucide-react';
import type { AdaptiveHealthProfile, TierSummary, TierLevel } from '../../../types/adaptiveScreening';
import type { HealthPathway } from '../../../types/onboarding';
import { ROUTES } from '../../../constants/routes';

interface TierProgressionCardProps {
  adaptiveProfile: AdaptiveHealthProfile;
  pathway: HealthPathway;
}

export const TierProgressionCard: React.FC<TierProgressionCardProps> = ({
  adaptiveProfile,
  pathway,
}) => {
  const tierKeys: TierLevel[] = ['tier_1', 'tier_2', 'tier_3', 'tier_4'];
  const tierList: TierSummary[] = tierKeys
    .map((k) => adaptiveProfile.tiers?.[k])
    .filter(Boolean);

  const activeTier =
    tierList.find((t) => t.status === 'in_progress' || t.status === 'available') ||
    tierList[0];
  const currentTierDisplay = activeTier?.tier
    ? activeTier.tier.replace('_', ' ').toUpperCase()
    : 'TIER 1';

  const headingText = {
    female: 'PCOS Progressive Screening Depth',
    male: 'Hypogonadism Progressive Screening Depth',
    general: 'Progressive Screening Depth',
  }[pathway];

  const getTierSymbol = (tier: TierSummary) => {
    if (tier.status === 'ready_for_assessment' || tier.completenessPercentage >= 95) {
      return (
        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 stroke-[2.5]" />
        </span>
      );
    }
    if (tier.completenessPercentage > 0) {
      return (
        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Clock className="w-3 h-3" />
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
        <Circle className="w-2.5 h-2.5" />
      </span>
    );
  };

  return (
    <div
      className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-6 text-left"
      id="tier-progression-card"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
              Progressive Screening
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-[#0F172A]">
              {headingText}
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
          Current: {currentTierDisplay}
        </span>
      </div>

      {/* Narrative overview */}
      <p className="text-xs text-[#64748B] font-sans leading-relaxed">
        {pathway === 'male'
          ? 'BioPulse AI assesses initial reported data and prioritizes clinical evidence before specialized endocrine evaluation.'
          : 'BioPulse AI assesses what you know today and prioritizes accessible clinical tests before expensive diagnostics.'}
      </p>

      {/* 4-Tier Stack List */}
      <div className="space-y-2.5">
        {tierList.map((tier, idx) => {
          const isCurrent = tier.tier === activeTier?.tier;
          const tierNum = idx + 1;

          return (
            <div
              key={tier.tier}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-[#F0F9FF] border-[#BAE6FD]'
                  : 'bg-white border-[#E2E8F0] hover:border-[#BAE6FD]'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isCurrent
                        ? 'bg-[#0288D1] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    T{tierNum}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold font-display text-[#0F172A] block truncate">
                      {tier.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-[#0F172A]">
                    {tier.completenessPercentage}%
                  </span>
                  {getTierSymbol(tier)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tier.completenessPercentage}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="h-full rounded-full bg-[#29B6F6]"
                />
              </div>

              <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#64748B] font-sans">
                <span className="truncate pr-2">{tier.subtitle}</span>
                <span className="font-mono shrink-0">
                  {tier.knownCount}/{tier.totalFieldsCount} data points
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA to Assessment */}
      <div className="pt-1">
        <Link
          to={ROUTES.APP.ASSESSMENT}
          className="w-full py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-sm text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{pathway === 'male' ? 'Explore Progressive Screening & Evidence Gaps' : 'Explore 3-Tier Assessment & Gap Analysis'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
