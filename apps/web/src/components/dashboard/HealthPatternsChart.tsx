import React, { useState } from 'react';
import { LineChartUp01, BarChart01 } from '@untitledui/icons';
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
    <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#BAE6FD] shadow-sm select-none text-left space-y-6">
      {/* Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LineChartUp01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
            <h3 className="text-lg font-bold font-display text-[#0F172A]">
              Your Health Patterns
            </h3>
          </div>
          <p className="text-xs text-[#64748B] font-sans mt-0.5">
            Cross-domain correlations: Cycle phase vs symptom intensity vs activity vs sleep.
          </p>
        </div>

        {/* Time Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '3m', label: '3 Months' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as '7d' | '30d' | '3m')}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#0288D1] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Indicators Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0288D1]" />
          <span>Active Movement (min)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#29B6F6]" />
          <span>Sleep Duration (hrs)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span>Symptom Flare Index (0–10)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
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
                    ? 'bg-[#E0F2FE] border-[#0288D1] scale-105 shadow-md z-10'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F0F9FF]'
                }`}
              >
                {/* Day Label */}
                <div className="text-center">
                  <span className="text-xs font-bold text-[#0F172A] block font-display">
                    {pt.dayLabel}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B]">
                    {pt.date}
                  </span>
                </div>

                {/* Track Bars Stack */}
                <div className="w-full flex items-end justify-center gap-1.5 h-24 sm:h-32 px-1">
                  {/* Activity Bar (Scaled to 60m max) */}
                  <div
                    className="w-2.5 sm:w-3 bg-[#0288D1] rounded-t-md transition-all"
                    style={{ height: `${Math.min((pt.activityMinutes / 60) * 100, 100)}%` }}
                    title={`Activity: ${pt.activityMinutes} min`}
                  />

                  {/* Sleep Bar (Scaled to 10h max) */}
                  <div
                    className="w-2.5 sm:w-3 bg-[#29B6F6] rounded-t-md transition-all"
                    style={{ height: `${Math.min((pt.sleepHours / 10) * 100, 100)}%` }}
                    title={`Sleep: ${pt.sleepHours} hrs`}
                  />

                  {/* Symptom Bar (Scaled to 10 max) */}
                  <div
                    className="w-2.5 sm:w-3 bg-[#F59E0B] rounded-t-md transition-all"
                    style={{ height: `${Math.min((pt.symptomScore / 10) * 100, 100)}%` }}
                    title={`Symptom Score: ${pt.symptomScore}/10`}
                  />
                </div>

                {/* Phase Badge */}
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md bg-white border border-[#BAE6FD] text-[#0288D1]">
                  {pt.cyclePhase}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Tooltip Bar when hovering */}
        <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <BarChart01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span className="font-semibold text-[#0F172A]">
              {hoveredPoint ? `Insights for ${hoveredPoint.date}` : 'Hover over any day for unified metrics:'}
            </span>
          </div>

          {hoveredPoint ? (
            <div className="flex items-center gap-4 font-mono font-bold text-[#0288D1]">
              <span>Movement: {hoveredPoint.activityMinutes}m</span>
              <span>Sleep: {hoveredPoint.sleepHours}h</span>
              <span>Symptom Index: {hoveredPoint.symptomScore}/10</span>
              <span>Nutrition: {hoveredPoint.nutritionAdherence}%</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-[#64748B]">
              Cross-correlated against sleep logs and glycemic entries
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
