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
  const tiers: TierLevel[] = ['tier_1', 'tier_2', 'tier_3', 'tier_4'];

  const getTierProgressColor = (tierKey: TierLevel) => {
    switch (tierKey) {
      case 'tier_1':
        return 'from-[#8E3EAF] to-[#A855F7]';
      case 'tier_2':
        return 'from-[#0284C7] to-[#38BDF8]';
      case 'tier_3':
        return 'from-[#F43F5E] to-[#FDA4AF]';
      case 'tier_4':
        return 'from-[#10B981] to-[#34D399]';
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden">
      {/* ── 1. Header & Screening Readiness Banner ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] text-xs font-mono text-[#8E3EAF] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Progressive 4-Tier Assessment</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-display text-[#1C1326]">
            Information Completeness
          </h3>
          <p className="text-xs sm:text-sm text-[#584B68] font-sans max-w-xl leading-relaxed">
            VITASense builds your health profile progressively. Additional information can provide a more complete screening profile, but higher tiers are completely optional.
          </p>
        </div>

        {/* Readiness Status Badge */}
        <div className="p-4 rounded-2xl bg-[#FAF7FC] border border-[#E7DFEF] flex flex-col items-start sm:items-end justify-center shrink-0 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#736384]">
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
            <span className="text-sm font-bold text-[#1C1326] font-display">
              {profile.readinessLabel}
            </span>
          </div>
          <span className="text-[11px] text-[#736384] max-w-xs text-left sm:text-right">
            {profile.readinessDescription}
          </span>
        </div>
      </div>

      {/* ── 2. Overall Information Completeness Meter ───────────────────── */}
      <div className="space-y-2 p-4 rounded-2xl bg-[#FAF7FC] border border-[#E7DFEF]">
        <div className="flex items-center justify-between text-xs font-mono text-[#584B68]">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <span>Overall Profile Completeness</span>
            <span className="text-[10px] text-[#736384] font-sans font-normal">
              (Not a medical or health score)
            </span>
          </span>
          <span className="text-base font-extrabold text-[#1C1326] font-mono">
            {profile.overallCompletenessPercentage}%
          </span>
        </div>

        {/* Master Progress Bar */}
        <div
          className="w-full h-3 rounded-full bg-[#E7DFEF] overflow-hidden"
          role="progressbar"
          aria-valuenow={profile.overallCompletenessPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall Information Completeness"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8E3EAF] via-[#FB7185] to-[#38BDF8] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(4, profile.overallCompletenessPercentage)}%` }}
          />
        </div>
      </div>

      {/* ── 3. Four Progressive Tiers Breakdown ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {tiers.map((tierKey, index) => {
          const summary = profile.tiers[tierKey];
          if (!summary) return null;

          return (
            <button
              key={tierKey}
              type="button"
              onClick={() => onSelectTier && onSelectTier(tierKey)}
              className="p-4 rounded-2xl bg-[#FAF7FC] border border-[#E7DFEF] hover:border-[#8E3EAF]/50 hover:bg-white hover:shadow-sm transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#8E3EAF]">
                    Tier {index + 1}
                  </span>
                  <span className="text-[11px] font-mono text-[#736384] group-hover:text-[#1C1326] flex items-center gap-1 font-medium">
                    <span>{summary.statusSymbol}</span>
                    <span>{summary.statusLabel}</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1C1326] group-hover:text-[#8E3EAF] transition-colors line-clamp-1 font-display">
                  {summary.name.replace(/^Tier \d+:\s*/, '')}
                </h4>
                <p className="text-[11px] text-[#736384] line-clamp-2 leading-tight">
                  {summary.subtitle}
                </p>
              </div>

              {/* Progress bar per tier */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-[#736384]">
                  <span>{summary.knownCount} of {summary.totalFieldsCount} recorded</span>
                  <span className="font-bold text-[#1C1326]">{summary.completenessPercentage}%</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full bg-[#E7DFEF] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={summary.completenessPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${summary.name} Completeness`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getTierProgressColor(tierKey)} transition-all duration-300`}
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
