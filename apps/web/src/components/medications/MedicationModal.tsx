import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pill, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MedicationItem, MedicationInput, MedicationFrequency } from '../../types/medication';

interface MedicationModalProps {
  isOpen: boolean;
  editingMedication?: MedicationItem | null;
  onClose: () => void;
  onSave: (input: MedicationInput) => Promise<{ success: boolean; error?: string }>;
}

const COMMON_SUPPLEMENTS = [
  'Metformin',
  'Myo-Inositol',
  'Vitamin D3',
  'Spironolactone',
  'CoQ10',
  'Omega-3 Fish Oil',
  'Magnesium Glycinate',
  'Spearmint',
];

const UNIT_OPTIONS = ['mg', 'mcg', 'IU', 'tablet', 'capsule', 'sachet', 'drops', 'ml'];

const FREQUENCY_OPTIONS: { key: MedicationFrequency; label: string; defaultTimes: string[] }[] = [
  { key: 'once_daily', label: 'Once a day', defaultTimes: ['08:00'] },
  { key: 'twice_daily', label: 'Twice a day', defaultTimes: ['08:00', '20:00'] },
  { key: 'three_times_daily', label: 'Three times a day', defaultTimes: ['08:00', '13:00', '20:00'] },
  { key: 'every_other_day', label: 'Every other day', defaultTimes: ['08:00'] },
  { key: 'as_needed', label: 'As needed', defaultTimes: ['08:00'] },
];

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  editingMedication,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState<MedicationFrequency>('once_daily');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (editingMedication) {
      setName(editingMedication.name);
      setDose(editingMedication.dose);
      setUnit(editingMedication.unit);
      setFrequency(editingMedication.frequency);
      setScheduledTimes(editingMedication.scheduledTimes);
      setStartDate(editingMedication.startDate);
      setEndDate(editingMedication.endDate || '');
      setNotes(editingMedication.notes || '');
    } else {
      setName('');
      setDose('500');
      setUnit('mg');
      setFrequency('once_daily');
      setScheduledTimes(['08:00']);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setNotes('');
    }
    setErrorMsg('');
  }, [editingMedication, isOpen]);

  const handleFrequencyChange = (newFreq: MedicationFrequency) => {
    setFrequency(newFreq);
    const option = FREQUENCY_OPTIONS.find((f) => f.key === newFreq);
    if (option) {
      setScheduledTimes(option.defaultTimes);
    }
  };

  const handleTimeChange = (idx: number, newTime: string) => {
    const updated = [...scheduledTimes];
    updated[idx] = newTime;
    setScheduledTimes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a medicine name.');
      return;
    }
    if (!dose.trim()) {
      setErrorMsg('Please enter a dose (e.g. 500).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const payload: MedicationInput = {
      name: name.trim(),
      dose: dose.trim(),
      unit,
      frequency,
      scheduledTimes,
      startDate,
      endDate: endDate || undefined,
      notes: notes.trim(),
      isActive: true,
    };

    const res = await onSave(payload);
    setSubmitting(false);

    if (res.success) {
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.error || 'Failed to save medicine.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-[#E7DFEF] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[#E7DFEF] flex items-center justify-between bg-gradient-to-r from-[#FAF5FF] to-[#FDF2F8]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B]">
                <Pill className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold font-display text-[#1C1326]">
                  {editingMedication ? 'Edit Medicine' : 'Add Medicine or Supplement'}
                </h2>
                <p className="text-xs text-[#584B68]">
                  Keep track of what you take and when
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-[#8D7E9E] hover:text-[#1C1326] hover:bg-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Suggestions Chips */}
            {!editingMedication && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase text-[#8D7E9E]">
                  Quick Fill Suggestions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SUPPLEMENTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setName(item);
                        if (item.includes('Metformin')) {
                          setDose('500');
                          setUnit('mg');
                          handleFrequencyChange('twice_daily');
                        } else if (item.includes('Inositol')) {
                          setDose('2000');
                          setUnit('mg');
                          handleFrequencyChange('once_daily');
                        } else if (item.includes('Vitamin D')) {
                          setDose('2000');
                          setUnit('IU');
                          handleFrequencyChange('once_daily');
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-mono bg-[#F8F5FA] hover:bg-[#EDE4F7] text-[#6E2D8B] border border-[#E7DFEF] transition-all cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Medicine Name */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#8D7E9E]">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Metformin, Myo-Inositol, Spironolactone"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-sans text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none"
              />
            </div>

            {/* 2. Dose & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#8D7E9E]">
                  Dose Amount *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500, 2000, 1"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-mono text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#8D7E9E]">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-mono text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Frequency */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#8D7E9E] block">
                How often do you take it?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FREQUENCY_OPTIONS.map((opt) => {
                  const isSelected = frequency === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleFrequencyChange(opt.key)}
                      className={`p-2.5 rounded-2xl text-xs font-bold font-sans border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#6E2D8B] text-white border-[#6E2D8B] shadow-xs'
                          : 'bg-[#F8F5FA] text-[#584B68] border-[#E7DFEF] hover:bg-[#FAF5FF]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Scheduled Times */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#8D7E9E] block">
                Scheduled Time(s)
              </label>
              <div className="flex flex-wrap gap-2">
                {scheduledTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-[#F8F5FA] border border-[#E7DFEF] p-2 rounded-2xl">
                    <Clock className="w-3.5 h-3.5 text-[#8E3EAF]" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      className="text-xs font-mono font-bold text-[#6E2D8B] bg-transparent focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8D7E9E]">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-mono text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8D7E9E]">End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-mono text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none"
                />
              </div>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#8D7E9E]">
                Optional Instructions / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Take with breakfast, dissolve in water"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-sans text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none"
              />
            </div>

            {/* Submit Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DFEF]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-[#E7DFEF] text-xs font-bold text-[#584B68] hover:bg-[#FAF5FF] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-purple-950/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {successToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#FDA4AF]" />
                    <span>{editingMedication ? 'Save Changes' : 'Save Medicine'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
