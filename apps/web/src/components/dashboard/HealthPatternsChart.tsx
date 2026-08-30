import React, { useState } from 'react';
import { Activity, Sparkles } from 'lucide-react';
import {
  MOCK_HEALTH_PATTERNS_7D,
  MOCK_HEALTH_PATTERNS_30D,
  MOCK_HEALTH_PATTERNS_3M,
} from '../../data/mockDashboardData';
import type { HealthPatternPoint } from '../../types/dashboard';

export const HealthPatternsChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'7d' | '30d' | '3m'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<HealthPatternPoint | null>(null);

  const dataPoints: HealthPatternPoint[] =
    activeTab === '7d'
      ? MOCK_HEALTH_PATTERNS_7D
      : activeTab === '30d'
      ? MOCK_HEALTH_PATTERNS_30D
      : MOCK_HEALTH_PATTERNS_3M;

  return (
    <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#E7DFEF] shadow-sm select-none text-left space-y-6">
      {/* Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold font-display text-[#1C1326]">
              Your Health Patterns
            </h3>
          </div>
          <p className="text-xs text-[#584B68] font-sans mt-0.5">
            Cross-domain correlations: Cycle phase vs symptom intensity vs activity vs sleep.
          </p>
        </div>

        {/* Time Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-[#F2ECF7] border border-[#E7DFEF] self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '3m', label: '3 Months' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as '7d' | '30d' | '3m')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#6E2D8B] shadow-xs'
                  : 'text-[#8D7E9E] hover:text-[#1C1326]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Indicators Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-sans border-b border-[#F0EAF5] pb-4">
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-3 h-3 rounded-full bg-[#8E3EAF]" />
          <span>Active Movement (min)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-3 h-3 rounded-full bg-[#38BDF8]" />
          <span>Sleep Duration (hrs)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-3 h-3 rounded-full bg-[#FB7185]" />
          <span>Symptom Flare Index (0–10)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-3 h-3 rounded-full bg-[#34D399]" />
          <span>Nutrition Adherence</span>
        </div>
      </div>

      {/* Multi-Track Interactive Visualization Chart */}
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {dataPoints.map((pt, idx) => {
            const isHovered = hoveredPoint?.date === pt.date;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[180px] sm:min-h-[220px] ${
                  isHovered
                    ? 'bg-[#EDE4F7] border-[#8E3EAF] scale-105 shadow-md z-10'
                    : 'bg-[#F8F5FA] border-[#E7DFEF] hover:bg-[#F2ECF7]'
                }`}
              >
                {/* Day Label */}
                <div className="text-center">
                  <span className="text-xs font-bold text-[#1C1326] block font-display">
                    {pt.dayLabel}
                  </span>
                  <span className="text-[10px] font-mono text-[#8D7E9E]">
                    {pt.date}
                  </span>
                </div>

                {/* Track Bars Stack */}
                <div className="w-full flex items-end justify-center gap-1.5 h-24 sm:h-32 px-1">
                  {/* Activity Bar (Scaled to 60m max) */}
                  <div
                    className="w-2.5 sm:w-3.5 bg-[#8E3EAF] rounded-t-lg transition-all"
                    style={{ height: `${Math.min((pt.activityMinutes / 60) * 100, 100)}%` }}
                    title={`Activity: ${pt.activityMinutes} min`}
                  />

                  {/* Sleep Bar (Scaled to 10h max) */}
                  <div
                    className="w-2.5 sm:w-3.5 bg-[#38BDF8] rounded-t-lg transition-all"
                    style={{ height: `${Math.min((pt.sleepHours / 10) * 100, 100)}%` }}
                    title={`Sleep: ${pt.sleepHours} hrs`}
                  />

                  {/* Symptom Bar (Scaled to 10 max) */}
                  <div
                    className="w-2.5 sm:w-3.5 bg-[#FB7185] rounded-t-lg transition-all"
                    style={{ height: `${Math.min((pt.symptomScore / 10) * 100, 100)}%` }}
                    title={`Symptom Score: ${pt.symptomScore}/10`}
                  />
                </div>

                {/* Phase Badge */}
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white text-[#6E2D8B] shadow-2xs">
                  {pt.cyclePhase}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Tooltip Bar when hovering */}
        <div className="p-3.5 rounded-2xl bg-[#EDE4F7]/70 border border-[#D8B4FE]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8E3EAF]" />
            <span className="font-bold text-[#1C1326]">
              {hoveredPoint ? `Insights for ${hoveredPoint.date}` : 'Hover over any day for unified metrics:'}
            </span>
          </div>

          {hoveredPoint ? (
            <div className="flex items-center gap-4 font-mono font-bold text-[#6E2D8B]">
              <span>Movement: {hoveredPoint.activityMinutes}m</span>
              <span>Sleep: {hoveredPoint.sleepHours}h</span>
              <span>Symptom Index: {hoveredPoint.symptomScore}/10</span>
              <span>Nutrition: {hoveredPoint.nutritionAdherence}%</span>
            </div>
          ) : (
            <span className="text-[11px] font-mono text-[#584B68]">
              Cross-correlated against sleep logs and glycemic entries
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
