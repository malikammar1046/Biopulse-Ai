import React from 'react';
import { Calendar, LayersThree01 } from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { MonitoringPeriodFilter } from '../../types/longitudinalHealth';

interface LongitudinalHeaderProps {
  pathway: HealthPathway;
  selectedPeriod: MonitoringPeriodFilter;
  onSelectPeriod: (period: MonitoringPeriodFilter) => void;
  trackingPeriodDisplay?: string;
  totalAssessmentsRecorded?: number;
  isLoading?: boolean;
}

const PERIOD_OPTIONS: { id: MonitoringPeriodFilter; label: string }[] = [
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '3 Months' },
  { id: '180d', label: '6 Months' },
  { id: '1y', label: '1 Year' },
  { id: 'all', label: 'All Time' },
];

export const LongitudinalHeader: React.FC<LongitudinalHeaderProps> = ({
  pathway,
  selectedPeriod,
  onSelectPeriod,
  trackingPeriodDisplay,
  totalAssessmentsRecorded = 0,
  isLoading = false,
}) => {
  const isMale = pathway === 'male';

  const pathwayTitle = isMale
    ? 'Hypogonadism Hormonal Health'
    : 'PCOS Reproductive-Endocrine Health';

  const pathwaySubtitle = isMale
    ? 'Longitudinal trajectory derived from clinical assessments, vitality symptom progression, and verified endocrine markers.'
    : 'Longitudinal trajectory derived from clinical assessments, ovulatory symptom progression, and verified metabolic markers.';

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Title & Subtitle */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isMale
                  ? 'bg-[var(--color-medical-primary-soft,#F0F9FF)] text-[var(--color-medical-primary-hover,#0288D1)] border-[var(--color-medical-primary-border,#BAE6FD)]'
                  : 'bg-[var(--female-primary-light,#FDE6EF)] text-[#DC326C] border-[var(--female-border,rgba(244,63,125,0.2))]'
              }`}
            >
              {pathwayTitle}
            </span>

            {trackingPeriodDisplay && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#667085] bg-[#F8F9FC] border border-[#EAECF0] px-2.5 py-0.5 rounded-full">
                <Calendar className="w-3 h-3 text-[#98A2B3]" aria-hidden="true" />
                {trackingPeriodDisplay}
              </span>
            )}

            {totalAssessmentsRecorded > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#667085] bg-[#F8F9FC] border border-[#EAECF0] px-2.5 py-0.5 rounded-full">
                <LayersThree01 className="w-3 h-3 text-[#98A2B3]" aria-hidden="true" />
                {totalAssessmentsRecorded} {totalAssessmentsRecorded === 1 ? 'assessment' : 'assessments'}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#111318] tracking-tight">
            Longitudinal Health
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] max-w-2xl font-sans leading-relaxed">
            {pathwaySubtitle}
          </p>
        </div>

        {/* Right: Period Filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8F9FC] border border-[#EAECF0] self-start lg:self-center overflow-x-auto no-scrollbar max-w-full">
          {PERIOD_OPTIONS.map((opt) => {
            const isSelected = selectedPeriod === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectPeriod(opt.id)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
                  isSelected
                    ? isMale
                      ? 'bg-[var(--color-medical-primary-hover,#0288D1)] text-white shadow-xs'
                      : 'bg-[#F43F7D] text-white shadow-xs'
                    : 'text-[#667085] hover:text-[#111318] hover:bg-[#F2F4F7]'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-pressed={isSelected}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LongitudinalHeader;
