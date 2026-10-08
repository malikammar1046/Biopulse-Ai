import React from 'react';
import { useTranslation } from 'react-i18next';
import { Droplet, Plus, Minus, ArrowRight } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import type { WaterLogEntry } from '../../../../types/diet';

interface WaterModuleCardProps {
  waterLog: WaterLogEntry;
  loading?: boolean;
  onIncrement: () => Promise<void>;
  onDecrement?: () => Promise<void>;
  onOpenWaterLog: () => void;
  updatedAt?: string | null;
}

export const WaterModuleCard: React.FC<WaterModuleCardProps> = ({
  waterLog,
  loading = false,
  onIncrement,
  onDecrement,
  onOpenWaterLog,
  updatedAt = '20 mins ago',
}) => {
  const { t } = useTranslation(['dashboard', 'lifestyle', 'common']);
  const glasses = waterLog?.glasses || 0;
  const targetGlasses = waterLog?.targetGlasses || 8;

  // 1 glass = 250ml = 0.25L
  const currentLiters = (glasses * 0.25).toFixed(1);
  const targetLiters = (targetGlasses * 0.25).toFixed(1);

  const percent = Math.min(100, Math.round((glasses / Math.max(1, targetGlasses)) * 100));

  const menuItems = [
    {
      label: t('lifestyle:waterLog', { defaultValue: 'Open Water Log' }),
      onClick: onOpenWaterLog,
      icon: Droplet,
    },
    {
      label: t('dashboard:logWater', { defaultValue: 'Add 1 Glass (250ml)' }),
      onClick: () => {
        onIncrement();
      },
      icon: Plus,
    },
  ];

  return (
    <DashboardModuleCard
      title={t('dashboard:hydrationTracker', { defaultValue: 'Water Log' })}
      subtitle={t('dashboard:hydrationSubtitle', { defaultValue: "Today's hydration" })}
      icon={Droplet}
      accentColor="blue"
      isLive={glasses > 0}
      syncedModule={t('dashboard:hydrationTracker', { defaultValue: 'Water Log' })}
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="space-y-4 py-1">
        {/* Glass Icons & Volume Display */}
        <div className="flex items-center justify-between gap-3">
          {/* Glass Row (8 visual indicators) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: 8 }).map((_, index) => {
              const isFilled = index < glasses;
              return (
                <div
                  key={index}
                  className={`w-5 h-7 rounded-t-sm rounded-b-md border transition-all duration-300 relative flex items-end justify-center overflow-hidden ${
                    isFilled
                      ? 'border-[#0284C7] bg-[#E0F2FE]'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                  title={`Glass ${index + 1}`}
                >
                  {isFilled && (
                    <div className="w-full h-full bg-[#0284C7]/80 rounded-b-xs" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Volume Number */}
          <div className="text-right shrink-0">
            <span className="text-2xl font-bold font-display text-slate-900 leading-none block">
              {currentLiters} L
            </span>
            <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
              / {targetLiters} L
            </span>
          </div>
        </div>

        {/* Progress Bar & Quick Log Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-500 font-mono text-[11px]">
              {glasses} / {targetGlasses} {t('dashboard:biometricsCard.glasses', { defaultValue: 'glasses' })}
            </span>
            <span className="font-bold text-[#0284C7] font-mono text-xs">
              {percent}%
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#0284C7] rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Quick Increment Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onIncrement()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('dashboard:logWater', { defaultValue: 'Add Glass' })}</span>
            </button>

            {onDecrement && glasses > 0 && (
              <button
                type="button"
                onClick={() => onDecrement()}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Remove 1 glass"
                aria-label="Remove 1 glass"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenWaterLog}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>{t('common:details', { defaultValue: 'Details' })}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
