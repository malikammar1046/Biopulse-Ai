import React, { useState } from 'react';
import {
  HeartPulse,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { LifestylePillar, RecommendationItem } from '../../types/lifestyle';
import { RecommendationCard } from './RecommendationCard';
import { LIFESTYLE_IMAGES } from '../../utils/lifestyleImages';

interface LifestylePillarViewProps {
  lifestyle: LifestylePillar;
  recommendations: RecommendationItem[];
  onSelectRecommendation: (rec: RecommendationItem) => void;
  onUpdateStatus?: (
    recommendationId: string,
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED'
  ) => void;
  isMale?: boolean;
}

export const LifestylePillarView: React.FC<LifestylePillarViewProps> = ({
  lifestyle,
  recommendations,
  onSelectRecommendation,
  onUpdateStatus,
  isMale = false,
}) => {
  const lifestyleRecs = recommendations.filter(
    (r) => r.category === 'lifestyle' || r.category === 'clinical'
  );

  const [completedHabits, setCompletedHabits] = useState<Record<number, boolean>>({});

  const toggleHabit = (idx: number) => {
    setCompletedHabits((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* ── 1. CIRCADIAN & SLEEP HERO SANCTUARY ── */}
      <section className="rounded-3xl bg-white border border-[#E2EEF4] p-7 sm:p-9 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Moon className="w-3.5 h-3.5" />
                Circadian Architecture
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Autonomic & Cortisol Equilibrium
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#073B72] tracking-tight">
              {lifestyle.circadian_headline || 'Circadian Alignment & Restorative Sleep'}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Nocturnal hormone synthesis, insulin sensitivity reset, and cellular repair depend on deep non-REM and REM cycles.
            </p>
          </div>

          {/* Sleep Target Glass Metric */}
          <div className="p-5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] text-center lg:text-left space-y-1 shrink-0 min-w-[200px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center lg:justify-start gap-1.5">
              <Moon className="w-3.5 h-3.5 text-[#0E9EAA]" /> Optimal Sleep Target
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#073B72] font-mono">
              {lifestyle.sleep_target_hours || '7.5 – 8.5'} <span className="text-xs font-normal text-slate-500">hrs/night</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Aligns melatonin production & blunts morning cortisol surge
            </p>
          </div>
        </div>

        {/* Visual Dual Cards: Sleep Sanctuary & Stress Reset */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Card 1: Serene Sleep Sanctuary */}
          <div className="rounded-3xl border border-[#E2EEF4] overflow-hidden bg-white shadow-xs flex flex-col justify-between">
            <div className="relative h-44 w-full overflow-hidden bg-slate-100 group">
              <img
                src={LIFESTYLE_IMAGES.recovery.sleep.url}
                alt={LIFESTYLE_IMAGES.recovery.sleep.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = '0';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-3.5 left-4 flex items-center gap-1.5 text-white font-bold text-xs">
                <Sun className="w-4 h-4 text-amber-300" />
                <span>Morning Light Exposure Protocol</span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="text-base font-bold text-[#073B72]">Natural Dawn Entrainment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Step outside within 30 minutes of waking for 10–15 minutes of natural sunlight. This triggers serotonin synthesis and sets the internal timer for evening melatonin release.
              </p>
            </div>
          </div>

          {/* Card 2: Autonomic Stress & Cortisol Reset */}
          <div className="rounded-3xl border border-[#E2EEF4] overflow-hidden bg-white shadow-xs flex flex-col justify-between">
            <div className="relative h-44 w-full overflow-hidden bg-slate-100 group">
              <img
                src={LIFESTYLE_IMAGES.recovery.stress.url}
                alt={LIFESTYLE_IMAGES.recovery.stress.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = '0';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-3.5 left-4 flex items-center gap-1.5 text-white font-bold text-xs">
                <HeartPulse className="w-4 h-4 text-rose-300" />
                <span>Autonomic Stress Reset</span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h4 className="text-base font-bold text-[#073B72]">Parasympathetic Vagal Activation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lifestyle.stress_management_protocol ||
                  'Engage in 5 minutes of 4-7-8 diaphragmatic breathing before meals and prior to sleep to lower sympathetic tone and downregulate adrenal cortisol.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. KEY DAILY RECOVERY HABITS ── */}
      {lifestyle.recommended_habits && lifestyle.recommended_habits.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#073B72]">Daily Recovery Anchors</h3>
              <p className="text-xs text-slate-500">Bite-sized micro-habits designed for biological consistency</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F7FBFC] border border-[#E2EEF4] text-[#073B72]">
              {lifestyle.recommended_habits.length} Habits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lifestyle.recommended_habits.map((habit, idx) => {
              const isDone = Boolean(completedHabits[idx]);
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl border transition-all duration-300 flex items-start justify-between gap-4 shadow-xs ${
                    isDone
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-[#E2EEF4] hover:border-[#0E9EAA]/40'
                  }`}
                >
                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-[#073B72]">
                        {habit.category}
                      </span>
                      {habit.timing && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {habit.timing}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold leading-snug ${
                        isDone ? 'text-emerald-900 line-through decoration-emerald-500' : 'text-[#073B72]'
                      }`}
                    >
                      {habit.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {habit.action_item}
                    </p>

                    {habit.rationale && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        &ldquo;{habit.rationale}&rdquo;
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleHabit(idx)}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'border border-[#E2EEF4] bg-slate-50 text-slate-400 hover:text-emerald-600 hover:border-emerald-300'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as done today'}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 3. CLINICAL LIFESTYLE RECOMMENDATIONS ── */}
      {lifestyleRecs.length > 0 && (
        <section className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-[#073B72]">Evidence-Based Lifestyle Priorities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {lifestyleRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onSelect={onSelectRecommendation}
                onUpdateStatus={onUpdateStatus}
                isMale={isMale}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
