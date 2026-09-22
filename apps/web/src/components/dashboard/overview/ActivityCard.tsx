import React from 'react';
import { ActivityHeart, DotsVertical } from '@untitledui/icons';

interface ActivityCardProps {
  distanceKm?: number;
  activeMinutes?: number;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  distanceKm = 5.8,
  activeMinutes = 75,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-4 text-left select-none relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityHeart className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-bold font-display text-[#0F172A]">
            Activity
          </h3>
        </div>
        <button
          type="button"
          aria-label="Activity options"
          className="text-[#64748B] hover:text-[#0288D1] p-1 rounded-lg transition-colors cursor-pointer"
        >
          <DotsVertical className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#0F172A] tracking-tight">
            {distanceKm.toFixed(1).replace('.', ',')}
          </span>
          <span className="text-xs font-sans text-[#64748B] font-medium">
            km
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-[#64748B] block">Active</span>
          <span className="text-xs font-mono font-bold text-[#0F172A]">
            {activeMinutes} Min
          </span>
        </div>
      </div>
    </div>
  );
};
