import React from 'react';
import { MedicalCross, Plus, MessageChatCircle, CheckCircle, ShieldTick } from '@untitledui/icons';
import type { TodayMedicationProgress, WeeklyAdherenceStats } from '../../types/medication';

interface PersonalizedMedicationsHeaderProps {
  todayProgress: TodayMedicationProgress;
  weeklyStats: WeeklyAdherenceStats;
  onOpenAddModal: () => void;
  onAskAi: () => void;
  isMale?: boolean;
}

export const PersonalizedMedicationsHeader: React.FC<PersonalizedMedicationsHeaderProps> = ({
  todayProgress,
  weeklyStats,
  onOpenAddModal,
  onAskAi,
  isMale,
}) => {
  const accentColor = !isMale ? '#F43F7D' : '#0288D1';
  const accentHover = !isMale ? '#DC326C' : '#0277BD';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white text-[#0F172A] shadow-xs relative overflow-hidden select-none border border-[#EAECF0] text-left">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Progress Bar & Adherence */}
        <div className="space-y-3.5 max-w-2xl flex-1">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold ${
                !isMale
                  ? 'bg-[#FDE6EF] text-[#DC326C] border border-[rgba(244,63,125,0.2)]'
                  : 'bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]'
              }`}
            >
              <MedicalCross
                className={`w-3.5 h-3.5 ${!isMale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
                aria-hidden="true"
              />
              <span>Medicine Schedule & Adherence</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-500" aria-hidden="true" />
              <span>{weeklyStats.adherencePercentage}% Adherent this week</span>
            </span>
          </div>

          {/* Today's Progress Bar */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#0F172A]">
              <span className="font-semibold">
                Today: <strong>{todayProgress.takenCount} of {todayProgress.totalScheduled} taken</strong>
              </span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  !isMale ? 'text-[#DC326C]' : 'text-[#0288D1]'
                }`}
              >
                {todayProgress.percentageTaken}% completed
              </span>
            </div>

            {/* Bar */}
            <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${todayProgress.percentageTaken}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>

            {/* Mini metrics row */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-[#64748B] pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
                <span>{todayProgress.takenCount} Taken</span>
              </span>

              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F79009]" />
                <span>{todayProgress.remainingCount} Remaining</span>
              </span>

              {todayProgress.skippedCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F04438]" />
                  <span>{todayProgress.skippedCount} Skipped</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="h-10 px-4 rounded-xl font-medium text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          >
            <Plus className="w-4 h-4 text-white" aria-hidden="true" />
            <span>+ Add medicine</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="h-10 px-4 rounded-xl font-medium text-sm text-[#0F172A] bg-[#FAFAFC] hover:bg-[#F2F4F7] border border-[#EAECF0] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <MessageChatCircle
              className={`w-4 h-4 ${!isMale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
              aria-hidden="true"
            />
            <span>Medicine Guidance</span>
          </button>

          <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-[10px] text-[#64748B] leading-tight flex items-center gap-1.5">
            <ShieldTick
              className={`w-3.5 h-3.5 shrink-0 ${!isMale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
              aria-hidden="true"
            />
            <span>Tracking only • Follow doctor’s instructions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
