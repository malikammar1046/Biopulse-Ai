import React, { useState, useMemo } from 'react';
import {
  FilterLines,
  InfoCircle,
  LineChartUp01,
  LineChartDown01,
  Minus,
  AlertCircle,
  CheckCircle,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { FactorComparisonItem } from '../../types/longitudinalHealth';

interface CurrentVsPreviousTableProps {
  pathway: HealthPathway;
  factors: FactorComparisonItem[];
  hasSingleAssessment?: boolean;
}

export const CurrentVsPreviousTable: React.FC<CurrentVsPreviousTableProps> = ({
  pathway,
  factors,
  hasSingleAssessment = false,
}) => {
  const isMale = pathway === 'male';
  const [filterChangedOnly, setFilterChangedOnly] = useState<boolean>(false);

  const displayedFactors = useMemo(() => {
    if (!factors) return [];
    if (!filterChangedOnly) return factors;
    return factors.filter((f) => f.is_changed);
  }, [factors, filterChangedOnly]);

  const getDirectionBadge = (item: FactorComparisonItem) => {
    switch (item.direction) {
      case 'increased':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartUp01 className="w-3 h-3" aria-hidden="true" /> Increased
          </span>
        );
      case 'decreased':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartDown01 className="w-3 h-3" aria-hidden="true" /> Decreased
          </span>
        );
      case 'newly_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            <AlertCircle className="w-3 h-3" aria-hidden="true" /> Newly Reported
          </span>
        );
      case 'no_longer_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
            <CheckCircle className="w-3 h-3" aria-hidden="true" /> Resolved
          </span>
        );
      case 'baseline_recorded':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F8F9FC] text-[#475569] border border-[#EAECF0]">
            <InfoCircle className="w-3 h-3" aria-hidden="true" /> Baseline
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            <Minus className="w-3 h-3" aria-hidden="true" /> Stable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            {item.direction.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
      {/* ── Header & Filter Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
            Current vs. Previous Factor Comparison
          </h2>
          <p className="text-xs text-[#667085] mt-0.5 font-sans">
            Comprehensive side-by-side breakdown of all clinical metrics, labs, and symptom features.
          </p>
        </div>

        {!hasSingleAssessment && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setFilterChangedOnly(!filterChangedOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                filterChangedOnly
                  ? isMale
                    ? 'bg-[var(--color-medical-primary-hover,#0288D1)] text-white border-[var(--color-medical-primary-hover,#0288D1)]'
                    : 'bg-[#F43F7D] text-white border-[#F43F7D]'
                  : 'bg-[#F8F9FC] text-[#475569] border-[#EAECF0] hover:bg-[#F2F4F7]'
              }`}
            >
              <FilterLines className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{filterChangedOnly ? 'Showing Changed Only' : 'Show Changed Only'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Factor Table ── */}
      {displayedFactors.length === 0 ? (
        <div className="py-8 text-center rounded-xl bg-[#F8F9FC] border border-[#EAECF0] space-y-1">
          <InfoCircle className="w-5 h-5 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-xs text-[#667085]">
            No factors matched the selected filter.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Stacked Cards (< md) */}
          <div className="md:hidden space-y-2.5">
            {displayedFactors.map((f) => (
              <div
                key={f.factor_key}
                className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#FAFAFC] space-y-2 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#111318] truncate">
                      {f.label}
                      {f.unit && (
                        <span className="text-[10px] font-mono text-[#667085] ml-1">({f.unit})</span>
                      )}
                    </h4>
                    <span className="text-[10px] font-mono capitalize text-[#667085]">
                      {f.category}
                    </span>
                  </div>
                  <div className="shrink-0">{getDirectionBadge(f)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-[#F2F4F7]">
                  <div>
                    <span className="text-[10px] text-[#667085] uppercase font-mono block">
                      {hasSingleAssessment ? 'Status' : 'Previous'}
                    </span>
                    <span className="font-mono text-[#475569]">
                      {hasSingleAssessment ? '—' : f.previous_display}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667085] uppercase font-mono block">
                      {hasSingleAssessment ? 'Baseline Value' : 'Current Value'}
                    </span>
                    <span className="font-mono font-bold text-[#111318]">
                      {f.current_display}
                    </span>
                  </div>
                </div>

                {f.explanation && (
                  <p className="text-[11px] text-[#475569] leading-snug pt-1.5 border-t border-[#F2F4F7]">
                    {f.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View: Full Table (>= md) */}
          <div className="hidden md:block overflow-x-auto border border-[#EAECF0] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#EAECF0] text-[#667085] font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-4">Clinical Factor</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">{hasSingleAssessment ? 'Status' : 'Previous'}</th>
                  <th className="py-2.5 px-4">{hasSingleAssessment ? 'Baseline Value' : 'Current Value'}</th>
                  <th className="py-2.5 px-4">Change / State</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">Objective Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7]">
                {displayedFactors.map((f) => (
                  <tr key={f.factor_key} className="hover:bg-[#FAFAFC]">
                    <td className="py-3 px-4 font-semibold text-[#111318]">
                      {f.label}
                      {f.unit && (
                        <span className="text-[10px] font-mono text-[#667085] ml-1">({f.unit})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize text-[#667085] text-[11px] font-mono">
                      {f.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#667085]">
                      {hasSingleAssessment ? '—' : f.previous_display}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#111318]">
                      {f.current_display}
                    </td>
                    <td className="py-3 px-4">
                      {getDirectionBadge(f)}
                    </td>
                    <td className="py-3 px-4 text-[#475569] text-xs max-w-xs hidden md:table-cell">
                      {f.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentVsPreviousTable;
