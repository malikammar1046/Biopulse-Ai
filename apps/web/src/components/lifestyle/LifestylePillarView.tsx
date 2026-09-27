import React from 'react';
import {
  HeartPulse,
  Moon,
  Sun,
  Clock,
} from 'lucide-react';
import type { LifestylePillar, RecommendationItem } from '../../types/lifestyle';
import { RecommendationCard } from './RecommendationCard';

interface LifestylePillarViewProps {
  lifestyle: LifestylePillar;
  recommendations: RecommendationItem[];
  onSelectRecommendation: (rec: RecommendationItem) => void;
  isMale?: boolean;
}

export const LifestylePillarView: React.FC<LifestylePillarViewProps> = ({
  lifestyle,
  recommendations,
  onSelectRecommendation,
  isMale = false,
}) => {
  const lifestyleRecs = recommendations.filter(
    (r) => r.category === 'lifestyle' || r.category === 'clinical'
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Circadian & Sleep Hero Section */}
      <section
        aria-labelledby="circadian-headline-title"
        className="rounded-2xl bg-white border border-[#D7EAF2] p-6 sm:p-8 space-y-4 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-teal-50 text-[#0E9EAA]'
            }`}
          >
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F] block">
              Circadian & Recovery Routine
            </span>
            <h2 id="circadian-headline-title" className="text-xl sm:text-2xl font-bold text-[#073B72]">
              {lifestyle.circadian_headline}
            </h2>
          </div>
        </div>

        {/* Core Pillars: Sleep Target & Stress Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Target Sleep Architecture */}
          <div className="p-5 rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#073B72]">
              <Moon className="w-4 h-4 text-[#16B8C4]" />
              <span>Target Sleep Duration</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#073B72]">
              {lifestyle.sleep_target_hours}
            </div>
            <p className="text-xs text-[#55718F] leading-relaxed">
              Supports nocturnal hormone synthesis, nervous system balance, and glucose regulation.
            </p>
          </div>

          {/* Autonomic Stress Protocol */}
          <div className="p-5 rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#073B72]">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Daily Stress Reset Protocol</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pt-1">
              {lifestyle.stress_management_protocol}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Actionable Daily Habits */}
      {lifestyle.recommended_habits && lifestyle.recommended_habits.length > 0 && (
        <section aria-labelledby="daily-habits-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="daily-habits-title" className="text-lg font-bold text-[#073B72]">
                Key Daily Recovery Habits
              </h3>
              <p className="text-xs text-[#55718F]">
                Simple, sustainable routines to align your biological clock
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F5FBFD] border border-[#D7EAF2] text-[#073B72]">
              {lifestyle.recommended_habits.length} Habits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lifestyle.recommended_habits.map((habit, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#D7EAF2] p-5 space-y-3 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F5FBFD] text-[#073B72] border border-[#D7EAF2]">
                      {habit.category}
                    </span>
                    <span className="text-xs font-medium text-[#55718F] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#16B8C4]" />
                      {habit.timing}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-[#073B72]">
                    {habit.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {habit.action_item}
                  </p>
                </div>

                <div className="text-xs text-[#55718F] pt-2 border-t border-[#D7EAF2]/60">
                  <strong className="text-[#073B72] font-semibold">Why: </strong>
                  <span>{habit.rationale}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Filtered Lifestyle Recommendations */}
      {lifestyleRecs.length > 0 && (
        <section aria-labelledby="lifestyle-recs-title" className="space-y-4 pt-4 border-t border-[#D7EAF2]">
          <h3 id="lifestyle-recs-title" className="text-lg font-bold text-[#073B72]">
            Specific Lifestyle & Recovery Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {lifestyleRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onSelect={onSelectRecommendation}
                isMale={isMale}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
