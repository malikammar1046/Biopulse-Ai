import React, { useState } from 'react';
import { Plus, X, Stethoscope, Pill, AlertCircle, HeartPulse, Check } from 'lucide-react';
import type { MedicalProfile, MedicationItem } from '../../types/onboarding';
import {
  DEFAULT_ALLERGY_OPTIONS,
  DEFAULT_CONDITION_OPTIONS,
  DEFAULT_FAMILY_HISTORY_OPTIONS,
} from '../../data/mockOnboardingData';

interface Step3Props {
  data: MedicalProfile;
  onChange: (medical: MedicalProfile) => void;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

export const Step3MedicalInfo: React.FC<Step3Props> = ({ data, onChange }) => {
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
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Medical Background & History.
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          All fields in this section are optional. Sharing your baseline helps OvaSense personalize symptom correlations and reminders.
        </p>
      </div>

      {/* 1. Blood Type */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-3.5 h-3.5 text-[#FB7185]" />
            Blood Type
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
            Optional
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {BLOOD_TYPES.map((bt) => {
            const isSelected = data.bloodType === bt;
            return (
              <button
                key={bt}
                type="button"
                onClick={() => onChange({ ...data, bloodType: bt })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] text-white shadow-md scale-105'
                    : 'bg-[#140924] border border-white/15 text-[#CDBDD8] hover:text-white hover:bg-white/10'
                }`}
              >
                {bt}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Known Allergies */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#FDA4AF]" />
            Known Allergies
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white shadow'
                    : 'bg-[#140924] border border-white/15 text-[#B4A6C7] hover:text-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{allergy}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Allergy Input */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Add other allergy (e.g. Ibuprofen)"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#140924] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#8E3EAF]"
          />
          <button
            type="button"
            onClick={addCustomAllergy}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* 3. Current Medications & Supplements */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-3.5 h-3.5 text-[#34D399]" />
            Current Medications & Supplements
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
            Optional
          </span>
        </div>

        {/* Existing Meds List */}
        {data.medications.length > 0 && (
          <div className="space-y-2">
            {data.medications.map((med) => (
              <div
                key={med.id}
                className="p-3 rounded-2xl bg-[#140924] border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-bold text-white block">{med.name}</span>
                  <span className="text-[11px] text-[#A797BD]">
                    {med.dosage} • {med.frequency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMedication(med.id)}
                  className="p-1 text-white/40 hover:text-[#FB7185] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!showAddMedForm ? (
          <button
            type="button"
            onClick={() => setShowAddMedForm(true)}
            className="w-full p-2.5 rounded-2xl border border-dashed border-white/20 hover:border-[#34D399] text-xs font-semibold text-[#EDE4F7] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Add a Medication or Supplement (e.g. Inositol, Metformin)</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#140924] border border-white/15 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Medication name"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#1C0D2E] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 500mg)"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#1C0D2E] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Frequency (e.g. Daily)"
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#1C0D2E] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMedForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#A797BD] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-3.5 py-1.5 rounded-xl bg-[#8E3EAF] hover:bg-[#A21CAF] text-xs font-bold text-white cursor-pointer"
              >
                Save Medication
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Existing Conditions */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-[#C084FC]" />
            Diagnosed Conditions
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
            Optional
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DEFAULT_CONDITION_OPTIONS.map((cond) => {
            const isSelected = data.conditions.includes(cond);
            return (
              <button
                key={cond}
                type="button"
                onClick={() => toggleCondition(cond)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white shadow'
                    : 'bg-[#140924] border border-white/15 text-[#B4A6C7] hover:text-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{cond}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Add custom condition (e.g. Migraine)"
            value={customCondition}
            onChange={(e) => setCustomCondition(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCondition())}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#140924] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#8E3EAF]"
          />
          <button
            type="button"
            onClick={addCustomCondition}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* 5. Family History */}
      <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-3.5 h-3.5 text-[#FDA4AF]" />
            Family History
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
            Optional
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DEFAULT_FAMILY_HISTORY_OPTIONS.map((item) => {
            const isSelected = data.familyHistory.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleFamilyHistory(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white shadow'
                    : 'bg-[#140924] border border-white/15 text-[#B4A6C7] hover:text-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{item}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
