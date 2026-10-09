import React, { useState } from 'react';
import {
  LineChartUp01,
  Activity,
  Calendar,
  ActivityHeart,
  Droplets01,
  MedicalCross,
  InfoCircle,
} from '@untitledui/icons';
import type { HealthTrajectorySummary, HealthTrajectoryDataPoint } from '../../types/timeline';

interface HealthTrajectoryChartProps {
  trajectory: HealthTrajectorySummary;
  isFemale?: boolean;
}

export const HealthTrajectoryChart: React.FC<HealthTrajectoryChartProps> = ({
  trajectory,
  isFemale = false,
}) => {
  const [activeSignals, setActiveSignals] = useState({
    cycle: true,
    symptoms: true,
    movement: true,
    hydration: true,
    adherence: true,
  });

  const [hoveredPoint, setHoveredPoint] = useState<HealthTrajectoryDataPoint | null>(null);

  const toggleSignal = (key: keyof typeof activeSignals) => {
    setActiveSignals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { dataPoints, totalLoggedDays, coveragePercentage } = trajectory;

  if (dataPoints.length === 0) {
    return null;
  }

  // Chart dimensions
  const height = 180;
  const padding = 20;
  const count = dataPoints.length;

  // Max bounds for scaling
  const maxMovement = Math.max(60, ...dataPoints.map((d) => d.movementMinutes));
  const maxWater = Math.max(10, ...dataPoints.map((d) => d.waterGlasses));

  // Generate SVG path for a given metric
  const generatePath = (getValue: (d: HealthTrajectoryDataPoint) => number, maxVal: number) => {
    if (count <= 1) return '';
    return dataPoints
      .map((d, idx) => {
        const x = padding + (idx / (count - 1)) * (600 - 2 * padding);
        const norm = Math.min(1, Math.max(0, getValue(d) / maxVal));
        const y = height - padding - norm * (height - 2 * padding);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const symptomPath = generatePath((d) => d.symptomSeverityScore, 10);
  const movementPath = generatePath((d) => d.movementMinutes, maxMovement);
  const hydrationPath = generatePath((d) => d.waterGlasses, maxWater);
  const adherencePath = generatePath((d) => d.medsAdherencePercent, 100);

  return (
    <div
      className={`p-6 sm:p-7 rounded-2xl bg-white border ${
        isFemale ? 'border-[#FDE6EF]' : 'border-[#BAE6FD]'
      } shadow-none space-y-6 select-none text-left`}
    >
      {/* Chart Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LineChartUp01
            className={`w-5 h-5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'} shrink-0`}
            aria-hidden="true"
          />
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
              Health Signal Trajectory
            </h2>
            <p className="text-xs text-[#64748B]">
              Interactive multi-signal timeline overlaying your longitudinal wellness data.
            </p>
          </div>
        </div>

        {/* Coverage Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
              isFemale ? 'text-[#BE185D] bg-[#FDE6EF]' : 'text-[#0288D1] bg-[#E0F2FE]'
            }`}
          >
            {coveragePercentage}% Tracking Coverage ({totalLoggedDays} Active Days)
          </span>
        </div>
      </div>

      {/* Signal Track Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => toggleSignal('symptoms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.symptoms
              ? isFemale
                ? 'bg-[#FDE6EF] text-[#BE185D] border-[#F43F7D]'
                : 'bg-[#E0F2FE] text-[#01579B] border-[#0288D1]'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] opacity-60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Symptom Intensity</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('movement')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.movement
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] opacity-60'
          }`}
        >
          <ActivityHeart className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Movement Minutes</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('hydration')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.hydration
              ? isFemale
                ? 'bg-[#E0F7FA] text-[#008CA5] border-[#008CA5]'
                : 'bg-sky-50 text-sky-800 border-sky-300'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] opacity-60'
          }`}
        >
          <Droplets01 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Hydration (Glasses)</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('adherence')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.adherence
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] opacity-60'
          }`}
        >
          <MedicalCross className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Med Adherence</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('cycle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.cycle
              ? 'bg-sky-50 text-sky-800 border-sky-300'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] opacity-60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Cycle Phase Bands</span>
        </button>
      </div>

      {/* SVG Visualization Canvas */}
      <div className="relative p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
        {/* Interactive Tooltip if hovered */}
        {hoveredPoint && (
          <div
            className={`absolute top-3 right-3 z-20 p-3 rounded-xl bg-white/95 backdrop-blur-md border ${
              isFemale ? 'border-[#FDE6EF]' : 'border-[#BAE6FD]'
            } shadow-lg text-xs space-y-1 animate-in fade-in duration-150`}
          >
            <div className="font-bold text-[#0F172A] flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-1">
              <span>{hoveredPoint.displayDate}</span>
              {hoveredPoint.cycleDay && (
                <span className={`font-mono ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}>
                  CD {hoveredPoint.cycleDay} • {hoveredPoint.phaseName}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-[#475569]">
              <span>Symptoms: <strong className="text-[#0F172A]">{hoveredPoint.symptomsCount}</strong></span>
              <span>Movement: <strong className="text-[#0F172A]">{hoveredPoint.movementMinutes}m</strong></span>
              <span>Water: <strong className="text-[#0F172A]">{hoveredPoint.waterGlasses} gl</strong></span>
              <span>Meds: <strong className="text-[#0F172A]">{hoveredPoint.medsAdherencePercent}%</strong></span>
            </div>
          </div>
        )}

        <svg viewBox="0 0 600 180" className="w-full h-44 overflow-visible">
          {/* Background Grid Lines */}
          <line x1={padding} y1={padding} x2={600 - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={600 - padding} y2={height / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={600 - padding} y2={height - padding} stroke="#CBD5E1" />

          {/* Cycle Phase Shading Bands */}
          {activeSignals.cycle &&
            dataPoints.map((d, idx) => {
              if (!d.phaseName) return null;
              const x = padding + (idx / (count - 1)) * (600 - 2 * padding);
              const isMenstrual = d.phaseName === 'Menstrual Phase';
              const isOvulatory = d.phaseName === 'Ovulatory Window';
              if (!isMenstrual && !isOvulatory) return null;

              return (
                <rect
                  key={idx}
                  x={x - 4}
                  y={padding}
                  width={8}
                  height={height - 2 * padding}
                  fill={isMenstrual ? '#F43F5E' : isFemale ? '#F43F7D' : '#0288D1'}
                  opacity={0.12}
                />
              );
            })}

          {/* Signal Lines */}
          {activeSignals.movement && movementPath && (
            <path d={movementPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" opacity={0.85} />
          )}

          {activeSignals.hydration && hydrationPath && (
            <path
              d={hydrationPath}
              fill="none"
              stroke={isFemale ? '#008CA5' : '#0284C7'}
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
              opacity={0.8}
            />
          )}

          {activeSignals.adherence && adherencePath && (
            <path d={adherencePath} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="2 2" opacity={0.75} />
          )}

          {activeSignals.symptoms && symptomPath && (
            <path
              d={symptomPath}
              fill="none"
              stroke={isFemale ? '#F43F7D' : '#0288D1'}
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Interactive Date Nodes */}
          {dataPoints.map((d, idx) => {
            const x = padding + (idx / (count - 1)) * (600 - 2 * padding);
            const isHovered = hoveredPoint?.date === d.date;

            return (
              <g key={d.date} onMouseEnter={() => setHoveredPoint(d)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                {/* Transparent hit area */}
                <rect x={x - 8} y={0} width={16} height={height} fill="transparent" />

                {/* Point dot */}
                {d.eventsCount > 0 && (
                  <circle
                    cx={x}
                    cy={height - padding - (d.symptomSeverityScore / 10) * (height - 2 * padding)}
                    r={isHovered ? 5 : 3}
                    fill={
                      isHovered
                        ? isFemale ? '#FB7185' : '#29B6F6'
                        : isFemale ? '#F43F7D' : '#0288D1'
                    }
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom Timeline Axis Labels */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-2 px-2 border-t border-[#E2E8F0]">
          <span>{dataPoints[0]?.displayDate}</span>
          <span className="hidden sm:inline">{dataPoints[Math.floor(count / 2)]?.displayDate}</span>
          <span>{dataPoints[count - 1]?.displayDate}</span>
        </div>
      </div>

      {/* Explainer Tip */}
      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
        <InfoCircle className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'} shrink-0`} aria-hidden="true" />
        <span>Hover along the trajectory to inspect daily multi-signal correlation snapshots.</span>
      </div>
    </div>
  );
};
