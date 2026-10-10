import React, { useState } from 'react';
import { LineChartUp01 } from '@untitledui/icons';
import type { MedicalReport } from '../../types/report';
import {
  extractHistoricalTrends,
  getCommonTrendableTests,
} from '../../utils/reportCalculations';

interface ReportTrendVisualizerProps {
  reports: MedicalReport[];
  isMale?: boolean;
}

export const ReportTrendVisualizer: React.FC<ReportTrendVisualizerProps> = ({
  reports,
  isMale = false,
}) => {
  const commonTests = getCommonTrendableTests(reports);

  // Default to first recurring test, or fallback to common tests
  const [selectedTest, setSelectedTest] = useState<string>(() => {
    return commonTests.length > 0 ? commonTests[0] : 'Total Testosterone';
  });

  const trendPoints = extractHistoricalTrends(reports, selectedTest);

  if (commonTests.length === 0 && trendPoints.length < 2) {
    return null; // Only show section if multi-report trends exist
  }

  // Calculate SVG curve coordinates
  const values = trendPoints.map((p) => p.numericValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const pointsSvgCoords = trendPoints.map((p, idx) => {
    const x = trendPoints.length === 1 ? 50 : (idx / (trendPoints.length - 1)) * 80 + 10;
    const y = 80 - ((p.numericValue - minVal) / range) * 60;
    return { x, y, ...p };
  });

  const polylinePoints = pointsSvgCoords.map((p) => `${p.x},${p.y}`).join(' ');

  const primaryAccent = isMale ? '#0288D1' : '#F43F7D';
  const gridStroke = isMale ? '#BAE6FD' : '#FDE6EF';

  return (
    <div className={`p-6 sm:p-8 rounded-[32px] bg-white border ${isMale ? 'border-[#BAE6FD]' : 'border-[#F3E8EC]'} shadow-sm text-left select-none space-y-6`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isMale ? 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]' : 'bg-[#FDE6EF] text-[#E11D48] border-[#F43F7D]/20'} border text-xs font-mono font-bold`}>
            <LineChartUp01 className={`w-3.5 h-3.5 ${isMale ? 'text-[#0288D1]' : 'text-[#E11D48]'}`} aria-hidden="true" />
            <span>Historical Lab Comparison</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#0F172A]">
            Your Recorded Values Over Time
          </h3>
          <p className="text-xs text-[#64748B]">
            Comparing matching lab markers across multiple reports to see personal shifts.
          </p>
        </div>

        {/* Test Selector Dropdown */}
        {commonTests.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#64748B]">Select Test:</span>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className={`px-3 py-1.5 rounded-xl bg-[#F8FAFC] border ${isMale ? 'border-[#BAE6FD] focus:border-[#0288D1]' : 'border-[#FDE6EF] focus:border-[#F43F7D]'} text-xs font-bold text-[#0F172A] focus:outline-none`}
            >
              {commonTests.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SVG Trend Wave Container */}
      <div className={`p-6 rounded-3xl ${isMale ? 'bg-[#F0F9FF] border-[#BAE6FD]' : 'bg-[#FFF8FA] border-[#FDE6EF]'} border space-y-4`}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0F172A] font-display">{selectedTest}</span>
          <span className={`font-mono text-[11px] ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'} font-bold`}>
            {trendPoints.length} chronological reports
          </span>
        </div>

        <div className="relative h-40 w-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="100" y2="20" stroke={gridStroke} strokeDasharray="2,2" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke={gridStroke} strokeDasharray="2,2" strokeWidth="0.5" />
            <line x1="0" y1="80" x2="100" y2="80" stroke={gridStroke} strokeDasharray="2,2" strokeWidth="0.5" />

            {/* Connecting Polyline */}
            {pointsSvgCoords.length > 1 && (
              <polyline
                fill="none"
                stroke={primaryAccent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}

            {/* Data Points */}
            {pointsSvgCoords.map((pt, idx) => (
              <g key={idx} className="cursor-pointer group">
                <circle cx={pt.x} cy={pt.y} r="3.5" fill={primaryAccent} stroke="#FFFFFF" strokeWidth="1.5" />
              </g>
            ))}
          </svg>
        </div>

        {/* Chronological Reading Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {trendPoints.map((pt, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl bg-white border ${isMale ? 'border-[#BAE6FD]' : 'border-[#FDE6EF]'} text-left shadow-xs space-y-1`}
            >
              <span className="text-[10px] font-mono text-[#64748B] block">{pt.date}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-extrabold font-display text-[#0F172A]">
                  {pt.resultValue}
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">{pt.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
