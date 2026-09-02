import { TrendingUp, Award } from 'lucide-react';
import type { WeeklyAdherenceStats } from '../../types/medication';

interface WeeklyAdherenceWidgetProps {
  stats: WeeklyAdherenceStats;
}

export const WeeklyAdherenceWidget: React.FC<WeeklyAdherenceWidgetProps> = ({ stats }) => {
  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm select-none text-left space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F5F0FA]">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold font-display text-[#1C1326]">
              How Regularly You Took Your Medicine
            </h3>
            <p className="text-xs text-[#584B68]">
              {stats.adherencePercentage}% of scheduled doses taken this week
            </p>
          </div>
        </div>

        {/* Weekly Adherence Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-[#FAF5FF] to-[#FDF2F8] px-3.5 py-1.5 rounded-2xl border border-[#EDE4F7]">
          <Award className="w-4 h-4 text-[#8E3EAF]" />
          <span className="text-xs font-mono font-bold text-[#6E2D8B]">
            {stats.totalTakenThisWeek} / {stats.totalScheduledThisWeek} Doses
          </span>
        </div>
      </div>

      {/* 3 Overview Metric Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#8D7E9E] font-bold">
            Doses Taken
          </span>
          <span className="text-xl font-bold font-display text-[#15803D] block">
            {stats.totalTakenThisWeek}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#8D7E9E] font-bold">
            Doses Skipped
          </span>
          <span className="text-xl font-bold font-display text-[#B91C1C] block">
            {stats.totalSkippedThisWeek}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#8D7E9E] font-bold">
            Days Tracked
          </span>
          <span className="text-xl font-bold font-display text-[#6E2D8B] block">
            {stats.trackedDaysCount} <span className="text-xs font-mono font-normal text-[#8D7E9E]">/ 7</span>
          </span>
        </div>
      </div>

      {/* 7-Day Consistency Bars */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-[#1C1326]">
            7-Day Schedule History
          </span>
          <span className="text-xs font-mono text-[#8D7E9E]">
            Goal: 100% On-Time
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-4 pb-2 items-end h-32 border-b border-[#F5F0FA]">
          {stats.dailyBreakdown.map((day, idx) => {
            const dayPct =
              day.totalScheduled > 0
                ? Math.round((day.takenCount / day.totalScheduled) * 100)
                : 100;
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                {/* Bar */}
                <div className="w-full max-w-[28px] bg-[#F2ECF7] rounded-t-lg h-20 flex items-end justify-center overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${
                      day.takenCount > 0
                        ? isToday
                          ? 'bg-gradient-to-t from-[#6E2D8B] to-[#FB7185]'
                          : 'bg-gradient-to-t from-[#15803D] to-[#34D399]'
                        : day.skippedCount > 0
                        ? 'bg-[#F87171]'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(15, dayPct)}%` }}
                    title={`${day.dayName}: ${day.takenCount}/${day.totalScheduled} doses taken`}
                  />
                </div>

                {/* Day label */}
                <div className="text-center">
                  <span
                    className={`text-xs font-mono font-bold block ${
                      isToday ? 'text-[#6E2D8B]' : 'text-[#1C1326]'
                    }`}
                  >
                    {day.dayShort}
                  </span>
                  <span className="text-[10px] font-mono text-[#8D7E9E]">
                    {day.takenCount}/{day.totalScheduled}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Log Feed */}
      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-mono font-bold uppercase text-[#8D7E9E]">
          Recent Daily Breakdown
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {stats.dailyBreakdown.slice(0, 4).map((day, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between text-xs"
            >
              <span className="font-bold text-[#1C1326]">{day.dayName}</span>
              <div className="flex items-center gap-2">
                {day.doses.length > 0 ? (
                  day.doses.map((d, dIdx) => (
                    <span
                      key={dIdx}
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium ${
                        d.status === 'taken'
                          ? 'text-[#15803D]'
                          : d.status === 'skipped'
                          ? 'text-[#B91C1C]'
                          : 'text-[#8D7E9E]'
                      }`}
                    >
                      {d.status === 'taken' ? '✓' : d.status === 'skipped' ? '—' : '○'} {d.medicationName.split(' ')[0]}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#8D7E9E] font-mono">No doses</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
