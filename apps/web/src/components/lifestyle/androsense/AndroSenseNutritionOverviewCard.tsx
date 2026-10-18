import React from 'react';
import { Utensils, Droplets, Wheat, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyTargets } from '../../../types/lifestyle';

interface AndroSenseNutritionOverviewCardProps {
  dailyTargets?: DailyTargets | null;
  onViewDetails?: () => void;
}

export const AndroSenseNutritionOverviewCard: React.FC<AndroSenseNutritionOverviewCardProps> = ({
  dailyTargets,
  onViewDetails,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // Helper to format macro target or range
  const formatMacroRange = (targetGrams: number | null | undefined, spread = 10): string => {
    if (targetGrams === null || targetGrams === undefined || targetGrams <= 0) {
      return t('androsense.nutritionOverview.notCalculated', 'Not calculated');
    }
    const val = Math.round(targetGrams);
    const min = Math.max(10, val - spread);
    const max = val + spread;
    return `${min}–${max}\u00A0g`;
  };

  const isProteinCalculated = Boolean(dailyTargets?.protein?.grams && dailyTargets.protein.grams > 0);
  const isFatsCalculated = Boolean(dailyTargets?.fats?.grams && dailyTargets.fats.grams > 0);
  const isCarbsCalculated = Boolean(dailyTargets?.carbohydrates?.grams && dailyTargets.carbohydrates.grams > 0);
  const isFiberCalculated = Boolean(dailyTargets?.fiber_grams && dailyTargets.fiber_grams > 0);

  const proteinValue = isProteinCalculated
    ? formatMacroRange(dailyTargets?.protein?.grams, 10)
    : t('androsense.nutritionOverview.notCalculated', 'Not calculated');

  const fatsValue = isFatsCalculated
    ? formatMacroRange(dailyTargets?.fats?.grams, 12)
    : t('androsense.nutritionOverview.notCalculated', 'Not calculated');

  const carbsValue = isCarbsCalculated
    ? formatMacroRange(dailyTargets?.carbohydrates?.grams, 50)
    : t('androsense.nutritionOverview.notCalculated', 'Not calculated');

  const fiberValue = isFiberCalculated
    ? `${Math.max(10, Math.round(dailyTargets!.fiber_grams! - 5))}–${Math.max(15, Math.round(dailyTargets!.fiber_grams! + 5))}\u00A0g`
    : t('androsense.nutritionOverview.notCalculated', 'Not calculated');

  return (
    <div
      data-testid="androsense-nutrition-overview"
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm space-y-4 w-full ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0 mt-0.5">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {t('androsense.nutritionOverview.title', 'Nutrition Overview')}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-2xl">
              {t(
                'androsense.nutritionOverview.description',
                "Fuel your body with the right macronutrients. Here's your daily nutrition plan tailored to your profile and metabolic vitality goals."
              )}
            </p>
          </div>
        </div>

        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0868B9] hover:text-[#07589D] transition-colors shrink-0 cursor-pointer self-start sm:self-center"
          >
            <span>
              {isUrdu ? 'تفصیلات دیکھیں ←' : t('androsense.nutritionOverview.viewDetails', 'View Details →')}
            </span>
          </button>
        )}
      </div>

      {/* 4 Pastel-Colored Nutrient Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
        {/* 1. Protein Card (Blue) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#F0F7FF] border border-sky-200/80 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-[#0868B9] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold">P</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('androsense.nutritionOverview.protein', 'Protein')}
            </span>
          </div>
          <div className="min-w-0">
            {isProteinCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {proteinValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('androsense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('androsense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>

        {/* 2. Healthy Fats Card (Teal) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#F0FDF9] border border-teal-200/80 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-[#0E9EAA] flex items-center justify-center shrink-0">
              <Droplets className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('androsense.nutritionOverview.healthyFats', 'Healthy Fats')}
            </span>
          </div>
          <div className="min-w-0">
            {isFatsCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {fatsValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('androsense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('androsense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>

        {/* 3. Complex Carbohydrates Card (Pale Slate/Blue) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#F8FAFC] border border-slate-200 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
              <Wheat className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('androsense.nutritionOverview.complexCarbs', 'Complex Carbs')}
            </span>
          </div>
          <div className="min-w-0">
            {isCarbsCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {carbsValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('androsense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('androsense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>

        {/* 4. Fiber Card (Light Green) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#F0FDF4] border border-green-200/80 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-green-100 text-[#16A34A] flex items-center justify-center shrink-0">
              <Sprout className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('androsense.nutritionOverview.fiber', 'Fiber')}
            </span>
          </div>
          <div className="min-w-0">
            {isFiberCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {fiberValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('androsense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('androsense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
