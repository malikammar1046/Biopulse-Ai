import React, { useState } from 'react';
import {
  BarChart01,
  ChevronDown,
  ChevronUp,
  ShieldTick,
  AlertCircle,
  ArrowRight,
  Database01,
  CheckCircle,
  ActivityHeart,
  InfoCircle,
} from '@untitledui/icons';
import type { ExplainableInsight, TrustLevel } from '../../types/researchIntelligence';

interface ExplainableInsightCardProps {
  insight: ExplainableInsight;
  onOpenResearchModal: (insight: ExplainableInsight) => void;
}

export const ExplainableInsightCard: React.FC<ExplainableInsightCardProps> = ({
  insight,
  onOpenResearchModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Trust level badge helper
  const renderTrustBadge = (trust: TrustLevel, isQuarantined?: boolean) => {
    if (isQuarantined || trust === 'unverified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FB7185]/20 text-[#FDA4AF] border border-[#FB7185]/30">
          <AlertCircle className="w-2.5 h-2.5" aria-hidden="true" />
          Unverified (Quarantined)
        </span>
      );
    }
    switch (trust) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30">
            <CheckCircle className="w-2.5 h-2.5" aria-hidden="true" />
            Verified Lab
          </span>
        );
      case 'model_generated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <BarChart01 className="w-2.5 h-2.5" aria-hidden="true" />
            TreeSHAP ML
          </span>
        );
      case 'calculated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ActivityHeart className="w-2.5 h-2.5" aria-hidden="true" />
            Calculated
          </span>
        );
      case 'user_entered':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Database01 className="w-2.5 h-2.5" aria-hidden="true" />
            User-Entered
          </span>
        );
    }
  };

  // Status color
  const statusColor = {
    new: 'text-[#0288D1] bg-[#E0F2FE] border-[#BAE6FD]',
    active: 'text-[#0288D1] bg-[#E0F2FE] border-[#BAE6FD]',
    improving: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    stable: 'text-[#64748B] bg-slate-100 border-slate-200',
    changing: 'text-amber-700 bg-amber-50 border-amber-200',
    insufficient_data: 'text-amber-800 bg-amber-100 border-amber-200',
  }[insight.status];

  const engineLabel = {
    deterministic: 'Deterministic Logic',
    pattern: 'Pattern Intelligence',
    ml_tree_shap: 'ExtraTrees + TreeSHAP',
  }[insight.engineType];

  return (
    <div
      className="p-5 sm:p-6 rounded-[24px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] shadow-2xs relative overflow-hidden transition-all duration-200 hover:border-[#BAE6FD]"
      id={`insight-card-${insight.id}`}
    >
      <div className="relative z-10 space-y-4 text-left">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}>
              {insight.status.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white text-[#64748B] border border-[#E2E8F0]">
              {engineLabel}
            </span>
            {insight.confidenceLabel && (
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                {insight.confidenceLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
            <ShieldTick className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Non-Diagnostic</span>
          </div>
        </div>

        {/* 1. WHAT: Title & Summary */}
        <div className="space-y-1.5">
          <h4 className="text-base sm:text-lg font-bold font-display text-[#0F172A]">
            {insight.title}
          </h4>
          <p className="text-xs sm:text-sm text-[#64748B] font-sans leading-relaxed">
            {insight.summary}
          </p>
        </div>

        {/* 2. WHY: Short transparent explanation */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#0288D1] font-bold block">
            Why you're seeing this
          </span>
          <p className="text-xs text-[#64748B] font-sans leading-relaxed">
            {insight.why}
          </p>
        </div>

        {/* 3. BASED ON: Real Data Sources Provenance Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
            Based on actual records
          </span>
          <div className="flex flex-wrap gap-2">
            {insight.dataSources.map((ds, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A]"
                title={ds.description}
              >
                <span className="font-medium text-[11px]">{ds.label}</span>
                <span className="text-[10px] font-mono text-[#0288D1] bg-[#E0F2FE] px-1.5 py-0.5 rounded">
                  {ds.recordCount} record{ds.recordCount === 1 ? '' : 's'}
                </span>
                {renderTrustBadge(ds.trustLevel, ds.isQuarantined)}
              </div>
            ))}
          </div>
        </div>

        {/* 4. WHAT YOU CAN DO & LIMITATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold block">
              What you can do
            </span>
            <p className="text-xs text-[#0F172A] font-sans leading-relaxed">
              {insight.recommendedAction}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold block">
              Important limitation
            </span>
            <p className="text-xs text-[#0F172A] font-sans leading-relaxed">
              {insight.limitations}
            </p>
          </div>
        </div>

        {/* Expandable "Why am I seeing this?" Drawer */}
        <div className="pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full py-1 text-xs font-mono text-[#0288D1] hover:text-[#0277BD] transition-colors cursor-pointer"
            aria-expanded={isExpanded}
          >
            <span className="flex items-center gap-1.5 font-bold">
              <InfoCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {isExpanded ? 'Hide Factor Breakdown' : 'Why am I seeing this? (Expand factors)'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </button>

          {isExpanded && (
            <div className="mt-3 p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
                  Contributing Factors Evaluated
                </span>
                {insight.contributingFactors.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {insight.contributingFactors.map((factor, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0F172A]">{factor.label}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-[#64748B] uppercase border border-[#E2E8F0]">
                              {factor.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] font-sans">
                            {factor.explanation}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto ${
                            factor.influence === 'protective' || factor.influence === 'positive'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : factor.influence === 'contributing'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {factor.influence}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic">
                    No specific individual factors to list (deterministic observation based on log presence).
                  </p>
                )}
              </div>

              {/* Explicit "What this does NOT mean" Callout */}
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-0.5">
                <span className="font-mono text-[10px] uppercase font-bold text-rose-700 block">
                  What this does NOT mean
                </span>
                <p className="text-[11px] leading-relaxed">
                  {insight.whatThisDoesNotMean}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] font-mono text-[#64748B]">
            Engine: {engineLabel}
          </span>

          <button
            type="button"
            onClick={() => onOpenResearchModal(insight)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F0F9FF] text-xs font-sans font-semibold text-[#0288D1] border border-[#BAE6FD] transition-all shadow-2xs cursor-pointer"
          >
            <span>Research & Technical View</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
