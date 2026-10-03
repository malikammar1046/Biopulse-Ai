import React from 'react';
import { Heart, Sparkles, PlusCircle } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';
import type { SymptomRecord, SymptomSummaryStats } from '../../../../types/symptom';

interface SymptomsModuleCardProps {
  symptomRecords: SymptomRecord[];
  symptomStats: SymptomSummaryStats;
  pathway?: 'female' | 'male';
  loading?: boolean;
  onOpenSymptoms: () => void;
  onLogSymptom: () => void;
  updatedAt?: string | null;
}

export const SymptomsModuleCard: React.FC<SymptomsModuleCardProps> = ({
  symptomRecords,
  symptomStats,
  pathway = 'female',
  loading = false,
  onOpenSymptoms,
  onLogSymptom,
  updatedAt = '1 hr ago',
}) => {
  const isFemale = pathway === 'female';

  const menuItems = [
    {
      label: 'Open Symptom Tracking',
      onClick: onOpenSymptoms,
      icon: Heart,
    },
    {
      label: 'Log New Symptom',
      onClick: onLogSymptom,
      icon: PlusCircle,
    },
  ];

  const hasAnyRecords = symptomRecords && symptomRecords.length > 0;

  if (!hasAnyRecords) {
    return (
      <DashboardModuleCard
        title="Symptom Check-in"
        subtitle="Today's wellness snapshot"
        icon={Heart}
        accentColor={isFemale ? 'pink' : 'blue'}
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title="No symptoms logged today"
          description={
            isFemale
              ? 'Check in on pelvic comfort, mood, energy, or skin changes to build your cycle pattern timeline.'
              : 'Check in on morning vitality, stamina, mood, or sleep quality to track hormonal patterns.'
          }
          actionLabel="Log Symptoms"
          onAction={onLogSymptom}
          icon={Heart}
          accentColor={isFemale ? 'pink' : 'blue'}
        />
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
      title="Symptom Check-in"
      subtitle="Today's wellness snapshot"
      icon={Heart}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      syncedModule="Symptom Tracking"
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
            <span>{symptomStats.totalLoggedCount} total check-in{symptomStats.totalLoggedCount === 1 ? '' : 's'} recorded</span>
            <button
              type="button"
              onClick={onLogSymptom}
              className={`font-semibold cursor-pointer ${
                isFemale ? 'text-[#F43F7D] hover:text-[#E11D48]' : 'text-[#0284C7] hover:text-[#0369A1]'
              }`}
            >
              Log More
            </button>
          </div>
        )}
      </div>
    </DashboardModuleCard>
  );
};
