import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  FileText,
  Clock,
  Info,
  ShieldCheck,
  HeartPulse,
  WifiOff,
  BarChart2,
  CalendarDays,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import type {
  LongitudinalHealthResponse,
  MonitoringPeriodFilter,
  MetricSeries,
} from '../../types/longitudinalHealth';
import {
  getLongitudinalHealth,
  getLocalActiveAssessment,
} from '../../services/intelligenceService';
import { HistoricalMetricChart } from './HistoricalMetricChart';
import type { ProgressiveAssessment } from '../../types/intelligence';

interface HealthProgressSectionProps {
  pathway?: HealthPathway;
}

export const HealthProgressSection: React.FC<HealthProgressSectionProps> = ({
  pathway: pathwayProp,
}) => {
  const { userProfile } = useUserHealth();

  const activePathway = pathwayProp || resolvePathway(userProfile.gender, userProfile.pathway);
  const [selectedPeriod, setSelectedPeriod] = useState<MonitoringPeriodFilter>('90d');
  const [backendData, setBackendData] = useState<LongitudinalHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [cachedSnapshot, setCachedSnapshot] = useState<ProgressiveAssessment | null>(null);

  // Active sub-metric selectors
  const [selectedKeyMetricKey, setSelectedKeyMetricKey] = useState<string>('');
  const [selectedLabMetricKey, setSelectedLabMetricKey] = useState<string>('');

  const moduleName = activePathway === 'male' ? 'male_hypogonadism' : 'female_pcos';

  // Load authoritative backend longitudinal health
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsOffline(false);

    // Read cached snapshot for offline fallback
    const cached = getLocalActiveAssessment(userProfile?.id, moduleName);
    setCachedSnapshot(cached);

    const fetchHistory = async () => {
      try {
        const res = await getLongitudinalHealth(selectedPeriod, moduleName);
        if (!isMounted) return;
        if (res) {
          setBackendData(res);
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsOffline(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedPeriod, activePathway, moduleName]);

  // Extract available Anthropometric metrics with real data
  const availableKeyMetrics: MetricSeries[] = useMemo(() => {
    if (!backendData?.metric_series) return [];
    return Object.values(backendData.metric_series).filter(
      (m) => m.category === 'anthropometric' && m.data_points && m.data_points.length > 0
    );
  }, [backendData]);

  // Set default selected key metric when data loads
  useEffect(() => {
    if (availableKeyMetrics.length > 0 && (!selectedKeyMetricKey || !availableKeyMetrics.some(m => m.metric_key === selectedKeyMetricKey))) {
      setSelectedKeyMetricKey(availableKeyMetrics[0].metric_key);
    }
  }, [availableKeyMetrics, selectedKeyMetricKey]);

  // Extract available Verified Lab metrics with real data
  const availableLabMetrics: MetricSeries[] = useMemo(() => {
    if (!backendData?.metric_series) return [];
    return Object.values(backendData.metric_series).filter(
      (m) => m.category === 'laboratory' && m.data_points && m.data_points.length > 0
    );
  }, [backendData]);

  // Set default selected lab metric when data loads
  useEffect(() => {
    if (availableLabMetrics.length > 0 && (!selectedLabMetricKey || !availableLabMetrics.some(m => m.metric_key === selectedLabMetricKey))) {
      setSelectedLabMetricKey(availableLabMetrics[0].metric_key);
    }
  }, [availableLabMetrics, selectedLabMetricKey]);

  const activeKeyMetricSeries = useMemo(() => {
    return availableKeyMetrics.find((m) => m.metric_key === selectedKeyMetricKey);
  }, [availableKeyMetrics, selectedKeyMetricKey]);

  const activeLabMetricSeries = useMemo(() => {
    return availableLabMetrics.find((m) => m.metric_key === selectedLabMetricKey);
  }, [availableLabMetrics, selectedLabMetricKey]);

  const pathwayBrand =
    activePathway === 'female'
      ? { name: 'BioPulse AI (PCOS)', focus: 'Reproductive-Endocrine Cadence & Longitudinal Markers' }
      : { name: 'BioPulse AI (Hypogonadism)', focus: 'Male Hormonal Health & Endocrine Monitoring' };

  const isFemale = activePathway === 'female';

  return (
    <div className="space-y-6 text-left select-none max-w-7xl mx-auto">
      {/* ── 1. Top Section Header & Time Range Selector ── */}
      {isFemale ? (
        <div className="p-4 sm:p-6 rounded-[24px] bg-white border border-[#EAECF0] text-[#111318] shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#A92D61] font-bold">
                  {pathwayBrand.name} Longitudinal Engine
                </span>
                {isOffline && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-400/30 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline Mode
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-[#111318]">
                Health Progress & Longitudinal Trends
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] max-w-2xl font-sans">
                Authoritative historical monitoring derived strictly from completed screening assessments and verified clinical records across {pathwayBrand.focus}.
              </p>
            </div>

            {/* Time Range Filter Buttons */}
            <div className="flex overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#EAECF0] self-stretch sm:self-auto max-w-full">
              {[
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '3 Months' },
                { id: '180d', label: '6 Months' },
                { id: '1y', label: '1 Year' },
                { id: 'all', label: 'All Time' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedPeriod(t.id as MonitoringPeriodFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] ${
                    selectedPeriod === t.id
                      ? 'bg-[#E84A8A] text-white shadow-xs font-semibold'
                      : 'text-[#667085] hover:text-[#111318] hover:bg-[#F2F4F7]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Security & Provenance Banner */}
          <div className="mt-4 pt-4 border-t border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#667085]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
              <span>
                Authoritative patient data encrypted & scoped to your authenticated account.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#98A2B3]">
              {isLoading ? 'Synchronizing...' : backendData?.generated_at ? `Synchronized: ${new Date(backendData.generated_at).toLocaleTimeString()}` : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-[#01579B] border border-[#0288D1]/30 text-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#38BDF8] font-bold">
                  {pathwayBrand.name} Longitudinal Engine
                </span>
                {isOffline && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline Mode
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                Health Progress & Longitudinal Trends
              </h2>
              <p className="text-xs sm:text-sm text-[#E0F2FE] max-w-2xl font-sans">
                Authoritative historical monitoring derived strictly from completed screening assessments and verified clinical records across {pathwayBrand.focus}.
              </p>
            </div>

            {/* Time Range Filter Buttons */}
            <div className="flex overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-black/20 border border-white/20 self-stretch sm:self-auto max-w-full">
              {[
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '3 Months' },
                { id: '180d', label: '6 Months' },
                { id: '1y', label: '1 Year' },
                { id: 'all', label: 'All Time' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedPeriod(t.id as MonitoringPeriodFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    selectedPeriod === t.id
                      ? 'bg-[#0288D1] text-white shadow-sm font-semibold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Security & Provenance Banner */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#E0F2FE]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              <span>
                Authoritative patient data encrypted & scoped to your authenticated account.
              </span>
            </div>
            <span className="text-[11px] font-mono text-white/70">
              {isLoading ? 'Synchronizing...' : backendData?.generated_at ? `Synchronized: ${new Date(backendData.generated_at).toLocaleTimeString()}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* ── 2. Offline Notice (Strict Invariant: No Historical Fabrication) ── */}
      {isOffline && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm text-amber-950 font-display">Historical Health Data Unavailable Offline</h4>
            <p className="leading-relaxed text-amber-800">
              Historical trends, biomarker series, and timeline milestones are not generated or fabricated from snapshot values while disconnected. Real trajectories will synchronize automatically once network connectivity is restored.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. SECTION 1: Current Health Snapshot Card ── */}
      {(backendData?.current_summary || cachedSnapshot) && (
        <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-xs text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1]">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                    Active Clinical Snapshot
                  </span>
                  {isOffline && (
                    <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      Cached Offline State
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold font-display text-[#0F172A]">
                  Latest Screening Status & Biometrics
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Active Tier */}
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                {((backendData?.current_summary?.assessment_level || cachedSnapshot?.assessment_level || 'tier_1'))
                  .toUpperCase()
                  .replace('_', ' ')}
              </span>

              {/* Risk Badge */}
              {((backendData?.current_summary?.risk_label || cachedSnapshot?.risk_label)) && (
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    (backendData?.current_summary?.risk_category || cachedSnapshot?.risk_category) === 'elevated' ||
                    (backendData?.current_summary?.risk_category || cachedSnapshot?.risk_category) === 'high'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {backendData?.current_summary?.risk_label || cachedSnapshot?.risk_label} (
                  {(
                    backendData?.current_summary?.screening_probability_percent ??
                    cachedSnapshot?.probability_percent ??
                    0
                  ).toFixed(1)}
                  %)
                </span>
              )}
            </div>
          </div>

          {/* Key Biometrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {backendData?.current_summary?.key_metrics ? (
              Object.entries(backendData.current_summary.key_metrics).map(([mKey, mVal]) => {
                if (mVal === null || mVal === undefined) return null;
                const deltaObj = backendData.current_summary.metric_deltas?.[mKey];
                const labelMap: Record<string, string> = {
                  weight_kg: 'Body Weight',
                  bmi: 'Body Mass Index',
                  waist_circumference: 'Waist Circumference',
                  waist_hip_ratio: 'Waist-Hip Ratio',
                  fasting_glucose: 'Fasting Glucose',
                  hba1c: 'HbA1c',
                };
                const unitMap: Record<string, string> = {
                  weight_kg: 'kg',
                  bmi: 'kg/m²',
                  waist_circumference: 'cm',
                  waist_hip_ratio: 'ratio',
                  fasting_glucose: 'mg/dL',
                  hba1c: '%',
                };

                return (
                  <div key={mKey} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] space-y-1">
                    <span className="text-[11px] font-medium text-[#475569] block truncate">
                      {labelMap[mKey] || mKey}
                    </span>
                    <div className="text-lg font-bold font-mono text-[#0F172A]">
                      {mVal} <span className="text-xs text-[#64748B] font-sans">{unitMap[mKey] || ''}</span>
                    </div>
                    {deltaObj && deltaObj.delta !== null ? (
                      <span
                        className={`text-[10px] font-mono font-semibold block truncate ${
                          deltaObj.direction === 'increased'
                            ? 'text-amber-700'
                            : deltaObj.direction === 'decreased'
                            ? 'text-emerald-700'
                            : 'text-[#64748B]'
                        }`}
                      >
                        {deltaObj.delta > 0 ? `+${deltaObj.delta}` : deltaObj.delta} ({deltaObj.direction})
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#64748B] block truncate">
                        Baseline established
                      </span>
                    )}
                  </div>
                );
              })
            ) : cachedSnapshot?.input_features ? (
              // Offline fallback snapshot rendering
              Object.entries(cachedSnapshot.input_features).map(([fKey, fVal]) => {
                if (!['weight_kg', 'bmi', 'waist_cm', 'waist_inch', 'age'].includes(fKey) || typeof fVal !== 'number') {
                  return null;
                }
                return (
                  <div key={fKey} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] space-y-1">
                    <span className="text-[11px] font-medium text-[#475569] block truncate">
                      {fKey.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="text-lg font-bold font-mono text-[#0F172A]">
                      {fVal}
                    </div>
                    <span className="text-[10px] font-mono text-amber-700 block truncate">
                      Cached snapshot
                    </span>
                  </div>
                );
              })
            ) : null}
          </div>
        </div>
      )}

      {/* ── 4. SECTION 2: Screening Risk Trend ── */}
      {!isOffline && (
        <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-xs text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                Authoritative Trajectory
              </span>
              <h3 className="text-base font-bold font-display text-[#0F172A]">
                {activePathway === 'female' ? 'PCOS Screening Risk History' : 'Male Hypogonadism Screening Risk History'}
              </h3>
            </div>
            {backendData?.screening_history && backendData.screening_history.length > 0 && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD] self-start sm:self-auto">
                {backendData.screening_history.length} Assessment{backendData.screening_history.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {backendData?.screening_history && backendData.screening_history.length > 0 ? (
            <div className="space-y-3">
              <HistoricalMetricChart
                title="Screening Risk Probability (%)"
                subtitle="Calculated progression across completed assessments (oldest to newest)"
                data={backendData.screening_history.map((pt) => ({
                  label: pt.assessment_level.toUpperCase().replace('_', ' '),
                  value: pt.probability_percent,
                  sublabel: new Date(pt.created_at).toLocaleDateString(),
                  tooltip: `${pt.probability_percent.toFixed(1)}% (${pt.risk_label})`,
                }))}
                unit="%"
                color={activePathway === 'female' ? '#0288D1' : '#0D9488'}
              />
              <p className="text-[11px] text-[#64748B] italic">
                * Note: Screening probability represents clinical decision-support estimation, not a formal medical diagnosis.
              </p>
            </div>
          ) : (
            <div className="py-8 px-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-center space-y-2">
              <Info className="w-5 h-5 text-[#0288D1] mx-auto opacity-80" />
              <h4 className="text-xs font-bold text-[#0F172A]">No Completed Screening Assessments in this Period</h4>
              <p className="text-xs text-[#475569] max-w-sm mx-auto">
                Completed assessments will appear here chronologically with tier markers and probability scores.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 5. SECTION 3: Key Health Trends (Anthropometrics & Metabolic) ── */}
      {!isOffline && (
        <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-xs text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                Anthropometric Trends
              </span>
              <h3 className="text-base font-bold font-display text-[#0F172A]">
                Key Health & Biometric Trajectories
              </h3>
            </div>

            {/* Metric Selector Pills */}
            {availableKeyMetrics.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableKeyMetrics.map((m) => (
                  <button
                    key={m.metric_key}
                    type="button"
                    onClick={() => setSelectedKeyMetricKey(m.metric_key)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      selectedKeyMetricKey === m.metric_key
                        ? 'bg-[#0288D1] text-white shadow-xs'
                        : 'bg-[#F0F9FF] text-[#0369A1] hover:bg-[#E0F2FE] border border-[#BAE6FD]'
                    }`}
                  >
                    {m.label} ({m.unit})
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeKeyMetricSeries ? (
            <div className="space-y-3">
              {activeKeyMetricSeries.data_points.length === 1 ? (
                <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">{activeKeyMetricSeries.label}</span>
                    <span className="text-xs font-mono font-bold text-[#0288D1]">
                      {activeKeyMetricSeries.data_points[0].value} {activeKeyMetricSeries.unit}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Baseline measurement established on {new Date(activeKeyMetricSeries.data_points[0].timestamp).toLocaleDateString()}. Additional measurements over time are required to establish a visual trend line.
                  </p>
                </div>
              ) : (
                <HistoricalMetricChart
                  title={`${activeKeyMetricSeries.label} (${activeKeyMetricSeries.unit})`}
                  subtitle="Consecutive measurements recorded across your screening history"
                  data={activeKeyMetricSeries.data_points.map((pt, idx) => ({
                    label: `Point ${idx + 1}`,
                    value: pt.value,
                    sublabel: new Date(pt.timestamp).toLocaleDateString(),
                  }))}
                  unit={activeKeyMetricSeries.unit}
                  color="#0288D1"
                />
              )}
            </div>
          ) : (
            <div className="py-8 px-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-center space-y-2">
              <BarChart2 className="w-5 h-5 text-[#0288D1] mx-auto opacity-80" />
              <h4 className="text-xs font-bold text-[#0F172A]">No Anthropometric Records Available</h4>
              <p className="text-xs text-[#475569] max-w-sm mx-auto">
                Recording your weight, BMI, or waist circumference during screening establishes your longitudinal biometric trend.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 6. SECTION 4: Clinical Lab Trends (Conditionally Rendered) ── */}
      {!isOffline && availableLabMetrics.length > 0 && (
        <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-xs text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0D9488] font-bold">
                Verified Laboratory History
              </span>
              <h3 className="text-base font-bold font-display text-[#0F172A]">
                Clinical Biomarker Trends
              </h3>
            </div>

            {/* Lab Test Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableLabMetrics.map((lab) => (
                <button
                  key={lab.metric_key}
                  type="button"
                  onClick={() => setSelectedLabMetricKey(lab.metric_key)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                    selectedLabMetricKey === lab.metric_key
                      ? 'bg-[#0D9488] text-white shadow-xs'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                  }`}
                >
                  {lab.label}
                </button>
              ))}
            </div>
          </div>

          {activeLabMetricSeries && (
            <div className="space-y-4">
              {activeLabMetricSeries.data_points.length >= 2 ? (
                <HistoricalMetricChart
                  title={`${activeLabMetricSeries.label} (${activeLabMetricSeries.unit})`}
                  subtitle="Verified clinical lab report values over time"
                  data={activeLabMetricSeries.data_points.map((pt, idx) => ({
                    label: `Report ${idx + 1}`,
                    value: pt.value,
                    sublabel: new Date(pt.timestamp).toLocaleDateString(),
                    tooltip: `${pt.value} ${activeLabMetricSeries.unit} (Verified)`,
                  }))}
                  unit={activeLabMetricSeries.unit}
                  color="#0D9488"
                />
              ) : (
                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>{activeLabMetricSeries.label}</span>
                    <span className="font-mono text-[#0D9488]">
                      {activeLabMetricSeries.data_points[0].value} {activeLabMetricSeries.unit}
                    </span>
                  </div>
                  <p className="text-[#475569]">
                    Single verified measurement on {new Date(activeLabMetricSeries.data_points[0].timestamp).toLocaleDateString()}. Subsequent verified lab reports will plot the trajectory.
                  </p>
                </div>
              )}

              {/* Verified Report Table */}
              <div className="overflow-x-auto rounded-xl border border-[#BAE6FD]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] text-[#475569] font-mono uppercase text-[10px] border-b border-[#BAE6FD]">
                    <tr>
                      <th className="px-3 py-2">Test Name</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Report Date</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {activeLabMetricSeries.data_points.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-[#F0F9FF]">
                        <td className="px-3 py-2 font-medium text-[#0F172A]">
                          {pt.metadata?.test_name || activeLabMetricSeries.label}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-[#0D9488]">
                          {pt.value}
                        </td>
                        <td className="px-3 py-2 font-mono text-[#64748B]">
                          {activeLabMetricSeries.unit}
                        </td>
                        <td className="px-3 py-2 text-[#475569]">
                          {new Date(pt.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Verified Result
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-[#64748B] italic">
                * Note: Lab trends reflect verified reports. Consult your physician for clinical interpretation and reference ranges.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 7. SECTION 5: Symptom / Cycle History ── */}
      {!isOffline && (
        <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-xs text-left space-y-4">
          <div className="border-b border-[#E2E8F0] pb-3 space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
              Patient Logs
            </span>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              {activePathway === 'female' ? 'Symptom & Menstrual Cycle History' : 'Symptom History'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Symptom Records */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-[#0288D1]" />
                <span>Recorded Symptoms</span>
              </h4>

              {backendData?.symptom_history && backendData.symptom_history.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {backendData.symptom_history.map((sym, idx) => (
                    <div
                      key={sym.id || idx}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#0F172A] capitalize">
                          {sym.symptom_type?.replace('_', ' ') || 'Symptom'}
                        </span>
                        <span className="text-[10px] text-[#64748B] block">
                          {sym.occurred_at ? new Date(sym.occurred_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] capitalize">
                        {sym.severity || 'Moderate'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-center text-xs text-[#475569]">
                  No symptom entries recorded in this timeframe.
                </div>
              )}
            </div>

            {/* Cycle Records (Strictly Female Pathway Only) */}
            {activePathway === 'female' ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <CalendarDays className="w-3.5 h-3.5 text-[#0288D1]" />
                  <span>Cycle & Period Logs</span>
                </h4>

                {backendData?.cycle_history && backendData.cycle_history.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {backendData.cycle_history.map((cyc, idx) => (
                      <div
                        key={cyc.id || idx}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#0F172A]">
                            Period Started: {cyc.period_start_date ? new Date(cyc.period_start_date).toLocaleDateString() : 'Recorded'}
                          </span>
                          {cyc.period_end_date && (
                            <span className="text-[10px] text-[#64748B] block">
                              Ended: {new Date(cyc.period_end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 capitalize">
                          {cyc.flow || 'Normal'} Flow
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-center text-xs text-[#475569]">
                    No menstrual cycle entries recorded in this timeframe.
                  </div>
                )}
              </div>
            ) : (
              // Male Pathway Isolation: Do not render cycle container
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] text-xs text-[#64748B] flex items-center justify-center text-center">
                <span>Male Endocrine Tracking Mode Active. Menstrual cycle dynamics are pathway-isolated.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 8. SECTION 6: Health Timeline ── */}
      {!isOffline && (
        <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-xs text-left space-y-4">
          <div className="border-b border-[#E2E8F0] pb-3 space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
              Milestone Chronology
            </span>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              Unified Health Timeline
            </h3>
          </div>

          {backendData?.timeline_events && backendData.timeline_events.length > 0 ? (
            <div className="space-y-3">
              {backendData.timeline_events.map((evt, idx) => {
                const isScreening = evt.event_type === 'screening_assessment';
                const isLab = evt.event_type === 'verified_lab_report';
                const isCycle = evt.event_type === 'cycle_entry';

                return (
                  <div
                    key={evt.id || idx}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] flex items-start gap-3 hover:bg-[#F0F9FF] transition-all"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isScreening
                          ? 'bg-[#E0F2FE] text-[#0288D1]'
                          : isLab
                          ? 'bg-teal-100 text-teal-700'
                          : isCycle
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isScreening ? (
                        <HeartPulse className="w-4 h-4" />
                      ) : isLab ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#0F172A]">{evt.title}</span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">{evt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 px-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-center space-y-2">
              <Clock className="w-5 h-5 text-[#0288D1] mx-auto opacity-80" />
              <h4 className="text-xs font-bold text-[#0F172A]">No Health Events in this Timeframe</h4>
              <p className="text-xs text-[#475569] max-w-sm mx-auto">
                Completed assessments, verified laboratory uploads, and symptoms will populate your chronological timeline.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 9. Clinical Safety Disclaimer ── */}
      <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-3 text-xs text-[#0369A1]">
        <Info className="w-4 h-4 text-[#0288D1] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0F172A]">Clinical Disclaimer:</strong> BioPulse AI longitudinal health trends synthesize self-reported questionnaires, biometric measurements, and verified laboratory reports. This tool is designed solely for observational progress monitoring and educational decision-support. It does not provide medical diagnoses. Always consult a qualified physician for clinical evaluations.
        </p>
      </div>
    </div>
  );
};
