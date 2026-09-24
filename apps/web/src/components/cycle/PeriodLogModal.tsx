import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XClose, Calendar, Drop, AlertTriangle, Check, RefreshCw01 } from '@untitledui/icons';
import type { CycleRecord, CycleRecordInput, MenstrualFlow } from '../../types/cycle';
import { validateCycleRecord } from '../../utils/cycleValidation';
import { getDaysDifference } from '../../utils/cycleCalculations';

interface PeriodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CycleRecordInput) => Promise<{ success: boolean; error?: string }>;
  initialData?: CycleRecord | null;
  existingRecords: CycleRecord[];
}

const COMMON_CYCLE_SYMPTOMS = [
  'Cramps / Pelvic pain',
  'Bloating',
  'Fatigue / Low energy',
  'Headache',
  'Lower backache',
  'Acne flare',
  'Breast tenderness',
  'Mood swings',
  'Spotting',
  'Nausea',
];

export const PeriodLogModal: React.FC<PeriodLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingRecords,
}) => {
  const isEditing = Boolean(initialData?.id);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flow, setFlow] = useState<MenstrualFlow>('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // UI / Async State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setStartDate(initialData.periodStartDate);
        setEndDate(initialData.periodEndDate);
        setFlow(initialData.flow);
        setSelectedSymptoms(initialData.symptoms || []);
        setNotes(initialData.notes || '');
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate('');
        setFlow('medium');
        setSelectedSymptoms([]);
        setNotes('');
      }
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  // Derived duration preview
  const durationPreview =
    startDate && endDate && startDate <= endDate
      ? getDaysDifference(startDate, endDate) + 1
      : null;

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const input: CycleRecordInput = {
      periodStartDate: startDate,
      periodEndDate: endDate,
      flow,
      symptoms: selectedSymptoms,
      notes: notes.trim() || undefined,
    };

    const validation = validateCycleRecord(input, existingRecords, initialData?.id);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.errors.general) {
        setGeneralError(validation.errors.general);
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await onSave(input);
      if (result.success) {
        onClose();
      } else {
        setGeneralError(result.error || 'Failed to save period record. Please try again.');
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-2xl bg-white border border-[#EAECF0] shadow-xl p-6 sm:p-8 text-left space-y-6 z-10 select-none my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#F43F7D] shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold font-display text-[#0F172A]">
                  {isEditing ? 'Edit Period Entry' : 'Log Your Period'}
                </h2>
                <p className="text-xs text-[#475569]">
                  Record your period start date, end date, and flow intensity.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3 text-xs text-[#991B1B]">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] block">
                  Period Start Date <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full h-10 px-3.5 rounded-lg bg-[#F8FAFC] border text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none transition-colors ${
                    errors.startDate ? 'border-[#DC2626] ring-1 ring-[#DC2626]' : 'border-[#EAECF0] focus:border-[#F43F7D] focus:ring-2 focus:ring-[#F43F7D]/20'
                  }`}
                  required
                />
                {errors.startDate && (
                  <span className="text-[11px] text-[#DC2626] font-medium block">{errors.startDate}</span>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] block">
                  Period End Date <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full h-10 px-3.5 rounded-lg bg-[#F8FAFC] border text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none transition-colors ${
                    errors.endDate ? 'border-[#DC2626] ring-1 ring-[#DC2626]' : 'border-[#EAECF0] focus:border-[#F43F7D] focus:ring-2 focus:ring-[#F43F7D]/20'
                  }`}
                  required
                />
                {errors.endDate && (
                  <span className="text-[11px] text-[#DC2626] font-medium block">{errors.endDate}</span>
                )}
              </div>
            </div>

            {/* Calculated Duration Pill */}
            {durationPreview !== null && (
              <div className="p-3 rounded-xl bg-[#FDE6EF]/40 border border-[#FDE6EF] flex items-center justify-between text-xs">
                <span className="text-[#DC326C] font-medium">Estimated Period Duration:</span>
                <span className="font-mono font-bold text-[#F43F7D] bg-white px-2.5 py-0.5 rounded-full border border-[#FDE6EF]">
                  {durationPreview} Day{durationPreview === 1 ? '' : 's'}
                </span>
              </div>
            )}

            {/* Menstrual Flow Intensity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A] block">
                Period Flow Intensity <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { value: 'light', label: 'Light', desc: 'Minimal bleeding / Spotting', iconCount: 1 },
                  { value: 'medium', label: 'Medium', desc: 'Standard regular flow', iconCount: 2 },
                  { value: 'heavy', label: 'Heavy', desc: 'Heavy flow requiring frequent changes', iconCount: 3 },
                ].map((option) => {
                  const isSelected = flow === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFlow(option.value as MenstrualFlow)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'border-[#F43F7D] ring-2 ring-[#F43F7D]/20 bg-[#FDE6EF]/30'
                          : 'border-[#EAECF0] bg-[#F8FAFC] hover:bg-white hover:border-[#F43F7D]/30'
                      }`}
                    >
                      <div className="flex items-center gap-0.5 text-[#F43F7D]">
                        {Array.from({ length: option.iconCount }).map((_, i) => (
                          <Drop key={i} className="w-3.5 h-3.5 fill-[#F43F7D]" aria-hidden="true" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#0F172A]">{option.label}</span>
                      <span className="text-[10px] text-[#64748B] line-clamp-1">{option.desc}</span>
                    </button>
                  );
                })}
              </div>
              {errors.flow && (
                <span className="text-[11px] text-[#DC2626] font-medium block">{errors.flow}</span>
              )}
            </div>

            {/* Common Cycle Symptoms */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A] block">
                Associated Symptoms (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_CYCLE_SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#F43F7D] text-white shadow-xs font-semibold'
                          : 'bg-[#F8FAFC] border border-[#EAECF0] text-[#475569] hover:bg-white hover:border-[#F43F7D]/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" aria-hidden="true" />}
                      <span>{sym}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] block">
                Personal Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any details (e.g. stress levels, medication taken, cramps intensity)..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#EAECF0] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#F43F7D] focus:ring-2 focus:ring-[#F43F7D]/20 transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAECF0]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-lg border border-[#EAECF0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-lg font-medium text-xs text-white bg-[#F43F7D] hover:bg-[#DC326C] shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw01 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Update Record' : 'Save Period Log'}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
