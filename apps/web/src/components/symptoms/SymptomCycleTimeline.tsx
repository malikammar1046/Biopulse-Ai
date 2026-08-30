import React from 'react';
import { Activity } from 'lucide-react';
import type { SymptomRecord } from '../../types/symptom';
import { CATEGORY_METADATA } from '../../types/symptom';

interface SymptomCycleTimelineProps {
  records: SymptomRecord[];
  cycleLength?: number;
}

export const SymptomCycleTimeline: React.FC<SymptomCycleTimelineProps> = ({
  records,
  cycleLength = 28,
}) => {
  // Filter symptoms that have a cycleDay attached
  const cycleSymptoms = records.filter(
    (r) => r.cycleDay !== null && r.cycleDay >= 1 && r.cycleDay <= cycleLength + 7
  );

  // Group symptoms by cycle day
  const symptomsByDay: Record<number, SymptomRecord[]> = {};
  for (const s of cycleSymptoms) {
    const day = s.cycleDay as number;
    if (!symptomsByDay[day]) {
      symptomsByDay[day] = [];
    }
    symptomsByDay[day].push(s);
  }

  const milestones = [1, 7, 14, 21, cycleLength];

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-left select-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Cycle Scatter Timeline</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
            Symptoms Across Your Cycle
          </h3>
          <p className="text-xs text-[#584B68]">
            See when symptoms occurred relative to your period start and cycle days.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#8D7E9E]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" /> Cycle & Body
          <span className="w-2.5 h-2.5 rounded-full bg-[#A21CAF] ml-2" /> Skin & Hair
          <span className="w-2.5 h-2.5 rounded-full bg-[#8E3EAF] ml-2" /> Energy & Mood
        </div>
      </div>

      {cycleSymptoms.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-center space-y-2">
          <p className="text-xs text-[#584B68]">
            No cycle-linked symptoms recorded yet. When you log symptoms during your period cycles, they will plot automatically along this ~{cycleLength}-day timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Visual Track */}
          <div className="relative py-8 px-2 sm:px-6 bg-[#FAF8FC] rounded-3xl border border-[#E7DFEF]/60">
            {/* Horizontal Baseline Bar */}
            <div className="relative h-2 rounded-full bg-gradient-to-r from-[#6E2D8B]/20 via-[#8E3EAF]/30 to-[#FB7185]/20">
              {/* Day Markers */}
              {milestones.map((day) => {
                const percent = ((day - 1) / (cycleLength - 1)) * 100;
                return (
                  <div
                    key={day}
                    style={{ left: `${percent}%` }}
                    className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center gap-1.5"
                  >
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-[#8E3EAF] shadow-xs" />
                    <span className="text-[10px] font-mono font-bold text-[#8D7E9E] mt-1">
                      Day {day}
                    </span>
                  </div>
                );
              })}

              {/* Symptom Dots */}
              {Object.entries(symptomsByDay).map(([dayStr, dayRecords]) => {
                const day = Number(dayStr);
                const percent = Math.min(100, Math.max(0, ((day - 1) / (cycleLength - 1)) * 100));

                return (
                  <div
                    key={day}
                    style={{ left: `${percent}%` }}
                    className="absolute -top-7 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-9 bg-[#1C1326] text-white text-[10px] font-sans px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap z-20">
                      Day {day}: {dayRecords.map((r) => r.symptomType).join(', ')}
                    </div>

                    {/* Dot Pill */}
                    <div className="flex -space-x-1.5">
                      {dayRecords.slice(0, 3).map((r, idx) => {
                        const meta = CATEGORY_METADATA[r.category] || CATEGORY_METADATA.other;
                        return (
                          <div
                            key={idx}
                            style={{ backgroundColor: meta.color }}
                            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs animate-pulse"
                            title={`Day ${day}: ${r.symptomType} (${r.severity})`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend / Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#584B68] pt-2">
            <span className="font-medium">
              Mapped {cycleSymptoms.length} symptom {cycleSymptoms.length === 1 ? 'event' : 'events'} across active cycle days.
            </span>
            <span className="font-mono text-[11px] text-[#8D7E9E]">
              Hover over dots for symptom details
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
