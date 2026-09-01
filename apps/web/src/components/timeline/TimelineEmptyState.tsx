import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Calendar, Activity, Utensils, RotateCcw } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

interface TimelineEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const TimelineEmptyState: React.FC<TimelineEmptyStateProps> = ({
  isFiltered,
  onResetFilters,
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-[36px] bg-white border border-dashed border-[#E7DFEF] text-center space-y-5 select-none">
      <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#EDE4F7] to-[#FAF5FF] border border-[#D8B4FE] text-[#6E2D8B] flex items-center justify-center mx-auto shadow-sm">
        <GitBranch className="w-7 h-7" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-base sm:text-lg font-bold font-display text-[#1C1326]">
          {isFiltered ? 'No Events Match Current Filters' : 'Your Health Story Is Getting Started'}
        </h3>
        <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
          {isFiltered
            ? 'Try widening your date range or selecting all categories to view earlier longitudinal milestones.'
            : 'Keep logging your cycle, symptoms, meals, movement, and medications. OvaSense will gradually build a clearer picture of your personal health patterns.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {isFiltered && onResetFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#6E2D8B] hover:bg-[#8E3EAF] transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        ) : (
          <>
            <Link
              to={ROUTES.APP.CYCLE}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#6E2D8B] bg-[#EDE4F7] hover:bg-[#E5D4F5] transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Log Cycle</span>
            </Link>

            <Link
              to={ROUTES.APP.SYMPTOMS}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Log Symptom</span>
            </Link>

            <Link
              to={ROUTES.APP.DIET}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#047857] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Log Food</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
