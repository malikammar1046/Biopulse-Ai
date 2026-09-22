import React from 'react';
import {
  Activity,
  Moon01,
  ActivityHeart,
  Droplets01,
  Scales01,
  InfoCircle,
} from '@untitledui/icons';
import type { LifestyleProfile } from '../../../types/onboarding';
import { MaleWhyWeAskCard } from './MaleWhyWeAskCard';

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
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#DDF7F7] flex items-center justify-center shrink-0 shadow-2xs">
          <Activity className="w-5 h-5 text-[#0E9EAA]" aria-hidden="true" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#0E9EAA] uppercase tracking-wider block leading-none">
            Lifestyle & Metabolic Context
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            Physical habits, sleep & recovery
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            Sleep cycles and physical activity profoundly affect circulating testosterone synthesis and metabolic vigor.
          </p>
        </div>
      </div>

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Inputs Column */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* 1. Daily Physical Activity Level */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide block">
              Physical Activity Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTIVITY_LEVELS.map((act) => {
                const isSelected = data.activityLevel === act.key;
                return (
                  <button
                    key={act.key}
                    type="button"
                    onClick={() => onChange({ ...data, activityLevel: act.key })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-2xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40 hover:bg-[#F5FBFD]'
                    }`}
                  >
                    <span className="text-xs font-bold block leading-tight">{act.label}</span>
                    <span
                      className={`text-[9px] leading-tight mt-0.5 block ${
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
          <div className="pt-2 border-t border-[#E8F1F5] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center gap-1.5">
                <Moon01 className="w-3.5 h-3.5 text-[#0E9EAA]" aria-hidden="true" />
                <span>Average Sleep Duration</span>
              </label>
              <span className="text-xs font-mono font-bold text-[#0E9EAA] bg-[#EAFBFC] border border-[#B2EBF2] px-2.5 py-0.5 rounded-md">
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
              className="w-full accent-[#0E9EAA] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono">
              <span>4 hrs</span>
              <span className="text-[#0E9EAA] font-bold">7–8 hrs (Optimal for Testosterone)</span>
              <span>12 hrs</span>
            </div>
          </div>

          {/* 3. Regular Exercise & Workout Preferences */}
          <div className="pt-2 border-t border-[#E8F1F5] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center gap-1.5">
                <ActivityHeart className="w-3.5 h-3.5 text-[#0E9EAA]" aria-hidden="true" />
                <span>Do you exercise regularly?</span>
              </label>
              <div className="flex rounded-md bg-[#EAFBFC] p-0.5 border border-[#B2EBF2] text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => onChange({ ...data, regularExercise: true })}
                  className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    data.regularExercise ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, regularExercise: false })}
                  className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    !data.regularExercise ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {data.regularExercise && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                {EXERCISE_OPTIONS.map((ex) => {
                  const isSelected = currentExercises.includes(ex);
                  return (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => toggleExercise(ex)}
                      className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EAFBFC] border-[#0E9EAA] text-[#073B72] ring-1 ring-[#0E9EAA]/30'
                          : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40'
                      }`}
                    >
                      {ex}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Hydration & Fast Food Intake */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8F1F5]">
            {/* Daily Water */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center gap-1">
                  <Droplets01 className="w-3 h-3 text-[#0E9EAA]" aria-hidden="true" />
                  <span>Daily Water Intake</span>
                </label>
                <span className="text-[10px] font-mono text-[#0E9EAA] font-bold">
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
                className="w-full accent-[#0E9EAA] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8FA3B8] font-mono">
                <span>4 glasses</span>
                <span>8–10 glasses</span>
                <span>16 glasses</span>
              </div>
            </div>

            {/* Fast Food Frequency */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center gap-1">
                <Scales01 className="w-3 h-3 text-[#0E9EAA]" aria-hidden="true" />
                <span>Fast Food Intake</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {FAST_FOOD_OPTIONS.map((ff) => {
                  const isSelected = data.fastFoodIntake === ff.key;
                  return (
                    <button
                      key={ff.key}
                      type="button"
                      onClick={() => onChange({ ...data, fastFoodIntake: ff.key })}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] font-bold text-[10px]'
                          : 'bg-white border-[#D7EAF2] text-[#55718F] text-[10px] hover:border-[#0E9EAA]/40'
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

        {/* Contextual Helper Card Column */}
        <div className="lg:col-span-4 space-y-3">
          <MaleWhyWeAskCard
            title="Why we ask this"
            description="Regular resistance training and adequate deep sleep are two of the most effective non-pharmacological drivers of healthy testosterone synthesis."
            icon={InfoCircle}
          />

          <div className="p-3.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] text-[11px] text-[#55718F] space-y-1.5">
            <span className="font-bold text-[#073B72] block">Biological Mechanism:</span>
            <p>
              Up to 70% of daily testosterone output occurs during consolidated nocturnal sleep. Disrupted or short sleep suppresses the hypothalamic-pituitary-gonadal axis and increases daytime cortisol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
