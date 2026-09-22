import React from 'react';
import { CheckCircle, AlertCircle, ShieldTick } from '@untitledui/icons';
import type { UserProfile } from '../../../../types/onboarding';
import { DIETARY_PREFERENCE_OPTIONS } from '../../../../data/mockOnboardingData';

interface NutritionTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
  isMale?: boolean;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  draft,
  setDraft,
}) => {
  const currentDiet = draft.lifestyle?.dietaryPreference || 'Balanced';

  // Check Nutrition Readiness criteria locally
  const hasAge = Boolean(draft.dateOfBirth && draft.dateOfBirth.trim());
  const hasHeight = Boolean(draft.heightCm && draft.heightCm > 0);
  const hasWeight = Boolean(draft.weightKg && draft.weightKg > 0);
  const hasDiet = Boolean(draft.lifestyle?.dietaryPreference);
  const hasActivity = Boolean(draft.lifestyle?.activityLevel);

  const isNutritionReady = hasAge && hasHeight && hasWeight && hasDiet && hasActivity;

  return (
    <div className="space-y-6">
      {/* 1. Dietary Preference Selector */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Dietary Preferences & Regimen</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your primary eating pattern to calibrate macro allocations and recipe curations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DIETARY_PREFERENCE_OPTIONS.map((diet) => {
            const isSelected = currentDiet === diet.label || currentDiet === diet.id;
            return (
              <button
                key={diet.id}
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    lifestyle: { ...p.lifestyle, dietaryPreference: diet.label },
                  }))
                }
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs ring-1 ring-[#0288D1]/30'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{diet.label}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-white bg-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" />}
                  </div>
                </div>
                <p
                  className={`text-[10px] leading-snug ${
                    isSelected ? 'text-white/90' : 'text-slate-400'
                  }`}
                >
                  {diet.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Nutrition Readiness Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isNutritionReady
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              <ShieldTick className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Nutrition Module Readiness
              </h3>
              <p className="text-xs text-slate-400">
                Required clinical inputs for 7-day automated meal planning
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isNutritionReady
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isNutritionReady ? 'Ready for Planning' : 'Incomplete Biometrics'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-100">
          {[
            { label: 'Date of Birth (Age)', ready: hasAge },
            { label: 'Height (cm)', ready: hasHeight },
            { label: 'Weight (kg)', ready: hasWeight },
            { label: 'Dietary Preference', ready: hasDiet },
            { label: 'Activity Level', ready: hasActivity },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                item.ready
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/50 border-amber-200 text-amber-900'
              }`}
            >
              {item.ready ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              )}
              <span className="font-semibold truncate">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 leading-relaxed">
          <p>
            <strong className="text-slate-700 font-semibold">Automatic Synchronization:</strong>{' '}
            Saving your height, weight, activity, and dietary preferences instantly updates your
            nutrition profile. When you request a new 7-Day Meal Plan in the Nutrition module, it
            will be built using these updated metrics.
          </p>
        </div>
      </div>
    </div>
  );
};
