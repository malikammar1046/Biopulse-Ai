import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  RefreshCw01,
  ShieldTick,
  InfoCircle,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import type {
  LongitudinalHealthResponse,
  MonitoringPeriodFilter,
} from '../../types/longitudinalHealth';
import { supabase } from '../../lib/supabase';
import {
  getLongitudinalHealth,
  getCachedLongitudinalHealth,
} from '../../services/intelligenceService';
import { deriveBaselineFromContext } from '../../utils/longitudinalCalculations';

import { LongitudinalHeader } from './LongitudinalHeader';
import { CurrentHealthSnapshotCard } from './CurrentHealthSnapshotCard';
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

export type LongitudinalStateModel =
  | 'LOADING'
  | 'SUCCESS_WITH_HISTORY'
  | 'SUCCESS_BASELINE_ONLY'
  | 'SUCCESS_NO_HISTORY'
  | 'PARTIAL_DATA'
  | 'NETWORK_ERROR'
  | 'SESSION_ERROR'
  | 'SERVER_ERROR';

export const HealthProgressSection: React.FC<HealthProgressSectionProps> = ({
  pathway: pathwayProp,
}) => {
  const {
    userProfile,
    cycleRecords = [],
    symptomRecords = [],
    reports = [],
  } = useUserHealth();

  const activePathway = pathwayProp || resolvePathway(userProfile?.gender, userProfile?.pathway);
  const moduleName = activePathway === 'male' ? 'male_hypogonadism' : 'female_pcos';

  const [selectedPeriod, setSelectedPeriod] = useState<MonitoringPeriodFilter>('90d');

  // 1. Initial State: Synchronous Immediate Hydration from Cache or Context (<50ms)
  const initialBaseline = useMemo(() => {
    const cached = getCachedLongitudinalHealth(selectedPeriod, moduleName, userProfile?.id);
    if (cached) return cached;
    return deriveBaselineFromContext({
      userProfile,
      cycleRecords,
      symptomRecords,
      reports,
      pathway: activePathway,
      period: selectedPeriod,
    });
  }, [selectedPeriod, moduleName, userProfile, cycleRecords, symptomRecords, reports, activePathway]);

  const [data, setData] = useState<LongitudinalHealthResponse | null>(initialBaseline);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState<boolean>(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Listen for global refresh events (e.g. assessment submission, report upload)
  useEffect(() => {
    const handleRefresh = () => {
      setRetryTrigger((prev) => prev + 1);
    };
    window.addEventListener('biopulse:longitudinal-refresh', handleRefresh);
    return () => {
      window.removeEventListener('biopulse:longitudinal-refresh', handleRefresh);
    };
  }, []);

  // 2. Resilient Background Fetching (Stale-While-Revalidate)
  const loadLongitudinal = useCallback(async (signal?: AbortSignal) => {
    setIsBackgroundFetching(true);
    setRefreshNotice(null);
    setSessionError(false);

    try {
      const res = await getLongitudinalHealth(selectedPeriod, moduleName, signal);
      if (signal?.aborted) return;

      if (res) {
        setData(res);
        setRefreshNotice(null);
      } else {
        // Evaluate failure reason gracefully without crashing the view
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          setSessionError(true);
          setRefreshNotice('Your session needs to be renewed.');
        } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setRefreshNotice('Working offline. Showing saved health records.');
        } else {
          setRefreshNotice('Could not refresh latest records from server. Showing local health snapshot.');
        }

        // If data is still null, fallback to context baseline
        setData((prev) => {
          if (prev) return prev;
          return deriveBaselineFromContext({
            userProfile,
            cycleRecords,
            symptomRecords,
            reports,
            pathway: activePathway,
            period: selectedPeriod,
          });
        });
      }
    } catch (err: any) {
      if (signal?.aborted) return;
      console.warn('[HealthProgressSection] Background refresh notice:', err);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setRefreshNotice('Working offline. Showing saved health records.');
      } else {
        setRefreshNotice('Could not refresh latest records right now. Showing local baseline.');
      }
      setData((prev) => {
        if (prev) return prev;
        return deriveBaselineFromContext({
          userProfile,
          cycleRecords,
          symptomRecords,
          reports,
          pathway: activePathway,
          period: selectedPeriod,
        });
      });
    } finally {
      if (!signal?.aborted) {
        setIsBackgroundFetching(false);
      }
    }
  }, [selectedPeriod, moduleName, userProfile, cycleRecords, symptomRecords, reports, activePathway]);

  useEffect(() => {
    const controller = new AbortController();
    loadLongitudinal(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadLongitudinal, retryTrigger]);

  // Derive explicit State Model
  const totalAssessments = data?.total_assessments_recorded ?? 0;
  const hasNoAssessments = data?.has_no_assessments ?? (totalAssessments === 0);
  const hasSingleAssessment = data?.has_single_assessment_baseline ?? (totalAssessments === 1);

  // Filter symptom and lab factor comparisons for dedicated cards
  const symptomComparisons = useMemo(() => {
    return (data?.current_vs_previous || []).filter((f) => f.category === 'symptom');
  }, [data?.current_vs_previous]);

  const labComparisons = useMemo(() => {
    return (data?.current_vs_previous || []).filter((f) => f.category === 'laboratory');
  }, [data?.current_vs_previous]);

  // Session Expired State (Only if no data available at all)
  if (sessionError && !data) {
    return (
      <div className="bg-white border border-[#EAECF0] rounded-[24px] p-8 text-center shadow-xs select-none max-w-lg mx-auto space-y-4 my-8">
        <div className="w-12 h-12 rounded-full mx-auto bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[#D92D20]" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-display text-[#111318]">Session Renewal Required</h2>
          <p className="text-xs text-[#667085] leading-relaxed">
            Your authentication session has expired. Please sign in again to access your historical health timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#111318] text-white hover:bg-[#282F3E] transition-all cursor-pointer"
        >
          <RefreshCw01 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sign In Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none max-w-7xl mx-auto">
      {/* ── 1. Longitudinal Header ── */}
      <LongitudinalHeader
        pathway={activePathway}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        trackingPeriodDisplay={data?.tracking_period_display}
        totalAssessmentsRecorded={totalAssessments}
        isLoading={isBackgroundFetching && !data}
      />

      {/* ── 2. Subtle Non-Blocking Refresh Notice (Stale-While-Revalidate) ── */}
      {refreshNotice && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] text-xs text-[#475467] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <InfoCircle className="w-4 h-4 text-[#98A2B3] shrink-0" aria-hidden="true" />
            <span className="font-medium">{refreshNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRetryTrigger((prev) => prev + 1)}
            disabled={isBackgroundFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-[#EAECF0] text-[#111318] hover:bg-[#F2F4F7] transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw01 className={`w-3 h-3 ${isBackgroundFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ── 3. Current Health Snapshot (Section 22 & 23 Hero Card) ── */}
      <CurrentHealthSnapshotCard
        pathway={activePathway}
        currentSummary={data?.current_summary}
        userProfile={userProfile}
        cycleCount={cycleRecords.length}
        reportCount={reports.length}
        symptomCount={symptomRecords.length}
        trackingPeriodDisplay={data?.tracking_period_display}
      />

      {/* ── 4. Progress Summary KPI Cards (4 KPI Cards) ── */}
      <ProgressSummaryCards
        pathway={activePathway}
        currentSummary={data?.current_summary}
        comparability={data?.screening_comparability}
        totalAssessments={totalAssessments}
        trackingPeriodDisplay={data?.tracking_period_display}
        hasSingleAssessment={hasSingleAssessment}
        hasNoAssessments={hasNoAssessments}
      />

      {/* ── 5. Zero Assessments State: New Account Baseline (Section 4 & 25) ── */}
      {hasNoAssessments ? (
        <EmptyBaselineState
          pathway={activePathway}
          userProfile={userProfile}
          activeAssessment={data?.current_summary}
          symptomCount={symptomRecords.length}
          reportCount={reports.length}
          cycleCount={cycleRecords.length}
        />
      ) : (
        <>
          {/* ── 6. What Changed: Deterministic Progression ── */}
          <WhatChangedCard
            pathway={activePathway}
            changes={data?.important_changes || []}
            comparability={data?.screening_comparability}
            hasSingleAssessment={hasSingleAssessment}
            hasNoAssessments={hasNoAssessments}
          />

          {/* ── 7. Screening Risk Progression Curve (Single baseline card if 1, SVG chart if 2+) ── */}
          <RiskTrendChart
            pathway={activePathway}
            history={data?.screening_history || []}
            comparability={data?.screening_comparability}
            hasSingleAssessment={hasSingleAssessment}
            hasNoAssessments={hasNoAssessments}
          />

          {/* ── 8. Biometric & Lab Trajectories (Single baseline card if 1, SVG chart if 2+) ── */}
          <MetricTrendCard
            pathway={activePathway}
            metricSeriesMap={data?.metric_series || {}}
          />

          {/* ── 9. Symptom / Vitality Progression ── */}
          <SymptomProgressionCard
            pathway={activePathway}
            maleVitalitySummary={data?.male_vitality_summary}
            symptomComparisons={symptomComparisons}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 10. Verified Laboratory Progression ── */}
          <LabProgressionCard
            pathway={activePathway}
            labComparisons={labComparisons}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 11. Assessment Depth Roadmap (Clinical Evidence Progression) ── */}
          <TierProgressionRoadmap
            pathway={activePathway}
            tiers={data?.tier_progression || []}
          />

          {/* ── 12. Side-by-Side Factor Comparison Matrix ── */}
          <CurrentVsPreviousTable
            pathway={activePathway}
            factors={data?.current_vs_previous || []}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 13. Deduplicated Activity Timeline (Chronological History) ── */}
          <ChronologicalTimeline
            pathway={activePathway}
            events={data?.timeline_events || []}
          />
        </>
      )}

      {/* ── 14. Medical Legal Disclaimer ── */}
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
