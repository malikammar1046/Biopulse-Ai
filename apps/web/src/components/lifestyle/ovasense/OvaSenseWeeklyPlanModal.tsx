import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  Utensils,
  Plus,
  Check,
  CheckCircle2,
  Flame,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMealImage } from '../../../utils/lifestyleImages';
import type { WeeklyNutritionPlan, SingleMeal, DailyNutritionPlan, PlannedMealItem } from '../../../types/nutrition';

interface OvaSenseWeeklyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: WeeklyNutritionPlan | null;
  isVegetarian?: boolean;
  userAllergens?: string[];
  todayDayName?: string;
  onSelectAndScheduleMeal?: (meal: SingleMeal, targetDayName?: string) => void;
  onLogMeal?: (meal: SingleMeal) => void;
  onOpenWizard?: () => void;
}

export const OvaSenseWeeklyPlanModal: React.FC<OvaSenseWeeklyPlanModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  isVegetarian = false,
  userAllergens: _userAllergens = [],
  todayDayName,
  onSelectAndScheduleMeal,
  onLogMeal,
  onOpenWizard,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const days: DailyNutritionPlan[] = useMemo(() => {
    return currentPlan?.days || [];
  }, [currentPlan]);

  // Default to today or the first day in the plan
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    if (!days || days.length === 0) return 0;
    if (todayDayName) {
      const idx = days.findIndex(
        (d) => d.day_name.toLowerCase() === todayDayName.toLowerCase()
      );
      if (idx !== -1) return idx;
    }
    return 0;
  });

  // Track scheduled meal feedback message
  const [scheduledNotice, setScheduledNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeDay = days[selectedDayIndex] || days[0];

  const handleSchedule = (meal: SingleMeal) => {
    onSelectAndScheduleMeal?.(meal, activeDay?.day_name);
    const msg = isUrdu
      ? `"${meal.title}" کو آج کے کھانوں میں شامل کر دیا گیا ہے!`
      : `"${meal.title}" scheduled to your nutrition dashboard!`;
    setScheduledNotice(msg);
    setTimeout(() => {
      setScheduledNotice(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-4xl bg-white rounded-3xl border border-[#FCE7F0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isUrdu ? 'text-right' : 'text-left'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#FCE7F0] bg-[#FFF5F8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#BE185D] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#BE185D]">
                  {t('ovasense.weeklyPlan.badge', 'OvaSense 3-Day Protocol')}
                </span>
                {currentPlan?.is_active && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('ovasense.weeklyPlan.active', 'Active')}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                {t('ovasense.weeklyPlan.title', 'Your 3-Day Personalized Meal Plan')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scheduled feedback alert */}
        {scheduledNotice && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{scheduledNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setScheduledNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
            >
              &times;
            </button>
          </div>
        )}

        {/* Provisional Plan Notice (Allergy status unconfirmed) */}
        {currentPlan?.provisional_notice && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">
                {isUrdu ? 'عارضی رہنمائی کا نوٹس' : 'Provisional Meal Guidance'}
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {isUrdu
                  ? 'الرجی کی حیثیت کی تصدیق نہیں کی گئی تھی۔ یہ مینو عمومی طرزِ زندگی کی رہنمائی فراہم کرتا ہے اور بغیر الرجن کی ضمانت نہیں دیتا۔ برائے مہربانی ہر کھانے کے اجزاء کا خود جائزہ لیں۔'
                  : currentPlan.provisional_notice}
              </p>
            </div>
          </div>
        )}

        {/* Unresolved Dislikes Notice */}
        {currentPlan?.unresolved_dislikes && currentPlan.unresolved_dislikes.length > 0 && (
          <div className="mx-6 mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">
                {isUrdu ? 'ناپسندیدہ کھانوں کا نوٹس' : 'Custom Disliked Foods Notice'}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600">
                {isUrdu
                  ? `مندرجہ ذیل ناپسندیدہ کھانے ہمارے پاکستانی ڈیٹا بیس میں خودکار طور پر نہیں مل سکے: ${currentPlan.unresolved_dislikes.join('، ')}۔ برائے مہربانی نیچے دیے گئے کھانوں کے اجزاء کا خود جائزہ لیں۔`
                  : `The following disliked food(s) could not be automatically matched to our verified Pakistani database: ${currentPlan.unresolved_dislikes.join(', ')}. Please review meal ingredients below manually.`}
              </p>
            </div>
          </div>
        )}

        {/* Plan Body */}
        {days.length === 0 ? (
          /* Empty State: Prompt to generate plan */
          <div className="p-8 sm:p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-50 text-[#BE185D] flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              {t('ovasense.weeklyPlan.noPlanTitle', 'No Active 3-Day Plan Yet')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {t(
                'ovasense.weeklyPlan.noPlanDesc',
                'Generate your evidence-grounded 3-day meal plan tailored to your PCOS risk, dietary preferences, and verified portion constraints.'
              )}
            </p>
            {onOpenWizard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWizard();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#BE185D] hover:bg-[#9D174D] text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('ovasense.weeklyPlan.generateBtn', 'Personalize Your 3-Day Plan')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Days Horizontal Tab Bar */}
            <div className="px-6 py-3 border-b border-[#FCE7F0] bg-white overflow-x-auto scrollbar-none flex items-center gap-2">
              {days.map((day, idx) => {
                const isActive = idx === selectedDayIndex;
                const isToday =
                  todayDayName &&
                  day.day_name.toLowerCase() === todayDayName.toLowerCase();

                return (
                  <button
                    key={day.day_name || idx}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#BE185D] text-white shadow-sm ring-2 ring-pink-200'
                        : 'bg-[#FFF5F8] text-slate-700 hover:bg-pink-100/60 border border-pink-100'
                    }`}
                  >
                    <span>{day.day_name}</span>
                    {isToday && (
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full font-extrabold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#BE185D] text-white'
                        }`}
                      >
                        {t('ovasense.weeklyPlan.todayTag', 'Today')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Meals List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#BE185D]" />
                    <span>{activeDay?.day_name}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({activeDay?.meals?.length || 0} {t('ovasense.weeklyPlan.mealsCount', 'meals planned')})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t(
                      'ovasense.weeklyPlan.daySubtitle',
                      'Review ingredients, portions, and macros. Add to today’s dashboard or log directly.'
                    )}
                  </p>
                </div>

                {onOpenWizard && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWizard();
                    }}
                    className="text-xs font-bold text-[#BE185D] hover:underline cursor-pointer hidden sm:inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('ovasense.weeklyPlan.regeneratePlan', 'Re-tune Plan')}</span>
                  </button>
                )}
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {activeDay?.meals?.map((meal: SingleMeal, mealIdx: number) => {
                  const visual = getMealImage(meal.role, meal.title, isVegetarian);
                  const itemsList = meal.items || [];

                  return (
                    <div
                      key={meal.id || meal.role || mealIdx}
                      className="p-4 rounded-3xl bg-[#FFF9FA] border border-[#FCE7F0] hover:border-pink-300 transition-all space-y-3 shadow-2xs flex flex-col justify-between"
                    >
                      {/* Top: Image & Header */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-1 ring-pink-100 shadow-xs">
                          <img
                            src={visual.url}
                            alt={visual.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#BE185D] bg-pink-100/70 px-2 py-0.5 rounded-lg">
                              {meal.role}
                            </span>
                            {meal.energy_kcal ? (
                              <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-0.5">
                                <Flame className="w-3.5 h-3.5 text-amber-500" />
                                {Math.round(meal.energy_kcal)} kcal
                              </span>
                            ) : null}
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 leading-snug">
                            {meal.title}
                          </h4>
                          {meal.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {meal.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ingredients / Portion breakdown if available */}
                      {itemsList.length > 0 && (
                        <div className="pt-2 border-t border-pink-100/60 text-[11px] text-slate-600 space-y-1">
                          <div className="font-semibold text-slate-700 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('ovasense.weeklyPlan.verifiedPortions', 'Verified Ingredients & Portions:')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {itemsList.map((item: PlannedMealItem, itemIdx: number) => {
                              const grams = item.grams || (item as any).portion_grams;
                              return (
                                <span
                                  key={itemIdx}
                                  className="inline-block px-2 py-0.5 rounded-lg bg-white border border-pink-100 text-slate-700 text-[10px]"
                                >
                                  {item.display_name}
                                  {grams ? ` (${Math.round(grams)}g)` : ''}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Macros row */}
                      {(meal.protein_g || meal.carbohydrate_g || meal.fat_g) && (
                        <div className="pt-2 border-t border-pink-100/60 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                          {meal.protein_g ? (
                            <span>
                              <strong className="text-teal-700">P:</strong> {Math.round(meal.protein_g)}g
                            </span>
                          ) : null}
                          {meal.carbohydrate_g ? (
                            <span>
                              <strong className="text-pink-700">C:</strong> {Math.round(meal.carbohydrate_g)}g
                            </span>
                          ) : null}
                          {meal.fat_g ? (
                            <span>
                              <strong className="text-amber-700">F:</strong> {Math.round(meal.fat_g)}g
                            </span>
                          ) : null}
                        </div>
                      )}

                      {/* Actions: Add to Today & Log Meal */}
                      <div className="pt-2 border-t border-pink-100 flex items-center gap-2">
                        {onSelectAndScheduleMeal && (
                          <button
                            type="button"
                            onClick={() => handleSchedule(meal)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 text-[#BE185D] text-xs font-bold transition cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('ovasense.weeklyPlan.addToToday', 'Add to Today')}</span>
                          </button>
                        )}

                        {onLogMeal && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onLogMeal(meal);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#BE185D] hover:bg-[#9D174D] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>{t('ovasense.weeklyPlan.logNow', 'Log Meal')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#FCE7F0] bg-[#FFF5F8] flex items-center justify-between text-xs text-slate-500">
          <span>
            {t(
              'ovasense.weeklyPlan.disclaimer',
              'All portions are calibrated against verified clinical targets.'
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
