import React from 'react';
import { Sparkles, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { RecommendationItem } from '../../types/lifestyle';

interface StatusSummaryRowProps {
  recommendations: RecommendationItem[];
  isMale?: boolean;
}

export const StatusSummaryRow: React.FC<StatusSummaryRowProps> = ({
  recommendations,
  isMale = false,
}) => {
  // Count lifecycle states dynamically from data
  const counts = recommendations.reduce(
    (acc, rec) => {
      switch (rec.status) {
        case 'COMPLETED':
          acc.completed += 1;
          break;
        case 'SKIPPED':
          acc.skipped += 1;
          break;
        case 'ACTIVE':
          acc.active += 1;
          break;
        case 'IMPROVING':
          acc.improving += 1;
          break;
        case 'MAINTAIN':
          acc.maintain += 1;
          break;
        case 'REASSESS':
          acc.reassess += 1;
          break;
        case 'NEW':
        default:
          acc.new += 1;
          break;
      }
      return acc;
    },
    { completed: 0, skipped: 0, active: 0, improving: 0, maintain: 0, reassess: 0, new: 0 }
  );

  return (
    <div
      aria-label="Recommendation Lifecycle Summary"
      className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none"
    >
      <span className="text-xs font-semibold text-[#55718F] shrink-0 mr-1 hidden sm:inline">
        Protocol Status:
      </span>

      {/* Completed */}
      {counts.completed > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-semibold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>
            <strong>{counts.completed}</strong> Completed
          </span>
        </div>
      )}

      {/* Active */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 ${
          isMale
            ? 'bg-sky-50/80 text-sky-800 border-sky-200/80'
            : 'bg-teal-50/80 text-teal-800 border-teal-200/80'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#16B8C4]" />
        <span>
          <strong className="font-semibold">{counts.active}</strong> Active
        </span>
      </div>

      {/* Improving */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-medium shrink-0">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
        <span>
          <strong className="font-semibold">{counts.improving}</strong> Improving
        </span>
      </div>

      {/* Maintain */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/80 text-teal-800 text-xs font-medium shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
        <span>
          <strong className="font-semibold">{counts.maintain}</strong> Maintain
        </span>
      </div>

      {/* Reassess / Needs Review */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 ${
          counts.reassess > 0
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-slate-50 text-slate-600 border-slate-200'
        }`}
      >
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>
          <strong className="font-semibold">{counts.reassess}</strong> Reassess
        </span>
      </div>

      {/* New (if present) */}
      {counts.new > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>
            <strong className="font-semibold">{counts.new}</strong> New
          </span>
        </div>
      )}

      {/* Skipped (if present) */}
      {counts.skipped > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium shrink-0">
          <span>
            <strong>{counts.skipped}</strong> Skipped
          </span>
        </div>
      )}
    </div>
  );
};
