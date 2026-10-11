import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Utensils, ArrowRight, PlusCircle, BookOpen } from 'lucide-react';
import { DashboardModuleCard } from '../DashboardModuleCard';
import { DashboardEmptyState } from '../DashboardEmptyState';
import type { FoodLogEntry, DailyNutritionTargets } from '../../../../types/diet';

interface NutritionModuleCardProps {
  foodLogs: FoodLogEntry[];
  dailyTargets?: DailyNutritionTargets | null;
  pathway?: 'female' | 'male';
  loading?: boolean;
  onViewMealPlan: () => void;
  onLogMeal: () => void;
  updatedAt?: string | null;
}

export const NutritionModuleCard: React.FC<NutritionModuleCardProps> = ({
  foodLogs,
  dailyTargets,
  pathway = 'female',
  loading = false,
  onViewMealPlan,
  onLogMeal,
  updatedAt = '1 hr ago',
}) => {
  const { t } = useTranslation(['dashboard', 'lifestyle']);
  const isFemale = pathway === 'female';

  const menuItems = [
    {
      label: t('dashboard:viewMealPlan'),
      onClick: onViewMealPlan,
      icon: BookOpen,
    },
    {
      label: t('dashboard:logMeal'),
      onClick: onLogMeal,
      icon: PlusCircle,
    },
  ];

  // Derive today's totals strictly from real foodLogs
  const { totalCalories, totalCarbs, totalProtein, totalFat, hasCarbs, hasProtein, hasFat, hasLogs } = useMemo(() => {
    if (!foodLogs || foodLogs.length === 0) {
      return {
        totalCalories: 0,
        totalCarbs: null,
        totalProtein: null,
        totalFat: null,
        hasCarbs: false,
        hasProtein: false,
        hasFat: false,
        hasLogs: false,
      };
    }

    const getMacro = (f: any, ...keys: string[]): number | null => {
      for (const k of keys) {
        if (f[k] !== undefined && f[k] !== null && f[k] !== '') {
          const val = Number(f[k]);
          if (!isNaN(val)) return val;
        }
      }
      return null;
    };

    let calsSum = 0;
    let carbsSum = 0;
    let proteinSum = 0;
    let fatSum = 0;
    let anyCarbsFound = false;
    let anyProteinFound = false;
    let anyFatFound = false;

    for (const f of foodLogs) {
      const cal = getMacro(f, 'calories', 'energy_kcal', 'energyKcal');
      if (cal !== null) {
        calsSum += cal;
      }

      const carb = getMacro(f, 'carbsG', 'carbs_g', 'carbohydrate_g', 'carbs');
      if (carb !== null) {
        anyCarbsFound = true;
        carbsSum += carb;
      }

      const prot = getMacro(f, 'proteinG', 'protein_g', 'protein');
      if (prot !== null) {
        anyProteinFound = true;
        proteinSum += prot;
      }

      const fat = getMacro(f, 'fatG', 'fat_g', 'fats', 'fat');
      if (fat !== null) {
        anyFatFound = true;
        fatSum += fat;
      }
    }

    return {
      totalCalories: Math.round(calsSum),
      totalCarbs: anyCarbsFound ? Math.round(carbsSum * 10) / 10 : null,
      totalProtein: anyProteinFound ? Math.round(proteinSum * 10) / 10 : null,
      totalFat: anyFatFound ? Math.round(fatSum * 10) / 10 : null,
      hasCarbs: anyCarbsFound,
      hasProtein: anyProteinFound,
      hasFat: anyFatFound,
      hasLogs: true,
    };
  }, [foodLogs]);

  if (!hasLogs) {
    return (
      <DashboardModuleCard
        title={t('dashboard:todaysNutrition')}
        subtitle={t('dashboard:nutritionSubtitle')}
        icon={Utensils}
        accentColor={isFemale ? 'pink' : 'blue'}
        isLive={false}
        menuItems={menuItems}
        loading={loading}
      >
        <DashboardEmptyState
          title={t('dashboard:noFoodLogsToday')}
          description={t('dashboard:noFoodLogsDesc')}
          actionLabel={t('dashboard:logFirstMeal')}
          onAction={onLogMeal}
          icon={Utensils}
          accentColor={isFemale ? 'pink' : 'blue'}
        />
      </DashboardModuleCard>
    );
  }

  // Targets
  const targetCalories = dailyTargets?.calories;
  const targetCarbs = dailyTargets?.carbsG;
  const targetProtein = dailyTargets?.proteinG;
  const targetFat = dailyTargets?.fatG;

  const calPercent = targetCalories && targetCalories > 0
    ? Math.round((totalCalories / targetCalories) * 100)
    : null;

  const carbProgress = hasCarbs && totalCarbs !== null && targetCarbs && targetCarbs > 0
    ? Math.round((totalCarbs / targetCarbs) * 100)
    : null;

  const proteinProgress = hasProtein && totalProtein !== null && targetProtein && targetProtein > 0
    ? Math.round((totalProtein / targetProtein) * 100)
    : null;

  const fatProgress = hasFat && totalFat !== null && targetFat && targetFat > 0
    ? Math.round((totalFat / targetFat) * 100)
    : null;

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, calPercent ?? 0) / 100) * circumference;

  return (
    <DashboardModuleCard
      title={t('dashboard:todaysNutrition')}
      subtitle={t('dashboard:nutritionSubtitle')}
      icon={Utensils}
      accentColor={isFemale ? 'pink' : 'blue'}
      isLive={true}
      syncedModule={t('dashboard:nutritionSynced')}
      updatedAt={updatedAt}
      menuItems={menuItems}
      loading={loading}
    >
      <div className="space-y-3.5 py-1">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Calorie Donut Dial */}
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
              <span className="text-xl font-bold font-display text-slate-900 leading-none">
                {totalCalories.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                {targetCalories ? `of ${targetCalories.toLocaleString()} kcal` : 'kcal logged'}
              </span>
            </div>
          </div>

          {/* Macronutrients Progress Bars */}
          <div className="space-y-2 flex-1 w-full min-w-0">
            {/* Carbs */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-1">
                <span className="font-semibold text-slate-700">{t('dashboard:carbsLabel')}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {hasCarbs && totalCarbs !== null
                    ? carbProgress !== null
                      ? `${carbProgress}% • ${totalCarbs}g / ${targetCarbs}g`
                      : `${totalCarbs}g (${t('dashboard:targetUnavailable', 'target unavailable')})`
                    : t('lifestyle:notCalculated', 'Not calculated')}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${isFemale ? 'bg-[#F43F7D]' : 'bg-[#0EA5E9]'} rounded-full transition-all duration-500`}
                  style={{ width: `${hasCarbs && carbProgress !== null ? Math.min(100, carbProgress) : 0}%` }}
                />
              </div>
            </div>

            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-1">
                <span className="font-semibold text-slate-700">{t('dashboard:proteinLabel')}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {hasProtein && totalProtein !== null
                    ? proteinProgress !== null
                      ? `${proteinProgress}% • ${totalProtein}g / ${targetProtein}g`
                      : `${totalProtein}g (${t('dashboard:targetUnavailable', 'target unavailable')})`
                    : t('lifestyle:notCalculated', 'Not calculated')}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${isFemale ? 'bg-[#0D9488]' : 'bg-[#0284C7]'} rounded-full transition-all duration-500`}
                  style={{ width: `${hasProtein && proteinProgress !== null ? Math.min(100, proteinProgress) : 0}%` }}
                />
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-1">
                <span className="font-semibold text-slate-700">{t('dashboard:fatLabel')}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {hasFat && totalFat !== null
                    ? fatProgress !== null
                      ? `${fatProgress}% • ${totalFat}g / ${targetFat}g`
                      : `${totalFat}g (${t('dashboard:targetUnavailable', 'target unavailable')})`
                    : t('lifestyle:notCalculated', 'Not calculated')}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${isFemale ? 'bg-[#F59E0B]' : 'bg-[#38BDF8]'} rounded-full transition-all duration-500`}
                  style={{ width: `${hasFat && fatProgress !== null ? Math.min(100, fatProgress) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onViewMealPlan}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isFemale
                ? 'border-[#F43F7D]/30 text-[#E11D48] hover:bg-[#FDE6EF]/40'
                : 'border-[#0284C7]/30 text-[#0284C7] hover:bg-[#E0F2FE]/40'
            }`}
          >
            <span>{t('dashboard:viewMealPlan')}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </DashboardModuleCard>
  );
};
