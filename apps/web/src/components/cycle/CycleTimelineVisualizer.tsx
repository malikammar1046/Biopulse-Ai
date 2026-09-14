import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { CycleSummaryStats } from '../../types/cycle';
import { getCyclePhase } from '../../utils/cycleCalculations';

interface CycleTimelineVisualizerProps {
  stats: CycleSummaryStats;
}

export const CycleTimelineVisualizer: React.FC<CycleTimelineVisualizerProps> = ({ stats }) => {
  const totalDays = stats.totalCycleDays || 28;
  const currentDay = stats.currentCycleDay;
  const periodDuration = stats.periodDuration || 5;

  const [selectedDay, setSelectedDay] = useState<number | null>(currentDay || 1);

  const cycleDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  const activeDayPhase = selectedDay
    ? getCyclePhase(selectedDay, totalDays, periodDuration)
    : stats.estimatedPhase || getCyclePhase(1, totalDays, periodDuration);

  const currentMonthYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#BAE6FD] shadow-sm space-y-6 select-none text-left">
      {/* Header with Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold font-display text-[#0F172A]">
              {currentMonthYear} Active Cycle Timeline
            </h2>
          </div>
          <p className="text-xs text-[#64748B]">
            Estimated phase progression based on your recorded {totalDays}-day cycle baseline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-xs font-mono font-bold text-[#0288D1]">
            {totalDays}-Day Cycle
          </span>
        </div>
      </div>

      {/* Interactive Cycle Days Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#64748B] font-mono">
          <span>Day 1</span>
          <span>Midpoint (Est. Ovulation)</span>
          <span>Day {totalDays}</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-14 gap-2 sm:gap-2.5">
          {cycleDays.map((day) => {
            const phase = getCyclePhase(day, totalDays, periodDuration);
            const isCurrentDay = day === currentDay;
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between items-center min-h-[78px] cursor-pointer text-center relative ${
                  isSelected
                    ? 'border-[#0288D1] ring-2 ring-[#0288D1]/40 bg-[#F0F9FF] shadow-sm scale-102 z-10'
                    : isCurrentDay
                    ? 'border-[#0288D1] ring-2 ring-[#0288D1]/30 bg-[#F0F9FF]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#BAE6FD]'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0F172A]">
                    {day}
                  </span>
                  {isCurrentDay && (
                    <span className="w-2 h-2 rounded-full bg-[#0288D1] animate-pulse" title="Today" />
                  )}
                </div>

                <div className="w-full pt-1.5">
                  <span
                    className={`text-[9px] font-mono font-semibold px-1 py-0.5 rounded-md block truncate ${phase.badgeColor}`}
                  >
                    {phase.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Box */}
      {activeDayPhase && (
        <div className={`p-5 rounded-xl border transition-all ${activeDayPhase.cardColor} space-y-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${activeDayPhase.badgeColor}`}>
                {selectedDay === currentDay ? `Today: Day ${selectedDay}` : `Day ${selectedDay}`}
              </span>
              <h3 className={`text-sm font-bold font-display ${activeDayPhase.textColor}`}>
                {activeDayPhase.displayName}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#64748B]">
              Non-diagnostic estimate
            </span>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            {activeDayPhase.guidance}
          </p>
        </div>
      )}

      {/* Phase Breakdown Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#E2E8F0] text-xs">
        <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FFE4E6] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
            <span className="font-bold text-[#E11D48]">1. Period (Menstrual Phase)</span>
          </div>
          <p className="text-[11px] text-[#475569]">
            Days 1–{periodDuration} • Period flow and resting baseline hormone levels
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0288D1]" />
            <span className="font-bold text-[#0288D1]">2. Follicular Phase (egg develops)</span>
          </div>
          <p className="text-[11px] text-[#475569]">
            Days {periodDuration + 1}–{Math.floor(totalDays / 2) - 1} • An egg matures as natural estrogen rises
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <span className="font-bold text-[#059669]">3. Ovulation (egg released)</span>
          </div>
          <p className="text-[11px] text-[#475569]">
            Days {Math.floor(totalDays / 2)}–{Math.floor(totalDays / 2) + 1} • Estimated peak fertile window
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
            <span className="font-bold text-[#0F172A]">4. Luteal Phase (after ovulation)</span>
          </div>
          <p className="text-[11px] text-[#475569]">
            Days {Math.floor(totalDays / 2) + 2}–{totalDays} • Progesterone supports steady energy
          </p>
        </div>
      </div>
    </div>
  );
};
