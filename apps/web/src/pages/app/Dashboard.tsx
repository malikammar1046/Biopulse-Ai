import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LayoutGrid, ArrowUpRight } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';
import { ExecutiveDashboardHeader } from '../../components/dashboard/overview/ExecutiveDashboardHeader';
import { CycleEnergyBubbleCard } from '../../components/dashboard/overview/CycleEnergyBubbleCard';
import { CycleCompactCard } from '../../components/dashboard/overview/CycleCompactCard';
import { SymptomActivityCard } from '../../components/dashboard/overview/SymptomActivityCard';
import { WellnessIndexMatrixCard } from '../../components/dashboard/overview/WellnessIndexMatrixCard';
import { SleepAnalysisBarChartCard } from '../../components/dashboard/overview/SleepAnalysisBarChartCard';
import { DigitalTwinInsightCard } from '../../components/dashboard/DigitalTwinInsightCard';

export const Dashboard: React.FC = () => {
  const {
    userProfile,
    nutrition,
    fitness,
    snapshotMetrics,
    mlAssessment,
    digitalTwinInsight,
    openAiChatWithPrompt,
  } = useUserHealth();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  // Compute live cycle and energy metrics for the 3-bubble Venn chart
  const energyMetrics = useMemo(() => {
    const consumed = nutrition.caloriesLogged || 0;
    const target = nutrition.caloriesTarget || 2000;
    const burned = fitness.caloriesBurned || 0;
    const minutes = fitness.activeMinutesToday || 0;

    return {
      cycleDay: snapshotMetrics.cycleDay || 0,
      totalCycleDays: snapshotMetrics.totalCycleDays || userProfile.womensHealth?.cycleLength || 28,
      phaseName: snapshotMetrics.phaseName || 'Not tracking cycle',
      caloriesLogged: consumed,
      caloriesTarget: target,
      caloriesBurned: burned,
      activeMinutes: minutes,
    };
  }, [nutrition, fitness, snapshotMetrics, userProfile.womensHealth?.cycleLength]);

  // PCOS AI Screening probability & Risk
  const pcosScore = useMemo(() => {
    if (mlAssessment && mlAssessment.pcos_probability !== undefined && mlAssessment.pcos_probability !== null) {
      return Math.round(mlAssessment.pcos_probability * 100);
    }
    return snapshotMetrics.wellnessScore || 0;
  }, [mlAssessment, snapshotMetrics.wellnessScore]);

  // Sleep stats from user lifestyle & cycle phase
  const sleepStats = useMemo(() => {
    const hours = userProfile.lifestyle?.sleepHours || 0;
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours - wholeHours) * 60);
    return {
      efficiency: hours > 0 ? 85 : 0,
      hours: wholeHours,
      minutes: mins,
      cycleDay: snapshotMetrics.cycleDay || 0,
      phaseName: snapshotMetrics.phaseName || 'Not tracking cycle',
    };
  }, [userProfile.lifestyle?.sleepHours, snapshotMetrics]);

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
      />

      {/* ── 2. Primary Showcase: OvaSense PCOS ML Screening Assessment Card ── */}
      <section id="ovasense-ml-screening-overview" aria-label="OvaSense PCOS ML Screening Assessment" className="w-full">
        <DigitalTwinInsightCard
          insight={digitalTwinInsight}
          onOpenChat={openAiChatWithPrompt}
        />
      </section>

      {/* ── 3. Primary Executive Grid Layout (Exact Match to Screenshot Architecture) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ── Column 1: Cycle & Energy Bubble Card (Left, spans 5 cols on lg) ── */}
        <div className="lg:col-span-5 flex flex-col">
          <CycleEnergyBubbleCard
            cycleDay={energyMetrics.cycleDay}
            totalCycleDays={energyMetrics.totalCycleDays}
            phaseName={energyMetrics.phaseName}
            caloriesLogged={energyMetrics.caloriesLogged}
            caloriesTarget={energyMetrics.caloriesTarget}
            caloriesBurned={energyMetrics.caloriesBurned}
            activeMinutes={energyMetrics.activeMinutes}
          />
        </div>

        {/* ── Columns 2 & 3: Stacked Right Grid (spans 7 cols on lg) ── */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5 sm:gap-6">
          {/* Top Row: Menstrual Cycle + Activity (Middle) & PCOS Screening Index (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Middle Column: 2 Stacked Compact Cards */}
            <div className="flex flex-col gap-5 sm:gap-6 justify-between">
              <CycleCompactCard
                cycleDay={snapshotMetrics.cycleDay || 14}
                totalCycleDays={snapshotMetrics.totalCycleDays || 28}
                phaseName={snapshotMetrics.phaseName}
                nextPeriodDays={snapshotMetrics.nextPeriodDays || 14}
              />
              <SymptomActivityCard
                symptomsCount={snapshotMetrics.symptomsCountToday || 0}
                activeMinutes={fitness.activeMinutesToday || 45}
                distanceKm={fitness.activeMinutesToday ? (fitness.activeMinutesToday * 80) / 1000 : 4.2}
              />
            </div>

            {/* Right Column: PCOS Screening & Wellness Dot Matrix Card */}
            <div className="flex flex-col">
              <WellnessIndexMatrixCard
                score={pcosScore}
                isHigherRisk={mlAssessment?.is_higher_risk ?? false}
                riskCategory={mlAssessment?.risk_category || 'lower_risk'}
                completenessPercent={mlAssessment?.data_quality?.completeness_percentage || 100}
              />
            </div>
          </div>

          {/* Bottom Wide Card: Sleep & Hormone Recovery Analysis */}
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

      {/* ── 4. Quick Hub Banner: Direct Access to All-Module Master Clinical Hub ── */}
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
              Looking for full clinical charts, cycle prediction ring, medication tracker, lab reports, and Care Circle?
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
