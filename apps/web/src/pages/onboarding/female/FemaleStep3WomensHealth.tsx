import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Heart, User01, CalendarHeart01 } from '@untitledui/icons';
import type { WomensHealthProfile } from '../../../types/onboarding';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';

import { calculateExactAge } from '../../../utils/femalePcosEligibility';

interface FemaleStep3Props {
  data: WomensHealthProfile;
  onChange: (profile: WomensHealthProfile) => void;
  userDob?: string;
  errors?: Record<string, string>;
}

const REGULARITY_OPTIONS = [
  { id: 'very_regular', label: 'Very Regular', desc: 'Predictable within 1–2 days every month' },
  { id: 'mostly_regular', label: 'Mostly Regular', desc: 'Usually predictable with occasional minor shifts' },
  { id: 'sometimes_irregular', label: 'Sometimes Irregular', desc: 'Cycles often vary by 5–10+ days' },
  { id: 'often_irregular', label: 'Often Irregular', desc: 'Frequent missed cycles or intervals >35 days' },
  { id: 'not_sure', label: 'Not Sure', desc: 'Tracking for the first time' },
];

export const FemaleStep3WomensHealth: React.FC<FemaleStep3Props> = ({ data, onChange, userDob, errors }) => {
  const { t } = useTranslation(['onboarding', 'common']);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const maritalStatus = data.maritalStatus || 'unmarried';
  const marriageYears = data.marriageYears ?? 0;
  const isPregnant = data.isPregnant ?? false;
  const abortionsCount = data.abortionsCount ?? 0;

  const { age: currentAge } = calculateExactAge(userDob);

  return (
    <div className="w-full space-y-5 text-left">
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
        Your menstrual history, onset of menses, and cycle rhythm are evaluated according to age-specific international guidelines.
      </p>

      {/* ── Main Form Inputs (Full Width) ── */}
      <div className="w-full space-y-3.5 sm:space-y-4">
          {/* 0. Menstrual History & Menarche Status */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[14px] sm:text-[15px] font-bold text-[#073B72] block leading-tight">
                  {t('onboarding:womensQuestions.hasHadPeriod', 'Have your monthly menstrual periods started?')}
                </span>
                <span className="text-[12.5px] sm:text-[13px] text-[#55718F] mt-0.5 block">
                  Required for guideline-aligned life-stage evaluation (2023 &amp; 2025 international recommendations)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onChange({ ...data, hasHadPeriod: true })}
                className={`min-h-[42px] sm:min-h-[44px] py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold ${
                  data.hasHadPeriod !== false
                    ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#F43F7D] shadow-2xs'
                    : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                }`}
              >
                {t('onboarding:womensQuestions.periodsStarted', 'Yes, periods have begun')}
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...data, hasHadPeriod: false })}
                className={`min-h-[42px] sm:min-h-[44px] py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold ${
                  data.hasHadPeriod === false
                    ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#F43F7D] shadow-2xs'
                    : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                }`}
              >
                {t('onboarding:womensQuestions.preMenarche', 'Not yet (Pre-menarche)')}
              </button>
            </div>

            {data.hasHadPeriod === false && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-[#073B72] space-y-1">
                <span className="font-bold block text-amber-900">
                  {currentAge !== null && currentAge >= 15
                    ? t('onboarding:womensQuestions.primaryAmenorrheaNotice', 'Primary Amenorrhea Notice')
                    : t('onboarding:womensQuestions.preMenarcheNotice', 'Pre-Menarche Health Tracking')}
                </span>
                <p className="text-amber-800 leading-relaxed">
                  {currentAge !== null && currentAge >= 15
                    ? t('onboarding:womensQuestions.primaryAmenorrheaDesc', 'According to international clinical consensus guidelines, absence of periods by age 15 warrants medical evaluation for primary amenorrhea with an adolescent specialist or endocrinologist.')
                    : t('onboarding:womensQuestions.preMenarcheDesc', 'You are in the normal pre-menarche developmental stage. Cycle predictions will activate when your periods start.')}
                </p>
              </div>
            )}

            {data.hasHadPeriod !== false && (
              <div className="space-y-1.5 pt-1 border-t border-[#D7EAF2]/60">
                <div className="flex items-center justify-between">
                  <label className="text-[13.5px] font-semibold text-[#073B72]">
                    Age at first period (menarche) <span className="text-xs text-[#55718F] font-normal">(Optional)</span>
                  </label>
                  {data.ageAtMenarche && (
                    <span className="text-xs font-mono font-bold text-[#F43F7D]">
                      Age {data.ageAtMenarche}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 11, 12, 13, 14, 15, 16].map((ageNum) => {
                    const isDisabled = currentAge !== null && ageNum > currentAge;
                    const isSelected = data.ageAtMenarche === ageNum;
                    return (
                      <button
                        key={ageNum}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => onChange({ ...data, ageAtMenarche: ageNum })}
                        className={`h-9 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isDisabled
                            ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#F43F7D] border-[#F43F7D] text-white shadow-xs'
                            : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                        }`}
                      >
                        {ageNum}y
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, ageAtMenarche: null })}
                    className={`h-9 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      !data.ageAtMenarche
                        ? 'bg-[#073B72] border-[#073B72] text-white shadow-xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                    }`}
                  >
                    Unsure / Other
                  </button>
                </div>
                {errors?.ageAtMenarche && (
                  <p className="text-xs text-[#F43F7D] font-medium">{errors.ageAtMenarche}</p>
                )}
              </div>
            )}

            {/* Menopausal transition for women 45+ */}
            {data.hasHadPeriod !== false && currentAge !== null && currentAge >= 45 && (
              <div className="space-y-1.5 pt-1.5 border-t border-[#D7EAF2]/60">
                <label className="text-[13.5px] font-semibold text-[#073B72] block">
                  Life Stage &amp; Menopausal Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'premenopausal', label: 'Premenopausal', desc: 'Still cycling' },
                    { id: 'perimenopausal', label: 'Perimenopausal', desc: 'Transitional / Irregular' },
                    { id: 'postmenopausal', label: 'Postmenopausal', desc: 'Periods ceased 12+ mo' },
                  ].map((st) => {
                    const isSel = (data.menopausalStatus || 'premenopausal') === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...data,
                            menopausalStatus: st.id as any,
                            isMenopausal: st.id === 'postmenopausal',
                          })
                        }
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#073B72] shadow-2xs'
                            : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                        }`}
                      >
                        <span className="text-xs sm:text-[13px] font-bold block">{st.label}</span>
                        <span className="text-[11px] text-[#55718F] block">{st.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 1. Cycle Length Slider & Regularity (Shown for cycling users) */}
          {data.hasHadPeriod !== false && (
            <>
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[14px] sm:text-[15px] font-bold text-[#073B72] block leading-tight">
                      Average Cycle Length
                    </span>
                    <span className="text-[12.5px] sm:text-[13px] text-[#55718F] mt-0.5 block">
                      From Day 1 of one period to Day 1 of the next
                    </span>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-[#FDE6EF] text-[#F43F7D] text-[13px] sm:text-[14px] font-bold font-mono border border-[#FDE6EF]">
                    {typeof data.cycleLength === 'number' ? `${data.cycleLength} Days` : 'Irregular / Varies'}
                  </div>
                </div>

                <div className="space-y-2 pt-0.5">
                  <input
                    type="range"
                    min="21"
                    max="45"
                    value={typeof data.cycleLength === 'number' ? data.cycleLength : 28}
                    onChange={(e) => onChange({ ...data, cycleLength: parseInt(e.target.value, 10) })}
                    className="w-full h-2 bg-[#D7EAF2] rounded-lg appearance-none cursor-pointer accent-[#F43F7D]"
                  />

                  <div className="flex justify-between text-[11px] sm:text-[12px] font-mono text-[#55718F]">
                    <span>21 Days (Shorter)</span>
                    <span>28 Days (Standard)</span>
                    <span>35 Days</span>
                    <span>45+ Days (Longer)</span>
                  </div>

                  <div className="pt-0.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, cycleLength: 28 })}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all ${
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
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all ${
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
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2.5">
                <span className="text-[14px] sm:text-[15px] font-bold text-[#073B72] block">
                  How regular is your menstrual cycle?
                </span>

                <div className="space-y-2">
                  {REGULARITY_OPTIONS.map((opt) => {
                    const isSelected = (data.periodRegularity || 'mostly_regular') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange({ ...data, periodRegularity: opt.id as any })}
                        className={`w-full min-h-[50px] sm:min-h-[54px] p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#FDE6EF]/70 border-2 border-[#F43F7D] shadow-2xs'
                            : 'bg-white border-[#D7EAF2] hover:border-[#F43F7D]/40 hover:bg-[#FFF8FA]'
                        }`}
                      >
                        <div>
                          <span className="text-[14px] sm:text-[14.5px] font-bold text-[#073B72] block leading-tight">
                            {opt.label}
                          </span>
                          <span className="text-[12px] sm:text-[13px] text-[#55718F] leading-snug block mt-0.5">
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
            </>
          )}

          {/* 3. Reproductive & Clinical Factors */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
              <span className="text-[14px] sm:text-[15px] font-bold font-sans text-[#073B72]">
                Reproductive Baseline (Used by Model)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
              {/* Marital Status */}
              <div className="space-y-1.5">
                <label className="text-[13px] sm:text-[13.5px] font-semibold text-[#073B72] block">
                  Marital Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, maritalStatus: 'unmarried', marriageYears: 0 })}
                    className={`min-h-[42px] sm:min-h-[44px] py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold ${
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
                    className={`min-h-[42px] sm:min-h-[44px] py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold ${
                      maritalStatus === 'married'
                        ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#F43F7D] shadow-2xs'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                    }`}
                  >
                    Married
                  </button>
                </div>

                {maritalStatus === 'married' && (
                  <div className="pt-1 flex items-center gap-2 text-[12.5px] text-[#55718F]">
                    <span>Years:</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={marriageYears}
                      onChange={(e) => onChange({ ...data, marriageYears: parseInt(e.target.value, 10) })}
                      className="flex-1 h-1.5 bg-[#D7EAF2] rounded accent-[#F43F7D]"
                    />
                    <span className="font-mono font-bold text-[#F43F7D] text-[13px]">{marriageYears}y</span>
                  </div>
                )}
              </div>

              {/* Currently Pregnant */}
              <div className="space-y-1.5">
                <label className="text-[13px] sm:text-[13.5px] font-semibold text-[#073B72] flex items-center gap-1.5">
                  <User01 className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
                  <span>Pregnant Now?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, isPregnant: false })}
                    className={`min-h-[42px] sm:min-h-[44px] py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold ${
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
                    className={`min-h-[42px] sm:min-h-[44px] py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold ${
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
              <div className="space-y-1.5">
                <label className="text-[13px] sm:text-[13.5px] font-semibold text-[#073B72] flex items-center justify-between">
                  <span>Prior Loss</span>
                  <span className="font-mono font-bold text-[#F43F7D] text-[12.5px]">{abortionsCount} recorded</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onChange({ ...data, abortionsCount: num })}
                      className={`flex-1 h-[40px] sm:h-[42px] rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold font-mono ${
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
