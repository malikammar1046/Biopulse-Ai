import React from 'react';
import {
  Activity,
  Calendar,
  File06,
  LayersThree01,
  Scale01,
  ShieldTick,
  Heart,
  Droplets01,
} from '@untitledui/icons';
import type { HealthPathway, UserProfile } from '../../types/onboarding';
import type { CurrentHealthSummary } from '../../types/longitudinalHealth';

interface CurrentHealthSnapshotCardProps {
  pathway: HealthPathway;
  currentSummary?: CurrentHealthSummary | null;
  userProfile?: UserProfile | null;
  cycleCount?: number;
  reportCount?: number;
  symptomCount?: number;
  trackingPeriodDisplay?: string;
}

export const CurrentHealthSnapshotCard: React.FC<CurrentHealthSnapshotCardProps> = ({
  pathway,
  currentSummary,
  userProfile,
  cycleCount = 0,
  reportCount = 0,
  symptomCount = 0,
  trackingPeriodDisplay,
}) => {
  const isMale = pathway === 'male';

  // 1. Resolve Screening Risk / Likelihood
  const probPercent = currentSummary?.screening_probability_percent;
  const riskLabel = currentSummary?.risk_label;
  const lastAssessedDisplay = currentSummary?.last_assessed_display || 'Not yet assessed';
  const hasAssessment = probPercent !== null && probPercent !== undefined;

  // 2. Resolve BMI & Weight
  const weightKg = userProfile?.weightKg ?? currentSummary?.key_metrics?.weight_kg ?? null;
  const heightCm = userProfile?.heightCm ?? null;
  const bmi =
    currentSummary?.key_metrics?.bmi ??
    (weightKg && heightCm ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10 : null);

  // 3. Resolve Pathway Specific Metric
  const femaleCycleLength = userProfile?.womensHealth?.cycleLength;
  const maleTestosterone = userProfile?.mensHealth?.testosteroneValue;
  const maleTestosteroneUnit = userProfile?.mensHealth?.testosteroneUnit || 'ng/dL';

  return (
    <section
      aria-label="Current Health Snapshot"
      className="bg-white border border-[#EAECF0] rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'
            }`}
          >
            <Activity className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Current Health Snapshot
            </h2>
            <p className="text-xs text-[#667085]">
              Active reference metrics and latest recorded clinical indicators.
            </p>
          </div>
        </div>

        {trackingPeriodDisplay && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#F8F9FC] border border-[#EAECF0] text-[#475467] self-start sm:self-center">
            <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" aria-hidden="true" />
            <span>{trackingPeriodDisplay}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Tile 1: Primary Screening Status */}
        <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EAECF0] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              {isMale ? 'Hypogonadism Screening' : 'PCOS Screening'}
            </span>
            <LayersThree01
              className={`w-4 h-4 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`}
              aria-hidden="true"
            />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#111318]">
              {hasAssessment ? `${probPercent}%` : 'Not Assessed'}
            </div>
            <p className="text-xs text-[#475467] font-medium mt-0.5">
              {hasAssessment ? riskLabel || 'Baseline Established' : 'Awaiting initial screening'}
            </p>
          </div>
          <p className="text-[11px] text-[#98A2B3] font-mono border-t border-[#F2F4F7] pt-1.5">
            {lastAssessedDisplay}
          </p>
        </div>

        {/* Tile 2: Body & Metabolic (BMI) */}
        <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EAECF0] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              Body Mass Index
            </span>
            <Scale01 className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#111318]">
              {bmi !== null ? `${bmi} kg/m²` : 'Not recorded'}
            </div>
            <p className="text-xs text-[#475467] font-medium mt-0.5">
              {weightKg ? `Weight: ${weightKg} kg` : 'Profile measurement'}
            </p>
          </div>
          <p className="text-[11px] text-[#98A2B3] font-mono border-t border-[#F2F4F7] pt-1.5">
            {userProfile?.heightCm ? `Height: ${userProfile.heightCm} cm` : 'Baseline vitals'}
          </p>
        </div>

        {/* Tile 3: Pathway-Specific Physiological Indicator */}
        <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EAECF0] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              {isMale ? 'Total Testosterone' : 'Menstrual Cycle'}
            </span>
            {isMale ? (
              <Heart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
            ) : (
              <Droplets01 className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#111318]">
              {isMale
                ? maleTestosterone
                  ? `${maleTestosterone} ${maleTestosteroneUnit}`
                  : 'Pending Lab'
                : cycleCount > 0
                ? `${cycleCount} Recorded`
                : femaleCycleLength
                ? `${femaleCycleLength} Days`
                : 'Not Logged'}
            </div>
            <p className="text-xs text-[#475467] font-medium mt-0.5">
              {isMale
                ? maleTestosterone
                  ? 'Baseline clinical draw'
                  : 'Hormonal profile'
                : userProfile?.womensHealth?.periodRegularity?.replace('_', ' ') || 'Reproductive cycle'}
            </p>
          </div>
          <p className="text-[11px] text-[#98A2B3] font-mono border-t border-[#F2F4F7] pt-1.5">
            {isMale ? 'Endocrine marker' : 'Physiological tracker'}
          </p>
        </div>

        {/* Tile 4: Clinical Evidence & Reports */}
        <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EAECF0] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              Medical Reports & Labs
            </span>
            <File06 className="w-4 h-4 text-[#073B72]" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#111318]">
              {reportCount > 0 ? `${reportCount} Document${reportCount > 1 ? 's' : ''}` : 'No Reports Yet'}
            </div>
            <p className="text-xs text-[#475467] font-medium mt-0.5">
              {symptomCount > 0 ? `${symptomCount} symptoms logged` : 'Clinical records archive'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#16A36A] font-mono border-t border-[#F2F4F7] pt-1.5">
            <ShieldTick className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Encrypted patient vault</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentHealthSnapshotCard;
