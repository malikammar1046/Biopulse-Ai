import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Sparkles, PlusCircle, Flower2 } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';
import type { SymptomRecord, SymptomSummaryStats } from '../../../../types/symptom';

interface SymptomsModuleCardProps {
  symptomRecords: SymptomRecord[];
  symptomStats: SymptomSummaryStats;
  todayStressStats?: { completedSessionsToday: number; totalMinutesToday: number };
  pathway?: 'female' | 'male';
  loading?: boolean;
  onOpenSymptoms: () => void;
  onLogSymptom: () => void;
  onOpenStress?: () => void;
  updatedAt?: string | null;
}

export const SymptomsModuleCard: React.FC<SymptomsModuleCardProps> = ({
  symptomRecords,
  symptomStats,
  todayStressStats,
  pathway = 'female',
  loading = false,
  onOpenSymptoms,
  onLogSymptom,
  onOpenStress,
  updatedAt = '1 hr ago',
}) => {
  const { t } = useTranslation(['dashboard', 'symptoms', 'common']);
  const isFemale = pathway === 'female';

  const menuItems = [
    {
      label: t('symptoms:title', { defaultValue: 'Open Symptom Tracking' }),
      onClick: onOpenSymptoms,
      icon: Heart,
    },
    {
      label: t('dashboard:logSymptomsCTA', { defaultValue: 'Log New Symptom' }),
      onClick: onLogSymptom,
      icon: PlusCircle,
    },
  ];

  const hasAnyRecords = symptomRecords && symptomRecords.length > 0;

  if (!hasAnyRecords) {
    return (
      <DashboardModuleCard
        title={t('dashboard:symptomLogging', { defaultValue: 'Symptom Check-in' })}
        subtitle={t('dashboard:symptomsSubtitle', { defaultValue: "Today's wellness snapshot" })}
        icon={Heart}
        accentColor={isFemale ? 'pink' : 'blue'}
        isLive={Boolean(todayStressStats && todayStressStats.completedSessionsToday > 0)}
        syncedModule={todayStressStats && todayStressStats.completedSessionsToday > 0 ? 'Lifestyle Stress' : undefined}
        updatedAt={updatedAt}
        menuItems={menuItems}
        loading={loading}
      >
        <div className="space-y-3 py-1">
          {todayStressStats && todayStressStats.completedSessionsToday > 0 && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
              isFemale ? 'bg-pink-50/70 border-pink-100 text-slate-800' : 'bg-sky-50/70 border-sky-100 text-slate-800'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isFemale ? 'bg-pink-100 text-[#BE185D]' : 'bg-sky-100 text-[#0284C7]'
                }`}>
                  <Flower2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block leading-tight">
                    Relaxation: {todayStressStats.completedSessionsToday} session{todayStressStats.completedSessionsToday > 1 ? 's' : ''} ({todayStressStats.totalMinutesToday} mins)
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Parasympathetic recovery logged today
                  </span>
                </div>
              </div>
              {onOpenStress && (
                <button
                  type="button"
                  onClick={onOpenStress}
                  className={`text-xs font-bold underline shrink-0 cursor-pointer ${
                    isFemale ? 'text-[#BE185D]' : 'text-[#0284C7]'
                  }`}
                >
                  View
                </button>
              )}
            </div>
          )}

          <DashboardEmptyState
            title={t('dashboard:noSymptomsToday', { defaultValue: 'No symptoms logged today' })}
            description={t('dashboard:noSymptomsDesc', {
              defaultValue: isFemale
                ? 'Check in on pelvic comfort, mood, energy, or skin changes to build your cycle pattern timeline.'
                : 'Check in on morning vitality, stamina, mood, or sleep quality to track hormonal patterns.',
            })}
            actionLabel={t('dashboard:logSymptomsCTA', { defaultValue: 'Log Symptoms' })}
            onAction={onLogSymptom}
            icon={Heart}
            accentColor={isFemale ? 'pink' : 'blue'}
          />
        </div>
      </DashboardModuleCard>
    );
  }

  // Get today's or most recent 4 records
  const recentRecords = symptomRecords.slice(0, 4);

  // Real longitudinal pattern observation (if exists)
  const realPattern = symptomStats.patternObservations && symptomStats.patternObservations.length > 0
    ? symptomStats.patternObservations[0]
    : null;

  return (
    <DashboardModuleCard
      title={t('dashboard:symptomLogging', { defaultValue: 'Symptom Check-in' })}
      subtitle={t('dashboard:symptomsSubtitle', { defaultValue: "Today's wellness snapshot" })}
      icon={Heart}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      syncedModule={t('dashboard:symptomLogging', { defaultValue: 'Symptom Tracking' })}
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="space-y-3.5 py-1">
        {/* Symptom Chips (4-grid) */}
        <div className="grid grid-cols-2 gap-2">
          {recentRecords.map((record) => {
            const severityColor =
              record.severity === 'severe'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : record.severity === 'moderate'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div
                key={record.id}
                className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-1.5"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-800 capitalize truncate block">
                    {record.symptomType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block capitalize">
                    {record.category?.replace(/_/g, ' ')}
                  </span>
                </div>

                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 capitalize ${severityColor}`}>
                  {record.severity}
                </span>
              </div>
            );
          })}
        </div>

        {/* Relaxation & Stress Badge if completed today */}
        {todayStressStats && todayStressStats.completedSessionsToday > 0 && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
            isFemale ? 'bg-pink-50/60 border-pink-100 text-slate-800' : 'bg-sky-50/60 border-sky-100 text-slate-800'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Flower2 className={`w-4 h-4 shrink-0 ${isFemale ? 'text-[#BE185D]' : 'text-[#0284C7]'}`} />
              <span className="text-xs font-semibold truncate">
                Relaxation: {todayStressStats.completedSessionsToday} session{todayStressStats.completedSessionsToday > 1 ? 's' : ''} ({todayStressStats.totalMinutesToday}m) logged today
              </span>
            </div>
            {onOpenStress && (
              <button
                type="button"
                onClick={onOpenStress}
                className={`text-[11px] font-bold underline shrink-0 cursor-pointer ${
                  isFemale ? 'text-[#BE185D]' : 'text-[#0284C7]'
                }`}
              >
                View
              </button>
            )}
          </div>
        )}

        {/* Real Longitudinal Observation or Summary (only if real calculation exists) */}
        {realPattern ? (
          <div className="p-2.5 rounded-xl bg-[#FFF8FA] border border-[#FDE6EF] flex items-center gap-2 text-left">
            <Sparkles className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
            <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
              <strong className="text-slate-800 font-semibold">{realPattern.title}:</strong>{' '}
              {realPattern.description}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
            <span>
              {symptomStats.totalLoggedCount} {t('symptoms:checkInsRecorded', { defaultValue: 'total check-ins recorded' })}
            </span>
            <button
              type="button"
              onClick={onLogSymptom}
              className={`font-semibold cursor-pointer ${
                isFemale ? 'text-[#F43F7D] hover:text-[#E11D48]' : 'text-[#0284C7] hover:text-[#0369A1]'
              }`}
            >
              {t('common:logMore', { defaultValue: 'Log More' })}
            </button>
          </div>
        )}
      </div>
    </DashboardModuleCard>
  );
};
