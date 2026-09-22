import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  RefreshCw01,
  ShieldTick,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import type {
  LongitudinalHealthResponse,
  MonitoringPeriodFilter,
} from '../../types/longitudinalHealth';
import { getLongitudinalHealth } from '../../services/intelligenceService';

import { LongitudinalHeader } from './LongitudinalHeader';
import { ProgressSummaryCards } from './ProgressSummaryCards';
import { WhatChangedCard } from './WhatChangedCard';
import { RiskTrendChart } from './RiskTrendChart';
import { MetricTrendCard } from './MetricTrendCard';
import { SymptomProgressionCard } from './SymptomProgressionCard';
import { LabProgressionCard } from './LabProgressionCard';
import { TierProgressionRoadmap } from './TierProgressionRoadmap';
import { CurrentVsPreviousTable } from './CurrentVsPreviousTable';
import { ChronologicalTimeline } from './ChronologicalTimeline';
import { EmptyBaselineState } from './EmptyBaselineState';

interface HealthProgressSectionProps {
  pathway?: HealthPathway;
}

export const HealthProgressSection: React.FC<HealthProgressSectionProps> = ({
  pathway: pathwayProp,
}) => {
  const { userProfile } = useUserHealth();
  const activePathway = pathwayProp || resolvePathway(userProfile?.gender, userProfile?.pathway);

  const [selectedPeriod, setSelectedPeriod] = useState<MonitoringPeriodFilter>('90d');
  const [data, setData] = useState<LongitudinalHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const moduleName = activePathway === 'male' ? 'male_hypogonadism' : 'female_pcos';

  // Listen for global refresh events (e.g. settings/profile changes, symptom logging)
  useEffect(() => {
    const handleRefresh = () => {
      setRetryTrigger((prev) => prev + 1);
    };
    window.addEventListener('biopulse:longitudinal-refresh', handleRefresh);
    return () => {
      window.removeEventListener('biopulse:longitudinal-refresh', handleRefresh);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    const loadLongitudinal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await getLongitudinalHealth(selectedPeriod, moduleName, controller.signal);
        if (!isCurrent || controller.signal.aborted) return;

        if (res) {
          setData(res);
          setError(null);
        } else if (!controller.signal.aborted) {
          setError('Unable to load longitudinal health records. Please try again.');
        }
      } catch (err: any) {
        if (!isCurrent || controller.signal.aborted) return;
        console.error('[HealthProgressSection] Fetch error:', err);
        setError('A network or server error occurred while retrieving historical data.');
      } finally {
        if (isCurrent && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadLongitudinal();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [selectedPeriod, moduleName, retryTrigger, userProfile?.weight, userProfile?.height]);

  // ---------------------------------------------------------------------------
  // 1. Loading Skeleton
  // ---------------------------------------------------------------------------
  if (isLoading && !data) {
    return (
      <div className="space-y-6 text-left select-none max-w-7xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white border border-[#EAECF0] rounded-[24px] p-6 h-36 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-40 h-5 bg-[#F2F4F7] rounded-full" />
            <div className="w-64 h-8 bg-[#F2F4F7] rounded-lg" />
          </div>
          <div className="w-80 h-4 bg-[#F2F4F7] rounded" />
        </div>

        {/* 4 Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#EAECF0] rounded-[18px] p-5 h-32 flex flex-col justify-between">
              <div className="w-24 h-4 bg-[#F2F4F7] rounded" />
              <div className="w-32 h-8 bg-[#F2F4F7] rounded" />
              <div className="w-20 h-4 bg-[#F2F4F7] rounded" />
            </div>
          ))}
        </div>

        {/* What Changed & Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#EAECF0] rounded-[24px] p-6 h-80" />
          <div className="bg-white border border-[#EAECF0] rounded-[24px] p-6 h-80" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Error State
  // ---------------------------------------------------------------------------
  if (error && !data) {
    return (
      <div className="bg-white border border-[#EAECF0] rounded-[24px] p-8 text-center shadow-xs select-none max-w-lg mx-auto space-y-4 my-8">
        <div className="w-12 h-12 rounded-full mx-auto bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[#D92D20]" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-display text-[#111318]">Failed to Load Progress</h2>
          <p className="text-xs text-[#667085] leading-relaxed">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => setRetryTrigger((prev) => prev + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111318] text-white hover:bg-[#282F3E] transition-all cursor-pointer"
        >
          <RefreshCw01 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Retry Synchronization</span>
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Main Longitudinal Dashboard Content
  // ---------------------------------------------------------------------------
  const hasNoAssessments = data?.has_no_assessments || (data?.total_assessments_recorded === 0);
  const hasSingleAssessment = data?.has_single_assessment_baseline || (data?.total_assessments_recorded === 1);

  // Filter symptom and lab factor comparisons for dedicated cards
  const symptomComparisons = (data?.current_vs_previous || []).filter(
    (f) => f.category === 'symptom'
  );

  const labComparisons = (data?.current_vs_previous || []).filter(
    (f) => f.category === 'laboratory'
  );

  return (
    <div className="space-y-6 text-left select-none max-w-7xl mx-auto">
      {/* ── 1. Longitudinal Header (Constraint 4: Clean, no unrequested sync banner) ── */}
      <LongitudinalHeader
        pathway={activePathway}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        trackingPeriodDisplay={data?.tracking_period_display}
        totalAssessmentsRecorded={data?.total_assessments_recorded}
        isLoading={isLoading}
      />

      {/* ── 2. Progress Summary Cards (4 KPI Cards) ── */}
      <ProgressSummaryCards
        pathway={activePathway}
        currentSummary={data?.current_summary}
        comparability={data?.screening_comparability}
        totalAssessments={data?.total_assessments_recorded}
        trackingPeriodDisplay={data?.tracking_period_display}
        hasSingleAssessment={hasSingleAssessment}
        hasNoAssessments={hasNoAssessments}
      />

      {/* ── 3. Zero Assessments: Empty Baseline State ── */}
      {hasNoAssessments ? (
        <EmptyBaselineState pathway={activePathway} />
      ) : (
        <>
          {/* ── 4. What Changed (Priority Deterministic Progression) ── */}
          <WhatChangedCard
            pathway={activePathway}
            changes={data?.important_changes || []}
            comparability={data?.screening_comparability}
            hasSingleAssessment={hasSingleAssessment}
            hasNoAssessments={hasNoAssessments}
          />

          {/* ── 5. Screening Risk Progression Curve (Constraint 12 & 13) ── */}
          <RiskTrendChart
            pathway={activePathway}
            history={data?.screening_history || []}
            comparability={data?.screening_comparability}
            hasSingleAssessment={hasSingleAssessment}
            hasNoAssessments={hasNoAssessments}
          />

          {/* ── 6. Biometric & Lab Trajectories (Continuous Metrics) ── */}
          <MetricTrendCard
            pathway={activePathway}
            metricSeriesMap={data?.metric_series || {}}
          />

          {/* ── 7. Symptom / Vitality Progression ── */}
          <SymptomProgressionCard
            pathway={activePathway}
            maleVitalitySummary={data?.male_vitality_summary}
            symptomComparisons={symptomComparisons}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 8. Verified Laboratory Progression ── */}
          <LabProgressionCard
            pathway={activePathway}
            labComparisons={labComparisons}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 9. Assessment Depth Roadmap (Clinical Evidence Progression) ── */}
          <TierProgressionRoadmap
            pathway={activePathway}
            tiers={data?.tier_progression || []}
          />

          {/* ── 10. Side-by-Side Factor Comparison Matrix ── */}
          <CurrentVsPreviousTable
            pathway={activePathway}
            factors={data?.current_vs_previous || []}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 11. Deduplicated Activity Timeline (Constraint 9) ── */}
          <ChronologicalTimeline
            pathway={activePathway}
            events={data?.timeline_events || []}
          />
        </>
      )}

      {/* ── 12. Medical Legal Disclaimer ── */}
      <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#EAECF0] text-xs text-[#667085] flex items-start gap-2.5">
        <ShieldTick className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          {data?.disclaimer ||
            'BioPulse AI provides longitudinal clinical decision support and health trend visualization. Longitudinal indicators and screening deltas reflect mathematical comparisons between recorded clinical assessments and do not constitute a definitive medical diagnosis. Always consult with a qualified healthcare practitioner.'}
        </p>
      </div>
    </div>
  );
};

export default HealthProgressSection;
