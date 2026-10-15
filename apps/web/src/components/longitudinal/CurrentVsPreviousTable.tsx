import React, { useState, useMemo } from 'react';
import {
  InfoCircle,
  LineChartUp01,
  LineChartDown01,
  Minus,
  AlertCircle,
  CheckCircle,
  SearchLg,
  ShieldTick,
  LayersThree01,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { FactorComparisonItem } from '../../types/longitudinalHealth';

interface CurrentVsPreviousTableProps {
  pathway: HealthPathway;
  factors: FactorComparisonItem[];
  hasSingleAssessment?: boolean;
}

type CategoryFilter = 'all' | 'changed' | 'laboratory' | 'symptom' | 'anthropometric' | 'cycle';

export const CurrentVsPreviousTable: React.FC<CurrentVsPreviousTableProps> = ({
  pathway,
  factors = [],
  hasSingleAssessment = false,
}) => {
  const isMale = pathway === 'male';
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Category Counts
  const counts = useMemo(() => {
    const res = {
      all: factors.length,
      changed: factors.filter((f) => f.is_changed).length,
      laboratory: factors.filter((f) => f.category === 'laboratory').length,
      symptom: factors.filter((f) => f.category === 'symptom').length,
      anthropometric: factors.filter((f) => f.category === 'anthropometric').length,
      cycle: factors.filter((f) => f.category === 'cycle').length,
    };
    return res;
  }, [factors]);

  const filteredFactors = useMemo(() => {
    let list = factors || [];

    // Filter by tab
    if (activeTab === 'changed') {
      list = list.filter((f) => f.is_changed);
    } else if (activeTab !== 'all') {
      list = list.filter((f) => f.category === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.direction.toLowerCase().includes(q)
      );
    }

    return list;
  }, [factors, activeTab, searchQuery]);

  const getDirectionBadge = (item: FactorComparisonItem) => {
    switch (item.direction) {
      case 'increased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartUp01 className="w-3 h-3" aria-hidden="true" /> Increased
          </span>
        );
      case 'decreased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartDown01 className="w-3 h-3" aria-hidden="true" /> Decreased
          </span>
        );
      case 'newly_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            <AlertCircle className="w-3 h-3" aria-hidden="true" /> Newly Reported
          </span>
        );
      case 'no_longer_reported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
            <CheckCircle className="w-3 h-3 text-[#16A36A]" aria-hidden="true" /> Resolved
          </span>
        );
      case 'baseline_recorded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F8F9FC] text-[#475569] border border-[#EAECF0]">
            <InfoCircle className="w-3 h-3" aria-hidden="true" /> Baseline
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            <Minus className="w-3 h-3" aria-hidden="true" /> Stable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            {item.direction.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'laboratory':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Laboratory
          </span>
        );
      case 'symptom':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Symptom Log
          </span>
        );
      case 'anthropometric':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Anthropometric
          </span>
        );
      case 'cycle':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            Menstrual Cycle
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
            {category}
          </span>
        );
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
            <LayersThree01 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Current vs. Previous Factor Comparison Matrix
            </h2>
            <p className="text-xs text-[#667085] font-sans">
              Side-by-side progression breakdown across verified lab biomarkers, clinical symptoms, and body metrics.
            </p>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative self-start sm:self-center w-full sm:w-64">
          <SearchLg className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search factors..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[#F8F9FC] border border-[#EAECF0] text-[#111318] placeholder:text-[#98A2B3] focus:bg-white focus:outline-none focus:border-[#0288D1] focus:ring-2 focus:ring-[#0288D1]/10 transition-all font-sans"
          />
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
            activeTab === 'all'
              ? isMale
                ? 'bg-[#0288D1] text-white shadow-xs'
                : 'bg-[#F43F7D] text-white shadow-xs'
              : 'bg-[#F8F9FC] text-[#475467] hover:bg-[#F2F4F7] border border-[#EAECF0]'
          }`}
        >
          All Factors ({counts.all})
        </button>

        {!hasSingleAssessment && counts.changed > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('changed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
              activeTab === 'changed'
                ? isMale
                  ? 'bg-[#0288D1] text-white shadow-xs'
                : 'bg-[#F43F7D] text-white shadow-xs'
                : 'bg-[#F8F9FC] text-[#475467] hover:bg-[#F2F4F7] border border-[#EAECF0]'
            }`}
          >
            Changed Only ({counts.changed})
          </button>
        )}

        {counts.laboratory > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('laboratory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
              activeTab === 'laboratory'
                ? isMale
                  ? 'bg-[#0288D1] text-white shadow-xs'
                  : 'bg-[#F43F7D] text-white shadow-xs'
                : 'bg-[#F8F9FC] text-[#475467] hover:bg-[#F2F4F7] border border-[#EAECF0]'
            }`}
          >
            Labs & Bloodwork ({counts.laboratory})
          </button>
        )}

        {counts.symptom > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('symptom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
              activeTab === 'symptom'
                ? isMale
                  ? 'bg-[#0288D1] text-white shadow-xs'
                  : 'bg-[#F43F7D] text-white shadow-xs'
                : 'bg-[#F8F9FC] text-[#475467] hover:bg-[#F2F4F7] border border-[#EAECF0]'
            }`}
          >
            Symptoms ({counts.symptom})
          </button>
        )}

        {counts.anthropometric > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('anthropometric')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
              activeTab === 'anthropometric'
                ? isMale
                  ? 'bg-[#0288D1] text-white shadow-xs'
                  : 'bg-[#F43F7D] text-white shadow-xs'
                : 'bg-[#F8F9FC] text-[#475467] hover:bg-[#F2F4F7] border border-[#EAECF0]'
            }`}
          >
            Body & Vitals ({counts.anthropometric})
          </button>
        )}

        {!isMale && counts.cycle > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('cycle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
              activeTab === 'cycle'
                ? 'bg-[#F43F7D] text-white shadow-xs'
                : 'bg-[#F8F9FC] text-[#475467] hover:bg-[#F2F4F7] border border-[#EAECF0]'
            }`}
          >
            Menstrual Cycles ({counts.cycle})
          </button>
        )}
      </div>

      {/* ── Factor Table ── */}
      {filteredFactors.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] space-y-2">
          <InfoCircle className="w-6 h-6 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-sm font-semibold text-[#111318]">No Matching Factors Found</p>
          <p className="text-xs text-[#667085]">
            Try adjusting your search query or switching to another category tab.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< md screens) */}
          <div className="md:hidden space-y-3">
            {filteredFactors.map((f) => (
              <div
                key={f.factor_key}
                className="p-4 rounded-2xl border border-[#EAECF0] bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] space-y-3 text-left shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#111318]">
                      {f.label}
                      {f.unit && (
                        <span className="text-[10px] font-mono text-[#667085] ml-1">({f.unit})</span>
                      )}
                    </h4>
                    <div className="mt-1">{getCategoryBadge(f.category)}</div>
                  </div>
                  <div className="shrink-0">{getDirectionBadge(f)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#EAECF0]/80">
                  <div>
                    <span className="text-[10px] text-[#667085] uppercase font-mono block">
                      {hasSingleAssessment ? 'Status' : 'Previous Observation'}
                    </span>
                    <span className="font-mono text-[#475467] font-medium">
                      {hasSingleAssessment ? 'Benchmark Active' : f.previous_display || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#667085] uppercase font-mono block">
                      Current Reading
                    </span>
                    <span className="font-mono font-bold text-[#111318]">
                      {f.current_display}
                    </span>
                  </div>
                </div>

                {f.explanation && !hasSingleAssessment && (
                  <p className="text-[11px] text-[#475467] font-medium pt-1.5 border-t border-[#EAECF0]/80">
                    {f.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md screens) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-[#EAECF0] shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#EAECF0] text-[#667085] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Clinical Factor</th>
                  <th className="py-3.5 px-4 font-bold">Domain</th>
                  <th className="py-3.5 px-4 font-bold">
                    {hasSingleAssessment ? 'Status' : 'Previous Value'}
                  </th>
                  <th className="py-3.5 px-4 font-bold">Current Observed</th>
                  <th className="py-3.5 px-4 font-bold">Longitudinal Trajectory</th>
                  <th className="py-3.5 px-4 font-bold">Verification Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7] bg-white">
                {filteredFactors.map((f) => (
                  <tr
                    key={f.factor_key}
                    className="hover:bg-[#F9FAFB] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#111318]">
                      <div className="flex flex-col">
                        <span>{f.label}</span>
                        {f.unit && (
                          <span className="text-[10px] font-mono text-[#667085]">
                            Unit: {f.unit}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getCategoryBadge(f.category)}</td>

                    <td className="py-3.5 px-4 font-mono text-[#475467]">
                      {hasSingleAssessment ? (
                        <span className="text-[11px] text-[#98A2B3]">Reference Established</span>
                      ) : (
                        f.previous_display || '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#111318]">
                      {f.current_display}
                    </td>

                    <td className="py-3.5 px-4">{getDirectionBadge(f)}</td>

                    <td className="py-3.5 px-4">
                      {f.category === 'laboratory' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#027A48] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
                          <ShieldTick className="w-3 h-3 text-[#16A36A]" aria-hidden="true" /> Verified Lab
                        </span>
                      ) : f.category === 'cycle' ? (
                        <span className="text-[10px] font-mono text-[#F43F7D] bg-[#FDE6EF] px-2.5 py-0.5 rounded-full border border-[#FBCFE8]">
                          Cycle Tracker
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#667085] bg-[#F8F9FC] px-2.5 py-0.5 rounded-full border border-[#EAECF0]">
                          Clinical Intake
                        </span>
                      )}
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
