import React from 'react';
import { Sun, BatteryCharging } from 'lucide-react';

interface MaleHormoneRhythmCardProps {
  energyLevel?: string;
  sleepHours?: number;
}

export const MaleHormoneRhythmCard: React.FC<MaleHormoneRhythmCardProps> = ({
  energyLevel = 'moderate',
  sleepHours = 7.5,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm text-left select-none space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1]">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold font-display text-[#0F172A] block">
              Endocrine Rhythm
            </span>
            <span className="text-[10px] text-[#64748B] font-mono">
              Morning Peak: 7:00 AM – 10:00 AM
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
          Diurnal Cycle
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <span className="text-[10px] text-[#64748B] font-mono block uppercase">
            Stamina Status
          </span>
          <span className="text-sm font-bold text-[#0F172A] block capitalize">
            {energyLevel.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <span className="text-[10px] text-[#64748B] font-mono block uppercase">
            Night Rest
          </span>
          <span className="text-sm font-bold text-[#0F172A] block">
            {sleepHours}h Recovery
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#64748B] pt-1">
        <BatteryCharging className="w-3.5 h-3.5 text-[#0288D1]" />
        <span>Peak testosterone synthesis occurs during undisturbed deep REM sleep.</span>
      </div>
    </div>
  );
};

export default MaleHormoneRhythmCard;
