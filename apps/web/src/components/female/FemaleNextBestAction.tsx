import React from 'react';
import {
  ArrowRight,
  File06,
  UploadCloud01,
  CheckCircle,
  ClipboardCheck,
} from '@untitledui/icons';
import { FemaleCard, FemalePrimaryButton } from './FemaleDesignPrimitives';

interface FemaleNextBestActionProps {
  hasAssessment: boolean;
  assessmentLevel?: string;
  unverifiedReportsCount?: number;
  onAction: () => void;
  actionType?: 'start_t1' | 'add_labs' | 'upload_ultrasound' | 'verify_reports' | 'review_assessment';
}

export const FemaleNextBestAction: React.FC<FemaleNextBestActionProps> = ({
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
        title: 'Complete Your Initial Screening',
        description: 'Establish your baseline PCOS risk profile by answering lifestyle, symptom, and cycle questions.',
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
        description: 'Incorporate hormonal and metabolic blood tests (such as FSH, LH, AMH, and fasting insulin) to refine your screening score.',
        buttonText: 'Add Clinical Labs',
        icon: File06,
      };
    }

    if (assessmentLevel === 'tier_1_2') {
      return {
        badge: 'Multimodal Screening',
        title: 'Upload Pelvic Ultrasound Scan',
        description: 'Add ultrasound imaging for neural feature analysis of polycystic ovarian morphology.',
        buttonText: 'Upload Ultrasound Scan',
        icon: UploadCloud01,
      };
    }

    return {
      badge: 'Screening Complete',
      title: 'Review Longitudinal Health Progress',
      description: 'Your multimodal assessment is active. Track symptom changes and prepare for clinical discussion.',
      buttonText: 'Review Assessment',
      icon: CheckCircle,
    };
  };

  const action = getActionContent();
  const Icon = action.icon;

  return (
    <FemaleCard className="space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#F43F7D] shrink-0" aria-hidden="true" />
          <h3 className="text-sm sm:text-base font-semibold text-[#111318]">
            Recommended Next Step
          </h3>
        </div>

        <span className="text-[11px] font-semibold text-[#DC326C] px-2 py-0.5 rounded-full bg-[#FDE6EF]">
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
        <FemalePrimaryButton onClick={onAction}>
          <span>{action.buttonText}</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </FemalePrimaryButton>
      </div>
    </FemaleCard>
  );
};
