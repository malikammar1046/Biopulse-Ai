import React from 'react';
import { Calendar, Sparkles, CheckCircle2, Clock, Check } from 'lucide-react';
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
    const list = [...data.commonSymptoms];
    if (list.includes(symptomLabel)) {
      onChange({ ...data, commonSymptoms: list.filter((s) => s !== symptomLabel) });
    } else {
      onChange({ ...data, commonSymptoms: [...list, symptomLabel] });
    }
  };

  return (
    <div className="space-y-7 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6E2D8B]/20 border border-[#8E3EAF]/40 text-xs font-mono text-[#FDA4AF] mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
          <span>Core Reproductive Health</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Women’s Health & Cycle Profile.
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          This helps OvaSense identify your natural hormonal phases and highlight longitudinal patterns.
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

          <div className="px-3.5 py-1.5 rounded-2xl bg-[#6E2D8B] text-white text-sm font-bold font-mono shadow-md">
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
            className="w-full h-2 bg-[#140924] rounded-lg appearance-none cursor-pointer accent-[#FB7185]"
          />

          <div className="flex justify-between text-[10px] font-mono text-[#A797BD]">
            <span>21 Days (Shorter)</span>
            <span>28 Days (Standard)</span>
            <span>35 Days</span>
            <span>45+ Days (Longer)</span>
          </div>

          <div className="pt-1 flex gap-2">
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
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] text-white shadow'
                  : 'bg-white/5 text-[#CDBDD8] hover:text-white'
              }`}
            >
              Varies / Unpredictable
            </button>
          </div>
        </div>
      </div>

      {/* 2. Last Period Date & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Last Period */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
            Last Menstrual Period Start
          </label>
          <div className="relative">
            <input
              type="date"
              value={data.lastPeriodDate}
              onChange={(e) => onChange({ ...data, lastPeriodDate: e.target.value })}
              className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
            />
            <Calendar className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Typical Duration */}
        <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
            Typical Bleeding Duration
          </label>
          <div className="relative">
            <select
              value={data.periodDuration}
              onChange={(e) => onChange({ ...data, periodDuration: parseInt(e.target.value, 10) })}
              className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] cursor-pointer"
            >
              {[3, 4, 5, 6, 7, 8].map((days) => (
                <option key={days} value={days} className="bg-[#180A26] text-white">
                  {days} Days
                </option>
              ))}
            </select>
            <Clock className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 3. Period Regularity Cards */}
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
                    ? 'bg-[#1C0D2E] border-[#FB7185] shadow-md scale-[1.01]'
                    : 'bg-[#140924]/60 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-white block">{opt.label}</span>
                  <span className="text-[11px] text-[#A797BD]">{opt.desc}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#FB7185] bg-[#FB7185] text-white' : 'border-white/30'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Common Symptoms Multi-Select */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider block">
            Common Symptoms You Experience
          </label>
          <span className="text-[10px] font-mono text-[#A797BD]">Select all that apply</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEFAULT_SYMPTOM_OPTIONS.map((sym) => {
            const isSelected = data.commonSymptoms.includes(sym.label);
            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => toggleSymptom(sym.label)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#6E2D8B]/40 to-[#FB7185]/20 border-[#FB7185] shadow-sm'
                    : 'bg-[#140924]/60 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-white block">{sym.label}</span>
                  <span className="text-[10px] text-[#A797BD]">{sym.desc}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#FB7185] border-[#FB7185] text-white' : 'border-white/30'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
