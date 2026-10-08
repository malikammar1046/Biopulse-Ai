import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import { APPLE_SPRINGS } from './FemaleDesignPrimitives';

import { DashboardGreetingRow } from '../dashboard/overview/DashboardGreetingRow';
import { ScreeningModuleCard } from '../dashboard/overview/modules/ScreeningModuleCard';
import { PeriodCycleModuleCard } from '../dashboard/overview/modules/PeriodCycleModuleCard';
import { NutritionModuleCard } from '../dashboard/overview/modules/NutritionModuleCard';
import { ExerciseModuleCard } from '../dashboard/overview/modules/ExerciseModuleCard';
import { WaterModuleCard } from '../dashboard/overview/modules/WaterModuleCard';
import { MedicationModuleCard } from '../dashboard/overview/modules/MedicationModuleCard';
import { CareCircleModuleCard } from '../dashboard/overview/modules/CareCircleModuleCard';
import { SymptomsModuleCard } from '../dashboard/overview/modules/SymptomsModuleCard';
import { NextBestActionModuleCard } from '../dashboard/overview/modules/NextBestActionModuleCard';

import { SpecialistCareModuleCard } from '../doctors/SpecialistCareModuleCard';
import { getAuthoritativeAssessmentForPathway } from '../../utils/authoritativeAssessmentSelector';
import { logDashboardRenderTrace } from '../../utils/probabilityTrace';

