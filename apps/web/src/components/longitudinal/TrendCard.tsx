import React from 'react';
import {
  LineChartUp01,
  Minus,
  Activity,
  HelpCircle,
  ShieldTick,
  AlertCircle,
  Calendar,
  LayersThree01,
} from '@untitledui/icons';
import type { TrendMetric, TrendState } from '../../types/longitudinal';

interface TrendCardProps {
  trend: TrendMetric;
}

export const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const getBadge = (state: TrendState) => {
    switch (state) {
      case 'improving':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <LineChartUp01 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            Improving
          </span>
        );
      case 'changing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Activity className="w-3 h-3 text-amber-600" aria-hidden="true" />
            Changing Pattern
          </span>
        );
      case 'developing_pattern':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[var(--color-medical-primary-soft,#F0F9FF)] text-[var(--color-medical-primary-hover,#0288D1)] border border-[var(--color-medical-primary-border,#BAE6FD)]">
            <LineChartUp01 className="w-3 h-3 text-[var(--color-medical-primary-hover,#0288D1)]" aria-hidden="true" />
            Developing Pattern
          </span>
        );
      case 'insufficient_data':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            <HelpCircle className="w-3 h-3 text-[#64748B]" aria-hidden="true" />
            Limited History
          </span>
        );
      case 'stable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            <Minus className="w-3 h-3 text-[#64748B]" aria-hidden="true" />
            Stable Baseline
          </span>
        );
    }
  };

  const getTrustBadge = (trust: string) => {
    if (trust === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
          <ShieldTick className="w-2.5 h-2.5 text-emerald-600" aria-hidden="true" />
          Verified Lab Result
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-medical-primary-soft,#F0F9FF)] text-[#0369A1] border border-[var(--color-medical-primary-border,#BAE6FD)] font-semibold">
        User Logged
      </span>
    );
  };

  return (
    <div className="p-6 rounded-[24px] bg-white hover:border-[var(--color-medical-primary-hover,#0288D1)] border border-[var(--color-medical-primary-border,#BAE6FD)] shadow-sm transition-all text-left space-y-4 relative overflow-hidden">
      {/* Top Header: Title, Category & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] font-bold">
              {trend.category}
            </span>
            {getTrustBadge(trend.basedOn.trustLevel)}
          </div>
          <h4 className="text-base font-bold font-display text-[#0F172A] tracking-tight">{trend.title}</h4>
        </div>
        <div>{getBadge(trend.trendState)}</div>
      </div>

      {/* 1. WHAT CHANGED (Patient-Friendly Observable) */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-medical-primary-hover,#0288D1)] font-bold block">
          What Changed
        </span>
        <p className="text-xs sm:text-sm text-[#0F172A] font-sans leading-relaxed font-medium">
          {trend.whatChanged}
        </p>
      </div>

      {/* 2. OVER WHAT PERIOD & BASED ON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[var(--color-medical-primary-border,#BAE6FD)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#64748B] font-bold">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-medical-primary-hover,#0288D1)]" aria-hidden="true" />
            <span>Over What Period</span>
          </div>
          <p className="text-xs text-[#0F172A] font-semibold">{trend.overWhatPeriod}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[var(--color-medical-primary-border,#BAE6FD)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#64748B] font-bold">
            <LayersThree01 className="w-3.5 h-3.5 text-[var(--color-medical-primary-hover,#0288D1)]" aria-hidden="true" />
            <span>Based On</span>
          </div>
          <p className="text-xs text-[#0F172A] font-semibold">
            {trend.basedOn.recordCount} {trend.basedOn.label}
          </p>
        </div>
      </div>

      {/* 3. LIMITATION (Safety & Clinical Boundary) */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-800 font-bold">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Clinical Limitation</span>
        </div>
        <p className="text-[11px] text-[#5C451D] leading-relaxed">{trend.limitation}</p>
      </div>

      {/* 4. Action Tip */}
      {trend.actionTip && (
        <p className="text-[11px] text-[#475569] italic pt-0.5">
          <span className="font-semibold text-[#0F172A]">Next Step:</span> {trend.actionTip}
        </p>
      )}
    </div>
  );
};
