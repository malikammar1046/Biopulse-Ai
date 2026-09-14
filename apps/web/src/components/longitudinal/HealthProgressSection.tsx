import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  Activity,
  FileText,
  Clock,
  Info,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import type { MonitoringPeriod } from '../../types/longitudinal';
import { LongitudinalHealthService } from '../../services/longitudinalHealthService';
import { TrendCard } from './TrendCard';
import { ProgressComparisonCard } from './ProgressComparisonCard';
import { BiomarkerLongitudinalSection } from './BiomarkerLongitudinalSection';
import { HistoricalMetricChart } from './HistoricalMetricChart';
import { HealthTimelineView } from './HealthTimelineView';
import { DigitalTwinExplainableDrawer } from '../research/DigitalTwinExplainableDrawer';

interface HealthProgressSectionProps {
  pathway?: HealthPathway;
}

export const HealthProgressSection: React.FC<HealthProgressSectionProps> = ({
  pathway: pathwayProp,
}) => {
  const {
    userProfile,
    symptomRecords,
    cycleRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    medicationLogs,
    appointments,
    careCircleMembers,
  } = useUserHealth();

  const activePathway = pathwayProp || resolvePathway(userProfile.gender, userProfile.pathway);
  const [selectedPeriod, setSelectedPeriod] = useState<MonitoringPeriod>('30d');
  const [activeTab, setActiveTab] = useState<'trends' | 'comparison' | 'biomarkers' | 'timeline'>('trends');
  const [isDigitalTwinOpen, setIsDigitalTwinOpen] = useState<boolean>(false);

  // Synthesize Phase 8 Longitudinal State
  const longitudinalState = useMemo(() => {
    return LongitudinalHealthService.synthesizeState({
      userProfile,
      symptomRecords,
      cycleRecords: activePathway === 'female' ? cycleRecords : [], // Pathway isolation: strictly female cycles only
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs,
      appointments,
      careCircleMembers,
      pathway: activePathway,
      period: selectedPeriod,
    });
  }, [
    userProfile,
    symptomRecords,
    cycleRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    medicationLogs,
    appointments,
    careCircleMembers,
    activePathway,
    selectedPeriod,
  ]);

  // Digital Twin Dimensions with historical state
  const digitalTwinDimensions = useMemo(() => {
    return LongitudinalHealthService.getLongitudinalDimensions({
      userProfile,
      symptomRecords,
      cycleRecords: activePathway === 'female' ? cycleRecords : [],
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs: [],
      appointments: [],
      careCircleMembers: [],
      pathway: activePathway,
      period: selectedPeriod,
    });
  }, [
    userProfile,
    symptomRecords,
    cycleRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    activePathway,
    selectedPeriod,
  ]);

  // Pathway specific theme and brand
  const pathwayBrand =
    activePathway === 'female'
      ? { name: 'BioPulse AI (PCOS)', focus: 'Menstrual Cadence & Symptom Patterns' }
      : activePathway === 'male'
      ? { name: 'BioPulse AI (Hypogonadism)', focus: 'Diurnal Energy, Sleep & Hormonal Vitality' }
      : { name: 'BioPulse AI', focus: 'Universal Lifestyle, Hydration & Activity' };

  return (
    <div className="space-y-6 text-left select-none">
      {/* ── 1. Top Section Header & Time Range Filter ── */}
      <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-[#01579B] border border-[#0288D1]/30 text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#38BDF8] font-bold">
                {pathwayBrand.name} Longitudinal Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                Phase 8 Live
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
              Health Progress & Trends
            </h2>
            <p className="text-xs sm:text-sm text-[#E0F2FE] max-w-2xl font-sans">
              Observational changes derived strictly from your stored records across {pathwayBrand.focus}.
            </p>
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-black/20 border border-white/20 self-stretch sm:self-auto max-w-full">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '3 Months' },
              { id: '180d', label: '6 Months' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedPeriod(t.id as MonitoringPeriod)}
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

        {/* Action Button: Open Digital Twin Historical State */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#E0F2FE]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#34D399]" />
            <span>
              Analysis based on <strong>{longitudinalState.totalEventsAnalyzed}</strong> verified user entries in your record.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDigitalTwinOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans text-xs font-semibold transition-all self-start sm:self-auto cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Longitudinal Health Summary</span>
            <ChevronRight className="w-3 h-3 text-white/70" />
          </button>
        </div>
      </div>

      {/* ── 2. Empty State Notice if Zero Health Data ── */}
      {!longitudinalState.hasAnyData && (
        <div className="p-8 rounded-[28px] bg-white border border-[#BAE6FD] shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold font-display text-[#0F172A]">Your Health Story Begins Here</h3>
          <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
            Your progress will appear here as you start recording symptoms, meals, daily movement, and medical reports. We never fabricate health history or predict patterns without real evidence.
          </p>
        </div>
      )}

      {/* ── 3. Central Progress Overview Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Improving */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>What is Improving</span>
          </div>
          {longitudinalState.overview.whatIsImproving.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-[#0F172A] font-sans">
              {longitudinalState.overview.whatIsImproving.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span className="font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#64748B] italic font-sans">No improvements recorded yet in this period.</p>
          )}
        </div>

        {/* Changing */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-amber-600" />
            <span>What has Changed</span>
          </div>
          {longitudinalState.overview.whatHasChanged.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-[#0F172A] font-sans">
              {longitudinalState.overview.whatHasChanged.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span className="font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#64748B] italic font-sans">No metric variances detected in this period.</p>
          )}
        </div>

        {/* Stayed Similar */}
        <div className="p-5 rounded-2xl bg-white border border-[#BAE6FD] shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0369A1] uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#0288D1]" />
            <span>Stayed Similar</span>
          </div>
          {longitudinalState.overview.whatHasStayedSimilar.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-[#0F172A] font-sans">
              {longitudinalState.overview.whatHasStayedSimilar.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#0288D1] font-bold mt-0.5">•</span>
                  <span className="font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#64748B] italic font-sans">Baseline indicators remain steady.</p>
          )}
        </div>

        {/* Limited Data */}
        <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-800 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Limited Evidence</span>
          </div>
          {longitudinalState.overview.whatIsLimited.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-[#0F172A] font-sans">
              {longitudinalState.overview.whatIsLimited.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span className="font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#64748B] italic font-sans">Record coverage is sufficient for active tracked domains.</p>
          )}
        </div>
      </div>

      {/* ── 4. Main Tab Navigation ── */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#BAE6FD] shadow-xs flex overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap gap-1.5">
        {[
          { id: 'trends', label: 'Observed Trends', icon: TrendingUp },
          { id: 'comparison', label: 'Period Comparison', icon: Calendar },
          { id: 'biomarkers', label: 'Verified Lab Trends', icon: FileText },
          { id: 'timeline', label: 'Chronological Timeline', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                active
                  ? 'bg-[#0288D1] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F9FF]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#0288D1]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 5. Tab Content ── */}

      {/* TAB A: Observed Trends */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Pathway Feature Highlights */}
          {activePathway === 'female' && longitudinalState.cycleLongitudinal && (
            <div className="p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                    Cycle Health
                  </span>
                  <h3 className="text-base font-bold font-display text-[#0F172A]">
                    OvaSense Cycle Interval History
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]">
                  {longitudinalState.cycleLongitudinal.recordedCyclesCount} Logged Cycles
                </span>
              </div>

              {longitudinalState.cycleLongitudinal.intervals.length >= 2 ? (
                <HistoricalMetricChart
                  title="Consecutive Cycle Intervals (Days)"
                  subtitle="Interval lengths between recorded period start dates"
                  data={longitudinalState.cycleLongitudinal.cycleHistory
                    .filter((h) => h.cycleLengthDays !== undefined)
                    .map((h) => ({
                      label: `Cycle ${h.cycleIndex}`,
                      value: h.cycleLengthDays || 28,
                      sublabel: `${h.startDate} (${h.durationDays} days bleeding)`,
                    }))}
                  unit="days"
                  color="#0288D1"
                />
              ) : (
                <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-left">
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {longitudinalState.cycleLongitudinal.insufficientDataReason}
                  </p>
                </div>
              )}

              {/* Symptom Clusters by Cycle Phase */}
              {longitudinalState.symptomLongitudinal.phaseClusters && (
                <div className="pt-3 border-t border-[#E2E8F0]">
                  <span className="text-[11px] font-mono uppercase text-[#0288D1] font-bold block mb-2.5">
                    Symptom Clusters Across Cycle Phases
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {longitudinalState.symptomLongitudinal.phaseClusters.map((cluster) => (
                      <div
                        key={cluster.phaseName}
                        className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] text-left space-y-1"
                      >
                        <span className="text-[11px] font-medium text-[#475569] block truncate">
                          {cluster.phaseName}
                        </span>
                        <div className="text-lg font-bold font-mono text-[#0F172A]">
                          {cluster.symptomCount} events
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 block">
                          {cluster.percentage}% of logged symptoms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AndroSense Male Energy & Endocrine Rhythm */}
          {activePathway === 'male' && longitudinalState.androSenseLongitudinal && (
            <div className="p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-sm space-y-4">
              <div className="space-y-0.5 border-b border-[#E2E8F0] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                  Male Endocrine Rhythm
                </span>
                <h3 className="text-base font-bold font-display text-[#0F172A]">
                  AndroSense Diurnal Energy & Hormonal Rhythm
                </h3>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                {longitudinalState.androSenseLongitudinal.observation}
              </p>
              {longitudinalState.androSenseLongitudinal.testosteroneReadings.length > 0 && (
                <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-2">
                  <span className="text-[11px] font-mono text-[#0288D1] uppercase font-bold block">
                    Verified Testosterone History
                  </span>
                  <div className="space-y-2 pt-1">
                    {longitudinalState.androSenseLongitudinal.testosteroneReadings.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-[#BAE6FD]">
                        <span className="text-[#0F172A]">
                          {t.date}: <strong className="font-mono text-[#0288D1]">{t.value} {t.unit}</strong>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F9FF] text-[#475569] border border-[#BAE6FD]">
                          {t.drawTiming}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grid of Trend Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {longitudinalState.trends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        </div>
      )}

      {/* TAB B: Period Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#BAE6FD] shadow-xs text-xs text-[#475569] leading-relaxed">
            Comparing <strong className="text-[#0F172A]">{longitudinalState.periodLabel}</strong> with the immediate preceding period of equal length.
            Calculated strictly from real logged entries; composite health percentages are never fabricated.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {longitudinalState.periodComparisons.map((comp) => (
              <ProgressComparisonCard key={comp.id} comparison={comp} />
            ))}
          </div>
        </div>
      )}

      {/* TAB C: Verified Biomarker Trends */}
      {activeTab === 'biomarkers' && (
        <BiomarkerLongitudinalSection
          comparisons={longitudinalState.biomarkerComparisons}
          quarantinedCount={longitudinalState.quarantinedBiomarkersCount}
        />
      )}

      {/* TAB D: Chronological Timeline */}
      {activeTab === 'timeline' && (
        <div className="p-6 rounded-[24px] bg-white border border-[#BAE6FD] shadow-sm">
          <HealthTimelineView groups={longitudinalState.groupedTimeline} />
        </div>
      )}

      {/* ── 6. Clinical & Safety Boundary Notice ── */}
      <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-3 text-xs text-[#0369A1]">
        <Info className="w-4 h-4 text-[#0288D1] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0F172A]">Safety Notice:</strong> This longitudinal progress section summarizes your self-reported logs and verified laboratory documents. It is an observational tracking tool, not a clinical diagnosis or treatment prescription. Consider sharing this summary with your healthcare provider.
        </p>
      </div>

      {/* ── 7. Digital Twin Explainable Drawer ── */}
      <DigitalTwinExplainableDrawer
        isOpen={isDigitalTwinOpen}
        onClose={() => setIsDigitalTwinOpen(false)}
        dimensions={digitalTwinDimensions}
        pathway={activePathway}
      />
    </div>
  );
};
