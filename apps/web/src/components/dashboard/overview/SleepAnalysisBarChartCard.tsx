import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, ChevronDown, Calendar } from 'lucide-react';

interface SleepAnalysisBarChartCardProps {
  efficiencyPercent?: number;
  durationHours?: number;
  durationMinutes?: number;
  currentCycleDay?: number;
  phaseName?: string;
}

export const SleepAnalysisBarChartCard: React.FC<SleepAnalysisBarChartCardProps> = ({
  efficiencyPercent = 85,
  durationHours = 7,
  durationMinutes = 15,
  currentCycleDay = 14,
  phaseName = 'Follicular',
}) => {
  const [filterMode, setFilterMode] = useState<'Monthly' | 'Weekly'>('Monthly');

  const monthsData = [
    { label: 'Jun', height: 48, isCurrent: false, cycleLen: '28d' },
    { label: 'Jul', height: 60, isCurrent: false, cycleLen: '29d' },
    { label: 'Aug', height: 42, isCurrent: false, cycleLen: '28d' },
    { label: 'Sept ↗', height: 95, isCurrent: true, efficiencyHeight: 88, durationHeight: 72, cycleLen: `Day ${currentCycleDay}` },
    { label: 'Oct', height: 50, isCurrent: false, cycleLen: '28d' },
    { label: 'Nov', height: 65, isCurrent: false, cycleLen: '28d' },
    { label: 'Dec', height: 55, isCurrent: false, cycleLen: '28d' },
  ];

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-[#180A26] border border-white/10 text-white shadow-xl flex flex-col justify-between space-y-6 text-left select-none relative h-full">
      {/* ── Top Header Row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-2xl bg-white/5 border border-white/10 text-[#FDA4AF]">
            <Moon className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Sleep & Hormone Recovery
            </h3>
          </div>
        </div>

        {/* Dropdown Filter Pill */}
        <button
          type="button"
          onClick={() => setFilterMode((prev) => (prev === 'Monthly' ? 'Weekly' : 'Monthly'))}
          className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-xs font-semibold text-[#EDE4F7] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>{filterMode}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#A797BD]" />
        </button>
      </div>

      {/* ── Sub-metrics Row ── */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        {/* Metric 1: Sleep Efficiency */}
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 rounded-full bg-[#BEF264] block shrink-0" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold font-display text-white">
                {efficiencyPercent}
              </span>
              <span className="text-xs font-display font-bold text-[#BEF264]">%</span>
            </div>
            <span className="text-[11px] text-[#A797BD] font-sans block">
              Sleep Efficiency
            </span>
          </div>
        </div>

        {/* Metric 2: Sleep Duration */}
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 rounded-full bg-[#C084FC] block shrink-0" />
          <div>
            <span className="text-xl sm:text-2xl font-extrabold font-display text-white block leading-tight">
              {durationHours}h {durationMinutes}m
            </span>
            <span className="text-[11px] text-[#A797BD] font-sans block">
              Sleep Duration
            </span>
          </div>
        </div>

        {/* Metric 3: Active Cycle Phase Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-[#FDA4AF] font-mono ml-auto">
          <Calendar className="w-3.5 h-3.5 text-[#FB7185]" />
          <span>{phaseName} (Day {currentCycleDay})</span>
        </div>
      </div>

      {/* ── Stylized Monthly Bar Chart ── */}
      <div className="pt-4">
        <div className="h-40 sm:h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {monthsData.map((item, idx) => {
            if (item.isCurrent) {
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-1 sm:gap-1.5 h-full justify-center w-full">
                    {/* Primary Lime Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${item.efficiencyHeight || 90}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="w-3 sm:w-4 rounded-full bg-[#BEF264] shadow-[0_0_12px_rgba(190,242,100,0.3)]"
                    />
                    {/* Secondary Lavender Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${item.durationHeight || 75}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="w-3 sm:w-4 rounded-full bg-[#C084FC] shadow-[0_0_12px_rgba(192,132,252,0.3)]"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-0.5">
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
                    className="w-full rounded-full bg-white/[0.07] border border-white/5 group-hover:bg-white/[0.12] transition-all relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px)',
                      }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#8D7E9E] group-hover:text-white transition-colors">
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
