import React, { useState } from 'react';
import { CheckCircle, Heart, User01, CalendarHeart01 } from '@untitledui/icons';
import type { WomensHealthProfile } from '../../../types/onboarding';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';

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
  const [showWhyModal, setShowWhyModal] = useState(false);
  const maritalStatus = data.maritalStatus || 'unmarried';
  const marriageYears = data.marriageYears ?? 0;
  const isPregnant = data.isPregnant ?? false;
  const abortionsCount = data.abortionsCount ?? 0;

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FDE6EF] flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarHeart01 className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#F43F7D] uppercase tracking-wider block leading-none">
              Period &amp; Cycle
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              Menstrual Rhythm &amp; Reproductive Factors
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger onClick={() => setShowWhyModal(true)} accentColor="rose" />
      </div>

      <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
        Your menstrual regularity and cycle length are primary markers for PCOS screening.
      </p>

      {/* ── Main Form Inputs (Full Width) ── */}
      <div className="w-full space-y-4 sm:space-y-4.5">
          {/* 1. Cycle Length Slider */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[15px] sm:text-[16px] font-bold text-[#073B72] block leading-tight">
                  Average Cycle Length
                </span>
                <span className="text-[13px] sm:text-[14px] text-[#55718F] mt-0.5 block">
                  From Day 1 of one period to Day 1 of the next
                </span>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-[#FDE6EF] text-[#F43F7D] text-[14px] sm:text-[15px] font-bold font-mono border border-[#FDE6EF]">
                {typeof data.cycleLength === 'number' ? `${data.cycleLength} Days` : 'Irregular / Varies'}
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <input
                type="range"
                min="21"
                max="45"
                value={typeof data.cycleLength === 'number' ? data.cycleLength : 28}
                onChange={(e) => onChange({ ...data, cycleLength: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-[#D7EAF2] rounded-lg appearance-none cursor-pointer accent-[#F43F7D]"
              />

              <div className="flex justify-between text-[12px] sm:text-[13px] font-mono text-[#55718F]">
                <span>21 Days (Shorter)</span>
                <span>28 Days (Standard)</span>
                <span>35 Days</span>
                <span>45+ Days (Longer)</span>
              </div>

              <div className="pt-1 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...data, cycleLength: 28 })}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-[14px] font-semibold cursor-pointer transition-all ${
                    data.cycleLength === 28
                      ? 'bg-[#F43F7D] text-white shadow-xs'
                      : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                  }`}
                >
                  Standard (28 Days)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, cycleLength: 'irregular' })}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-[14px] font-semibold cursor-pointer transition-all ${
                    data.cycleLength === 'irregular'
                      ? 'bg-[#F43F7D] text-white shadow-xs'
                      : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                  }`}
                >
                  Varies / Irregular
                </button>
              </div>
            </div>
          </div>

          {/* 2. Cycle Regularity Radio Group */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <span className="text-[15px] sm:text-[16px] font-bold text-[#073B72] block">
              How regular is your menstrual cycle?
            </span>

            <div className="space-y-2.5">
              {REGULARITY_OPTIONS.map((opt) => {
                const isSelected = (data.periodRegularity || 'mostly_regular') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ ...data, periodRegularity: opt.id as any })}
                    className={`w-full min-h-[58px] sm:min-h-[62px] p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FDE6EF]/70 border-2 border-[#F43F7D] shadow-2xs'
                        : 'bg-white border-[#D7EAF2] hover:border-[#F43F7D]/40 hover:bg-[#FFF8FA]'
                    }`}
                  >
                    <div>
                      <span className="text-[15px] sm:text-[16px] font-bold text-[#073B72] block leading-tight">
                        {opt.label}
                      </span>
                      <span className="text-[13px] sm:text-[14px] text-[#55718F] leading-snug block mt-0.5">
                        {opt.desc}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#F43F7D] bg-[#F43F7D] text-white' : 'border-[#CBDCE6] bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Reproductive & Clinical Factors */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3.5">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
              <span className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72]">
                Reproductive Baseline (Used by Model)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Marital Status */}
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#073B72] block">
                  Marital Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, maritalStatus: 'unmarried', marriageYears: 0 })}
                    className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer text-[14px] sm:text-[15px] font-bold ${
                      maritalStatus === 'unmarried'
                        ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#F43F7D] shadow-2xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, maritalStatus: 'married', marriageYears: marriageYears || 1 })}
                    className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer text-[14px] sm:text-[15px] font-bold ${
                      maritalStatus === 'married'
                        ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#F43F7D] shadow-2xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                    }`}
                  >
                    Married
                  </button>
                </div>

                {maritalStatus === 'married' && (
                  <div className="pt-1.5 flex items-center gap-2 text-[13px] text-[#55718F]">
                    <span>Years:</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={marriageYears}
                      onChange={(e) => onChange({ ...data, marriageYears: parseInt(e.target.value, 10) })}
                      className="flex-1 h-1.5 bg-[#D7EAF2] rounded accent-[#F43F7D]"
                    />
                    <span className="font-mono font-bold text-[#F43F7D] text-[14px]">{marriageYears}y</span>
                  </div>
                )}
              </div>

              {/* Currently Pregnant */}
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#073B72] flex items-center gap-1.5">
                  <User01 className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
                  <span>Pregnant Now?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, isPregnant: false })}
                    className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer text-[14px] sm:text-[15px] font-bold ${
                      !isPregnant
                        ? 'bg-[#DDF7F7] border-2 border-[#0E9EAA] text-[#073B72] shadow-2xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, isPregnant: true })}
                    className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer text-[14px] sm:text-[15px] font-bold ${
                      isPregnant
                        ? 'bg-[#DDF7F7] border-2 border-[#0E9EAA] text-[#073B72] shadow-2xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Pregnancy Loss */}
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#073B72] flex items-center justify-between">
                  <span>Prior Loss</span>
                  <span className="font-mono font-bold text-[#F43F7D] text-[13px]">{abortionsCount} recorded</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onChange({ ...data, abortionsCount: num })}
                      className={`flex-1 h-[48px] rounded-xl border text-center transition-all cursor-pointer text-[14px] sm:text-[15px] font-bold font-mono ${
                        abortionsCount === num
                          ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#F43F7D] shadow-2xs'
                          : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
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

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Why we ask about your cycle & reproductive factors"
        icon={CalendarHeart01}
        accentColor="rose"
      >
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#F43F7D] block mb-1">Ovulatory &amp; Endocrine Markers</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            Menstrual cycle frequency and regularity are cardinal indicators for evaluating ovulatory function and hormonal balance in PCOS risk assessment.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
