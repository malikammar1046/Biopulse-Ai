import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';
import {
  SYMPTOM_CATALOG,
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
}

export const SymptomLogModal: React.FC<SymptomLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  preselectedSymptom,
  cycleRecords,
}) => {
  const isEditing = Boolean(initialData?.id);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory>('cycle_body');
  const [symptomType, setSymptomType] = useState('Cramps');
  const [customSymptomName, setCustomSymptomName] = useState('');
  const [severity, setSeverity] = useState<SymptomSeverity>('moderate');
  const [occurredAt, setOccurredAt] = useState('');
  const [notes, setNotes] = useState('');

  // UI State
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically calculate cycle day for the selected date
  const calculatedCycleDay = deriveCycleDayForDate(occurredAt, cycleRecords);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSymptomType(initialData.symptomType);
        setSelectedCategory(initialData.category);
        setSeverity(initialData.severity);
        setOccurredAt(initialData.occurredAt);
        setNotes(initialData.notes || '');
        const isPreset = SYMPTOM_CATALOG.some((s) => s.name === initialData.symptomType);
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
        setSymptomType('Cramps');
        setSelectedCategory('cycle_body');
        setSeverity('moderate');
        setOccurredAt(new Date().toISOString().split('T')[0]);
        setNotes('');
        setCustomSymptomName('');
      }
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, preselectedSymptom]);

  const handleCategoryChange = (cat: SymptomCategory) => {
    setSelectedCategory(cat);
    const firstInCat = SYMPTOM_CATALOG.find((s) => s.category === cat);
    if (firstInCat) {
      setSymptomType(firstInCat.name);
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

  const currentCategorySymptoms = SYMPTOM_CATALOG.filter((s) => s.category === selectedCategory);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#10071A]/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-[32px] bg-white border border-[#E7DFEF] shadow-2xl p-6 sm:p-8 text-left space-y-6 z-10 select-none my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F0EAF5]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#FDF2F8] text-[#FB7185]">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold font-display text-[#1C1326]">
                  {isEditing ? 'Edit Symptom Entry' : 'Log a Symptom'}
                </h2>
                <p className="text-xs text-[#584B68]">
                  Record how your body is feeling to spot patterns over time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#1C1326] hover:bg-[#F8F5FA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] flex items-start gap-3 text-xs text-[#9F1239]">
              <AlertTriangle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Category Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1326] block">
                Category <span className="text-[#FB7185]">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_METADATA) as SymptomCategory[]).map((cat) => {
                  const meta = CATEGORY_METADATA[cat];
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#6E2D8B] text-white font-bold shadow-xs'
                          : 'bg-[#F8F5FA] text-[#584B68] hover:bg-[#EDE4F7] hover:text-[#1C1326]'
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
              <label className="text-xs font-bold text-[#1C1326] block">
                Select Symptom <span className="text-[#FB7185]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentCategorySymptoms.map((s) => {
                  const isSelected = symptomType === s.name;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSymptomType(s.name)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#EDE4F7] border-[#8E3EAF] text-[#6E2D8B] shadow-2xs'
                          : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#1C1326] hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-semibold block truncate">{s.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#6E2D8B] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {symptomType === 'Other Symptom' && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={customSymptomName}
                    onChange={(e) => setCustomSymptomName(e.target.value)}
                    placeholder="Type custom symptom name (e.g. Lower back stiffness)..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-medium text-[#1C1326] focus:bg-white focus:outline-none focus:border-[#8E3EAF] transition-colors"
                    required
                  />
                </div>
              )}
            </div>

            {/* 3. Severity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1C1326] block">
                How strong was it? <span className="text-[#FB7185]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: 'mild',
                    label: 'Mild',
                    desc: 'Noticeable, does not disrupt day',
                    color: 'text-[#047857]',
                    bg: 'bg-[#ECFDF5]',
                  },
                  {
                    value: 'moderate',
                    label: 'Moderate',
                    desc: 'Uncomfortable / affects focus',
                    color: 'text-[#8E3EAF]',
                    bg: 'bg-[#EDE4F7]',
                  },
                  {
                    value: 'severe',
                    label: 'Severe',
                    desc: 'Significant / requires rest',
                    color: 'text-[#E11D48]',
                    bg: 'bg-[#FFF1F2]',
                  },
                ].map((opt) => {
                  const isSelected = severity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeverity(opt.value as SymptomSeverity)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 ${
                        isSelected
                          ? `${opt.bg} border-current ${opt.color} ring-2 ring-current/20 shadow-xs font-bold`
                          : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#584B68] hover:bg-white'
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
              <label className="text-xs font-bold text-[#1C1326] block">
                When did it happen? <span className="text-[#FB7185]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="date"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-medium text-[#1C1326] focus:bg-white focus:outline-none focus:border-[#8E3EAF] transition-colors"
                  required
                />

                {/* Automatic Cycle Day Pill */}
                <div className="p-2.5 rounded-2xl bg-[#EDE4F7] border border-[#D8B4FE]/40 text-xs flex items-center justify-between">
                  <span className="text-[#6E2D8B] font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8E3EAF]" />
                    Cycle Rhythm:
                  </span>
                  <span className="font-mono font-bold text-[#6E2D8B]">
                    {calculatedCycleDay !== null ? `Day ${calculatedCycleDay}` : 'Not in cycle'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1326] block">
                Anything else to remember? (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Started after spicy dinner, helped by warm tea and heating pad..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs text-[#1C1326] focus:bg-white focus:outline-none focus:border-[#8E3EAF] transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#F0EAF5]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl border border-[#E7DFEF] text-xs font-bold text-[#584B68] hover:bg-[#F8F5FA] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
