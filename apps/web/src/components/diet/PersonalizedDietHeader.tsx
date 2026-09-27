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
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isFemale = pathway === 'female';

  const allergies = userProfile.medical?.allergies || [];
  const preference = userProfile.lifestyle?.dietaryPreference || 'Balanced';
  const goals = userProfile.goals?.selectedGoals || [];

  const accentColor = isFemale ? '#F43F7D' : '#0288D1';
  const accentHover = isFemale ? '#DC326C' : '#0277BD';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white text-[#111318] shadow-xs border border-[#EAECF0] relative overflow-hidden select-none">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Context Badges & Profile Attributes */}
        <div className="space-y-3.5 max-w-2xl text-left flex-1">
          {/* Trust & Mode Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold ${
                isFemale
                  ? 'bg-[#FDE6EF] text-[#DC326C] border border-[#F43F7D]/20'
                  : 'bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]'
              }`}
            >
              <Scales01
                className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
                aria-hidden="true"
              />
              <span>Personalized Nutrition Companion</span>
            </span>

            {cycleStageName && isFemale && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#F8FAFC] text-[#344054] border border-[#EAECF0]">
                <Calendar className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
                <span>{cycleStageName}</span>
              </span>
            )}
          </div>

          {/* Dynamic Profile Attributes */}
          <div className="flex flex-wrap items-center gap-2">
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
            <div
              className={`p-3 rounded-xl flex items-start gap-2.5 text-[11px] leading-snug ${
                isFemale
                  ? 'bg-[#FDE6EF]/40 border border-[#FDE6EF] text-[#DC326C]'
                  : 'bg-[#F0F9FF] border border-[#BAE6FD] text-[#0288D1]'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isFemale ? 'text-[#DC326C]' : 'text-[#0288D1]'
                }`}
                aria-hidden="true"
              />
              <span>{symptomNotice}</span>
            </div>
          )}
        </div>

        {/* Right Column: Quick Action CTA Group */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLogFood}
            className="h-10 px-4 rounded-xl font-medium text-xs sm:text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          >
            <Plus className="w-4 h-4 text-white" aria-hidden="true" />
            <span>+ Log Food</span>
          </button>

          <button
            type="button"
            onClick={onOpenMealBuilder}
            className="h-10 px-4 rounded-xl font-medium text-xs sm:text-sm text-[#344054] bg-[#FAFAFC] hover:bg-[#F2F4F7] border border-[#EAECF0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Sliders01
              className={`w-4 h-4 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
              aria-hidden="true"
            />
            <span>Build My Meal</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className={`h-8 px-3 rounded-lg text-[11px] font-mono transition-colors text-center cursor-pointer active:scale-[0.98] inline-flex items-center justify-center gap-1.5 ${
              isFemale
                ? 'text-[#F43F7D] hover:text-[#DC326C]'
                : 'text-[#0288D1] hover:text-[#0277BD]'
            }`}
          >
            <MessageChatCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ask AI for food ideas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
