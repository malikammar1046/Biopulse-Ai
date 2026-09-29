import React, { useState } from 'react';
import {
  Dumbbell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { FitnessPillar, RecommendationItem } from '../../types/lifestyle';
import { RecommendationCard } from './RecommendationCard';

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
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Protocol Overview */}
      <section
        aria-labelledby="fitness-protocol-title"
        className="rounded-2xl bg-white border border-[#D7EAF2] p-6 sm:p-8 space-y-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-teal-50 text-[#0E9EAA]'
              }`}
            >
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F] block">
                Movement & Conditioning Protocol
              </span>
              <h2 id="fitness-protocol-title" className="text-xl sm:text-2xl font-bold text-[#073B72]">
                {fitness.protocol_name}
              </h2>
            </div>
          </div>

          {/* Quick Target Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-xs font-bold text-[#073B72]">
              {fitness.aerobic_target_minutes} min/wk Aerobic
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-xs font-bold text-[#073B72]">
              {fitness.resistance_target_sessions}x/wk Resistance
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-4xl">
          {fitness.overview}
        </p>

        {/* Clinical Pathway Benefit */}
        <div className="p-4 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-xs sm:text-sm text-slate-800 space-y-1">
          <strong className="block text-xs font-bold uppercase tracking-wider text-[#073B72]">
            Hormonal & Metabolic Mechanism
          </strong>
          <p className="leading-relaxed">{fitness.pathway_clinical_benefit}</p>
        </div>
      </section>

      {/* 2. 7-Day Lightweight Weekly Schedule (Expandable, not 7 giant cards) */}
      {fitness.weekly_schedule && fitness.weekly_schedule.length > 0 && (
        <section aria-labelledby="weekly-schedule-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="weekly-schedule-title" className="text-lg font-bold text-[#073B72]">
                Suggested Weekly Structure
              </h3>
              <p className="text-xs text-[#55718F]">
                {fitness.weekly_frequency || 'Balanced weekly routine designed for joint safety and metabolic adaptation'}
              </p>
            </div>
            <span className="text-xs text-[#55718F] hidden sm:inline">
              Click any day to expand movements
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-[#D7EAF2] overflow-hidden divide-y divide-[#D7EAF2] shadow-xs">
            {fitness.weekly_schedule.map((session, idx) => {
              const isExpanded = expandedDay === idx;
              return (
                <div key={idx} className="transition-colors hover:bg-[#F5FBFD]/50">
                  {/* Day Summary Row */}
                  <button
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className="w-12 sm:w-14 text-xs sm:text-sm font-bold text-[#073B72] shrink-0">
                        {session.day_name}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                          {session.focus}
                        </span>
                        <span className="text-[11px] text-[#55718F]">
                          {session.modality} • {session.duration_mins} mins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          session.intensity === 'low'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : session.intensity === 'moderate'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {session.intensity}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#55718F]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#55718F]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-3 bg-[#F5FBFD]/60 border-t border-dashed border-[#D7EAF2]/80 animate-fadeIn">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#55718F] block">
                          Key Movements & Activities
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {session.key_movements.map((movement, mIdx) => (
                            <span
                              key={mIdx}
                              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#D7EAF2] text-slate-800 font-medium"
                            >
                              {movement}
                            </span>
                          ))}
                        </div>
                      </div>

                      {session.coaching_cue && (
                        <div className="p-3 rounded-xl bg-white border border-[#D7EAF2] text-xs text-slate-700 italic">
                          <strong className="not-italic text-[#073B72] font-semibold mr-1">
                            Coaching Cue:
                          </strong>
                          {session.coaching_cue}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Systemic Recovery & Joint Protection Guidance */}
      {fitness.recovery_guidance && (
        <section
          aria-labelledby="recovery-guidance-title"
          className="rounded-2xl bg-teal-50/60 border border-teal-200/80 p-5 sm:p-6 flex items-start gap-3 text-slate-800"
        >
          <CheckCircle2 className="w-5 h-5 text-[#20B486] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
            <h3 id="recovery-guidance-title" className="font-bold text-[#073B72]">
              Joint Comfort & Systemic Recovery
            </h3>
            <p className="text-slate-700">{fitness.recovery_guidance}</p>
          </div>
        </section>
      )}

      {/* 4. Filtered Fitness Recommendations */}
      {fitnessRecs.length > 0 && (
        <section aria-labelledby="fitness-recs-title" className="space-y-4 pt-4 border-t border-[#D7EAF2]">
          <h3 id="fitness-recs-title" className="text-lg font-bold text-[#073B72]">
            Specific Movement Actions
          </h3>
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
