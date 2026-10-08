import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pill, Bell, ArrowRight, PlusCircle } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';
import type { MedicationItem, TodayMedicationProgress } from '../../../../types/medication';

interface MedicationModuleCardProps {
  medications: MedicationItem[];
  todayProgress: TodayMedicationProgress;
  pathway?: 'female' | 'male';
  loading?: boolean;
  onOpenMedications: () => void;
  onAddMedication: () => void;
  updatedAt?: string | null;
}

export const MedicationModuleCard: React.FC<MedicationModuleCardProps> = ({
  medications,
  todayProgress,
  pathway = 'female',
  loading = false,
  onOpenMedications,
  onAddMedication,
  updatedAt = '12 mins ago',
}) => {
  const { t } = useTranslation(['dashboard', 'medications', 'common']);
  const isFemale = pathway === 'female';

  const menuItems = [
    {
      label: t('dashboard:manageMeds', { defaultValue: 'View All Medications' }),
      onClick: onOpenMedications,
      icon: Pill,
    },
    {
      label: t('dashboard:addMedicationCTA', { defaultValue: 'Add Medication' }),
      onClick: onAddMedication,
      icon: PlusCircle,
    },
  ];

  const hasMedications = medications && medications.length > 0;

  if (!hasMedications) {
    return (
      <DashboardModuleCard
        title={t('dashboard:supplementsRx', { defaultValue: 'Medication Reminders' })}
        subtitle={t('dashboard:medicationsSubtitle', { defaultValue: 'Your medications for today' })}
        icon={Pill}
        accentColor={isFemale ? 'pink' : 'blue'}
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title={t('dashboard:noMedsScheduled', { defaultValue: 'No medications added' })}
          description={t('dashboard:noMedsDesc', {
            defaultValue: 'Add your prescribed medications or daily wellness supplements to receive structured dosage reminders.',
          })}
          actionLabel={t('dashboard:addMedicationCTA', { defaultValue: 'Add Medication' })}
          onAction={onAddMedication}
          icon={Pill}
          accentColor={isFemale ? 'pink' : 'blue'}
        />
      </DashboardModuleCard>
    );
  }

  // Find next upcoming or first pending scheduled dose
  const doses = todayProgress?.doses || [];
  const nextDose = doses.find((d) => d.status === 'pending') || doses[0];

  return (
    <DashboardModuleCard
      title={t('dashboard:supplementsRx', { defaultValue: 'Medication Reminders' })}
      subtitle={t('dashboard:medicationsSubtitle', { defaultValue: 'Your medications for today' })}
      icon={Pill}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      syncedModule={t('dashboard:supplementsRx', { defaultValue: 'Medications' })}
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="space-y-3.5 py-1">
        {nextDose ? (
          <div className="p-3 rounded-2xl bg-[#FFF8FA] border border-[#FDE6EF] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#FDE6EF] text-[#E11D48] flex items-center justify-center shrink-0">
                  <Pill className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                    {nextDose.medicationName} {nextDose.dose}
                    {nextDose.unit ? ` ${nextDose.unit}` : ''}
                  </h4>
                  {nextDose.notes && (
                    <p className="text-[10.5px] text-slate-500 font-sans truncate">
                      {nextDose.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-[#FDE6EF] text-[#E11D48] border border-[#F43F7D]/20">
                  {nextDose.timeDisplay || nextDose.scheduledTime}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${
                    nextDose.status === 'taken'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {nextDose.status === 'taken'
                    ? t('medications:statusTaken', { defaultValue: '✓ Taken' })
                    : t('medications:statusUpcoming', { defaultValue: '○ Upcoming' })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            {t('medications:noRemainingDoses', { defaultValue: 'No remaining doses scheduled for today' })}
          </div>
        )}

        {/* Reminders count & View All CTA */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Bell className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="font-medium">
              {todayProgress?.totalScheduled || medications.length} {t('medications:scheduledDoses', { defaultValue: 'scheduled doses' })}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenMedications}
            className={`text-xs font-semibold cursor-pointer inline-flex items-center gap-1 ${
              isFemale
                ? 'text-[#F43F7D] hover:text-[#E11D48]'
                : 'text-[#0284C7] hover:text-[#0369A1]'
            }`}
          >
            <span>{t('dashboard:manageMeds', { defaultValue: 'View All Medications' })}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
