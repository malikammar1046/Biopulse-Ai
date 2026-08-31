import React from 'react';
import { Check, Utensils, Dumbbell, Pill, Calendar } from 'lucide-react';
import type { WeeklyTimelineDay } from '../../types/careCircle';

interface WeeklyTimelineViewProps {
  days: WeeklyTimelineDay[];
  showDiet?: boolean;
  showFitness?: boolean;
  showSymptoms?: boolean;
  showMedications?: boolean;
}

export const WeeklyTimelineView: React.FC<WeeklyTimelineViewProps> = ({
  days,
  showDiet = true,
  showFitness = true,
  showSymptoms = true,
  showMedications = true,
}) => {
  return (
    <div className="space-y-4 select-none text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Calendar className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold font-display text-[#1C1326]">
            7-Day Longitudinal Health Timeline
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#8D7E9E]">
          Day-by-Day Synthesis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col justify-between space-y-3 hover:bg-[#FAF5FF] transition-colors"
          >
            {/* Day Header */}
            <div className="border-b border-[#E7DFEF]/80 pb-2">
              <span className="text-xs font-bold text-[#1C1326] block">
                {day.dayName}
              </span>
              <span className="text-[10px] font-mono text-[#8D7E9E] block">
                {day.date}
              </span>
            </div>

            {/* Daily Health Elements */}
            <div className="space-y-2 text-[11px]">
              {/* Meals */}
              {showDiet && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#584B68] inline-flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-[#8D7E9E]" />
                    Meals
                  </span>
                  {day.mealsLogged ? (
                    <span className="text-[#047857] font-bold inline-flex items-center gap-0.5 text-[10px]">
                      <Check className="w-3 h-3" /> Logged
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] text-[10px]">None</span>
                  )}
                </div>
              )}

              {/* Movement */}
              {showFitness && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#584B68] inline-flex items-center gap-1">
                    <Dumbbell className="w-3 h-3 text-[#8D7E9E]" />
                    Exercise
                  </span>
                  {day.exerciseLogged ? (
                    <span className="text-[#047857] font-bold inline-flex items-center gap-0.5 text-[10px]">
                      <Check className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] text-[10px]">Rest</span>
                  )}
                </div>
              )}

              {/* Meds */}
              {showMedications && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#584B68] inline-flex items-center gap-1">
                    <Pill className="w-3 h-3 text-[#8D7E9E]" />
                    Meds
                  </span>
                  <span className="font-mono text-[10px] text-[#6E2D8B] font-bold">
                    {day.medsCompleted}/{day.medsTotal}
                  </span>
                </div>
              )}

              {/* Symptoms */}
              {showSymptoms && (
                <div className="pt-1 border-t border-[#E7DFEF]/60 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#8D7E9E] block">
                    Symptoms
                  </span>
                  {day.symptoms.length > 0 ? (
                    day.symptoms.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="px-1.5 py-0.5 rounded-lg bg-[#FFE4E6] text-[#BE123C] text-[10px] font-medium leading-tight truncate"
                      >
                        {s.name} • {s.severity}
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-[#9CA3AF] italic block">
                      No symptoms logged
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
