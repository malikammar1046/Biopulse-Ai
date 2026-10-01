import React, { useState } from 'react';
import {
  MedicalCross,
  AlertCircle,
  ActivityHeart,
  Check,
  Plus,
  XClose,
  Scales01,
  Activity,
} from '@untitledui/icons';
import type { MedicalProfile, MedicationItem, LifestyleProfile } from '../../../types/onboarding';
import {
  DEFAULT_ALLERGY_OPTIONS,
  DEFAULT_CONDITION_OPTIONS,
  DEFAULT_FAMILY_HISTORY_OPTIONS,
} from '../../../data/mockOnboardingData';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';

interface FemaleStep2Props {
  data: MedicalProfile;
  onChange: (medical: MedicalProfile) => void;
  lifestyle?: LifestyleProfile;
  onLifestyleChange?: (lifestyle: LifestyleProfile) => void;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

export const FemaleStep2MedicalHistory: React.FC<FemaleStep2Props> = ({
  data,
  onChange,
  lifestyle,
  onLifestyleChange,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [showAddMedForm, setShowAddMedForm] = useState(false);

  const toggleAllergy = (allergy: string) => {
    const list = [...data.allergies];
    if (allergy === 'None') {
      onChange({ ...data, allergies: ['None'] });
      return;
    }
    const filtered = list.filter((a) => a !== 'None');
    if (filtered.includes(allergy)) {
      onChange({ ...data, allergies: filtered.filter((a) => a !== allergy) });
    } else {
      onChange({ ...data, allergies: [...filtered, allergy] });
    }
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    const filtered = data.allergies.filter((a) => a !== 'None');
    if (!filtered.includes(customAllergy.trim())) {
      onChange({ ...data, allergies: [...filtered, customAllergy.trim()] });
    }
    setCustomAllergy('');
  };

  const toggleCondition = (condition: string) => {
    const list = [...data.conditions];
    if (condition === 'None') {
      onChange({ ...data, conditions: ['None'] });
      return;
    }
    const filtered = list.filter((c) => c !== 'None');
    if (filtered.includes(condition)) {
      onChange({ ...data, conditions: filtered.filter((c) => c !== condition) });
    } else {
      onChange({ ...data, conditions: [...filtered, condition] });
    }
  };

  const addCustomCondition = () => {
    if (!customCondition.trim()) return;
    const filtered = data.conditions.filter((c) => c !== 'None');
    if (!filtered.includes(customCondition.trim())) {
      onChange({ ...data, conditions: [...filtered, customCondition.trim()] });
    }
    setCustomCondition('');
  };

  const toggleFamilyHistory = (item: string) => {
    const list = [...data.familyHistory];
    if (item === 'None') {
      onChange({ ...data, familyHistory: ['None'] });
      return;
    }
    const filtered = list.filter((f) => f !== 'None');
    if (filtered.includes(item)) {
      onChange({ ...data, familyHistory: filtered.filter((f) => f !== item) });
    } else {
      onChange({ ...data, familyHistory: [...filtered, item] });
    }
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    const newItem: MedicationItem = {
      id: `med_${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || 'Standard Dose',
      frequency: newMedFreq.trim() || 'Daily',
    };
    onChange({ ...data, medications: [...data.medications, newItem] });
    setNewMedName('');
    setNewMedDosage('');
    setNewMedFreq('');
    setShowAddMedForm(false);
  };

  const removeMedication = (id: string) => {
    onChange({ ...data, medications: data.medications.filter((m) => m.id !== id) });
  };

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
            <MedicalCross className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#0288D1] uppercase tracking-wider block leading-none">
              Health Profile
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              Medical History &amp; Lifestyle Factors
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger onClick={() => setShowWhyModal(true)} accentColor="blue" />
      </div>

      <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
        All fields here are optional. Sharing your baseline helps BioPulse AI personalize your clinical insights.
      </p>

      {/* ── Main Form Inputs (Full Width) ── */}
      <div className="w-full space-y-4 sm:space-y-4.5">
          {/* 1. Blood Type */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <ActivityHeart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                Blood Group
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF7F7] text-[#0E9EAA]">
                Optional
              </span>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {BLOOD_TYPES.map((bt) => {
                const isSelected = data.bloodType === bt;
                return (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => onChange({ ...data, bloodType: bt })}
                    className={`h-[46px] min-w-[56px] px-4 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0288D1] text-white shadow-xs scale-[1.02]'
                        : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:border-[#0288D1]/50 hover:text-[#073B72] hover:bg-[#F8FDFF]'
                    }`}
                  >
                    {bt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Known Allergies */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                Known Allergies
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF7F7] text-[#0E9EAA]">
                Optional
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DEFAULT_ALLERGY_OPTIONS.map((allergy) => {
                const isSelected = data.allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`min-h-[44px] px-4 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#E0F2FE] text-[#0288D1] border-2 border-[#0288D1] font-bold shadow-2xs'
                        : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72] hover:border-[#0288D1]/40'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />}
                    <span>{allergy}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2.5 pt-1">
              <input
                type="text"
                placeholder="Add other allergy (e.g. Ibuprofen, Penicillin)"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
                className="flex-1 h-11 sm:h-12 px-4 rounded-xl bg-white border border-[#D7EAF2] text-[14px] sm:text-[15px] text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1]"
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-5 h-11 sm:h-12 rounded-xl bg-[#0E9EAA] hover:bg-[#0C8B96] text-[14px] font-bold text-white transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* 3. Current Medications & Supplements */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <MedicalCross className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                Current Medications &amp; Supplements
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF7F7] text-[#0E9EAA]">
                Optional
              </span>
            </div>

            {data.medications.length > 0 && (
              <div className="space-y-2">
                {data.medications.map((med) => (
                  <div
                    key={med.id}
                    className="p-3.5 rounded-xl bg-white border border-[#D7EAF2] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <span className="text-[14px] sm:text-[15px] font-bold text-[#073B72] block leading-tight">{med.name}</span>
                      <span className="text-[13px] text-[#55718F]">
                        {med.dosage} • {med.frequency}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedication(med.id)}
                      className="p-1.5 text-slate-400 hover:text-[#0288D1] transition-colors cursor-pointer"
                    >
                      <XClose className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showAddMedForm ? (
              <button
                type="button"
                onClick={() => setShowAddMedForm(true)}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl border border-dashed border-[#B2EBF2] hover:border-[#0E9EAA] text-[14px] sm:text-[15px] font-semibold text-[#0E9EAA] flex items-center justify-center gap-2 transition-colors cursor-pointer bg-white"
              >
                <Plus className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
                <span>Add Medication / Supplement (e.g. Inositol, Metformin, Vitamin D)</span>
              </button>
            ) : (
              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#D7EAF2] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Medication name"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="h-11 px-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] text-[14px] text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:border-[#0288D1]"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="h-11 px-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] text-[14px] text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:border-[#0288D1]"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. Daily)"
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="h-11 px-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] text-[14px] text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:border-[#0288D1]"
                  />
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddMedForm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#55718F] hover:text-[#073B72]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-5 py-2 rounded-xl bg-[#0288D1] hover:bg-[#01579B] text-sm font-bold text-white cursor-pointer shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Diagnosed Conditions & Family History in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Conditions */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
              <span className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <MedicalCross className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                Diagnosed Conditions
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CONDITION_OPTIONS.slice(0, 6).map((cond) => {
                  const isSelected = data.conditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-[13px] sm:text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#E0F2FE] text-[#0288D1] border-2 border-[#0288D1] font-bold shadow-2xs'
                          : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />}
                      <span>{cond.split(' (')[0]}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Other condition..."
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCondition())}
                  className="flex-1 h-11 px-3.5 rounded-xl bg-white border border-[#D7EAF2] text-[14px] text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:border-[#0288D1]"
                />
                <button
                  type="button"
                  onClick={addCustomCondition}
                  className="px-4 h-11 rounded-xl bg-[#0E9EAA] text-[13px] font-bold text-white cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Family History */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
              <span className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                <ActivityHeart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                Family History
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_FAMILY_HISTORY_OPTIONS.map((item) => {
                  const isSelected = data.familyHistory.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleFamilyHistory(item)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-[13px] sm:text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#E0F2FE] text-[#0288D1] border-2 border-[#0288D1] font-bold shadow-2xs'
                          : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />}
                      <span>{item.split(' (')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Lifestyle Factors Evaluated by ML Model */}
          {lifestyle && onLifestyleChange && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[15px] sm:text-[16px] font-bold font-sans text-[#073B72] flex items-center gap-2">
                  <ActivityHeart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                  Lifestyle Factors (Model Indicators)
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1]">
                  ML Evaluated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fast Food Intake */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-[#073B72] flex items-center gap-1.5">
                    <Scales01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                    <span>Fast-Food Intake</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'frequent', label: 'Frequent' },
                      { id: 'occasional', label: 'Occasional' },
                      { id: 'rare_never', label: 'Rare/Never' },
                    ].map((opt) => {
                      const isSelected = (lifestyle.fastFoodIntake || 'occasional') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onLifestyleChange({ ...lifestyle, fastFoodIntake: opt.id as any })}
                          className={`min-h-[48px] py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer text-[13px] sm:text-[14px] font-bold ${
                            isSelected
                              ? 'bg-[#E0F2FE] border-2 border-[#0288D1] text-[#0288D1] shadow-2xs'
                              : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Regular Exercise */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-[#073B72] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
                    <span>Regular Physical Exercise</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onLifestyleChange({ ...lifestyle, regularExercise: true, activityLevel: 'moderate' })
                      }
                      className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer text-[14px] font-bold ${
                        lifestyle.regularExercise !== false
                          ? 'bg-[#DDF7F7] border-2 border-[#0E9EAA] text-[#073B72] shadow-2xs'
                          : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                      }`}
                    >
                      Yes (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLifestyleChange({ ...lifestyle, regularExercise: false, activityLevel: 'sedentary' })
                      }
                      className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer text-[14px] font-bold ${
                        lifestyle.regularExercise === false
                          ? 'bg-[#FDE6EF] border-2 border-[#F43F7D] text-[#F43F7D] shadow-2xs'
                          : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                      }`}
                    >
                      No (Sedentary)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Why we ask about medical history"
        icon={MedicalCross}
        accentColor="blue"
      >
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#F0F8FF] border border-[#BAE6FD]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#0288D1] block mb-1">Clinical Baseline</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            Certain health conditions, medications, and lifestyle patterns provide critical context for distinguishing PCOS indicators from metabolic or endocrine overlaps.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
