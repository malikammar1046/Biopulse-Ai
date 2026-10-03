import React from 'react';
import { Target, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';

interface NextBestActionModuleCardProps {
  hasAssessment: boolean;
  assessmentLevel?: string;
  unverifiedReportsCount?: number;
  hasLoggedFoodToday?: boolean;
  hasLoggedWaterToday?: boolean;
  pathway?: 'female' | 'male';
  onAction: (targetRoute: string) => void;
  onOpenAiTwin?: () => void;
}

export const NextBestActionModuleCard: React.FC<NextBestActionModuleCardProps> = ({
  hasAssessment,
  assessmentLevel = 'tier_1',
  unverifiedReportsCount = 0,
  hasLoggedFoodToday = true,
  hasLoggedWaterToday = true,
  pathway = 'female',
  onAction,
  onOpenAiTwin,
}) => {
  const isFemale = pathway === 'female';

  // Derive genuine next action from real patient health state
  const actionContent = (() => {
    if (!hasAssessment) {
      return {
        title: isFemale ? 'Complete Your PCOS Screening' : 'Complete Hypogonadism Screening',
        rationale: isFemale
          ? 'Establish your baseline PCOS risk estimate by answering lifestyle, symptom, and cycle questions.'
          : 'Answer clinical ADAM and lifestyle questions to calculate your baseline hormonal status.',
        buttonLabel: 'Start Screening',
        targetRoute: '/app/assessment',
      };
    }

    if (unverifiedReportsCount > 0) {
      return {
        title: `Verify ${unverifiedReportsCount} Lab Result${unverifiedReportsCount > 1 ? 's' : ''}`,
        rationale: 'New clinical biomarkers extracted from your laboratory report are ready for confirmation.',
        buttonLabel: 'Review Reports',
        targetRoute: '/app/reports',
      };
    }

    if (assessmentLevel === 'tier_1') {
      return {
        title: isFemale ? 'Add Clinical Hormone Labs' : 'Add Morning Testosterone Labs',
        rationale: isFemale
          ? 'Adding fasting blood glucose, LH, and FSH values refines your statistical risk calculation.'
          : 'Fasting morning serum testosterone (7:00 AM – 10:00 AM draw) unlocks refined clinical evaluation.',
        buttonLabel: isFemale ? 'Add Lab Values' : 'Add Hormone Labs',
        targetRoute: '/app/assessment',
      };
    }

    if (!hasLoggedFoodToday) {
      return {
        title: 'Focus on Balanced Meals Today',
        rationale: 'No meal records logged for today yet. Logging meals helps track hormonal and metabolic response.',
        buttonLabel: 'Log Your Meal',
        targetRoute: '/app/nutrition',
      };
    }

    if (!hasLoggedWaterToday) {
      return {
        title: 'Maintain Daily Hydration Baseline',
        rationale: 'Adequate hydration supports hormonal clearance and steady daily metabolic function.',
        buttonLabel: 'Log Water Intake',
        targetRoute: '/app/nutrition',
      };
    }

    return {
      title: 'Review Health Progression',
      rationale: 'Your clinical assessment and lifestyle logs are active. Track your weekly symptom stability.',
      buttonLabel: 'Review Health Hub',
      targetRoute: '/app/master-hub',
    };
  })();

  const menuItems = [
    {
      label: 'View Action Details',
      onClick: () => onAction(actionContent.targetRoute),
      icon: Target,
    },
    ...(onOpenAiTwin
      ? [
          {
            label: 'Ask AI Assistant',
            onClick: onOpenAiTwin,
            icon: HelpCircle,
          },
        ]
      : []),
  ];

  return (
    <DashboardModuleCard
      title="Next Best Action"
      subtitle="Based on your latest data"
      icon={Sparkles}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      badgeType="ai"
      badgeLabel="AI powered"
      syncedModule="BioPulse Intelligence"
      menuItems={menuItems}
    >
      <div
        className={`p-4 rounded-2xl border transition-colors select-none text-left space-y-3 ${
          isFemale
            ? 'bg-[#FFF8FA] border-[#FDE6EF]'
            : 'bg-[#F0F9FF] border-[#BAE6FD]/60'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isFemale
                ? 'bg-[#FDE6EF] text-[#E11D48]'
                : 'bg-[#E0F2FE] text-[#0284C7]'
            }`}
          >
            <Target className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="space-y-1 min-w-0">
            <h4
              className={`text-xs sm:text-[13px] font-bold leading-snug truncate ${
                isFemale ? 'text-[#E11D48]' : 'text-[#0284C7]'
              }`}
            >
              {actionContent.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-600 font-sans leading-relaxed">
              {actionContent.rationale}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          <button
            type="button"
            onClick={() => onAction(actionContent.targetRoute)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer w-full justify-center ${
              isFemale
                ? 'bg-[#F43F7D] hover:bg-[#E11D48]'
                : 'bg-[#0284C7] hover:bg-[#0369A1]'
            }`}
          >
            <span>{actionContent.buttonLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
