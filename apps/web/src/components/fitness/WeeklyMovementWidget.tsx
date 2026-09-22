import React from 'react';
import { LineChartUp01, Award01 } from '@untitledui/icons';
import type { WeeklyFitnessStats } from '../../types/fitness';

interface WeeklyMovementWidgetProps {
  stats: WeeklyFitnessStats;
  todayMinutes: number;
  isMale?: boolean;
}

export const WeeklyMovementWidget: React.FC<WeeklyMovementWidgetProps> = ({
  stats,
  todayMinutes,
  isMale,
}) => {
  const percentOfGoal = Math.min(
    100,
    Math.round((stats.totalMinutesThisWeek / stats.targetMinutesThisWeek) * 100)
  );
  const accentColor = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';

  return (
    <div className={`p-6 sm:p-7 rounded-2xl bg-white shadow-xs select-none text-left space-y-5 border ${
      isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAECF0]">
        <div className="flex items-center gap-2.5">
          <LineChartUp01 className={`w-5 h-5 shrink-0 ${accentColor}`} aria-hidden="true" />
          <div>
            <h3 className={`text-base font-bold font-display ${isMale ? 'text-[#01579B]' : 'text-[#0F172A]'}`}>
              Your Movement This Week
            </h3>
            <p className="text-xs text-[#64748B]">
              {todayMinutes} minutes today • {stats.totalMinutesThisWeek} minutes this week
            </p>
          </div>
        </div>

        {/* Weekly Goal Progress Tag */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border ${
          isMale
            ? 'bg-[#E0F2FE] border-[#BAE6FD]'
            : 'bg-[#FDE6EF] border-[rgba(244,63,125,0.2)]'
        }`}>
          <Award01 className={`w-4 h-4 ${accentColor}`} aria-hidden="true" />
          <span className={`text-xs font-mono font-bold ${isMale ? 'text-[#01579B]' : 'text-[#DC326C]'}`}>
            {percentOfGoal}% of 150m Goal
          </span>
        </div>
      </div>

      {/* 3 Quick Overview Metric Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">
            Total Minutes
          </span>
          <span className="text-xl font-bold font-display text-[#0F172A] block">
            {stats.totalMinutesThisWeek} <span className="text-xs font-mono font-normal text-[#64748B]">min</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">
            Active Days
          </span>
          <span className={`text-xl font-bold font-display block ${isMale ? 'text-[#0288D1]' : 'text-[#DC326C]'}`}>
            {stats.activeDaysCount} <span className="text-xs font-mono font-normal text-[#64748B]">/ 7</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">
            Activities
          </span>
          <span className="text-xl font-bold font-display text-[#0F172A] block">
            {stats.totalActivitiesCount} <span className="text-xs font-mono font-normal text-[#64748B]">sessions</span>
          </span>
        </div>
      </div>

      {/* 7-Day Pure CSS/SVG Bar Graph */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-[#0F172A]">
            7-Day Movement Consistency
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Daily Target: ~22m
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-4 pb-2 items-end h-36 border-b border-[#EAECF0]">
          {stats.dailySummaries.map((day, idx) => {
            const heightPercent = Math.max(10, Math.min(100, (day.totalMinutes / 45) * 100));
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                {/* Bar */}
                <div className={`w-full max-w-[28px] rounded-t-lg h-24 flex items-end justify-center overflow-hidden border ${
                  isMale ? 'bg-[#E2E8F0] border-transparent' : 'bg-[#FDE6EF]/30 border-[rgba(244,63,125,0.2)]'
                }`}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${
                      day.totalMinutes > 0
                        ? isToday
                          ? isMale ? 'bg-[#0288D1]' : 'bg-[#F43F7D]'
                          : isMale ? 'bg-[#38BDF8]' : 'bg-[#F43F7D]/70'
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
                      isToday ? (isMale ? 'text-[#0288D1]' : 'text-[#DC326C]') : 'text-[#0F172A]'
                    }`}
                  >
                    {day.dayShort}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B]">
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
