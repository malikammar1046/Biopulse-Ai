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
  LineChartDown01,
  LineChartUp01,
  Minus,
} from '@untitledui/icons';
import type { HealthPathway, UserProfile } from '../../types/onboarding';
import type { CurrentHealthSummary, ScreeningComparabilityInfo } from '../../types/longitudinalHealth';

interface CurrentHealthSnapshotCardProps {
  pathway: HealthPathway;
  currentSummary?: CurrentHealthSummary | null;
  userProfile?: UserProfile | null;
  cycleCount?: number;
  reportCount?: number;
  symptomCount?: number;
  trackingPeriodDisplay?: string;
  comparability?: ScreeningComparabilityInfo | null;
  hasSingleAssessment?: boolean;
  hasNoAssessments?: boolean;
}

export const CurrentHealthSnapshotCard: React.FC<CurrentHealthSnapshotCardProps> = ({
  pathway,
  currentSummary,
  userProfile,
  cycleCount = 0,
  reportCount = 0,
  symptomCount = 0,
  trackingPeriodDisplay,
  comparability,
  hasSingleAssessment = false,
  hasNoAssessments = false,
}) => {
  const isMale = pathway === 'male';

  // 1. Resolve Screening Risk & Probability
  const probPercent = currentSummary?.screening_probability_percent;
  const riskLabel = currentSummary?.risk_label || 'Lower Risk';
  const lastAssessedDisplay = currentSummary?.last_assessed_display || 'Not yet assessed';
  const hasAssessment = probPercent !== null && probPercent !== undefined && !hasNoAssessments;

  const riskCategory = (currentSummary?.risk_category || 'lower').toLowerCase();
  const isHigher = riskCategory.includes('high') || riskCategory.includes('elevated');
  const isIntermediate = !isHigher && (riskCategory.includes('intermediate') || riskCategory.includes('moderate'));

  // 2. Resolve Risk Delta / Shift Representation
  const renderRiskShiftBadge = () => {
    if (hasNoAssessments) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#475467] border border-[#EAECF0]">
          Not Started
        </span>
      );
    }
    if (hasSingleAssessment || comparability?.state === 'baseline') {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
            isMale
              ? 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'
              : 'bg-[#FDE6EF] text-[#DC326C] border-[#FBCFE8]'
          }`}
        >
          <Activity className="w-3 h-3" aria-hidden="true" />
          Baseline Benchmark
        </span>
      );
    }
    const deltaPp = comparability?.delta_percentage_points;
    if (deltaPp !== null && deltaPp !== undefined) {
      if (deltaPp < 0) {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
            <LineChartDown01 className="w-3 h-3 text-[#16A36A]" aria-hidden="true" />
            ↓ {Math.abs(deltaPp)} pp Shift
          </span>
        );
      }
      if (deltaPp > 0) {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            <LineChartUp01 className="w-3 h-3 text-[#D92D20]" aria-hidden="true" />
            ↑ {deltaPp} pp Shift
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]">
          <Minus className="w-3 h-3" aria-hidden="true" />
          Stable (0 pp)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F8F9FC] text-[#475467] border border-[#EAECF0]">
        Baseline Active
      </span>
    );
  };

  // 3. Resolve Anthropometrics (BMI & Weight)
  const weightKg = userProfile?.weightKg ?? currentSummary?.key_metrics?.weight_kg ?? null;
  const heightCm = userProfile?.heightCm ?? null;
  const bmi =
    currentSummary?.key_metrics?.bmi ??
    (weightKg && heightCm ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10 : null);

  const getBmiCategory = (val: number | null) => {
    if (!val) return 'Vitals profile';
    if (val < 18.5) return 'Underweight';
    if (val < 25.0) return 'Healthy Reference Range';
    if (val < 30.0) return 'Overweight';
    return 'Obesity Range';
  };

  // 4. Resolve Pathway Specific Physiological Marker
  const femaleCycleLength = userProfile?.womensHealth?.cycleLength;
  const periodRegularity = userProfile?.womensHealth?.periodRegularity?.replace(/_/g, ' ') || 'Reproductive cycle';
  const maleTestosterone = userProfile?.mensHealth?.testosteroneValue;
  const maleTestosteroneUnit = userProfile?.mensHealth?.testosteroneUnit || 'ng/dL';

  return (
    <section
      aria-label="Current Health Snapshot"
      className="relative overflow-hidden bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-5 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
              isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'
            }`}
          >
            <Activity className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
                Current Health Snapshot
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[#027A48] bg-[#ECFDF3] border border-[#D1FADF] px-2 py-0.5 rounded-full">
                Active Benchmark
              </span>
            </div>
            <p className="text-xs text-[#667085] font-sans">
              Primary longitudinal health indicators, endocrine markers, and verified clinical evidence.
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

      {/* 4 Essential KPI Cards in Balanced Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ── CARD 1: Primary Screening Status & Trajectory ── */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] flex flex-col justify-between space-y-3.5 transition-all hover:shadow-xs hover:border-[#D0D5DD]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-bold">
              {isMale ? 'Hypogonadism Screening' : 'PCOS Clinical Screening'}
            </span>
            <LayersThree01
              className={`w-4 h-4 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`}
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-[#111318] tracking-tight">
                {hasAssessment ? `${probPercent}%` : 'Not Assessed'}
              </span>
              {hasAssessment && (
                <span className="text-xs font-mono text-[#667085]">probability</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`text-[11px] font-medium font-sans px-2.5 py-0.5 rounded-full border ${
                  !hasAssessment
                    ? 'bg-[#F2F4F7] text-[#475467] border-[#EAECF0]'
                    : isHigher
                    ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
                    : isIntermediate
                    ? 'bg-[#FEF7EC] text-[#B54708] border-[#FEDF89]'
                    : 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]'
                }`}
              >
                {hasAssessment ? riskLabel : 'Awaiting Baseline'}
              </span>
              {renderRiskShiftBadge()}
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAECF0]/80 flex items-center justify-between text-[11px] font-mono text-[#667085]">
            <span>{currentSummary?.tier_label || 'Tier 1 Baseline'}</span>
            <span className="text-[#98A2B3] truncate max-w-[110px]" title={lastAssessedDisplay}>
              {lastAssessedDisplay}
            </span>
          </div>
        </div>

        {/* ── CARD 2: Pathway Physiological Anchor ── */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] flex flex-col justify-between space-y-3.5 transition-all hover:shadow-xs hover:border-[#D0D5DD]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-bold">
              {isMale ? 'Serum Total Testosterone' : 'Menstrual Cycle & Ovulation'}
            </span>
            {isMale ? (
              <Heart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
            ) : (
              <Droplets01 className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-[#111318] tracking-tight">
                {isMale
                  ? maleTestosterone
                    ? `${maleTestosterone}`
                    : 'Pending Lab'
                  : cycleCount > 0
                  ? `${cycleCount} Logged`
                  : femaleCycleLength
                  ? `${femaleCycleLength} Days`
                  : 'Active Cycle'}
              </span>
              {isMale && maleTestosterone && (
                <span className="text-xs font-mono text-[#667085]">{maleTestosteroneUnit}</span>
              )}
              {!isMale && cycleCount > 0 && (
                <span className="text-xs font-mono text-[#667085]">cycles tracked</span>
              )}
            </div>

            <p className="text-xs text-[#475467] font-medium mt-1.5 capitalize">
              {isMale
                ? maleTestosterone
                  ? 'Clinical draw benchmark'
                  : 'Awaiting lab blood draw'
                : femaleCycleLength
                ? `${femaleCycleLength}-day rhythm • ${periodRegularity}`
                : periodRegularity}
            </p>
          </div>

          <div className="pt-2 border-t border-[#EAECF0]/80 flex items-center justify-between text-[11px] font-mono text-[#667085]">
            <span>{isMale ? 'Reference: 300 - 1000 ng/dL' : 'Physiological stability'}</span>
            <span className="text-[#16A36A] font-medium">Optimal Track</span>
          </div>
        </div>

        {/* ── CARD 3: Metabolic & Body Composition ── */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] flex flex-col justify-between space-y-3.5 transition-all hover:shadow-xs hover:border-[#D0D5DD]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-bold">
              Body Mass Index & Weight
            </span>
            <Scale01 className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-[#111318] tracking-tight">
                {bmi !== null ? `${bmi}` : '—'}
              </span>
              {bmi !== null && (
                <span className="text-xs font-mono text-[#667085]">kg/m²</span>
              )}
            </div>

            <p className="text-xs text-[#475467] font-medium mt-1.5">
              {weightKg ? `${weightKg} kg weight` : 'Profile measurement'}
              {userProfile?.heightCm ? ` • ${userProfile.heightCm} cm` : ''}
            </p>
          </div>

          <div className="pt-2 border-t border-[#EAECF0]/80 flex items-center justify-between text-[11px] font-mono text-[#667085]">
            <span>{getBmiCategory(bmi)}</span>
            <span className="text-[#0E9EAA] font-medium">WHO Standard</span>
          </div>
        </div>

        {/* ── CARD 4: Verified Evidence & Clinical Reports ── */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] flex flex-col justify-between space-y-3.5 transition-all hover:shadow-xs hover:border-[#D0D5DD]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-bold">
              Verified Medical Reports
            </span>
            <File06 className="w-4 h-4 text-[#073B72]" aria-hidden="true" />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-[#111318] tracking-tight">
                {reportCount}
              </span>
              <span className="text-xs font-mono text-[#667085]">
                {reportCount === 1 ? 'lab report' : 'lab reports'}
              </span>
            </div>

            <p className="text-xs text-[#475467] font-medium mt-1.5">
              {symptomCount > 0 ? `${symptomCount} clinical symptom entries` : 'Encrypted patient records'}
            </p>
          </div>

          <div className="pt-2 border-t border-[#EAECF0]/80 flex items-center justify-between text-[11px] font-mono text-[#16A36A]">
            <span className="inline-flex items-center gap-1">
              <ShieldTick className="w-3.5 h-3.5" aria-hidden="true" />
              Patient Vault
            </span>
            <span className="text-[#475467]">Tier 2 Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentHealthSnapshotCard;
