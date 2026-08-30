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
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-left space-y-4 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <History className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold font-display text-[#1C1326]">
              Cycle History
            </h2>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center space-y-3">
          <p className="text-sm font-semibold text-[#584B68]">
            No cycle history recorded yet.
          </p>
          <p className="text-xs text-[#8D7E9E] max-w-sm mx-auto">
            Log your menstrual periods to build an accurate historical trend and track your cycle regularity.
          </p>
          <button
            type="button"
            onClick={onLogPeriod}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#6E2D8B] text-white text-xs font-bold shadow-xs hover:bg-[#8E3EAF] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Your First Period</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-left space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EAF5]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <History className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold font-display text-[#1C1326]">
              Cycle History & Rhythm Records
            </h2>
          </div>
          <p className="text-xs text-[#584B68]">
            Chronological log of your recorded menstrual periods and calculated cycle lengths.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-mono font-bold text-[#584B68]">
            {history.length} Record{history.length === 1 ? '' : 's'} Total
          </span>
          <button
            type="button"
            onClick={onLogPeriod}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6E2D8B] hover:bg-[#8E3EAF] text-white text-xs font-bold transition-colors cursor-pointer"
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
            className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] hover:border-[#D8B4FE] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left Info: Month & Dates */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold font-display text-[#1C1326]">
                  {item.monthYear}
                </span>
                {item.isLatest && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B]">
                    Current Cycle
                  </span>
                )}
                <span className="text-xs text-[#584B68] font-mono">
                  • {item.startDateFormatted} – {item.endDateFormatted}
                </span>
              </div>

              {/* Badges & Metrics Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Cycle Length */}
                <span className="font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#E7DFEF] text-[#1C1326]">
                  Cycle: {item.cycleLengthDays ? `${item.cycleLengthDays} days` : 'Active / Baseline'}
                </span>

                {/* Period Duration */}
                <span className="font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FDF2F8] text-[#FB7185]">
                  Period: {item.periodDurationDays} days
                </span>

                {/* Flow Badge */}
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EDE4F7] text-[#8E3EAF] capitalize flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-[#8E3EAF]" />
                  {item.flow} Flow
                </span>
              </div>

              {/* Symptoms Pills */}
              {item.symptoms && item.symptoms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {item.symptoms.map((sym, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E7DFEF] text-[#584B68]"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="flex items-start gap-1.5 pt-1 text-[11px] text-[#584B68] italic">
                  <MessageSquare className="w-3 h-3 text-[#8D7E9E] shrink-0 mt-0.5" />
                  <span>"{item.notes}"</span>
                </div>
              )}
            </div>

            {/* Right Actions: Edit / Delete */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-2 rounded-xl bg-white border border-[#E7DFEF] text-[#584B68] hover:text-[#6E2D8B] hover:bg-[#EDE4F7] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Edit period entry"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(item)}
                className="p-2 rounded-xl bg-white border border-[#E7DFEF] text-[#584B68] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
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
