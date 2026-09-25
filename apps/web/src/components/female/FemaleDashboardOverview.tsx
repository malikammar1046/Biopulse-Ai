import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { InfoCircle } from '@untitledui/icons';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import {
  FemalePageHeader,
  FemaleStatusBadge,
  FemaleCard,
  APPLE_SPRINGS,
} from './FemaleDesignPrimitives';
import { FemaleScreeningCard } from './FemaleScreeningCard';
import { FemaleTopFactors } from './FemaleTopFactors';
import { FemaleNextBestAction } from './FemaleNextBestAction';
import { FemaleRecentActivity } from './FemaleRecentActivity';
import { CareCircleCard } from '../dashboard/CareCircleCard';

export const FemaleDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    activeAssessment,
    mlAssessment,
    assessmentLoading,
    mlAssessmentLoading,
    reports,
    appointments,
  } = useUserHealth();

  // 1. Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = userProfile?.fullName?.split(' ')[0] || 'there';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [userProfile]);

  // 2. Authoritative Assessment State
  const hasAssessment = Boolean(
    (activeAssessment && activeAssessment.has_assessment !== false) ||
    (mlAssessment && mlAssessment.risk_category && mlAssessment.risk_category !== 'insufficient_data')
  );

  const probabilityPercent = useMemo(() => {
    if (!hasAssessment) return null;
    if (activeAssessment?.probability_percent !== undefined && activeAssessment.probability_percent !== null) {
      return Math.round(activeAssessment.probability_percent);
    }
    if (activeAssessment?.probability !== undefined && activeAssessment.probability !== null) {
      return Math.round(activeAssessment.probability * 100);
    }
    if (mlAssessment?.pcos_probability !== undefined && mlAssessment.pcos_probability !== null) {
      return Math.round(mlAssessment.pcos_probability * 100);
    }
    return null;
  }, [hasAssessment, activeAssessment, mlAssessment]);

  const riskCategory = activeAssessment?.risk_category || mlAssessment?.risk_category || 'lower';
  const riskLabel = activeAssessment?.risk_label || mlAssessment?.risk_pattern_description;
  const assessmentLevel = activeAssessment?.assessment_level || (activeAssessment?.pcom_status ? 'tier_1_3' : 'tier_1');

  const lastAssessmentDateFormatted = useMemo(() => {
    const rawDate = activeAssessment?.created_at;
    if (!rawDate) return null;
    return new Date(rawDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [activeAssessment?.created_at]);

  const threshold = activeAssessment?.threshold ?? mlAssessment?.screening_threshold ?? 0.38;

  // Unverified reports count
  const unverifiedReportsCount = useMemo(() => {
    return (reports || [])
      .filter((r) => r.status === 'needs_verification')
      .reduce((sum, r) => sum + (r.results?.filter((res) => !res.userVerified)?.length || 0), 0);
  }, [reports]);

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

  const loading = assessmentLoading || mlAssessmentLoading;

  // Contextual status badge
  const headerBadge = useMemo(() => {
    if (!hasAssessment) {
      return <FemaleStatusBadge variant="neutral">Screening Not Started</FemaleStatusBadge>;
    }
    if (assessmentLevel === 'tier_1_2_3') {
      return <FemaleStatusBadge variant="pink">Tier 3 Multimodal</FemaleStatusBadge>;
    }
    if (assessmentLevel === 'tier_1_2') {
      return <FemaleStatusBadge variant="pink">Tier 2 Clinical Labs</FemaleStatusBadge>;
    }
    return <FemaleStatusBadge variant="pink">Tier 1 Initial</FemaleStatusBadge>;
  }, [hasAssessment, assessmentLevel]);

  // Primary action handler
  const handlePrimaryAction = async () => {
    if (!hasAssessment) {
      navigate(ROUTES.APP.ASSESSMENT);
    } else if (unverifiedReportsCount > 0) {
      navigate(ROUTES.APP.REPORTS);
    } else if (assessmentLevel === 'tier_1') {
      navigate(ROUTES.APP.ASSESSMENT);
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
      {/* ── 1. Apple-Style Page Header ──────────────────────────────────────── */}
      <FemalePageHeader
        title={greeting}
        subtitle="Here’s your reproductive health and PCOS screening overview."
        badge={headerBadge}
      />

      {/* ── 2. Primary 2-Column Clinical Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left Column (7 cols): Primary Screening Card */}
        <div className="lg:col-span-7 flex flex-col">
          <FemaleScreeningCard
            hasAssessment={hasAssessment}
            probabilityPercent={probabilityPercent}
            riskCategory={riskCategory}
            riskLabel={riskLabel}
            assessmentLevel={assessmentLevel}
            updatedAt={lastAssessmentDateFormatted}
            threshold={threshold}
            onStartScreening={() => navigate(ROUTES.APP.ASSESSMENT)}
            onViewAssessment={() => navigate(ROUTES.APP.ASSESSMENT)}
            onAddLabs={() => navigate(ROUTES.APP.ASSESSMENT)}
            loading={loading}
            gradcamB64={activeAssessment?.gradcam_b64}
            pcomStatus={activeAssessment?.pcom_status}
          />
        </div>

        {/* Right Column (5 cols): Single Next Best Action + Top Factors */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5 sm:space-y-6">
          <FemaleNextBestAction
            hasAssessment={hasAssessment}
            assessmentLevel={assessmentLevel}
            unverifiedReportsCount={unverifiedReportsCount}
            onAction={handlePrimaryAction}
          />

          <FemaleTopFactors
            explanations={activeAssessment?.explanations || mlAssessment?.explanations}
            onViewExplanation={() => navigate(ROUTES.APP.ASSESSMENT)}
          />
        </div>
      </div>

      {/* ── 3. Recent Clinical Activity (Latest Report & Appointment) ───────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] px-1">
          Recent Health Records
        </h3>
        <FemaleRecentActivity
          latestReport={latestReport}
          upcomingAppointment={nextAppointment}
        />
      </div>

      {/* ── 4. My Care Circle & Collaborative Support ───────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
            Care Circle &amp; Consent Management
          </h3>
          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.CARE_CIRCLE)}
            className="text-xs font-semibold text-[#F43F7D] hover:text-[#DC326C] transition-colors cursor-pointer"
          >
            Manage Care Circle →
          </button>
        </div>
        <CareCircleCard
          pathway="female"
          onPrepareAppointment={() => navigate(ROUTES.APP.CARE_CIRCLE)}
        />
      </div>

      {/* ── 4. Subtle Contextual Guidance (Apple Deference) ────────────────── */}
      {hasAssessment && assessmentLevel === 'tier_1' && (
        <FemaleCard className="p-4 sm:p-4.5 bg-[#FDE6EF]/30 border-[#FDE6EF] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#FDE6EF] flex items-center justify-center text-[#F43F7D] shrink-0">
              <InfoCircle className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              <strong className="font-semibold text-[#DC326C]">Clinical Tip:</strong> Adding fasting blood sugar and hormone lab values can refine your statistical estimate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.ASSESSMENT)}
            className="text-xs font-semibold text-[#F43F7D] hover:text-[#DC326C] cursor-pointer shrink-0"
          >
            Learn More →
          </button>
        </FemaleCard>
      )}
    </motion.div>
  );
};
