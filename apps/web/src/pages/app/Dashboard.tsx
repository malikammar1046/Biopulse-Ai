import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LayoutGrid, ArrowUpRight } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import { ExecutiveDashboardHeader } from '../../components/dashboard/overview/ExecutiveDashboardHeader';
import { CycleEnergyBubbleCard } from '../../components/dashboard/overview/CycleEnergyBubbleCard';
import { CycleCompactCard } from '../../components/dashboard/overview/CycleCompactCard';
import { SymptomActivityCard } from '../../components/dashboard/overview/SymptomActivityCard';
import { WellnessIndexMatrixCard } from '../../components/dashboard/overview/WellnessIndexMatrixCard';
import { SleepAnalysisBarChartCard } from '../../components/dashboard/overview/SleepAnalysisBarChartCard';
import { DigitalTwinInsightCard } from '../../components/dashboard/DigitalTwinInsightCard';
import { AndroSenseInsightCard } from '../../components/dashboard/overview/AndroSenseInsightCard';
import { VITASenseBaselineInsightCard } from '../../components/dashboard/overview/VITASenseBaselineInsightCard';
import { MaleHormoneRhythmCard } from '../../components/dashboard/overview/MaleHormoneRhythmCard';

// Phase 6 Adaptive Dashboard Components
import { TodayActionsCard } from '../../components/dashboard/adaptive/TodayActionsCard';
import { ProfileCompletenessCard } from '../../components/dashboard/adaptive/ProfileCompletenessCard';
import { TierProgressionCard } from '../../components/dashboard/adaptive/TierProgressionCard';
import { ReportVerificationBanner } from '../../components/dashboard/adaptive/ReportVerificationBanner';
import { QuickTrackingRow } from '../../components/dashboard/adaptive/QuickTrackingRow';
import { AIInsightsPlaceholder } from '../../components/dashboard/adaptive/AIInsightsPlaceholder';

// Action engine & Profile calculation utilities
import { buildTodayActions } from '../../utils/dashboardActions';
import { calculateProfileCompletion } from '../../utils/profileCompletion';

interface DashboardProps {
  pathway?: HealthPathway;
}

