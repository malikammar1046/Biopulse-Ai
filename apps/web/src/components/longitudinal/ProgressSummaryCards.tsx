import React from 'react';
import {
  Activity,
  LineChartDown01,
  LineChartUp01,
  Minus,
  LayersThree01,
  Calendar,
  InfoCircle,
  HelpCircle,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type {
  CurrentHealthSummary,
  ScreeningComparabilityInfo,
} from '../../types/longitudinalHealth';

interface ProgressSummaryCardsProps {
  pathway: HealthPathway;
  currentSummary?: CurrentHealthSummary | null;
  comparability?: ScreeningComparabilityInfo | null;
  totalAssessments?: number;
  trackingPeriodDisplay?: string;
  hasSingleAssessment?: boolean;
  hasNoAssessments?: boolean;
}

export const ProgressSummaryCards: React.FC<ProgressSummaryCardsProps> = ({
  pathway,
  currentSummary,
  comparability,
  totalAssessments = 0,
  trackingPeriodDisplay = 'Last 90 Days',
  hasSingleAssessment = false,
  hasNoAssessments = false,
}) => {
  const isMale = pathway === 'male';

  // 1. Risk Status Pill
  const riskCategory = (currentSummary?.risk_category || 'lower').toLowerCase();
  const isHigher = riskCategory.includes('high') || riskCategory.includes('elevated');
  const isIntermediate = !isHigher && (riskCategory.includes('intermediate') || riskCategory.includes('moderate'));

  const statusBadge = hasNoAssessments ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full border px-2 py-0.5 bg-[#F2F4F7] text-[#344054] border-[#EAECF0]">
      Not Started
    </span>
  ) : isHigher ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full border px-2 py-0.5 bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]">
      {currentSummary?.risk_label || 'Higher Risk'}
    </span>
  ) : isIntermediate ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full border px-2 py-0.5 bg-[#FEF7EC] text-[#B54708] border-[#FEDF89]">
      {currentSummary?.risk_label || 'Intermediate Risk'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full border px-2 py-0.5 bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]">
      {currentSummary?.risk_label || 'Lower Risk'}
    </span>
  );

  // 2. Risk Probability Display
  const probPercent = currentSummary?.screening_probability_percent;
  const probDisplay =
    probPercent !== null && probPercent !== undefined
      ? `${probPercent}%`
      : '—';

  // 3. Risk Delta / Comparability Representation
  const renderRiskDeltaContent = () => {
    if (hasNoAssessments) {
      return {
        main: 'No Data',
        sub: 'Complete an initial screening',
        icon: <HelpCircle className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />,
        badgeClass: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]',
      };
    }

    if (hasSingleAssessment || comparability?.state === 'baseline') {
      return {
        main: 'Baseline Active',
        sub: 'Initial reference established',
        icon: <InfoCircle className="w-4 h-4 text-[var(--color-medical-primary-hover,#0288D1)]" aria-hidden="true" />,
        badgeClass: isMale
          ? 'bg-[var(--color-medical-primary-soft,#F0F9FF)] text-[var(--color-medical-primary-hover,#0288D1)] border-[var(--color-medical-primary-border,#BAE6FD)]'
          : 'bg-[var(--female-primary-light,#FDE6EF)] text-[#DC326C] border-[var(--female-border,rgba(244,63,125,0.2))]',
      };
    }

    if (comparability?.state === 'cross_tier') {
      return {
        main: 'Tier Upgraded',
        sub: 'Cross-tier: new labs/data added',
        icon: <InfoCircle className="w-4 h-4 text-purple-600" aria-hidden="true" />,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }

    if (comparability?.state === 'model_version_changed' || comparability?.state === 'model_changed') {
      return {
        main: 'Model Updated',
        sub: 'Separate algorithm baseline',
        icon: <InfoCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }

    if (comparability?.state === 'insufficient_metadata') {
      return {
        main: 'Indeterminate',
        sub: 'Insufficient version metadata',
        icon: <HelpCircle className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />,
        badgeClass: 'bg-[#F2F4F7] text-[#667085] border-[#EAECF0]',
      };
    }

    // directly_comparable
    const deltaPp = comparability?.delta_percentage_points;
    if (deltaPp === null || deltaPp === undefined) {
      return {
        main: 'Unchanged',
        sub: 'No measurable risk shift',
        icon: <Minus className="w-4 h-4 text-[#667085]" aria-hidden="true" />,
        badgeClass: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]',
      };
    }

    if (deltaPp < 0) {
      const absPp = Math.abs(deltaPp);
      return {
        main: `↓ ${absPp} pp`,
        sub: `${absPp} percentage points decrease`,
        icon: <LineChartDown01 className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />,
        badgeClass: 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]',
      };
    } else if (deltaPp > 0) {
      return {
        main: `↑ ${deltaPp} pp`,
        sub: `${deltaPp} percentage points increase`,
        icon: <LineChartUp01 className="w-4 h-4 text-[#D92D20]" aria-hidden="true" />,
        badgeClass: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
      };
    }

    return {
      main: '0 pp Shift',
      sub: 'Exact identical risk score',
      icon: <Minus className="w-4 h-4 text-[#667085]" aria-hidden="true" />,
      badgeClass: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]',
    };
  };

  const riskDeltaInfo = renderRiskDeltaContent();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left select-none">
      {/* ── Card 1: Current Screening Status ── */}
      <div className="bg-white border border-[#EAECF0] rounded-[18px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider font-mono">
            Current Status
          </span>
          <Activity className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display text-[#111318]">
              {probDisplay}
            </span>
            <span className="text-xs text-[#667085]">
              {currentSummary?.tier_label || 'Screening Risk'}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-[#F2F4F7] flex items-center justify-between">
          {statusBadge}
          <span className="text-[11px] font-mono text-[#98A2B3]">
            {currentSummary?.last_assessed_display || 'Recent'}
          </span>
        </div>
      </div>

      {/* ── Card 2: Comparable Risk Delta ── */}
      <div className="bg-white border border-[#EAECF0] rounded-[18px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider font-mono">
            Screening Shift
          </span>
          {riskDeltaInfo.icon}
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-display text-[#111318]">
            {riskDeltaInfo.main}
          </span>
        </div>
        <div className="pt-2 border-t border-[#F2F4F7] flex items-center justify-between">
          <span className={`inline-flex items-center text-[11px] font-medium rounded-full border px-2 py-0.5 ${riskDeltaInfo.badgeClass}`}>
            {riskDeltaInfo.sub}
          </span>
        </div>
      </div>

      {/* ── Card 3: Total Recorded Assessments ── */}
      <div className="bg-white border border-[#EAECF0] rounded-[18px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider font-mono">
            Total Assessments
          </span>
          <LayersThree01 className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display text-[#111318]">
              {totalAssessments}
            </span>
            <span className="text-xs text-[#667085]">
              {totalAssessments === 1 ? 'record logged' : 'records logged'}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-[#F2F4F7] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#667085]">
            {hasSingleAssessment ? 'Baseline established' : 'Multiple points available'}
          </span>
        </div>
      </div>

      {/* ── Card 4: Monitoring Period ── */}
      <div className="bg-white border border-[#EAECF0] rounded-[18px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider font-mono">
            Tracking Scope
          </span>
          <Calendar className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />
        </div>
        <div className="my-2">
          <span className="text-xl sm:text-2xl font-bold font-display text-[#111318] truncate block">
            {trackingPeriodDisplay}
          </span>
        </div>
        <div className="pt-2 border-t border-[#F2F4F7] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#667085]">
            Authoritative clinical history
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressSummaryCards;
