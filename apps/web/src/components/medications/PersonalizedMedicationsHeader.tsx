import { Pill, Plus, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { TodayMedicationProgress, WeeklyAdherenceStats } from '../../types/medication';

interface PersonalizedMedicationsHeaderProps {
  todayProgress: TodayMedicationProgress;
  weeklyStats: WeeklyAdherenceStats;
  onOpenAddModal: () => void;
  onAskAi: () => void;
}

export const PersonalizedMedicationsHeader: React.FC<PersonalizedMedicationsHeaderProps> = ({
  todayProgress,
  weeklyStats,
  onOpenAddModal,
  onAskAi,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-[#1B0A2A] via-[#260E3A] to-[#140620] text-white shadow-xl relative overflow-hidden select-none border border-white/10 text-left">
      {/* Ambient Glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-[#FB7185]/20 to-[#8E3EAF]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#6E2D8B]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Heading, Progress Bar & Safety */}
        <div className="space-y-4 max-w-2xl flex-1">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#6E2D8B]/40 text-[#E9D5FF] border border-[#8E3EAF]/30 backdrop-blur-md">
              <Pill className="w-3.5 h-3.5 text-[#FDA4AF]" />
              <span>Medicine Schedule & Adherence</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white border border-white/15 backdrop-blur-md">
              <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
              <span>{weeklyStats.adherencePercentage}% Adherent this week</span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Your medicines
            </h1>
            <p className="text-xs sm:text-sm text-[#D8CDE8] leading-relaxed font-sans">
              Keep track of what you take and when — gentle reminders that fit your daily schedule.
            </p>
          </div>

          {/* Today's Progress Bar */}
          <div className="p-4 rounded-2xl bg-white/10 border border-[#FBCFE8]/20 backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#FDE8E8]">
              <span className="font-semibold">
                Today: <strong>{todayProgress.takenCount} of {todayProgress.totalScheduled} taken</strong>
              </span>
              <span className="font-mono text-[11px] font-bold text-[#FDA4AF]">
                {todayProgress.percentageTaken}% completed
              </span>
            </div>

            {/* Bar */}
            <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] rounded-full transition-all duration-700"
                style={{ width: `${todayProgress.percentageTaken}%` }}
              />
            </div>

            {/* Mini metrics row */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-[#D8CDE8] pt-1">
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
            className="px-6 py-3.5 rounded-2xl font-sans font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Add medicine</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-5 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm text-[#1C1326] bg-white hover:bg-[#FAF5FF] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#8E3EAF]" />
            <span>Medicine Guidance</span>
          </button>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#D8CDE8] leading-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FDA4AF] shrink-0" />
            <span>Tracking only • Follow your doctor’s instructions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
