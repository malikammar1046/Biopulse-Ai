import React from 'react';
import { Activity, Edit3, Trash2, Calendar, Sparkles } from 'lucide-react';
import type { SymptomRecord } from '../../types/symptom';
import { CATEGORY_METADATA } from '../../types/symptom';
import { getRelativeDateLabel } from '../../utils/symptomCalculations';

interface SymptomRecentListProps {
  records: SymptomRecord[];
  onEdit: (record: SymptomRecord) => void;
  onDelete: (record: SymptomRecord) => void;
  onOpenLogModal: () => void;
}

export const SymptomRecentList: React.FC<SymptomRecentListProps> = ({
  records,
  onEdit,
  onDelete,
  onOpenLogModal,
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'mild':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Mild
          </span>
        );
      case 'severe':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Severe
          </span>
        );
      case 'moderate':
      default:
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
            Moderate
          </span>
        );
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs text-center space-y-4 select-none">
        <div className="w-14 h-14 rounded-3xl bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] flex items-center justify-center mx-auto shadow-xs">
          <Activity className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-lg font-bold font-display text-[#0F172A]">
            Nothing logged yet
          </h3>
          <p className="text-xs text-[#64748B]">
            Your first check-in will start building your personal health timeline and reveal personal symptom rhythms over time.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLogModal}
          className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Log a Symptom</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left select-none">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-lg font-bold font-display text-[#0F172A]">
            Recent Symptoms
          </h3>
          <p className="text-xs text-[#64748B]">
            Your recorded body sensations and check-ins.
          </p>
        </div>
        <span className="text-xs font-mono text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
          {records.length} {records.length === 1 ? 'entry' : 'entries'} total
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {records.map((record) => {
          const categoryMeta = CATEGORY_METADATA[record.category] || CATEGORY_METADATA.other;
          const relativeDate = getRelativeDateLabel(record.occurredAt);

          return (
            <div
              key={record.id}
              className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] shadow-xs transition-all duration-200 flex flex-col justify-between gap-3 group"
            >
              {/* Top Row: Symptom Name & Severity */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#0F172A] font-display">
                      {record.symptomType}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${categoryMeta.badgeClass}`}
                    >
                      {categoryMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium text-[#0288D1]">
                      <Calendar className="w-3.5 h-3.5 text-[#0288D1]" />
                      {relativeDate} ({record.occurredAt})
                    </span>
                    {record.cycleDay && (
                      <span className="font-mono text-[11px] font-semibold text-[#0288D1] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#29B6F6]" />
                        Cycle Day {record.cycleDay}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">{getSeverityBadge(record.severity)}</div>
              </div>

              {/* Notes */}
              {record.notes && (
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] italic font-sans leading-relaxed">
                  "{record.notes}"
                </div>
              )}

              {/* Bottom Row: Actions */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  className="p-2 rounded-xl text-[#64748B] hover:text-[#0288D1] hover:bg-[#E0F2FE] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
                  title="Edit entry"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(record)}
                  className="p-2 rounded-xl text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
