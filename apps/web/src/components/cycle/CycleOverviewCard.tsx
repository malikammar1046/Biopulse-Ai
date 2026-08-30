import React from 'react';
import { Calendar, Clock, Activity, Sparkles } from 'lucide-react';
import type { CycleSummaryStats } from '../../types/cycle';

interface CycleOverviewCardProps {
  stats: CycleSummaryStats;
}

export const CycleOverviewCard: React.FC<CycleOverviewCardProps> = ({ stats }) => {
  if (!stats.hasData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none">
        <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8E3EAF] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span>Cycle Day</span>
          </div>
          <span className="text-xl font-bold font-display text-[#8D7E9E] block">
            Not enough data yet
          </span>
          <span className="text-xs text-[#8D7E9E] block">Log a period to calculate day</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6E2D8B] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>Cycle Phase</span>
          </div>
          <span className="text-xl font-bold font-display text-[#8D7E9E] block">
            Not enough data yet
          </span>
          <span className="text-xs text-[#8D7E9E] block">Estimated phase baseline</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A21CAF] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#FDF2F8] text-[#A21CAF]">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <span>Cycle Length</span>
          </div>
          <span className="text-xl font-bold font-display text-[#8D7E9E] block">
            {stats.totalCycleDays} days (default)
          </span>
          <span className="text-xs text-[#8D7E9E] block">Will adapt as you log cycles</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#047857] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#ECFDF5] text-[#047857]">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <span>Period Status</span>
          </div>
          <span className="text-xl font-bold font-display text-[#8D7E9E] block">
            Not enough data yet
          </span>
          <span className="text-xs text-[#8D7E9E] block">Awaiting first recorded period</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none">
      {/* 1. Cycle Day */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm hover:shadow-md transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8E3EAF] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span>Current Cycle Day</span>
          </div>
          <span className="text-[10px] font-mono text-[#8D7E9E] font-medium">
            of ~{stats.totalCycleDays}d
          </span>
        </div>

        <div>
          <span className="text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
            Day {stats.currentCycleDay}
          </span>
          <span className="text-xs font-semibold text-[#8E3EAF] flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#8E3EAF] animate-pulse" />
            {stats.estimatedPhase?.name || 'Active Cycle'}
          </span>
        </div>
      </div>

      {/* 2. Cycle Phase */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm hover:shadow-md transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6E2D8B] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>Estimated Phase</span>
          </div>
          <span className="text-[10px] font-mono text-[#8D7E9E] font-medium">
            Estimate
          </span>
        </div>

        <div>
          <span className="text-2xl font-extrabold font-display text-[#6E2D8B] tracking-tight block truncate">
            {stats.estimatedPhase?.name || 'Follicular Phase'}
          </span>
          <span className="text-xs text-[#584B68] block mt-0.5 truncate">
            {stats.estimatedPhase?.tag === 'Peak Fertile' ? 'Fertile window' : 'Hormone pattern window'}
          </span>
        </div>
      </div>

      {/* 3. Cycle Length */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm hover:shadow-md transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A21CAF] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#FDF2F8] text-[#A21CAF]">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <span>Cycle Length</span>
          </div>
          <span className="text-[10px] font-mono text-[#8D7E9E] font-medium">
            {stats.totalRecordsCount > 1 ? 'Calculated Avg' : 'Initial'}
          </span>
        </div>

        <div>
          <span className="text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
            {stats.totalCycleDays} days
          </span>
          <span className="text-xs text-[#584B68] block mt-0.5">
            ~{stats.periodDuration} days average flow
          </span>
        </div>
      </div>

      {/* 4. Period Status */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm hover:shadow-md transition-all text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#047857] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#ECFDF5] text-[#047857]">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <span>Period Status</span>
          </div>
          {stats.isCycleActive && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FDF2F8] text-[#FB7185]">
              Active
            </span>
          )}
        </div>

        <div>
          <span className="text-lg font-bold font-display text-[#1C1326] tracking-tight block truncate">
            {stats.periodStatus}
          </span>
          <span className="text-xs text-[#584B68] block mt-0.5">
            Next est: {stats.nextPeriodDate || 'Calculating...'}
          </span>
        </div>
      </div>
    </div>
  );
};
