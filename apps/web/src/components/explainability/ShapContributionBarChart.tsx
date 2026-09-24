import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PatientShapFactor } from '../../types/intelligence';

interface ShapContributionBarChartProps {
  factors: PatientShapFactor[];
  pathway?: string;
  onSelectFactor?: (factor: PatientShapFactor) => void;
  maxDisplay?: number;
}

export const ShapContributionBarChart: React.FC<ShapContributionBarChartProps> = ({
  factors,
  pathway = 'female_pcos',
  onSelectFactor,
  maxDisplay = 8,
}) => {
  const isFemale = pathway === 'female_pcos';
  const displayFactors = factors.slice(0, maxDisplay);

  if (!displayFactors.length) return null;

  const maxShare = Math.max(...displayFactors.map((f) => f.explanation_share_percent), 10);

  return (
    <div className="space-y-3">
      {displayFactors.map((factor) => {
        const isMixed = factor.fold_agreement?.stability === 'mixed';
        const isHigher = !isMixed && factor.direction === 'higher';
        const isLower = !isMixed && factor.direction === 'lower';
        const barWidthPct = Math.max(8, (factor.explanation_share_percent / maxShare) * 100);

        return (
          <div
            key={factor.feature_key}
            onClick={() => onSelectFactor?.(factor)}
            className="group p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 truncate pr-2">
                {isMixed ? (
                  <span className="w-3.5 h-3.5 shrink-0 text-amber-500 font-bold text-center">~</span>
                ) : isHigher ? (
                  <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${isFemale ? 'text-rose-500' : 'text-amber-500'}`} />
                ) : isLower ? (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0 text-slate-400">•</span>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {factor.patient_label}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                  ({factor.patient_value})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {factor.explanation_share_percent}%
                </span>
                <span
                  className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                    isMixed
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : factor.influence_level === 'strong'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                      : factor.influence_level === 'moderate'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isMixed ? 'Mixed' : factor.influence_level}
                </span>
              </div>
            </div>

            {/* Horizontal Bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isMixed
                    ? 'bg-amber-400 dark:bg-amber-500'
                    : isHigher
                    ? isFemale
                      ? 'bg-gradient-to-r from-rose-400 to-pink-500'
                      : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : isLower
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'bg-slate-400'
                }`}
                style={{ width: `${barWidthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
