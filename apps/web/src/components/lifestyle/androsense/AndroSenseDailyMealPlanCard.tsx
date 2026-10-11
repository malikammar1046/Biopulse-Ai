import React from 'react';
import { Utensils, Check, Plus, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMealImage } from '../../../utils/lifestyleImages';
import type { SingleMeal } from '../../../types/nutrition';
import type { MealConcept } from '../../../types/lifestyle';

interface AndroSenseDailyMealPlanCardProps {
  meals?: SingleMeal[] | null;
  mealConcepts?: MealConcept[] | null;
  isVegetarian?: boolean;
  userAllergens?: string[];
  onViewFullPlan?: () => void;
  onSelectMeal?: (meal: any) => void;
  onLogMeal?: (meal: any) => void;
  onLogCustomMeal?: () => void;
}

export const AndroSenseDailyMealPlanCard: React.FC<AndroSenseDailyMealPlanCardProps> = ({
  meals,
  mealConcepts,
  isVegetarian = false,
  userAllergens = [],
  onViewFullPlan,
  onSelectMeal,
  onLogMeal,
  onLogCustomMeal,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // Check allergen constraints for safe fallbacks
  const normAllergens = userAllergens.map((a) => a.toLowerCase().trim());
  const hasNutOrSeedAllergy = normAllergens.some(
    (a) => a.includes('nut') || a.includes('peanut') || a.includes('seed') || a.includes('sesame')
  );

  // Normalize meal items: if meals from active plan exist, use them; otherwise use meal concepts or reference defaults
  const normalizedMeals = React.useMemo(() => {
    if (meals && meals.length > 0) {
      const mapped = meals.map((m) => {
        const dishKeywords = [
          m.title,
          m.description,
          m.items?.map((i) => i.display_name).join(' '),
        ]
          .filter(Boolean)
          .join(' ');
        const visual = getMealImage(m.role, dishKeywords, isVegetarian);
        let badge = t('androsense.mealPlan.balanced', 'Balanced');
        let badgeStyle = 'bg-[#F0FDF9] text-[#0E9EAA] border-teal-200';

        const roleLower = m.role.toLowerCase();
        if (roleLower.includes('breakfast')) {
          badge = t('androsense.mealPlan.highInFiber', 'High in protein');
          badgeStyle = 'bg-[#F0F7FF] text-[#0868B9] border-sky-200';
        } else if (roleLower.includes('dinner')) {
          badge = t('androsense.mealPlan.lightNutritious', 'Light & nutritious');
          badgeStyle = 'bg-[#F8FAFC] text-[#2563EB] border-slate-200';
        } else if (roleLower.includes('snack')) {
          badge = t('androsense.mealPlan.metabolicSupport', 'Zinc & Omega-3');
          badgeStyle = 'bg-[#FFFBEB] text-[#B45309] border-amber-200';
        }

        const isGenericTitle = !m.title || m.title.trim().toLowerCase() === m.role.trim().toLowerCase();
        const resolvedTitle = isGenericTitle && m.items && m.items.length > 0
          ? m.items.slice(0, 2).map((i) => i.display_name).join(' with ')
          : m.title || m.role;

        const resolvedDescription =
          m.description ||
          m.items?.map((i) => `${i.display_name}${i.grams ? ` (${Math.round(i.grams)}g)` : ''}`).join(', ') ||
          resolvedTitle;

        return {
          id: m.id || m.role,
          role: m.role.charAt(0).toUpperCase() + m.role.slice(1).toLowerCase(),
          title: resolvedTitle,
          description: resolvedDescription,
          badge,
          badgeStyle,
          visual,
          energyKcal: m.energy_kcal,
          isLogged: Boolean(m.is_logged),
          raw: {
            ...m,
            title: resolvedTitle,
            visual,
            description: resolvedDescription,
          },
        };
      });

      // Role order helper: Breakfast -> Lunch -> Dinner -> Snack
      const roleOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
      mapped.sort((a, b) => {
        const idxA = roleOrder.findIndex((r) => a.role.toLowerCase().includes(r));
        const idxB = roleOrder.findIndex((r) => b.role.toLowerCase().includes(r));
        return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
      });

      if (mapped.length >= 4) {
        return mapped.slice(0, 4);
      }
    }

    if (mealConcepts && mealConcepts.length > 0) {
      const mappedConcepts = mealConcepts.map((c) => {
        const visual = getMealImage(c.meal_type, c.title, isVegetarian);
        let badge = t('androsense.mealPlan.balanced', 'Balanced');
        let badgeStyle = 'bg-[#F0FDF9] text-[#0E9EAA] border-teal-200';

        const roleLower = c.meal_type.toLowerCase();
        if (roleLower.includes('breakfast')) {
          badge = t('androsense.mealPlan.highInFiber', 'High in protein');
          badgeStyle = 'bg-[#F0F7FF] text-[#0868B9] border-sky-200';
        } else if (roleLower.includes('dinner')) {
          badge = t('androsense.mealPlan.lightNutritious', 'Light & nutritious');
          badgeStyle = 'bg-[#F8FAFC] text-[#2563EB] border-slate-200';
        } else if (roleLower.includes('snack')) {
          badge = t('androsense.mealPlan.metabolicSupport', 'Zinc & Omega-3');
          badgeStyle = 'bg-[#FFFBEB] text-[#B45309] border-amber-200';
        }

        return {
          id: c.meal_type,
          role: c.meal_type.charAt(0).toUpperCase() + c.meal_type.slice(1).toLowerCase(),
          title: c.title,
          description: c.description || c.hormonal_benefit,
          badge,
          badgeStyle,
          visual,
          energyKcal: null,
          isLogged: false,
          raw: {
            ...c,
            id: c.meal_type,
            role: c.meal_type,
            visual,
            description: c.description || c.hormonal_benefit,
          },
        };
      });

      const roleOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
      mappedConcepts.sort((a, b) => {
        const idxA = roleOrder.findIndex((r) => a.role.toLowerCase().includes(r));
        const idxB = roleOrder.findIndex((r) => b.role.toLowerCase().includes(r));
        return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
      });

      if (mappedConcepts.length >= 4) {
        return mappedConcepts.slice(0, 4);
      }
    }

    // Default reference Pakistani daily menu tailored to male vitality
    const breakfastTitle = isUrdu
      ? isVegetarian
        ? 'جو کا دلیہ، چیا بیج اور اخروٹ'
        : 'سبزی آملیٹ اور چکی کی روٹی'
      : isVegetarian
      ? 'Rolled Oats with Chia & Walnuts'
      : 'Desi Vegetable Omelette & Whole Wheat Roti';

    const lunchTitle = isUrdu
      ? isVegetarian
        ? 'مونگ دال تڑکہ، سلاد اور براؤن چاول'
        : 'گرلڈ چکن بریسٹ اور براؤن باسمتی'
      : isVegetarian
      ? 'Yellow Moong Daal & Brown Basmati'
      : 'Grilled Chicken, Quinoa & Crisp Salad';

    const lunchVisual = isVegetarian
      ? getMealImage('lunch', 'yellow moong daal with basmati rice', true)
      : getMealImage('lunch', 'grilled chicken salad quinoa', false);

    const dinnerTitle = isUrdu
      ? 'غذائیت بخش سبزیوں کا سوپ اور روٹی'
      : 'Baked Fish or Lentil Stew with Vegetables';

    const snackTitle = isUrdu
      ? hasNutOrSeedAllergy
        ? 'ابلے چنوں کی چاٹ اور کھیرا'
        : 'بھنے چنے اور کدو کے بیج'
      : hasNutOrSeedAllergy
      ? 'Spiced Boiled Chana Salad'
      : 'Roasted Chickpeas & Pumpkin Seeds';

    const snackVisual = hasNutOrSeedAllergy
      ? getMealImage('snack', 'spiced boiled chana salad with cucumber', isVegetarian)
      : getMealImage('snack', 'roasted chana and walnuts nut mix', isVegetarian);

    const defaults = [
      {
        id: 'breakfast_default',
        role: t('androsense.mealPlan.breakfast', 'Breakfast'),
        title: breakfastTitle,
        description: isUrdu
          ? 'معیاری پروٹین اور پیچیدہ کاربوہائیڈریٹس جو دن بھر مستقل توانائی اور میٹابولک توازن فراہم کرتے ہیں۔'
          : 'High-protein complex carbohydrates to maintain steady insulin levels and sustained morning energy.',
        badge: t('androsense.mealPlan.highInFiber', 'High in protein'),
        badgeStyle: 'bg-[#F0F7FF] text-[#0868B9] border-sky-200',
        visual: isVegetarian
          ? getMealImage('breakfast', 'oats with chia seeds and walnuts', true)
          : getMealImage('breakfast', 'desi vegetable omelette with whole wheat roti', false),
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'breakfast_default',
          role: 'Breakfast',
          title: breakfastTitle,
          description: isUrdu
            ? 'معیاری پروٹین اور پیچیدہ کاربوہائیڈریٹس جو دن بھر مستقل توانائی اور میٹابولک توازن فراہم کرتے ہیں۔'
            : 'High-protein complex carbohydrates to maintain steady insulin levels and sustained morning energy.',
          visual: isVegetarian
            ? getMealImage('breakfast', 'oats with chia seeds and walnuts', true)
            : getMealImage('breakfast', 'desi vegetable omelette with whole wheat roti', false),
          why_this_meal: isUrdu
            ? 'صبح کے وقت بلڈ شوگر اور پروٹین سنستھیسز کو متوازن رکھتا ہے۔'
            : 'Quality protein and unrefined fiber supporting sustained morning glucose stability and muscle mass preservation.',
        },
      },
      {
        id: 'lunch_default',
        role: t('androsense.mealPlan.lunch', 'Lunch'),
        title: lunchTitle,
        description: isUrdu
          ? 'پروٹین اور کم نشاستہ دار اناج کا متوازن امتزاج جو انسولین کی حساسیت اور توانائی کو تقویت دیتا ہے۔'
          : 'Lean protein combined with low-glycemic complex carbs for optimal metabolic response.',
        badge: t('androsense.mealPlan.balanced', 'Balanced'),
        badgeStyle: 'bg-[#F0FDF9] text-[#0E9EAA] border-teal-200',
        visual: lunchVisual,
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'lunch_default',
          role: 'Lunch',
          title: lunchTitle,
          description: isUrdu
            ? 'پروٹین اور کم نشاستہ دار اناج کا متوازن امتزاج جو انسولین کی حساسیت اور توانائی کو تقویت دیتا ہے۔'
            : 'Lean protein combined with low-glycemic complex carbs for optimal metabolic response.',
          visual: lunchVisual,
          why_this_meal: isUrdu
            ? 'پروٹین اور اناج کا امتزاج انسولین اور عضلاتی توانائی کو متوازن رکھتا ہے۔'
            : 'High biological value protein with complex carbohydrates supporting steady postprandial glucose disposal.',
        },
      },
      {
        id: 'dinner_default',
        role: t('androsense.mealPlan.dinner', 'Dinner'),
        title: dinnerTitle,
        description: isUrdu
          ? 'ہلکا اور غذائیت سے بھرپور کھانا جو رات کے وقت ہاضمے اور پرسکون نیند میں مددگار ہے۔'
          : 'Light, micronutrient-dense dinner supporting overnight recovery and restorative sleep.',
        badge: t('androsense.mealPlan.lightNutritious', 'Light & nutritious'),
        badgeStyle: 'bg-[#F8FAFC] text-[#2563EB] border-slate-200',
        visual: getMealImage('dinner', 'vegetable soup with whole grain bread', isVegetarian),
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'dinner_default',
          role: 'Dinner',
          title: dinnerTitle,
          description: isUrdu
            ? 'ہلکا اور غذائیت سے بھرپور کھانا جو رات کے وقت ہاضمے اور پرسکون نیند میں مددگار ہے۔'
            : 'Light, micronutrient-dense dinner supporting overnight recovery and restorative sleep.',
          visual: getMealImage('dinner', 'vegetable soup with whole grain bread', isVegetarian),
          why_this_meal: isUrdu
            ? 'ہلکا کھانا جو رات کے وقت گہری نیند اور خلیاتی مرمت میں معاون ہے۔'
            : 'Light, micronutrient-dense dinner formulated for digestive ease and uninterrupted nocturnal sleep cycles.',
        },
      },
      {
        id: 'snack_default',
        role: t('androsense.mealPlan.snack', 'Snack'),
        title: snackTitle,
        description: isUrdu
          ? 'زنک، میگنیشیم اور صحت بخش چکنائیاں جو جسمانی توانائی اور ہارمونل توازن کو سہارا دیتی ہیں۔'
          : 'Zinc, magnesium and healthy fats supporting cellular repair and sustained energy.',
        badge: t('androsense.mealPlan.metabolicSupport', 'Zinc & Omega-3'),
        badgeStyle: 'bg-[#FFFBEB] text-[#B45309] border-amber-200',
        visual: snackVisual,
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'snack_default',
          role: 'Snack',
          title: snackTitle,
          description: isUrdu
            ? 'زنک، میگنیشیم اور صحت بخش چکنائیاں جو جسمانی توانائی اور ہارمونل توازن کو سہارا دیتی ہیں۔'
            : 'Zinc, magnesium and healthy fats supporting cellular repair and sustained energy.',
          visual: snackVisual,
          why_this_meal: isUrdu
            ? 'مائیکرو نیوٹرینٹس جو اینڈوکرائن اور میٹابولک افعال کے لیے اہم کوفیکٹرز ہیں۔'
            : 'Essential micronutrients including zinc and magnesium acting as enzymatic cofactors for endocrine pathways.',
        },
      },
    ];

    return defaults;
  }, [meals, mealConcepts, isVegetarian, hasNutOrSeedAllergy, isUrdu, t]);

  return (
    <div
      data-testid="androsense-daily-meal-plan"
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm space-y-5 w-full ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {t('androsense.mealPlan.title', 'Your Daily Meal Plan')}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'androsense.mealPlan.subtitle',
                'High-protein, micronutrient-dense meals tailored to your energy needs.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onLogCustomMeal && (
            <button
              type="button"
              onClick={onLogCustomMeal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-200 bg-sky-50/60 hover:bg-sky-50 text-[#0868B9] text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('androsense.mealPlan.logCustom', 'Log Meal')}</span>
            </button>
          )}

          {onViewFullPlan && (
            <button
              type="button"
              data-testid="androsense-view-3day-plan-btn"
              onClick={onViewFullPlan}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0868B9] hover:text-[#07589D] transition-colors shrink-0 cursor-pointer"
            >
              <span>{t('androsense.mealPlan.viewFullPlan', 'View 3-Day Plan →')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Spacious Horizontal Meal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {normalizedMeals.map((meal) => {
          return (
            <div
              key={meal.id}
              className={`flex flex-col justify-between rounded-2xl bg-white border transition-all duration-200 hover:shadow-md overflow-hidden min-w-0 ${
                meal.isLogged
                  ? 'border-emerald-200 shadow-2xs'
                  : 'border-slate-200/90 hover:border-sky-300'
              }`}
            >
              {/* Top: Meal Image with Dark Overlay Badge & Calories */}
              <div className="relative h-36 w-full overflow-hidden bg-sky-50/50 shrink-0">
                <img
                  src={meal.visual.url}
                  alt={meal.visual.alt}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                {/* Role badge (Breakfast, Lunch, etc.) */}
                <span className="absolute top-2.5 start-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-slate-800 shadow-xs backdrop-blur-2xs">
                  {meal.role}
                </span>

                {/* Logged indicator if already logged today */}
                {meal.isLogged && (
                  <span className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{t('androsense.mealPlan.logged', 'Logged')}</span>
                  </span>
                )}

                {/* Energy indicator */}
                {meal.energyKcal && (
                  <span className="absolute bottom-2 end-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 text-white flex items-center gap-1 backdrop-blur-2xs">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{Math.round(meal.energyKcal)} kcal</span>
                  </span>
                )}
              </div>

              {/* Middle: Content (Title, Badge, Description) */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">
                      {meal.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meal.badgeStyle}`}
                    >
                      {meal.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {meal.description}
                  </p>
                </div>

                {/* Bottom: Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 w-full min-w-0">
                  {/* Details Button */}
                  <button
                    type="button"
                    data-testid="androsense-details-btn"
                    onClick={() => onSelectMeal?.(meal.raw)}
                    className="flex-1 min-w-0 py-1.5 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition cursor-pointer text-center truncate"
                  >
                    {isUrdu ? 'تفصیلات' : 'Details'}
                  </button>

                  {/* Log Meal Button */}
                  <button
                    type="button"
                    onClick={() => onLogMeal?.(meal.raw)}
                    className={`flex-1 min-w-0 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center truncate flex items-center justify-center gap-1 ${
                      meal.isLogged
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-[#0868B9] hover:bg-[#07589D] text-white shadow-2xs'
                    }`}
                  >
                    {meal.isLogged ? (
                      <>
                        <Check className="w-3 h-3 stroke-[2.5] shrink-0" />
                        <span className="truncate">{t('androsense.mealPlan.logged', 'Logged')}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 shrink-0" />
                        <span className="truncate">{t('androsense.mealPlan.log', 'Log')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
