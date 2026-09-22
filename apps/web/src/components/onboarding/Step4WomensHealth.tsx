import React from 'react';
import { Calendar, CheckCircle, Check, Heart, User01 } from '@untitledui/icons';
import type { WomensHealthProfile } from '../../types/onboarding';
import { DEFAULT_SYMPTOM_OPTIONS } from '../../data/mockOnboardingData';

interface Step4Props {
  data: WomensHealthProfile;
  onChange: (profile: WomensHealthProfile) => void;
}

const REGULARITY_OPTIONS = [
  { id: 'very_regular', label: 'Very Regular', desc: 'Predictable within 1–2 days every month' },
  { id: 'mostly_regular', label: 'Mostly Regular', desc: 'Usually predictable with occasional shifts' },
  { id: 'sometimes_irregular', label: 'Sometimes Irregular', desc: 'Cycles often vary by 5–10+ days' },
  { id: 'often_irregular', label: 'Often Irregular', desc: 'Frequent missed cycles or long intervals (>35 days)' },
  { id: 'not_sure', label: 'Not Sure / Tracking for First Time', desc: 'Starting fresh to understand rhythms' },
];

export const Step4WomensHealth: React.FC<Step4Props> = ({ data, onChange }) => {
  const toggleSymptom = (symptomLabel: string) => {
    const list = [...(data.commonSymptoms || [])];
    if (list.includes(symptomLabel)) {
      onChange({ ...data, commonSymptoms: list.filter((s) => s !== symptomLabel) });
    } else {
      onChange({ ...data, commonSymptoms: [...list, symptomLabel] });
    }
  };

  const maritalStatus = data.maritalStatus || 'unmarried';
  const marriageYears = data.marriageYears ?? 0;
  const isPregnant = data.isPregnant ?? false;
  const abortionsCount = data.abortionsCount ?? 0;

  return (
    <div className="space-y-7 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0288D1]/20 border border-[#0288D1]/40 text-xs font-mono text-[#7DD3FC] mb-1">
          <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
          <span>Period & Reproductive Health</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Your Menstrual Cycle & Reproductive Profile
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          These clinical factors provide real data to the AI screening model without relying on statistical estimates.
        </p>
      </div>

      {/* 1. Cycle Length Stepper / Slider */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
              Average Cycle Length
            </span>
            <span className="text-xs text-[#A797BD]">From Day 1 of one period to Day 1 of the next</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-[#0288D1] text-white text-sm font-bold font-mono shadow-md">
            {typeof data.cycleLength === 'number' ? `${data.cycleLength} Days` : 'Irregular / Varies'}
          </div>
        </div>

        {/* Range Slider & Quick Toggle */}
        <div className="space-y-3">
          <input
            type="range"
            min="21"
            max="45"
            value={typeof data.cycleLength === 'number' ? data.cycleLength : 28}
            onChange={(e) => onChange({ ...data, cycleLength: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-[#140924] rounded-lg appearance-none cursor-pointer accent-[#0288D1]"
          />

          <div className="flex justify-between text-[10px] font-mono text-[#A797BD]">
            <span>21 Days (Shorter)</span>
            <span>28 Days (Standard)</span>
            <span>35 Days</span>
            <span>45+ Days (Longer)</span>
          </div>

          <div className="pt-1 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onChange({ ...data, cycleLength: 28 })}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                data.cycleLength === 28
                  ? 'bg-white text-[#10071A]'
                  : 'bg-white/5 text-[#CDBDD8] hover:text-white'
              }`}
            >
              Standard (28 Days)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...data, cycleLength: 'irregular' })}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                data.cycleLength === 'irregular'
                  ? 'bg-[#0288D1] text-white shadow'
                  : 'bg-white/5 text-[#CDBDD8] hover:text-white'
              }`}
            >
              Varies / Unpredictable
            </button>
          </div>
        </div>
      </div>

      {/* 2. Period Regularity Cards */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
          How regular are your cycles?
        </label>

        <div className="grid grid-cols-1 gap-2.5">
          {REGULARITY_OPTIONS.map((opt) => {
            const isSelected = data.periodRegularity === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    periodRegularity: opt.id as WomensHealthProfile['periodRegularity'],
                  })
                }
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#0F172A] border-[#0288D1] shadow-md scale-[1.01]'
                    : 'bg-[#140924]/60 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-white block">{opt.label}</span>
                  <span className="text-[11px] text-[#A797BD]">{opt.desc}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#0288D1] bg-[#0288D1] text-white' : 'border-white/30'
                  }`}
                >
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Reproductive & Clinical ML Status (Marital Status, Pregnancy, Pregnancy Loss) */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-5">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
            Reproductive & Clinical Factors (Used by ML Model)
          </span>
        </div>

        {/* Marital Status & Years */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-white/90 block">
            Marital Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...data, maritalStatus: 'unmarried', marriageYears: 0 })}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-sans text-xs font-bold ${
                maritalStatus === 'unmarried'
                  ? 'bg-[#0F172A] border-[#0288D1] text-white shadow'
                  : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
              }`}
            >
              Single / Unmarried
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...data, maritalStatus: 'married', marriageYears: marriageYears || 1 })}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-sans text-xs font-bold ${
                maritalStatus === 'married'
                  ? 'bg-[#0F172A] border-[#0288D1] text-white shadow'
                  : 'bg-[#140924] border-white/10 text-[#CDBDD8] hover:border-white/20'
              }`}
            >
              Married
            </button>
          </div>

          {maritalStatus === 'married' && (
            <div className="pt-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#CDBDD8]">Years of Marriage:</span>
                <span className="text-xs font-mono font-bold text-white px-3 py-1 rounded-xl bg-[#0288D1]">
                  {marriageYears} {marriageYears === 1 ? 'Year' : 'Years'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={marriageYears}
                onChange={(e) => onChange({ ...data, marriageYears: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-[#140924] rounded-lg appearance-none cursor-pointer accent-[#0288D1]"
              />
            </div>
          )}
        </div>

        {/* Current Pregnancy & Pregnancy Loss Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Currently Pregnant */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <User01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
              <span>Currently Pregnant?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...data, isPregnant: false })}
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer text-xs font-bold ${
                  !isPregnant
                    ? 'bg-[#0F172A] border-[#0288D1] text-white'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8]'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...data, isPregnant: true })}
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer text-xs font-bold ${
                  isPregnant
                    ? 'bg-[#0F172A] border-[#0288D1] text-white'
                    : 'bg-[#140924] border-white/10 text-[#CDBDD8]'
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {/* Prior Miscarriages / Abortions / Pregnancy Loss */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/90 flex items-center justify-between">
              <span>Prior Pregnancy Loss / Miscarriages</span>
              <span className="text-xs font-mono font-bold text-white">{abortionsCount}</span>
            </label>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange({ ...data, abortionsCount: num })}
                  className={`flex-1 py-2 rounded-2xl border text-center transition-all cursor-pointer text-xs font-bold font-mono ${
                    abortionsCount === num
                      ? 'bg-[#0F172A] border-[#0288D1] text-white'
                      : 'bg-[#140924] border-white/10 text-[#CDBDD8]'
                  }`}
                >
                  {num === 3 ? '3+' : num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Common Symptoms Multi-Select */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
            Common Signs & Symptoms (Evaluated by Model)
          </label>
          <span className="text-[10px] font-mono text-[#A797BD]">Select all that apply</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEFAULT_SYMPTOM_OPTIONS.map((sym) => {
            const isSelected = (data.commonSymptoms || []).includes(sym.label);
            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => toggleSymptom(sym.label)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[#0288D1]/20 border-[#0288D1] shadow-sm'
                    : 'bg-[#140924]/60 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-white block">{sym.label}</span>
                  <span className="text-[10px] text-[#A797BD]">{sym.desc}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#0288D1] border-[#0288D1] text-white' : 'border-white/30'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
