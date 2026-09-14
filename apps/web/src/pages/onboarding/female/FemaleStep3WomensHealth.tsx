import React from 'react';
import { CheckCircle2, Heart, Baby, CalendarHeart } from 'lucide-react';
import type { WomensHealthProfile } from '../../../types/onboarding';
import { WhyWeAskCard } from './WhyWeAskCard';

interface FemaleStep3Props {
  data: WomensHealthProfile;
  onChange: (profile: WomensHealthProfile) => void;
}

const REGULARITY_OPTIONS = [
  { id: 'very_regular', label: 'Very Regular', desc: 'Predictable within 1–2 days every month' },
  { id: 'mostly_regular', label: 'Mostly Regular', desc: 'Usually predictable with occasional minor shifts' },
  { id: 'sometimes_irregular', label: 'Sometimes Irregular', desc: 'Cycles often vary by 5–10+ days' },
  { id: 'often_irregular', label: 'Often Irregular', desc: 'Frequent missed cycles or intervals >35 days' },
  { id: 'not_sure', label: 'Not Sure', desc: 'Tracking for the first time' },
];

export const FemaleStep3WomensHealth: React.FC<FemaleStep3Props> = ({ data, onChange }) => {
  const maritalStatus = data.maritalStatus || 'unmarried';
  const marriageYears = data.marriageYears ?? 0;
  const isPregnant = data.isPregnant ?? false;
  const abortionsCount = data.abortionsCount ?? 0;

  return (
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FDE6EF] flex items-center justify-center shrink-0 shadow-2xs">
          <CalendarHeart className="w-5 h-5 text-[#F43F7D]" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#F43F7D] uppercase tracking-wider block leading-none">
            Period & Cycle
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            Menstrual Rhythm & Reproductive Factors
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            Your menstrual regularity and cycle length are primary markers for PCOS screening.
          </p>
        </div>
      </div>

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Inputs Column */}
        <div className="lg:col-span-8 space-y-3">
          {/* 1. Cycle Length Slider */}
          <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide block">
                  Average Cycle Length
                </span>
                <span className="text-[10px] text-[#55718F]">
                  From Day 1 of one period to Day 1 of the next
                </span>
              </div>

              <div className="px-3 py-1 rounded-lg bg-[#FDE6EF] text-[#F43F7D] text-xs font-bold font-mono border border-[#FBCFE8]">
                {typeof data.cycleLength === 'number' ? `${data.cycleLength} Days` : 'Irregular / Varies'}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="21"
                max="45"
                value={typeof data.cycleLength === 'number' ? data.cycleLength : 28}
                onChange={(e) => onChange({ ...data, cycleLength: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-[#D7EAF2] rounded-lg appearance-none cursor-pointer accent-[#F43F7D]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#55718F]">
                <span>21 Days (Shorter)</span>
                <span>28 Days (Standard)</span>
                <span>35 Days</span>
                <span>45+ Days (Longer)</span>
              </div>

              <div className="pt-0.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...data, cycleLength: 28 })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    data.cycleLength === 28
                      ? 'bg-[#F43F7D] text-white shadow-2xs'
                      : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                  }`}
                >
                  Standard (28 Days)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, cycleLength: 'irregular' })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    data.cycleLength === 'irregular'
                      ? 'bg-[#F43F7D] text-white shadow-2xs'
                      : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                  }`}
                >
                  Varies / Irregular
                </button>
              </div>
            </div>
          </div>

          {/* 2. Period Regularity Cards */}
          <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
            <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide block">
              How regular are your cycles?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#FDE6EF]/60 border-[#F43F7D] shadow-2xs ring-1 ring-[#F43F7D]/30'
                        : 'bg-white border-[#D7EAF2] hover:border-[#0E9EAA]/40'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[#073B72] block leading-tight">{opt.label}</span>
                      <span className="text-[10px] text-[#55718F] leading-tight">{opt.desc}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#F43F7D] bg-[#F43F7D] text-white' : 'border-[#D7EAF2] bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Reproductive & Clinical Factors */}
          <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#F43F7D]" />
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider">
                Reproductive Baseline (Used by Model)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Marital Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#073B72] block">
                  Marital Status
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, maritalStatus: 'unmarried', marriageYears: 0 })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold ${
                      maritalStatus === 'unmarried'
                        ? 'bg-[#FDE6EF] border-[#F43F7D] text-[#F43F7D]'
                        : 'bg-white border-[#D7EAF2] text-[#55718F]'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, maritalStatus: 'married', marriageYears: marriageYears || 1 })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold ${
                      maritalStatus === 'married'
                        ? 'bg-[#FDE6EF] border-[#F43F7D] text-[#F43F7D]'
                        : 'bg-white border-[#D7EAF2] text-[#55718F]'
                    }`}
                  >
                    Married
                  </button>
                </div>

                {maritalStatus === 'married' && (
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[#55718F]">
                    <span>Years:</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={marriageYears}
                      onChange={(e) => onChange({ ...data, marriageYears: parseInt(e.target.value, 10) })}
                      className="flex-1 h-1 bg-[#D7EAF2] rounded accent-[#F43F7D]"
                    />
                    <span className="font-mono font-bold text-[#F43F7D]">{marriageYears}y</span>
                  </div>
                )}
              </div>

              {/* Currently Pregnant */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#073B72] flex items-center gap-1">
                  <Baby className="w-3 h-3 text-[#0E9EAA]" />
                  <span>Pregnant Now?</span>
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, isPregnant: false })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold ${
                      !isPregnant
                        ? 'bg-[#DDF7F7] border-[#0E9EAA] text-[#073B72]'
                        : 'bg-white border-[#D7EAF2] text-[#55718F]'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, isPregnant: true })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold ${
                      isPregnant
                        ? 'bg-[#DDF7F7] border-[#0E9EAA] text-[#073B72]'
                        : 'bg-white border-[#D7EAF2] text-[#55718F]'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Pregnancy Loss */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#073B72] flex items-center justify-between">
                  <span>Prior Loss</span>
                  <span className="font-mono font-bold text-[#F43F7D] text-[10px]">{abortionsCount}</span>
                </label>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onChange({ ...data, abortionsCount: num })}
                      className={`flex-1 py-1.5 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold font-mono ${
                        abortionsCount === num
                          ? 'bg-[#FDE6EF] border-[#F43F7D] text-[#F43F7D]'
                          : 'bg-white border-[#D7EAF2] text-[#55718F]'
                      }`}
                    >
                      {num === 3 ? '3+' : num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Single Concise "Why we ask this" Card */}
        <div className="lg:col-span-4">
          <WhyWeAskCard
            description="Menstrual cycle frequency and regularity are cardinal indicators for evaluating ovulatory function and hormonal balance."
          />
        </div>
      </div>
    </div>
  );
};
