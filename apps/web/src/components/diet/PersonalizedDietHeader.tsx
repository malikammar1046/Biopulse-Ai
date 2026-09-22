import React from 'react';
import { Scales01, MessageChatCircle, Plus, AlertCircle, Calendar, ShieldTick, Sliders01 } from '@untitledui/icons';
import type { UserProfile } from '../../types/onboarding';
import { resolvePathway } from '../../types/onboarding';

interface PersonalizedDietHeaderProps {
  userProfile: UserProfile;
  cycleStageName?: string;
  symptomNotice?: string;
  onOpenLogFood: () => void;
  onOpenMealBuilder: () => void;
  onAskAi: () => void;
}

export const PersonalizedDietHeader: React.FC<PersonalizedDietHeaderProps> = ({
  userProfile,
  cycleStageName,
  symptomNotice,
  onOpenLogFood,
  onOpenMealBuilder,
  onAskAi,
}) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'there';

  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isFemale = pathway === 'female';

  const allergies = userProfile.medical?.allergies || [];
  const preference = userProfile.lifestyle?.dietaryPreference || 'Balanced';
  const goals = userProfile.goals?.selectedGoals || [];

  if (isFemale) {
    return (
      <div className="p-6 sm:p-7 rounded-2xl bg-white text-[#111318] shadow-xs border border-[#EAECF0] relative overflow-hidden select-none">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Greeting, Mission & Tags */}
          <div className="space-y-3.5 max-w-2xl text-left">
            {/* Trust & Mode Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#FDE6EF] text-[#DC326C] border border-[#F43F7D]/20">
                <Scales01 className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
                <span>Personalized Nutrition Companion</span>
              </span>

              {cycleStageName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#F8FAFC] text-[#344054] border border-[#EAECF0]">
                  <Calendar className="w-3 h-3 text-[#F43F7D]" aria-hidden="true" />
                  <span>{cycleStageName}</span>
                </span>
              )}
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111318]">
                {greeting}, {firstName}
              </h1>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed font-sans">
                Clinical food guidance and evidence-based nutrition that fits your routine.
              </p>
            </div>

            {/* Dynamic Profile Attributes */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#FAFAFC] text-[#344054] border border-[#EAECF0]">
                Diet: <strong className="text-[#111318] font-semibold">{preference}</strong>
              </span>

              {allergies.length > 0 && allergies[0] !== 'None' && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                  <ShieldTick className="w-3 h-3 text-rose-500" aria-hidden="true" />
                  <span>Filtered: {allergies.join(', ')}</span>
                </span>
              )}

              {goals.length > 0 && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#FAFAFC] text-[#344054] border border-[#EAECF0]">
                  Focus: {goals[0]}
                </span>
              )}
            </div>

            {/* Symptom Contextual Notice Pill */}
            {symptomNotice && (
              <div className="p-3 rounded-xl bg-[#FDE6EF]/40 border border-[#FDE6EF] flex items-start gap-2.5 text-[11px] text-[#DC326C] leading-snug">
                <AlertCircle className="w-4 h-4 text-[#DC326C] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{symptomNotice}</span>
              </div>
            )}
          </div>

          {/* Right Column: Quick Action CTA Group */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenLogFood}
              className="h-10 px-4 rounded-lg font-medium text-xs sm:text-sm text-white bg-[#F43F7D] hover:bg-[#DC326C] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>+ Log Food</span>
            </button>

            <button
              type="button"
              onClick={onOpenMealBuilder}
              className="h-10 px-4 rounded-lg font-medium text-xs sm:text-sm text-[#344054] bg-[#FAFAFC] hover:bg-[#F2F4F7] border border-[#EAECF0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <Sliders01 className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
              <span>Build My Meal</span>
            </button>

            <button
              type="button"
              onClick={onAskAi}
              className="h-9 px-4 rounded-lg text-[11px] font-mono text-[#F43F7D] hover:text-[#DC326C] transition-colors text-center cursor-pointer active:scale-[0.98] inline-flex items-center justify-center gap-1.5"
            >
              <MessageChatCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ask AI for food ideas</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-[#01579B] text-white shadow-md border border-[#0288D1] relative overflow-hidden select-none">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Mission & Tags */}
        <div className="space-y-3.5 max-w-2xl">
          {/* Trust & Mode Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#0288D1] text-white border border-[#29B6F6]/40">
              <Scales01 className="w-3.5 h-3.5 text-[#E0F2FE]" aria-hidden="true" />
              <span>Personalized Nutrition Companion</span>
            </span>

            {cycleStageName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/15 text-white border border-white/20">
                <Calendar className="w-3 h-3 text-[#29B6F6]" aria-hidden="true" />
                <span>{cycleStageName}</span>
              </span>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#E0F2FE] leading-relaxed font-sans">
              Clinical food guidance and evidence-based nutrition that fits your routine.
            </p>
          </div>

          {/* Dynamic Profile Attributes */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/15 text-white border border-white/20">
              Diet: <strong className="text-white font-semibold">{preference}</strong>
            </span>

            {allergies.length > 0 && allergies[0] !== 'None' && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-400/30 inline-flex items-center gap-1">
                <ShieldTick className="w-3 h-3 text-rose-300" aria-hidden="true" />
                <span>Filtered: {allergies.join(', ')}</span>
              </span>
            )}

            {goals.length > 0 && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/15 text-white border border-white/20">
                Focus: {goals[0]}
              </span>
            )}
          </div>

          {/* Symptom Contextual Notice Pill */}
          {symptomNotice && (
            <div className="p-3 rounded-xl bg-white/10 border border-white/20 flex items-start gap-2.5 text-[11px] text-[#E0F2FE] leading-snug">
              <AlertCircle className="w-4 h-4 text-[#29B6F6] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{symptomNotice}</span>
            </div>
          )}
        </div>

        {/* Right Column: Quick Action CTA Group */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenLogFood}
            className="px-5 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm text-[#0F172A] bg-[#29B6F6] hover:bg-[#4FC3F7] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#0F172A]" aria-hidden="true" />
            <span>+ Log Food</span>
          </button>

          <button
            type="button"
            onClick={onOpenMealBuilder}
            className="px-5 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm text-[#01579B] bg-white hover:bg-[#F0F9FF] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Sliders01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
            <span>Build My Meal</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-4 py-2 rounded-xl text-[11px] font-mono text-[#E0F2FE] hover:text-white transition-colors text-center inline-flex items-center justify-center gap-1.5"
          >
            <MessageChatCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ask AI for food ideas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
