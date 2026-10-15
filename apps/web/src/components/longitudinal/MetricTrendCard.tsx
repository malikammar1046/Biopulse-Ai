import React, { useState, useMemo } from 'react';
import {
  Activity,
  InfoCircle,
  ShieldTick,
  Calendar,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { MetricSeries, MetricDataPoint } from '../../types/longitudinalHealth';
import { calculateMetricDelta, getTrendExplanation } from '../../utils/longitudinalCalculations';

interface MetricTrendCardProps {
  pathway: HealthPathway;
  metricSeriesMap: Record<string, MetricSeries>;
}

export const MetricTrendCard: React.FC<MetricTrendCardProps> = ({
  pathway,
  metricSeriesMap,
}) => {
  const isMale = pathway === 'male';

  // Filter series that are graphable and contain at least 1 observation
  const availableSeries = useMemo(() => {
    if (!metricSeriesMap) return [];
    return Object.values(metricSeriesMap).filter(
      (s) => s.is_graphable && s.data_points && s.data_points.length > 0
    );
  }, [metricSeriesMap]);

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    return availableSeries[0]?.metric_key || '';
  });

  // Keep selected key valid when data changes
  const activeSeries = useMemo(() => {
    if (!availableSeries.length) return null;
    return availableSeries.find((s) => s.metric_key === selectedKey) || availableSeries[0];
  }, [availableSeries, selectedKey]);

  const [hoveredPoint, setHoveredPoint] = useState<MetricDataPoint | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const themeColor = isMale ? '#0288D1' : '#F43F7D';

  const points = activeSeries?.data_points || [];

  // Sort chronologically ascending for the chart (memoized to eliminate redundant sorting)
  const sortedPoints = useMemo(() => {
    return [...points].sort(
      (a, b) => new Date(a.observed_at || a.timestamp).getTime() - new Date(b.observed_at || b.timestamp).getTime()
    );
  }, [points]);

  if (!availableSeries.length || !activeSeries) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Biometric & Biomarker Trajectories
            </h2>
          </div>
          <span className="text-xs font-mono text-[#98A2B3]">No Observations</span>
        </div>
        <div className="py-12 px-4 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white border border-[#EAECF0] flex items-center justify-center mx-auto shadow-xs">
            <Activity className="w-6 h-6 text-[#98A2B3]" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#111318]">No Continuous Observations Yet</p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto leading-relaxed">
            Logged weights, BMI, and verified laboratory tests will appear here with continuous trend tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5">
      {/* ── Header & Metric Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
            <Activity className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Biometric & Lab Trajectories
            </h2>
            <p className="text-xs text-[#667085] font-sans">
              Continuous trajectories derived from clinical reports and assessments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {sortedPoints.length >= 2 && (
            <div className="flex items-center p-0.5 rounded-xl bg-[#F8F9FC] border border-[#EAECF0] shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  viewMode === 'chart'
                    ? 'bg-white text-[#111318] shadow-xs'
                    : 'text-[#667085] hover:text-[#111318]'
                }`}
              >
                Chart
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#111318] shadow-xs'
                    : 'text-[#667085] hover:text-[#111318]'
                }`}
              >
                Table
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Metric Selector Pills ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {availableSeries.map((s) => {
          const isSelected = s.metric_key === activeSeries.metric_key;
          return (
            <button
              key={s.metric_key}
              type="button"
              onClick={() => {
                setSelectedKey(s.metric_key);
                setHoveredPoint(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
                isSelected
                  ? isMale
                    ? 'bg-[#0288D1] text-white shadow-xs font-semibold'
                    : 'bg-[#F43F7D] text-white shadow-xs font-semibold'
                  : 'bg-[#F8F9FC] text-[#475467] hover:bg-[#F2F4F7] border border-[#EAECF0]'
              }`}
            >
              {s.label}
              <span className="ml-1.5 text-[10px] opacity-80 font-mono">
                ({s.data_points.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Content: 1 Observation = Baseline Display ── */}
      {sortedPoints.length === 1 && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-[#667085] uppercase tracking-wider">
                {activeSeries.label} Baseline Observation
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#111318] tracking-tight">
                  {sortedPoints[0].value}
                </span>
                <span className="text-xs font-mono text-[#667085]">
                  {activeSeries.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono bg-white text-[#344054] border border-[#EAECF0] px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" aria-hidden="true" />
                {new Date(sortedPoints[0].observed_at || sortedPoints[0].timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {sortedPoints[0].is_verified && (
                <span className="text-xs font-mono bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF] px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                  <ShieldTick className="w-3.5 h-3.5 text-[#16A36A]" aria-hidden="true" />
                  Verified Clinical Record
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EAECF0] flex items-start gap-3 shadow-2xs">
            <InfoCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: themeColor }} aria-hidden="true" />
            <p className="text-xs text-[#475467] leading-relaxed">
              <strong>Single Observation:</strong> A continuous trend visualization requires at least two distinct observations over time. This baseline measurement is recorded as your authoritative reference benchmark.
            </p>
          </div>
        </div>
      )}

      {/* ── Content: 2+ Observations = SVG Chart ── */}
      {sortedPoints.length >= 2 && viewMode === 'chart' && (
        <div className="space-y-4">
          <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] rounded-2xl p-4 sm:p-5">
            {(() => {
              const chartWidth = 600;
              const chartHeight = 180;
              const padX = 50;
              const padY = 30;

              const values = sortedPoints.map((p) => p.value);
              const minVal = Math.min(...values);
              const maxVal = Math.max(...values);
              const range = maxVal - minVal || Math.abs(maxVal * 0.1) || 1;

              const getX = (idx: number) => {
                return padX + (idx / (sortedPoints.length - 1)) * (chartWidth - padX * 2);
              };

              const getY = (val: number) => {
                return chartHeight - padY - ((val - minVal) / range) * (chartHeight - padY * 2);
              };

              // Build smooth curve
              let pathD = '';
              for (let i = 0; i < sortedPoints.length; i++) {
                const x = getX(i);
                const y = getY(sortedPoints[i].value);
                if (i === 0) {
                  pathD = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
                } else {
                  const prevX = getX(i - 1);
                  const prevY = getY(sortedPoints[i - 1].value);
                  const cpX1 = prevX + (x - prevX) / 2;
                  const cpX2 = prevX + (x - prevX) / 2;
                  pathD += ` C ${cpX1.toFixed(1)} ${prevY.toFixed(1)}, ${cpX2.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
                }
              }

              const areaD = `${pathD} L ${getX(sortedPoints.length - 1).toFixed(1)} ${chartHeight - padY} L ${getX(0).toFixed(1)} ${chartHeight - padY} Z`;

              return (
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 sm:h-52 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id={`metricGrad-${activeSeries.metric_key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themeColor} stopOpacity="0.20" />
                      <stop offset="100%" stopColor={themeColor} stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[minVal, Number(((minVal + maxVal) / 2).toFixed(1)), maxVal].map((val, i) => {
                    const y = getY(val);
                    return (
                      <g key={i}>
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
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Fill */}
                  <path d={areaD} fill={`url(#metricGrad-${activeSeries.metric_key})`} />

                  {/* Smooth Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={themeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Point Nodes */}
                  {sortedPoints.map((p, idx) => {
                    const cx = getX(idx);
                    const cy = getY(p.value);
                    const isHovered = hoveredPoint?.id === p.id || hoveredPoint === p;

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
                        <text
                          x={cx}
                          y={chartHeight - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#667085"
                          fontFamily="monospace"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          {new Date(p.observed_at || p.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#D0D5DD] shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#111318]">
                    {hoveredPoint.value} {activeSeries.unit}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#F2F4F7] text-[#344054] border border-[#EAECF0] capitalize">
                    {hoveredPoint.source.replace(/_/g, ' ')}
                  </span>
                  {hoveredPoint.is_verified && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                      Verified Draw
                    </span>
                  )}
                </div>
                <span className="font-mono text-[#667085]">
                  {new Date(hoveredPoint.observed_at || hoveredPoint.timestamp).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Plain-Language Clinical Trend Summary */}
          {(() => {
            const values = sortedPoints.map((p) => p.value);
            const prev = values.length >= 2 ? values[values.length - 2] : null;
            const curr = values[values.length - 1];
            const delta = calculateMetricDelta(prev, curr, activeSeries.unit);
            const explanation = getTrendExplanation(
              activeSeries.label,
              values,
              sortedPoints.map((p) => p.observed_at || p.timestamp),
              activeSeries.unit
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
                  {sortedPoints.length} observation{sortedPoints.length > 1 ? 's' : ''}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Table View Mode ── */}
      {sortedPoints.length >= 2 && viewMode === 'table' && (
        <div className="overflow-x-auto border border-[#EAECF0] rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#EAECF0] text-[#667085] font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Observation Date</th>
                <th className="py-3 px-4">Observed Value</th>
                <th className="py-3 px-4">Clinical Source</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7] bg-white">
              {sortedPoints.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="py-3 px-4 font-mono text-[#111318]">
                    {new Date(p.observed_at || p.timestamp).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#111318]">
                    {p.value} {activeSeries.unit}
                  </td>
                  <td className="py-3 px-4 text-[#667085] capitalize">
                    {p.source.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4">
                    {p.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#027A48] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
                        <ShieldTick className="w-3 h-3 text-[#16A36A]" aria-hidden="true" /> Verified Draw
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#667085] bg-[#F2F4F7] px-2.5 py-0.5 rounded-full">
                        Patient Log
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MetricTrendCard;
