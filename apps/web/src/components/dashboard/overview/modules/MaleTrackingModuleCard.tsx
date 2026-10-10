import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Activity, BatteryCharging, FileText, ArrowRight } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';

interface MaleTrackingModuleCardProps {
  sleepHours?: number;
  energyLevel?: string;
  adamScore?: number | null;
  hasHormoneLabs?: boolean;
  loading?: boolean;
  onOpenVitality: () => void;
  onAddLabs: () => void;
  updatedAt?: string | null;
}

export const MaleTrackingModuleCard: React.FC<MaleTrackingModuleCardProps> = ({
  sleepHours,
  energyLevel,
  adamScore,
  hasHormoneLabs = false,
  loading = false,
  onOpenVitality,
  onAddLabs,
  updatedAt = '10 mins ago',
}) => {
  const { t } = useTranslation(['dashboard', 'common', 'lifestyle']);
  const hasAnyData = Boolean(sleepHours || energyLevel || (adamScore !== null && adamScore !== undefined) || hasHormoneLabs);

  const menuItems = [
    {
      label: t('dashboard:vitalityAdamLog', { defaultValue: 'Open Vitality Tracking' }),
      onClick: onOpenVitality,
      icon: Activity,
    },
    {
      label: t('dashboard:updateScreeningCTA', { defaultValue: 'Add Hormone Labs' }),
      onClick: onAddLabs,
      icon: FileText,
    },
  ];

  if (!hasAnyData) {
    return (
      <DashboardModuleCard
        title={t('dashboard:vitalityAdamLog', { defaultValue: 'Male Health Tracking' })}
        subtitle={t('dashboard:vitalitySubtitle', { defaultValue: 'Hormonal balance & daily vitality rhythm' })}
        icon={Activity}
        accentColor="blue"
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title={t('dashboard:maleVitalityCard.title', { defaultValue: 'No vitality check-in yet' })}
          description={t('dashboard:maleVitalityCard.testosteroneStatus', {
            defaultValue: 'Log your sleep recovery and daily vitality symptoms to track your natural diurnal endocrine rhythm.',
          })}
          actionLabel={t('dashboard:updateVitalityLog', { defaultValue: 'Start Daily Check-in' })}
          onAction={onOpenVitality}
          icon={Activity}
          accentColor="blue"
        />
      </DashboardModuleCard>
    );
  }

  const formattedEnergy = (energyLevel || 'moderate').replace(/_/g, ' ');
  const formattedSleep = sleepHours ? `${sleepHours}h` : 'Logged';

  return (
    <DashboardModuleCard
      title={t('dashboard:vitalityAdamLog', { defaultValue: 'Male Health Tracking' })}
      subtitle={t('dashboard:vitalitySubtitle', { defaultValue: 'Hormonal balance & daily vitality rhythm' })}
      icon={Activity}
      accentColor="blue"
      isLive={true}
      syncedModule={t('dashboard:vitalityAdamLog', { defaultValue: 'Male Health Tracking' })}
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="space-y-3.5 py-1">
        {/* Diurnal Rhythm Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD]/60">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#0284C7] shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-800">
              {t('dashboard:maleVitalityCard.testosteroneStatus', { defaultValue: 'Diurnal Endocrine Window' })}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#0284C7] bg-white px-2 py-0.5 rounded-full border border-[#BAE6FD]">
            7:00 AM – 10:00 AM Peak
          </span>
        </div>

        {/* 2 Key Stat Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              {t('dashboard:maleVitalityCard.energyLevel', { defaultValue: 'Stamina & Energy' })}
            </span>
            <span className="text-sm font-bold text-slate-900 capitalize mt-0.5 block truncate">
              {formattedEnergy}
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-1 block">
              {adamScore !== null && adamScore !== undefined
                ? `${t('dashboard:maleVitalityCard.adamScore', { defaultValue: 'ADAM Score' })}: ${adamScore}/10`
                : t('dashboard:maleVitalityCard.adamStatus', { defaultValue: 'Vitality Check Active' })}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              {t('dashboard:lifestyleCard.sleepLogged', { defaultValue: 'Night Recovery' })}
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
              {formattedSleep}
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-1 block">
              {hasHormoneLabs
                ? t('dashboard:screeningComplete', { defaultValue: 'Hormone panel verified' })
                : t('dashboard:verificationNeeded', { defaultValue: 'Testosterone draw pending' })}
            </span>
          </div>
        </div>

        {/* Clinical Tip with Action */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
            <BatteryCharging className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
            <span className="truncate">{t('dashboard:lifestyleCard.movementGoal', { defaultValue: 'Peak synthesis during deep sleep' })}</span>
          </div>

          <button
            type="button"
            onClick={hasHormoneLabs ? onOpenVitality : onAddLabs}
            className="text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] cursor-pointer inline-flex items-center gap-1 shrink-0 ml-2"
          >
            <span>{hasHormoneLabs ? t('common:viewDetails', { defaultValue: 'View Details' }) : t('dashboard:updateScreeningCTA', { defaultValue: 'Add Labs' })}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
