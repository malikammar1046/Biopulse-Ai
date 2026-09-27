import React, { useState } from 'react';
import { Sparkles, ArrowRight, TrendingUp, HelpCircle, ShieldCheck } from 'lucide-react';
import type { RecommendationItem } from '../../types/lifestyle';

interface TodayPriorityCardProps {
  priorityRecommendation: RecommendationItem | null;
  onViewRecommendation: (rec: RecommendationItem) => void;
  isMale?: boolean;
}

export const TodayPriorityCard: React.FC<TodayPriorityCardProps> = ({
  priorityRecommendation,
  onViewRecommendation,
  isMale = false,
}) => {
  const [showShapTooltip, setShowShapTooltip] = useState(false);

  if (!priorityRecommendation) {
    return null;
  }

  return (
    <section
      aria-label="Today's Priority Recommendation"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073B72] via-[#0B4A8B] to-[#073B72] text-white p-6 sm:p-8 shadow-lg border border-[#D7EAF2]/20"
    >
      {/* Subtle organic light accent */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${
          isMale ? 'bg-[#2196E3]/15' : 'bg-[#F43F7D]/15'
        }`}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3.5 max-w-3xl">
          {/* Header Tag / Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-[#16B8C4] border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#16B8C4]" />
              Today&apos;s Priority
            </span>

            {/* Priority Chip */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white capitalize">
              {priorityRecommendation.priority} Priority
            </span>

            {/* Status Chip */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <TrendingUp className="w-3 h-3" />
              <span>{priorityRecommendation.status}</span>
            </span>

            {/* Model-Informed Priority Badge (SHAP boundary: strictly non-numeric) */}
            {priorityRecommendation.shap_priority_basis && (
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowShapTooltip(!showShapTooltip)}
                  onMouseEnter={() => setShowShapTooltip(true)}
                  onMouseLeave={() => setShowShapTooltip(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                  aria-label="Model-informed priority information"
                >
                  <ShieldCheck className="w-3 h-3 text-[#16B8C4]" />
                  <span>Model-informed priority</span>
                  <HelpCircle className="w-3 h-3 text-slate-300" />
                </button>

                {showShapTooltip && (
                  <div
                    role="tooltip"
                    className="absolute left-0 top-7 z-30 w-72 p-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl leading-relaxed border border-white/10"
                  >
                    Your screening model identified a related factor as important. SHAP explains
                    model behavior and does not represent a medical diagnosis.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Strong Action Title */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight font-display text-white">
            {priorityRecommendation.title}
          </h2>

          {/* Action sentence */}
          <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
            {priorityRecommendation.action_summary}
          </p>

          {/* Short rationale */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {priorityRecommendation.why_this_is_recommended}
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => onViewRecommendation(priorityRecommendation)}
            className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-md cursor-pointer ${
              isMale
                ? 'bg-[#2196E3] hover:bg-[#0868B9] text-white'
                : 'bg-[#16B8C4] hover:bg-[#0E9EAA] text-white'
            }`}
          >
            <span>View recommendation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
