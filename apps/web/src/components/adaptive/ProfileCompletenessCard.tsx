import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import type { AdaptiveHealthProfile, TierLevel } from '../../types/adaptiveScreening';

interface ProfileCompletenessCardProps {
  profile: AdaptiveHealthProfile;
  onSelectTier?: (tier: TierLevel) => void;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  profile,
  onSelectTier,
}) => {
  const isMale = profile.pathway === 'male';
  // Female supports Tier 1, 2, 3. Male supports Tier 1, 2.
  const tiers: TierLevel[] = isMale ? ['tier_1', 'tier_2'] : ['tier_1', 'tier_2', 'tier_3'];

  const getTierProgressColor = (tierKey: TierLevel) => {
    switch (tierKey) {
      case 'tier_1':
        return 'bg-[#0288D1]';
      case 'tier_2':
        return 'bg-[#0284C7]';
      case 'tier_3':
        return 'bg-[#0D9488]';
      case 'tier_4':
        return 'bg-[#10B981]';
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#BAE6FD] shadow-xs flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden">
      {/* ── 1. Header & Screening Readiness Banner ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono text-[#01579B] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#0288D1]" />
            <span>Progressive {isMale ? '2-Tier' : '3-Tier'} Assessment</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-display text-[#01579B]">
            Information Completeness
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] font-sans max-w-xl leading-relaxed">
            BioPulse AI builds your health profile progressively. Additional information can provide a more complete screening profile, but higher tiers are completely optional.
          </p>
        </div>

        {/* Readiness Status Badge */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/80 flex flex-col items-start sm:items-end justify-center shrink-0 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
            Screening Readiness
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                profile.readinessStatus === 'needs_tier1_intake'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-sm font-bold text-[#0F172A] font-display">
              {profile.readinessLabel}
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] max-w-xs text-left sm:text-right">
            {profile.readinessDescription}
          </span>
        </div>
      </div>

      {/* ── 2. Overall Information Completeness Meter ───────────────────── */}
      <div className="space-y-2 p-4 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/80">
        <div className="flex items-center justify-between text-xs font-mono text-[#475569]">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#01579B]">
            <span>Overall Profile Completeness</span>
            <span className="text-[10px] text-[#64748B] font-sans font-normal">
              (Not a medical or health score)
            </span>
          </span>
          <span className="text-base font-extrabold text-[#01579B] font-mono">
            {profile.overallCompletenessPercentage}%
          </span>
        </div>

        {/* Master Progress Bar */}
        <div
          className="w-full h-3 rounded-full bg-[#E2E8F0] overflow-hidden"
          role="progressbar"
          aria-valuenow={profile.overallCompletenessPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall Information Completeness"
        >
          <div
            className="h-full rounded-full bg-[#0288D1] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(4, profile.overallCompletenessPercentage)}%` }}
          />
        </div>
      </div>

      {/* ── 3. Progressive Tiers Breakdown ─────────────────────────── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isMale ? 'lg:grid-cols-2 max-w-2xl' : 'lg:grid-cols-3'} gap-3.5`}>
        {tiers.map((tierKey, index) => {
          const summary = profile.tiers[tierKey];
          if (!summary) return null;

          return (
            <button
              key={tierKey}
              type="button"
              onClick={() => onSelectTier && onSelectTier(tierKey)}
              className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/70 hover:border-[#0288D1] hover:bg-[#F0F9FF] hover:shadow-xs transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#0288D1]">
                    Tier {index + 1}
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B] group-hover:text-[#0F172A] flex items-center gap-1 font-medium">
                    <span>{summary.statusSymbol}</span>
                    <span>{summary.statusLabel}</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#0288D1] transition-colors line-clamp-1 font-display">
                  {summary.name.replace(/^Tier \d+:\s*/, '')}
                </h4>
                <p className="text-[11px] text-[#64748B] line-clamp-2 leading-tight">
                  {summary.subtitle}
                </p>
              </div>

              {/* Progress bar per tier */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
                  <span>{summary.knownCount} of {summary.totalFieldsCount} recorded</span>
                  <span className="font-bold text-[#0F172A]">{summary.completenessPercentage}%</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={summary.completenessPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${summary.name} Completeness`}
                >
                  <div
                    className={`h-full rounded-full ${getTierProgressColor(tierKey)} transition-all duration-300`}
                    style={{ width: `${Math.max(summary.completenessPercentage > 0 ? 5 : 0, summary.completenessPercentage)}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 4. Non-Diagnostic Safe Footer ───────────────────────────────── */}
      <div className="flex items-start gap-2.5 text-xs text-[#0369A1] bg-[#F0F9FF] p-3.5 rounded-2xl border border-[#BAE6FD]">
        <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong className="text-[#0C4A6E]">Continuous Accessibility Notice:</strong> Screening performance can vary depending on how much relevant information is available. A missing test or incomplete tier never implies the presence or absence of a clinical condition.
        </p>
      </div>
    </div>
  );
};
