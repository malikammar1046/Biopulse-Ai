import React, { useState } from 'react';
import {
  LineChartUp01,
  LineChartDown01,
  Minus,
  InfoCircle,
  Table as TableIcon,
  LineChartUp01 as ChartIcon,
} from '@untitledui/icons';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  displayValue?: string;
  sublabel?: string;
  tooltip?: string;
}

interface HistoricalMetricChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  unit?: string;
  color?: string; // Hex or tailwind class
  emptyMessage?: string;
  insufficientMessage?: string;
  minDataPoints?: number;
  showTableToggle?: boolean;
}

export const HistoricalMetricChart: React.FC<HistoricalMetricChartProps> = ({
  title,
  subtitle,
  data,
  unit = '',
  color = 'var(--color-medical-primary-hover, #0288D1)',
  emptyMessage = 'No historical entries recorded for this metric yet.',
  insufficientMessage = 'Keep logging regularly. A clear visual trend will appear once more entries are recorded.',
  minDataPoints = 2,
  showTableToggle = true,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-[20px] bg-white border border-[var(--color-medical-primary-border,#BAE6FD)] text-left shadow-xs">
        <h4 className="text-sm font-bold font-display text-[#0F172A] mb-1">{title}</h4>
        {subtitle && <p className="text-xs text-[#475569] mb-3">{subtitle}</p>}
        <div className="py-8 px-4 rounded-xl bg-[var(--color-medical-primary-soft,#F0F9FF)] border border-[var(--color-medical-primary-border,#BAE6FD)] text-center">
          <InfoCircle className="w-5 h-5 text-[var(--color-medical-primary-hover,#0288D1)] mx-auto mb-2 opacity-80" aria-hidden="true" />
          <p className="text-xs text-[#475569] max-w-sm mx-auto">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  if (data.length < minDataPoints) {
    return (
      <div className="p-5 rounded-[20px] bg-white border border-[var(--color-medical-primary-border,#BAE6FD)] text-left shadow-xs">
        <h4 className="text-sm font-bold font-display text-[#0F172A] mb-1">{title}</h4>
        {subtitle && <p className="text-xs text-[#475569] mb-3">{subtitle}</p>}
        <div className="py-6 px-4 rounded-xl bg-[var(--color-medical-primary-soft,#F0F9FF)] border border-[var(--color-medical-primary-border,#BAE6FD)] text-left space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-medical-primary-hover,#0288D1)] bg-[#E0F2FE] border border-[var(--color-medical-primary-border,#BAE6FD)] px-2 py-0.5 rounded">
              {data.length} Entry Recorded
            </span>
            <span className="text-xs text-[#0F172A] font-semibold">
              {data[0].label}: <strong>{data[0].displayValue || data[0].value} {unit}</strong>
            </span>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">{insufficientMessage}</p>
        </div>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const chartWidth = 500;
  const chartHeight = 140;
  const paddingX = 35;
  const paddingY = 25;

  const getX = (idx: number) => {
    if (data.length <= 1) return chartWidth / 2;
    return paddingX + (idx / (data.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minVal) / range) * (chartHeight - paddingY * 2);
  };

  // Build SVG path
  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
    .join(' ');

  // Gradient area path
  const areaD = `${pathD} L ${getX(data.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`;

  // Determine direction
  const firstVal = data[0].value;
  const lastVal = data[data.length - 1].value;
  const diff = lastVal - firstVal;

  return (
    <div className="p-5 rounded-[24px] bg-white border border-[var(--color-medical-primary-border,#BAE6FD)] text-left space-y-3 shadow-xs select-none">
      {/* Header with Title & Table Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm sm:text-base font-bold font-display text-[#0F172A]">{title}</h4>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {diff > 0 ? (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <LineChartUp01 className="w-3 h-3 text-emerald-600" aria-hidden="true" /> +{diff} {unit}
                </span>
              ) : diff < 0 ? (
                <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <LineChartDown01 className="w-3 h-3 text-amber-600" aria-hidden="true" /> {diff} {unit}
                </span>
              ) : (
                <span className="text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                  <Minus className="w-3 h-3 text-[#64748B]" aria-hidden="true" /> Steady
                </span>
              )}
            </div>
          </div>
          {subtitle && <p className="text-xs text-[#475569] mt-0.5">{subtitle}</p>}
        </div>

        {showTableToggle && (
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[var(--color-medical-primary-soft,#F0F9FF)] text-[#475569] hover:text-[#0F172A] border border-[var(--color-medical-primary-border,#BAE6FD)] transition-colors cursor-pointer"
            title={viewMode === 'chart' ? 'View as accessible data table' : 'View as chart'}
            aria-label="Toggle chart / table view"
          >
            {viewMode === 'chart' ? (
              <TableIcon className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChartIcon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {viewMode === 'chart' ? (
        <div className="relative pt-2">
          {/* SVG Line & Area Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-36 overflow-visible"
              aria-label={`Historical trend chart for ${title}`}
            >
              <defs>
                <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                stroke="#E2E8F0"
                strokeDasharray="4,4"
              />
              <line
                x1={paddingX}
                y1={chartHeight / 2}
                x2={chartWidth - paddingX}
                y2={chartHeight / 2}
                stroke="#E2E8F0"
                strokeDasharray="4,4"
              />
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="#E2E8F0"
              />

              {/* Min & Max Labels */}
              <text
                x={paddingX - 8}
                y={paddingY + 3}
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                {maxVal}
              </text>
              <text
                x={paddingX - 8}
                y={chartHeight - paddingY + 3}
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                {minVal}
              </text>

              {/* Shaded Area */}
              <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />

              {/* Main Line */}
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {data.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.value);
                const isHovered = hoveredIdx === i;

                return (
                  <g key={i}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5.5 : 4}
                      fill="#FFFFFF"
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all shadow-xs"
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                    {/* X-axis date labels */}
                    <text
                      x={cx}
                      y={chartHeight - 6}
                      fill="#64748B"
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tooltip Hover Overlay */}
          {hoveredIdx !== null && data[hoveredIdx] && (
            <div className="absolute top-1 right-2 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-[var(--color-medical-primary-border,#BAE6FD)]/20 text-xs text-white shadow-lg pointer-events-none z-10">
              <span className="font-mono text-[#38BDF8] font-bold">{data[hoveredIdx].label}:</span>{' '}
              <span className="font-bold">{data[hoveredIdx].displayValue || data[hoveredIdx].value} {unit}</span>
              {data[hoveredIdx].sublabel && (
                <span className="text-[#E0F2FE] block text-[10px] mt-0.5">{data[hoveredIdx].sublabel}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto rounded-xl border border-[var(--color-medical-primary-border,#BAE6FD)]">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-mono uppercase text-[#64748B] font-bold">
                <th className="py-2 px-3">Date / Cycle</th>
                <th className="py-2 px-3">Recorded Value</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {data.map((d, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-medical-primary-soft,#F0F9FF)] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A]">{d.label}</td>
                  <td className="py-2.5 px-3 font-bold text-[var(--color-medical-primary-hover,#0288D1)]">
                    {d.displayValue || d.value} {unit}
                  </td>
                  <td className="py-2.5 px-3 text-[#475569]">{d.sublabel || d.tooltip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
