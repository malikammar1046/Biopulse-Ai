import React from 'react';
import { Activity as ActivityIcon, MoreVertical } from 'lucide-react';

interface ActivityCardProps {
  distanceKm?: number;
  activeMinutes?: number;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  distanceKm = 5.8,
  activeMinutes = 75,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between space-y-4 text-left select-none relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-[#F8F5FA] text-[#1C1326] border border-[#E7DFEF]">
            <ActivityIcon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold font-display text-[#1C1326]">
            Activity
          </h3>
        </div>
        <button
          type="button"
          className="text-[#8D7E9E] hover:text-[#1C1326] p-1 rounded-lg transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#1C1326] tracking-tight">
            {distanceKm.toFixed(1).replace('.', ',')}
          </span>
          <span className="text-xs font-sans text-[#736384] font-medium">
            km
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-[#8D7E9E] block">Active</span>
          <span className="text-xs font-mono font-bold text-[#1C1326]">
            {activeMinutes} Min
          </span>
        </div>
      </div>
    </div>
  );
};
