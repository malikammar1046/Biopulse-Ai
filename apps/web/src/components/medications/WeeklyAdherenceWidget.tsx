import React from 'react';
import { LineChartUp01, Award01 } from '@untitledui/icons';
import type { WeeklyAdherenceStats } from '../../types/medication';

interface WeeklyAdherenceWidgetProps {
  stats: WeeklyAdherenceStats;
  isMale?: boolean;
}

export const WeeklyAdherenceWidget: React.FC<WeeklyAdherenceWidgetProps> = ({ stats, isMale }) => {
  const accentColor = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';

  return (
    <div className={`p-6 sm:p-7 rounded-2xl bg-white shadow-xs select-none text-left space-y-5 border ${
      isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAECF0]">
        <div className="flex items-center gap-2.5">
          <LineChartUp01 className={`w-5 h-5 ${accentColor}`} aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              How Regularly You Took Your Medicine
            </h3>
            <p className="text-xs text-[#64748B]">
              {stats.adherencePercentage}% of scheduled doses taken this week
            </p>
          </div>
        </div>

        {/* Weekly Adherence Badge */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border ${
          isMale
            ? 'bg-[#F0F9FF] border-[#BAE6FD]'
            : 'bg-[#FDE6EF] border-[rgba(244,63,125,0.2)]'
        }`}>
          <Award01 className={`w-4 h-4 ${accentColor}`} aria-hidden="true" />
          <span className={`text-xs font-mono font-bold ${isMale ? 'text-[#0288D1]' : 'text-[#DC326C]'}`}>
            {stats.totalTakenThisWeek} / {stats.totalScheduledThisWeek} Doses
          </span>
        </div>
      </div>

      {/* 3 Overview Metric Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">
            Doses Taken
          </span>
          <span className="text-xl font-bold font-display text-[#15803D] block">
            {stats.totalTakenThisWeek}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">
            Doses Skipped
          </span>
          <span className="text-xl font-bold font-display text-[#DC2626] block">
            {stats.totalSkippedThisWeek}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">
            Days Tracked
          </span>
          <span className={`text-xl font-bold font-display block ${isMale ? 'text-[#0288D1]' : 'text-[#DC326C]'}`}>
            {stats.trackedDaysCount} <span className="text-xs font-mono font-normal text-[#64748B]">/ 7</span>
          </span>
        </div>
      </div>

      {/* 7-Day Consistency Bars */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-[#0F172A]">
            7-Day Schedule History
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Goal: 100% On-Time
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-4 pb-2 items-end h-32 border-b border-[#EAECF0]">
          {stats.dailyBreakdown.map((day, idx) => {
            const dayPct =
              day.totalScheduled > 0
                ? Math.round((day.takenCount / day.totalScheduled) * 100)
                : 100;
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                {/* Bar */}
                <div className={`w-full max-w-[28px] rounded-t-lg h-20 flex items-end justify-center overflow-hidden border ${
                  isMale ? 'bg-[#F0F9FF] border-[#BAE6FD]/40' : 'bg-[#FDE6EF]/30 border-[rgba(244,63,125,0.2)]'
                }`}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${
                      day.takenCount > 0
                        ? isToday
                          ? isMale ? 'bg-[#0288D1]' : 'bg-[#F43F7D]'
                          : 'bg-[#15803D]'
                        : day.skippedCount > 0
                        ? 'bg-[#DC2626]'
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
                      isToday ? (isMale ? 'text-[#0288D1]' : 'text-[#DC326C]') : 'text-[#0F172A]'
                    }`}
                  >
                    {day.dayShort}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B]">
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
        <h4 className="text-xs font-mono font-bold uppercase text-[#64748B]">
          Recent Daily Breakdown
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {stats.dailyBreakdown.slice(0, 4).map((day, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
            >
              <span className="font-bold text-[#0F172A]">{day.dayName}</span>
              <div className="flex items-center gap-2">
                {day.doses.length > 0 ? (
                  day.doses.map((d, dIdx) => (
                    <span
                      key={dIdx}
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium ${
                        d.status === 'taken'
                          ? 'text-[#15803D]'
                          : d.status === 'skipped'
                          ? 'text-[#DC2626]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {d.status === 'taken' ? '✓' : d.status === 'skipped' ? '—' : '○'} {d.medicationName.split(' ')[0]}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#64748B] font-mono">No doses</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
