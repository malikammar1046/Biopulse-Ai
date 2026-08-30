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
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]/60">
            Mild
          </span>
        );
      case 'severe':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] border border-[#FDA4AF]/60">
            Severe
          </span>
        );
      case 'moderate':
      default:
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EDE4F7] text-[#8E3EAF] border border-[#D8B4FE]/60">
            Moderate
          </span>
        );
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-center space-y-4 select-none">
        <div className="w-14 h-14 rounded-3xl bg-[#FDF2F8] text-[#FB7185] flex items-center justify-center mx-auto shadow-xs">
          <Activity className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-lg font-bold font-display text-[#1C1326]">
            Nothing logged yet
          </h3>
          <p className="text-xs text-[#584B68]">
            Your first check-in will start building your personal health timeline and reveal personal symptom rhythms over time.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLogModal}
          className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md shadow-purple-950/20 transition-all cursor-pointer inline-flex items-center gap-2"
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
          <h3 className="text-lg font-bold font-display text-[#1C1326]">
            Recent Symptoms
          </h3>
          <p className="text-xs text-[#584B68]">
            Your recorded body sensations and check-ins.
          </p>
        </div>
        <span className="text-xs font-mono text-[#8D7E9E] bg-[#F8F5FA] px-3 py-1 rounded-full border border-[#E7DFEF]">
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
              className="p-5 rounded-3xl bg-white border border-[#E7DFEF] hover:border-[#8E3EAF]/30 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between gap-3 group"
            >
              {/* Top Row: Symptom Name & Severity */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#1C1326] font-display">
                      {record.symptomType}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${categoryMeta.badgeClass}`}
                    >
                      {categoryMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#584B68]">
                    <span className="flex items-center gap-1 font-medium text-[#6E2D8B]">
                      <Calendar className="w-3.5 h-3.5 text-[#8E3EAF]" />
                      {relativeDate} ({record.occurredAt})
                    </span>
                    {record.cycleDay && (
                      <span className="font-mono text-[11px] font-semibold text-[#8E3EAF] bg-[#EDE4F7] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#FB7185]" />
                        Cycle Day {record.cycleDay}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">{getSeverityBadge(record.severity)}</div>
              </div>

              {/* Notes */}
              {record.notes && (
                <div className="p-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF]/60 text-xs text-[#584B68] italic font-sans leading-relaxed">
                  "{record.notes}"
                </div>
              )}

              {/* Bottom Row: Actions */}
              <div className="pt-2 border-t border-[#F0EAF5] flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  className="p-2 rounded-xl text-[#584B68] hover:text-[#6E2D8B] hover:bg-[#EDE4F7] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
                  title="Edit entry"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(record)}
                  className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
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
