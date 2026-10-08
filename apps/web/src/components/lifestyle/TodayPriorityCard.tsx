import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Flame,
} from 'lucide-react';
import type { RecommendationItem } from '../../types/lifestyle';

interface TodayPriorityCardProps {
  priorityRecommendation: RecommendationItem | null;
  onViewRecommendation: (rec: RecommendationItem) => void;
  onUpdateStatus?: (
    recommendationId: string,
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED'
  ) => void;
  isMale?: boolean;
}

export const TodayPriorityCard: React.FC<TodayPriorityCardProps> = ({
  priorityRecommendation,
  onViewRecommendation,
  onUpdateStatus,
  isMale = false,
}) => {
  const [showShapTooltip, setShowShapTooltip] = useState(false);

  if (!priorityRecommendation) {
    return null;
  }

  const isCompleted = priorityRecommendation.status === 'COMPLETED';

  return (
    <section
      aria-label="Today's Primary Lifestyle Focus"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073B72] via-[#094886] to-[#073B72] text-white p-7 sm:p-9 shadow-lg border border-[#D7EAF2]/20 transition-all duration-300"
    >
      {/* Ambient background glows */}
      <div
        className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isMale ? 'bg-[#2196E3]/20' : 'bg-[#F43F7D]/20'
        }`}
      />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-[#0E9EAA]/15" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
        <div className="space-y-4 max-w-3xl">
          {/* Header Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-[#16B8C4] border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#16B8C4]" />
              Today&apos;s Prime Anchor
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-slate-200 border border-white/10">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{priorityRecommendation.priority} Priority</span>
            </span>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-slate-200 border border-white/10 capitalize">
              {priorityRecommendation.category}
            </span>

            {priorityRecommendation.shap_priority_basis && (
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowShapTooltip(!showShapTooltip)}
                  onMouseEnter={() => setShowShapTooltip(true)}
                  onMouseLeave={() => setShowShapTooltip(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                  aria-label="Model-informed priority guidance"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16B8C4]" />
                  <span>Model-Informed</span>
                  <HelpCircle className="w-3 h-3 text-slate-300" />
                </button>

                {showShapTooltip && (
                  <div
                    role="tooltip"
                    className="absolute left-0 top-8 z-30 w-72 p-3.5 rounded-2xl bg-slate-900/95 text-white text-xs shadow-2xl leading-relaxed border border-white/15 backdrop-blur-md"
                  >
                    Prioritized based on your unique screening profile and biomarker patterns.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Title */}
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug font-display ${
              isCompleted ? 'text-emerald-200 line-through decoration-emerald-400/70' : 'text-white'
            }`}
          >
            {priorityRecommendation.title}
          </h2>

          {/* Actionable Description */}
          <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-2xl">
            {priorityRecommendation.action_summary}
          </p>

          {/* Clinical Rationale Box (Soft Glass) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-xs sm:text-sm text-slate-100/90 leading-relaxed max-w-2xl">
            <span className="font-bold text-[#16B8C4] block text-[11px] uppercase tracking-wider mb-0.5">
              Why this matters for your health:
            </span>
            {priorityRecommendation.why_this_is_recommended}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0 pt-2 lg:pt-0">
          {onUpdateStatus && (
            <button
              type="button"
              onClick={() =>
                onUpdateStatus(
                  priorityRecommendation.id,
                  isCompleted ? 'ACTIVE' : 'COMPLETED'
                )
              }
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-[#073B72]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Completed Today ✓' : 'Mark Completed'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewRecommendation(priorityRecommendation)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer"
          >
            <span>Explore Full Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
