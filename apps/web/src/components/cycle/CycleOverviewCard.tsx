import React from 'react';
import { Calendar, Clock, ActivityHeart, Compass01 } from '@untitledui/icons';
import type { CycleSummaryStats } from '../../types/cycle';

interface CycleOverviewCardProps {
  stats: CycleSummaryStats;
}

export const CycleOverviewCard: React.FC<CycleOverviewCardProps> = ({ stats }) => {
  if (!stats.hasData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none">
        <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
            <span>Cycle Day</span>
          </div>
          <span className="text-xl font-bold font-display text-[#64748B] block">
            Not enough data yet
          </span>
          <span className="text-xs text-[#64748B] block">Log a period to calculate day</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
            <Compass01 className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
            <span>Cycle Phase</span>
          </div>
          <span className="text-xl font-bold font-display text-[#64748B] block">
            Not enough data yet
          </span>
          <span className="text-xs text-[#64748B] block">Estimated phase baseline</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
            <span>Cycle Length</span>
          </div>
          <span className="text-xl font-bold font-display text-[#64748B] block">
            {stats.totalCycleDays} days (default)
          </span>
          <span className="text-xs text-[#64748B] block">Will adapt as you log cycles</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#047857] uppercase tracking-wider">
            <ActivityHeart className="w-4 h-4 text-[#047857] shrink-0" aria-hidden="true" />
            <span>Period Status</span>
          </div>
          <span className="text-xl font-bold font-display text-[#64748B] block">
            Not enough data yet
          </span>
          <span className="text-xs text-[#64748B] block">Awaiting first recorded period</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none">
      {/* 1. Cycle Day */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs hover:shadow-sm transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
            <span>Current Cycle Day</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] font-medium">
            of ~{stats.totalCycleDays}d
          </span>
        </div>

        <div>
          <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
            Day {stats.currentCycleDay}
          </span>
          <span className="text-xs font-semibold text-[#F43F7D] flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#F43F7D] animate-pulse" />
            {stats.estimatedPhase?.name || 'Active Cycle'}
          </span>
        </div>
      </div>

      {/* 2. Cycle Phase */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs hover:shadow-sm transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
            <Compass01 className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
            <span>Estimated Phase</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] font-medium">
            Estimate
          </span>
        </div>

        <div>
          <span className="text-2xl font-extrabold font-display text-[#F43F7D] tracking-tight block truncate">
            {stats.estimatedPhase?.name || 'Follicular Phase'}
          </span>
          <span className="text-xs text-[#475569] block mt-0.5 truncate">
            {stats.estimatedPhase?.tag === 'Peak Fertile' ? 'Fertile window' : 'Hormone pattern window'}
          </span>
        </div>
      </div>

      {/* 3. Cycle Length */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs hover:shadow-sm transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
            <span>Cycle Length</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] font-medium">
            {stats.totalRecordsCount > 1 ? 'Calculated Avg' : 'Initial'}
          </span>
        </div>

        <div>
          <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
            {stats.totalCycleDays} days
          </span>
          <span className="text-xs text-[#475569] block mt-0.5">
            ~{stats.periodDuration} days average flow
          </span>
        </div>
      </div>

      {/* 4. Period Status */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs hover:shadow-sm transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#047857] uppercase tracking-wider">
            <ActivityHeart className="w-4 h-4 text-[#047857] shrink-0" aria-hidden="true" />
            <span>Period Status</span>
          </div>
          {stats.isCycleActive && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
              Active
            </span>
          )}
        </div>

        <div>
          <span className="text-lg font-bold font-display text-[#0F172A] tracking-tight block truncate">
            {stats.periodStatus}
          </span>
          <span className="text-xs text-[#475569] block mt-0.5">
            Next est: {stats.nextPeriodDate || 'Calculating...'}
          </span>
        </div>
      </div>
    </div>
  );
};
