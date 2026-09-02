import React from 'react';
import { Activity, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

interface SymptomActivityCardProps {
  symptomsCount?: number;
  activeMinutes?: number;
  distanceKm?: number;
}

export const SymptomActivityCard: React.FC<SymptomActivityCardProps> = ({
  symptomsCount = 0,
  activeMinutes = 0,
  distanceKm = 0,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between space-y-3 text-left select-none relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
            <Activity className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold font-display text-[#1C1326]">
            Daily Activity
          </h3>
        </div>
        <Link
          to={ROUTES.APP.SYMPTOMS}
          className="text-[#8D7E9E] hover:text-[#16A34A] p-1 rounded-lg transition-colors cursor-pointer"
          title="Open Symptoms & Activity"
        >
          <MoreVertical className="w-4 h-4" />
        </Link>
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
          <span className="text-[10px] font-mono text-[#8D7E9E] block">
            {symptomsCount > 0 ? `${symptomsCount} Symptoms` : 'No Symptoms'}
          </span>
          <span className="text-xs font-mono font-bold text-[#1C1326]">
            {activeMinutes} Min Active
          </span>
        </div>
      </div>
    </div>
  );
};