export const FemaleDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    activeAssessment,
    assessmentLoading,
    reports,
    cycleStats,
    cycleLoading,
    foodLogs,
    dailyNutritionTargets,
    dietLoading,
    todayFitnessActivities,
    todayFitnessMinutes,
    fitnessLoading,
    waterLog,
    incrementWater,
    decrementWater,
    medications,
    todayMedicationProgress,
    medicationsLoading,
    careCircleMembers,
    careCircleLoading,
    symptomRecords,
    symptomStats,
    symptomsLoading,
    openAiChatWithPrompt,
  } = useUserHealth();

  // 1. Authoritative Assessment State strictly bound to female_pcos
  const authoritative = useMemo(() => {
    return getAuthoritativeAssessmentForPathway({
      activeAssessment,
      pathway: 'female',
      userId: userProfile?.id,
    });
  }, [activeAssessment, userProfile?.id]);

  const {
    authoritativeAssessment,
    hasAssessment,
    probabilityPercent,
    riskCategory,
    riskLabel,
    assessmentLevel,
    inputHash,
    source: displaySource,
  } = authoritative;

  // Diagnostic DEV trace
  useEffect(() => {
    logDashboardRenderTrace({
      pathway: 'female',
      userId: userProfile?.id,
      dashboardSource: displaySource,
      displayedProbability: probabilityPercent,
      assessmentId: authoritativeAssessment?.assessment_id || authoritativeAssessment?.id,
      module: authoritativeAssessment?.module,
      inputHash,
    });
  }, [displaySource, probabilityPercent, authoritativeAssessment, userProfile?.id, inputHash]);

  const lastAssessmentDateFormatted = useMemo(() => {
    const rawDate = authoritativeAssessment?.created_at;
    if (!rawDate) return null;
    return new Date(rawDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [authoritativeAssessment?.created_at]);

  // Unverified reports count
  const unverifiedReportsCount = useMemo(() => {
    return (reports || [])
      .filter((r) => r.status === 'needs_verification')
      .reduce((sum, r) => sum + (r.results?.filter((res) => !res.userVerified)?.length || 0), 0);
  }, [reports]);

  // 2. Real Sync Timestamp (updates when data loads or mounts)
  const [syncTimestamp, setSyncTimestamp] = useState<Date>(() => new Date());

  useEffect(() => {
    setSyncTimestamp(new Date());
  }, [activeAssessment, foodLogs, waterLog, todayFitnessActivities, cycleStats]);

  const lastSyncedFormatted = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - syncTimestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins <= 1) return 'just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return `${Math.floor(diffMins / 60)} hr ago`;
  }, [syncTimestamp]);

  // Quick action navigation handlers
  const handleAction = useCallback(
    (targetRoute: string) => {
      navigate(targetRoute);
    },
    [navigate]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={APPLE_SPRINGS.instant}
      className="max-w-7xl mx-auto space-y-6 sm:space-y-7 pb-16 text-left select-none"
    >
      {/* ── 1. Greeting, Pathway Badge, Live Sync & Date Context Row ───────── */}
      <DashboardGreetingRow
        fullName={userProfile?.fullName}
        pathway="female"
        cycleDay={cycleStats.currentCycleDay}
        hasCycleData={cycleStats.hasData}
        lastSyncedFormatted={lastSyncedFormatted}
      />

      {/* ── 2. The 3x3 Modular Dashboard Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 */}
        {/* Card 1: PCOS Screening */}
        <ScreeningModuleCard
          pathway="female"
          hasAssessment={hasAssessment}
          probabilityPercent={probabilityPercent}
          riskCategory={riskCategory}
          riskLabel={riskLabel}
          assessmentLevel={assessmentLevel}
          lastAssessmentDate={lastAssessmentDateFormatted}
          loading={assessmentLoading}
          onStartScreening={() => navigate(ROUTES.APP.ASSESSMENT)}
          onViewAssessment={() => navigate(ROUTES.APP.ASSESSMENT)}
        />

        {/* Card 2: Period Cycle */}
        <PeriodCycleModuleCard
          cycleStats={cycleStats}
          loading={cycleLoading}
          onOpenCycle={() => navigate(ROUTES.APP.CYCLE)}
          onLogPeriod={() => navigate(ROUTES.APP.CYCLE)}
        />

        {/* Card 3: Nutrition & Meals */}
        <NutritionModuleCard
          foodLogs={foodLogs}
          dailyTargets={dailyNutritionTargets}
          pathway="female"
          loading={dietLoading}
          onViewMealPlan={() => navigate(ROUTES.APP.LIFESTYLE)}
          onLogMeal={() => navigate(ROUTES.APP.LIFESTYLE)}
        />

        {/* ROW 2 */}
        {/* Card 4: Exercise & Movement */}
        <ExerciseModuleCard
          todayActivities={todayFitnessActivities}
          todayMinutes={todayFitnessMinutes}
          pathway="female"
          loading={fitnessLoading}
          onOpenFitness={() => navigate(ROUTES.APP.FITNESS)}
          onLogActivity={() => navigate(ROUTES.APP.FITNESS)}
        />

        {/* Card 5: Water Log */}
        <WaterModuleCard
          waterLog={waterLog}
          loading={dietLoading}
          onIncrement={incrementWater}
          onDecrement={decrementWater}
          onOpenWaterLog={() => navigate(ROUTES.APP.LIFESTYLE)}
        />

        {/* Card 6: Medication Reminders */}
        <MedicationModuleCard
          medications={medications}
          todayProgress={todayMedicationProgress}
          pathway="female"
          loading={medicationsLoading}
          onOpenMedications={() => navigate(ROUTES.APP.MEDICATIONS)}
          onAddMedication={() => navigate(ROUTES.APP.MEDICATIONS)}
        />

        {/* ROW 3 */}
        {/* Card 7: Care Circle */}
        <CareCircleModuleCard
          members={careCircleMembers}
          pathway="female"
          loading={careCircleLoading}
          onOpenCareCircle={() => navigate(ROUTES.APP.CARE_CIRCLE)}
          onAddMember={() => navigate(ROUTES.APP.CARE_CIRCLE)}
        />

        {/* Card 8: Symptom Check-in */}
        <SymptomsModuleCard
          symptomRecords={symptomRecords}
          symptomStats={symptomStats}
          pathway="female"
          loading={symptomsLoading}
          onOpenSymptoms={() => navigate(ROUTES.APP.SYMPTOMS)}
          onLogSymptom={() => navigate(ROUTES.APP.SYMPTOMS)}
        />

        {/* Card 9: Next Best Action */}
        <NextBestActionModuleCard
          hasAssessment={hasAssessment}
          assessmentLevel={assessmentLevel}
          unverifiedReportsCount={unverifiedReportsCount}
          hasLoggedFoodToday={foodLogs.length > 0}
          hasLoggedWaterToday={waterLog.glasses > 0}
          pathway="female"
          onAction={handleAction}
          onOpenAiTwin={() => openAiChatWithPrompt('What is my recommended next clinical step?')}
        />
      </div>

      {/* ── 3. Clinical Specialist Care Pathway ───────────────────────────── */}
      <SpecialistCareModuleCard pathway="female" />
    </motion.div>
  );
};

export default FemaleDashboardOverview;
