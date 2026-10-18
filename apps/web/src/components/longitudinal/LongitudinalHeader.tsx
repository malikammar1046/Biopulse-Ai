import React from 'react';
import { Calendar, LayersThree01, RefreshCw01, Activity, ShieldTick } from '@untitledui/icons';
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

const PERIOD_OPTIONS: { id: MonitoringPeriodFilter; label: string; shortLabel: string }[] = [
  { id: '30d', label: '30 Days', shortLabel: '30D' },
  { id: '90d', label: '3 Months', shortLabel: '90D' },
  { id: '180d', label: '6 Months', shortLabel: '6M' },
  { id: '1y', label: '1 Year', shortLabel: '1Y' },
  { id: 'all', label: 'All Time', shortLabel: 'ALL' },
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
    ? 'AndroSense • Hypogonadism Trajectory'
    : 'OvaSense • PCOS Reproductive & Endocrine';

  return (
    <header className="relative overflow-hidden rounded-[24px] border border-[#EAECF0] bg-white/95 backdrop-blur-md p-5 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] select-none">
      {/* Soft Ambient Background Radial Accent */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-40 transition-colors duration-500 ${
          isMale ? 'bg-sky-200/50' : 'bg-rose-200/50'
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Pathway Title & Metadata Badges */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wide uppercase px-3 py-1 rounded-full border transition-all ${
                isMale
                  ? 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'
                  : 'bg-[#FDE6EF] text-[#DC326C] border-[#FBCFE8]'
              }`}
            >
              <Activity className="w-3 h-3" aria-hidden="true" />
              {pathwayTitle}
            </span>

            {trackingPeriodDisplay && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#475467] bg-[#F8F9FC] border border-[#EAECF0] px-3 py-1 rounded-full">
                <Calendar className="w-3 h-3 text-[#98A2B3]" aria-hidden="true" />
                {trackingPeriodDisplay}
              </span>
            )}

            {totalAssessmentsRecorded > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#475467] bg-[#F8F9FC] border border-[#EAECF0] px-3 py-1 rounded-full">
                <LayersThree01 className="w-3 h-3 text-[#98A2B3]" aria-hidden="true" />
                {totalAssessmentsRecorded} {totalAssessmentsRecorded === 1 ? 'assessment benchmark' : 'assessments logged'}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#027A48] bg-[#ECFDF3] border border-[#D1FADF] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] animate-pulse" aria-hidden="true" />
              <ShieldTick className="w-3 h-3 text-[#16A36A]" aria-hidden="true" />
              Verified Stream
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#111318] tracking-tight">
              Longitudinal Health Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed max-w-2xl font-sans mt-0.5">
              {isMale
                ? 'Deterministic tracking of hypogonadism screening probability, serum androgen biomarkers, vitality progression, and metabolic shifts over time.'
                : 'Deterministic tracking of multi-tier PCOS probability, ovulatory stability, endocrine biomarkers, and metabolic trajectory over time.'}
            </p>
          </div>
        </div>

        {/* Right: Sleek Segmented Horizon Controller */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 self-start lg:self-center">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] shadow-inner overflow-x-auto no-scrollbar max-w-full">
            {PERIOD_OPTIONS.map((opt) => {
              const isSelected = selectedPeriod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectPeriod(opt.id)}
                  disabled={isLoading}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
                    isSelected
                      ? isMale
                        ? 'bg-[#0288D1] text-white shadow-[0_2px_8px_-2px_rgba(2,136,209,0.35)]'
                        : 'bg-[#F43F7D] text-white shadow-[0_2px_8px_-2px_rgba(244,63,125,0.35)]'
                      : 'text-[#667085] hover:text-[#111318] hover:bg-white/80'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-pressed={isSelected}
                >
                  <span className="hidden sm:inline">{opt.label}</span>
                  <span className="sm:hidden">{opt.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {isLoading && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#667085] bg-white border border-[#EAECF0] px-2.5 py-1.5 rounded-xl shadow-xs">
              <RefreshCw01 className="w-3 h-3 text-[#0288D1] animate-spin" aria-hidden="true" />
              <span>Syncing...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default LongitudinalHeader;
