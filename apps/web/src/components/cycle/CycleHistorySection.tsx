import React from 'react';
import { History, Droplet, Edit2, Trash2, Plus, MessageSquare } from 'lucide-react';
import type { CycleHistoryItem, CycleSummaryStats } from '../../types/cycle';

interface CycleHistorySectionProps {
  stats: CycleSummaryStats;
  onLogPeriod: () => void;
  onEdit: (item: CycleHistoryItem) => void;
  onDelete: (item: CycleHistoryItem) => void;
}

export const CycleHistorySection: React.FC<CycleHistorySectionProps> = ({
  stats,
  onLogPeriod,
  onEdit,
  onDelete,
}) => {
  const history = stats.history || [];

  if (history.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#BAE6FD] shadow-sm text-left space-y-4 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]">
              <History className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold font-display text-[#0F172A]">
              Cycle History
            </h2>
          </div>
        </div>

        <div className="p-8 rounded-xl bg-[#F8FAFC] border border-dashed border-[#BAE6FD] text-center space-y-3">
          <p className="text-sm font-semibold text-[#475569]">
            No cycle history recorded yet.
          </p>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Log your menstrual periods to build an accurate historical trend and track your cycle regularity.
          </p>
          <button
            type="button"
            onClick={onLogPeriod}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0288D1] text-white text-xs font-semibold shadow-sm hover:bg-[#0277BD] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Your First Period</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#BAE6FD] shadow-sm text-left space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]">
              <History className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold font-display text-[#0F172A]">
              Cycle History & Rhythm Records
            </h2>
          </div>
          <p className="text-xs text-[#64748B]">
            Chronological log of your recorded menstrual periods and calculated cycle lengths.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono font-bold text-[#475569]">
            {history.length} Record{history.length === 1 ? '' : 's'} Total
          </span>
          <button
            type="button"
            onClick={onLogPeriod}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Period</span>
          </button>
        </div>
      </div>

      {/* History Cards List */}
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BAE6FD] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left Info: Month & Dates */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold font-display text-[#0F172A]">
                  {item.monthYear}
                </span>
                {item.isLatest && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]">
                    Current Cycle
                  </span>
                )}
                <span className="text-xs text-[#64748B] font-mono">
                  • {item.startDateFormatted} – {item.endDateFormatted}
                </span>
              </div>

              {/* Badges & Metrics Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Cycle Length */}
                <span className="font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[#0F172A]">
                  Cycle: {item.cycleLengthDays ? `${item.cycleLengthDays} days` : 'Active / Baseline'}
                </span>

                {/* Period Duration */}
                <span className="font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] border border-[#FFE4E6]">
                  Period: {item.periodDurationDays} days
                </span>

                {/* Flow Badge */}
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD] capitalize flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-[#0288D1]" />
                  {item.flow} Flow
                </span>
              </div>

              {/* Symptoms Pills */}
              {item.symptoms && item.symptoms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {item.symptoms.map((sym, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[#475569]"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="flex items-start gap-1.5 pt-1 text-[11px] text-[#475569] italic">
                  <MessageSquare className="w-3 h-3 text-[#64748B] shrink-0 mt-0.5" />
                  <span>"{item.notes}"</span>
                </div>
              )}
            </div>

            {/* Right Actions: Edit / Delete */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0288D1] hover:bg-[#F0F9FF] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Edit period entry"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(item)}
                className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Delete period entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
