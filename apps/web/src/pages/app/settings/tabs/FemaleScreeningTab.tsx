import React from 'react';
import {
  Calendar,
  Clock,
  Check,
} from '@untitledui/icons';
import type { UserProfile } from '../../../../types/onboarding';
import { AssessmentImpactBadge } from '../AssessmentImpactBadge';

interface FemaleScreeningTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const FEMALE_SYMPTOMS = [
  {
    key: 'Excess Facial / Body Hair',
    label: 'Excess Facial or Body Hair',
    sublabel: 'Noticeable coarse growth on chin, chest, or abdomen (Hirsutism)',
    matcher: (s: string) => s.toLowerCase().includes('hair') || s.toLowerCase().includes('hirsutism'),
  },
  {
    key: 'Acne & Persistent Breakouts',
    label: 'Persistent Acne & Breakouts',
    sublabel: 'Hormonal or cystic jawline/facial breakouts resistant to treatments',
    matcher: (s: string) => s.toLowerCase().includes('acne') || s.toLowerCase().includes('pimple'),
  },
  {
    key: 'Skin Darkening (Acanthosis)',
    label: 'Velvety Skin Darkening',
    sublabel: 'Patches on the neck, armpits, or groin folds (Acanthosis Nigricans)',
    matcher: (s: string) => s.toLowerCase().includes('dark') || s.toLowerCase().includes('acanthosis'),
  },
  {
    key: 'Hair Thinning / Loss',
    label: 'Scalp Hair Thinning',
    sublabel: 'Diffuse shedding or widening center parting (Androgenetic alopecia)',
    matcher: (s: string) => s.toLowerCase().includes('loss') || s.toLowerCase().includes('thinning'),
  },
  {
    key: 'Recent Unexplained Weight Gain',
    label: 'Rapid Unexplained Weight Gain',
    sublabel: 'Difficulty losing weight despite calorie control or regular activity',
    matcher: (s: string) => s.toLowerCase().includes('weight') || s.toLowerCase().includes('gain'),
  },
];

