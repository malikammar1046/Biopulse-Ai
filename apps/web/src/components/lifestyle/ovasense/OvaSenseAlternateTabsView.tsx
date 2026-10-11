import React from 'react';
import { Dumbbell, Moon, Flower2, Droplets, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FitnessPillar, LifestylePillar } from '../../../types/lifestyle';
import { getWorkoutImage } from '../../../utils/lifestyleImages';

interface OvaSenseAlternateTabsViewProps {
  activeTab: 'exercise' | 'sleep' | 'stress' | 'hydration';
  fitness?: FitnessPillar;
  lifestyle?: LifestylePillar;
  waterGlasses?: number;
  targetGlasses?: number;
  onIncrementWater?: () => void;
  onDecrementWater?: () => void;
  onOpenLogActivity?: () => void;
}

export const OvaSenseAlternateTabsView: React.FC<OvaSenseAlternateTabsViewProps> = ({
  activeTab,
  fitness,
  lifestyle,
  waterGlasses = 0,
  targetGlasses = 8,
  onIncrementWater,
  onDecrementWater,
  onOpenLogActivity,
}) => {
  const { t } = useTranslation();

  if (activeTab === 'exercise') {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        {/* Movement Overview Card */}
        <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0E9EAA] flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {fitness?.protocol_name || t('movementSection.title', 'Movement & Physical Activity')}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {fitness?.overview || t('movementSection.subtitle', 'Targeted movement that optimizes insulin sensitivity without spiking stress cortisol')}
                </p>
              </div>
            </div>

            {onOpenLogActivity && (
              <button
                type="button"
                onClick={onOpenLogActivity}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0E9EAA] hover:bg-[#0c858f] text-white text-xs font-bold shadow-xs cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Movement</span>
              </button>
            )}
          </div>

          {/* Quick Target Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F0FDF9] border border-teal-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Aerobic Target</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {fitness?.aerobic_target_minutes || '150 mins / week'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF0F5] border border-pink-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Resistance Sessions</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {fitness?.resistance_target_sessions || '2-3 sessions'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-purple-100 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Metabolic Focus</span>
              <span className="text-xs font-bold text-[#8B5CF6] block leading-tight">
                {fitness?.pathway_clinical_benefit || 'Insulin-sensitizing glucose clearance'}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Movement Sessions */}
        {fitness?.weekly_schedule && fitness.weekly_schedule.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fitness.weekly_schedule.map((session, idx) => {
              const visual = getWorkoutImage(session.modality, session.focus);
              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-white border border-[#FCE7F0] overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      src={visual.url}
                      alt={visual.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-slate-800 shadow-xs">
                      {session.day_name}
                    </div>
                    <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900/80 text-white">
                      {session.duration_mins} mins
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4 className="text-sm sm:text-base font-bold text-slate-800">{session.focus}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{session.coaching_cue}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {session.key_movements?.map((m, mIdx) => (
                        <span
                          key={mIdx}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'sleep') {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {t('sleepSection.title', 'Sleep Rhythm & Cortisol Balance')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lifestyle?.circadian_headline || t('sleepSection.subtitle', 'Consistent circadian rhythms are essential for hormone synthesis and recovery')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-purple-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Recommended Sleep Window</span>
              <span className="text-xl font-black text-slate-800 font-mono">
                {lifestyle?.sleep_target_hours || '7–8 hours'}
              </span>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Optimal REM & Deep
            </span>
          </div>

          {/* Sleep Hygiene List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Circadian Sleep Protocol
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>{t('sleepSection.sleepHygiene1', 'Avoid heavy caffeine or chai within 6 hours of bedtime')}</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>{t('sleepSection.sleepHygiene2', 'Keep sleeping room cool, quiet and dark')}</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>{t('sleepSection.sleepHygiene3', 'Wind down screen usage 45 minutes prior to sleep')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'stress') {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Stress & Cortisol Regulation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lifestyle?.stress_management_protocol || 'Parasympathetic pacing to protect adrenal reserves and reduce stress-induced androgen surges.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FFF0F5] border border-pink-100 space-y-1.5">
              <h4 className="text-xs font-bold text-[#BE185D]">4-7-8 Parasympathetic Breathing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inhale through nose for 4 counts, hold for 7, exhale gently through mouth for 8 counts. Repeat 4 cycles before meals and bed.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F0FDF9] border border-teal-100 space-y-1.5">
              <h4 className="text-xs font-bold text-[#0E9EAA]">Morning Natural Sunlight</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Expose eyes to 10–15 minutes of indirect morning daylight within 1 hour of waking to anchor daily cortisol surge and nocturnal melatonin.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hydration Tab
  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Daily Hydration Tracking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Optimal cellular hydration promotes nutrient transport and hormone clearance.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-[#0284C7] font-mono">
              {waterGlasses} / {targetGlasses}
            </span>
            <span className="text-xs text-slate-400 block font-sans">glasses</span>
          </div>
        </div>

        {/* Interactive Glass Tracker */}
        <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: targetGlasses }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-9 rounded-md border flex items-center justify-center transition-all ${
                  i < waterGlasses
                    ? 'bg-sky-500 border-sky-600 text-white shadow-2xs'
                    : 'bg-white border-sky-200 text-slate-300'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {onDecrementWater && (
              <button
                type="button"
                onClick={onDecrementWater}
                className="w-9 h-9 rounded-full bg-white border border-sky-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer shadow-xs transition"
                aria-label="Remove 1 glass of water"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
            {onIncrementWater && (
              <button
                type="button"
                onClick={onIncrementWater}
                className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center cursor-pointer shadow-xs transition"
                aria-label="Add 1 glass of water"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
