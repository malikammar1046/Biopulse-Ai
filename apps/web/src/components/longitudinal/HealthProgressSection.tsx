import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  getCachedLongitudinalHealth,
} from '../../services/intelligenceService';
import { deriveBaselineFromContext } from '../../utils/longitudinalCalculations';

import { LongitudinalHeader } from './LongitudinalHeader';
import { CurrentHealthSnapshotCard } from './CurrentHealthSnapshotCard';
import { RiskTrendChart } from './RiskTrendChart';
import { MetricTrendCard } from './MetricTrendCard';
import { CurrentVsPreviousTable } from './CurrentVsPreviousTable';
import { SymptomProgressionCard } from './SymptomProgressionCard';
import { TierProgressionRoadmap } from './TierProgressionRoadmap';
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
    longitudinalData,
    fetchLongitudinalHealth,
    longitudinalLoading,
  } = useUserHealth();

  const activePathway = pathwayProp || resolvePathway(userProfile?.gender, userProfile?.pathway);
  const moduleName = activePathway === 'male' ? 'male_hypogonadism' : 'female_pcos';

  const [selectedPeriod, setSelectedPeriod] = useState<MonitoringPeriodFilter>('90d');

  // Ref cache for latest context variables without causing re-fetch loops
  const contextDataRef = useRef({ userProfile, cycleRecords, symptomRecords, reports, activePathway });
  contextDataRef.current = { userProfile, cycleRecords, symptomRecords, reports, activePathway };

  // 1. Initial State: Synchronous Immediate Hydration from Cache or Context (<50ms)
  const initialBaseline = useMemo(() => {
    if (longitudinalData && longitudinalData.module === moduleName && longitudinalData.period === selectedPeriod) {
      return longitudinalData;
    }
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
  }, [longitudinalData, selectedPeriod, moduleName, userProfile?.id, activePathway]);

  const [data, setData] = useState<LongitudinalHealthResponse | null>(() => initialBaseline);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState<boolean>(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Sync data when context-level longitudinalData updates
  useEffect(() => {
    if (longitudinalData && longitudinalData.module === moduleName && longitudinalData.period === selectedPeriod) {
      setData(longitudinalData);
    }
  }, [longitudinalData, moduleName, selectedPeriod]);

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

  // 2. Resilient Background Fetching (Stale-While-Revalidate without loop leaks)
  const loadLongitudinal = useCallback(
    async (signal?: AbortSignal, force = false) => {
      setIsBackgroundFetching(true);
      setRefreshNotice(null);
      setSessionError(false);

      try {
        const res = await fetchLongitudinalHealth(selectedPeriod, force, signal);
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
            const ctx = contextDataRef.current;
            return deriveBaselineFromContext({
              userProfile: ctx.userProfile,
              cycleRecords: ctx.cycleRecords,
              symptomRecords: ctx.symptomRecords,
              reports: ctx.reports,
              pathway: ctx.activePathway,
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
          const ctx = contextDataRef.current;
          return deriveBaselineFromContext({
            userProfile: ctx.userProfile,
            cycleRecords: ctx.cycleRecords,
            symptomRecords: ctx.symptomRecords,
            reports: ctx.reports,
            pathway: ctx.activePathway,
            period: selectedPeriod,
          });
        });
      } finally {
        if (!signal?.aborted) {
          setIsBackgroundFetching(false);
        }
      }
    },
    [selectedPeriod, fetchLongitudinalHealth]
  );

  useEffect(() => {
    const controller = new AbortController();
    const isForce = retryTrigger > 0;
    loadLongitudinal(controller.signal, isForce);

    return () => {
      controller.abort();
    };
  }, [loadLongitudinal, retryTrigger]);

  // Derive explicit State Model
  const totalAssessments = data?.total_assessments_recorded ?? 0;
  const hasNoAssessments = data?.has_no_assessments ?? (totalAssessments === 0);
  const hasSingleAssessment = data?.has_single_assessment_baseline ?? (totalAssessments === 1);

  // Filter symptom factors for pathway deep-dive
  const symptomComparisons = useMemo(() => {
    return (data?.current_vs_previous || []).filter((f) => f.category === 'symptom');
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

  const isFemale = activePathway === 'female';

  return (
    <div className="space-y-6 text-left select-none max-w-7xl mx-auto relative">
      {/* ── Pathway-Specific Ambient Background Wash ── */}
      <div
        className="absolute -inset-x-4 sm:-inset-x-6 -top-6 -bottom-10 pointer-events-none -z-10 select-none overflow-hidden rounded-[32px]"
        aria-hidden="true"
      >
        {isFemale ? (
          <>
            <div
              className="absolute -top-10 -left-10 w-[55vw] h-[45vh] max-w-[650px] max-h-[480px] rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(254, 226, 237, 0.55) 0%, rgba(253, 242, 248, 0.25) 50%, transparent 75%)',
              }}
            />
            <div
              className="absolute top-1/3 -right-16 w-[45vw] h-[40vh] max-w-[550px] max-h-[420px] rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(251, 207, 232, 0.40) 0%, rgba(254, 240, 245, 0.20) 50%, transparent 75%)',
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute -top-10 -left-10 w-[55vw] h-[45vh] max-w-[650px] max-h-[480px] rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(224, 242, 254, 0.65) 0%, rgba(240, 249, 255, 0.30) 50%, transparent 75%)',
              }}
            />
            <div
              className="absolute top-1/3 -right-16 w-[45vw] h-[40vh] max-w-[550px] max-h-[420px] rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(207, 250, 254, 0.45) 0%, rgba(224, 242, 254, 0.20) 50%, transparent 75%)',
              }}
            />
          </>
        )}
      </div>

      {/* ── 1. Longitudinal Header with Time Horizon Switcher ── */}
      <LongitudinalHeader
        pathway={activePathway}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        trackingPeriodDisplay={data?.tracking_period_display}
        totalAssessmentsRecorded={totalAssessments}
        isLoading={(isBackgroundFetching || longitudinalLoading) && !data}
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

      {/* ── 3. Current Health Snapshot & 4-KPI Deck ── */}
      <CurrentHealthSnapshotCard
        pathway={activePathway}
        currentSummary={data?.current_summary}
        userProfile={userProfile}
        cycleCount={cycleRecords.length}
        reportCount={reports.length}
        symptomCount={symptomRecords.length}
        trackingPeriodDisplay={data?.tracking_period_display}
        comparability={data?.screening_comparability}
        hasSingleAssessment={hasSingleAssessment}
        hasNoAssessments={hasNoAssessments}
      />

      {/* ── 4. Zero Assessments State: New Account Baseline ── */}
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
          {/* ── 5. Visual Analytics Studio (Interactive Charts) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Progression Trajectory Curve */}
            <RiskTrendChart
              pathway={activePathway}
              history={data?.screening_history || []}
              comparability={data?.screening_comparability}
              hasSingleAssessment={hasSingleAssessment}
              hasNoAssessments={hasNoAssessments}
            />

            {/* Continuous Biometric & Lab Trajectories */}
            <MetricTrendCard
              pathway={activePathway}
              metricSeriesMap={data?.metric_series || {}}
            />
          </div>

          {/* ── 6. Master Clinical Factor Matrix Table (Searchable & Filterable) ── */}
          <CurrentVsPreviousTable
            pathway={activePathway}
            factors={data?.current_vs_previous || []}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 7. Pathway-Specific Deep Dive (Vitality for Male / Ovulatory for Female) ── */}
          <SymptomProgressionCard
            pathway={activePathway}
            maleVitalitySummary={data?.male_vitality_summary}
            symptomComparisons={symptomComparisons}
            hasSingleAssessment={hasSingleAssessment}
          />

          {/* ── 8. Assessment Depth Roadmap & Chronological Activity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TierProgressionRoadmap
              pathway={activePathway}
              tiers={data?.tier_progression || []}
            />

            <ChronologicalTimeline
              pathway={activePathway}
              events={data?.timeline_events || []}
            />
          </div>
        </>
      )}

      {/* ── 9. Medical Legal Disclaimer ── */}
      <footer className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] text-xs text-[#667085] flex items-start gap-3 shadow-2xs">
        <ShieldTick className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed font-sans">
          {data?.disclaimer ||
            'BioPulse AI provides longitudinal clinical decision support and health trend visualization. Longitudinal indicators and screening deltas reflect mathematical comparisons between recorded clinical assessments and do not constitute a definitive medical diagnosis. Always consult with a qualified healthcare practitioner.'}
        </p>
      </footer>
    </div>
  );
};

export default HealthProgressSection;
