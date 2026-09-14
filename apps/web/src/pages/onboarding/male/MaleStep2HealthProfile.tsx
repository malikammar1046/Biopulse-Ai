import React from 'react';
import {
  HeartPulse,
  Check,
} from 'lucide-react';
import type { MedicalProfile, MensHealthProfile } from '../../../types/onboarding';
import { MaleWhyWeAskCard } from './MaleWhyWeAskCard';

interface MaleStep2Props {
  medical: MedicalProfile;
  mensHealth: MensHealthProfile;
  onMedicalChange: (medical: MedicalProfile) => void;
  onMensHealthChange: (mensHealth: MensHealthProfile) => void;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

// Conditions with focus on real Tier 1 model inputs (Hypertension, Diabetes)
const CORE_CONDITION_OPTIONS = [
  { id: 'hypertension', label: 'High Blood Pressure (Hypertension)', tag: 'Tier 1 ML Flag' },
  { id: 'diabetes', label: 'Diabetes or Insulin Resistance', tag: 'Tier 1 ML Flag' },
  { id: 'cholesterol', label: 'High Cholesterol / Dyslipidemia' },
  { id: 'heart_disease', label: 'Heart or Cardiovascular Disease' },
  { id: 'thyroid', label: 'Thyroid Imbalance (Hypothyroidism)' },
  { id: 'none', label: 'None of these conditions' },
];

const MALE_MEDICATION_OPTIONS = [
  'Blood Pressure / Cardiovascular Medication',
  'Prescription Opioids / Pain Regimens',
  'Prior Testosterone or Anabolic Steroid Use',
  'Glucocorticoids / Corticosteroid Therapy',
  'None of the above',
];

const FAMILY_HISTORY_OPTIONS = [
  'Type 2 Diabetes',
  'Hypertension or Early Heart Disease',
  'Male Hormone / Androgen Deficiency',
  'None known',
];

export const MaleStep2HealthProfile: React.FC<MaleStep2Props> = ({
  medical,
  mensHealth,
  onMedicalChange,
  onMensHealthChange,
}) => {
  const currentConditions = medical.conditions || [];
  const currentMedications = mensHealth.priorMedications || [];
  const currentFamilyHistory = medical.familyHistory || [];

  const toggleCondition = (label: string) => {
    let updated: string[];
    if (label === 'None of these conditions') {
      updated = ['None of these conditions'];
    } else {
      const filtered = currentConditions.filter((c) => c !== 'None of these conditions');
      if (filtered.includes(label)) {
        updated = filtered.filter((c) => c !== label);
      } else {
        updated = [...filtered, label];
      }
      if (updated.length === 0) {
        updated = ['None of these conditions'];
      }
    }
    onMedicalChange({ ...medical, conditions: updated });
  };

  const toggleMedication = (med: string) => {
    let updated: string[];
    if (med === 'None of the above') {
      updated = ['None of the above'];
    } else {
      const filtered = currentMedications.filter((m) => m !== 'None of the above');
      if (filtered.includes(med)) {
        updated = filtered.filter((m) => m !== med);
      } else {
        updated = [...filtered, med];
      }
      if (updated.length === 0) {
        updated = ['None of the above'];
      }
    }
    onMensHealthChange({ ...mensHealth, priorMedications: updated });
  };

  const toggleFamilyHistory = (item: string) => {
    let updated: string[];
    if (item === 'None known') {
      updated = ['None known'];
    } else {
      const filtered = currentFamilyHistory.filter((f) => f !== 'None known');
      if (filtered.includes(item)) {
        updated = filtered.filter((f) => f !== item);
      } else {
        updated = [...filtered, item];
      }
      if (updated.length === 0) {
        updated = ['None known'];
      }
    }
    onMedicalChange({ ...medical, familyHistory: updated });
  };

  return (
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#DDF7F7] flex items-center justify-center shrink-0 shadow-2xs">
          <HeartPulse className="w-5 h-5 text-[#0E9EAA]" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#0E9EAA] uppercase tracking-wider block leading-none">
            Health & Body Profile
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            Clinical background & diagnosed conditions
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            Metabolic conditions and prior treatments provide essential context for male hormone regulation.
          </p>
        </div>
      </div>

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Inputs Column */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Blood Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
              <span>Blood Group (Optional)</span>
              <span className="text-[10px] font-normal text-[#8FA3B8]">helps clinical records</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BLOOD_TYPES.map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => onMedicalChange({ ...medical, bloodType: bt })}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    medical.bloodType === bt
                      ? 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-2xs'
                      : 'bg-white text-[#55718F] border-[#D7EAF2] hover:border-[#0E9EAA]/40'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosed Conditions (Core Tier 1 Predictors) */}
          <div className="space-y-2 pt-2 border-t border-[#E8F1F5]">
            <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide block">
              Diagnosed Conditions or Health History
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CORE_CONDITION_OPTIONS.map((opt) => {
                const isSelected = currentConditions.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleCondition(opt.label)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#EAFBFC] border-[#0E9EAA] text-[#073B72] ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40 hover:bg-[#F5FBFD]'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-snug">{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#0E9EAA] border-[#0E9EAA] text-white'
                          : 'border-[#D7EAF2] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Relevant Medications */}
          <div className="space-y-2 pt-2 border-t border-[#E8F1F5]">
            <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide block">
              Relevant Medications / Prior Therapies
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MALE_MEDICATION_OPTIONS.map((med) => {
                const isSelected = currentMedications.includes(med);
                return (
                  <button
                    key={med}
                    type="button"
                    onClick={() => toggleMedication(med)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#EAFBFC] border-[#0E9EAA] text-[#073B72] ring-1 ring-[#0E9EAA]/30'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40 hover:bg-[#F5FBFD]'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-snug">{med}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#0E9EAA] border-[#0E9EAA] text-white'
                          : 'border-[#D7EAF2] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Family Health History */}
          <div className="space-y-2 pt-2 border-t border-[#E8F1F5]">
            <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide block">
              Family Health History
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FAMILY_HISTORY_OPTIONS.map((item) => {
                const isSelected = currentFamilyHistory.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFamilyHistory(item)}
                    className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E9EAA] text-white border-[#0E9EAA]'
                        : 'bg-white border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/40'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contextual Helper Card Column */}
        <div className="lg:col-span-4 space-y-3">
          <MaleWhyWeAskCard
            title="Why we ask this"
            description="High blood pressure and impaired glucose metabolism are recognized metabolic risk factors that directly co-occur with lower bioavailable testosterone and microvascular dysfunction."
            icon={HeartPulse}
          />

          <div className="p-3.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] text-[11px] text-[#55718F] space-y-1.5">
            <span className="font-bold text-[#073B72] block">Clinical Note:</span>
            <p>
              Certain medications like chronic glucocorticoids or prior exogenous hormone therapy can suppress endogenous pituitary signaling (LH/FSH). Noting them ensures balanced, context-aware screening.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
