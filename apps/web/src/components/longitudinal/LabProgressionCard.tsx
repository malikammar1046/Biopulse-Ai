import React from 'react';
import {
  ShieldTick,
  LineChartUp01,
  LineChartDown01,
  Minus,
  InfoCircle,
  File06,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { FactorComparisonItem } from '../../types/longitudinalHealth';

interface LabProgressionCardProps {
  pathway: HealthPathway;
  labComparisons: FactorComparisonItem[];
  hasSingleAssessment?: boolean;
}

export const LabProgressionCard: React.FC<LabProgressionCardProps> = ({
  pathway,
  labComparisons,
  hasSingleAssessment = false,
}) => {
  const isMale = pathway === 'male';

  const themeColor = isMale ? 'var(--color-medical-primary-hover, #0288D1)' : 'var(--female-primary, #F43F7D)';
  const themeBgLight = isMale ? 'var(--color-medical-primary-soft, #F0F9FF)' : 'var(--female-primary-light, #FDE6EF)';
  const themeBorder = isMale ? 'var(--color-medical-primary-border, #BAE6FD)' : 'var(--female-border, rgba(244,63,125,0.2))';

  // Direction badge for labs: strictly neutral interpretation (Constraint 10)
  const getNeutralDeltaBadge = (direction: string) => {
    switch (direction) {
      case 'increased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartUp01 className="w-3 h-3" aria-hidden="true" /> Increased
          </span>
        );
      case 'decreased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            <LineChartDown01 className="w-3 h-3" aria-hidden="true" /> Decreased
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            <Minus className="w-3 h-3" aria-hidden="true" /> Unchanged
          </span>
        );
      case 'baseline_recorded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F8F9FC] text-[#475569] border border-[#EAECF0]">
            <InfoCircle className="w-3 h-3" aria-hidden="true" /> First Recorded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
            {direction.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              {isMale ? 'Endocrine & Hormone Biomarkers' : 'Biochemical & Hormone Biomarkers'}
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
              <ShieldTick className="w-3 h-3 text-[#16A36A]" aria-hidden="true" /> Verified Records Only
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5 font-sans">
            {isMale
              ? 'Longitudinal testosterone and pituitary lab values verified through clinical laboratory reports.'
              : 'Endocrine panel values and metabolic markers verified through clinical laboratory reports.'}
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
          Tier 2 Labs
        </span>
      </div>

      {/* ── Table or Empty State ── */}
      {labComparisons.length === 0 ? (
        <div className="py-8 px-4 rounded-xl bg-[#F8F9FC] border border-[#EAECF0] text-center space-y-2">
          <File06 className="w-6 h-6 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-sm font-semibold text-[#111318]">No Verified Lab Results Yet</p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            {isMale
              ? 'Upload a confirmed testosterone blood report to unlock Tier 2 confirmatory lab tracking.'
              : 'Upload a confirmed hormonal blood test to unlock Tier 2 biochemical tracking.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#EAECF0] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#EAECF0] text-[#667085] font-mono uppercase text-[10px]">
                <th className="py-2.5 px-4">Biomarker</th>
                <th className="py-2.5 px-4">Previous Value</th>
                <th className="py-2.5 px-4">Current Value</th>
                <th className="py-2.5 px-4">Direction & Movement</th>
                <th className="py-2.5 px-4">Source Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {labComparisons.map((lab) => (
                <tr key={lab.factor_key} className="hover:bg-[#FAFAFC]">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#111318] block">{lab.label}</span>
                    {lab.unit && (
                      <span className="text-[10px] font-mono text-[#667085]">Unit: {lab.unit}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#667085]">
                    {hasSingleAssessment ? '—' : lab.previous_display}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#111318]">
                    {lab.current_display}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {getNeutralDeltaBadge(lab.direction)}
                      {lab.delta !== null && !hasSingleAssessment && lab.direction !== 'unchanged' && (
                        <span className="text-[11px] font-mono font-medium text-[#475569] block">
                          {lab.delta > 0 ? `+${lab.delta}` : `${lab.delta}`} {lab.unit}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">
                      <ShieldTick className="w-3 h-3 text-[#16A36A]" aria-hidden="true" />
                      Clinically Verified
                    </span>
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

export default LabProgressionCard;
