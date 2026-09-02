import React from 'react';
import { motion } from 'framer-motion';
import { Zap, MoreVertical } from 'lucide-react';

interface EnergyUsedBubbleCardProps {
  totalKcal?: number;
  dietKcal?: number;
  workoutKcal?: number;
  restingKcal?: number;
  runningPercent?: number;
  workoutsPercent?: number;
  walkingPercent?: number;
}

export const EnergyUsedBubbleCard: React.FC<EnergyUsedBubbleCardProps> = ({
  totalKcal = 4300,
  dietKcal = 2600,
  workoutKcal = 1200,
  restingKcal = 500,
  runningPercent = 45,
  workoutsPercent = 30,
  walkingPercent = 25,
}) => {
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
            <span className="p-2 rounded-2xl bg-[#F8F5FA] text-[#1C1326] border border-[#E7DFEF]">
              <Zap className="w-4 h-4 fill-current" />
            </span>
            <h3 className="text-base font-bold font-display text-[#1C1326]">
              Energy Used
            </h3>
          </div>
          <button
            type="button"
            className="text-[#8D7E9E] hover:text-[#1C1326] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Big Number & Percentage Tag */}
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#1C1326] tracking-tight">
            {formatKcal(totalKcal)}
          </span>
          <span className="text-xs font-sans text-[#736384] font-medium">
            kcal today
          </span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-mono font-bold">
            +5%
          </span>
        </div>
      </div>

      {/* ── Visual Centerpiece: Overlapping Venn Bubble Chart ── */}
      <div className="relative w-full h-56 sm:h-64 my-auto flex items-center justify-center">
        {/* Large Lavender/Purple Bubble */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="absolute left-4 sm:left-6 top-4 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-[#C084FC]/80 backdrop-blur-sm shadow-lg flex flex-col items-center justify-center text-white z-10 transition-transform cursor-pointer"
        >
          <span className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            {formatKcal(dietKcal)}
          </span>
          <span className="text-[11px] font-mono text-purple-100 uppercase tracking-wider">
            kcal
          </span>
        </motion.div>

        {/* Medium Dark Obsidian Bubble (Overlapping right) */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="absolute right-4 sm:right-6 top-8 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#180A26] shadow-xl flex flex-col items-center justify-center text-white z-20 transition-transform cursor-pointer border border-white/10"
        >
          <span className="text-xl sm:text-2xl font-extrabold font-display leading-tight">
            {formatKcal(workoutKcal)}
          </span>
          <span className="text-[11px] font-mono text-[#D8B4FE] uppercase tracking-wider">
            kcal
          </span>
        </motion.div>

        {/* Small Lime Accent Bubble (Overlapping bottom center) */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#BEF264] shadow-lg flex flex-col items-center justify-center text-[#1C1326] z-30 transition-transform cursor-pointer border-2 border-white"
        >
          <span className="text-lg sm:text-xl font-extrabold font-display leading-tight">
            {restingKcal}
          </span>
          <span className="text-[10px] font-mono font-bold text-[#365314] uppercase tracking-wider">
            kcal
          </span>
        </motion.div>
      </div>

      {/* ── Breakdown Progress Bars ── */}
      <div className="space-y-3 pt-2">
        {/* Row 1: Running */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="w-9 font-extrabold font-display text-sm text-[#1C1326]">
            {runningPercent}%
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#F3EEF9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C084FC]"
              style={{ width: `${runningPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 w-20 justify-end text-[#736384] text-xs font-medium">
            <span>Running</span>
            <span className="w-2 h-2 rounded-full bg-[#C084FC]" />
          </div>
        </div>

        {/* Row 2: Workouts */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="w-9 font-extrabold font-display text-sm text-[#1C1326]">
            {workoutsPercent}%
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#F3EEF9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#180A26]"
              style={{ width: `${workoutsPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 w-20 justify-end text-[#736384] text-xs font-medium">
            <span>Workouts</span>
            <span className="w-2 h-2 rounded-full bg-[#180A26]" />
          </div>
        </div>

        {/* Row 3: Walking */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="w-9 font-extrabold font-display text-sm text-[#1C1326]">
            {walkingPercent}%
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#F3EEF9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#BEF264]"
              style={{ width: `${walkingPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 w-20 justify-end text-[#736384] text-xs font-medium">
            <span>Walking</span>
            <span className="w-2 h-2 rounded-full bg-[#BEF264]" />
          </div>
        </div>
      </div>
    </div>
  );
};
