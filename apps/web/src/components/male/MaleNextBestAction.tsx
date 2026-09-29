import React from 'react';
import {
  ArrowRight,
  File06,
  CheckCircle,
  ClipboardCheck,
} from '@untitledui/icons';
import { MaleCard, MalePrimaryButton } from './MaleDesignPrimitives';

interface MaleNextBestActionProps {
  hasAssessment: boolean;
  assessmentLevel?: string;
  unverifiedReportsCount?: number;
  onAction: () => void;
  actionType?: 'start_t1' | 'add_labs' | 'verify_reports' | 'review_assessment';
}

export const MaleNextBestAction: React.FC<MaleNextBestActionProps> = ({
  hasAssessment,
  assessmentLevel = 'tier_1',
  unverifiedReportsCount = 0,
  onAction,
}) => {
  // Determine the SINGLE most impactful next step (Apple Principle: "What should I do next?")
  const getActionContent = () => {
    if (!hasAssessment) {
      return {
        badge: 'Priority Step',
        title: 'Complete Your Male Screening',
        description: 'Establish your baseline hypogonadism risk profile by completing your symptoms and ADAM intake.',
        buttonText: 'Start Screening',
        icon: ClipboardCheck,
      };
    }

    if (unverifiedReportsCount > 0) {
      return {
        badge: 'Verification Needed',
        title: `Verify ${unverifiedReportsCount} Lab Result${unverifiedReportsCount > 1 ? 's' : ''}`,
        description: 'New clinical values extracted from your report are waiting for your confirmation.',
        buttonText: 'Review Verified Labs',
        icon: File06,
      };
    }

    if (assessmentLevel === 'tier_1') {
      return {
        badge: 'Refine Screening',
        title: 'Add Clinical Laboratory Values',
        description: 'Incorporate morning fasting total testosterone, SHBG, and metabolic blood tests to refine your screening score.',
        buttonText: 'Add Hormone Labs',
        icon: File06,
      };
    }

    return {
      badge: 'Screening Complete',
      title: 'Review Longitudinal Health Progress',
      description: 'Your biomarker-enhanced assessment is active. Track vitality changes over time and prepare for clinical discussion.',
      buttonText: 'Review Assessment',
      icon: CheckCircle,
    };
  };

  const action = getActionContent();
  const Icon = action.icon;

  return (
    <MaleCard className="space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#0868B9] shrink-0" aria-hidden="true" />
          <h3 className="text-sm sm:text-base font-semibold text-[#111318]">
            Recommended Next Step
          </h3>
        </div>

        <span className="text-[11px] font-semibold text-[#0868B9] px-2 py-0.5 rounded-full bg-[#DDEFFD]">
          {action.badge}
        </span>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm sm:text-base font-semibold text-[#111318]">
          {action.title}
        </h4>
        <p className="text-xs text-[#667085] leading-relaxed">
          {action.description}
        </p>
      </div>

      <div className="pt-4">
        <MalePrimaryButton onClick={onAction}>
          <span>{action.buttonText}</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </MalePrimaryButton>
      </div>
    </MaleCard>
  );
};

export default MaleNextBestAction;
