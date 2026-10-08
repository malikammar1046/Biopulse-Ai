import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import { APPLE_SPRINGS } from './MaleDesignPrimitives';

import { DashboardGreetingRow } from '../dashboard/overview/DashboardGreetingRow';
import { ScreeningModuleCard } from '../dashboard/overview/modules/ScreeningModuleCard';
import { MaleTrackingModuleCard } from '../dashboard/overview/modules/MaleTrackingModuleCard';
import { NutritionModuleCard } from '../dashboard/overview/modules/NutritionModuleCard';
import { ExerciseModuleCard } from '../dashboard/overview/modules/ExerciseModuleCard';
import { WaterModuleCard } from '../dashboard/overview/modules/WaterModuleCard';
import { MedicationModuleCard } from '../dashboard/overview/modules/MedicationModuleCard';
import { CareCircleModuleCard } from '../dashboard/overview/modules/CareCircleModuleCard';
import { SymptomsModuleCard } from '../dashboard/overview/modules/SymptomsModuleCard';
import { NextBestActionModuleCard } from '../dashboard/overview/modules/NextBestActionModuleCard';
import { MaleClinicalLabsModal } from '../adaptive/MaleClinicalLabsModal';

import { SpecialistCareModuleCard } from '../doctors/SpecialistCareModuleCard';
import { getAuthoritativeAssessmentForPathway } from '../../utils/authoritativeAssessmentSelector';
import { logDashboardRenderTrace } from '../../utils/probabilityTrace';

export const MaleDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation(['dashboard', 'chat', 'common']);
  const {
    userProfile,
    activeAssessment,
    assessmentLoading,
    reports,
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
    refreshActiveAssessment,
  } = useUserHealth();

  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);

  // 1. Authoritative Assessment State strictly bound to male_hypogonadism
  const authoritative = useMemo(() => {
    return getAuthoritativeAssessmentForPathway({
      activeAssessment,
      pathway: 'male',
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
      pathway: 'male',
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
    const locale = i18n.language === 'ur' ? 'ur-PK' : 'en-US';
    return new Date(rawDate).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [authoritativeAssessment?.created_at, i18n.language]);

  // Unverified reports count
  const unverifiedReportsCount = useMemo(() => {
    return (reports || [])
      .filter((r) => r.status === 'needs_verification')
      .reduce((sum, r) => sum + (r.results?.filter((res) => !res.userVerified)?.length || 0), 0);
  }, [reports]);

  // Check if hormone panel is logged in reports
  const hasHormoneLabs = useMemo(() => {
    return (reports || []).some(
      (r) =>
        r.reportType === 'hormone_test' ||
        r.reportType === 'blood_test' ||
        r.results?.some((res) =>
          res.testName?.toLowerCase().includes('testosterone')
        )
    );
  }, [reports]);

  // 2. Real Sync Timestamp (updates when data loads or mounts)
  const [syncTimestamp, setSyncTimestamp] = useState<Date>(() => new Date());

  useEffect(() => {
    setSyncTimestamp(new Date());
  }, [activeAssessment, foodLogs, waterLog, todayFitnessActivities]);

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
      if (targetRoute === '/app/assessment' && assessmentLevel === 'tier_1' && hasAssessment) {
        setIsLabsModalOpen(true);
      } else {
        navigate(targetRoute);
      }
    },
    [navigate, assessmentLevel, hasAssessment]
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
        pathway="male"
        cycleDay={null}
        hasCycleData={false}
        lastSyncedFormatted={lastSyncedFormatted}
      />

      {/* ── 2. The 3x3 Modular Dashboard Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 */}
        {/* Card 1: Hypogonadism Screening */}
        <ScreeningModuleCard
          pathway="male"
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

        {/* Card 2: Male Health Tracking / Diurnal Rhythm */}
        <MaleTrackingModuleCard
          sleepHours={userProfile?.lifestyle?.sleepHours}
          energyLevel={
            symptomRecords.find((s) => s.symptomType.includes('energy') || s.symptomType.includes('fatigue'))?.severity
          }
          adamScore={userProfile?.mensHealth?.adamScore ?? null}
          hasHormoneLabs={hasHormoneLabs}
          loading={assessmentLoading}
          onOpenVitality={() => navigate(ROUTES.APP.SYMPTOMS)}
          onAddLabs={() => setIsLabsModalOpen(true)}
        />

        {/* Card 3: Nutrition & Meals */}
        <NutritionModuleCard
          foodLogs={foodLogs}
          dailyTargets={dailyNutritionTargets}
          pathway="male"
          loading={dietLoading}
          onViewMealPlan={() => navigate(ROUTES.APP.LIFESTYLE)}
          onLogMeal={() => navigate(ROUTES.APP.LIFESTYLE)}
        />

        {/* ROW 2 */}
        {/* Card 4: Exercise & Movement */}
        <ExerciseModuleCard
          todayActivities={todayFitnessActivities}
          todayMinutes={todayFitnessMinutes}
          pathway="male"
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
          pathway="male"
          loading={medicationsLoading}
          onOpenMedications={() => navigate(ROUTES.APP.MEDICATIONS)}
          onAddMedication={() => navigate(ROUTES.APP.MEDICATIONS)}
        />

        {/* ROW 3 */}
        {/* Card 7: Care Circle */}
        <CareCircleModuleCard
          members={careCircleMembers}
          pathway="male"
          loading={careCircleLoading}
          onOpenCareCircle={() => navigate(ROUTES.APP.CARE_CIRCLE)}
          onAddMember={() => navigate(ROUTES.APP.CARE_CIRCLE)}
        />

        {/* Card 8: Symptom Check-in */}
        <SymptomsModuleCard
          symptomRecords={symptomRecords}
          symptomStats={symptomStats}
          pathway="male"
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
          pathway="male"
          onAction={handleAction}
          onOpenAiTwin={() =>
            openAiChatWithPrompt(
              t('chat:suggestedPrompts.prompt1', {
                defaultValue: 'What is my recommended next clinical step for male health?',
              })
            )
          }
        />
      </div>

      {/* ── 3. Clinical Specialist Care Pathway ───────────────────────────── */}
      <SpecialistCareModuleCard pathway="male" />

      {/* Male Clinical Labs Modal */}
      <MaleClinicalLabsModal
        isOpen={isLabsModalOpen}
        onClose={() => setIsLabsModalOpen(false)}
        onSuccess={() => refreshActiveAssessment()}
      />
    </motion.div>
  );
};

export default MaleDashboardOverview;
