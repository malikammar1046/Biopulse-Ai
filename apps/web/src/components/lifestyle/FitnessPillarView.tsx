import React, { useState } from 'react';
import {
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { FitnessPillar, RecommendationItem } from '../../types/lifestyle';
import { RecommendationCard } from './RecommendationCard';
import { getWorkoutImage } from '../../utils/lifestyleImages';

interface FitnessPillarViewProps {
  fitness: FitnessPillar;
  recommendations: RecommendationItem[];
  onSelectRecommendation: (rec: RecommendationItem) => void;
  onUpdateStatus?: (
    recommendationId: string,
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED'
  ) => void;
  isMale?: boolean;
}

export const FitnessPillarView: React.FC<FitnessPillarViewProps> = ({
  fitness,
  recommendations,
  onSelectRecommendation,
  onUpdateStatus,
  isMale = false,
}) => {
  const fitnessRecs = recommendations.filter((r) => r.category === 'fitness');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const toggleDay = (idx: number) => {
    setExpandedDay(expandedDay === idx ? null : idx);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* ── 1. PROTOCOL OVERVIEW HERO WITH ATHLETIC ART ── */}
      <section className="rounded-3xl bg-white border border-[#E2EEF4] p-7 sm:p-9 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-[#0868B9] border border-sky-100">
                <Dumbbell className="w-3.5 h-3.5" />
                Movement Architecture
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {fitness.weekly_frequency || '3–4 Sessions Weekly'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#073B72] tracking-tight">
              {fitness.protocol_name}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {fitness.overview}
            </p>
          </div>

          {/* Target Weekly Badges */}
          <div className="flex sm:flex-col gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] text-center sm:text-left space-y-1 min-w-[160px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Aerobic Conditioning
              </span>
              <div className="text-xl font-black text-[#073B72] font-mono">
                {fitness.aerobic_target_minutes} <span className="text-xs font-normal text-slate-500">min/wk</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] text-center sm:text-left space-y-1 min-w-[160px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Resistance Stimulus
              </span>
              <div className="text-xl font-black text-[#073B72] font-mono">
                {fitness.resistance_target_sessions} <span className="text-xs font-normal text-slate-500">sessions/wk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hormonal & Metabolic Mechanism Banner */}
        {fitness.pathway_clinical_benefit && (
          <div className="p-5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] text-xs sm:text-sm text-slate-700 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#073B72] text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#0E9EAA]" />
              <span>Target Hormonal & Metabolic Adaptation</span>
            </div>
            <p>{fitness.pathway_clinical_benefit}</p>
          </div>
        )}
      </section>

      {/* ── 2. 7-DAY VISUAL MOVEMENT SCHEDULE ── */}
      {fitness.weekly_schedule && fitness.weekly_schedule.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#073B72]">Weekly Movement Rhythm</h3>
              <p className="text-xs text-slate-500">Progressive volume balanced with autonomic joint recovery</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fitness.weekly_schedule.map((session, idx) => {
              const visual = getWorkoutImage(session.modality, session.focus);
              const isExpanded = expandedDay === idx;

              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-white border border-[#E2EEF4] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Photo Banner */}
                    <div className="relative h-40 w-full overflow-hidden bg-slate-100 group">
                      <img
                        src={visual.url}
                        alt={session.focus}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = '0';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                      <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#073B72] shadow-sm">
                        {session.day_name}
                      </div>

                      <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-300" />
                          {session.duration_mins} min
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#0E9EAA]/90 text-white backdrop-blur-md shadow-xs">
                          {session.intensity}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#0E9EAA]">
                        {session.modality || 'Conditioning'}
                      </div>
                      <h4 className="text-base font-bold text-[#073B72] leading-snug">
                        {session.focus}
                      </h4>

                      {/* Coaching Cue */}
                      {session.coaching_cue && (
                        <p className="text-xs text-slate-600 leading-relaxed italic bg-[#F7FBFC] p-3 rounded-xl border border-[#E2EEF4]">
                          &ldquo;{session.coaching_cue}&rdquo;
                        </p>
                      )}

                      {/* Move Details Accordion */}
                      {session.key_movements && session.key_movements.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleDay(idx)}
                            className="text-xs font-semibold text-[#0868B9] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                          >
                            <span>Key movements ({session.key_movements.length})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="pt-2 flex flex-wrap gap-1.5 animate-fadeIn">
                              {session.key_movements.map((move, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium"
                                >
                                  {move}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 3. CLINICAL FITNESS RECOMMENDATIONS ── */}
      {fitnessRecs.length > 0 && (
        <section className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-[#073B72]">Evidence-Based Movement Priorities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fitnessRecs.map((rec) => (
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
