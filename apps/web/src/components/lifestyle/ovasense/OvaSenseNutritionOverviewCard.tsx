import React from 'react';
import { Utensils, Droplets, Wheat, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyTargets } from '../../../types/lifestyle';

interface OvaSenseNutritionOverviewCardProps {
  dailyTargets?: DailyTargets | null;
  onViewDetails?: () => void;
}

export const OvaSenseNutritionOverviewCard: React.FC<OvaSenseNutritionOverviewCardProps> = ({
  dailyTargets,
  onViewDetails,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // Helper to format macro target or range
  const formatMacroRange = (targetGrams: number | null | undefined, spread = 10): string => {
    if (targetGrams === null || targetGrams === undefined || targetGrams <= 0) {
      return t('ovasense.nutritionOverview.notCalculated', 'Not calculated');
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
    : t('ovasense.nutritionOverview.notCalculated', 'Not calculated');

  const fatsValue = isFatsCalculated
    ? formatMacroRange(dailyTargets?.fats?.grams, 12)
    : t('ovasense.nutritionOverview.notCalculated', 'Not calculated');

  const carbsValue = isCarbsCalculated
    ? formatMacroRange(dailyTargets?.carbohydrates?.grams, 50)
    : t('ovasense.nutritionOverview.notCalculated', 'Not calculated');

  const fiberValue = isFiberCalculated
    ? `${Math.max(10, Math.round(dailyTargets!.fiber_grams! - 5))}–${Math.max(15, Math.round(dailyTargets!.fiber_grams! + 5))}\u00A0g`
    : t('ovasense.nutritionOverview.notCalculated', 'Not calculated');

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-[#FCE7F0] p-5 sm:p-6 shadow-sm space-y-4 w-full ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0 mt-0.5">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {t('ovasense.nutritionOverview.title', 'Nutrition Overview')}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-2xl">
              {t(
                'ovasense.nutritionOverview.description',
                "Fuel your body with the right nutrients. Here's your daily nutrition plan based on your health profile and PCOS management goals."
              )}
            </p>
          </div>
        </div>

        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#BE185D] hover:text-[#9D174D] transition-colors shrink-0 cursor-pointer self-start sm:self-center"
          >
            <span>
              {isUrdu ? 'تفصیلات دیکھیں ←' : t('ovasense.nutritionOverview.viewDetails', 'View Details →')}
            </span>
          </button>
        )}
      </div>

      {/* 4 Pastel-Colored Nutrient Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
        {/* 1. Protein Card (Pink) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#FFF0F5] border border-pink-100/90 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-pink-100 text-[#BE185D] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold">P</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('ovasense.nutritionOverview.protein', 'Protein')}
            </span>
          </div>
          <div className="min-w-0">
            {isProteinCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {proteinValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('ovasense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('ovasense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>

        {/* 2. Healthy Fats Card (Teal) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#F0FDF9] border border-teal-100/90 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-[#0E9EAA] flex items-center justify-center shrink-0">
              <Droplets className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('ovasense.nutritionOverview.healthyFats', 'Healthy Fats')}
            </span>
          </div>
          <div className="min-w-0">
            {isFatsCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {fatsValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('ovasense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('ovasense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>

        {/* 3. Complex Carbs Card (Amber) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#FFFBEB] border border-amber-100/90 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Wheat className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('ovasense.nutritionOverview.complexCarbs', 'Complex Carbs')}
            </span>
          </div>
          <div className="min-w-0">
            {isCarbsCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {carbsValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('ovasense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('ovasense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>

        {/* 4. Fiber Card (Purple) */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#FAF5FF] border border-purple-100/90 p-4 min-w-0 space-y-3 transition-all hover:shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sprout className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {t('ovasense.nutritionOverview.fiber', 'Fiber')}
            </span>
          </div>
          <div className="min-w-0">
            {isFiberCalculated ? (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight whitespace-nowrap">
                  {fiberValue}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {t('ovasense.nutritionOverview.perDay', '/ day')}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic leading-snug break-words">
                {t('ovasense.nutritionOverview.notCalculated', 'Not calculated')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
