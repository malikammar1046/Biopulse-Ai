import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';

// Simplified, Medical-Grade Dashboard Components
import { CleanDashboardHeader } from '../../components/dashboard/CleanDashboardHeader';
import { PrimaryScreeningCard } from '../../components/dashboard/PrimaryScreeningCard';
import { NextBestActionCard } from '../../components/dashboard/NextBestActionCard';
import { TopFactorsCard } from '../../components/dashboard/TopFactorsCard';
import { RecentActivityRow } from '../../components/dashboard/RecentActivityRow';
import { DashboardNutritionCard } from '../../components/dashboard/DashboardNutritionCard';

// Clinical Modals
import { MaleClinicalLabsModal } from '../../components/adaptive/MaleClinicalLabsModal';

// Action engine & Profile calculation utilities
import { buildTodayActions } from '../../utils/dashboardActions';
import { calculateProfileCompletion } from '../../utils/profileCompletion';

interface DashboardProps {
  pathway?: HealthPathway;
}

export const Dashboard: React.FC<DashboardProps> = ({ pathway: pathwayProp }) => {
  const navigate = useNavigate();
  const {
    userProfile,
    nutrition,
    fitness,
    snapshotMetrics,
    mlAssessment,
    activeAssessment,
    reports,
    appointments,
    reminders,
    adaptiveProfile,
    submitMaleTier1,
    assessmentLoading,
    mlAssessmentLoading,
  } = useUserHealth();

  const [isMaleLabsModalOpen, setIsMaleLabsModalOpen] = useState(false);
  const [maleScreeningStarting, setMaleScreeningStarting] = useState(false);

  const activePathway = pathwayProp || resolvePathway(userProfile.gender, userProfile.pathway);
  const isMale = activePathway === 'male';

  // ---------------------------------------------------------------------------
  // Assessment State & Authoritative Risk Probability
  // ---------------------------------------------------------------------------
  const isMaleAssessment =
    activeAssessment?.module === 'male_hypogonadism' ||
    activeAssessment?.model_name?.toLowerCase().includes('logistic') ||
    activeAssessment?.model_name?.toLowerCase().includes('male');

  const hasAssessment = isMale
    ? Boolean(isMaleAssessment && (activeAssessment?.assessment_level === 'tier_1' || activeAssessment?.assessment_level === 'tier_1_2'))
    : Boolean(activeAssessment || (mlAssessment && mlAssessment.risk_category !== 'insufficient_data'));

  // Authoritative screening probability %
  const probabilityPercent = useMemo(() => {
    if (!hasAssessment) return null;
    if (isMale) {
      if (activeAssessment?.probability_percent !== undefined) {
        return Math.round(activeAssessment.probability_percent);
      }
      if (activeAssessment?.probability !== undefined) {
        return Math.round(activeAssessment.probability * 100);
      }
      return null;
    }

    // Female PCOS probability
    if (activeAssessment?.probability_percent !== undefined) {
      return Math.round(activeAssessment.probability_percent);
    }
    if (activeAssessment?.probability !== undefined) {
      return Math.round(activeAssessment.probability * 100);
    }
    if (mlAssessment?.pcos_probability !== undefined && mlAssessment.pcos_probability !== null) {
      return Math.round(mlAssessment.pcos_probability * 100);
    }
    return null;
  }, [hasAssessment, isMale, activeAssessment, mlAssessment]);

  // Risk category & label
  const riskCategory = useMemo(() => {
    if (isMale) {
      return activeAssessment?.risk_category || 'lower';
    }
    return activeAssessment?.risk_category || mlAssessment?.risk_category || 'lower';
  }, [isMale, activeAssessment, mlAssessment]);

  const riskLabel = useMemo(() => {
    if (isMale) {
      return activeAssessment?.risk_label;
    }
    return activeAssessment?.risk_label || mlAssessment?.risk_pattern_description;
  }, [isMale, activeAssessment, mlAssessment]);

  // Assessment tier level
  const assessmentLevel = useMemo(() => {
    if (isMale) {
      return activeAssessment?.assessment_level || 'tier_1';
    }
    return activeAssessment?.assessment_level || (activeAssessment?.pcom_status ? 'tier_1_3' : 'tier_1');
  }, [isMale, activeAssessment]);

  // Formatted date string for latest assessment
  const lastAssessmentDateFormatted = useMemo(() => {
    const rawDate = activeAssessment?.created_at;
    if (!rawDate) return null;
    return new Date(rawDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [activeAssessment?.created_at]);

  // Top SHAP / contributing factors from model output
  const explanations = useMemo(() => {
    if (!hasAssessment) return [];
    if (isMale) {
      return activeAssessment?.explanations || [];
    }
    return activeAssessment?.explanations || mlAssessment?.explanations || [];
  }, [hasAssessment, isMale, activeAssessment?.explanations, mlAssessment?.explanations]);

  // Screening threshold
  const threshold = activeAssessment?.threshold ?? mlAssessment?.screening_threshold ?? (isMale ? 0.1808 : 0.38);

  // Profile completion status
  const profileCompletion = useMemo(
    () => calculateProfileCompletion(userProfile),
    [userProfile]
  );

  // Unverified reports count
  const unverifiedReportsCount = useMemo(() => {
    const unverifiedReports = reports.filter((r) => r.status === 'needs_verification');
    return unverifiedReports.reduce((sum, r) => {
      return sum + (r.results?.filter((res) => !res.userVerified)?.length || 0);
    }, 0);
  }, [reports]);

  // Today's prioritized actions (reuse deterministic engine)
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

  // Next upcoming scheduled appointment
  const nextAppointment = useMemo(() => {
    const scheduled = (appointments || []).filter((a) => a.status === 'scheduled');
    if (scheduled.length === 0) return null;
    return scheduled.sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    )[0];
  }, [appointments]);

  // Latest lab report
  const latestReport = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    return reports[0];
  }, [reports]);

  // Start screening handler
  const handleStartScreening = async () => {
    if (isMale) {
      setMaleScreeningStarting(true);
      try {
        await submitMaleTier1();
      } catch (err) {
        console.error('Failed to run initial male screening:', err);
        navigate(ROUTES.APP.ASSESSMENT);
      } finally {
        setMaleScreeningStarting(false);
      }
    } else {
      navigate(ROUTES.APP.ASSESSMENT);
    }
  };

  const screeningLoading = assessmentLoading || mlAssessmentLoading || maleScreeningStarting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-6 sm:space-y-7 pb-16 text-left select-none"
    >
      {/* ── 1. Compact Header ─────────────────────────────────────────────── */}
      <CleanDashboardHeader
        userProfile={userProfile}
        pathway={activePathway}
        lastAssessmentDate={lastAssessmentDateFormatted}
        profileCompletionPercentage={profileCompletion.percentage}
      />

      {/* ── 2. Primary Above-the-Fold Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left Column (7 cols): Primary Screening Result */}
        <div className="lg:col-span-7 flex flex-col">
          <PrimaryScreeningCard
            pathway={activePathway}
            hasAssessment={hasAssessment}
            probabilityPercent={probabilityPercent}
            riskCategory={riskCategory}
            riskLabel={riskLabel}
            assessmentLevel={assessmentLevel}
            updatedAt={lastAssessmentDateFormatted}
            threshold={threshold}
            onStartScreening={handleStartScreening}
            onViewAssessment={() => navigate(ROUTES.APP.ASSESSMENT)}
            onSecondaryAction={
              isMale && hasAssessment ? () => setIsMaleLabsModalOpen(true) : undefined
            }
            secondaryActionLabel={
              isMale && hasAssessment ? 'Add Hormone Labs' : undefined
            }
            loading={screeningLoading}
          />
        </div>

        {/* Right Column (5 cols): Recommended Next Step + Top Factors */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5 sm:space-y-6">
          <NextBestActionCard
            pathway={activePathway}
            hasAssessment={hasAssessment}
            assessmentLevel={assessmentLevel}
            unverifiedReportsCount={unverifiedReportsCount}
            topAction={todayActions[0] || null}
            onOpenLabsModal={isMale ? () => setIsMaleLabsModalOpen(true) : undefined}
          />

          {/* Top Factors: only shown if real explanation data exists */}
          <TopFactorsCard
            pathway={activePathway}
            explanations={explanations}
            onViewExplanation={() => navigate(ROUTES.APP.ASSESSMENT)}
          />
        </div>
      </div>

      {/* ── 2.5 Nutrition & Meal Planning Action Card ────────────────────── */}
      <DashboardNutritionCard pathway={activePathway} />

      {/* ── 3. Recent Activity Row (Latest Report + Upcoming Appointment) ─── */}
      <RecentActivityRow
        latestReport={latestReport}
        upcomingAppointment={nextAppointment}
      />

      {/* Male Clinical Labs Modal */}
      {isMale && (
        <MaleClinicalLabsModal
          isOpen={isMaleLabsModalOpen}
          onClose={() => setIsMaleLabsModalOpen(false)}
        />
      )}
    </motion.div>
  );
};

export default Dashboard;
