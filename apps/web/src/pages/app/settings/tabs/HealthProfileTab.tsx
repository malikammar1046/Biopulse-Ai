import React, { useState } from 'react';
import { Plus, Trash01, ActivityHeart, Check } from '@untitledui/icons';
import type { UserProfile, MedicationItem } from '../../../../types/onboarding';
import {
  DEFAULT_ALLERGY_OPTIONS,
  DEFAULT_CONDITION_OPTIONS,
  DEFAULT_MALE_CONDITION_OPTIONS,
} from '../../../../data/mockOnboardingData';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

const FEMALE_FAMILY_CONDITIONS = [
  'Type 2 Diabetes',
  'Hypertension',
  'Polycystic Ovary Syndrome (PCOS)',
  'Thyroid Disorder',
  'Cardiovascular Disease',
  'Early Heart Attack',
];

const MALE_FAMILY_CONDITIONS = [
  'Type 2 Diabetes',
  'Hypertension',
  'Low Testosterone / Hypogonadism',
  'Thyroid Disorder',
  'Cardiovascular Disease',
  'Early Heart Attack',
];

interface HealthProfileTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
  isMale: boolean;
}

export const HealthProfileTab: React.FC<HealthProfileTabProps> = ({
  draft,
  setDraft,
  isMale,
}) => {
  const [customCondition, setCustomCondition] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');
  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('Daily');

  // Condition toggling
  const toggleCondition = (cond: string) => {
    const list = [...(draft.medical?.conditions || [])];
    if (cond === 'None') {
      setDraft((p) => ({ ...p, medical: { ...p.medical, conditions: ['None'] } }));
      return;
    }
    const filtered = list.filter((c) => c !== 'None');
    if (filtered.includes(cond)) {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, conditions: filtered.filter((c) => c !== cond) },
      }));
    } else {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, conditions: [...filtered, cond] },
      }));
    }
  };

  const addCustomCondition = () => {
    if (!customCondition.trim()) return;
    const list = (draft.medical?.conditions || []).filter((c) => c !== 'None');
    if (!list.includes(customCondition.trim())) {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, conditions: [...list, customCondition.trim()] },
      }));
    }
    setCustomCondition('');
  };

  // Allergy toggling
  const toggleAllergy = (allergy: string) => {
    const list = [...(draft.medical?.allergies || [])];
    if (allergy === 'None') {
      setDraft((p) => ({ ...p, medical: { ...p.medical, allergies: ['None'] } }));
      return;
    }
    const filtered = list.filter((a) => a !== 'None');
    if (filtered.includes(allergy)) {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, allergies: filtered.filter((a) => a !== allergy) },
      }));
    } else {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, allergies: [...filtered, allergy] },
      }));
    }
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    const list = (draft.medical?.allergies || []).filter((a) => a !== 'None');
    if (!list.includes(customAllergy.trim())) {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, allergies: [...list, customAllergy.trim()] },
      }));
    }
    setCustomAllergy('');
  };

  // Medication handlers
  const handleAddMed = () => {
    if (!medName.trim()) return;
    const newMed: MedicationItem = {
      id: `med_${Date.now()}`,
      name: medName.trim(),
      dosage: medDosage.trim() || 'Standard Dose',
      frequency: medFreq.trim() || 'Daily',
      takenToday: false,
    };
    setDraft((p) => ({
      ...p,
      medical: {
        ...p.medical,
        medications: [...(p.medical?.medications || []), newMed],
      },
    }));
    setMedName('');
    setMedDosage('');
    setMedFreq('Daily');
    setShowAddMed(false);
  };

  const removeMed = (id: string) => {
    setDraft((p) => ({
      ...p,
      medical: {
        ...p.medical,
        medications: (p.medical?.medications || []).filter((m) => m.id !== id),
      },
    }));
  };

  // Family history toggle
  const toggleFamilyHistory = (cond: string) => {
    const list = [...(draft.medical?.familyHistory || [])];
    if (list.includes(cond)) {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, familyHistory: list.filter((c) => c !== cond) },
      }));
    } else {
      setDraft((p) => ({
        ...p,
        medical: { ...p.medical, familyHistory: [...list, cond] },
      }));
    }
  };

  const conditionsList = draft.medical?.conditions || [];
  const allergiesList = draft.medical?.allergies || [];
  const familyList = draft.medical?.familyHistory || [];

  return (
    <div className="space-y-6">
      {/* 1. Blood Type & Diagnosed Conditions */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Clinical Baseline & Conditions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified clinical diagnoses and metabolic factors
            </p>
          </div>
        </div>

        {/* Blood Type */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Blood Type
          </label>
          <div className="flex flex-wrap gap-2">
            {BLOOD_TYPES.map((bt) => {
              const isSelected = (draft.medical?.bloodType || '') === bt;
              return (
                <button
                  key={bt}
                  type="button"
                  onClick={() =>
                    setDraft((p) => ({ ...p, medical: { ...p.medical, bloodType: bt } }))
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs ring-1 ring-[#0288D1]/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {bt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Diagnosed Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-slate-800">
                Diagnosed Medical Conditions
              </label>
              <p className="text-[11px] text-slate-500">
                Select any formal diagnoses confirmed by a healthcare provider.
              </p>
            </div>
            {isMale && (
              <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                Hypertension & Diabetes feed screening
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3">
            {(isMale ? DEFAULT_MALE_CONDITION_OPTIONS : DEFAULT_CONDITION_OPTIONS).map((c) => {
              const isSelected = conditionsList.includes(c);
              const isHypogonadismFeature =
                isMale && (c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('diabetes'));

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#F0F9FF] border-[#0288D1] ring-1.5 ring-[#0288D1] shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className={`text-xs leading-snug ${isSelected ? 'font-bold text-[#01579B]' : 'font-medium text-slate-700'}`}>
                      {c}
                    </p>
                    {isHypogonadismFeature && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium mt-1 ${isSelected ? 'text-[#0288D1]' : 'text-[#0369A1]'}`}>
                        <ActivityHeart className="w-2.5 h-2.5" aria-hidden="true" /> Screening risk factor
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                      isSelected
                        ? 'bg-[#0288D1] border-[#0288D1] text-white shadow-xs'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" aria-hidden="true" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add custom condition */}
          <div className="flex items-center gap-2 mt-3 max-w-md">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder="Other condition..."
              onKeyDown={(e) => e.key === 'Enter' && addCustomCondition()}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0288D1] flex-1"
            />
            <button
              type="button"
              onClick={addCustomCondition}
              disabled={!customCondition.trim()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium disabled:opacity-40 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* 2. Allergies & Nutrition Safety */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Allergies & Intolerances</h3>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Guards Nutrition Safety
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified food allergies automatically filter meal plan ingredients
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {DEFAULT_ALLERGY_OPTIONS.map((alg) => {
            const isSelected = allergiesList.includes(alg);
            return (
              <button
                key={alg}
                type="button"
                onClick={() => toggleAllergy(alg)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-rose-100/90 text-rose-900 border-rose-300 ring-1 ring-rose-300 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-rose-700 stroke-[2.5]" aria-hidden="true" />}
                <span>{alg}</span>
              </button>
            );
          })}
        </div>

        {/* Add custom allergy */}
        <div className="flex items-center gap-2 mt-3 max-w-md">
          <input
            type="text"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            placeholder="Add specific food allergy..."
            onKeyDown={(e) => e.key === 'Enter' && addCustomAllergy()}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1] flex-1"
          />
          <button
            type="button"
            onClick={addCustomAllergy}
            disabled={!customAllergy.trim()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium disabled:opacity-40 cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* 3. Current Medications */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Current Medications & Supplements</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active prescriptions and daily supplements
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMed(!showAddMed)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E0F2FE] text-[#0288D1] hover:bg-[#BAE6FD] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Medication</span>
          </button>
        </div>

        {/* Add Med Form */}
        {showAddMed && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Medication name (e.g. Metformin)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1]"
              />
              <input
                type="text"
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 500mg)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1]"
              />
              <select
                value={medFreq}
                onChange={(e) => setMedFreq(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1] text-slate-700"
              >
                <option value="Daily">Daily</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="As Needed">As Needed</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMed(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMed}
                disabled={!medName.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0288D1] text-white rounded-lg hover:bg-[#0277BD] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Save Medication
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {(draft.medical?.medications || []).length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No active medications or supplements recorded.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draft.medical?.medications.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{m.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {m.dosage} • {m.frequency}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMed(m.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash01 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Family History */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-1">Family Health History</h3>
        <p className="text-xs text-slate-400 mb-4">
          Conditions observed in immediate family members (parents or siblings)
        </p>

        <div className="flex flex-wrap gap-2">
          {(isMale ? MALE_FAMILY_CONDITIONS : FEMALE_FAMILY_CONDITIONS).map((cond) => {
            const isSelected = familyList.includes(cond);

            return (
              <button
                key={cond}
                type="button"
                onClick={() => toggleFamilyHistory(cond)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F0F9FF] text-[#01579B] border-[#0288D1] ring-1 ring-[#0288D1] font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-[#0288D1] stroke-[2.5]" aria-hidden="true" />}
                <span>{cond}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
