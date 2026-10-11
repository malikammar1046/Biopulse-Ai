import React from 'react';
import { Utensils, ChevronRight, Check, Plus, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMealImage } from '../../../utils/lifestyleImages';
import type { SingleMeal } from '../../../types/nutrition';
import type { MealConcept } from '../../../types/lifestyle';

interface OvaSenseDailyMealPlanCardProps {
  meals?: SingleMeal[] | null;
  mealConcepts?: MealConcept[] | null;
  isVegetarian?: boolean;
  userAllergens?: string[];
  onViewFullPlan?: () => void;
  onSelectMeal?: (meal: any) => void;
  onLogMeal?: (meal: any) => void;
  onLogCustomMeal?: () => void;
}

export const OvaSenseDailyMealPlanCard: React.FC<OvaSenseDailyMealPlanCardProps> = ({
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
        let badge = t('ovasense.mealPlan.balanced', 'Balanced');
        let badgeStyle = 'bg-[#F0FDF9] text-[#0E9EAA] border-teal-200';

        const roleLower = m.role.toLowerCase();
        if (roleLower.includes('breakfast')) {
          badge = t('ovasense.mealPlan.highInFiber', 'High in fiber');
          badgeStyle = 'bg-[#FFF0F5] text-[#BE185D] border-pink-200';
        } else if (roleLower.includes('dinner')) {
          badge = t('ovasense.mealPlan.lightNutritious', 'Light & nutritious');
          badgeStyle = 'bg-[#FAF5FF] text-[#8B5CF6] border-purple-200';
        } else if (roleLower.includes('snack')) {
          badge = t('ovasense.mealPlan.metabolicSupport', 'Metabolic support');
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
        let badge = t('ovasense.mealPlan.balanced', 'Balanced');
        let badgeStyle = 'bg-[#F0FDF9] text-[#0E9EAA] border-teal-200';

        const roleLower = c.meal_type.toLowerCase();
        if (roleLower.includes('breakfast')) {
          badge = t('ovasense.mealPlan.highInFiber', 'High in fiber');
          badgeStyle = 'bg-[#FFF0F5] text-[#BE185D] border-pink-200';
        } else if (roleLower.includes('dinner')) {
          badge = t('ovasense.mealPlan.lightNutritious', 'Light & nutritious');
          badgeStyle = 'bg-[#FAF5FF] text-[#8B5CF6] border-purple-200';
        } else if (roleLower.includes('snack')) {
          badge = t('ovasense.mealPlan.metabolicSupport', 'Metabolic support');
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
            why_this_meal: c.hormonal_benefit,
          },
        };
      });

      if (mappedConcepts.length >= 4) {
        return mappedConcepts.slice(0, 4);
      }
    }

    // Reference defaults matching the screenshot with strict vegetarian & allergen safety
    const breakfastTitle = hasNutOrSeedAllergy
      ? isUrdu
        ? 'دارچینی اور بیریز کے ساتھ جئی کا دلیہ (الرجی فری)'
        : 'Rolled oats with fresh berries and coconut flakes (nut-safe)'
      : isUrdu
      ? 'جئی کا دلیہ، چیا بیج، بیریز اور بادام'
      : 'Oats with chia seeds, berries and nuts';

    const lunchTitle = isVegetarian
      ? isUrdu
        ? 'مونگ کی دال، بیسن کی روٹی اور تازہ کچومبر سلاد'
        : 'Yellow moong daal with besan missi roti & mixed kachumber salad'
      : isUrdu
      ? 'گرل چکن، کینوا، تازہ سلاد اور زیتون کا تیل'
      : 'Grilled chicken, quinoa, mixed salad and olive oil dressing';

    const lunchVisual = isVegetarian
      ? getMealImage('lunch', 'yellow moong daal besan missi roti kachumber', true)
      : getMealImage('lunch', 'grilled chicken quinoa salad', false);

    const dinnerTitle = isUrdu
      ? 'سبزیوں کا سوپ اور چکی کے آٹے کی روٹی'
      : 'Vegetable soup with whole grain bread';

    const snackTitle = hasNutOrSeedAllergy
      ? isUrdu
        ? 'بھنے چنے کی چاٹ، کھیرا اور لیموں'
        : 'Roasted chickpea chaat with cucumber and lemon'
      : isUrdu
      ? 'اخروٹ، بھنے کدو کے بیج اور ہربل چائے'
      : 'Walnuts and roasted pumpkin seeds with green tea';

    const snackVisual = getMealImage('snack', 'roasted pumpkin seeds walnuts', isVegetarian);

    const defaults = [
      {
        id: 'breakfast_default',
        role: t('ovasense.mealPlan.breakfast', 'Breakfast'),
        title: breakfastTitle,
        description: isUrdu
          ? 'فائبر سے بھرپور متوازن ناشتہ جو خون میں شکر اور انسولین کی سطح کو مستحکم رکھتا ہے۔'
          : 'High-fiber complex carbohydrates to maintain steady insulin levels and sustained morning energy.',
        badge: t('ovasense.mealPlan.highInFiber', 'High in fiber'),
        badgeStyle: 'bg-[#FFF0F5] text-[#BE185D] border-pink-200',
        visual: getMealImage('breakfast', 'oats with chia seeds and berries', isVegetarian),
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'breakfast_default',
          role: 'Breakfast',
          title: breakfastTitle,
          description: isUrdu
            ? 'فائبر سے بھرپور متوازن ناشتہ جو خون میں شکر اور انسولین کی سطح کو مستحکم رکھتا ہے۔'
            : 'High-fiber complex carbohydrates to maintain steady insulin levels and sustained morning energy.',
          visual: getMealImage('breakfast', 'oats with chia seeds and berries', isVegetarian),
          why_this_meal: isUrdu
            ? 'صبح کے وقت بلڈ شوگر اور انسولین میں استحکام پیدا کرتا ہے۔'
            : 'High-fiber complex carbohydrates to maintain steady insulin levels.',
        },
      },
      {
        id: 'lunch_default',
        role: t('ovasense.mealPlan.lunch', 'Lunch'),
        title: lunchTitle,
        description: isUrdu
          ? 'پروٹین اور کم نشاستہ دار اناج کا متوازن امتزاج جو انسولین کی حساسیت کو بڑھاتا ہے۔'
          : 'Lean protein combined with low-glycemic complex carbs for optimal metabolic response.',
        badge: t('ovasense.mealPlan.balanced', 'Balanced'),
        badgeStyle: 'bg-[#F0FDF9] text-[#0E9EAA] border-teal-200',
        visual: lunchVisual,
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'lunch_default',
          role: 'Lunch',
          title: lunchTitle,
          description: isUrdu
            ? 'پروٹین اور کم نشاستہ دار اناج کا متوازن امتزاج جو انسولین کی حساسیت کو بڑھاتا ہے۔'
            : 'Lean protein combined with low-glycemic complex carbs for optimal metabolic response.',
          visual: lunchVisual,
          why_this_meal: isUrdu
            ? 'پروٹین اور کم نشاستہ دار اناج کا امتزاج انسولین کو متوازن رکھتا ہے۔'
            : 'Lean protein with complex carbohydrates supporting steady postprandial glucose disposal.',
        },
      },
      {
        id: 'dinner_default',
        role: t('ovasense.mealPlan.dinner', 'Dinner'),
        title: dinnerTitle,
        description: isUrdu
          ? 'ہلکا اور غذائیت سے بھرپور کھانا جو ہاضمہ بہتر اور نیند پرسکون بناتا ہے۔'
          : 'Light, anti-inflammatory dinner supporting overnight metabolic repair and digestive rest.',
        badge: t('ovasense.mealPlan.lightNutritious', 'Light & nutritious'),
        badgeStyle: 'bg-[#FAF5FF] text-[#8B5CF6] border-purple-200',
        visual: getMealImage('dinner', 'vegetable soup with whole grain bread', isVegetarian),
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'dinner_default',
          role: 'Dinner',
          title: dinnerTitle,
          description: isUrdu
            ? 'ہلکا اور غذائیت سے بھرپور کھانا جو ہاضمہ بہتر اور نیند پرسکون بناتا ہے۔'
            : 'Light, anti-inflammatory dinner supporting overnight metabolic repair and digestive rest.',
          visual: getMealImage('dinner', 'vegetable soup with whole grain bread', isVegetarian),
          why_this_meal: isUrdu
            ? 'ہلکا اور اینٹی انفلامیٹری کھانا جو رات کے وقت ہاضمے اور آرام میں مدد دیتا ہے۔'
            : 'Light, anti-inflammatory meal formulated for easy digestion and overnight metabolic repair.',
        },
      },
      {
        id: 'snack_default',
        role: t('ovasense.mealPlan.snack', 'Snack'),
        title: snackTitle,
        description: isUrdu
          ? 'صحت بخش فیٹس اور مائیکرو نیوٹرینٹس جو کھانے کے درمیان کریونگز کو روکتے ہیں۔'
          : 'Omega-3 healthy fats and magnesium to curb cravings and support hormone balance.',
        badge: t('ovasense.mealPlan.metabolicSupport', 'Metabolic support'),
        badgeStyle: 'bg-[#FFFBEB] text-[#B45309] border-amber-200',
        visual: snackVisual,
        energyKcal: null,
        isLogged: false,
        raw: {
          id: 'snack_default',
          role: 'Snack',
          title: snackTitle,
          description: isUrdu
            ? 'صحت بخش فیٹس اور مائیکرو نیوٹرینٹس جو کھانے کے درمیان کریونگز کو روکتے ہیں۔'
            : 'Omega-3 healthy fats and magnesium to curb cravings and support hormone balance.',
          visual: snackVisual,
          why_this_meal: isUrdu
            ? 'صحت مند چکنائیاں اور اینٹی آکسیڈنٹس جو ہارمونی توازن کو تقویت دیتے ہیں۔'
            : 'Omega-3 healthy fats and magnesium to curb cravings and support hormone balance.',
        },
      },
    ];

    return defaults;
  }, [meals, mealConcepts, isVegetarian, hasNutOrSeedAllergy, isUrdu, t]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-[#FCE7F0] p-5 sm:p-6 shadow-sm space-y-5 w-full ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0 mt-0.5">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {t('ovasense.mealPlan.title', 'Your Daily Meal Plan')}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              {t('ovasense.mealPlan.subtitle', 'Simple, balanced and PCOS-friendly.')}
            </p>
          </div>
        </div>

        {/* Quick Header Actions: Log Custom + View 3-Day Plan */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {onLogCustomMeal && (
            <button
              type="button"
              onClick={onLogCustomMeal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#BE185D] hover:bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('ovasense.mealPlan.logCustom', 'Log Meal')}</span>
            </button>
          )}

          {onViewFullPlan && (
            <button
              type="button"
              onClick={onViewFullPlan}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#BE185D] hover:text-[#9D174D] transition-colors shrink-0 cursor-pointer"
            >
              <span>
                {isUrdu
                  ? '۳ روزہ پلان دیکھیں ←'
                  : t('ovasense.mealPlan.viewFullPlan', 'View 3-Day Plan →')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Spacious 4-Card Horizontal Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch pt-1 w-full">
        {normalizedMeals.map((meal) => (
          <div
            key={meal.id}
            className="group rounded-2xl border border-pink-100/90 bg-white hover:border-pink-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between h-full @container"
          >
            {/* Meal Photograph at the top */}
            <div className="relative w-full h-36 sm:h-40 overflow-hidden bg-pink-50/40 shrink-0">
              <img
                src={meal.visual.url}
                alt={meal.visual.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

              {/* Role badge (Breakfast, Lunch, Dinner, Snack) */}
              <span className="absolute top-2.5 start-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-xs text-[#BE185D] shadow-2xs border border-pink-100">
                {meal.role}
              </span>

              {/* Calories overlay if available */}
              {meal.energyKcal ? (
                <span className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 backdrop-blur-xs text-white flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {Math.round(meal.energyKcal)} kcal
                </span>
              ) : null}
            </div>

            {/* Meal Details Body */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3 min-w-0">
              <div className="space-y-1.5 flex-1">
                {/* Dietary / Nutrition Badge */}
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${meal.badgeStyle}`}
                  >
                    {meal.badge}
                  </span>
                </div>

                {/* Actual Dish Name */}
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#BE185D] transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
                  {meal.title || meal.role}
                </h3>

                {/* Short Description with Natural Wrapping */}
                {meal.description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 break-words">
                    {meal.description}
                  </p>
                )}
              </div>

              {/* Card Footer: View Details Action & Log Meal Button */}
              <div className="pt-3 border-t border-pink-100/70 mt-auto flex flex-col sm:flex-row xl:flex-col @[230px]:flex-row items-stretch sm:items-center xl:items-stretch @[230px]:items-center justify-between gap-2 min-w-0 w-full">
                {/* View Details Action */}
                <button
                  type="button"
                  onClick={() => onSelectMeal?.(meal.raw)}
                  className="inline-flex items-center justify-center sm:justify-start xl:justify-center @[230px]:justify-start gap-1 text-xs font-semibold text-slate-600 hover:text-[#BE185D] hover:bg-pink-50/70 transition-colors cursor-pointer py-1.5 px-2 rounded-xl shrink-0"
                >
                  <span>{t('ovasense.mealPlan.details', 'Details')}</span>
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-pink-500 shrink-0" />
                </button>

                {/* Log Meal Button or Logged Status */}
                {meal.isLogged ? (
                  <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{t('ovasense.mealPlan.logged', 'Logged')}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogMeal?.(meal.raw);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#BE185D] hover:bg-[#9D174D] active:scale-[0.98] py-2 px-3 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 max-w-full"
                    title="Log Meal"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('ovasense.mealPlan.logMeal', 'Log Meal')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