export const Dashboard: React.FC<DashboardProps> = ({ pathway: pathwayProp }) => {
  const {
    userProfile,
    nutrition,
    fitness,
    snapshotMetrics,
    mlAssessment,
    digitalTwinInsight,
    openAiChatWithPrompt,
    reports,
    reminders,
    adaptiveProfile,
  } = useUserHealth();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const activePathway = pathwayProp || resolvePathway(userProfile.gender, userProfile.pathway);

  // Compute live cycle and energy metrics for the 3-bubble Venn chart
  const energyMetrics = useMemo(() => {
    const consumed = nutrition.caloriesLogged || 0;
    const target = nutrition.caloriesTarget || 2000;
    const burned = fitness.caloriesBurned || 0;
    const minutes = fitness.activeMinutesToday || 0;

    const defaultPhase =
      activePathway === 'female'
        ? snapshotMetrics.phaseName || 'Not tracking cycle'
        : activePathway === 'male'
        ? 'Diurnal Peak'
        : 'Daily Rhythm';

    return {
      cycleDay: activePathway === 'female' ? snapshotMetrics.cycleDay || 0 : 0,
      totalCycleDays: snapshotMetrics.totalCycleDays || userProfile.womensHealth?.cycleLength || 28,
      phaseName: defaultPhase,
      caloriesLogged: consumed,
      caloriesTarget: target,
      caloriesBurned: burned,
      activeMinutes: minutes,
    };
  }, [nutrition, fitness, snapshotMetrics, userProfile.womensHealth?.cycleLength, activePathway]);

  // Screening probability & Risk
  const pcosScore = useMemo(() => {
    if (activePathway === 'female') {
      if (mlAssessment && mlAssessment.pcos_probability !== undefined && mlAssessment.pcos_probability !== null) {
        return Math.round(mlAssessment.pcos_probability * 100);
      }
      return snapshotMetrics.wellnessScore || 0;
    }
    // For male & general pathways, compute readiness score from profile factors
    if (activePathway === 'male') {
      let score = 82;
      if (userProfile.mensHealth?.energyLevel === 'low') score -= 15;
      if (userProfile.mensHealth?.energyLevel === 'very_low') score -= 25;
      if (userProfile.mensHealth?.sleepQuality === 'poor') score -= 10;
      return Math.max(score, 45);
    }
    return snapshotMetrics.wellnessScore || 85;
  }, [mlAssessment, snapshotMetrics.wellnessScore, activePathway, userProfile.mensHealth]);

  // Sleep stats from user lifestyle & cycle phase
  const sleepStats = useMemo(() => {
    const hours = userProfile.lifestyle?.sleepHours || 7.5;
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours - wholeHours) * 60);
    const phase =
      activePathway === 'female'
        ? snapshotMetrics.phaseName || 'Follicular'
        : activePathway === 'male'
        ? 'Nocturnal Recovery'
        : 'Night Rest';

    return {
      efficiency: hours > 0 ? 88 : 0,
      hours: wholeHours,
      minutes: mins,
      cycleDay: activePathway === 'female' ? snapshotMetrics.cycleDay || 0 : 0,
      phaseName: phase,
    };
  }, [userProfile.lifestyle?.sleepHours, snapshotMetrics, activePathway]);

  // Phase 6: Deterministic Profile Completion
  const profileCompletion = useMemo(
    () => calculateProfileCompletion(userProfile),
    [userProfile]
  );

  // Phase 6: Prioritized Today's Actions Engine
  const todayActions = useMemo(
    () =>
      buildTodayActions({
        userProfile,
        pathway: activePathway,
        adaptiveProfile,
        profileCompletion,
        reports,
        snapshotMetrics,
        nutrition,
        fitness,
        reminders,
      }),
    [userProfile, activePathway, adaptiveProfile, profileCompletion, reports, snapshotMetrics, nutrition, fitness, reminders]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-6 sm:space-y-7 pb-16 text-left select-none"
    >
      {/* ── 1. Top Executive Header ── */}
      <ExecutiveDashboardHeader
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onSearch={(q) => console.log('Searching for:', q)}
        pathwayOverride={activePathway}
      />

      {/* ── 2. Report Verification Quarantine Alert (Adaptive Phase 5/6 Boundary) ── */}
      <ReportVerificationBanner reports={reports} />

      {/* ── 3. Primary Showcase: Adaptive Screening Assessment Card ── */}
      <section id="health-screening-overview" aria-label="Health Pathway Screening Assessment" className="w-full">
        {activePathway === 'female' && (
          <DigitalTwinInsightCard
            insight={digitalTwinInsight}
            onOpenChat={openAiChatWithPrompt}
          />
        )}
        {activePathway === 'male' && (
          <AndroSenseInsightCard
            onOpenChat={openAiChatWithPrompt}
          />
        )}
        {activePathway === 'general' && (
          <VITASenseBaselineInsightCard
            onOpenChat={openAiChatWithPrompt}
          />
        )}
      </section>

      {/* ── 4. Primary Executive Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ── Column 1: Cycle & Energy Bubble Card (Left, spans 5 cols on lg) ── */}
        <div className="lg:col-span-5 flex flex-col">
          {activePathway === 'female' ? (
            <CycleEnergyBubbleCard
              cycleDay={energyMetrics.cycleDay}
              totalCycleDays={energyMetrics.totalCycleDays}
              phaseName={energyMetrics.phaseName}
              caloriesLogged={energyMetrics.caloriesLogged}
              caloriesTarget={energyMetrics.caloriesTarget}
              caloriesBurned={energyMetrics.caloriesBurned}
              activeMinutes={energyMetrics.activeMinutes}
            />
          ) : (
            <MaleHormoneRhythmCard />
          )}
        </div>

        {/* ── Column 2: Compact Metrics & Sleep Bar Chart (Right, spans 7 cols on lg) ── */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5 sm:space-y-6">
          {/* Top Row: Two Equal Compact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {/* Left Column: Contextual Card by Pathway */}
            <div className="flex flex-col">
              {activePathway === 'female' ? (
                <CycleCompactCard
                  cycleDay={snapshotMetrics.cycleDay || 0}
                  totalCycleDays={snapshotMetrics.totalCycleDays || 28}
                  phaseName={snapshotMetrics.phaseName || 'Follicular'}
                  nextPeriodDays={snapshotMetrics.nextPeriodDays || 14}
                />
              ) : (
                <SymptomActivityCard
                  symptomsCount={snapshotMetrics.symptomsCountToday || 0}
                  activeMinutes={fitness.activeMinutesToday || 45}
                  distanceKm={fitness.activeMinutesToday ? (fitness.activeMinutesToday * 80) / 1000 : 4.2}
                />
              )}
            </div>

            {/* Right Column: Screening & Wellness Dot Matrix Card */}
            <div className="flex flex-col">
              <WellnessIndexMatrixCard
                score={pcosScore}
                isHigherRisk={activePathway === 'female' ? (mlAssessment?.is_higher_risk ?? false) : false}
                riskCategory={activePathway === 'female' ? (mlAssessment?.risk_category || 'lower_risk') : 'balanced'}
                completenessPercent={mlAssessment?.data_quality?.completeness_percentage || 100}
              />
            </div>
          </div>

          {/* Bottom Wide Card: Sleep & Recovery Analysis */}
          <div className="w-full flex-1">
            <SleepAnalysisBarChartCard
              efficiencyPercent={sleepStats.efficiency}
              durationHours={sleepStats.hours}
              durationMinutes={sleepStats.minutes}
              currentCycleDay={sleepStats.cycleDay}
              phaseName={sleepStats.phaseName}
            />
          </div>
        </div>
      </div>

      {/* ── 5. Today's Priorities: Deterministic Action Engine (Phase 6) ── */}
      <TodayActionsCard actions={todayActions} pathway={activePathway} />

      {/* ── 6. Adaptive Profile Completeness & Tier Progression (Phase 6) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <ProfileCompletenessCard completion={profileCompletion} pathway={activePathway} />
        <TierProgressionCard adaptiveProfile={adaptiveProfile} pathway={activePathway} />
      </div>

      {/* ── 7. 1-Tap Daily Quick Tracking Row (Phase 6) ── */}
      <QuickTrackingRow
        pathway={activePathway}
        nutrition={nutrition}
        fitness={fitness}
        snapshotMetrics={snapshotMetrics}
      />

      {/* ── 8. Phase 7 Architecture Readiness: Explainable AI Slot ── */}
      <AIInsightsPlaceholder pathway={activePathway} />

      {/* ── 9. Quick Hub Banner: Direct Access to All-Module Master Clinical Hub ── */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-r from-[#180A26] via-[#240F38] to-[#12071F] border border-white/10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FDA4AF] shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold font-display text-white">
                Master Health Hub
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] font-bold">
                All Modules Live
              </span>
            </div>
            <p className="text-xs text-[#CDBDD8] font-sans">
              Looking for full clinical charts, medication tracker, lab reports, and Care Circle?
            </p>
          </div>
        </div>

        <Link
          to={ROUTES.APP.HUB}
          className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-sans text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <span>Open Master Hub</span>
          <ArrowUpRight className="w-4 h-4 text-[#FDA4AF]" />
        </Link>
      </div>
    </motion.div>
  );
};

export default Dashboard;
