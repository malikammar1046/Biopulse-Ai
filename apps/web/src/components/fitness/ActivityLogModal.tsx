import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XClose,
  Plus,
  ActivityHeart,
  CheckCircle,
} from '@untitledui/icons';
import type { ActivityType, EnergyFeelingLevel, FitnessLogInput, FitnessLogEntry } from '../../types/fitness';

interface ActivityLogModalProps {
  isOpen: boolean;
  editingEntry?: FitnessLogEntry | null;
  initialActivityName?: string;
  initialActivityType?: ActivityType;
  initialDurationMinutes?: number;
  onClose: () => void;
  onSave: (input: FitnessLogInput) => Promise<{ success: boolean; error?: string }>;
  isMale?: boolean;
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
  isMale,
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
          className={`w-full max-w-xl bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
            isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
          }`}
        >
          {/* Header */}
          <div className={`p-6 pb-4 border-b flex items-center justify-between ${
            isMale ? 'border-[#BAE6FD] bg-[#F0F9FF]' : 'border-[#EAECF0] bg-[#FDE6EF]/20'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl ${
                isMale ? 'bg-[#E0F2FE] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'
              }`}>
                <ActivityHeart className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className={`text-lg font-bold font-display ${isMale ? 'text-[#01579B]' : 'text-[#0F172A]'}`}>
                  {editingEntry ? 'Edit Activity' : 'Log Movement & Exercise'}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Record how your body moved and felt today
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isMale ? 'text-[#64748B] hover:text-[#01579B] hover:bg-[#E0F2FE]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
              aria-label="Close dialog"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
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
                      className={`p-3 rounded-xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer ${
                        isSelected
                          ? isMale
                            ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-xs'
                            : 'bg-[#F43F7D] text-white border-[#F43F7D] shadow-xs'
                          : isMale
                            ? 'bg-[#F8FAFC] text-[#475569] border-[#BAE6FD]/80 hover:bg-[#E0F2FE]'
                            : 'bg-[#F8FAFC] text-[#475569] border-[#EAECF0] hover:bg-[#FDE6EF]/40 hover:border-[rgba(244,63,125,0.3)]'
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
                className={`w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border text-xs font-sans text-[#0F172A] focus:bg-white focus:outline-none ${
                  isMale ? 'border-[#BAE6FD]/80 focus:border-[#0288D1]' : 'border-[#EAECF0] focus:border-[#F43F7D]'
                }`}
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
                    className={`w-20 px-2.5 py-1 rounded-xl bg-[#F8FAFC] border text-xs font-mono text-center font-bold ${
                      isMale ? 'border-[#BAE6FD]/80 text-[#0288D1]' : 'border-[#EAECF0] text-[#DC326C]'
                    }`}
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
                        ? isMale ? 'bg-[#0288D1] text-white' : 'bg-[#F43F7D] text-white'
                        : isMale
                          ? 'bg-[#F8FAFC] text-[#475569] border border-[#BAE6FD]/80 hover:bg-[#E0F2FE]'
                          : 'bg-[#F8FAFC] text-[#475569] border border-[#EAECF0] hover:bg-[#FDE6EF]/40 hover:border-[rgba(244,63,125,0.3)]'
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
                      className={`p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? isMale
                            ? 'bg-[#E0F2FE] text-[#01579B] border-[#0288D1] shadow-xs'
                            : 'bg-[#FDE6EF] text-[#DC326C] border-[#F43F7D] shadow-xs'
                          : isMale
                            ? 'bg-[#F8FAFC] text-[#475569] border-[#BAE6FD]/80 hover:bg-[#E0F2FE]'
                            : 'bg-[#F8FAFC] text-[#475569] border-[#EAECF0] hover:bg-[#FDE6EF]/40 hover:border-[rgba(244,63,125,0.3)]'
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
                  className={`w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border text-xs font-mono text-[#0F172A] focus:bg-white focus:outline-none ${
                    isMale ? 'border-[#BAE6FD]/80 focus:border-[#0288D1]' : 'border-[#EAECF0] focus:border-[#F43F7D]'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#64748B]">Optional Notes</label>
                <input
                  type="text"
                  placeholder="e.g. sunny morning, light hip soreness"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border text-xs font-sans text-[#0F172A] focus:bg-white focus:outline-none ${
                    isMale ? 'border-[#BAE6FD]/80 focus:border-[#0288D1]' : 'border-[#EAECF0] focus:border-[#F43F7D]'
                  }`}
                />
              </div>
            </div>

            {/* Submit Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAECF0]">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-[#EAECF0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`h-10 px-5 rounded-xl text-white text-sm font-medium shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                  isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
                }`}
              >
                {successToast ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" aria-hidden="true" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" aria-hidden="true" />
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
