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
  const isMale = userProfile.pathway === 'male' || userProfile.gender === 'male';
  const firstName = userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'there';
  const movementPreferences =
    userProfile.lifestyle?.exercisePreferences?.join(', ') || 'Walking, Yoga & Gentle Movement';

  if (!isMale) {
    return (
      <div className="p-6 sm:p-8 rounded-[24px] bg-white text-[#111318] shadow-xs relative overflow-hidden select-none border border-[#EAECF0] text-left">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Greeting, Cycle Context & Mission */}
          <div className="space-y-4 max-w-2xl">
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#FBE7F0] text-[#A92D61] border border-[#FCE1ED]">
                <Dumbbell className="w-3.5 h-3.5 text-[#E84A8A]" />
                <span>Cycle-Synced Movement</span>
              </span>

              {cycleDay > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#FFF5F9] text-[#A92D61] border border-[#FCE1ED]">
                  <Heart className="w-3.5 h-3.5 text-[#E84A8A]" />
                  <span>Day {cycleDay} • {cyclePhaseName}</span>
                </span>
              )}
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#111318]">
                Move in a way that feels right for you, {firstName}.
              </h1>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed font-sans">
                Low-stress movement suggestions that honor your daily energy and hormonal rhythms.
              </p>
            </div>

            {/* Profile Context Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#FAFAFC] text-[#344054] border border-[#EAECF0]">
                Preferred: <strong className="text-[#111318] font-semibold">{movementPreferences}</strong>
              </span>

              <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#FAFAFC] text-[#344054] border border-[#EAECF0]">
                Activity: <strong className="text-[#111318] capitalize">{userProfile.lifestyle?.activityLevel || 'Moderate'}</strong>
              </span>
            </div>

            {/* Today's Quick Summary Pill */}
            <div className="p-3.5 rounded-xl bg-[#FFF5F9] border border-[#FCE1ED] flex items-center justify-between gap-3 text-xs text-[#A92D61]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#E84A8A] shrink-0" />
                <span>
                  {todayMinutes > 0 ? (
                    <><strong>{todayMinutes} minutes</strong> logged today</>
                  ) : (
                    'No movement logged yet today'
                  )}
                </span>
              </div>

              <span className="font-mono text-[11px] text-[#A92D61] font-bold">
                {weeklyTotalMinutes} min this week
              </span>
            </div>
          </div>

          {/* Right Column: CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenLogModal}
              className="px-6 py-3 rounded-xl font-sans font-semibold text-xs sm:text-sm text-white bg-[#E84A8A] hover:bg-[#D93B7A] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Log Activity</span>
            </button>

            <button
              type="button"
              onClick={onAskAi}
              className="px-5 py-3 rounded-xl font-sans font-semibold text-xs sm:text-sm text-[#344054] bg-[#FAFAFC] hover:bg-[#F2F4F7] border border-[#EAECF0] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-[#E84A8A]" />
              <span>Movement Guidance</span>
            </button>

            <span className="text-[10px] font-mono text-[#98A2B3] text-center pt-1">
              🌱 Educational suggestions • Non-diagnostic
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-[#01579B] text-white shadow-sm relative overflow-hidden select-none border border-[#BAE6FD] text-left">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Cycle Context & Mission */}
        <div className="space-y-4 max-w-2xl">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/15 text-white border border-white/25">
              <Dumbbell className="w-3.5 h-3.5 text-[#BAE6FD]" />
              <span>{isMale ? 'Daily Vitality & Functional Movement' : 'Cycle-Synced Movement'}</span>
            </span>

            {!isMale && cycleDay > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/15 text-white border border-white/25">
                <Heart className="w-3.5 h-3.5 text-[#BAE6FD]" />
                <span>Day {cycleDay} • {cyclePhaseName}</span>
              </span>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Move in a way that feels right for you, {firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-sans">
              Low-stress movement suggestions that honor your daily energy and hormonal rhythms.
            </p>
          </div>

          {/* Profile Context Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/10 text-white border border-white/15">
              Preferred: <strong className="text-white font-semibold">{movementPreferences}</strong>
            </span>

            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/10 text-white border border-white/15">
              Activity: <strong className="text-white capitalize">{userProfile.lifestyle?.activityLevel || 'Moderate'}</strong>
            </span>
          </div>

          {/* Today's Quick Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-3 text-xs text-sky-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#BAE6FD] shrink-0" />
              <span>
                {todayMinutes > 0 ? (
                  <><strong>{todayMinutes} minutes</strong> logged today</>
                ) : (
                  'No movement logged yet today'
                )}
              </span>
            </div>

            <span className="font-mono text-[11px] text-[#BAE6FD] font-bold">
              {weeklyTotalMinutes} min this week
            </span>
          </div>
        </div>

        {/* Right Column: CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenLogModal}
            className="px-6 py-3.5 rounded-2xl font-sans font-bold text-xs sm:text-sm text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Log Activity</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-5 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm text-[#01579B] bg-white hover:bg-[#F0F9FF] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#0288D1]" />
            <span>Movement Guidance</span>
          </button>

          <span className="text-[10px] font-mono text-sky-200 text-center pt-1">
            🌱 Educational suggestions • Non-diagnostic
          </span>
        </div>
      </div>
    </div>
  );
};
