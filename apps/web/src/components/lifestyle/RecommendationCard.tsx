import React, { useState } from 'react';
import {
  Apple,
  Dumbbell,
  HeartPulse,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { RecommendationItem } from '../../types/lifestyle';

interface RecommendationCardProps {
  recommendation: RecommendationItem;
  onSelect: (rec: RecommendationItem) => void;
  isMale?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onSelect,
  isMale = false,
}) => {
  const [showShapTooltip, setShowShapTooltip] = useState(false);

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'nutrition':
        return <Apple className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />;
      case 'fitness':
        return <Dumbbell className="w-4 h-4 text-[#0868B9]" aria-hidden="true" />;
      case 'lifestyle':
        return <HeartPulse className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />;
      case 'clinical':
      default:
        return <Stethoscope className="w-4 h-4 text-[#55718F]" aria-hidden="true" />;
    }
  };

  // Status Styling Resolver (NEW / ACTIVE / IMPROVING / MAINTAIN / REASSESS)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IMPROVING':
        return {
          label: 'Improving',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          icon: <TrendingUp className="w-3 h-3 text-emerald-600" />,
        };
      case 'MAINTAIN':
        return {
          label: 'Maintain',
          className: 'bg-teal-50 text-teal-700 border-teal-200/80',
          icon: <CheckCircle2 className="w-3 h-3 text-teal-600" />,
        };
      case 'REASSESS':
        return {
          label: 'Reassess',
          className: 'bg-amber-50 text-amber-700 border-amber-200/80',
          icon: <Clock className="w-3 h-3 text-amber-600" />,
        };
      case 'ACTIVE':
        return {
          label: 'Active',
          className: isMale
            ? 'bg-sky-50 text-sky-700 border-sky-200/80'
            : 'bg-teal-50 text-teal-700 border-teal-200/80',
          icon: <Sparkles className="w-3 h-3 text-[#16B8C4]" />,
        };
      case 'NEW':
      default:
        return {
          label: 'New',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: null,
        };
    }
  };

  // Priority Styling Resolver
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'routine':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const statusBadge = getStatusBadge(recommendation.status);
  const priorityClass = getPriorityBadge(recommendation.priority);

  return (
    <article
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#D7EAF2] hover:border-[#16B8C4]/50 shadow-xs hover:shadow-md transition-all duration-200 p-5 sm:p-6"
      aria-labelledby={`rec-title-${recommendation.id}`}
    >
      <div className="space-y-4">
        {/* Card Header: Category & Priority & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5FBFD] border border-[#D7EAF2] text-xs font-semibold text-[#073B72] capitalize">
              {getCategoryIcon(recommendation.category)}
              <span>{recommendation.category}</span>
            </span>

            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${priorityClass}`}
            >
              {recommendation.priority} Priority
            </span>

            {/* Longitudinal Status Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}
            >
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </span>
          </div>

          {/* Model-Informed Priority Chip (Subtle SHAP Boundary) */}
          {recommendation.shap_priority_basis && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowShapTooltip(!showShapTooltip)}
                onMouseEnter={() => setShowShapTooltip(true)}
                onMouseLeave={() => setShowShapTooltip(false)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5FBFD] text-[#073B72] border border-[#D7EAF2] text-[10px] font-medium hover:bg-[#D7EAF2]/50 transition-colors cursor-pointer"
                aria-label="Model-informed priority explanation"
              >
                <span>Model-informed priority</span>
                <HelpCircle className="w-3 h-3 text-[#55718F]" />
              </button>

              {showShapTooltip && (
                <div
                  role="tooltip"
                  className="absolute right-0 top-7 z-30 w-64 p-2.5 rounded-xl bg-[#073B72] text-white text-xs shadow-lg leading-relaxed pointer-events-none"
                >
                  Your screening model identified a related factor as important. SHAP explains
                  model behavior and does not represent a medical diagnosis.
                </div>
              )}
            </div>
          )}
        </div>

        {/* WHAT: Title & Action Summary */}
        <div className="space-y-1.5">
          <h3
            id={`rec-title-${recommendation.id}`}
            className="text-base sm:text-lg font-bold text-[#073B72] leading-snug group-hover:text-[#0E9EAA] transition-colors"
          >
            {recommendation.title}
          </h3>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            {recommendation.action_summary}
          </p>
        </div>

        {/* WHY: Patient-Friendly Explanation */}
        <div className="p-3.5 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2]/70 text-xs text-[#55718F] space-y-1 leading-relaxed">
          <strong className="block text-xs font-semibold text-[#073B72]">
            Why you&apos;re seeing this
          </strong>
          <p>{recommendation.why_this_is_recommended}</p>
        </div>

        {/* HOW: Based on your data */}
        {recommendation.based_on_patient_data && recommendation.based_on_patient_data.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#55718F]">
              Based on your data
            </span>
            <div className="flex flex-wrap gap-1.5">
              {recommendation.based_on_patient_data.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-[#D7EAF2] text-[11px] font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Clinician Review Badge if applicable */}
        {recommendation.clinician_review && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-medium">
              Professional review suggested{' '}
              {recommendation.clinician_review_reason
                ? `(${recommendation.clinician_review_reason})`
                : ''}
            </span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-4 mt-4 border-t border-[#D7EAF2] flex items-center justify-between">
        <span className="text-xs text-[#55718F] font-normal truncate max-w-[200px]">
          {recommendation.longitudinal_basis}
        </span>

        <button
          type="button"
          onClick={() => onSelect(recommendation)}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isMale
              ? 'bg-[#0868B9]/10 text-[#0868B9] hover:bg-[#0868B9] hover:text-white'
              : 'bg-[#0E9EAA]/10 text-[#0E9EAA] hover:bg-[#0E9EAA] hover:text-white'
          }`}
          aria-label={`View full details for ${recommendation.title}`}
        >
          <span>View details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
