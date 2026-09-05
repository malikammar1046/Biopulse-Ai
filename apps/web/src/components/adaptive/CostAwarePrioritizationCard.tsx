import React from 'react';
import { TrendingUp, ShieldAlert } from 'lucide-react';
import type { PrioritizedInformationItem } from '../../types/adaptiveScreening';

interface CostAwarePrioritizationCardProps {
  recommendations: PrioritizedInformationItem[];
}

export const CostAwarePrioritizationCard: React.FC<CostAwarePrioritizationCardProps> = ({
  recommendations,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-6 text-left select-none">
      {/* ── Title & Research Context ────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF1F2] border border-[#FECDD3] text-xs font-mono text-[#BE123C] font-bold">
          <TrendingUp className="w-3.5 h-3.5 text-[#E11D48]" />
          <span>Research & Information Prioritization</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold font-display text-[#1C1326]">
          Cost-Aware Information Prioritization
        </h3>
        <p className="text-xs text-[#584B68] max-w-2xl leading-relaxed">
          Not all clinical tests have the same diagnostic yield relative to their accessibility. The platform models potential screening clarity against estimated testing complexity.
        </p>
      </div>

      {/* ── Approved Clinical Wording Callout ───────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#9F1239] space-y-1.5">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-[#881337]">
          <ShieldAlert className="w-4 h-4 text-[#E11D48]" />
          <span>Clinical Decision-Support Notice</span>
        </div>
        <p className="leading-relaxed">
          <strong>Based on the evaluated model, this additional information could provide the greatest estimated improvement in screening performance relative to its estimated cost. This information is intended to support discussion with a healthcare professional and does not constitute a medical recommendation.</strong>
        </p>
      </div>

      {/* ── Candidate Information Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-2xl bg-[#FAF7FC] border border-[#E7DFEF] hover:border-[#8E3EAF]/40 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#8E3EAF] bg-[#FAF5FF] border border-[#E9D5FF] px-2 py-0.5 rounded-full">
                  {rec.tier.replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Cost: {rec.estimatedCostTier}
                </span>
              </div>

              <h4 className="text-sm font-bold text-[#1C1326] font-display">
                {rec.testName}
              </h4>

              <p className="text-xs text-[#584B68] leading-relaxed">
                {rec.estimatedBenefitDescription}
              </p>
            </div>

            <div className="pt-2 border-t border-[#E7DFEF] space-y-1 text-[11px] text-[#736384]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1326]">Estimated Yield:</span>
                <span className="capitalize text-[#0284C7] font-bold">{rec.estimatedBenefit}</span>
              </div>
              <p className="text-[10px] italic leading-tight text-[#8D7E9E]">
                {rec.clinicalNote}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pricing Disclaimer ──────────────────────────────────────────── */}
      <div className="text-[11px] text-[#8D7E9E] leading-relaxed">
        * Cost tiers (<span className="text-emerald-700 font-bold">$</span> = Accessible routine blood work, <span className="text-emerald-700 font-bold">$$</span> = Specialized hormonal assay, <span className="text-emerald-700 font-bold">$$$</span> = Imaging/procedure) are statistical estimates subject to regional provider fees, laboratory pricing, and health insurance coverage.
      </div>
    </div>
  );
};
