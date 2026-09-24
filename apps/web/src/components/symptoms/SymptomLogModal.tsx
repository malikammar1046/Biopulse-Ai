import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XClose, Activity, AlertTriangle, Check, Loading01, Calendar } from '@untitledui/icons';
import {
  getSymptomCatalog,
  CATEGORY_METADATA,
  type SymptomRecord,
  type SymptomRecordInput,
  type SymptomCategory,
  type SymptomSeverity,
  type SymptomDefinition,
} from '../../types/symptom';
import type { CycleRecord } from '../../types/cycle';
import { deriveCycleDayForDate } from '../../utils/symptomCalculations';

interface SymptomLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: SymptomRecordInput) => Promise<{ success: boolean; error?: string }>;
  initialData?: SymptomRecord | null;
  preselectedSymptom?: SymptomDefinition | null;
  cycleRecords: CycleRecord[];
  isMale?: boolean;
}

export const SymptomLogModal: React.FC<SymptomLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  preselectedSymptom,
  cycleRecords,
  isMale,
}) => {
  const isEditing = Boolean(initialData?.id);
  const catalog = getSymptomCatalog(Boolean(isMale));

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory>(
    isMale ? 'energy_mood' : 'cycle_body'
  );
  const [symptomType, setSymptomType] = useState(
    isMale ? 'Daytime Fatigue & Low Stamina' : 'Cramps'
  );
  const [customSymptomName, setCustomSymptomName] = useState('');
  const [severity, setSeverity] = useState<SymptomSeverity>('moderate');
  const [occurredAt, setOccurredAt] = useState('');
  const [notes, setNotes] = useState('');

  // UI State
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically calculate cycle day for the selected date (female only)
  const calculatedCycleDay = isMale ? null : deriveCycleDayForDate(occurredAt, cycleRecords);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSymptomType(initialData.symptomType);
        setSelectedCategory(initialData.category);
        setSeverity(initialData.severity);
        setOccurredAt(initialData.occurredAt);
        setNotes(initialData.notes || '');
        const isPreset = catalog.some((s) => s.name === initialData.symptomType);
        if (!isPreset) {
          setCustomSymptomName(initialData.symptomType);
        } else {
          setCustomSymptomName('');
        }
      } else if (preselectedSymptom) {
        setSymptomType(preselectedSymptom.name);
        setSelectedCategory(preselectedSymptom.category);
        setSeverity('moderate');
        setOccurredAt(new Date().toISOString().split('T')[0]);
        setNotes('');
        setCustomSymptomName('');
      } else {
        if (isMale) {
          setSymptomType('Daytime Fatigue & Low Stamina');
          setSelectedCategory('energy_mood');
        } else {
          setSymptomType('Cramps');
          setSelectedCategory('cycle_body');
        }
        setSeverity('moderate');
        setOccurredAt(new Date().toISOString().split('T')[0]);
        setNotes('');
        setCustomSymptomName('');
      }
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, preselectedSymptom, isMale]);

  const handleCategoryChange = (cat: SymptomCategory) => {
    setSelectedCategory(cat);
    const firstInCat = catalog.find((s) => s.category === cat);
    if (firstInCat) {
      setSymptomType(firstInCat.name);
      setCustomSymptomName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const finalSymptomName =
      symptomType === 'Other Symptom' && customSymptomName.trim()
        ? customSymptomName.trim()
        : symptomType;

    if (!finalSymptomName.trim()) {
      setGeneralError('Please specify the symptom name.');
      return;
    }

    if (!occurredAt) {
      setGeneralError('Please choose the date the symptom occurred.');
      return;
    }

    const input: SymptomRecordInput = {
      symptomType: finalSymptomName,
      category: selectedCategory,
      severity,
      occurredAt,
      cycleDay: calculatedCycleDay,
      notes: notes.trim(),
    };

    setIsSubmitting(true);
    try {
      const res = await onSave(input);
      if (res.success) {
        onClose();
      } else {
        setGeneralError(res.error || 'Failed to save symptom log.');
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategorySymptoms = catalog.filter((s: SymptomDefinition) => s.category === selectedCategory);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-lg rounded-2xl bg-white shadow-xl p-5 sm:p-7 text-left space-y-6 z-10 select-none my-8 max-h-[90vh] overflow-y-auto border ${
            isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl ${
                isMale ? 'bg-[#E0F2FE] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'
              }`}>
                <Activity className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  {isEditing ? 'Edit Symptom Entry' : 'Log a Symptom'}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Record clinical symptoms and daily physiological observations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Category Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0F172A] block">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_METADATA) as SymptomCategory[])
                  .filter((cat) => !(isMale && cat === 'cycle_body'))
                  .map((cat) => {
                  const meta = CATEGORY_METADATA[cat];
                  const isSelected = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? isMale
                            ? 'bg-[#0288D1] border-[#0288D1] text-white font-semibold'
                            : 'bg-[#F43F7D] border-[#F43F7D] text-white font-semibold'
                          : isMale
                            ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0288D1] hover:border-[#BAE6FD]'
                            : 'bg-[#F8FAFC] border-[#EAECF0] text-[#475569] hover:bg-[#FDE6EF]/40 hover:text-[#DC326C] hover:border-[rgba(244,63,125,0.3)]'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Symptom Chip Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0F172A] block">
                Select Symptom <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentCategorySymptoms.map((s: SymptomDefinition) => {
                  const isSelected = symptomType === s.name;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSymptomType(s.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? isMale
                            ? 'bg-[#E0F2FE] border-[#0288D1] text-[#01579B]'
                            : 'bg-[#FDE6EF] border-[#F43F7D] text-[#DC326C]'
                          : 'bg-[#F8FAFC] border-[#EAECF0] text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="text-xs font-semibold block truncate">{s.name}</span>
                      {isSelected && (
                        <Check className={`w-3.5 h-3.5 shrink-0 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {symptomType === 'Other Symptom' && (
                <div className="pt-1.5">
                  <input
                    type="text"
                    value={customSymptomName}
                    onChange={(e) => setCustomSymptomName(e.target.value)}
                    placeholder="Type custom symptom name (e.g. Lower back stiffness)..."
                    className={`w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none transition-colors ${
                      isMale ? 'focus:border-[#0288D1]' : 'focus:border-[#F43F7D]'
                    }`}
                    required
                  />
                </div>
              )}
            </div>

            {/* 3. Severity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0F172A] block">
                Intensity Level <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    value: 'mild',
                    label: 'Mild',
                    desc: 'Noticeable, minimal impact',
                    color: 'text-emerald-700',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-300',
                  },
                  {
                    value: 'moderate',
                    label: 'Moderate',
                    desc: 'Uncomfortable, affects focus',
                    color: isMale ? 'text-[#0288D1]' : 'text-[#DC326C]',
                    bg: isMale ? 'bg-[#E0F2FE]' : 'bg-[#FDE6EF]',
                    border: isMale ? 'border-[#0288D1]' : 'border-[#F43F7D]',
                  },
                  {
                    value: 'severe',
                    label: 'Severe',
                    desc: 'Significant, requires rest',
                    color: 'text-rose-700',
                    bg: 'bg-rose-50',
                    border: 'border-rose-300',
                  },
                ].map((opt) => {
                  const isSelected = severity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeverity(opt.value as SymptomSeverity)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 ${
                        isSelected
                          ? `${opt.bg} ${opt.border} ${opt.color} ring-2 ring-current/20 font-bold`
                          : 'bg-[#F8FAFC] border-[#EAECF0] text-[#475569] hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{opt.label}</span>
                      <span className="text-[10px] opacity-80 leading-tight block">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Date & Cycle Day Connection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0F172A] block">
                Observation Date <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="date"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none transition-colors ${
                    isMale ? 'focus:border-[#0288D1]' : 'focus:border-[#F43F7D]'
                  }`}
                  required
                />

                {/* Automatic Cycle Day Pill (Female Pathway Only) */}
                {!isMale && (
                  <div className="p-2 rounded-xl bg-[#FDE6EF]/40 border border-[rgba(244,63,125,0.2)] text-xs flex items-center justify-between">
                    <span className="text-[#DC326C] font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
                      Cycle Day:
                    </span>
                    <span className="font-mono font-bold text-[#DC326C]">
                      {calculatedCycleDay !== null ? `Day ${calculatedCycleDay}` : 'Not in cycle'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0F172A] block">
                Clinical Notes & Triggers (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Started after high-stress period, relieved by hydration..."
                rows={2}
                className={`w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs text-[#0F172A] focus:bg-white focus:outline-none transition-colors ${
                  isMale ? 'focus:border-[#0288D1]' : 'focus:border-[#F43F7D]'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAECF0]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border border-[#EAECF0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`h-10 px-5 rounded-xl font-medium text-sm text-white transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-sm ${
                  isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loading01 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Update Entry' : 'Save Symptom'}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
