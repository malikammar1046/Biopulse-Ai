import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Flower2, CheckCircle, AlertCircle } from 'lucide-react';
import type { StressActivityType, StressSessionInput } from '../../types/stress';

interface StressLogModalProps {
  isOpen: boolean;
  initialActivityType?: StressActivityType;
  initialActivityName?: string;
  initialDuration?: number;
  onClose: () => void;
  onSave: (input: StressSessionInput) => Promise<{ success: boolean; error?: string }>;
  isMale?: boolean;
}

const ACTIVITIES: { type: StressActivityType; nameEn: string; nameUr: string; defaultMins: number }[] = [
  { type: 'deep_breathing', nameEn: '4-7-8 Deep Breathing', nameUr: 'گہرے سانس کی مشق', defaultMins: 5 },
  { type: 'box_breathing', nameEn: 'Box Breathing (4x4)', nameUr: 'باکس بریتھنگ', defaultMins: 5 },
  { type: 'mindfulness', nameEn: 'Mindfulness & Grounding', nameUr: 'ذہنی سکون اور میڈیٹیشن', defaultMins: 10 },
  { type: 'progressive_muscle_relaxation', nameEn: 'Progressive Muscle Relaxation', nameUr: 'عضلاتی آرام کی مشق', defaultMins: 15 },
  { type: 'guided_relaxation', nameEn: 'Guided Body Scan', nameUr: 'رہنمائی والا باڈی اسکین', defaultMins: 12 },
  { type: 'gentle_stretching', nameEn: 'Gentle Somatic Stretching', nameUr: 'ہلکی کھنچاؤ کی ورزش', defaultMins: 10 },
  { type: 'relaxation_break', nameEn: 'Quiet Decompression Break', nameUr: 'مختصر خاموش وقفہ', defaultMins: 10 },
];

export const StressLogModal: React.FC<StressLogModalProps> = ({
  isOpen,
  initialActivityType = 'deep_breathing',
  initialActivityName = '',
  initialDuration = 10,
  onClose,
  onSave,
  isMale = false,
}) => {
  const { i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const [activityType, setActivityType] = useState<StressActivityType>(initialActivityType);
  const [activityName, setActivityName] = useState<string>(
    initialActivityName || (ACTIVITIES.find((a) => a.type === initialActivityType)?.nameEn || 'Relaxation Session')
  );
  const [duration, setDuration] = useState<number>(initialDuration);
  const [stressBefore, setStressBefore] = useState<number | null>(null);
  const [stressAfter, setStressAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectActivity = (act: typeof ACTIVITIES[0]) => {
    setActivityType(act.type);
    setActivityName(isUrdu ? act.nameUr : act.nameEn);
    if (!duration || duration === initialDuration) {
      setDuration(act.defaultMins);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) {
      setError(isUrdu ? 'براہ کرم سرگرمی کا نام منتخب کریں' : 'Please provide an activity name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onSave({
        activityType,
        activityName: activityName.trim(),
        durationMinutes: duration,
        stressBefore: stressBefore ?? undefined,
        stressAfter: stressAfter ?? undefined,
        notes: notes.trim(),
        occurredAt: new Date().toISOString().split('T')[0],
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || (isUrdu ? 'محفوظ کرنے میں ناکامی ہوئی' : 'Failed to save session.'));
      }
    } catch (err: any) {
      setError(err?.message || (isUrdu ? 'محفوظ کرنے میں ناکامی ہوئی' : 'Failed to save session.'));
    } finally {
      setLoading(false);
    }
  };

  const accentBg = isMale ? 'bg-[#0284C7]' : 'bg-[#F43F7D]';
  const accentBorder = isMale ? 'border-[#0284C7]' : 'border-[#F43F7D]';
  const accentLight = isMale ? 'bg-[#F0F9FF] text-[#0284C7]' : 'bg-[#FFF0F5] text-[#BE185D]';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-lg bg-white rounded-3xl border ${
          isMale ? 'border-sky-100' : 'border-[#FCE7F0]'
        } shadow-2xl overflow-hidden text-left`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-5 border-b ${
            isMale ? 'bg-[#F0F9FF] border-sky-100' : 'bg-[#FFF5F8] border-[#FCE7F0]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${accentLight} flex items-center justify-center shrink-0`}>
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isUrdu ? 'تناؤ کم کرنے کا سیشن درج کریں' : 'Log Stress-Relief Session'}
              </h3>
              <p className="text-xs text-slate-500">
                {isUrdu ? 'پرسکون سانس، مائنڈفلنس یا اعصابی آرام' : 'Record relaxation & parasympathetic recovery'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/80 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Selection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              {isUrdu ? 'سرگرمی منتخب کریں' : 'Select Relaxation Activity'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map((act) => {
                const isSelected = activityType === act.type;
                return (
                  <button
                    key={act.type}
                    type="button"
                    onClick={() => handleSelectActivity(act)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `${accentLight} ${accentBorder} font-bold shadow-2xs`
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{isUrdu ? act.nameUr : act.nameEn}</span>
                    <span className="text-[10px] font-mono opacity-70 shrink-0 ml-1">
                      {act.defaultMins}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isUrdu ? 'مدت (منٹ)' : 'Duration (Minutes)'}
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                    duration === mins
                      ? `${accentBg} text-white ${accentBorder}`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Optional Perceived Stress Before / After */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {isUrdu ? 'تناؤ کی شدت (اختیاری 1–10)' : 'Self-Reported Stress (Optional 1–10)'}
              </span>
              <span className="text-[10px] text-slate-400">1 = Calm • 10 = High Tension</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  {isUrdu ? 'سیشن سے پہلے' : 'Before Session'}
                </label>
                <select
                  value={stressBefore ?? ''}
                  onChange={(e) => setStressBefore(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">{isUrdu ? 'درج نہیں' : 'Not rated'}</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} {n >= 8 ? '(High)' : n >= 5 ? '(Moderate)' : '(Mild)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  {isUrdu ? 'سیشن کے بعد' : 'After Session'}
                </label>
                <select
                  value={stressAfter ?? ''}
                  onChange={(e) => setStressAfter(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">{isUrdu ? 'درج نہیں' : 'Not rated'}</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} {n <= 3 ? '(Calm)' : n <= 6 ? '(Relieved)' : '(Tense)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {isUrdu ? 'نوٹس (اختیاری)' : 'Notes (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isUrdu ? 'کیسا محسوس ہوا یا مشق کے بارے میں' : 'e.g., Felt calmer, lowered heart rate'}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {isUrdu ? 'منسوخ کریں' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-xs ${accentBg} hover:opacity-90 flex items-center gap-1.5`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...') : (isUrdu ? 'سیشن محفوظ کریں' : 'Save Session')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
