import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
} from '@untitledui/icons';
import type { TierLevel, TierSummary } from '../../types/adaptiveScreening';
import { AdaptiveInformationCard } from './AdaptiveInformationCard';

interface ScreeningTierNavigatorProps {
  tiers: Record<TierLevel, TierSummary>;
  selectedTier: TierLevel;
  onSelectTier: (tier: TierLevel) => void;
  onVerifyBiomarker?: (itemId: string, reportId?: string, resultId?: string) => void;
  pathway?: 'female' | 'male';
}

export const ScreeningTierNavigator: React.FC<ScreeningTierNavigatorProps> = ({
  tiers,
  selectedTier,
  onSelectTier,
  onVerifyBiomarker,
  pathway = 'female',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Female supports Tier 1, 2, 3 (Ultrasound). Male supports Tier 1, 2 (Labs).
  const tierKeys: TierLevel[] = pathway === 'male' ? ['tier_1', 'tier_2'] : ['tier_1', 'tier_2', 'tier_3'];
  const activeSummary = tiers[selectedTier] || tiers['tier_1'];

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#BAE6FD] shadow-xs space-y-6 text-left select-none">
      {/* ── 1. Top Tier Navigation Tabs ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold text-[#0288D1] block mb-0.5">
            Progressive Disclosure
          </span>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#01579B]">
            Screening Information Tiers
          </h3>
        </div>

        {/* Tab Buttons */}
        <div
          className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/80"
          role="tablist"
          aria-label="Progressive Screening Information Tiers"
        >
          {tierKeys.map((tKey, idx) => {
            const sum = tiers[tKey];
            if (!sum) return null;
            const isSelected = selectedTier === tKey;

            return (
              <button
                key={tKey}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectTier(tKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0288D1] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-white'
                }`}
              >
                <span>{`Tier ${idx + 1}`}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 text-[#64748B]'
                  }`}
                >
                  {sum.statusSymbol}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Active Tier Header Banner & Progressive Disclosure ────────── */}
      {activeSummary && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-bold text-[#01579B] font-display">
                  {activeSummary.name}
                </h4>
                <span className="text-xs font-mono text-[#047857] font-bold bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]/60">
                  {activeSummary.statusSymbol} {activeSummary.statusLabel}
                </span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                {activeSummary.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-4 self-start sm:self-auto shrink-0">
              <div className="text-right font-mono">
                <span className="text-xs font-bold text-[#0F172A] block">
                  {activeSummary.knownCount} / {activeSummary.totalFieldsCount} Recorded
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {activeSummary.completenessPercentage}% Complete
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F0F9FF] border border-[#BAE6FD] text-xs text-[#01579B] hover:text-[#0288D1] font-sans flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? 'Collapse Tier' : 'Explore Tier Items'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#01579B]" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#01579B]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* ── 3. Cards Grid for the Active Tier ──────────────────────────── */}
          {isExpanded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Biomarkers & Indicators in this tier ({activeSummary.items.length})</span>
                <span className="italic">Click any item's "Why It Matters" for clinical context</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeSummary.items.map((item) => (
                  <AdaptiveInformationCard
                    key={item.id}
                    item={item}
                    onVerify={onVerifyBiomarker}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
