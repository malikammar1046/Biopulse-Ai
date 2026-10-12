import React from 'react';
import { Calendar, Clock, ActivityHeart, Compass01, AlertTriangle } from '@untitledui/icons';
import type { CycleSummaryStats } from '../../types/cycle';

interface CycleOverviewCardProps {
  stats: CycleSummaryStats;
}

export const CycleOverviewCard: React.FC<CycleOverviewCardProps> = ({ stats }) => {
  if (!stats.hasData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none text-left">
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

  const lengthSourceLabel = (() => {
    if (stats.cycleLengthSource === 'calculated_history') {
      return `Calculated Avg (${stats.completedCyclesCount} cycle${stats.completedCyclesCount === 1 ? '' : 's'})`;
    }
    if (stats.cycleLengthSource === 'profile_baseline') {
      return 'Profile Baseline';
    }
    return 'Initial Estimate';
  })();

  return (
    <div className="space-y-4 text-left">
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
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
                Day {stats.currentCycleDay}
              </span>
              {stats.isOverdue && (
                <span className="text-[11px] font-mono font-bold text-[#E11D48] bg-[#FFF1F2] border border-[#FECDD3] px-2 py-0.5 rounded-full">
                  +{stats.daysOverdue}d Late
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-[#F43F7D] flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${stats.isOverdue ? 'bg-[#E11D48]' : 'bg-[#F43F7D]'} animate-pulse`} />
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
              {stats.isOverdue ? 'Extended' : 'Estimate'}
            </span>
          </div>

          <div>
            <span className="text-2xl font-extrabold font-display text-[#F43F7D] tracking-tight block truncate">
              {stats.estimatedPhase?.name || 'Follicular Phase'}
            </span>
            <span className="text-xs text-[#475569] block mt-0.5 truncate">
              {stats.isOverdue
                ? `Extended by ${stats.daysOverdue} days past baseline`
                : stats.ovulation.status === 'irregular_uncertain'
                ? 'Approximate window (variable history)'
                : stats.estimatedPhase?.tag === 'Peak Fertile'
                ? 'Fertile window'
                : 'Hormone pattern window'}
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
            <span className="text-[10px] font-mono text-[#64748B] font-medium truncate max-w-[120px]" title={lengthSourceLabel}>
              {lengthSourceLabel}
            </span>
          </div>

          <div>
            <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
              {stats.totalCycleDays} days
            </span>
            <span className="text-xs text-[#475569] block mt-0.5">
              ~{stats.periodDuration} days average bleeding
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
            {stats.isOverdue ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
                Overdue
              </span>
            ) : stats.isCycleActive ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
                Active
              </span>
            ) : null}
          </div>

          <div>
            <span className={`text-lg font-bold font-display tracking-tight block truncate ${stats.isOverdue ? 'text-[#E11D48]' : 'text-[#0F172A]'}`}>
              {stats.periodStatus}
            </span>
            <span className="text-xs text-[#475569] block mt-0.5 truncate">
              {stats.isOverdue
                ? `Expected was: ${stats.nextPeriodDate}`
                : `Next est: ${stats.nextPeriodDate || 'Calculating...'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Irregularity or Overdue contextual notice */}
      {stats.isOverdue && (
        <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-start gap-2.5 text-xs text-[#9F1239]">
          <AlertTriangle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <span className="font-bold">Period is {stats.daysOverdue} days past the expected date ({stats.nextPeriodDate})</span>
            <p className="text-[11px] text-[#BE123C]">
              Cycles can fluctuate due to changes in routine, stress, medication, or polycystic ovarian morphology. Calendar estimates automatically expand to reflect your ongoing cycle.
            </p>
          </div>
        </div>
      )}

      {!stats.isOverdue && stats.regularityStatus === 'irregular' && (
        <div className="p-3.5 rounded-xl bg-[#FEF3C7]/50 border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <span className="font-bold">Cycle Variability Noted</span>
            <p className="text-[11px] text-[#B45309]">
              Your recorded cycle intervals have varied by 7 or more days. Calendar-based fertile windows and ovulation days are estimates and cannot be used as contraception or medical proof of ovulation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
