import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';
import type { ActivityType, EnergyFeelingLevel, FitnessLogInput, FitnessLogEntry } from '../../types/fitness';

interface ActivityLogModalProps {
  isOpen: boolean;
  editingEntry?: FitnessLogEntry | null;
  initialActivityName?: string;
  initialActivityType?: ActivityType;
  initialDurationMinutes?: number;
  onClose: () => void;
  onSave: (input: FitnessLogInput) => Promise<{ success: boolean; error?: string }>;
}

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: string }[] = [
  { type: 'walking', label: 'Walking', icon: '🚶‍♀️' },
  { type: 'strength', label: 'Strength', icon: '🏋️‍♀️' },
  { type: 'yoga', label: 'Yoga', icon: '🧘‍♀️' },
  { type: 'stretching', label: 'Stretching', icon: '🤸‍♀️' },
  { type: 'cycling', label: 'Cycling', icon: '🚴‍♀️' },
  { type: 'low_impact_cardio', label: 'Cardio', icon: '🏃‍♀️' },
  { type: 'mobility', label: 'Mobility', icon: '✨' },
  { type: 'rest_recovery', label: 'Rest & Recovery', icon: '🌙' },
  { type: 'other', label: 'Other', icon: '⭐' },
];

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60];

const ENERGY_LEVELS: { level: EnergyFeelingLevel; label: string; emoji: string }[] = [
  { level: 'low_energy', label: 'Low Energy', emoji: '🥱' },
  { level: 'okay', label: 'Okay', emoji: '😐' },
  { level: 'good', label: 'Good', emoji: '😊' },
  { level: 'great', label: 'Great', emoji: '⚡' },
];

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  editingEntry,
  initialActivityName = '',
  initialActivityType = 'walking',
  initialDurationMinutes = 20,
  onClose,
  onSave,
}) => {
  const [activityType, setActivityType] = useState<ActivityType>(initialActivityType);
  const [activityName, setActivityName] = useState<string>(initialActivityName);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDurationMinutes);
  const [energyLevel, setEnergyLevel] = useState<EnergyFeelingLevel | undefined>('good');
  const [notes, setNotes] = useState<string>('');
  const [occurredAt, setOccurredAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setActivityType(editingEntry.activityType);
      setActivityName(editingEntry.activityName);
      setDurationMinutes(editingEntry.durationMinutes);
      setEnergyLevel(editingEntry.energyLevel);
      setNotes(editingEntry.notes || '');
      setOccurredAt(editingEntry.occurredAt);
    } else {
      setActivityType(initialActivityType);
      setActivityName(initialActivityName);
      setDurationMinutes(initialDurationMinutes);
      setEnergyLevel('good');
      setNotes('');
      setOccurredAt(new Date().toISOString().split('T')[0]);
    }
  }, [editingEntry, initialActivityName, initialActivityType, initialDurationMinutes, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const defaultTitle =
      activityName.trim() ||
      ACTIVITY_TYPES.find((a) => a.type === activityType)?.label ||
      'Movement Activity';

    const payload: FitnessLogInput = {
      activityType,
      activityName: defaultTitle,
      durationMinutes: Math.max(1, durationMinutes),
      energyLevel,
      notes,
      occurredAt,
    };

    const res = await onSave(payload);
    setSubmitting(false);

    if (res.success) {
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 500);
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
          className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-[#BAE6FD] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[#BAE6FD] flex items-center justify-between bg-[#F0F9FF]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#E0F2FE] text-[#0288D1]">
                <Dumbbell className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold font-display text-[#01579B]">
                  {editingEntry ? 'Edit Activity' : 'Log Movement & Exercise'}
                </h2>
                <p className="text-xs text-[#475569]">
                  Record how your body moved and felt today
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-[#64748B] hover:text-[#01579B] hover:bg-[#E0F2FE] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* 1. Activity Type Grid */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#64748B] block">
                Select Movement Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map((item) => {
                  const isSelected = activityType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setActivityType(item.type);
                        if (!activityName || ACTIVITY_TYPES.some((a) => a.label === activityName)) {
                          setActivityName(item.label);
                        }
                      }}
                      className={`p-3 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs'
                          : 'bg-[#F8FAFC] text-[#475569] border-[#BAE6FD]/80 hover:bg-[#E0F2FE]'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Activity Name */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#64748B]">
                Activity Title
              </label>
              <input
                type="text"
                placeholder="e.g. Morning Sunshine Walk, Low-Impact Squats"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-xs font-sans text-[#0F172A] focus:bg-white focus:border-[#0288D1] focus:outline-none"
              />
            </div>

            {/* 3. Duration Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-[#64748B]">
                  Duration: {durationMinutes} Minutes
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-20 px-2.5 py-1 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-xs font-mono text-center font-bold text-[#0288D1]"
                  />
                  <span className="text-xs font-mono text-[#64748B]">min</span>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-[#0288D1] text-white'
                        : 'bg-[#F8FAFC] text-[#475569] border border-[#BAE6FD]/80 hover:bg-[#E0F2FE]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* 4. How did you feel? (Energy Level) */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#64748B] block">
                How did you feel? (Energy Level)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ENERGY_LEVELS.map((item) => {
                  const isSelected = energyLevel === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setEnergyLevel(item.level)}
                      className={`p-2.5 rounded-2xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] text-[#01579B] border-[#0288D1] shadow-xs'
                          : 'bg-[#F8FAFC] text-[#475569] border-[#BAE6FD]/80 hover:bg-[#E0F2FE]'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#64748B]">Date</label>
                <input
                  type="date"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-xs font-mono text-[#0F172A] focus:bg-white focus:border-[#0288D1] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#64748B]">Optional Notes</label>
                <input
                  type="text"
                  placeholder="e.g. sunny morning, light hip soreness"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-xs font-sans text-[#0F172A] focus:bg-white focus:border-[#0288D1] focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-[#BAE6FD] text-xs font-bold text-[#475569] hover:bg-[#E0F2FE] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {successToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>{editingEntry ? 'Update Activity' : 'Save to Movement Log'}</span>
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
