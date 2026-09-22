import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCheck,
  CheckCircle,
  Beaker01,
  File06,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { DashboardAction } from '../../utils/dashboardActions';
import { ROUTES } from '../../constants/routes';

interface NextBestActionCardProps {
  pathway: HealthPathway;
  hasAssessment: boolean;
  assessmentLevel?: string;
  unverifiedReportsCount?: number;
  topAction?: DashboardAction | null;
  onOpenLabsModal?: () => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  hasAssessment,
  assessmentLevel = 'tier_1',
  unverifiedReportsCount = 0,
  onOpenLabsModal,
}) => {
  const navigate = useNavigate();

  // Dynamic derivation of next best clinical action for Male pathway
  const getActionContent = () => {
    // 1. Priority A: Unverified lab reports needing user confirmation
    if (unverifiedReportsCount > 0) {
      return {
        badge: 'Needs Verification',
        title: 'Review & Confirm Lab Reports',
        description: `You have ${unverifiedReportsCount} unconfirmed lab report${
          unverifiedReportsCount === 1 ? '' : 's'
        }. Reviewing and confirming extracted values ensures screening precision.`,
        buttonText: 'Review Reports',
        icon: File06,
        onClick: () => navigate(ROUTES.APP.REPORTS),
      };
    }

    // 2. Priority B: No baseline screening completed
    if (!hasAssessment) {
      return {
        badge: 'Screening Needed',
        title: 'Complete ADAM Questionnaire',
        description:
          'Answer 10 clinically validated ADAM questions to assess symptoms and establish your baseline hypogonadism screening score.',
        buttonText: 'Start Screening',
        icon: ClipboardCheck,
        onClick: () => navigate(ROUTES.APP.ASSESSMENT),
      };
    }

    // 3. Priority C: Tier 1 Complete, Tier 2 Hormone Labs Missing
    if (assessmentLevel === 'tier_1') {
      return {
        badge: 'Add Labs',
        title: 'Add Morning Testosterone Labs',
        description:
          'Upload or record fasting morning total testosterone and LH/FSH values to unlock Tier 2 cumulative assessment.',
        buttonText: 'Add Hormone Labs',
        icon: Beaker01,
        onClick: onOpenLabsModal || (() => navigate(ROUTES.APP.ASSESSMENT)),
      };
    }

    // 4. Default: Tier 2 Active / Complete
    return {
      badge: 'Screening Complete',
      title: 'Review Longitudinal Health Progress',
      description:
        'Your hypogonadism assessment is active and multi-tier calibrated. Monitor biomarker trajectories and prepare for clinical discussion.',
      buttonText: 'Review Assessment',
      icon: CheckCircle,
      onClick: () => navigate(ROUTES.APP.ASSESSMENT),
    };
  };

  const action = getActionContent();
  const Icon = action.icon;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-left transition-all duration-200 space-y-4 select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-medical-primary-hover shrink-0" aria-hidden="true" />
          <h3 className="text-sm sm:text-base font-semibold text-medical-text-primary">
            Recommended Next Step
          </h3>
        </div>

        <span className="text-[11px] font-semibold text-medical-primary-hover px-2 py-0.5 rounded-full bg-medical-primary-muted">
          {action.badge}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h4 className="text-sm sm:text-base font-semibold text-medical-text-primary">
          {action.title}
        </h4>
        <p className="text-xs text-medical-text-muted leading-relaxed">
          {action.description}
        </p>
      </div>

      {/* CTA Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2.5 rounded-xl whitespace-nowrap bg-medical-primary-hover hover:bg-medical-primary-active active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-medical-primary-hover/30"
        >
          <span>{action.buttonText}</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default NextBestActionCard;
