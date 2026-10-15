import React, { useState } from 'react';
import {
  Activity,
  InfoCircle,
  LayersThree01,
  ShieldTick,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type {
  ScreeningHistoryPoint,
  ScreeningComparabilityInfo,
} from '../../types/longitudinalHealth';
import { calculateMetricDelta, getTrendExplanation } from '../../utils/longitudinalCalculations';

interface RiskTrendChartProps {
  pathway: HealthPathway;
  history: ScreeningHistoryPoint[];
  comparability?: ScreeningComparabilityInfo | null;
  hasSingleAssessment?: boolean;
  hasNoAssessments?: boolean;
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({
  pathway,
  history,
  comparability,
  hasSingleAssessment = false,
  hasNoAssessments = false,
}) => {
  const isMale = pathway === 'male';
  const [hoveredPoint, setHoveredPoint] = useState<ScreeningHistoryPoint | null>(null);

  const themeColor = isMale ? '#0288D1' : '#F43F7D';
  const themeBgLight = isMale ? '#F0F9FF' : '#FDE6EF';
  const themeBorder = isMale ? '#BAE6FD' : '#FBCFE8';

  // 1. Zero assessments state
  if (hasNoAssessments || !history || history.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Screening Risk Progression
            </h2>
          </div>
          <span className="text-xs font-mono text-[#98A2B3]">No Records</span>
        </div>
        <div className="py-12 px-4 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white border border-[#EAECF0] flex items-center justify-center mx-auto shadow-xs">
            <Activity className="w-6 h-6 text-[#98A2B3]" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#111318]">No Longitudinal Risk Benchmarks</p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto leading-relaxed">
            Screening risk trajectories require completed clinical assessments to plot authoritative longitudinal shifts.
          </p>
        </div>
      </div>
    );
  }

  // 2. Exactly one assessment state (Constraint: NO synthetic fake lines!)
  if (hasSingleAssessment || history.length === 1) {
    const single = history[0];
    const probPercent = single.probability_percent;
    const isHigher = single.risk_category?.toLowerCase().includes('high');
    const threshold = isMale ? 18.1 : 25.0;

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
                Screening Risk Progression
              </h2>
              <p className="text-xs text-[#667085] font-sans">
                Authoritative risk trajectory across completed clinical assessments.
              </p>
            </div>
          </div>
          <span
            className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full border self-start sm:self-center"
            style={{
              backgroundColor: themeBgLight,
              color: themeColor,
              borderColor: themeBorder,
            }}
          >
            Baseline Calibration Active
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-[#667085] uppercase tracking-wider">
                Initial Assessment Benchmark
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#111318] tracking-tight">
                  {probPercent}%
                </span>
                <span className="text-xs font-mono text-[#667085]">
                  Calculated Risk Probability
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full border ${
                  isHigher
                    ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
                    : 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]'
                }`}
              >
                {single.risk_label}
              </span>
              <span className="text-xs font-mono bg-white text-[#344054] border border-[#EAECF0] px-3 py-1 rounded-full shadow-2xs">
                {single.tier_label}
              </span>
            </div>
          </div>

          {/* Clinical Gauge Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#667085]">
              <span>Lower Probability (0%)</span>
              <span className="font-semibold text-[#111318]">Decision Threshold ({threshold}%)</span>
              <span>Elevated (100%)</span>
            </div>
            <div className="relative h-2.5 w-full bg-[#EAECF0] rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(5, probPercent))}%`,
                  backgroundColor: themeColor,
                }}
              />
              {/* Threshold indicator marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#111318] z-10"
                style={{ left: `${threshold}%` }}
                title={`Clinical Threshold: ${threshold}%`}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EAECF0] flex items-start gap-3 shadow-2xs">
            <InfoCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: themeColor }} aria-hidden="true" />
            <p className="text-xs text-[#475467] leading-relaxed">
              <strong>Single Baseline Established:</strong> A clinical trend trajectory requires at least two points in time. This initial evaluation serves as your authoritative reference benchmark. Future follow-up screenings will generate your comparative progression curve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Two or more points: Render True High-Definition SVG Progression Curve
  const sortedPoints = [...history].sort(
    (a, b) => new Date(a.observed_at || a.created_at).getTime() - new Date(b.observed_at || b.created_at).getTime()
  );

  const chartWidth = 600;
  const chartHeight = 200;
  const padX = 50;
  const padY = 35;

  const probs = sortedPoints.map((p) => p.probability_percent);
  const minY = Math.max(0, Math.floor(Math.min(...probs) / 10) * 10 - 10);
  const maxY = Math.min(100, Math.ceil(Math.max(...probs) / 10) * 10 + 10);
  const rangeY = Math.max(maxY - minY, 20);

  const getX = (idx: number) => {
    return padX + (idx / (sortedPoints.length - 1)) * (chartWidth - padX * 2);
  };

  const getY = (val: number) => {
    return chartHeight - padY - ((val - minY) / rangeY) * (chartHeight - padY * 2);
  };

  // Build smooth path
  let pathD = '';
  for (let i = 0; i < sortedPoints.length; i++) {
    const x = getX(i);
    const y = getY(sortedPoints[i].probability_percent);
    if (i === 0) {
      pathD = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      const prevX = getX(i - 1);
      const prevY = getY(sortedPoints[i - 1].probability_percent);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      pathD += ` C ${cpX1.toFixed(1)} ${prevY.toFixed(1)}, ${cpX2.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }

  const areaD = `${pathD} L ${getX(sortedPoints.length - 1).toFixed(1)} ${chartHeight - padY} L ${getX(0).toFixed(1)} ${chartHeight - padY} Z`;

  // Decision Threshold
  const clinicalThreshold = isMale ? 18.08 : 25.0;
  const hasThresholdInView = clinicalThreshold >= minY && clinicalThreshold <= maxY;
  const thresholdY = hasThresholdInView ? getY(clinicalThreshold) : null;

  const hasCrossTier = sortedPoints.some(
    (p, idx) => idx > 0 && p.assessment_level !== sortedPoints[idx - 1].assessment_level
  );

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
            <Activity className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Screening Risk Progression
            </h2>
            <p className="text-xs text-[#667085] font-sans">
              Authoritative risk trajectory across {sortedPoints.length} completed clinical assessments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {hasCrossTier && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono">
              <LayersThree01 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Multi-Tier Assessment</span>
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
            <ShieldTick className="w-3.5 h-3.5 text-[#16A36A]" aria-hidden="true" />
            Verified Points Only
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] rounded-2xl p-4 sm:p-5">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 sm:h-56 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`riskGrad-${pathway}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0.01" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[minY, Math.round(minY + rangeY / 2), maxY].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padX}
                  y1={y}
                  x2={chartWidth - padX}
                  y2={y}
                  stroke="#E4E7EC"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#98A2B3"
                  fontFamily="monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Clinical Threshold dashed line */}
          {thresholdY !== null && (
            <g>
              <line
                x1={padX}
                y1={thresholdY}
                x2={chartWidth - padX}
                y2={thresholdY}
                stroke="#F04438"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              <text
                x={chartWidth - padX - 4}
                y={thresholdY - 5}
                textAnchor="end"
                fontSize="9"
                fill="#D92D20"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Threshold ({clinicalThreshold}%)
              </text>
            </g>
          )}

          {/* Gradient Area Fill */}
          <path d={areaD} fill={`url(#riskGrad-${pathway})`} />

          {/* Smooth Connected Line */}
          <path
            d={pathD}
            fill="none"
            stroke={themeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {sortedPoints.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.probability_percent);
            const isHovered = hoveredPoint?.id === p.id;

            return (
              <g
                key={p.id || idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : 5.5}
                  fill="#FFFFFF"
                  stroke={themeColor}
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  className="transition-all duration-150"
                />
                <circle cx={cx} cy={cy} r={2.5} fill={themeColor} />

                {/* Date Label */}
                <text
                  x={cx}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#667085"
                  fontFamily="monospace"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {new Date(p.observed_at || p.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Active Tooltip */}
        {hoveredPoint && (
          <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#D0D5DD] shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-[#111318]">
                {hoveredPoint.probability_percent}% Probability
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
                {hoveredPoint.risk_label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-[#667085] border border-[#EAECF0]">
                {hoveredPoint.tier_label}
              </span>
            </div>
            <span className="font-mono text-[#667085]">
              {new Date(hoveredPoint.observed_at || hoveredPoint.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Clinical Screening Trend Summary */}
      {(() => {
        const values = sortedPoints.map((p) => p.probability_percent);
        const prev = values.length >= 2 ? values[values.length - 2] : null;
        const curr = values[values.length - 1];
        const delta = calculateMetricDelta(prev, curr, '%');
        const metricName = isMale ? 'Hypogonadism Screening Likelihood' : 'PCOS Screening Likelihood';
        const explanation = getTrendExplanation(
          metricName,
          values,
          sortedPoints.map((p) => p.observed_at || p.created_at),
          '%'
        );

        return (
          <div className="p-4 rounded-xl bg-white border border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start sm:items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-full border text-[11px] shrink-0 ${
                  delta.isStable
                    ? 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]'
                    : isMale
                    ? 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'
                    : 'bg-[#FDE6EF] text-[#DC326C] border-[#FBCFE8]'
                }`}
              >
                {delta.displayChange}
              </span>
              <p className="text-[#475467] font-medium leading-relaxed">
                {explanation}
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#98A2B3] shrink-0 self-end sm:self-center">
              {sortedPoints.length} assessments plotted
            </span>
          </div>
        );
      })()}

      {/* Cross-Tier Clarification Alert */}
      {comparability?.state === 'cross_tier' && (
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
          <InfoCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong>Clinical Depth Progression:</strong> Your assessment history includes transitions across tiers (e.g. initial questionnaire advancing to confirmatory biochemical labs). Because higher tiers incorporate direct lab measurements, changes in risk probability reflect upgraded clinical evidence rather than like-for-like drift.
          </p>
        </div>
      )}
    </div>
  );
};

export default RiskTrendChart;
