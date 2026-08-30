import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Droplet, AlertTriangle, Check, Loader2 } from 'lucide-react';
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
        // Default end date 5 days from start date
        const defaultEnd = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(defaultEnd);
        setFlow('medium');
        setSelectedSymptoms([]);
        setNotes('');
      }
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  // Calculate duration preview
  const durationPreview =
    startDate && endDate && endDate >= startDate
      ? getDaysDifference(startDate, endDate) + 1
      : null;

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
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
      notes: notes.trim(),
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
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold font-display text-[#1C1326]">
                  {isEditing ? 'Edit Period Entry' : 'Log Your Period'}
                </h2>
                <p className="text-xs text-[#584B68]">
                  Record your period start date, end date, and flow intensity.
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
            {/* Date Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1C1326] block">
                  Period Start Date <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F5FA] border text-xs font-medium text-[#1C1326] focus:bg-white focus:outline-none transition-colors ${
                    errors.startDate ? 'border-[#FB7185] ring-1 ring-[#FB7185]' : 'border-[#E7DFEF] focus:border-[#8E3EAF]'
                  }`}
                  required
                />
                {errors.startDate && (
                  <span className="text-[11px] text-[#FB7185] font-medium block">{errors.startDate}</span>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1C1326] block">
                  Period End Date <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F5FA] border text-xs font-medium text-[#1C1326] focus:bg-white focus:outline-none transition-colors ${
                    errors.endDate ? 'border-[#FB7185] ring-1 ring-[#FB7185]' : 'border-[#E7DFEF] focus:border-[#8E3EAF]'
                  }`}
                  required
                />
                {errors.endDate && (
                  <span className="text-[11px] text-[#FB7185] font-medium block">{errors.endDate}</span>
                )}
              </div>
            </div>

            {/* Calculated Duration Pill */}
            {durationPreview !== null && (
              <div className="p-3 rounded-2xl bg-[#EDE4F7] border border-[#D8B4FE]/40 flex items-center justify-between text-xs">
                <span className="text-[#6E2D8B] font-medium">Estimated Period Duration:</span>
                <span className="font-mono font-bold text-[#6E2D8B] bg-white px-2.5 py-0.5 rounded-full">
                  {durationPreview} Day{durationPreview === 1 ? '' : 's'}
                </span>
              </div>
            )}

            {/* Menstrual Flow Intensity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1C1326] block">
                Period Flow Intensity <span className="text-[#FB7185]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
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
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'border-[#8E3EAF] ring-2 ring-[#8E3EAF]/30 bg-[#F2ECF7]'
                          : 'border-[#E7DFEF] bg-[#F8F5FA] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-0.5 text-[#FB7185]">
                        {Array.from({ length: option.iconCount }).map((_, i) => (
                          <Droplet key={i} className="w-3.5 h-3.5 fill-[#FB7185]" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#1C1326]">{option.label}</span>
                      <span className="text-[10px] text-[#8D7E9E] line-clamp-1">{option.desc}</span>
                    </button>
                  );
                })}
              </div>
              {errors.flow && (
                <span className="text-[11px] text-[#FB7185] font-medium block">{errors.flow}</span>
              )}
            </div>

            {/* Common Cycle Symptoms */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1C1326] block">
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
                          ? 'bg-[#8E3EAF] text-white shadow-xs'
                          : 'bg-[#F8F5FA] border border-[#E7DFEF] text-[#584B68] hover:bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{sym}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1326] block">
                Personal Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any details (e.g. stress levels, medication taken, cramps intensity)..."
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
