import React, { useState, useEffect } from 'react';
import { X, Bell, Check, AlertCircle } from 'lucide-react';
import { nutritionService } from '../../services/nutritionService';
import type { MealReminderSettings } from '../../types/nutrition';

interface MealRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMale?: boolean;
}

export const MealRemindersModal: React.FC<MealRemindersModalProps> = ({
  isOpen,
  onClose,
  isMale = false,
}) => {
  const [settings, setSettings] = useState<MealReminderSettings>({
    breakfast_enabled: true,
    breakfast_time: '08:00',
    lunch_enabled: true,
    lunch_time: '13:00',
    dinner_enabled: true,
    dinner_time: '20:00',
    snack_enabled: false,
    snack_time: '16:30',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSuccess(false);

    nutritionService
      .getReminders()
      .then((res) => {
        if (res) {
          setSettings(res);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch reminders:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setPermissionNotice(null);

    // Request browser notification if at least one reminder is active
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      (settings.breakfast_enabled || settings.lunch_enabled || settings.dinner_enabled || settings.snack_enabled)
    ) {
      if (Notification.permission === 'default') {
        try {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            setPermissionNotice('Browser notifications were not granted. In-app reminders will be used.');
          }
        } catch {
          // fallback quietly
        }
      }
    }

    try {
      await nutritionService.updateReminders(settings);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to save reminder settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const primaryBtnClass = isMale
    ? 'bg-[#0868B9] hover:bg-[#07599c] text-white'
    : 'bg-[#0E9EAA] hover:bg-[#0b828c] text-white';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#D7EAF2] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7EAF2] bg-[#F5FBFD]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isMale ? 'bg-sky-100 text-[#0868B9]' : 'bg-teal-100 text-[#0E9EAA]'
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#073B72]">
                Meal Reminders
              </h2>
              <p className="text-[11px] text-[#55718F]">
                Gentle, supportive notifications for your planned meals
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {permissionNotice && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>{permissionNotice}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600" />
              <span>Reminder settings saved successfully!</span>
            </div>
          )}

          {/* Breakfast */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#D7EAF2] bg-[#F5FBFD]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rem-breakfast"
                checked={settings.breakfast_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, breakfast_enabled: e.target.checked })
                }
                className="w-4 h-4 rounded-md text-[#0E9EAA] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="rem-breakfast" className="text-xs font-bold text-[#073B72] cursor-pointer">
                Breakfast Reminder
              </label>
            </div>
            <input
              type="time"
              value={settings.breakfast_time}
              onChange={(e) =>
                setSettings({ ...settings, breakfast_time: e.target.value })
              }
              disabled={!settings.breakfast_enabled}
              className="px-2.5 py-1 text-xs rounded-xl border border-[#D7EAF2] bg-white disabled:opacity-40"
            />
          </div>

          {/* Lunch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#D7EAF2] bg-[#F5FBFD]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rem-lunch"
                checked={settings.lunch_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, lunch_enabled: e.target.checked })
                }
                className="w-4 h-4 rounded-md text-[#0E9EAA] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="rem-lunch" className="text-xs font-bold text-[#073B72] cursor-pointer">
                Lunch Reminder
              </label>
            </div>
            <input
              type="time"
              value={settings.lunch_time}
              onChange={(e) =>
                setSettings({ ...settings, lunch_time: e.target.value })
              }
              disabled={!settings.lunch_enabled}
              className="px-2.5 py-1 text-xs rounded-xl border border-[#D7EAF2] bg-white disabled:opacity-40"
            />
          </div>

          {/* Dinner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#D7EAF2] bg-[#F5FBFD]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rem-dinner"
                checked={settings.dinner_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, dinner_enabled: e.target.checked })
                }
                className="w-4 h-4 rounded-md text-[#0E9EAA] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="rem-dinner" className="text-xs font-bold text-[#073B72] cursor-pointer">
                Dinner Reminder
              </label>
            </div>
            <input
              type="time"
              value={settings.dinner_time}
              onChange={(e) =>
                setSettings({ ...settings, dinner_time: e.target.value })
              }
              disabled={!settings.dinner_enabled}
              className="px-2.5 py-1 text-xs rounded-xl border border-[#D7EAF2] bg-white disabled:opacity-40"
            />
          </div>

          {/* Snack */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#D7EAF2] bg-[#F5FBFD]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rem-snack"
                checked={settings.snack_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, snack_enabled: e.target.checked })
                }
                className="w-4 h-4 rounded-md text-[#0E9EAA] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="rem-snack" className="text-xs font-bold text-[#073B72] cursor-pointer">
                Snack Reminder
              </label>
            </div>
            <input
              type="time"
              value={settings.snack_time}
              onChange={(e) =>
                setSettings({ ...settings, snack_time: e.target.value })
              }
              disabled={!settings.snack_enabled}
              className="px-2.5 py-1 text-xs rounded-xl border border-[#D7EAF2] bg-white disabled:opacity-40"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 ${primaryBtnClass} ${
                saving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Preferences...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Reminder Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
