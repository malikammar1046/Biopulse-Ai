import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';

interface ScreeningModuleCardProps {
  pathway: 'female' | 'male';
  hasAssessment: boolean;
  probabilityPercent: number | null;
  riskCategory?: string;
  riskLabel?: string;
  assessmentLevel?: string;
  lastAssessmentDate?: string | null;
  loading?: boolean;
  onStartScreening: () => void;
  onViewAssessment: () => void;
}

export const ScreeningModuleCard: React.FC<ScreeningModuleCardProps> = ({
  pathway,
  hasAssessment,
  probabilityPercent,
  riskCategory = 'lower',
  riskLabel,
  assessmentLevel = 'tier_1',
  lastAssessmentDate,
  loading = false,
  onStartScreening,
  onViewAssessment,
}) => {
  const { t } = useTranslation(['dashboard', 'screening']);
  const isFemale = pathway === 'female';
  const title = isFemale ? t('dashboard:pcosScreeningTitle') : t('dashboard:hypogonadismScreeningTitle');
  const subtitle = t('dashboard:screeningSubtitleText');
  const riskTypeLabel = isFemale ? t('dashboard:pcosRiskType') : t('dashboard:maleRiskType');

  // Authoritative clinical risk classification matching policy v2 cutoffs
  const highCutoff = isFemale ? 25 : 18.08;
  const lowCutoff = isFemale ? 18 : 10;

  let isHigh = false;
  let isIntermediate = false;

  if (probabilityPercent !== null) {
    isHigh = probabilityPercent >= highCutoff;
    isIntermediate = !isHigh && probabilityPercent >= lowCutoff;
  } else {
    const normRisk = (riskCategory || '').toLowerCase();
    isHigh = normRisk.includes('elevated') || normRisk.includes('high');
    isIntermediate = !isHigh && (normRisk.includes('intermediate') || normRisk.includes('moderate'));
  }

  // Consistent with Screening Workspace & Design System tokens
  const riskBadgeColor = isHigh
    ? (isFemale ? 'bg-[#FDE6EF] text-[#DC326C] border-[#F43F7D]/20' : 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]')
    : isIntermediate
    ? 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]'
    : 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]';

  const riskStrokeColor = isHigh
    ? (isFemale ? '#F43F7D' : '#0284C7')
    : isIntermediate
    ? '#F59E0B'
    : '#10B981';

  const riskDisplayName = riskLabel || (isFemale
    ? (isHigh ? t('dashboard:higherLikelihood') : isIntermediate ? t('dashboard:intermediateLikelihood') : t('dashboard:lowerLikelihood'))
    : (isHigh ? t('dashboard:higherScreeningRisk') : isIntermediate ? t('dashboard:intermediateScreeningRisk') : t('dashboard:lowerScreeningRisk')));

  const RiskIcon = isHigh
    ? AlertCircle
    : isIntermediate
    ? AlertTriangle
    : ShieldCheck;

  // Display probability: formats decimal cleanly (e.g. 46.6%) or integer (e.g. 47%)
  const displayScore = probabilityPercent !== null
    ? (Number.isInteger(probabilityPercent) ? `${probabilityPercent}%` : `${probabilityPercent.toFixed(1)}%`)
    : '--%';

  // Friendly clinical summary
  const summaryText = isFemale
    ? isHigh
      ? t('dashboard:femaleHighSummary')
      : isIntermediate
      ? t('dashboard:femaleIntermediateSummary')
      : t('dashboard:femaleLowerSummary')
    : isHigh
    ? t('dashboard:maleHighSummary')
    : isIntermediate
    ? t('dashboard:maleIntermediateSummary')
    : t('dashboard:maleLowerSummary');

  const menuItems = [
    {
      label: t('screening:viewFullAssessmentCTA', 'View Full Assessment'),
      onClick: onViewAssessment,
      icon: FileText,
    },
    {
      label: t('screening:startReassessmentCTA', 'Start Reassessment'),
      onClick: onStartScreening,
      icon: RefreshCw,
    },
  ];

  if (!hasAssessment || probabilityPercent === null) {
    return (
      <DashboardModuleCard
        title={title}
        subtitle={subtitle}
        icon={FileText}
        accentColor={isFemale ? 'pink' : 'blue'}
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title={isFemale ? t('screening:noFemaleScreeningTitle') : t('screening:noMaleScreeningTitle')}
          description={t('screening:screeningEmptyDesc')}
          actionLabel={t('screening:startScreeningCTA')}
          onAction={onStartScreening}
          icon={FileText}
          accentColor={isFemale ? 'pink' : 'blue'}
        />
      </DashboardModuleCard>
    );
  }

  const safePercent = Math.min(100, Math.max(0, probabilityPercent));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  return (
    <DashboardModuleCard
      title={title}
      subtitle={subtitle}
      icon={FileText}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      menuItems={menuItems}
      loading={loading}
      footerContent={
        <div className="w-full flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t('dashboard:lastSynced', 'Last assessed')}:{' '}
              <strong className="text-slate-700 font-medium">
                {lastAssessmentDate || t('screening:recently', 'Recently')}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t('screening:nextRecommended')}:{' '}
              <strong className="text-slate-700 font-medium">{t('screening:in3Months')}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#10B981] font-medium shrink-0 ml-auto sm:ml-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>{t('screening:synced')}</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 py-2">
        {/* Donut Gauge */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="9"
            />
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke={riskStrokeColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-bold font-display text-slate-900 leading-none">
              {displayScore}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
              {riskTypeLabel}
            </span>
          </div>
        </div>

        {/* Risk Badge, Description & Primary Action */}
        <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskBadgeColor}`}
            >
              <RiskIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{riskDisplayName}</span>
            </span>
            {assessmentLevel && (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                {assessmentLevel.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-3">
            {summaryText}
          </p>
          <div className="pt-0.5 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={onViewAssessment}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer ${
                isFemale
                  ? 'bg-[#F43F7D] hover:bg-[#E11D48]'
                  : 'bg-[#0284C7] hover:bg-[#0369A1]'
              }`}
            >
              <span>{t('screening:viewFullAssessmentCTA')}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
