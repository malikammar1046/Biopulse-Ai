import React from 'react';
import { Target, CheckCircle2, MessageSquareHeart, Sparkles } from 'lucide-react';
import type { HealthGoals } from '../../types/onboarding';
import { HEALTH_GOAL_OPTIONS } from '../../data/mockOnboardingData';

interface Step6Props {
  data: HealthGoals;
  onChange: (goals: HealthGoals) => void;
}

const SUPPORT_OPTIONS = [
  {
    id: 'gentle_nudges',
    label: 'Gentle Reminders',
    desc: 'Quiet reminders only when your period or daily log is due.',
  },
  {
    id: 'structured_weekly',
    label: 'Weekly Health Summary',
    desc: 'An easy-to-read summary of your week sent every Sunday.',
  },
  {
    id: 'daily_coaching',
    label: 'Daily Health Companion',
    desc: 'Helpful daily tips and morning check-ins from OvaSense.',
  },
];

export const Step6HealthGoals: React.FC<Step6Props> = ({ data, onChange }) => {
  const toggleGoal = (goalTitle: string) => {
    const list = [...data.selectedGoals];
    if (list.includes(goalTitle)) {
      onChange({ ...data, selectedGoals: list.filter((g) => g !== goalTitle) });
    } else {
      onChange({ ...data, selectedGoals: [...list, goalTitle] });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6E2D8B]/20 border border-[#8E3EAF]/40 text-xs font-mono text-[#FDA4AF] mb-1">
          <Target className="w-3.5 h-3.5 text-[#FB7185]" />
          <span>Intent & Focus</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          What would you like OvaSense to help with?
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          Select the priorities that matter most to you right now. You can adjust these anytime in your Settings.
        </p>
      </div>

      {/* 1. Health Goal Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HEALTH_GOAL_OPTIONS.map((goal) => {
          const isSelected = data.selectedGoals.includes(goal.title);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.title)}
              className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1C0D2E] to-[#140822] border-[#FB7185] shadow-lg scale-[1.01]'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-display text-white">{goal.title}</h3>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-[#FB7185] bg-[#FB7185] text-white'
                        : 'border-white/30'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-[#A797BD] font-sans leading-relaxed">{goal.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Support Preferences */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="w-4 h-4 text-[#C084FC]" />
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
            How would you like OvaSense to support you?
          </span>
        </div>

        <div className="space-y-2.5">
          {SUPPORT_OPTIONS.map((opt) => {
            const isSelected = data.supportPreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    supportPreference: opt.id as HealthGoals['supportPreference'],
                  })
                }
                className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#1C0D2E] border-[#C084FC] text-white shadow-sm'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className="text-[11px] text-[#A797BD]">{opt.desc}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#C084FC] bg-[#C084FC] text-white' : 'border-white/30'
                  }`}
                >
                  {isSelected && <Sparkles className="w-2.5 h-2.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
