import React from 'react';
import { Calendar, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

interface CycleCompactCardProps {
  cycleDay?: number;
  totalCycleDays?: number | string;
  phaseName?: string;
  nextPeriodDays?: number;
}

export const CycleCompactCard: React.FC<CycleCompactCardProps> = ({
  cycleDay = 0,
  totalCycleDays = 28,
  phaseName = 'Not tracking cycle',
  nextPeriodDays = 0,
}) => {
  const hasCycle = cycleDay > 0;

  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between space-y-3 text-left select-none relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-[#FDF2F4] text-[#E87084] border border-[#FBCFE8]">
            <Calendar className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold font-display text-[#1C1326]">
            Cycle Rhythm
          </h3>
        </div>
        <Link
          to={ROUTES.APP.CYCLE}
          className="text-[#8D7E9E] hover:text-[#6E2D8B] p-1 rounded-lg transition-colors cursor-pointer"
          title="Open Cycle Tracker"
        >
          <MoreVertical className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#1C1326] tracking-tight">
              {hasCycle ? `Day ${cycleDay}` : 'Day —'}
            </span>
            <span className="text-xs font-sans text-[#736384] font-medium">
              / {totalCycleDays}d
            </span>
          </div>
          <span className="text-[11px] font-sans text-[#6E2D8B] font-semibold block">
            {phaseName}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-[#8D7E9E] block">Next Period</span>
          <span className="text-xs font-mono font-bold text-[#E87084]">
            {nextPeriodDays > 0 ? `in ${nextPeriodDays} days` : 'Tap to set'}
          </span>
        </div>
      </div>
    </div>
  );
};
