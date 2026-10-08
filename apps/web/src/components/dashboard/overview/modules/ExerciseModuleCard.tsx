import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Flame, MapPin, Footprints, PlusCircle } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';
import type { FitnessLogEntry } from '../../../../types/fitness';

interface ExerciseModuleCardProps {
  todayActivities: FitnessLogEntry[];
  todayMinutes: number;
  pathway?: 'female' | 'male';
  loading?: boolean;
  onOpenFitness: () => void;
  onLogActivity: () => void;
  updatedAt?: string | null;
}

export const ExerciseModuleCard: React.FC<ExerciseModuleCardProps> = ({
  todayActivities,
  todayMinutes,
  pathway = 'female',
  loading = false,
  onOpenFitness,
  onLogActivity,
  updatedAt = '1 hr ago',
}) => {
  const { t } = useTranslation(['dashboard', 'lifestyle', 'common']);
  const isFemale = pathway === 'female';

  const menuItems = [
    {
      label: t('dashboard:dailyActivity', { defaultValue: 'Open Fitness Tracking' }),
      onClick: onOpenFitness,
      icon: Activity,
    },
    {
      label: t('dashboard:addMovement', { defaultValue: 'Log Activity' }),
      onClick: onLogActivity,
      icon: PlusCircle,
    },
  ];

  const hasActivity = todayActivities && todayActivities.length > 0;

  // Approximate realistic calories burned: ~5-7 kcal/min moderate activity
  const estimatedCaloriesBurned = useMemo(() => {
    return Math.round(todayMinutes * 6);
  }, [todayMinutes]);

  const targetMinutes = 45;
  const minutesPercent = Math.min(100, Math.round((todayMinutes / targetMinutes) * 100));

  if (!hasActivity) {
    return (
      <DashboardModuleCard
        title={t('dashboard:dailyActivity', { defaultValue: 'Exercise & Movement' })}
        subtitle={t('dashboard:movementSubtitle', { defaultValue: "Today's activity" })}
        icon={Activity}
        accentColor={isFemale ? 'pink' : 'blue'}
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title={t('dashboard:noMovementLogs', { defaultValue: 'No activity logged today' })}
          description={t('dashboard:noMovementDesc', {
            defaultValue: 'Log your gentle walking, strength training, yoga, or workout to maintain active metabolic balance.',
          })}
          actionLabel={t('dashboard:addMovement', { defaultValue: 'Log Activity' })}
          onAction={onLogActivity}
          icon={Activity}
          accentColor={isFemale ? 'pink' : 'blue'}
        />
      </DashboardModuleCard>
    );
  }

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (minutesPercent / 100) * circumference;

  return (
    <DashboardModuleCard
      title={t('dashboard:dailyActivity', { defaultValue: 'Exercise & Movement' })}
      subtitle={t('dashboard:movementSubtitle', { defaultValue: "Today's activity" })}
      icon={Activity}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      syncedModule={t('lifestyle:movementGoal', { defaultValue: 'Fitness / Movement' })}
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
        {/* Donut Progress Dial */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="8"
            />
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke={isFemale ? '#F43F7D' : '#0284C7'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-display text-slate-900 leading-none">
              {todayMinutes}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-1">
              / {targetMinutes} {t('common:minutes', { defaultValue: 'mins' })}
            </span>
          </div>
        </div>

        {/* Activity Details & Metrics */}
        <div className="space-y-2.5 flex-1 min-w-0 w-full">
          {/* Activity Count */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0">
              <Footprints className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {todayActivities.length} {t('lifestyle:sessions', { defaultValue: 'sessions' })}
              </span>
              <span className="text-[10.5px] text-slate-500 font-sans capitalize block leading-tight truncate">
                {todayActivities.map((a) => a.activityName).slice(0, 2).join(', ')}
              </span>
            </div>
          </div>

          {/* Active Duration */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {todayMinutes} {t('common:minutes', { defaultValue: 'min' })} {t('dashboard:movementGoal', { defaultValue: 'movement' })}
              </span>
              <span className="text-[10.5px] text-slate-500 font-sans block leading-tight">
                {t('lifestyle:activeTime', { defaultValue: 'Active time recorded' })}
              </span>
            </div>
          </div>

          {/* Calories Burned */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                ~{estimatedCaloriesBurned} kcal
              </span>
              <span className="text-[10.5px] text-slate-500 font-sans block leading-tight">
                {t('lifestyle:energyOutput', { defaultValue: 'Estimated energy output' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
