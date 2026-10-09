import React from 'react';
import { Check, Bell01, Calendar, MessageChatCircle } from '@untitledui/icons';
import type { UserProfile, HealthGoals } from '../../../../types/onboarding';
import { HEALTH_GOAL_OPTIONS, DEFAULT_MALE_HEALTH_GOAL_OPTIONS } from '../../../../data/mockOnboardingData';

interface GoalsTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
  isMale: boolean;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  draft,
  setDraft,
  isMale,
}) => {
  const goals = draft.goals || ({} as HealthGoals);
  const selectedGoals = goals.selectedGoals || [];
  const supportPreference = goals.supportPreference || 'gentle_nudges';

  const toggleGoal = (goalTitle: string) => {
    const list = [...selectedGoals];
    if (list.includes(goalTitle)) {
      setDraft((p) => ({
        ...p,
        goals: {
          ...p.goals,
          selectedGoals: list.filter((g) => g !== goalTitle),
        },
      }));
    } else {
      setDraft((p) => ({
        ...p,
        goals: {
          ...p.goals,
          selectedGoals: [...list, goalTitle],
        },
      }));
    }
  };

  // Dedicated pathway-isolated goals list
  const filteredGoalOptions = isMale ? DEFAULT_MALE_HEALTH_GOAL_OPTIONS : HEALTH_GOAL_OPTIONS;

  return (
    <div className="space-y-6">
      {/* 1. Primary Health Goals */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Primary Health Focus Areas</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized target outcomes that prioritize recommendations and AI insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredGoalOptions.map((goal) => {
            const isSelected = selectedGoals.includes(goal.title) || selectedGoals.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.title)}
                className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? isMale
                      ? 'bg-[#F0F9FF] border-[#0288D1] ring-1.5 ring-[#0288D1] shadow-xs'
                      : 'bg-[#FDE6EF] border-[#F43F7D] ring-1.5 ring-[#F43F7D] shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <span className={`text-xs leading-snug ${
                    isSelected
                      ? isMale ? 'font-bold text-[#01579B]' : 'font-bold text-[#BE185D]'
                      : 'font-medium text-slate-800'
                  }`}>
                    {goal.title}
                  </span>
                  <p className={`text-[10px] mt-0.5 ${
                    isSelected
                      ? isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'
                      : 'text-slate-500'
                  }`}>
                    {goal.desc}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                    isSelected
                      ? isMale
                        ? 'bg-[#0288D1] border-[#0288D1] text-white shadow-xs'
                        : 'bg-[#F43F7D] border-[#F43F7D] text-white shadow-xs'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BioPulse AI Coaching Cadence */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">BioPulse AI Support & Cadence</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose how proactively the AI companion nudges your tracking and habits
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'gentle_nudges',
              label: 'Gentle Nudges',
              icon: Bell01,
              desc: 'Subtle daily reminders for water, meals, and missed logs.',
            },
            {
              id: 'structured_weekly',
              label: 'Structured Weekly Check-in',
              icon: Calendar,
              desc: 'Comprehensive end-of-week health snapshot and trend analysis.',
            },
            {
              id: 'daily_coaching',
              label: 'Daily Active Coaching',
              icon: MessageChatCircle,
              desc: 'Proactive habit coaching, symptom correlation, and prompt suggestions.',
            },
          ].map((cadence) => {
            const isSelected = supportPreference === cadence.id;
            const Icon = cadence.icon;
            return (
              <button
                key={cadence.id}
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    goals: { ...p.goals, supportPreference: cadence.id as any },
                  }))
                }
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? isMale
                      ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs ring-1 ring-[#0288D1]/30'
                      : 'bg-[#F43F7D] text-white border-[#F43F7D] shadow-xs ring-1 ring-[#F43F7D]/30'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-white bg-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isMale ? 'bg-[#0288D1]' : 'bg-[#F43F7D]'}`} />
                    )}
                  </div>
                </div>
                <p className="text-xs font-bold mb-1">{cadence.label}</p>
                <p
                  className={`text-[10px] leading-snug ${
                    isSelected ? 'text-white/90' : 'text-slate-400'
                  }`}
                >
                  {cadence.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
