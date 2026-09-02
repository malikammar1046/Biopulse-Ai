import React from 'react';
import { Dumbbell, Plus, Sparkles, Heart, Activity } from 'lucide-react';
import type { UserProfile } from '../../types/onboarding';

interface PersonalizedFitnessHeaderProps {
  userProfile: UserProfile;
  cycleDay: number;
  cyclePhaseName: string;
  todayMinutes: number;
  weeklyTotalMinutes: number;
  onOpenLogModal: () => void;
  onAskAi: () => void;
}

export const PersonalizedFitnessHeader: React.FC<PersonalizedFitnessHeaderProps> = ({
  userProfile,
  cycleDay,
  cyclePhaseName,
  todayMinutes,
  weeklyTotalMinutes,
  onOpenLogModal,
  onAskAi,
}) => {
  const firstName = userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'there';
  const movementPreferences =
    userProfile.lifestyle?.exercisePreferences?.join(', ') || 'Walking, Yoga & Gentle Movement';

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-[#1E0B2E] via-[#2A103D] to-[#160724] text-white shadow-xl relative overflow-hidden select-none border border-white/10 text-left">
      {/* Ambient Glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-[#8E3EAF]/30 to-[#FB7185]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#6E2D8B]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Cycle Context & Mission */}
        <div className="space-y-4 max-w-2xl">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#6E2D8B]/40 text-[#E9D5FF] border border-[#8E3EAF]/30 backdrop-blur-md">
              <Dumbbell className="w-3.5 h-3.5 text-[#FDA4AF]" />
              <span>Cycle-Synced Movement</span>
            </span>

            {cycleDay > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white border border-white/15 backdrop-blur-md">
                <Heart className="w-3 h-3 text-[#FB7185]" />
                <span>Day {cycleDay} • {cyclePhaseName}</span>
              </span>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Move in a way that feels right for you, {firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-[#D8CDE8] leading-relaxed font-sans">
              Low-stress movement suggestions that honor your daily energy and hormonal rhythms.
            </p>
          </div>

          {/* Profile Context Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/10 text-[#F3E8FF] border border-white/10">
              Preferred: <strong className="text-white font-semibold">{movementPreferences}</strong>
            </span>

            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#8E3EAF]/30 text-[#E9D5FF] border border-[#8E3EAF]/30">
              Activity: <strong className="text-white capitalize">{userProfile.lifestyle?.activityLevel || 'Moderate'}</strong>
            </span>
          </div>

          {/* Today's Quick Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-[#FBCFE8]/20 backdrop-blur-md flex items-center justify-between gap-3 text-xs text-[#FDE8E8]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FDA4AF] shrink-0" />
              <span>
                {todayMinutes > 0 ? (
                  <><strong>{todayMinutes} minutes</strong> logged today</>
                ) : (
                  'No movement logged yet today'
                )}
              </span>
            </div>

            <span className="font-mono text-[11px] text-[#FDA4AF] font-bold">
              {weeklyTotalMinutes} min this week
            </span>
          </div>
        </div>

        {/* Right Column: CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenLogModal}
            className="px-6 py-3.5 rounded-2xl font-sans font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Log Activity</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-5 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm text-[#1C1326] bg-white hover:bg-[#FAF5FF] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#8E3EAF]" />
            <span>Movement Guidance</span>
          </button>

          <span className="text-[10px] font-mono text-[#D8CDE8] text-center pt-1">
            🌱 Educational suggestions • Non-diagnostic
          </span>
        </div>
      </div>
    </div>
  );
};
