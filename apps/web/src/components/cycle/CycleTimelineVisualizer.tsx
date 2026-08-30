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
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-6 select-none text-left">
      {/* Header with Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EAF5]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold font-display text-[#1C1326]">
              {currentMonthYear} Active Cycle Timeline
            </h2>
          </div>
          <p className="text-xs text-[#584B68]">
            Estimated phase progression based on your recorded {totalDays}-day cycle baseline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#EDE4F7] text-xs font-mono font-bold text-[#6E2D8B]">
            {totalDays}-Day Cycle
          </span>
        </div>
      </div>

      {/* Interactive Cycle Days Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#8D7E9E] font-mono">
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
                className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between items-center min-h-[78px] cursor-pointer text-center relative ${
                  isSelected
                    ? 'border-[#8E3EAF] ring-2 ring-[#8E3EAF]/40 bg-[#F2ECF7] shadow-sm scale-102 z-10'
                    : isCurrentDay
                    ? 'border-[#FB7185] ring-2 ring-[#FB7185]/30 bg-[#FFF5F7]'
                    : 'border-[#E7DFEF] bg-[#F8F5FA] hover:bg-white hover:border-[#D8B4FE]'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#1C1326]">
                    {day}
                  </span>
                  {isCurrentDay && (
                    <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-pulse" title="Today" />
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
        <div className={`p-5 rounded-2xl border transition-all ${activeDayPhase.cardColor} space-y-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${activeDayPhase.badgeColor}`}>
                {selectedDay === currentDay ? `Today: Day ${selectedDay}` : `Day ${selectedDay}`}
              </span>
              <h3 className={`text-sm font-bold font-display ${activeDayPhase.textColor}`}>
                {activeDayPhase.displayName}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#8D7E9E]">
              Non-diagnostic estimate
            </span>
          </div>
          <p className="text-xs text-[#584B68] leading-relaxed">
            {activeDayPhase.guidance}
          </p>
        </div>
      )}

      {/* Phase Breakdown Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#F0EAF5] text-xs">
        <div className="p-3.5 rounded-2xl bg-[#FDF2F8] border border-[#FDA4AF]/40 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
            <span className="font-bold text-[#FB7185]">1. Menstrual Phase</span>
          </div>
          <p className="text-[11px] text-[#584B68]">
            Days 1–{periodDuration} • Uterine shedding, low baseline hormones
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#EDE4F7] border border-[#D8B4FE]/40 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8E3EAF]" />
            <span className="font-bold text-[#8E3EAF]">2. Follicular Phase</span>
          </div>
          <p className="text-[11px] text-[#584B68]">
            Days {periodDuration + 1}–{Math.floor(totalDays / 2) - 1} • Rising estrogen & energy
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-[#C084FC]/40 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A21CAF]" />
            <span className="font-bold text-[#A21CAF]">3. Ovulation Window</span>
          </div>
          <p className="text-[11px] text-[#584B68]">
            Days {Math.floor(totalDays / 2)}–{Math.floor(totalDays / 2) + 1} • Estimated fertile window & LH peak
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6E2D8B]" />
            <span className="font-bold text-[#6E2D8B]">4. Luteal Phase</span>
          </div>
          <p className="text-[11px] text-[#584B68]">
            Days {Math.floor(totalDays / 2) + 2}–{totalDays} • Progesterone dominance
          </p>
        </div>
      </div>
    </div>
  );
};
