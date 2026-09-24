import React from 'react';
import { Check, Scales01, ActivityHeart, MedicalCross, Calendar } from '@untitledui/icons';
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
          <Calendar className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-bold font-display text-[#0F172A]">
            7-Day Longitudinal Health Timeline
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#64748B]">
          Day-by-Day Synthesis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-col justify-between space-y-3 hover:bg-[#E0F2FE] transition-colors"
          >
            {/* Day Header */}
            <div className="border-b border-[#BAE6FD] pb-2">
              <span className="text-xs font-bold text-[#0F172A] block">
                {day.dayName}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] block">
                {day.date}
              </span>
            </div>

            {/* Daily Health Elements */}
            <div className="space-y-2 text-[11px]">
              {/* Meals */}
              {showDiet && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569] inline-flex items-center gap-1">
                    <Scales01 className="w-3 h-3 text-[#64748B]" aria-hidden="true" />
                    Meals
                  </span>
                  {day.mealsLogged ? (
                    <span className="text-[#047857] font-bold inline-flex items-center gap-0.5 text-[10px]">
                      <Check className="w-3 h-3" aria-hidden="true" /> Logged
                    </span>
                  ) : (
                    <span className="text-[#94A3B8] text-[10px]">None</span>
                  )}
                </div>
              )}

              {/* Movement */}
              {showFitness && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569] inline-flex items-center gap-1">
                    <ActivityHeart className="w-3 h-3 text-[#64748B]" aria-hidden="true" />
                    Exercise
                  </span>
                  {day.exerciseLogged ? (
                    <span className="text-[#047857] font-bold inline-flex items-center gap-0.5 text-[10px]">
                      <Check className="w-3 h-3" aria-hidden="true" /> Yes
                    </span>
                  ) : (
                    <span className="text-[#94A3B8] text-[10px]">Rest</span>
                  )}
                </div>
              )}

              {/* Meds */}
              {showMedications && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569] inline-flex items-center gap-1">
                    <MedicalCross className="w-3 h-3 text-[#64748B]" aria-hidden="true" />
                    Meds
                  </span>
                  <span className="font-mono text-[10px] text-[#0288D1] font-bold">
                    {day.medsCompleted}/{day.medsTotal}
                  </span>
                </div>
              )}

              {/* Symptoms */}
              {showSymptoms && (
                <div className="pt-1 border-t border-[#BAE6FD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#64748B] block">
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
                    <span className="text-[10px] text-[#94A3B8] italic block">
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
