import React, { useState } from 'react';
import {
  ActivityHeart,
  AlertCircle,
  Activity,
  Moon01,
  Heart,
  Scales01,
  Check,
  ShieldTick,
} from '@untitledui/icons';
import type { WomensHealthProfile } from '../../../types/onboarding';
import { DEFAULT_SYMPTOM_OPTIONS } from '../../../data/mockOnboardingData';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';

interface FemaleStep4Props {
  data: WomensHealthProfile;
  onChange: (profile: WomensHealthProfile) => void;
}

// Icon mapping for elegant clinical visual cards
const SYMPTOM_ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  acne: AlertCircle,
  hirsutism: Activity,
  skin_darkening: ActivityHeart,
  hair_loss: Activity,
  weight_gain: Scales01,
  pelvic_cramps: ActivityHeart,
  fatigue: Moon01,
  mood_shifts: Heart,
};

export const FemaleStep4Symptoms: React.FC<FemaleStep4Props> = ({ data, onChange }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const currentSymptoms = data.commonSymptoms || [];

  const toggleSymptom = (label: string) => {
    if (currentSymptoms.includes(label)) {
      onChange({
        ...data,
        commonSymptoms: currentSymptoms.filter((s) => s !== label),
      });
    } else {
      onChange({
        ...data,
        commonSymptoms: [...currentSymptoms, label],
      });
    }
  };

  const handleSelectNone = () => {
    onChange({
      ...data,
      commonSymptoms: [],
    });
  };

  const isNoneSelected = currentSymptoms.length === 0;

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
            <ActivityHeart className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#0288D1] uppercase tracking-wider block leading-none">
              Symptoms &amp; Patterns
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              Tell us what you've noticed
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger onClick={() => setShowWhyModal(true)} accentColor="blue" />
      </div>

      <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
        Select any symptoms you've experienced. This helps BioPulse AI understand patterns relevant to PCOS screening.
      </p>

      {/* ── Main Form Inputs (Full Width) ── */}
      <div className="w-full space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {DEFAULT_SYMPTOM_OPTIONS.map((sym) => {
              const isSelected = currentSymptoms.includes(sym.label);
              const IconComp = SYMPTOM_ICON_MAP[sym.id] || ActivityHeart;

              return (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => toggleSymptom(sym.label)}
                  className={`min-h-[68px] sm:min-h-[72px] p-4 sm:p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3.5 ${
                    isSelected
                      ? 'bg-[#E0F2FE]/70 border-2 border-[#0288D1] shadow-2xs'
                      : 'bg-white border-[#D7EAF2] hover:border-[#0288D1]/40 hover:bg-[#F8FDFF]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#0288D1] text-white shadow-2xs' : 'bg-[#F0F8FF] border border-[#D7EAF2] text-[#0288D1]'
                      }`}
                    >
                      <IconComp className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[15px] sm:text-[16px] font-bold text-[#073B72] block leading-tight">
                        {sym.label.split(' (')[0]}
                      </span>
                      <span className="text-[13px] sm:text-[14px] text-[#55718F] leading-snug mt-1 block">
                        {sym.desc}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-[#0288D1] bg-[#0288D1] text-white shadow-2xs' : 'border-[#CBDCE6] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* "None of these" Option */}
          <div className="pt-1.5">
            <button
              type="button"
              onClick={handleSelectNone}
              className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-center transition-all cursor-pointer text-[14px] sm:text-[15px] font-semibold flex items-center justify-center gap-2.5 ${
                isNoneSelected
                  ? 'bg-[#E0F2FE] border-2 border-[#0288D1] text-[#073B72] font-bold shadow-2xs'
                  : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0288D1]/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isNoneSelected ? 'border-[#0288D1] bg-[#0288D1] text-white' : 'border-[#CBDCE6] bg-white'
                }`}
              >
                {isNoneSelected && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
              </div>
              <span>None of these / No noticeable symptoms</span>
            </button>
          </div>
      </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Why we ask about symptom patterns"
        icon={ActivityHeart}
        accentColor="blue"
      >
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#F0F8FF] border border-[#BAE6FD]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#0288D1] block mb-1">Symptom Phenotypes</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            PCOS can present differently from person to person. Looking at symptom patterns alongside other health information helps provide a more informed screening estimate.
          </p>
        </div>

        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
          <div className="flex items-center gap-2 text-[#0288D1] font-bold text-[13px] uppercase tracking-wide">
            <ShieldTick className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
            <span>Non-Diagnostic</span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-[#55718F] leading-relaxed">
            Reporting symptoms does not mean a clinical diagnosis. It guides the algorithmic confidence score for early awareness and physician discussions.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
