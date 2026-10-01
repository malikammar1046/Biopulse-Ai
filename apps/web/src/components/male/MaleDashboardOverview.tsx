import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { InfoCircle } from '@untitledui/icons';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import {
  MaleCard,
  APPLE_SPRINGS,
} from './MaleDesignPrimitives';
import { MaleScreeningCard } from './MaleScreeningCard';
import { MaleTopFactors } from './MaleTopFactors';
import { MaleNextBestAction } from './MaleNextBestAction';
import { MaleRecentActivity } from './MaleRecentActivity';
import { MaleClinicalLabsModal } from '../adaptive/MaleClinicalLabsModal';
import { RecommendedCareCard } from '../dashboard/RecommendedCareCard';

import { getAuthoritativeAssessmentForPathway } from '../../utils/authoritativeAssessmentSelector';
import { logDashboardRenderTrace } from '../../utils/probabilityTrace';

export const MaleDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    activeAssessment,
    assessmentLoading,
    reports,
    upcomingAppointment,
    refreshActiveAssessment,
    submitMaleTier1,
  } = useUserHealth();

  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);

  // 2. Authoritative Assessment State strictly bound to male_hypogonadism
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
    threshold,
    inputHash,
    source: displaySource,
    hormonePatternInterpretation,
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

  // Next upcoming scheduled appointment
  const nextAppointment = upcomingAppointment;

  // Latest lab report
  const latestReport = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    return reports[0];
  }, [reports]);

  const loading = assessmentLoading;
  const isOnboarded = Boolean(userProfile?.isOnboarded);

  const screeningState: 'not_started' | 'processing' | 'ready' | 'error' = useMemo(() => {
    if (hasAssessment && probabilityPercent !== null) {
      return 'ready';
    }
    if (loading) {
      return 'processing';
    }
    if (isOnboarded) {
      return 'error';
    }
    return 'not_started';
  }, [hasAssessment, probabilityPercent, loading, isOnboarded]);

  const handleRetryScreening = async () => {
    await submitMaleTier1();
  };

  // Primary action handler
  const handlePrimaryAction = async () => {
    if (!hasAssessment) {
      navigate(ROUTES.APP.ASSESSMENT);
    } else if (unverifiedReportsCount > 0) {
      navigate(ROUTES.APP.REPORTS);
    } else if (assessmentLevel === 'tier_1') {
      setIsLabsModalOpen(true);
    } else {
      navigate(ROUTES.APP.ASSESSMENT);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={APPLE_SPRINGS.instant}
      className="max-w-6xl mx-auto space-y-6 sm:space-y-7 pb-16 text-left select-none"
    >
      {/* ── Primary 2-Column Clinical Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-stretch">
        {/* Left Column (7 cols): Primary Screening Card */}
        <div className="lg:col-span-7 flex flex-col">
          <MaleScreeningCard
            hasAssessment={hasAssessment}
            probabilityPercent={probabilityPercent}
            riskCategory={riskCategory}
            riskLabel={riskLabel}
            assessmentLevel={assessmentLevel}
            updatedAt={lastAssessmentDateFormatted}
            threshold={threshold}
            onStartScreening={() => navigate(ROUTES.APP.ASSESSMENT)}
            onViewAssessment={() => navigate(ROUTES.APP.ASSESSMENT)}
            onAddLabs={() => setIsLabsModalOpen(true)}
            onRetry={handleRetryScreening}
            loading={loading}
            isOnboarded={isOnboarded}
            screeningState={screeningState}
            hormonePatternInterpretation={hormonePatternInterpretation}
          />
        </div>

        {/* Right Column (5 cols): Single Next Best Action + Top Factors */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 sm:gap-5 lg:gap-6">
          <MaleNextBestAction
            hasAssessment={hasAssessment}
            assessmentLevel={assessmentLevel}
            unverifiedReportsCount={unverifiedReportsCount}
            onAction={handlePrimaryAction}
          />

          <MaleTopFactors
            explanations={authoritativeAssessment?.explanations}
            onViewExplanation={() => navigate(ROUTES.APP.ASSESSMENT)}
          />
        </div>
      </div>

      {/* ── 3. Contextual Recommended Specialists ────────────────────────── */}
      <RecommendedCareCard pathway="male" />

      {/* ── 4. Recent Clinical Activity (Latest Report & Appointment) ───────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] px-1">
          Recent Health Records
        </h3>
        <MaleRecentActivity
          latestReport={latestReport}
          upcomingAppointment={nextAppointment}
        />
      </div>

      {/* ── 4. Subtle Contextual Guidance (Apple Deference) ────────────────── */}
      {hasAssessment && assessmentLevel === 'tier_1' && (
        <MaleCard className="p-4 sm:p-4.5 bg-[#DDEFFD]/30 border-[#DDEFFD] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#DDEFFD] flex items-center justify-center text-[#0868B9] shrink-0">
              <InfoCircle className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              <strong className="font-semibold text-[#0868B9]">Clinical Tip:</strong> Adding morning total testosterone (fasting draw between 7:00 AM – 10:00 AM) and hormone lab values can refine your statistical estimate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLabsModalOpen(true)}
            className="text-xs font-semibold text-[#0868B9] hover:text-[#07589D] cursor-pointer shrink-0"
          >
            Add Hormone Labs →
          </button>
        </MaleCard>
      )}

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
