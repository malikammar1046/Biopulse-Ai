import React from 'react';
import {
  Moon,
  Droplet,
  Briefcase,
  Check,
} from 'lucide-react';
import type { UserProfile, LifestyleProfile } from '../../../../types/onboarding';
import { AssessmentImpactBadge } from '../AssessmentImpactBadge';
import { EXERCISE_PREFERENCE_OPTIONS } from '../../../../data/mockOnboardingData';

interface LifestyleTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
  isMale: boolean;
}

export const LifestyleTab: React.FC<LifestyleTabProps> = ({
  draft,
  setDraft,
  isMale,
}) => {
  const lifestyle = draft.lifestyle || ({} as LifestyleProfile);

  const updateLifestyle = (field: keyof LifestyleProfile, val: any) => {
    setDraft((p) => ({
      ...p,
      lifestyle: {
        ...(p.lifestyle as LifestyleProfile),
        [field]: val,
      },
    }));
  };

  const toggleExercise = (ex: string) => {
    const list = [...(lifestyle.exercisePreferences || [])];
    if (list.includes(ex)) {
      updateLifestyle(
        'exercisePreferences',
        list.filter((e) => e !== ex)
      );
    } else {
      updateLifestyle('exercisePreferences', [...list, ex]);
    }
  };

  const exerciseList = lifestyle.exercisePreferences || [];

  return (
    <div className="space-y-6">
      {/* 1. Daily Activity & Movement Routine */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Physical Activity Level</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Determines Total Daily Energy Expenditure (TDEE) and personalized nutrition targets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little intentional exercise' },
            { id: 'light', label: 'Light Activity', desc: '1–2 light workouts or 5k steps/day' },
            { id: 'moderate', label: 'Moderate Active', desc: '3–4 workouts or active daily work' },
            { id: 'very_active', label: 'Very Active', desc: '5+ intense sessions or athletic work' },
          ].map((lvl) => {
            const isSelected = (lifestyle.activityLevel || 'moderate') === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => updateLifestyle('activityLevel', lvl.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <p className="text-xs font-bold mb-1">{lvl.label}</p>
                <p
                  className={`text-[10px] leading-snug ${
                    isSelected ? 'text-white/90' : 'text-slate-400'
                  }`}
                >
                  {lvl.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Sleep Duration & Hydration Target */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Restoration & Hydration</h3>
              {isMale && <AssessmentImpactBadge impact />}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimal sleep restoration and daily cellular hydration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sleep Hours */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Average Nightly Sleep
              </span>
              <span className="text-xs font-bold text-[#0E9EAA]">
                {lifestyle.sleepHours || 7.5} Hours
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={lifestyle.sleepHours || 7.5}
                onChange={(e) => updateLifestyle('sleepHours', Number(e.target.value))}
                className="w-full accent-[#0E9EAA] h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min="4"
                max="14"
                step="0.5"
                value={lifestyle.sleepHours || 7.5}
                onChange={(e) => updateLifestyle('sleepHours', Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {isMale
                ? 'Consistently < 6.0 hours sleep suppresses LH and feeds hypogonadism risk.'
                : 'Supports circadian cortisol and healthy ovulatory rhythms.'}
            </p>
          </div>

          {/* Daily Water */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Daily Water Target
              </span>
              <span className="text-xs font-bold text-slate-800">
                {lifestyle.dailyWaterGlasses || 8} Glasses (~
                {Math.round((lifestyle.dailyWaterGlasses || 8) * 0.25 * 10) / 10}L)
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {[6, 8, 10, 12, 14].map((gl) => {
                const isSelected = (lifestyle.dailyWaterGlasses || 8) === gl;
                return (
                  <button
                    key={gl}
                    type="button"
                    onClick={() => updateLifestyle('dailyWaterGlasses', gl)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {gl} gl
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Standard 250ml glass equivalent. Synchronizes with your daily tracking widget.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Exercise Modalities & Work Environment */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Exercise Modalities & Routine</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select workout disciplines you actively practice or prefer
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {EXERCISE_PREFERENCE_OPTIONS.map((ex) => {
            const isSelected = exerciseList.includes(ex.label) || exerciseList.includes(ex.id);
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => toggleExercise(ex.label)}
                className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EAFBFC] border-[#0E9EAA] ring-1.5 ring-[#0E9EAA] shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className={`text-xs leading-snug ${isSelected ? 'font-bold text-[#073B72]' : 'font-medium text-slate-700'}`}>
                  {ex.label}
                </span>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-[#0E9EAA] border-[#0E9EAA] text-white shadow-xs'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Work Lifestyle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#0E9EAA]" />
            Typical Work Environment
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'desk', label: 'Desk & Sedentary', desc: 'Mostly seated with screen time' },
              { id: 'mixed', label: 'Standing & Moving', desc: 'Mix of walking, meetings and movement' },
              { id: 'active', label: 'Active Field Work', desc: 'Physically demanding or high-step daily role' },
            ].map((wk) => {
              const isSelected = (lifestyle.workLifestyle || 'desk') === wk.id;
              return (
                <button
                  key={wk.id}
                  type="button"
                  onClick={() => updateLifestyle('workLifestyle', wk.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold mb-0.5">{wk.label}</p>
                  <p className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                    {wk.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
