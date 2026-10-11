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

interface AndroSenseWeeklyPlanModalProps {
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

export const AndroSenseWeeklyPlanModal: React.FC<AndroSenseWeeklyPlanModalProps> = ({
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
    <div
      role="dialog"
      aria-modal="true"
      data-testid="androsense-weekly-plan-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-4xl bg-white rounded-3xl border border-sky-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isUrdu ? 'text-right' : 'text-left'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sky-100 bg-[#F0F7FF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#0868B9] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0868B9]">
                  {t('androsense.weeklyPlan.badge', 'AndroSense 3-Day Protocol')}
                </span>
                {currentPlan?.is_active && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('androsense.weeklyPlan.active', 'Active')}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                {t('androsense.weeklyPlan.title', 'Your 3-Day Personalized Meal Plan')}
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

        {/* Empty state if no active plan exists */}
        {(!days || days.length === 0) && (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[#0868B9] flex items-center justify-center mx-auto">
              <Utensils className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                {t('androsense.weeklyPlan.noPlanTitle', 'No Active 3-Day Plan Yet')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t(
                  'androsense.weeklyPlan.noPlanDesc',
                  'Generate your evidence-grounded 3-day meal plan tailored to your metabolic profile, dietary preferences, and verified portion constraints.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenWizard}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0868B9] hover:bg-[#07589D] text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('androsense.weeklyPlan.generateBtn', 'Personalize Your 3-Day Plan')}</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {days && days.length > 0 && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Day Selector Pill Navigation */}
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/50">
              {days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                const isToday =
                  todayDayName &&
                  day.day_name.toLowerCase() === todayDayName.toLowerCase();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#0868B9] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{day.day_name}</span>
                    {isToday && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-sky-100 text-[#0868B9]'
                        }`}
                      >
                        {t('androsense.weeklyPlan.todayTag', 'Today')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day View */}
            <div className="p-6 space-y-5 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{activeDay?.day_name}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({activeDay?.meals?.length || 0} {t('androsense.weeklyPlan.mealsCount', 'meals planned')})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t(
                      'androsense.weeklyPlan.daySubtitle',
                      "Review ingredients, portions, and macros. Add to today's dashboard or log directly."
                    )}
                  </p>
                </div>

                {onOpenWizard && (
                  <button
                    type="button"
                    onClick={onOpenWizard}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0868B9] hover:text-[#07589D] transition self-start sm:self-center cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('androsense.weeklyPlan.regeneratePlan', 'Re-tune Plan')}</span>
                  </button>
                )}
              </div>

              {/* Day's Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeDay?.meals?.map((meal: SingleMeal) => {
                  const dishKeywords = [
                    meal.title,
                    meal.description,
                    meal.items?.map((i) => i.display_name).join(' '),
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const visual = getMealImage(meal.role, dishKeywords, isVegetarian);
                  const isGenericTitle =
                    !meal.title ||
                    meal.title.trim().toLowerCase() === meal.role.trim().toLowerCase();
                  const resolvedTitle =
                    isGenericTitle && meal.items && meal.items.length > 0
                      ? meal.items.slice(0, 2).map((i) => i.display_name).join(' with ')
                      : meal.title || meal.role;

                  return (
                    <div
                      key={meal.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Top: Image & Header info */}
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-sky-50 shrink-0 border border-slate-100">
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

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#0868B9] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                                {meal.role}
                              </span>
                              {meal.energy_kcal && (
                                <span className="text-[11px] font-mono font-bold text-slate-700 flex items-center gap-0.5">
                                  <Flame className="w-3 h-3 text-amber-500" />
                                  <span>{Math.round(meal.energy_kcal)} kcal</span>
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {resolvedTitle}
                            </h4>
                          </div>
                        </div>

                        {/* Ingredients list with gram weights */}
                        {meal.items && meal.items.length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {t('androsense.weeklyPlan.verifiedPortions', 'Verified Ingredients & Portions:')}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {meal.items.map((item: PlannedMealItem, iIdx: number) => (
                                <span
                                  key={iIdx}
                                  className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                                >
                                  {item.display_name}
                                  {item.grams ? ` (${Math.round(item.grams)}g)` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        {onSelectAndScheduleMeal && (
                          <button
                            type="button"
                            onClick={() => handleSchedule(meal)}
                            className="flex-1 py-1.5 px-3 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-[#0868B9] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('androsense.weeklyPlan.addToToday', 'Add to Today')}</span>
                          </button>
                        )}

                        {onLogMeal && (
                          <button
                            type="button"
                            onClick={() => onLogMeal(meal)}
                            className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>{t('androsense.weeklyPlan.logNow', 'Log Meal')}</span>
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

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">
              {t('androsense.weeklyPlan.disclaimer', 'All portions are calibrated against verified nutritional targets.')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
