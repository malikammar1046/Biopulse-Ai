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
  if (!isMale) {
    // ── Female Pathway: Clean Neutral Card with Pink Accents ──
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white text-[#0F172A] shadow-xs relative overflow-hidden select-none border border-[#EAECF0] text-left">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Heading, Progress Bar & Safety */}
          <div className="space-y-4 max-w-2xl flex-1">
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FDE6EF] text-[#DC326C] border border-[rgba(244,63,125,0.2)]">
                <MedicalCross className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
                <span>Medicine Schedule & Adherence</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                <span>{weeklyStats.adherencePercentage}% Adherent this week</span>
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#0F172A]">
                Your medicines
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
                Keep track of what you take and when — gentle reminders that fit your daily schedule.
              </p>
            </div>

            {/* Today's Progress Bar */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#0F172A]">
                <span className="font-semibold">
                  Today: <strong>{todayProgress.takenCount} of {todayProgress.totalScheduled} taken</strong>
                </span>
                <span className="font-mono text-[11px] font-bold text-[#DC326C]">
                  {todayProgress.percentageTaken}% completed
                </span>
              </div>

              {/* Bar */}
              <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F43F7D] rounded-full transition-all duration-700"
                  style={{ width: `${todayProgress.percentageTaken}%` }}
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
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="h-10 px-4 rounded-xl font-medium text-sm text-white bg-[#F43F7D] hover:bg-[#DC326C] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" aria-hidden="true" />
              <span>+ Add medicine</span>
            </button>

            <button
              type="button"
              onClick={onAskAi}
              className="h-10 px-4 rounded-xl font-medium text-sm text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#EAECF0] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageChatCircle className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
              <span>Medicine Guidance</span>
            </button>

            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-[10px] text-[#64748B] leading-tight flex items-center gap-2">
              <ShieldTick className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
              <span>Tracking only • Follow your doctor’s instructions</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Male Pathway: Retain Existing Blue Hero Design ──
  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-[#01579B] text-white shadow-sm relative overflow-hidden select-none border border-[#0288D1]/30 text-left">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Heading, Progress Bar & Safety */}
        <div className="space-y-4 max-w-2xl flex-1">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-[#E0F2FE] border border-white/20">
              <MedicalCross className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span>Medicine Schedule & Adherence</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white border border-white/20">
              <CheckCircle className="w-3 h-3 text-[#34D399]" aria-hidden="true" />
              <span>{weeklyStats.adherencePercentage}% Adherent this week</span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Your medicines
            </h1>
            <p className="text-xs sm:text-sm text-[#E0F2FE] leading-relaxed font-sans">
              Keep track of what you take and when — gentle reminders that fit your daily schedule.
            </p>
          </div>

          {/* Today's Progress Bar */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-white">
              <span className="font-semibold">
                Today: <strong>{todayProgress.takenCount} of {todayProgress.totalScheduled} taken</strong>
              </span>
              <span className="font-mono text-[11px] font-bold text-[#E0F2FE]">
                {todayProgress.percentageTaken}% completed
              </span>
            </div>

            {/* Bar */}
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#38BDF8] rounded-full transition-all duration-700"
                style={{ width: `${todayProgress.percentageTaken}%` }}
              />
            </div>

            {/* Mini metrics row */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-[#E0F2FE] pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                <span>{todayProgress.takenCount} Taken</span>
              </span>

              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                <span>{todayProgress.remainingCount} Remaining</span>
              </span>

              {todayProgress.skippedCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F87171]" />
                  <span>{todayProgress.skippedCount} Skipped</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-6 py-3.5 rounded-2xl font-sans font-semibold text-xs sm:text-sm text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" aria-hidden="true" />
            <span>+ Add medicine</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-5 py-3 rounded-2xl font-sans font-semibold text-xs sm:text-sm text-[#0F172A] bg-white hover:bg-[#F0F9FF] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageChatCircle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
            <span>Medicine Guidance</span>
          </button>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#E0F2FE] leading-tight flex items-center gap-2">
            <ShieldTick className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
            <span>Tracking only • Follow your doctor’s instructions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
