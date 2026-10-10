import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { ROUTES } from '../../../../constants/routes';

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
  const { t } = useTranslation(['dashboard', 'reports', 'lifestyle', 'common']);
  const isFemale = pathway === 'female';

  // Derive genuine next action from real patient health state
  const actionContent = (() => {
    if (!hasAssessment) {
      return {
        title: t('dashboard:startScreeningTitle', {
          defaultValue: isFemale ? 'Complete Your PCOS Screening' : 'Complete Hypogonadism Screening',
        }),
        rationale: t('dashboard:startScreeningDesc', {
          defaultValue: isFemale
            ? 'Establish your baseline PCOS risk estimate by answering lifestyle, symptom, and cycle questions.'
            : 'Answer clinical ADAM and lifestyle questions to calculate your baseline hormonal status.',
        }),
        buttonLabel: t('dashboard:startTier1CTA', { defaultValue: 'Start Screening' }),
        targetRoute: '/app/assessment',
      };
    }

    if (unverifiedReportsCount > 0) {
      return {
        title: `${t('dashboard:verificationNeeded', { defaultValue: 'Verify' })} (${unverifiedReportsCount})`,
        rationale: t('reports:unverifiedDesc', {
          defaultValue: 'New clinical biomarkers extracted from your laboratory report are ready for confirmation.',
        }),
        buttonLabel: t('reports:reviewReports', { defaultValue: 'Review Reports' }),
        targetRoute: '/app/reports',
      };
    }

    if (assessmentLevel === 'tier_1') {
      return {
        title: t('dashboard:refineScreening', {
          defaultValue: isFemale ? 'Add Clinical Hormone Labs' : 'Add Morning Testosterone Labs',
        }),
        rationale: isFemale
          ? t('dashboard:femaleIntermediateSummary', {
              defaultValue: 'Adding fasting blood glucose, LH, and FSH values refines your statistical risk calculation.',
            })
          : t('dashboard:maleIntermediateSummary', {
              defaultValue: 'Fasting morning serum testosterone (7:00 AM – 10:00 AM draw) unlocks refined clinical evaluation.',
            }),
        buttonLabel: t('dashboard:updateScreeningCTA', {
          defaultValue: isFemale ? 'Add Lab Values' : 'Add Hormone Labs',
        }),
        targetRoute: '/app/assessment',
      };
    }

    if (!hasLoggedFoodToday) {
      return {
        title: t('dashboard:nextBestAction.checkNutrition', { defaultValue: 'Focus on Balanced Meals Today' }),
        rationale: t('dashboard:nextBestAction.checkNutritionDesc', {
          defaultValue: 'No meal records logged for today yet. Logging meals helps track hormonal and metabolic response.',
        }),
        buttonLabel: t('dashboard:logMeal', { defaultValue: 'Log Your Meal' }),
        targetRoute: ROUTES.APP.LIFESTYLE,
      };
    }

    if (!hasLoggedWaterToday) {
      return {
        title: t('dashboard:hydrationTracker', { defaultValue: 'Maintain Daily Hydration Baseline' }),
        rationale: t('dashboard:hydrationSubtitle', {
          defaultValue: 'Adequate hydration supports hormonal clearance and steady daily metabolic function.',
        }),
        buttonLabel: t('dashboard:logWater', { defaultValue: 'Log Water Intake' }),
        targetRoute: ROUTES.APP.LIFESTYLE,
      };
    }

    return {
      title: t('dashboard:screeningComplete', { defaultValue: 'Review Health Progression' }),
      rationale: t('dashboard:longitudinalCard.stablePattern', {
        defaultValue: 'Your clinical assessment and lifestyle logs are active. Track your weekly symptom stability.',
      }),
      buttonLabel: t('dashboard:longitudinalCard.viewFullTrends', { defaultValue: 'Review Health Hub' }),
      targetRoute: '/app/master-hub',
    };
  })();

  const menuItems = [
    {
      label: t('common:viewDetails', { defaultValue: 'View Action Details' }),
      onClick: () => onAction(actionContent.targetRoute),
      icon: Target,
    },
    ...(onOpenAiTwin
      ? [
          {
            label: t('common:askAI', { defaultValue: 'Ask AI Assistant' }),
            onClick: onOpenAiTwin,
            icon: HelpCircle,
          },
        ]
      : []),
  ];

  return (
    <DashboardModuleCard
      title={t('dashboard:nextBestActionTitle', { defaultValue: 'Next Best Action' })}
      subtitle={t('dashboard:nextBestActionSubtitle', { defaultValue: 'Based on your latest data' })}
      icon={Sparkles}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      badgeType="ai"
      badgeLabel={t('common:aiPowered', { defaultValue: 'AI powered' })}
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
