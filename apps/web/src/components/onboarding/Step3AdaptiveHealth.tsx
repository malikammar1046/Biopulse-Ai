import React from 'react';
import { Heart, ActivityHeart, Compass01, Check, MedicalCircle } from '@untitledui/icons';
import type {
  UserGender,
  WomensHealthProfile,
  MensHealthProfile,
  GeneralHealthProfile,
} from '../../types/onboarding';
import { Step4WomensHealth } from './Step4WomensHealth';
import {
  DEFAULT_MALE_SYMPTOM_OPTIONS,
  MALE_MEDICATION_FACTORS,
  GENERAL_HEALTH_FOCUS_OPTIONS,
} from '../../data/mockOnboardingData';

interface Step3AdaptiveProps {
  gender?: UserGender;
  womensHealth: WomensHealthProfile;
  mensHealth?: MensHealthProfile;
  generalHealth?: GeneralHealthProfile;
  onWomensHealthChange: (wh: WomensHealthProfile) => void;
  onMensHealthChange: (mh: MensHealthProfile) => void;
  onGeneralHealthChange: (gh: GeneralHealthProfile) => void;
}

const DEFAULT_MENS_HEALTH: MensHealthProfile = {
  energyLevel: 'moderate',
  sexDrive: 'normal',
  erectileDifficulties: 'none',
  muscleStrengthChanges: 'stable',
  bodyHairChanges: 'no_change',
  moodChanges: [],
  sleepQuality: 'restful',
  hadTestosteroneTest: 'no',
  testosteroneValue: null,
  testosteroneUnit: 'ng/dL',
  testDrawTime: 'morning_fasting',
  priorMedications: ['None of the above'],
};

const DEFAULT_GENERAL_HEALTH: GeneralHealthProfile = {
  primaryFocus: ['Daily Energy & Sleep Optimization'],
  energyPatterns: 'Steady throughout morning, mild dip late afternoon',
  stressLevel: 'moderate',
};

