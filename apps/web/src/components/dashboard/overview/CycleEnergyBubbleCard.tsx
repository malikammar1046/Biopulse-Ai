import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MoreVertical } from 'lucide-react';

interface CycleEnergyBubbleCardProps {
  cycleDay?: number;
  totalCycleDays?: number | string;
  phaseName?: string;
  caloriesLogged?: number;
  caloriesTarget?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
}

export const CycleEnergyBubbleCard: React.FC<CycleEnergyBubbleCardProps> = ({
  cycleDay = 0,
  totalCycleDays = 28,
  phaseName = 'Not tracking cycle',
  caloriesLogged = 0,
  caloriesTarget = 2000,
  caloriesBurned = 0,
  activeMinutes = 0,
}) => {
  const hasCycle = cycleDay > 0;
  const numCycleDays = typeof totalCycleDays === 'number' ? totalCycleDays : 28;
  const cyclePercent = hasCycle ? Math.min(100, Math.round((cycleDay / numCycleDays) * 100)) : 0;
  const nutritionPercent = caloriesTarget > 0 ? Math.min(100, Math.round((caloriesLogged / caloriesTarget) * 100)) : 0;
  const fitnessPercent = Math.min(100, Math.round((activeMinutes / 60) * 100));

  const formatKcal = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return String(num);
  };

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between space-y-6 text-left select-none relative h-full">
      {/* ── Top Header & Stats ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#F8F5FA] text-[#6E2D8B] border border-[#E7DFEF]">
              <Sparkles className="w-4 h-4 fill-current" />
            </span>
            <div>
              <h3 className="text-base font-bold font-display text-[#1C1326]">
                Cycle & Energy Rhythm
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="text-[#8D7E9E] hover:text-[#1C1326] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Big Number & Subtitle */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#1C1326] tracking-tight">
              {hasCycle ? `Day ${cycleDay}` : 'Day —'}
            </span>
            <span className="text-xs font-sans text-[#736384] font-medium">
              {hasCycle ? `of ${totalCycleDays}d cycle` : 'log cycle in Cycle tab'}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold">
            {phaseName}
          </span>
        </div>
      </div>

      {/* ── Visual Centerpiece: Overlapping Venn Bubble Chart ── */}
      <div className="relative w-full h-56 sm:h-64 my-auto flex items-center justify-center">
        {/* Large Lavender/Purple Bubble: Cycle Day & Phase */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="absolute left-4 sm:left-6 top-4 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-[#C084FC]/85 backdrop-blur-sm shadow-lg flex flex-col items-center justify-center text-white z-10 transition-transform cursor-pointer"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-purple-100">
            Cycle
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            {hasCycle ? `Day ${cycleDay}` : 'Day —'}
          </span>
          <span className="text-[10px] font-sans text-purple-200">
            {hasCycle ? phaseName.split(' ')[0] : 'Not Set'}
          </span>
        </motion.div>

        {/* Medium Dark Obsidian Bubble: Nutrition Calories */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="absolute right-4 sm:right-6 top-8 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#180A26] shadow-xl flex flex-col items-center justify-center text-white z-20 transition-transform cursor-pointer border border-white/10"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-[#FDA4AF]">
            Intake
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-display leading-tight">
            {formatKcal(caloriesLogged)}
          </span>
          <span className="text-[10px] font-mono text-[#D8B4FE]">
            kcal today
          </span>
        </motion.div>

        {/* Small Lime Accent Bubble: Movement Burn */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#BEF264] shadow-lg flex flex-col items-center justify-center text-[#1C1326] z-30 transition-transform cursor-pointer border-2 border-white"
        >
          <span className="text-[9px] font-mono font-bold text-[#365314] uppercase tracking-wider">
            Burn
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-display leading-tight">
            {caloriesBurned}
          </span>
          <span className="text-[9px] font-mono font-bold text-[#365314]">
            kcal active
          </span>
        </motion.div>
      </div>

      {/* ── Breakdown Progress Bars ── */}
      <div className="space-y-3 pt-2">
        {/* Row 1: Cycle Progress */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="w-9 font-extrabold font-display text-sm text-[#1C1326]">
            {cyclePercent}%
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#F3EEF9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C084FC]"
              style={{ width: `${cyclePercent}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 w-24 justify-end text-[#736384] text-xs font-medium">
            <span>Cycle Prog.</span>
            <span className="w-2 h-2 rounded-full bg-[#C084FC]" />
          </div>
        </div>

        {/* Row 2: Nutrition Target */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="w-9 font-extrabold font-display text-sm text-[#1C1326]">
            {nutritionPercent}%
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#F3EEF9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#180A26]"
              style={{ width: `${nutritionPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 w-24 justify-end text-[#736384] text-xs font-medium">
            <span>Nutrition</span>
            <span className="w-2 h-2 rounded-full bg-[#180A26]" />
          </div>
        </div>

        {/* Row 3: Movement */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="w-9 font-extrabold font-display text-sm text-[#1C1326]">
            {fitnessPercent}%
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#F3EEF9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#BEF264]"
              style={{ width: `${fitnessPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 w-24 justify-end text-[#736384] text-xs font-medium">
            <span>Movement</span>
            <span className="w-2 h-2 rounded-full bg-[#BEF264]" />
          </div>
        </div>
      </div>
    </div>
  );
};
