import React from 'react';
import { Heart, Calendar, Droplets } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';
import type { CycleSummaryStats } from '../../../../types/cycle';

interface PeriodCycleModuleCardProps {
  cycleStats: CycleSummaryStats;
  loading?: boolean;
  onOpenCycle: () => void;
  onLogPeriod: () => void;
  updatedAt?: string | null;
}

export const PeriodCycleModuleCard: React.FC<PeriodCycleModuleCardProps> = ({
  cycleStats,
  loading = false,
  onOpenCycle,
  onLogPeriod,
  updatedAt = '12 mins ago',
}) => {
  const menuItems = [
    {
      label: 'Open Cycle Tracking',
      onClick: onOpenCycle,
      icon: Heart,
    },
    {
      label: 'Log New Period',
      onClick: onLogPeriod,
      icon: Droplets,
    },
  ];

  if (!cycleStats.hasData || cycleStats.currentCycleDay === null) {
    return (
      <DashboardModuleCard
        title="Period Cycle"
        subtitle="Current cycle information"
        icon={Droplets}
        accentColor="pink"
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title="No cycle history yet"
          description="Log your period dates to track your menstrual rhythm, fertile windows, and ovulation estimates."
          actionLabel="Add Cycle Data"
          onAction={onLogPeriod}
          icon={Droplets}
          accentColor="pink"
        />
      </DashboardModuleCard>
    );
  }

  const {
    currentCycleDay,
    totalCycleDays,
    nextPeriodDate,
    nextPeriodDays,
    estimatedPhase,
  } = cycleStats;

  return (
    <DashboardModuleCard
      title="Period Cycle"
      subtitle="Current cycle information"
      icon={Droplets}
      accentColor="pink"
      isLive={true}
      syncedModule="Cycle Tracking"
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="space-y-4 py-1">
        {/* Top 2 Metric Boxes */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {/* Current Cycle Day */}
          <div className="p-3 rounded-2xl bg-[#FFF5F8] border border-[#FDE6EF] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 font-sans">
              Current Cycle Day
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold font-display text-slate-900 leading-none">
                {currentCycleDay}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                of ~{totalCycleDays} days
              </span>
            </div>
            <div className="mt-2">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-white/80 border border-[#FDE6EF] text-[#E11D48] truncate max-w-full">
                {estimatedPhase?.tag || 'Active Cycle'}
              </span>
            </div>
          </div>

          {/* Next Period (Predicted) */}
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 font-sans">
              Next Period (Predicted)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-lg bg-[#FDE6EF] flex items-center justify-center text-[#E11D48] shrink-0">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {nextPeriodDate || 'Pending next cycle'}
                </span>
                {nextPeriodDays !== null && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    In {nextPeriodDays} day{nextPeriodDays === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-sans">
              Calculated from logged history
            </div>
          </div>
        </div>

        {/* Phase Timeline Stepper */}
        <div className="pt-1">
          <div className="relative flex items-center justify-between px-1">
            {/* Timeline track line */}
            <div className="absolute left-3 right-3 top-2 h-0.5 bg-slate-200 -z-0" />

            {/* Step 1: Period */}
            <div className="relative z-10 flex flex-col items-center">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  estimatedPhase?.key === 'menstrual'
                    ? 'bg-[#F43F7D] border-white ring-2 ring-[#F43F7D]'
                    : 'bg-white border-[#F43F7D]'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-800 mt-1">
                Period
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                Days 1–5
              </span>
            </div>

            {/* Step 2: Fertile Window */}
            <div className="relative z-10 flex flex-col items-center">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  estimatedPhase?.key === 'follicular'
                    ? 'bg-[#10B981] border-white ring-2 ring-[#10B981]'
                    : 'bg-white border-[#10B981]'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-800 mt-1">
                Fertile Window
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                Days 10–15
              </span>
            </div>

            {/* Step 3: Ovulation */}
            <div className="relative z-10 flex flex-col items-center">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  estimatedPhase?.key === 'ovulation'
                    ? 'bg-[#8B5CF6] border-white ring-2 ring-[#8B5CF6]'
                    : 'bg-white border-[#8B5CF6]'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-800 mt-1">
                Ovulation
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                Day ~14
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
