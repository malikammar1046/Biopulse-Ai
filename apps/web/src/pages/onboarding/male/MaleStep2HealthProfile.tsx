import React, { useState } from 'react';
import {
  ActivityHeart,
  Check,
} from '@untitledui/icons';
import type { MedicalProfile, MensHealthProfile } from '../../../types/onboarding';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';

interface MaleStep2Props {
  medical: MedicalProfile;
  mensHealth: MensHealthProfile;
  onMedicalChange: (medical: MedicalProfile) => void;
  onMensHealthChange: (mensHealth: MensHealthProfile) => void;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

// Diagnosed Conditions organized matching the 2-column layout in user specification
const CONDITION_OPTIONS = [
  {
    id: 'hbp',
    label: 'High Blood Pressure',
    aliases: ['High Blood Pressure (Hypertension)', 'High Blood Pressure', 'Hypertension'],
  },
  {
    id: 'diabetes',
    label: 'Diabetes / Insulin',
    aliases: ['Diabetes or Insulin Resistance', 'Diabetes / Insulin', 'Diabetes', 'Insulin Resistance'],
  },
  {
    id: 'cholesterol',
    label: 'High Cholesterol',
    aliases: ['High Cholesterol / Dyslipidemia', 'High Cholesterol', 'Dyslipidemia'],
  },
  {
    id: 'cardio',
    label: 'Cardiovascular Disease',
    aliases: ['Heart or Cardiovascular Disease', 'Cardiovascular Disease', 'Heart Disease'],
  },
  {
    id: 'thyroid',
    label: 'Thyroid Imbalance',
    aliases: ['Thyroid Imbalance (Hypothyroidism)', 'Thyroid Imbalance', 'Hypothyroidism'],
  },
  {
    id: 'none',
    label: 'None of these',
    aliases: ['None of these conditions', 'None of these', 'None'],
  },
];

// Medications & Treatments matching user specification
const MEDICATION_OPTIONS = [
  {
    id: 'bp_med',
    label: 'Blood Pressure Medication',
    aliases: ['Blood Pressure / Cardiovascular Medication', 'Blood Pressure Medication'],
  },
  {
    id: 'opioids',
    label: 'Prescription Opioids',
    aliases: ['Prescription Opioids / Pain Regimens', 'Prescription Opioids'],
  },
  {
    id: 'hormone',
    label: 'Hormone Therapy',
    aliases: ['Prior Testosterone or Anabolic Steroid Use', 'Hormone Therapy'],
  },
  {
    id: 'other',
    label: 'Other Treatment',
    aliases: ['Glucocorticoids / Corticosteroid Therapy', 'Other Treatment'],
  },
];

export const MaleStep2HealthProfile: React.FC<MaleStep2Props> = ({
  medical,
  mensHealth,
  onMedicalChange,
  onMensHealthChange,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);

  const currentConditions = medical.conditions || [];
  const currentMedications = mensHealth.priorMedications || [];

  const isConditionSelected = (opt: (typeof CONDITION_OPTIONS)[number]) => {
    return currentConditions.some((c) => opt.aliases.includes(c) || c === opt.label);
  };

  const toggleCondition = (opt: (typeof CONDITION_OPTIONS)[number]) => {
    let updated: string[];
    if (opt.id === 'none') {
      updated = ['None of these'];
    } else {
      const filtered = currentConditions.filter(
        (c) => c !== 'None of these' && c !== 'None of these conditions' && c !== 'None'
      );
      const isAlreadySelected = filtered.some((c) => opt.aliases.includes(c) || c === opt.label);
      if (isAlreadySelected) {
        updated = filtered.filter((c) => !opt.aliases.includes(c) && c !== opt.label);
      } else {
        updated = [...filtered, opt.label];
      }
      if (updated.length === 0) {
        updated = ['None of these'];
      }
    }
    onMedicalChange({ ...medical, conditions: updated });
  };

  const isMedicationSelected = (med: (typeof MEDICATION_OPTIONS)[number]) => {
    return currentMedications.some((m) => med.aliases.includes(m) || m === med.label);
  };

  const toggleMedication = (med: (typeof MEDICATION_OPTIONS)[number]) => {
    const filtered = currentMedications.filter(
      (m) => m !== 'None of the above' && m !== 'None of these' && m !== 'None'
    );
    const isAlreadySelected = filtered.some((m) => med.aliases.includes(m) || m === med.label);
    let updated: string[];
    if (isAlreadySelected) {
      updated = filtered.filter((m) => !med.aliases.includes(m) && m !== med.label);
    } else {
      updated = [...filtered, med.label];
    }
    if (updated.length === 0) {
      updated = ['None of the above'];
    }
    onMensHealthChange({ ...mensHealth, priorMedications: updated });
  };

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Top Header Row with Health Profile badge and "Why we ask this" ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBFC] border border-[#B2EBF2] text-xs font-bold text-[#0E9EAA] tracking-wider uppercase font-sans shadow-2xs">
          <span>Health Profile</span>
        </div>

        <OnboardingWhyTrigger onClick={() => setShowWhyModal(true)} accentColor="teal" />
      </div>

      {/* ── Title & Subtitle ── */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight">
          Clinical background &amp; diagnosed conditions
        </h2>
        <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed mt-1">
          Tell us about conditions or treatments relevant to your hormone health.
        </p>
      </div>

      {/* ── 1. Blood Group ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
        <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] block">
          Blood Group
        </label>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {BLOOD_TYPES.map((bt) => {
            const isSelected = medical.bloodType === bt;
            return (
              <button
                key={bt}
                type="button"
                onClick={() => onMedicalChange({ ...medical, bloodType: bt })}
                className={`h-[46px] min-w-[56px] px-4 py-2.5 rounded-xl border text-[14px] sm:text-[15px] font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs scale-[1.02]'
                    : 'bg-white text-[#55718F] border-[#D7EAF2] hover:border-[#0E9EAA]/50 hover:text-[#073B72] hover:bg-[#F8FDFF]'
                }`}
              >
                {bt}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Diagnosed Conditions (2-column layout matching wireframe) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
        <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] block">
          Diagnosed Conditions
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {CONDITION_OPTIONS.map((opt) => {
            const isSelected = isConditionSelected(opt);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleCondition(opt)}
                className={`min-h-[56px] px-4.5 py-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#EAFBFC] border-2 border-[#0E9EAA] text-[#073B72] shadow-2xs'
                    : 'bg-white border-[#D7EAF2] text-[#334E68] hover:border-[#0E9EAA]/40 hover:bg-[#F8FDFF]'
                }`}
              >
                <span className={`text-[15px] sm:text-[16px] leading-snug ${isSelected ? 'font-bold text-[#073B72]' : 'font-medium text-[#486581]'}`}>
                  {opt.label}
                </span>

                <div
                  className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#0E9EAA] border-[#0E9EAA] text-white shadow-2xs'
                      : 'border-[#CBDCE6] bg-white'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Medications / Previous Treatments (2x2 grid matching wireframe) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
        <label className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] block">
          Medications / Previous Treatments
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {MEDICATION_OPTIONS.map((med) => {
            const isSelected = isMedicationSelected(med);
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleMedication(med)}
                className={`min-h-[54px] px-4.5 py-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#EAFBFC] border-2 border-[#0E9EAA] text-[#073B72] shadow-2xs font-semibold'
                    : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40 hover:text-[#073B72] hover:bg-[#F8FDFF] font-medium'
                }`}
              >
                <span className="text-[14px] sm:text-[15px] leading-snug">{med.label}</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#0E9EAA] border-[#0E9EAA] text-white'
                      : 'border-[#CBDCE6] bg-white'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Why we ask about your health profile"
        icon={ActivityHeart}
        accentColor="teal"
      >
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#F0FDFE] border border-[#CCFBF1]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#0E9EAA] block mb-1">Metabolic &amp; Hormone Link</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            High blood pressure and impaired glucose metabolism are recognized metabolic risk factors that directly co-occur with lower bioavailable testosterone and microvascular dysfunction.
          </p>
        </div>

        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#073B72] block mb-1">Clinical Note:</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            Certain medications like chronic glucocorticoids or prior exogenous hormone therapy can suppress endogenous pituitary signaling (LH/FSH). Noting them ensures balanced, context-aware screening.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
