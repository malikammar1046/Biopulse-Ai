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
    <div className="p-8 sm:p-12 rounded-2xl bg-white border border-dashed border-[#BAE6FD] text-center space-y-5 select-none">
      <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0288D1] flex items-center justify-center mx-auto shadow-none">
        <GitBranch className="w-6 h-6" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
          {isFiltered ? 'No Events Match Current Filters' : 'Your Health Story Is Getting Started'}
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          {isFiltered
            ? 'Try widening your date range or selecting all categories to view earlier longitudinal milestones.'
            : 'Keep logging your cycle, symptoms, meals, movement, and medications. BIOPulse AI will gradually build a clearer picture of your personal health patterns.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {isFiltered && onResetFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0288D1] hover:bg-[#0277BD] transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        ) : (
          <>
            <Link
              to={ROUTES.APP.CYCLE}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0288D1] bg-[#E0F2FE] hover:bg-[#BAE6FD] transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Log Cycle</span>
            </Link>

            <Link
              to={ROUTES.APP.SYMPTOMS}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0288D1] bg-[#E0F2FE] hover:bg-[#BAE6FD] transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Log Symptom</span>
            </Link>

            <Link
              to={ROUTES.APP.DIET}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0288D1] bg-[#E0F2FE] hover:bg-[#BAE6FD] transition-colors"
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
