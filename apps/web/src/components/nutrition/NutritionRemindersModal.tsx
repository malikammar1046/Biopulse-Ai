import React, { useState } from 'react';
import { X, Bell, Clock, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import type { MealReminder, NutritionReminderPreferences } from '../../types/nutrition';

interface NutritionRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: NutritionReminderPreferences | null;
  onSave: (prefs: NutritionReminderPreferences) => Promise<void>;
  isMale: boolean;
}

const DEFAULT_REMINDERS: MealReminder[] = [
  { meal_type: 'breakfast', enabled: true, time: '08:00' },
  { meal_type: 'lunch', enabled: true, time: '13:00' },
  { meal_type: 'dinner', enabled: true, time: '20:00' },
  { meal_type: 'snack', enabled: false, time: '16:30' },
];

export const NutritionRemindersModal: React.FC<NutritionRemindersModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSave,
  isMale,
}) => {
  const [enabled, setEnabled] = useState<boolean>(currentPreferences?.enabled ?? true);
  const [reminders, setReminders] = useState<MealReminder[]>(
    currentPreferences?.reminders && currentPreferences.reminders.length > 0
      ? currentPreferences.reminders
      : DEFAULT_REMINDERS
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleMeal = (index: number) => {
    const next = [...reminders];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    setReminders(next);
  };

  const handleTimeChange = (index: number, newTime: string) => {
    const next = [...reminders];
    next[index] = { ...next[index], time: newTime };
    setReminders(next);
  };

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setNotificationPermission(res);
      } catch (err) {
        console.error('Permission request failed:', err);
      }
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSave({
        enabled,
        reminders,
        notification_permission: notificationPermission !== 'unsupported' ? notificationPermission : null,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update reminders:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]';
  const accentBorder = isMale ? 'border-[#0868B9]' : 'border-[#0E9EAA]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#D7EAF2] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7EAF2] bg-[#F5FBFD]">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl ${accentColor} text-white`}>
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#073B72]">Meal Reminders</h2>
              <p className="text-xs text-slate-500">Gentle scheduled notifications for planned meals</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Global Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-[#D7EAF2]">
            <div>
              <div className="text-xs font-bold text-[#073B72]">Enable Meal Reminders</div>
              <p className="text-[11px] text-slate-500">Send timely reminders for your planned meals</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                enabled ? (isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]') : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Browser Notification Status */}
          {notificationPermission === 'default' && (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-center justify-between">
              <div>
                <span className="font-bold">Browser Notifications</span>
                <p className="text-[11px] text-sky-600 mt-0.5">Allow alerts even when tab is in background</p>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-xl bg-[#0868B9] text-white text-[11px] font-semibold hover:opacity-90"
              >
                Allow
              </button>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Browser alerts are blocked. Falling back to in-app notifications.</span>
            </div>
          )}

          {/* Reminders List */}
          <div className={`space-y-3 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            {reminders.map((rem, idx) => (
              <div
                key={rem.meal_type}
                className="flex items-center justify-between p-3 rounded-2xl border border-[#D7EAF2] bg-white"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rem.enabled}
                    onChange={() => handleToggleMeal(idx)}
                    className="w-4 h-4 rounded-md text-[#0E9EAA] border-slate-300 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#073B72] capitalize">
                    {rem.meal_type}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="time"
                    value={rem.time}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    disabled={!rem.enabled}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#D7EAF2] bg-slate-50 focus:bg-white text-slate-700 disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 italic text-center">
            &ldquo;Breakfast is planned for 8:00 AM — Oats &amp; egg bowl is on today&apos;s plan.&rdquo;
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D7EAF2]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs ${accentColor} hover:opacity-95`}
            >
              {submitting ? (
                <span>Saving...</span>
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Reminder Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
