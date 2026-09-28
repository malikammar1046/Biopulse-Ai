import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LifestyleEmptyStateProps {
  isMale?: boolean;
}

export const LifestyleEmptyState: React.FC<LifestyleEmptyStateProps> = ({ isMale = false }) => {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
      <div
        className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-xs ${
          isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-teal-50 text-[#0E9EAA]'
        }`}
      >
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display text-[#073B72]">
          Your lifestyle plan is getting ready
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Complete your latest screening and basic health profile to unlock personalized guidance,
          metabolic targets, and evidence-grounded habits.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/app/screening"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-xs transition-colors ${
            isMale ? 'bg-[#0868B9] hover:bg-[#073B72]' : 'bg-[#0E9EAA] hover:bg-[#073B72]'
          }`}
        >
          <span>Complete Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/app/profile"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#073B72] bg-white border border-[#D7EAF2] hover:bg-[#F5FBFD] transition-colors"
        >
          <span>Update Profile</span>
        </Link>
      </div>
    </div>
  );
};
