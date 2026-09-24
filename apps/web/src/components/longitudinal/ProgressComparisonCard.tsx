import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from '@untitledui/icons';
import type { PeriodComparisonSummary } from '../../types/longitudinal';

interface ProgressComparisonCardProps {
  comparison: PeriodComparisonSummary;
}

export const ProgressComparisonCard: React.FC<ProgressComparisonCardProps> = ({ comparison }) => {
  const getDirectionBadge = () => {
    switch (comparison.direction) {
      case 'increased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            Increased
          </span>
        );
      case 'decreased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <ArrowDownRight className="w-3 h-3 text-amber-600" aria-hidden="true" />
            Decreased
          </span>
        );
      case 'unchanged':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#584B68] bg-[#F8F5FA] border border-[#E7DFEF] px-2.5 py-0.5 rounded-full">
            <Minus className="w-3 h-3 text-[#7A6A8B]" aria-hidden="true" />
            Unchanged
          </span>
        );
    }
  };

  return (
    <div className="p-5 rounded-[24px] bg-white hover:border-[var(--color-medical-primary-hover,#0288D1)] border border-[var(--color-medical-primary-border,#BAE6FD)] shadow-sm transition-all text-left space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] font-bold block mb-0.5">
            {comparison.category} Comparison
          </span>
          <h4 className="text-base font-bold font-display text-[#0F172A] tracking-tight">{comparison.metricLabel}</h4>
        </div>
        {getDirectionBadge()}
      </div>

      {/* Two Period Values Grid */}
      <div className="grid grid-cols-2 gap-3 items-center">
        {/* Previous Period */}
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[var(--color-medical-primary-border,#BAE6FD)] space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] block truncate font-medium">
            {comparison.previousPeriodLabel}
          </span>
          <div className="text-lg font-bold font-mono text-[#475569]">
            {comparison.previousValue} {comparison.unit || ''}
          </div>
        </div>

        {/* Current Period */}
        <div className="p-3 rounded-xl bg-[var(--color-medical-primary-soft,#F0F9FF)] border border-[var(--color-medical-primary-border,#BAE6FD)] space-y-1 relative">
          <span className="text-[10px] font-mono text-[var(--color-medical-primary-hover,#0288D1)] font-bold block truncate">
            {comparison.currentPeriodLabel}
          </span>
          <div className="text-lg font-bold font-mono text-[#0F172A]">
            {comparison.currentValue} {comparison.unit || ''}
          </div>
        </div>
      </div>

      {/* Concrete Observation */}
      <p className="text-xs text-[#0F172A] font-sans leading-relaxed font-medium">
        {comparison.observation}
      </p>

      {/* Real Record Provenance */}
      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#64748B] border-t border-[#E2E8F0]">
        <span>Based on: {comparison.evidence.label} ({comparison.evidence.recordCount} entries)</span>
      </div>
    </div>
  );
};
