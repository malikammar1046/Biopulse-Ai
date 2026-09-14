import React from 'react';
import {
  Activity,
  Zap,
  Moon,
  Heart,
  TrendingDown,
  Dumbbell,
  Shield,
  Check,
} from 'lucide-react';
import type { UserProfile, MensHealthProfile } from '../../../../types/onboarding';
import { AssessmentImpactBadge } from '../AssessmentImpactBadge';

interface MaleScreeningTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const MOOD_FACTOR_OPTIONS = [
  'Low Motivation',
  'Irritability',
  'Brain Fog',
  'Daytime Fatigue',
  'Low Mood / Apathy',
  'Heightened Stress',
];

export const MaleScreeningTab: React.FC<MaleScreeningTabProps> = ({
  draft,
  setDraft,
}) => {
  const mensHealth = draft.mensHealth || ({} as MensHealthProfile);

  const updateMensHealth = (field: keyof MensHealthProfile, val: any) => {
    setDraft((p) => ({
      ...p,
      mensHealth: {
        ...(p.mensHealth as MensHealthProfile),
        [field]: val,
      },
    }));
  };

  const toggleMoodFactor = (factor: string) => {
    const list = [...(mensHealth.moodChanges || [])];
    if (list.includes(factor)) {
      updateMensHealth(
        'moodChanges',
        list.filter((f) => f !== factor)
      );
    } else {
      updateMensHealth('moodChanges', [...list, factor]);
    }
  };

  const moodList = mensHealth.moodChanges || [];

  return (
    <div className="space-y-6">
      {/* 1. ADAM Endocrine & Vitality Profile */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-teal-100 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Endocrine & Vitality Symptoms (ADAM)
              </h3>
              <AssessmentImpactBadge impact />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Standardized clinical screening indicators evaluating androgen deficiency and metabolic cues
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Libido / Sex Drive */}
          <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-primary-teal" />
                Libido & Sexual Desire
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                Core Indicator
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Noticeable decrease or stability in spontaneous intimacy interest over recent months.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Normal / Stable' },
                { id: 'reduced', label: 'Reduced' },
                { id: 'significantly_reduced', label: 'Very Low' },
              ].map((opt) => {
                const isSelected = (mensHealth.sexDrive || 'normal') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateMensHealth('sexDrive', opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Level */}
          <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Daytime Energy & Stamina
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                Core Indicator
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Frequency of persistent fatigue, post-lunch energy crashes, or general exhaustion.
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'high', label: 'High' },
                { id: 'moderate', label: 'Moderate' },
                { id: 'low', label: 'Low' },
                { id: 'very_low', label: 'Exhausted' },
              ].map((opt) => {
                const isSelected = (mensHealth.energyLevel || 'moderate') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateMensHealth('energyLevel', opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Sleep Restoration & Quality
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                Screening Input
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Sleep architecture strongly regulates nocturnal LH pulses and testosterone synthesis.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'restful', label: 'Deep / Restful' },
                { id: 'frequently_waking', label: 'Interrupted' },
                { id: 'poor', label: 'Poor / Insomnia' },
              ].map((opt) => {
                const isSelected = (mensHealth.sleepQuality || 'restful') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateMensHealth('sleepQuality', opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Muscle Strength & Physical Endurance */}
          <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Muscle Strength & Physical Endurance
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Unexplained reduction in gym performance, recovery capacity, or strength.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'stable', label: 'Stable' },
                { id: 'reduced', label: 'Reduced' },
                { id: 'significantly_reduced', label: 'Noticeable Drop' },
              ].map((opt) => {
                const isSelected = (mensHealth.muscleStrengthChanges || 'stable') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateMensHealth('muscleStrengthChanges', opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Morning & Daytime Firmness */}
          <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Erection Firmness & Morning Cues
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Nocturnal and morning erections are sensitive physiological markers of vascular and endocrine balance.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'No issues' },
                { id: 'occasional', label: 'Occasional' },
                { id: 'frequent', label: 'Frequent difficulty' },
              ].map((opt) => {
                const isSelected = (mensHealth.erectileDifficulties || 'none') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateMensHealth('erectileDifficulties', opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body & Facial Hair */}
          <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Body & Beard Hair Density
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Changes in facial beard shave frequency or loss of axillary/body hair.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'no_change', label: 'Normal Growth' },
                { id: 'thinning', label: 'Slight Thinning' },
                { id: 'reduced_growth', label: 'Reduced Growth' },
              ].map((opt) => {
                const isSelected = (mensHealth.bodyHairChanges || 'no_change') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateMensHealth('bodyHairChanges', opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Mood & Cognitive Vitality Multi-Select */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-teal-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Cognitive & Mood Patterns
              </h3>
              <AssessmentImpactBadge impact />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any neuro-affective symptoms experienced over the past 4–8 weeks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {MOOD_FACTOR_OPTIONS.map((factor) => {
            const isSelected = moodList.includes(factor);
            return (
              <button
                key={factor}
                type="button"
                onClick={() => toggleMoodFactor(factor)}
                className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EAFBFC] border-[#0E9EAA] ring-1.5 ring-[#0E9EAA] shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className={`text-xs leading-snug ${isSelected ? 'font-bold text-[#073B72]' : 'font-medium text-slate-700'}`}>
                  {factor}
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
      </div>

      {/* 3. Clinical Testing Context Note */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-teal-50/80 via-cyan-50/50 to-white border border-teal-200/70">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-800 mb-0.5">
              Clinical Biomarkers & Hormone Testing
            </h4>
            <p>
              Diagnostic testosterone testing (Total & Free Testosterone, SHBG, LH/FSH) requires fasting morning blood draws.
              You can upload laboratory reports directly in the{' '}
              <strong className="text-slate-800 font-semibold">Medical Reports</strong> or{' '}
              <strong className="text-slate-800 font-semibold">Tier 2 Assessment</strong> modules for clinical evidence integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