export const Step3AdaptiveHealth: React.FC<Step3AdaptiveProps> = ({
  gender,
  womensHealth,
  mensHealth = DEFAULT_MENS_HEALTH,
  generalHealth = DEFAULT_GENERAL_HEALTH,
  onWomensHealthChange,
  onMensHealthChange,
  onGeneralHealthChange,
}) => {
  // ── 1. Female Pathway: BioPulse AI (PCOS & Reproductive Patterns) ──
  if (gender === 'female') {
    return (
      <div className="space-y-4 text-left">
        <div className="p-3.5 rounded-2xl bg-[#0288D1]/10 border border-[#0288D1]/30 flex items-center gap-2.5 text-xs text-[#E0F2FE]">
          <Heart className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
          <span>
            <strong>BioPulse AI Pathway:</strong> We'll use this information to understand whether your pattern is worth discussing with a healthcare professional.
          </span>
        </div>
        <Step4WomensHealth data={womensHealth} onChange={onWomensHealthChange} />
      </div>
    );
  }

  // ── 2. Male Pathway: AndroSense AI (Male Hypogonadism Screening Context) ──
  if (gender === 'male') {
    const mh = { ...DEFAULT_MENS_HEALTH, ...mensHealth };

    const toggleMood = (item: string) => {
      const list = [...(mh.moodChanges || [])];
      if (list.includes(item)) {
        onMensHealthChange({ ...mh, moodChanges: list.filter((m) => m !== item) });
      } else {
        onMensHealthChange({ ...mh, moodChanges: [...list, item] });
      }
    };

    const toggleMedication = (med: string) => {
      let list = [...(mh.priorMedications || [])];
      if (med === 'None of the above') {
        onMensHealthChange({ ...mh, priorMedications: ['None of the above'] });
        return;
      }
      list = list.filter((m) => m !== 'None of the above');
      if (list.includes(med)) {
        list = list.filter((m) => m !== med);
        if (list.length === 0) list = ['None of the above'];
      } else {
        list.push(med);
      }
      onMensHealthChange({ ...mh, priorMedications: list });
    };

    return (
      <div className="space-y-7 text-left">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0288D1]/20 border border-[#0288D1]/40 text-xs font-mono text-[#7DD3FC] mb-1">
            <ActivityHeart className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>Hormonal Vitality & Energy Screening</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Your Energy & Health Profile
          </h2>
          <p className="text-sm text-[#CDBDD8] font-sans">
            This information helps us understand which areas may be worth exploring further with your doctor. We never provide an automated diagnosis.
          </p>
        </div>

        {/* 1. Daily Energy Level */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
              Daily Energy Level
            </span>
            <span className="text-[11px] text-[#A797BD]">General alertness & drive</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'high', label: 'High Energy', desc: 'Alert & energized all day' },
              { id: 'moderate', label: 'Moderate', desc: 'Normal daily stamina' },
              { id: 'low', label: 'Low Energy', desc: 'Frequent sluggishness' },
              { id: 'very_low', label: 'Very Low', desc: 'Exhausted even after rest' },
            ].map((opt) => {
              const isSelected = mh.energyLevel === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onMensHealthChange({ ...mh, energyLevel: opt.id as any })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B213F] border-[#38BDF8] text-white shadow-sm ring-1 ring-[#38BDF8]'
                      : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className="text-[10px] text-[#A797BD] block mt-0.5">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Sex Drive & Intimacy Rhythms */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
          <div>
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
              Sex Drive & Intimacy
            </span>
            <span className="text-xs text-[#A797BD]">Natural endocrine and vascular indicator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'normal', label: 'Normal / Steady', desc: 'Consistent desire' },
              { id: 'reduced', label: 'Mildly Reduced', desc: 'Noticeable drop in interest' },
              { id: 'significantly_reduced', label: 'Significantly Reduced', desc: 'Rare or absent desire' },
            ].map((opt) => {
              const isSelected = mh.sexDrive === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onMensHealthChange({ ...mh, sexDrive: opt.id as any })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B213F] border-[#38BDF8] text-white shadow-sm ring-1 ring-[#38BDF8]'
                      : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className="text-[10px] text-[#A797BD] block mt-0.5">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10">
            <span className="text-xs font-bold text-white block mb-2 font-mono">
              Morning Firmness / Erections
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Regular / Normal', desc: 'Present most mornings' },
                { id: 'occasional', label: 'Occasional Drops', desc: 'Present some mornings' },
                { id: 'frequent', label: 'Noticeably Infrequent', desc: 'Rare morning firmness' },
              ].map((opt) => {
                const isSelected = mh.erectileDifficulties === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onMensHealthChange({ ...mh, erectileDifficulties: opt.id as any })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B213F] border-[#38BDF8] text-white'
                        : 'bg-[#140924] border-white/10 text-[#CDBDD8]'
                    }`}
                  >
                    <span className="font-semibold block">{opt.label}</span>
                    <span className="text-[10px] text-[#A797BD] block">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Physical Changes (Strength, Hair, Sleep) */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
            Physical & Hormone Markers
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Muscle Strength */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#EDE4F7] font-semibold block">
                Muscle Strength & Workout Recovery
              </label>
              <select
                value={mh.muscleStrengthChanges}
                onChange={(e) => onMensHealthChange({ ...mh, muscleStrengthChanges: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#140924] border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
              >
                <option value="stable">Stable / Good strength</option>
                <option value="reduced">Reduced strength or slower recovery</option>
                <option value="significantly_reduced">Significant loss of strength</option>
              </select>
            </div>

            {/* Body / Facial Hair */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#EDE4F7] font-semibold block">
                Body & Facial Hair Growth
              </label>
              <select
                value={mh.bodyHairChanges}
                onChange={(e) => onMensHealthChange({ ...mh, bodyHairChanges: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#140924] border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
              >
                <option value="no_change">No changes noticed</option>
                <option value="thinning">Mild thinning or slower shaving rate</option>
                <option value="reduced_growth">Noticeable reduction in growth</option>
              </select>
            </div>

            {/* Sleep Quality */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-[#EDE4F7] font-semibold block">
                Sleep Restfulness
              </label>
              <select
                value={mh.sleepQuality}
                onChange={(e) => onMensHealthChange({ ...mh, sleepQuality: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#140924] border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
              >
                <option value="restful">Wake up refreshed / deep sleep</option>
                <option value="frequently_waking">Frequently waking or tossing</option>
                <option value="poor">Unrefreshing sleep or daytime drowsiness</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Common Symptoms Checklist */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
            Experienced Symptoms (Past 3–6 Months)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_MALE_SYMPTOM_OPTIONS.map((item) => {
              const isChecked = (mh.moodChanges || []).includes(item.label);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleMood(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isChecked
                      ? 'bg-[#0B213F] border-[#38BDF8] text-white shadow-sm'
                      : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] text-[#A797BD]">{item.desc}</span>
                  </div>
                  {isChecked && <Check className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Relevant Medication Factors */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <MedicalCircle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
              Relevant Medication History
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MALE_MEDICATION_FACTORS.map((med) => {
              const isSelected = (mh.priorMedications || []).includes(med);
              return (
                <button
                  key={med}
                  type="button"
                  onClick={() => toggleMedication(med)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#0B213F] border-[#38BDF8] text-white'
                      : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-medium">{med}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Prior Blood Test Results (Optional) */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
          <div>
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
              Prior Blood Test Results (Optional)
            </span>
            <span className="text-xs text-[#A797BD]">
              Have you had a total testosterone or endocrine test in the past year?
            </span>
          </div>

          <div className="flex gap-3">
            {[
              { id: 'no', label: 'No / Never tested' },
              { id: 'yes', label: 'Yes, I have results' },
              { id: 'unsure', label: 'Not sure' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onMensHealthChange({ ...mh, hadTestosteroneTest: opt.id as any })}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  mh.hadTestosteroneTest === opt.id
                    ? 'bg-[#38BDF8] text-[#0A1224] border-[#38BDF8]'
                    : 'bg-[#140924] text-[#CDBDD8] border-white/15 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {mh.hadTestosteroneTest === 'yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div className="space-y-1.5">
                <label className="text-xs text-[#EDE4F7] font-semibold block">
                  Total Testosterone Result
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 380"
                    value={mh.testosteroneValue ?? ''}
                    onChange={(e) =>
                      onMensHealthChange({
                        ...mh,
                        testosteroneValue: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#140924] border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                  />
                  <select
                    value={mh.testosteroneUnit || 'ng/dL'}
                    onChange={(e) =>
                      onMensHealthChange({ ...mh, testosteroneUnit: e.target.value as any })
                    }
                    className="w-24 px-2 py-2.5 rounded-xl bg-[#140924] border border-white/15 text-xs text-white"
                  >
                    <option value="ng/dL">ng/dL</option>
                    <option value="nmol/L">nmol/L</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#EDE4F7] font-semibold block">
                  Time of Blood Draw
                </label>
                <select
                  value={mh.testDrawTime || 'morning_fasting'}
                  onChange={(e) =>
                    onMensHealthChange({ ...mh, testDrawTime: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140924] border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                >
                  <option value="morning_fasting">Morning fasting (recommended 7–10 AM)</option>
                  <option value="afternoon">Afternoon / Evening</option>
                  <option value="unsure">Not sure of time</option>
                </select>
              </div>

              <p className="text-[11px] text-[#7DD3FC] font-mono sm:col-span-2">
                * Note: Testosterone levels peak in the early morning and vary daily. A single test is not definitive.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 3. General Pathway: VITASense Baseline Experience ──
  const gh = { ...DEFAULT_GENERAL_HEALTH, ...generalHealth };

  const toggleFocus = (item: string) => {
    const list = [...(gh.primaryFocus || [])];
    if (list.includes(item)) {
      onGeneralHealthChange({ ...gh, primaryFocus: list.filter((f) => f !== item) });
    } else {
      onGeneralHealthChange({ ...gh, primaryFocus: [...list, item] });
    }
  };

  return (
    <div className="space-y-7 text-left">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0288D1]/20 border border-[#0288D1]/40 text-xs font-mono text-[#7DD3FC] mb-1">
          <Compass01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
          <span>BioPulse AI Baseline Health Profile</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Your Health Baseline & Priorities
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          This helps BioPulse AI tailor your health tracking, nutrition, activity, and medical records.
        </p>
      </div>

      {/* 1. Health Priorities */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
          Primary Health Priorities
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {GENERAL_HEALTH_FOCUS_OPTIONS.map((item) => {
            const isChecked = (gh.primaryFocus || []).includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleFocus(item)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isChecked
                    ? 'bg-[#1E1736] border-[#0288D1] text-white shadow-sm'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                }`}
              >
                <span className="text-xs font-semibold">{item}</span>
                {isChecked && <Check className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Stress & Sleep Restfulness */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
          Daily Stress & Recovery
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'low', label: 'Low Stress', desc: 'Manageable daily pace' },
            { id: 'moderate', label: 'Moderate Stress', desc: 'Busy work / study routine' },
            { id: 'high', label: 'High Stress', desc: 'Intense demands / frequent burnout' },
          ].map((opt) => {
            const isSelected = gh.stressLevel === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onGeneralHealthChange({ ...gh, stressLevel: opt.id as any })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E1736] border-[#A78BFA] text-white shadow-sm ring-1 ring-[#A78BFA]'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
                }`}
              >
                <span className="text-xs font-bold block">{opt.label}</span>
                <span className="text-[10px] text-[#A797BD] block mt-0.5">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Step3AdaptiveHealth;
