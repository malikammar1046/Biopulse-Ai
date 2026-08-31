import React from 'react';
import { Droplets, Plus, Minus } from 'lucide-react';
import type { WaterLogEntry } from '../../types/diet';

interface WaterTrackerWidgetProps {
  waterLog: WaterLogEntry;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const WaterTrackerWidget: React.FC<WaterTrackerWidgetProps> = ({
  waterLog,
  onIncrement,
  onDecrement,
}) => {
  const current = waterLog.glasses;
  const target = waterLog.targetGlasses || 8;
  const percentage = Math.min(100, Math.round((current / target) * 100));
  const liters = (current * 0.25).toFixed(2);
  const targetLiters = (target * 0.25).toFixed(1);

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-white to-[#F8F5FA] border border-[#E7DFEF] shadow-sm select-none text-left space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0284C7]">
            <Droplets className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold font-display text-[#1C1326]">
              Hydration & Water
            </h3>
            <span className="text-[11px] font-mono text-[#584B68]">
              Target: {target} glasses (~{targetLiters}L)
            </span>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-[#0284C7] bg-[#E0F2FE] px-3 py-1 rounded-full">
          {percentage}% Today
        </span>
      </div>

      {/* Main Glass Visualizer & Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold font-display text-[#1C1326] leading-none">
              {current}
            </span>
            <span className="text-sm font-mono text-[#8D7E9E] ml-1">
              / {target} glasses
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-[#0284C7]">
            {liters} Liters
          </span>
        </div>

        {/* Smooth Glass Progress Bar */}
        <div className="h-3.5 rounded-full bg-[#E0F2FE]/60 p-0.5 border border-[#BAE6FD] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#38BDF8] to-[#0284C7] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 8 Interactive Glass Icons */}
      <div className="grid grid-cols-8 gap-1 sm:gap-2">
        {Array.from({ length: target }).map((_, i) => {
          const isFilled = i < current;
          return (
            <div
              key={i}
              className={`h-10 rounded-xl flex items-center justify-center border transition-all ${
                isFilled
                  ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white border-[#0284C7] shadow-sm scale-100'
                  : 'bg-white/80 text-[#BAE6FD] border-[#E2E8F0]'
              }`}
            >
              <Droplets className={`w-4 h-4 ${isFilled ? 'fill-white text-white' : ''}`} />
            </div>
          );
        })}
      </div>

      {/* Interactive +/- Buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onDecrement}
          disabled={current <= 0}
          className="flex-1 py-2.5 rounded-2xl border border-[#E7DFEF] bg-white hover:bg-[#FAF5FF] disabled:opacity-40 text-xs font-bold text-[#584B68] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>-1 Glass</span>
        </button>

        <button
          type="button"
          onClick={onIncrement}
          className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-sky-950/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#BAE6FD]" />
          <span>+1 Glass</span>
        </button>
      </div>
    </div>
  );
};
