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
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#BAE6FD] shadow-none select-none text-left space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
            <Droplets className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              Hydration & Water
            </h3>
            <span className="text-[11px] font-mono text-[#64748B]">
              Target: {target} glasses (~{targetLiters}L)
            </span>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-[#01579B] bg-[#E0F2FE] px-3 py-1 rounded-full">
          {percentage}% Today
        </span>
      </div>

      {/* Main Glass Visualizer & Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold text-[#0F172A] leading-none">
              {current}
            </span>
            <span className="text-sm font-mono text-[#64748B] ml-1">
              / {target} glasses
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-[#0288D1]">
            {liters} Liters
          </span>
        </div>

        {/* Smooth Glass Progress Bar */}
        <div className="h-3 rounded-full bg-[#E0F2FE] p-0.5 border border-[#BAE6FD] overflow-hidden">
          <div
            className="h-full bg-[#0288D1] rounded-full transition-all duration-500 ease-out"
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
                  ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs'
                  : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'
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
          className="flex-1 py-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 text-xs font-semibold text-[#64748B] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>-1 Glass</span>
        </button>

        <button
          type="button"
          onClick={onIncrement}
          className="flex-1 py-2 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-[#E0F2FE]" />
          <span>+1 Glass</span>
        </button>
      </div>
    </div>
  );
};
