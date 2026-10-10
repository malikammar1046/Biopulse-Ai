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
  const { totalCalories, totalCarbs, totalProtein, totalFat, hasLogs } = useMemo(() => {
    if (!foodLogs || foodLogs.length === 0) {
      return { totalCalories: 0, totalCarbs: 0, totalProtein: 0, totalFat: 0, hasLogs: false };
    }

    const cals = foodLogs.reduce((sum, f) => sum + (f.calories || 0), 0);
    const carbs = foodLogs.reduce((sum, f) => sum + (f.carbsG || 0), 0);
    const protein = foodLogs.reduce((sum, f) => sum + (f.proteinG || 0), 0);
    const fat = foodLogs.reduce((sum, f) => sum + (f.fatG || 0), 0);

    return {
      totalCalories: cals,
      totalCarbs: carbs,
      totalProtein: protein,
      totalFat: fat,
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

  const calPercent = targetCalories
    ? Math.min(100, Math.round((totalCalories / targetCalories) * 100))
    : 100;

  // Macro percentages by calories (4 cal/g carb, 4 cal/g protein, 9 cal/g fat)
  const totalMacroCals = totalCarbs * 4 + totalProtein * 4 + totalFat * 9;
  const carbPercent = totalMacroCals > 0 ? Math.round(((totalCarbs * 4) / totalMacroCals) * 100) : 0;
  const proteinPercent = totalMacroCals > 0 ? Math.round(((totalProtein * 4) / totalMacroCals) * 100) : 0;
  const fatPercent = totalMacroCals > 0 ? Math.round(((totalFat * 9) / totalMacroCals) * 100) : 0;

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercent / 100) * circumference;

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
                  {carbPercent}% • {totalCarbs}g {targetCarbs ? `/ ${targetCarbs}g` : ''}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#F43F7D] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, targetCarbs ? (totalCarbs / targetCarbs) * 100 : carbPercent)}%` }}
                />
              </div>
            </div>

            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-1">
                <span className="font-semibold text-slate-700">{t('dashboard:proteinLabel')}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {proteinPercent}% • {totalProtein}g {targetProtein ? `/ ${targetProtein}g` : ''}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#0D9488] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, targetProtein ? (totalProtein / targetProtein) * 100 : proteinPercent)}%` }}
                />
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-1">
                <span className="font-semibold text-slate-700">{t('dashboard:fatLabel')}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {fatPercent}% • {totalFat}g {targetFat ? `/ ${targetFat}g` : ''}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, targetFat ? (totalFat / targetFat) * 100 : fatPercent)}%` }}
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
