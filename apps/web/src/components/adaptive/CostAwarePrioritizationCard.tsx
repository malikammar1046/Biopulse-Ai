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
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#BAE6FD] shadow-xs space-y-6 text-left select-none">
      {/* ── Title & Research Context ────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono text-[#01579B] font-bold">
          <TrendingUp className="w-3.5 h-3.5 text-[#0288D1]" />
          <span>Research & Information Prioritization</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold font-display text-[#01579B]">
          Cost-Aware Information Prioritization
        </h3>
        <p className="text-xs text-[#475569] max-w-2xl leading-relaxed">
          Not all clinical tests have the same diagnostic yield relative to their accessibility. The platform models potential screening clarity against estimated testing complexity.
        </p>
      </div>

      {/* ── Approved Clinical Wording Callout ───────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1.5">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-[#78350F]">
          <ShieldAlert className="w-4 h-4 text-[#D97706]" />
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
            className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/80 hover:border-[#0288D1] hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#01579B] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded-full">
                  {rec.tier.replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Cost: {rec.estimatedCostTier}
                </span>
              </div>

              <h4 className="text-sm font-bold text-[#0F172A] font-display">
                {rec.testName}
              </h4>

              <p className="text-xs text-[#475569] leading-relaxed">
                {rec.estimatedBenefitDescription}
              </p>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-[11px] text-[#64748B]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#0F172A]">Estimated Yield:</span>
                <span className="capitalize text-[#0288D1] font-bold">{rec.estimatedBenefit}</span>
              </div>
              <p className="text-[10px] italic leading-tight text-[#64748B]">
                {rec.clinicalNote}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pricing Disclaimer ──────────────────────────────────── */}
      <div className="text-[11px] text-[#64748B] leading-relaxed">
        * Cost tiers (<span className="text-emerald-700 font-bold">$</span> = Accessible routine blood work, <span className="text-emerald-700 font-bold">$$</span> = Specialized hormonal assay, <span className="text-emerald-700 font-bold">$$$</span> = Imaging/procedure) are statistical estimates subject to regional provider fees, laboratory pricing, and health insurance coverage.
      </div>
    </div>
  );
};
