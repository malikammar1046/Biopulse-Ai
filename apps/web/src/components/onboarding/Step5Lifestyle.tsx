import React from 'react';
import { Utensils, Droplets, Dumbbell, Moon, Check, Pizza } from 'lucide-react';
import type { LifestyleProfile } from '../../types/onboarding';
import {
  DIETARY_PREFERENCE_OPTIONS,
  EXERCISE_PREFERENCE_OPTIONS,
} from '../../data/mockOnboardingData';

interface Step5Props {
  data: LifestyleProfile;
  onChange: (lifestyle: LifestyleProfile) => void;
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Mostly sitting (desk work)' },
  { id: 'light', label: 'Lightly Active', desc: '1–2 light walks per week' },
  { id: 'moderate', label: 'Moderately Active', desc: '3–4 workouts / active movement' },
  { id: 'very_active', label: 'Very Active', desc: '5+ intense sessions per week' },
];

const FAST_FOOD_OPTIONS = [
  { id: 'frequent', label: 'Frequent (3+ times/week)', desc: 'Regular takeout, processed snacks, or fried items' },
  { id: 'occasional', label: 'Occasional (1–2 times/week)', desc: 'Balanced with home-cooked meals' },
  { id: 'rare_never', label: 'Rare / Never', desc: 'Almost exclusively whole home-prepared foods' },
];

export const Step5Lifestyle: React.FC<Step5Props> = ({ data, onChange }) => {
  const toggleExercise = (label: string) => {
    const list = [...(data.exercisePreferences || [])];
    if (list.includes(label)) {
      onChange({ ...data, exercisePreferences: list.filter((e) => e !== label) });
    } else {
      onChange({ ...data, exercisePreferences: [...list, label] });
    }
  };

  const fastFoodIntake = data.fastFoodIntake || 'occasional';

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Daily Habits, Food & Movement
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          Your daily sleep, food, water, and movement habits play an important role in how you feel and your overall hormone balance.
        </p>
      </div>

      {/* 1. Dietary Preference */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-[#34D399]" />
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
            Primary Dietary Preference
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DIETARY_PREFERENCE_OPTIONS.map((diet) => {
            const isSelected = data.dietaryPreference === diet.label;
            return (
              <button
                key={diet.id}
                type="button"
                onClick={() => onChange({ ...data, dietaryPreference: diet.label })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1C0D2E] border-[#34D399] shadow-sm text-white'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{diet.label}</span>
                  <span className="text-[10px] text-[#A797BD]">{diet.desc}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#34D399]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Fast Food / Processed Intake (Used by ML Model) */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Pizza className="w-4 h-4 text-[#FB7185]" />
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
            Fast-Food & Processed Intake (Evaluated by ML Model)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FAST_FOOD_OPTIONS.map((opt) => {
            const isSelected = fastFoodIntake === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...data, fastFoodIntake: opt.id as any })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1C0D2E] border-[#FB7185] text-white shadow-sm scale-[1.02]'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold block">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FB7185] shrink-0" />}
                </div>
                <span className="text-[10px] text-[#A797BD] mt-1.5">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Water Intake & Sleep */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Water */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />
              Daily Water Target
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {data.dailyWaterGlasses} Glasses ({(data.dailyWaterGlasses * 0.25).toFixed(1)}L)
            </span>
          </div>

          <input
            type="range"
            min="4"
            max="16"
            value={data.dailyWaterGlasses}
            onChange={(e) => onChange({ ...data, dailyWaterGlasses: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-[#140924] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#A797BD]">
            <span>4 glasses (1L)</span>
            <span>8 glasses (2L)</span>
            <span>12+ glasses (3L+)</span>
          </div>
        </div>

        {/* Sleep */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-[#C084FC]" />
              Average Sleep
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {data.sleepHours} Hours / night
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="10"
            step="0.5"
            value={data.sleepHours}
            onChange={(e) => onChange({ ...data, sleepHours: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[#140924] rounded-lg appearance-none cursor-pointer accent-[#C084FC]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#A797BD]">
            <span>5 hrs</span>
            <span>7.5 hrs (Optimal)</span>
            <span>10 hrs</span>
          </div>
        </div>
      </div>

      {/* 4. Physical Activity Level */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-[#FDA4AF]" />
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
            Everyday Activity Baseline
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ACTIVITY_LEVELS.map((lvl) => {
            const isSelected = data.activityLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    activityLevel: lvl.id as LifestyleProfile['activityLevel'],
                    regularExercise: lvl.id === 'moderate' || lvl.id === 'very_active',
                  })
                }
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1C0D2E] border-[#FB7185] text-white shadow-sm scale-105'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                }`}
              >
                <span className="text-xs font-bold block">{lvl.label}</span>
                <span className="text-[9px] text-[#A797BD] mt-1">{lvl.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Exercise Preferences */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
            Movement Styles You Enjoy
          </span>
          <span className="text-[10px] font-mono text-[#A797BD]">Select all that apply</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXERCISE_PREFERENCE_OPTIONS.map((ex) => {
            const isSelected = (data.exercisePreferences || []).includes(ex.label);
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => toggleExercise(ex.label)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white shadow'
                    : 'bg-[#140924] border border-white/15 text-[#CDBDD8] hover:text-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{ex.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
