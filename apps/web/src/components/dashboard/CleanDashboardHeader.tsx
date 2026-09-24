import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from '../icons';
import type { UserProfile, HealthPathway } from '../../types/onboarding';
import { ROUTES } from '../../constants/routes';

interface CleanDashboardHeaderProps {
  userProfile: UserProfile;
  pathway: HealthPathway;
  lastAssessmentDate?: string | null;
  profileCompletionPercentage?: number;
  hasAssessment?: boolean;
  assessmentLevel?: string;
}

export const CleanDashboardHeader: React.FC<CleanDashboardHeaderProps> = ({
  userProfile,
  pathway,
  profileCompletionPercentage = 100,
  hasAssessment = false,
  assessmentLevel = 'tier_1',
}) => {
  const isMale = pathway === 'male';

  // 1. Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = userProfile?.fullName?.trim().split(' ')[0] || 'there';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [userProfile]);

  // 2. Contextual status badge (corresponds to Female header badge)
  const headerBadge = useMemo(() => {
    if (!hasAssessment) {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-[#F2F4F7] text-[#344054] border-[#EAECF0]">
          Screening Not Started
        </span>
      );
    }
    if (assessmentLevel === 'tier_1_2') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-medical-primary-muted text-medical-primary-hover border-medical-primary-border">
          Tier 2 Clinical Labs
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-medium rounded-full border px-2.5 py-1 text-xs select-none bg-medical-primary-muted text-medical-primary-hover border-medical-primary-border">
        Tier 1 Initial
      </span>
    );
  }, [hasAssessment, assessmentLevel]);

  // Show profile completeness only if meaningfully incomplete
  const showIncompleteProfile = profileCompletionPercentage < 85;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 text-left select-none">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-semibold text-medical-text-primary tracking-tight">
            {greeting}
          </h1>
          {headerBadge}
        </div>
        <p className="text-xs sm:text-sm text-medical-text-muted leading-relaxed max-w-2xl font-normal">
          {isMale
            ? "Here’s your metabolic and testosterone health screening overview."
            : "Here’s your health screening overview."}
        </p>
      </div>

      {showIncompleteProfile && (
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={ROUTES.APP.SETTINGS}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-800 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Profile incomplete ({profileCompletionPercentage}%)</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default CleanDashboardHeader;
