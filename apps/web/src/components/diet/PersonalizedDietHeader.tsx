import React from 'react';
import { Utensils, Sparkles, Plus, AlertCircle, Heart, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../../types/onboarding';

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

  const allergies = userProfile.medical?.allergies || [];
  const preference = userProfile.lifestyle?.dietaryPreference || 'Balanced';
  const goals = userProfile.goals?.selectedGoals || [];

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-[#1E0B2E] via-[#2A103D] to-[#160724] text-white shadow-xl relative overflow-hidden select-none border border-white/10">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-[#8E3EAF]/30 to-[#E87084]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#6E2D8B]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Mission & Tags */}
        <div className="space-y-4 max-w-2xl">
          {/* Trust & Mode Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#6E2D8B]/40 text-[#E9D5FF] border border-[#8E3EAF]/30 backdrop-blur-md">
              <Utensils className="w-3.5 h-3.5 text-[#FDA4AF]" />
              <span>Personalized Nutrition Companion</span>
            </span>

            {cycleStageName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white border border-white/15 backdrop-blur-md">
                <Heart className="w-3 h-3 text-[#F43F5E]" />
                <span>{cycleStageName}</span>
              </span>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#D8CDE8] leading-relaxed font-sans">
              Simple food guidance that fits your body, routine and everyday life.
            </p>
          </div>

          {/* Dynamic Profile Attributes */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/10 text-[#F3E8FF] border border-white/10">
              Diet: <strong className="text-white font-semibold">{preference}</strong>
            </span>

            {allergies.length > 0 && allergies[0] !== 'None' && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#E11D48]/20 text-[#FECDD3] border border-[#E11D48]/30 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#FDA4AF]" />
                <span>Filtered: {allergies.join(', ')}</span>
              </span>
            )}

            {goals.length > 0 && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#8E3EAF]/30 text-[#E9D5FF] border border-[#8E3EAF]/30">
                Focus: {goals[0]}
              </span>
            )}
          </div>

          {/* Symptom Contextual Notice Pill */}
          {symptomNotice && (
            <div className="p-3 rounded-2xl bg-white/10 border border-[#FBCFE8]/20 backdrop-blur-md flex items-start gap-2.5 text-[11px] text-[#FDE8E8] leading-snug">
              <AlertCircle className="w-4 h-4 text-[#FDA4AF] shrink-0 mt-0.5" />
              <span>{symptomNotice}</span>
            </div>
          )}
        </div>

        {/* Right Column: Quick Action CTA Group */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenLogFood}
            className="px-5 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FDA4AF]" />
            <span>+ Log Food</span>
          </button>

          <button
            type="button"
            onClick={onOpenMealBuilder}
            className="px-5 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm text-[#1C1326] bg-white hover:bg-[#FAF5FF] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#8E3EAF]" />
            <span>Build My Meal</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-4 py-2 rounded-xl text-[11px] font-mono text-[#D8CDE8] hover:text-white transition-colors text-center"
          >
            ✨ Ask OvaSense AI for food ideas
          </button>
        </div>
      </div>
    </div>
  );
};