export const FemaleScreeningTab: React.FC<FemaleScreeningTabProps> = ({
  draft,
  setDraft,
}) => {
  const womensHealth = draft.womensHealth || ({} as any);
  const lifestyle = draft.lifestyle || ({} as any);

  const cycleRegularity = womensHealth.periodRegularity || 'mostly_regular';
  const cycleLength = womensHealth.cycleLength ?? 28;
  const isPregnant = womensHealth.isPregnant ?? false;
  const abortionsCount = womensHealth.abortionsCount ?? 0;
  const commonSymptoms = womensHealth.commonSymptoms || [];
  const fastFoodIntake = lifestyle.fastFoodIntake || 'occasional';
  const regularExercise = lifestyle.regularExercise ?? true;

  // Toggle symptoms cleanly
  const toggleSymptom = (symKey: string) => {
    const list = [...commonSymptoms];
    if (list.includes(symKey)) {
      setDraft((p) => ({
        ...p,
        womensHealth: {
          ...p.womensHealth,
          commonSymptoms: list.filter((s) => s !== symKey),
        },
      }));
    } else {
      setDraft((p) => ({
        ...p,
        womensHealth: {
          ...p.womensHealth,
          commonSymptoms: [...list, symKey],
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Menstrual Cycle Pattern */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Menstrual Cycle Patterns</h3>
              <AssessmentImpactBadge impact />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cycle predictability and length are foundational indicators in Rotterdam PCOS criteria
            </p>
          </div>
        </div>

        {/* Regularity Segmented Cards */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Cycle Regularity
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'very_regular', label: 'Very Regular', desc: 'Predictable within 1–2 days' },
              { id: 'mostly_regular', label: 'Mostly Regular', desc: 'Slight shifts (3–5 days)' },
              { id: 'sometimes_irregular', label: 'Sometimes Irregular', desc: 'Skips or varies > 7 days' },
              { id: 'often_irregular', label: 'Often Irregular', desc: 'Frequent skips / Oligomenorrhea' },
            ].map((r) => {
              const isSelected = cycleRegularity === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      womensHealth: { ...p.womensHealth, periodRegularity: r.id as any },
                    }))
                  }
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F0F9FF] border-[#0288D1] text-slate-800 shadow-xs ring-1 ring-[#0288D1]/20'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{r.label}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#0288D1] bg-[#0288D1]'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cycle Length Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                Typical Cycle Duration
              </label>
              <span className="text-xs font-bold text-[#0288D1]">
                {cycleLength === 'irregular' ? 'Irregular / Variable' : `${cycleLength} Days`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="21"
                max="60"
                value={typeof cycleLength === 'number' ? cycleLength : 28}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    womensHealth: {
                      ...p.womensHealth,
                      cycleLength: Number(e.target.value),
                    },
                  }))
                }
                className="w-full accent-[#0288D1] h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min="15"
                max="90"
                value={typeof cycleLength === 'number' ? cycleLength : 28}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    womensHealth: {
                      ...p.womensHealth,
                      cycleLength: Number(e.target.value),
                    },
                  }))
                }
                className="w-16 px-2 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center text-slate-800"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Counted from day 1 of one period to day 1 of the next. Typical range: 24–35 days.
            </p>
          </div>

          {/* Period Flow Duration */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                Bleeding Duration
              </label>
              <span className="text-xs font-bold text-slate-800">
                {womensHealth.periodDuration || 5} Days
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {[3, 4, 5, 6, 7, 8].map((days) => {
                const isSelected = (womensHealth.periodDuration || 5) === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        womensHealth: { ...p.womensHealth, periodDuration: days },
                      }))
                    }
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {days}d
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Core PCOS Symptoms */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Androgenic & Metabolic Symptoms</h3>
              <AssessmentImpactBadge impact />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active physical cues evaluated in the machine learning screening model
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEMALE_SYMPTOMS.map((sym) => {
            const isSelected = commonSymptoms.some((s: string) => sym.matcher(s));

            return (
              <button
                key={sym.key}
                type="button"
                onClick={() => toggleSymptom(sym.key)}
                className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F0F9FF] border-[#0288D1] text-[#01579B] ring-1.5 ring-[#0288D1] shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-bold leading-snug ${
                        isSelected ? 'text-[#01579B]' : 'text-slate-800'
                      }`}
                    >
                      {sym.label}
                    </p>
                  </div>
                  <p className={`text-[11px] mt-1 leading-relaxed ${isSelected ? 'text-[#0288D1]' : 'text-slate-500'}`}>
                    {sym.sublabel}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                    isSelected
                      ? 'bg-[#0288D1] border-[#0288D1] text-white shadow-xs'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Reproductive History */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Reproductive History</h3>
              <AssessmentImpactBadge impact />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pregnancy status and obstetric markers integrated in the longitudinal risk dataset
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pregnancy Status */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Currently Pregnant
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    womensHealth: { ...p.womensHealth, isPregnant: false },
                  }))
                }
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !isPregnant
                    ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    womensHealth: { ...p.womensHealth, isPregnant: true },
                  }))
                }
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isPregnant
                    ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {/* Prior Pregnancy Losses / Abortions Count */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Prior Pregnancy Loss
            </span>
            <div className="flex items-center gap-2">
              {[0, 1, 2, '3+'].map((val) => {
                const numericVal = typeof val === 'number' ? val : 3;
                const isSelected = abortionsCount === numericVal;
                return (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        womensHealth: {
                          ...p.womensHealth,
                          abortionsCount: numericVal,
                        },
                      }))
                    }
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Prior miscarriages or terminations.
            </p>
          </div>

          {/* Marriage Years (if applicable) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Marital Duration
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="50"
                value={womensHealth.marriageYears ?? 0}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    womensHealth: {
                      ...p.womensHealth,
                      marriageYears: Math.max(0, Number(e.target.value)),
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
              />
              <span className="text-xs text-slate-400 font-medium">years</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Enter 0 if unmarried or prefer not to specify.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Lifestyle Screening Variables */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Screening Lifestyle Factors</h3>
              <AssessmentImpactBadge impact />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Specific lifestyle inputs calibrated in the machine learning screening model
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fast Food Intake */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Fast Food & Processed Meals Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rare_never', label: 'Rare / Never' },
                { id: 'occasional', label: 'Occasional' },
                { id: 'frequent', label: 'Frequent / Daily' },
              ].map((ff) => {
                const isSelected = fastFoodIntake === ff.id;
                return (
                  <button
                    key={ff.id}
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        lifestyle: { ...p.lifestyle, fastFoodIntake: ff.id as any },
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {ff.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Used to assess dietary inflammatory load and metabolic patterns.
            </p>
          </div>

          {/* Regular Exercise */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Regular Physical Exercise
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    lifestyle: { ...p.lifestyle, regularExercise: true },
                  }))
                }
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  regularExercise
                    ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Yes (Active ≥ 2x/wk)
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    lifestyle: { ...p.lifestyle, regularExercise: false },
                  }))
                }
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !regularExercise
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Minimal / Inactive
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Indicates regular aerobic or resistance exercise habits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
