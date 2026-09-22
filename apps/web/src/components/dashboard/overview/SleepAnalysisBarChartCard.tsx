import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon01, ChevronDown, Calendar, ShieldTick } from '@untitledui/icons';
import type { HealthPathway } from '../../../types/onboarding';

interface SleepAnalysisBarChartCardProps {
  efficiencyPercent?: number;
  durationHours?: number;
  durationMinutes?: number;
  currentCycleDay?: number;
  phaseName?: string;
  pathway?: HealthPathway;
}

export const SleepAnalysisBarChartCard: React.FC<SleepAnalysisBarChartCardProps> = ({
  efficiencyPercent = 85,
  durationHours = 7,
  durationMinutes = 15,
  currentCycleDay = 14,
  phaseName = 'Follicular',
  pathway = 'female',
}) => {
  const [filterMode, setFilterMode] = useState<'Monthly' | 'Weekly'>('Monthly');
  const isMale = pathway === 'male';

  const monthsData = [
    { label: 'Jun', height: 48, isCurrent: false, cycleLen: '28d' },
    { label: 'Jul', height: 60, isCurrent: false, cycleLen: '29d' },
    { label: 'Aug', height: 42, isCurrent: false, cycleLen: '28d' },
    { label: 'Sept ↗', height: 95, isCurrent: true, efficiencyHeight: 88, durationHeight: 72, cycleLen: isMale ? 'Target: 8h' : `Day ${currentCycleDay}` },
    { label: 'Oct', height: 50, isCurrent: false, cycleLen: '28d' },
    { label: 'Nov', height: 65, isCurrent: false, cycleLen: '28d' },
    { label: 'Dec', height: 55, isCurrent: false, cycleLen: '28d' },
  ];

  return (
    <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] text-[#0F172A] shadow-sm flex flex-col justify-between space-y-6 text-left select-none relative h-full">
      {/* ── Top Header Row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Moon01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              Sleep & Hormone Recovery
            </h3>
          </div>
        </div>

        {/* Dropdown Filter Pill */}
        <button
          type="button"
          onClick={() => setFilterMode((prev) => (prev === 'Monthly' ? 'Weekly' : 'Monthly'))}
          className="px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BAE6FD] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>{filterMode}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
        </button>
      </div>

      {/* ── Sub-metrics Row ── */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        {/* Metric 1: Sleep Efficiency */}
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 rounded-full bg-[#29B6F6] block shrink-0" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold font-display text-[#0F172A]">
                {efficiencyPercent}
              </span>
              <span className="text-xs font-display font-bold text-[#0288D1]">%</span>
            </div>
            <span className="text-[11px] text-[#64748B] font-sans block">
              Sleep Efficiency
            </span>
          </div>
        </div>

        {/* Metric 2: Sleep Duration */}
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 rounded-full bg-[#0288D1] block shrink-0" />
          <div>
            <span className="text-xl sm:text-2xl font-extrabold font-display text-[#0F172A] block leading-tight">
              {durationHours}h {durationMinutes}m
            </span>
            <span className="text-[11px] text-[#64748B] font-sans block">
              Sleep Duration
            </span>
          </div>
        </div>

        {/* Metric 3: Active Status Badge (Cycle Day for Female, Circadian Alignment for Male) */}
        {!isMale && currentCycleDay > 0 ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0288D1] font-mono ml-auto">
            <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>{phaseName} (Day {currentCycleDay})</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0288D1] font-mono ml-auto">
            <ShieldTick className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>{isMale ? 'Circadian Alignment' : 'Daily Recovery'}</span>
          </div>
        )}
      </div>

      {/* ── Stylized Monthly Bar Chart ── */}
      <div className="pt-4">
        <div className="h-40 sm:h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {monthsData.map((item, idx) => {
            if (item.isCurrent) {
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-1 sm:gap-1.5 h-full justify-center w-full">
                    {/* Primary Medical Blue Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${item.efficiencyHeight || 90}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="w-3 sm:w-4 rounded-full bg-[#29B6F6]"
                    />
                    {/* Secondary Deep Medical Blue Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${item.durationHeight || 75}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="w-3 sm:w-4 rounded-full bg-[#0288D1]"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0F172A] flex items-center gap-0.5">
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-4 sm:w-5 h-full flex items-end justify-center">
                  <div
                    style={{ height: `${item.height}%` }}
                    className="w-full rounded-full bg-[#F1F5F9] border border-[#E2E8F0] group-hover:bg-[#E2E8F0] transition-all relative overflow-hidden"
                  />
                </div>
                <span className="text-[11px] font-mono text-[#64748B] group-hover:text-[#0F172A] transition-colors">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
