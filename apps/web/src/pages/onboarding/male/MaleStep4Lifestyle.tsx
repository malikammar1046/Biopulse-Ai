import React, { useState } from 'react';
import {
  Activity,
  Moon01,
  ActivityHeart,
  Droplets01,
  Scales01,
} from '@untitledui/icons';
import type { LifestyleProfile } from '../../../types/onboarding';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';

interface MaleStep4Props {
  data: LifestyleProfile;
  onChange: (lifestyle: LifestyleProfile) => void;
}

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Desk job, minimal daily movement' },
  { key: 'light', label: 'Light', desc: 'Light walking or casual activities 1–2x/week' },
  { key: 'moderate', label: 'Moderate', desc: 'Consistent workouts 3–4 days/week' },
  { key: 'very_active', label: 'Very Active', desc: 'Heavy training, athletics or physical labor' },
] as const;

const EXERCISE_OPTIONS = [
  'Resistance Training',
  'Running / Cardio',
  'Walking / Hiking',
  'Sports / Cricket / Football',
  'Swimming',
  'Calisthenics',
];

const FAST_FOOD_OPTIONS = [
  { key: 'rare_never', label: 'Rare / Never', desc: 'Whole-food focused' },
  { key: 'occasional', label: 'Occasional', desc: '1–2 times per week' },
  { key: 'frequent', label: 'Frequent', desc: '3+ times per week' },
] as const;

export const MaleStep4Lifestyle: React.FC<MaleStep4Props> = ({ data, onChange }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const currentExercises = data.exercisePreferences || [];

  const toggleExercise = (ex: string) => {
    if (currentExercises.includes(ex)) {
      onChange({
        ...data,
        exercisePreferences: currentExercises.filter((e) => e !== ex),
      });
    } else {
      onChange({
        ...data,
        exercisePreferences: [...currentExercises, ex],
      });
    }
  };

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DDF7F7] flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="w-5 h-5 text-[#0E9EAA]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#0E9EAA] uppercase tracking-wider block leading-none">
              Lifestyle &amp; Metabolic Context
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              Physical habits, sleep &amp; recovery
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger onClick={() => setShowWhyModal(true)} accentColor="teal" />
      </div>

      <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
        Sleep cycles and physical activity profoundly affect circulating testosterone synthesis and metabolic vigor.
      </p>

      {/* ── Main Form Inputs (Full Width) ── */}
      <div className="w-full space-y-4 sm:space-y-4.5">
          {/* 1. Daily Physical Activity Level */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] block">
              Physical Activity Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ACTIVITY_LEVELS.map((act) => {
                const isSelected = data.activityLevel === act.key;
                return (
                  <button
                    key={act.key}
                    type="button"
                    onClick={() => onChange({ ...data, activityLevel: act.key })}
                    className={`min-h-[72px] p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40 hover:bg-[#F5FBFD]'
                    }`}
                  >
                    <span className="text-[14px] sm:text-[15px] font-bold block leading-tight">{act.label}</span>
                    <span
                      className={`text-[12px] sm:text-[13px] leading-snug mt-1 block ${
                        isSelected ? 'text-[#DDF7F7]' : 'text-[#8FA3B8]'
                      }`}
                    >
                      {act.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sleep Duration (Slider) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <Moon01 className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
                <span>Average Sleep Duration</span>
              </label>
              <span className="text-[14px] sm:text-[15px] font-mono font-bold text-[#0E9EAA] bg-[#EAFBFC] border border-[#B2EBF2] px-3.5 py-1 rounded-xl">
                {data.sleepHours} Hours / Night
              </span>
            </div>
            <input
              type="range"
              min={4}
              max={12}
              step={0.5}
              value={data.sleepHours}
              onChange={(e) => onChange({ ...data, sleepHours: parseFloat(e.target.value) })}
              className="w-full h-2 accent-[#0E9EAA] cursor-pointer"
            />
            <div className="flex justify-between text-[12px] sm:text-[13px] text-[#8FA3B8] font-mono">
              <span>4 hrs</span>
              <span className="text-[#0E9EAA] font-bold">7–8 hrs (Optimal for Testosterone)</span>
              <span>12 hrs</span>
            </div>
          </div>

          {/* 3. Regular Exercise & Workout Preferences */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <ActivityHeart className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
                <span>Do you exercise regularly?</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...data, regularExercise: true })}
                  className={`min-h-[46px] px-5 py-2 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all cursor-pointer ${
                    data.regularExercise
                      ? 'bg-[#0E9EAA] text-white shadow-xs'
                      : 'bg-white border-2 border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, regularExercise: false })}
                  className={`min-h-[46px] px-5 py-2 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all cursor-pointer ${
                    !data.regularExercise
                      ? 'bg-[#0E9EAA] text-white shadow-xs'
                      : 'bg-white border-2 border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {data.regularExercise && (
              <div className="pt-2 border-t border-[#E8F1F5] space-y-2">
                <span className="text-[13px] sm:text-[14px] font-semibold text-[#55718F] block">
                  Select your usual workout activities:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {EXERCISE_OPTIONS.map((ex) => {
                    const isSelected = currentExercises.includes(ex);
                    return (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => toggleExercise(ex)}
                        className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-[13px] sm:text-[14px] font-semibold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EAFBFC] border-2 border-[#0E9EAA] text-[#073B72] shadow-2xs'
                            : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40'
                        }`}
                      >
                        {ex}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Hydration & Fast Food Intake */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Water */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                  <Droplets01 className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
                  <span>Daily Water Intake</span>
                </label>
                <span className="text-[14px] font-mono text-[#0E9EAA] font-bold bg-[#EAFBFC] px-2.5 py-0.5 rounded-lg border border-[#B2EBF2]">
                  {data.dailyWaterGlasses} glasses
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={16}
                step={1}
                value={data.dailyWaterGlasses}
                onChange={(e) => onChange({ ...data, dailyWaterGlasses: parseInt(e.target.value, 10) })}
                className="w-full h-2 accent-[#0E9EAA] cursor-pointer"
              />
              <div className="flex justify-between text-[12px] sm:text-[13px] text-[#8FA3B8] font-mono">
                <span>4 glasses</span>
                <span className="text-[#0E9EAA] font-semibold">8–10 optimal</span>
                <span>16 glasses</span>
              </div>
            </div>

            {/* Fast Food Frequency */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
              <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <Scales01 className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
                <span>Fast Food Intake</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FAST_FOOD_OPTIONS.map((ff) => {
                  const isSelected = data.fastFoodIntake === ff.key;
                  return (
                    <button
                      key={ff.key}
                      type="button"
                      onClick={() => onChange({ ...data, fastFoodIntake: ff.key })}
                      className={`min-h-[50px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] font-bold text-[13px] sm:text-[14px] shadow-xs'
                          : 'bg-white border-[#D7EAF2] text-[#55718F] text-[13px] sm:text-[14px] hover:border-[#0E9EAA]/40'
                      }`}
                    >
                      {ff.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
      </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Why we ask about physical habits & sleep"
        icon={Activity}
        accentColor="teal"
      >
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#F0FDFE] border border-[#CCFBF1]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#0E9EAA] block mb-1">Metabolic Influence</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            Regular resistance training and adequate deep sleep are two of the most effective non-pharmacological drivers of healthy testosterone synthesis.
          </p>
        </div>

        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#073B72] block mb-1">Biological Mechanism:</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            Up to 70% of daily testosterone output occurs during consolidated nocturnal sleep. Disrupted or short sleep suppresses the hypothalamic-pituitary-gonadal axis and increases daytime cortisol.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
