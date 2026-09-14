import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import type { UserProfile, HealthPathway } from '../../types/onboarding';
import { ROUTES } from '../../constants/routes';

interface CleanDashboardHeaderProps {
  userProfile: UserProfile;
  pathway: HealthPathway;
  lastAssessmentDate?: string | null;
  profileCompletionPercentage?: number;
}

export const CleanDashboardHeader: React.FC<CleanDashboardHeaderProps> = ({
  userProfile,
  pathway,
  lastAssessmentDate,
  profileCompletionPercentage = 100,
}) => {
  // Time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userProfile.fullName?.trim().split(' ')[0] || 'there';

  const isMale = pathway === 'male';
  const pathwayLabel = isMale ? 'Hypogonadism Screening' : 'PCOS Screening';

  // Only show profile completeness if there's meaningful missing information (< 85%)
  const showIncompleteProfile = profileCompletionPercentage < 85;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] select-none text-left">
      {/* Left: Welcoming Title & Overview Subtitle */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] font-medium">
          Here is your latest health overview and screening status.
        </p>
      </div>

      {/* Right: Pathway Indicator, Assessment Date & Conditional Profile Link */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-semibold text-[#0288D1]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0288D1]" />
          <span>{pathwayLabel}</span>
        </div>

        {lastAssessmentDate && (
          <span className="text-xs font-medium text-[#64748B] hidden md:inline-block">
            Updated {lastAssessmentDate}
          </span>
        )}

        {showIncompleteProfile && (
          <Link
            to={ROUTES.APP.SETTINGS}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-800 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Profile incomplete ({profileCompletionPercentage}%)</span>
            <ArrowRight className="w-3 h-3 text-amber-600" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default CleanDashboardHeader;
