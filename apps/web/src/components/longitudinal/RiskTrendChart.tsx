import React, { useState } from 'react';
import {
  Activity,
  InfoCircle,
  LayersThree01,
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

  const themeColor = isMale ? 'var(--color-medical-primary-hover, #0288D1)' : 'var(--female-primary, #F43F7D)';
  const themeBgLight = isMale ? 'var(--color-medical-primary-soft, #F0F9FF)' : 'var(--female-primary-light, #FDE6EF)';
  const themeBorder = isMale ? 'var(--color-medical-primary-border, #BAE6FD)' : 'var(--female-border, rgba(244,63,125,0.2))';

  // 1. Zero assessments state
  if (hasNoAssessments || !history || history.length === 0) {
    return (
      <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-3">
        <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-3">
          <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
            Screening Risk Progression
          </h2>
          <span className="text-xs font-mono text-[#98A2B3]">No Records</span>
        </div>
        <div className="py-10 px-4 rounded-xl bg-[#F8F9FC] border border-[#EAECF0] text-center space-y-2">
          <Activity className="w-6 h-6 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-sm font-semibold text-[#111318]">No Longitudinal Risk Points</p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Screening risk charts require at least two completed assessments to show an authoritative progression curve.
          </p>
        </div>
      </div>
    );
  }

  // 2. Exactly one assessment state (NO flat synthetic line!)
  if (hasSingleAssessment || history.length === 1) {
    const single = history[0];
    const probPercent = single.probability_percent;
    const isHigher = single.risk_category?.toLowerCase().includes('high');

    return (
      <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Screening Risk Progression
            </h2>
            <p className="text-xs text-[#667085] mt-0.5 font-sans">
              Authoritative risk trajectory across completed clinical assessments.
            </p>
          </div>
          <span
            className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border self-start sm:self-center"
            style={{
              backgroundColor: themeBgLight,
              color: themeColor,
              borderColor: themeBorder,
            }}
          >
            Baseline Measurement
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-[#667085] uppercase tracking-wider">
                Initial Assessment Recorded
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-[#111318]">
                  {probPercent}%
                </span>
                <span className="text-xs font-mono text-[#667085]">
                  Calculated Probability
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  isHigher
                    ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
                    : 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]'
                }`}
              >
                {single.risk_label}
              </span>
              <span className="text-xs font-mono bg-white text-[#344054] border border-[#EAECF0] px-2.5 py-1 rounded-full">
                {single.tier_label}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] flex items-start gap-3">
            <InfoCircle className="w-4 h-4 text-[var(--color-medical-primary-hover,#0288D1)] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-[#475569] leading-relaxed">
              <strong>Single Observation:</strong> A trend requires at least two assessments over time. This initial score is your active reference point. Once a follow-up assessment is completed, your comparative risk progression line will be rendered here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Two or more points: Render true SVG trend line (persisted points only)
  // Sort chronologically ascending for the chart
  const sortedPoints = [...history].sort(
    (a, b) => new Date(a.observed_at || a.created_at).getTime() - new Date(b.observed_at || b.created_at).getTime()
  );

  const chartWidth = 600;
  const chartHeight = 180;
  const padX = 45;
  const padY = 30;

  const probs = sortedPoints.map((p) => p.probability_percent);
  // Give comfortable Y margin (0% to 100% or min-max buffer)
  const minY = Math.max(0, Math.floor(Math.min(...probs) / 10) * 10 - 10);
  const maxY = Math.min(100, Math.ceil(Math.max(...probs) / 10) * 10 + 10);
  const rangeY = Math.max(maxY - minY, 20);

  const getX = (idx: number) => {
    return padX + (idx / (sortedPoints.length - 1)) * (chartWidth - padX * 2);
  };

  const getY = (val: number) => {
    return chartHeight - padY - ((val - minY) / rangeY) * (chartHeight - padY * 2);
  };

  // Build SVG path
  const pathD = sortedPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.probability_percent).toFixed(1)}`)
    .join(' ');

  // Gradient area path
  const areaD = `${pathD} L ${getX(sortedPoints.length - 1).toFixed(1)} ${chartHeight - padY} L ${getX(0).toFixed(1)} ${chartHeight - padY} Z`;

  // Cross-tier assessment flag detection
  const hasCrossTier = sortedPoints.some(
    (p, idx) => idx > 0 && p.assessment_level !== sortedPoints[idx - 1].assessment_level
  );

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
            Screening Risk Progression
          </h2>
          <p className="text-xs text-[#667085] mt-0.5 font-sans">
            Authoritative risk trajectory across {sortedPoints.length} completed clinical assessments.
          </p>
        </div>

        {hasCrossTier && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono self-start sm:self-center">
            <LayersThree01 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Includes Tier Upgrades</span>
          </div>
        )}
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden bg-[#FAFAFC] border border-[#EAECF0] rounded-2xl p-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-44 sm:h-52 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`riskGrad-${pathway}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
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

          {/* Area Fill */}
          <path d={areaD} fill={`url(#riskGrad-${pathway})`} />

          {/* Connected Line */}
          <path
            d={pathD}
            fill="none"
            stroke={themeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Actual Persisted Points */}
          {sortedPoints.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.probability_percent);
            const isHovered = hoveredPoint?.id === p.id;

            return (
              <g
                key={p.id || idx}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Outer Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 5}
                  fill="#FFFFFF"
                  stroke={themeColor}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />
                {/* Inner Dot */}
                <circle cx={cx} cy={cy} r={2.5} fill={themeColor} />

                {/* X Axis Date Label */}
                <text
                  x={cx}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#667085"
                  fontFamily="monospace"
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
          <div className="mt-3 p-3 rounded-xl bg-white border border-[#D0D5DD] shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#111318]">
                {hoveredPoint.probability_percent}% Probability
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
                {hoveredPoint.risk_label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono text-[#667085] border border-[#EAECF0]">
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

      {/* ── Plain-Language Clinical Screening Trend Summary (Constraint 19) ── */}
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
          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1 font-mono font-semibold px-2.5 py-0.5 rounded-full border text-[11px] shrink-0 ${
                  delta.isStable
                    ? 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]'
                    : isMale
                    ? 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'
                    : 'bg-[#FDE6EF] text-[#DC326C] border-[rgba(244,63,125,0.2)]'
                }`}
              >
                {delta.displayChange}
              </span>
              <p className="text-[#475467] font-medium leading-relaxed">
                {explanation}
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#98A2B3] shrink-0 self-end sm:self-center">
              {sortedPoints.length} assessment{sortedPoints.length > 1 ? 's' : ''}
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
