import React from 'react';
import { TrendingUp, Award } from 'lucide-react';
import type { WeeklyFitnessStats } from '../../types/fitness';

interface WeeklyMovementWidgetProps {
  stats: WeeklyFitnessStats;
  todayMinutes: number;
}

export const WeeklyMovementWidget: React.FC<WeeklyMovementWidgetProps> = ({
  stats,
  todayMinutes,
}) => {
  const percentOfGoal = Math.min(
    100,
    Math.round((stats.totalMinutesThisWeek / stats.targetMinutesThisWeek) * 100)
  );

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
              Your Movement This Week
            </h3>
            <p className="text-xs text-[#584B68]">
              {todayMinutes} minutes today • {stats.totalMinutesThisWeek} minutes this week
            </p>
          </div>
        </div>

        {/* Weekly Goal Progress Tag */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-[#FAF5FF] to-[#FDF2F8] px-3.5 py-1.5 rounded-2xl border border-[#EDE4F7]">
          <Award className="w-4 h-4 text-[#8E3EAF]" />
          <span className="text-xs font-mono font-bold text-[#6E2D8B]">
            {percentOfGoal}% of 150m Goal
          </span>
        </div>
      </div>

      {/* 3 Quick Overview Metric Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#8D7E9E] font-bold">
            Total Minutes
          </span>
          <span className="text-xl font-bold font-display text-[#1C1326] block">
            {stats.totalMinutesThisWeek} <span className="text-xs font-mono font-normal text-[#8D7E9E]">min</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#8D7E9E] font-bold">
            Active Days
          </span>
          <span className="text-xl font-bold font-display text-[#6E2D8B] block">
            {stats.activeDaysCount} <span className="text-xs font-mono font-normal text-[#8D7E9E]">/ 7</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#8D7E9E] font-bold">
            Activities
          </span>
          <span className="text-xl font-bold font-display text-[#1C1326] block">
            {stats.totalActivitiesCount} <span className="text-xs font-mono font-normal text-[#8D7E9E]">sessions</span>
          </span>
        </div>
      </div>

      {/* 7-Day Pure CSS/SVG Bar Graph */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-[#1C1326]">
            7-Day Movement Consistency
          </span>
          <span className="text-xs font-mono text-[#8D7E9E]">
            Daily Target: ~22m
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-4 pb-2 items-end h-36 border-b border-[#F5F0FA]">
          {stats.dailySummaries.map((day, idx) => {
            const heightPercent = Math.max(10, Math.min(100, (day.totalMinutes / 45) * 100));
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                {/* Bar */}
                <div className="w-full max-w-[28px] bg-[#F2ECF7] rounded-t-lg h-24 flex items-end justify-center overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${
                      day.totalMinutes > 0
                        ? isToday
                          ? 'bg-gradient-to-t from-[#6E2D8B] to-[#FB7185]'
                          : 'bg-gradient-to-t from-[#8E3EAF] to-[#D8B4FE]'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${day.dayName}: ${day.totalMinutes} mins (${day.activityCount} activities)`}
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
                    {day.totalMinutes}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
