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
    <div className="space-y-4 text-left max-w-4xl mx-auto">
      {/* ── Compact Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
            <MedicalCross className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-[10px] font-bold font-mono text-[#0288D1] uppercase tracking-wider block leading-none">
              Health Profile
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
              Medical History &amp; Lifestyle Factors
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger onClick={() => setShowWhyModal(true)} accentColor="blue" />
      </div>

      <p className="text-xs text-[#55718F] font-sans leading-tight">
        All fields here are optional. Sharing your baseline helps BioPulse AI personalize your clinical insights.
      </p>

      {/* ── Main Form Inputs (Full Width) ── */}
      <div className="w-full space-y-3">
          {/* 1. Blood Type */}
          <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                <ActivityHeart className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                Blood Type
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DDF7F7] text-[#0E9EAA] font-semibold">
                Optional
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {BLOOD_TYPES.map((bt) => {
                const isSelected = data.bloodType === bt;
                return (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => onChange({ ...data, bloodType: bt })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F43F7D] text-white shadow-2xs'
                        : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:border-[#0E9EAA]/50 hover:text-[#073B72]'
                    }`}
                  >
                    {bt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Known Allergies */}
          <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                Known Allergies
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DDF7F7] text-[#0E9EAA] font-semibold">
                Optional
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_ALLERGY_OPTIONS.map((allergy) => {
                const isSelected = data.allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#E0F2FE] text-[#0288D1] border border-[#0288D1] font-bold shadow-2xs'
                        : 'bg-white border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />}
                    <span>{allergy}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-0.5">
              <input
                type="text"
                placeholder="Add other allergy (e.g. Ibuprofen)"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
                className="flex-1 h-8 px-3 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-3 h-8 rounded-lg bg-[#0E9EAA] hover:bg-[#0C8B96] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* 3. Current Medications & Supplements */}
          <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                <MedicalCross className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                Current Medications & Supplements
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DDF7F7] text-[#0E9EAA] font-semibold">
                Optional
              </span>
            </div>

            {data.medications.length > 0 && (
              <div className="space-y-1.5">
                {data.medications.map((med) => (
                  <div
                    key={med.id}
                    className="p-2 rounded-lg bg-white border border-[#D7EAF2] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#073B72] block leading-tight">{med.name}</span>
                      <span className="text-[10px] text-[#55718F]">
                        {med.dosage} • {med.frequency}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedication(med.id)}
                      className="p-1 text-slate-400 hover:text-[#0288D1] transition-colors cursor-pointer"
                    >
                      <XClose className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showAddMedForm ? (
              <button
                type="button"
                onClick={() => setShowAddMedForm(true)}
                className="w-full py-1.5 px-3 rounded-lg border border-dashed border-[#D7EAF2] hover:border-[#0E9EAA] text-xs font-semibold text-[#0E9EAA] flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
              >
                <Plus className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                <span>Add Medication / Supplement (e.g. Inositol, Metformin)</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-lg bg-white border border-[#D7EAF2] space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Medication name"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-[#FAFCFF] border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-[#FAFCFF] border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. Daily)"
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-[#FAFCFF] border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMedForm(false)}
                    className="px-2.5 py-1 rounded-md text-xs text-[#55718F] hover:text-[#073B72]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-3 py-1 rounded-md bg-[#F43F7D] hover:bg-[#E11D48] text-xs font-bold text-white cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Diagnosed Conditions & Family History in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Conditions */}
            <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                <MedicalCross className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                Diagnosed Conditions
              </span>
              <div className="flex flex-wrap gap-1">
                {DEFAULT_CONDITION_OPTIONS.slice(0, 6).map((cond) => {
                  const isSelected = data.conditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] text-[#0288D1] border border-[#0288D1] font-bold'
                          : 'bg-white border border-[#D7EAF2] text-[#55718F]'
                      }`}
                    >
                      {cond.split(' (')[0]}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1.5 pt-0.5">
                <input
                  type="text"
                  placeholder="Other condition..."
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCondition())}
                  className="flex-1 h-7 px-2 rounded-md bg-white border border-[#D7EAF2] text-[11px] text-[#073B72] placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomCondition}
                  className="px-2 h-7 rounded-md bg-[#0E9EAA] text-[11px] font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Family History */}
            <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                <ActivityHeart className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                Family History
              </span>
              <div className="flex flex-wrap gap-1">
                {DEFAULT_FAMILY_HISTORY_OPTIONS.map((item) => {
                  const isSelected = data.familyHistory.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleFamilyHistory(item)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] text-[#0288D1] border border-[#0288D1] font-bold'
                          : 'bg-white border border-[#D7EAF2] text-[#55718F]'
                      }`}
                    >
                      {item.split(' (')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Lifestyle Factors Evaluated by ML Model */}
          {lifestyle && onLifestyleChange && (
            <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                  <ActivityHeart className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                  Lifestyle Factors (Model Indicators)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] font-semibold">
                  ML Evaluated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Fast Food Intake */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#073B72] flex items-center gap-1">
                    <Scales01 className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                    <span>Fast-Food Intake</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1">
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
                          className={`py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold ${
                            isSelected
                              ? 'bg-[#E0F2FE] border-[#0288D1] text-[#0288D1]'
                              : 'bg-white border-[#D7EAF2] text-[#55718F]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Regular Exercise */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#073B72] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#0E9EAA]" aria-hidden="true" />
                    <span>Regular Physical Exercise</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onLifestyleChange({ ...lifestyle, regularExercise: true, activityLevel: 'moderate' })
                      }
                      className={`py-1 px-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold ${
                        lifestyle.regularExercise !== false
                          ? 'bg-[#DDF7F7] border-[#0E9EAA] text-[#073B72]'
                          : 'bg-white border-[#D7EAF2] text-[#55718F]'
                      }`}
                    >
                      Yes (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLifestyleChange({ ...lifestyle, regularExercise: false, activityLevel: 'sedentary' })
                      }
                      className={`py-1 px-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-bold ${
                        lifestyle.regularExercise === false
                          ? 'bg-[#FDE6EF] border-[#F43F7D] text-[#F43F7D]'
                          : 'bg-white border-[#D7EAF2] text-[#55718F]'
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
        <div className="p-3.5 rounded-xl bg-[#F0F8FF] border border-[#BAE6FD]">
          <span className="font-bold text-[#0288D1] block mb-1">Clinical Baseline</span>
          <p>
            Certain health conditions, medications, and lifestyle patterns provide critical context for distinguishing PCOS indicators from metabolic or endocrine overlaps.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
