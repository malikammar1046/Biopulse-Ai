import React from 'react';
import { motion } from 'framer-motion';
import type { HealthPathway } from '../../types/onboarding';

interface SemicircularRiskGaugeProps {
  probabilityPercent: number;
  riskCategory?: string;
  pathway: HealthPathway;
  threshold?: number;
  assessmentLevel?: string;
  className?: string;
}

export const SemicircularRiskGauge: React.FC<SemicircularRiskGaugeProps> = ({
  probabilityPercent,
  riskCategory = 'lower',
  pathway,
  threshold,
  assessmentLevel = 'tier_1',
  className = '',
}) => {
  // ── 1. Derive dynamic cutoffs from production model configuration ──
  // For Female (PCOS):
  // Tier 1: low_cutoff = 0.20, threshold = 0.38
  // Tier 2+: low_cutoff = 0.18, threshold = 0.29
  // For Male (Hypogonadism):
  // Tier 1: low_cutoff = 0.10, threshold = 0.1808
  // Tier 2: low_cutoff = 0.18, threshold = 0.3379
  const isFemale = pathway === 'female';
  const isTier1 = assessmentLevel === 'tier_1';

  const p2 = threshold !== undefined
    ? threshold
    : isFemale
    ? (isTier1 ? 0.38 : 0.29)
    : (isTier1 ? 0.1808 : 0.3379);

  const p1 = isFemale
    ? (isTier1 ? 0.20 : 0.18)
    : (isTier1 ? 0.10 : 0.18);

  const probFraction = Math.min(1.0, Math.max(0.0, probabilityPercent / 100));

  // Determine active zone based on backend risk category or threshold
  const normalizedCategory = riskCategory.toLowerCase();
  const isHigherActive =
    normalizedCategory.includes('high') ||
    normalizedCategory.includes('elevated') ||
    probFraction >= p2;

  const isIntermediateActive =
    !isHigherActive &&
    (normalizedCategory.includes('intermediate') ||
      normalizedCategory.includes('moderate') ||
      probFraction >= p1);

  const isLowerActive = !isHigherActive && !isIntermediateActive;

  // Active zone indicator color
  const activeColor = isHigherActive
    ? '#E11D48' // Rose / Danger
    : isIntermediateActive
    ? '#D97706' // Amber / Warning
    : '#059669'; // Emerald / Success

  const activeCategoryLabel = isHigherActive
    ? 'Higher screening risk'
    : isIntermediateActive
    ? 'Intermediate screening risk'
    : 'Lower screening risk';

  // ── 2. SVG Geometry ──
  // Pivot is at (cx, cy). Semicircle spans from 180deg (left) to 0deg (right)
  const cx = 110;
  const cy = 100;
  const radius = 74;
  const strokeWidth = 14;

  // Arc path helper: draws an arc from fraction pStart to pEnd
  const getArcPath = (startFrac: number, endFrac: number) => {
    const s = Math.min(0.999, Math.max(0.001, startFrac));
    const e = Math.min(0.999, Math.max(0.001, endFrac));
    if (s >= e) return '';

    const startAngle = Math.PI * (1 - s);
    const endAngle = Math.PI * (1 - e);

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy - radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy - radius * Math.sin(endAngle);

    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  // Segments with subtle spacing gaps
  const gap = 0.014;
  const pathLower = getArcPath(0.004, Math.max(0.004, p1 - gap));
  const pathIntermediate = getArcPath(p1 + gap, Math.max(p1 + gap, p2 - gap));
  const pathHigher = getArcPath(p2 + gap, 0.996);

  // Needle angle (-90deg at 0% left, 0deg at 50% top, +90deg at 100% right)
  // Maps linearly across the semicircle
  const needleAngle = -90 + probFraction * 180;
  // Needle length stays comfortably inside inner boundary of the arc
  const needleLength = radius - 14;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`flex flex-col items-center select-none w-full ${className}`}>
      {/* ── 1. Prominent Numerical Readout & Risk Category Badge (ABOVE the gauge) ── */}
      <div className="flex flex-col items-center text-center space-y-1">
        <span className="text-4xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-none">
          {probabilityPercent}%
        </span>
        <span
          className={`text-xs font-bold px-3 py-0.5 rounded-full border shadow-2xs ${
            isHigherActive
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : isIntermediateActive
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {activeCategoryLabel}
        </span>
      </div>

      {/* ── 2. Semicircular Speedometer Arc with Needle (16-20px vertical spacing) ── */}
      <div className="mt-4 sm:mt-5 relative w-full max-w-[250px] flex justify-center">
        <svg
          viewBox="0 0 220 115"
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`Risk gauge: ${probabilityPercent}%, ${activeCategoryLabel}`}
        >
          {/* Subtle Background Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Segment 1: Lower Risk (Green) */}
          {pathLower && (
            <path
              d={pathLower}
              fill="none"
              stroke="#10B981"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={`transition-opacity duration-300 ${
                isLowerActive ? 'opacity-100' : 'opacity-35'
              }`}
            />
          )}

          {/* Segment 2: Intermediate Risk (Amber) */}
          {pathIntermediate && (
            <path
              d={pathIntermediate}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={`transition-opacity duration-300 ${
                isIntermediateActive ? 'opacity-100' : 'opacity-35'
              }`}
            />
          )}

          {/* Segment 3: Higher Risk (Red/Rose) */}
          {pathHigher && (
            <path
              d={pathHigher}
              fill="none"
              stroke="#F43F5E"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={`transition-opacity duration-300 ${
                isHigherActive ? 'opacity-100' : 'opacity-35'
              }`}
            />
          )}

          {/* Moving Needle Indicator */}
          <motion.g
            initial={prefersReducedMotion ? false : { rotate: -90 }}
            animate={{ rotate: needleAngle }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.65,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
            }}
          >
            {/* Tapered pointer */}
            <polygon
              points={`${cx - 2.5},${cy} ${cx + 2.5},${cy} ${cx},${cy - needleLength}`}
              fill={activeColor}
            />
            {/* Center Pivot Hub */}
            <circle cx={cx} cy={cy} r={5.5} fill={activeColor} />
            <circle cx={cx} cy={cy} r={2.5} fill="#FFFFFF" />
          </motion.g>
        </svg>
      </div>

      {/* ── 3. Semicircle Legend / Segment Labels (Underneath the gauge) ── */}
      <div className="w-full max-w-[270px] grid grid-cols-3 gap-1 pt-2 text-[11px] text-center font-medium">
        <div className={`flex flex-col items-center ${isLowerActive ? 'text-emerald-700 font-bold' : 'text-[#64748B]'}`}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Lower</span>
          </div>
          <span className="text-[10px] opacity-75">0–{Math.round(p1 * 100)}%</span>
        </div>

        <div className={`flex flex-col items-center ${isIntermediateActive ? 'text-amber-800 font-bold' : 'text-[#64748B]'}`}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>Intermediate</span>
          </div>
          <span className="text-[10px] opacity-75">
            {Math.round(p1 * 100)}–{Math.round(p2 * 100)}%
          </span>
        </div>

        <div className={`flex flex-col items-center ${isHigherActive ? 'text-rose-700 font-bold' : 'text-[#64748B]'}`}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
            <span>Higher</span>
          </div>
          <span className="text-[10px] opacity-75">{Math.round(p2 * 100)}+%</span>
        </div>
      </div>
    </div>
  );
};

export default SemicircularRiskGauge;

