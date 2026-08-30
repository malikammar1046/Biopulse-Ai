import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { MedicalReport } from '../../types/report';
import {
  extractHistoricalTrends,
  getCommonTrendableTests,
} from '../../utils/reportCalculations';

interface ReportTrendVisualizerProps {
  reports: MedicalReport[];
}

export const ReportTrendVisualizer: React.FC<ReportTrendVisualizerProps> = ({ reports }) => {
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

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-left select-none space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Historical Lab Comparison</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
            Your Recorded Values Over Time
          </h3>
          <p className="text-xs text-[#584B68]">
            Comparing matching lab markers across multiple reports to see personal shifts.
          </p>
        </div>

        {/* Test Selector Dropdown */}
        {commonTests.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8D7E9E]">Select Test:</span>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-bold text-[#1C1326] focus:outline-none focus:border-[#8E3EAF]"
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
      <div className="p-6 rounded-3xl bg-[#FAF8FC] border border-[#E7DFEF]/60 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#1C1326] font-display">{selectedTest}</span>
          <span className="font-mono text-[11px] text-[#8E3EAF] font-bold">
            {trendPoints.length} chronological reports
          </span>
        </div>

        <div className="relative h-40 w-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="100" y2="20" stroke="#E7DFEF" strokeDasharray="2,2" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#E7DFEF" strokeDasharray="2,2" strokeWidth="0.5" />
            <line x1="0" y1="80" x2="100" y2="80" stroke="#E7DFEF" strokeDasharray="2,2" strokeWidth="0.5" />

            {/* Connecting Polyline */}
            {pointsSvgCoords.length > 1 && (
              <polyline
                fill="none"
                stroke="url(#trendGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}

            <defs>
              <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6E2D8B" />
                <stop offset="50%" stopColor="#8E3EAF" />
                <stop offset="100%" stopColor="#FB7185" />
              </linearGradient>
            </defs>

            {/* Data Points */}
            {pointsSvgCoords.map((pt, idx) => (
              <g key={idx} className="cursor-pointer group">
                <circle cx={pt.x} cy={pt.y} r="3.5" fill="#6E2D8B" stroke="#FFFFFF" strokeWidth="1.5" />
              </g>
            ))}
          </svg>
        </div>

        {/* Chronological Reading Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {trendPoints.map((pt, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white border border-[#E7DFEF] text-left shadow-2xs space-y-1"
            >
              <span className="text-[10px] font-mono text-[#8D7E9E] block">{pt.date}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-extrabold font-display text-[#1C1326]">
                  {pt.resultValue}
                </span>
                <span className="text-[10px] font-mono text-[#8D7E9E]">{pt.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
