import React from 'react';
import { Calendar, DotsVertical } from '@untitledui/icons';
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
    <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-3 text-left select-none relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-bold font-display text-[#0F172A]">
            Cycle Rhythm
          </h3>
        </div>
        <Link
          to={ROUTES.APP.CYCLE}
          className="text-[#64748B] hover:text-[#0288D1] p-1 rounded-lg transition-colors cursor-pointer"
          title="Open Cycle Tracker"
          aria-label="Open Cycle Tracker"
        >
          <DotsVertical className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#0F172A] tracking-tight">
              {hasCycle ? `Day ${cycleDay}` : 'Day —'}
            </span>
            <span className="text-xs font-sans text-[#64748B] font-medium">
              / {totalCycleDays}d
            </span>
          </div>
          <span className="text-[11px] font-sans text-[#0288D1] font-semibold block">
            {phaseName}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-[#64748B] block">Next Period</span>
          <span className="text-xs font-mono font-bold text-[#0288D1]">
            {nextPeriodDays > 0 ? `in ${nextPeriodDays} days` : 'Tap to set'}
          </span>
        </div>
      </div>
    </div>
  );
};
