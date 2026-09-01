import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Calendar,
  Dumbbell,
  Droplets,
  Pill,
  Info,
} from 'lucide-react';
import type { HealthTrajectorySummary, HealthTrajectoryDataPoint } from '../../types/timeline';

interface HealthTrajectoryChartProps {
  trajectory: HealthTrajectorySummary;
}

export const HealthTrajectoryChart: React.FC<HealthTrajectoryChartProps> = ({
  trajectory,
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
    <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#E7DFEF] shadow-sm space-y-6 select-none text-left">
      {/* Chart Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-[#1C1326]">
              Health Signal Trajectory
            </h2>
            <p className="text-xs text-[#584B68]">
              Interactive multi-signal timeline overlaying your longitudinal wellness data.
            </p>
          </div>
        </div>

        {/* Coverage Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#047857] bg-[#ECFDF5] px-3 py-1 rounded-full">
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
              ? 'bg-[#EDE4F7] text-[#6E2D8B] border-[#D8B4FE]'
              : 'bg-[#F8F5FA] text-[#8D7E9E] border-[#E7DFEF] opacity-60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Symptom Intensity</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('movement')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.movement
              ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
              : 'bg-[#F8F5FA] text-[#8D7E9E] border-[#E7DFEF] opacity-60'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Movement Minutes</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('hydration')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.hydration
              ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
              : 'bg-[#F8F5FA] text-[#8D7E9E] border-[#E7DFEF] opacity-60'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Hydration (Glasses)</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('adherence')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.adherence
              ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
              : 'bg-[#F8F5FA] text-[#8D7E9E] border-[#E7DFEF] opacity-60'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Med Adherence</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSignal('cycle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSignals.cycle
              ? 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]'
              : 'bg-[#F8F5FA] text-[#8D7E9E] border-[#E7DFEF] opacity-60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Cycle Phase Bands</span>
        </button>
      </div>

      {/* SVG Visualization Canvas */}
      <div className="relative p-4 rounded-3xl bg-[#FAF8FC] border border-[#E7DFEF] overflow-hidden">
        {/* Interactive Tooltip if hovered */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 z-20 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D8B4FE] shadow-lg text-xs space-y-1 animate-in fade-in duration-150">
            <div className="font-bold text-[#1C1326] flex items-center justify-between gap-3 border-b border-[#E7DFEF] pb-1">
              <span>{hoveredPoint.displayDate}</span>
              {hoveredPoint.cycleDay && (
                <span className="font-mono text-[#6E2D8B]">
                  CD {hoveredPoint.cycleDay} • {hoveredPoint.phaseName}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-[#584B68]">
              <span>Symptoms: <strong className="text-[#1C1326]">{hoveredPoint.symptomsCount}</strong></span>
              <span>Movement: <strong className="text-[#1C1326]">{hoveredPoint.movementMinutes}m</strong></span>
              <span>Water: <strong className="text-[#1C1326]">{hoveredPoint.waterGlasses} gl</strong></span>
              <span>Meds: <strong className="text-[#1C1326]">{hoveredPoint.medsAdherencePercent}%</strong></span>
            </div>
          </div>
        )}

        <svg viewBox="0 0 600 180" className="w-full h-44 overflow-visible">
          {/* Background Grid Lines */}
          <line x1={padding} y1={padding} x2={600 - padding} y2={padding} stroke="#E7DFEF" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={600 - padding} y2={height / 2} stroke="#E7DFEF" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={600 - padding} y2={height - padding} stroke="#E7DFEF" />

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
                  fill={isMenstrual ? '#FB7185' : '#8E3EAF'}
                  opacity={0.12}
                />
              );
            })}

          {/* Signal Lines */}
          {activeSignals.movement && movementPath && (
            <path d={movementPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" opacity={0.85} />
          )}

          {activeSignals.hydration && hydrationPath && (
            <path d={hydrationPath} fill="none" stroke="#0284C7" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" opacity={0.8} />
          )}

          {activeSignals.adherence && adherencePath && (
            <path d={adherencePath} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="2 2" opacity={0.75} />
          )}

          {activeSignals.symptoms && symptomPath && (
            <path d={symptomPath} fill="none" stroke="#6E2D8B" strokeWidth="3" strokeLinecap="round" />
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
                    fill={isHovered ? '#FB7185' : '#6E2D8B'}
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
        <div className="flex items-center justify-between text-[10px] font-mono text-[#8D7E9E] pt-2 px-2 border-t border-[#E7DFEF]">
          <span>{dataPoints[0]?.displayDate}</span>
          <span className="hidden sm:inline">{dataPoints[Math.floor(count / 2)]?.displayDate}</span>
          <span>{dataPoints[count - 1]?.displayDate}</span>
        </div>
      </div>

      {/* Explainer Tip */}
      <div className="flex items-center gap-2 text-[11px] text-[#8D7E9E]">
        <Info className="w-3.5 h-3.5 text-[#6E2D8B] shrink-0" />
        <span>Hover along the trajectory to inspect daily multi-signal correlation snapshots.</span>
      </div>
    </div>
  );
};
