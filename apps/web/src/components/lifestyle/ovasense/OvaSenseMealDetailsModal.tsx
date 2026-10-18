import React from 'react';
import {
  X,
  Flame,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Plus,
  Check,
  Info,
  Utensils,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMealImage, type LifestyleVisual } from '../../../utils/lifestyleImages';
import type { SingleMeal, PlannedMealItem } from '../../../types/nutrition';

interface OvaSenseMealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: SingleMeal | any | null;
  userAllergens?: string[];
  isVegetarian?: boolean;
  plannedDate?: string;
  onLogMeal?: (meal: any) => void;
}

export const OvaSenseMealDetailsModal: React.FC<OvaSenseMealDetailsModalProps> = ({
  isOpen,
  onClose,
  meal,
  userAllergens = [],
  isVegetarian = false,
  plannedDate,
  onLogMeal,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  if (!isOpen || !meal) return null;

  const role = meal.role
    ? meal.role.charAt(0).toUpperCase() + meal.role.slice(1).toLowerCase()
    : 'Meal';
  const title = meal.title || role;
  const description = meal.description || '';
  const energyKcal = meal.energy_kcal ? Math.round(Number(meal.energy_kcal)) : null;
  const proteinG = meal.protein_g ? Math.round(Number(meal.protein_g)) : null;
  const carbsG = meal.carbohydrate_g ? Math.round(Number(meal.carbohydrate_g)) : null;
  const fatG = meal.fat_g ? Math.round(Number(meal.fat_g)) : null;

  // Meal Visual (uses existing resolved visual or computes semantic canonical image)
  const visual: LifestyleVisual =
    meal.visual || getMealImage(meal.role || '', meal.title || '', isVegetarian);

  // Ingredients and portion items
  const items: PlannedMealItem[] = Array.isArray(meal.items) ? meal.items : [];

  // Why recommended (PCOS / Metabolic grounding)
  const whyRecommended =
    meal.why_this_meal ||
    meal.why_it_fits ||
    meal.hormonal_benefit ||
    (isUrdu
      ? 'خون میں انسولین اور بلڈ شوگر کو متوازن رکھنے کے لیے خاص طور پر منتخب کیا گیا۔'
      : 'Formulated with low-glycemic, anti-inflammatory whole foods to support insulin sensitivity and stable hormonal rhythms.');

  // Preparation & verified recipe notes
  const prepTime = meal.prep_time_minutes ? Number(meal.prep_time_minutes) : null;
  const recipeItemsWithNotes = items.filter((it) => it.has_recipe && it.recipe_note);
  const generalRecipeNote = meal.recipe_note || meal.recipe || null;
  const hasVerifiedRecipe = Boolean(prepTime || recipeItemsWithNotes.length > 0 || generalRecipeNote);

  // Allergens checked against profile
  const confirmedAllergensList = userAllergens.filter(Boolean);

  const handleLogClick = () => {
    // Explicit transition to log meal form: does not log automatically
    onLogMeal?.(meal);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl bg-white rounded-3xl border border-[#FCE7F0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isUrdu ? 'text-right' : 'text-left'
        }`}
      >
        {/* Modal Hero Image */}
        <div className="relative w-full h-52 sm:h-64 bg-pink-50 overflow-hidden shrink-0">
          <img
            src={visual.url}
            alt={visual.alt}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 end-3.5 p-2 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md transition cursor-pointer backdrop-blur-xs"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top category badges */}
          <div className="absolute top-3.5 start-3.5 flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider bg-white/95 text-[#BE185D] shadow-sm border border-pink-100">
              {role}
            </span>
            {plannedDate && (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-black/40 text-white backdrop-blur-xs">
                {plannedDate}
              </span>
            )}
          </div>

          {/* Bottom Title Overlay */}
          <div className="absolute bottom-4 start-4 end-4 text-white space-y-1">
            <h2 className="text-lg sm:text-2xl font-bold leading-tight drop-shadow-sm">
              {title}
            </h2>
            {energyKcal ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-200">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{energyKcal} kcal</span>
                {prepTime ? (
                  <>
                    <span className="text-white/60">•</span>
                    <Clock className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                    <span>
                      {prepTime} {t('ovasense.mealDetails.minPrep', 'mins prep')}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Full Description */}
          {description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('ovasense.mealDetails.overview', 'Overview')}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed break-words font-medium">
                {description}
              </p>
            </div>
          )}

          {/* Macro Breakdown Pills */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('ovasense.mealDetails.nutritionProfile', 'Nutritional Profile')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#FFF5F8] border border-pink-100/90 text-center">
                <div className="text-[11px] font-medium text-[#9D174D]">
                  {t('ovasense.mealDetails.calories', 'Calories')}
                </div>
                <div className="text-base sm:text-lg font-bold text-[#BE185D] mt-0.5 font-mono">
                  {energyKcal !== null ? `${energyKcal} kcal` : '—'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-center">
                <div className="text-[11px] font-medium text-teal-800">
                  {t('ovasense.mealDetails.protein', 'Protein')}
                </div>
                <div className="text-base sm:text-lg font-bold text-teal-900 mt-0.5 font-mono">
                  {proteinG !== null ? `${proteinG}g` : '—'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                <div className="text-[11px] font-medium text-amber-800">
                  {t('ovasense.mealDetails.carbs', 'Carbohydrates')}
                </div>
                <div className="text-base sm:text-lg font-bold text-amber-900 mt-0.5 font-mono">
                  {carbsG !== null ? `${carbsG}g` : '—'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
                <div className="text-[11px] font-medium text-purple-800">
                  {t('ovasense.mealDetails.fats', 'Healthy Fats')}
                </div>
                <div className="text-base sm:text-lg font-bold text-purple-900 mt-0.5 font-mono">
                  {fatG !== null ? `${fatG}g` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Verified Ingredients & Portion Breakdown */}
          {items.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {t(
                    'ovasense.mealDetails.verifiedIngredients',
                    'Verified Ingredients & Portions'
                  )}
                </span>
              </div>
              <div className="divide-y divide-pink-50 rounded-2xl border border-pink-100 overflow-hidden bg-white">
                {items.map((item, idx) => {
                  const grams = item.grams || (item as any).portion_grams;
                  const itemKcal = item.energy_kcal ? Math.round(Number(item.energy_kcal)) : null;

                  return (
                    <div
                      key={item.entity_id || idx}
                      className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 truncate">
                          {item.display_name}
                        </div>
                        {item.standard_portion && (
                          <div className="text-[11px] text-slate-400">
                            {item.standard_portion}
                          </div>
                        )}
                        {item.has_recipe && item.recipe_note && (
                          <div className="text-[11px] text-pink-700/90 italic mt-0.5">
                            {item.recipe_note}
                          </div>
                        )}
                      </div>
                      <div className="text-end shrink-0">
                        {grams ? (
                          <div className="font-mono font-bold text-slate-700">
                            {Math.round(grams)}g
                          </div>
                        ) : null}
                        {itemKcal !== null ? (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {itemKcal} kcal
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Why Recommended for Your Profile (PCOS / Metabolic Support) */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-pink-50/80 border border-pink-100/90 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#BE185D]">
              <Sparkles className="w-4 h-4 text-[#BE185D]" />
              <span>
                {t(
                  'ovasense.mealDetails.whyRecommended',
                  'Why Recommended for Your PCOS Profile'
                )}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium">
              {whyRecommended}
            </p>
          </div>

          {/* Preparation & Verified Recipe Guidance (Only if verified data exists) */}
          {hasVerifiedRecipe && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Utensils className="w-4 h-4 text-[#BE185D]" />
                <span>
                  {t(
                    'ovasense.mealDetails.preparationGuidance',
                    'Preparation & Verified Cooking Notes'
                  )}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                {prepTime ? (
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {t('ovasense.mealDetails.estimatedPrep', 'Estimated Preparation Time:')}{' '}
                      {prepTime} {t('ovasense.mealDetails.minutes', 'minutes')}
                    </span>
                  </div>
                ) : null}
                {generalRecipeNote && <p>{generalRecipeNote}</p>}
                {recipeItemsWithNotes.length > 0 && (
                  <ul className="list-disc ps-4 space-y-0.5 text-slate-600">
                    {recipeItemsWithNotes.map((it, i) => (
                      <li key={i}>
                        <strong className="text-slate-700">{it.display_name}:</strong>{' '}
                        {it.recipe_note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Allergen & Dietary Safety Guidance */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {t('ovasense.mealDetails.allergenVerification', 'Allergen Verification & Limitations')}
              </span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-900/90">
              {confirmedAllergensList.length > 0
                ? isUrdu
                  ? `آپ کے تصدیق شدہ الرجینز (${confirmedAllergensList.join(
                      '، '
                    )}) کے مطابق یہ کھانا کینونیکل اجزاء سے تیار کیا گیا ہے۔ برائے مہربانی پیکیجڈ اجزاء پر لیبلز کی تصدیق ضرور کریں۔`
                  : `Checked against your recorded profile exclusions (${confirmedAllergensList.join(
                      ', '
                    )}). Prepared with unrefined whole foods. Always check commercial packaging for trace cross-contact.`
                : isUrdu
                ? 'غذائی رہنمائی کینونیکل ہول فوڈز پر مبنی ہے۔ اگر آپ کو کوئی خاص الرجی ہے تو ہمیشہ پروڈکٹ لیبل چیک کریں۔'
                : 'Nutritional recommendations reflect canonical unrefined whole foods. Always review packaged ingredient labels for facility cross-contact.'}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:px-6 bg-[#FFF5F8]/70 border-t border-[#FCE7F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>
              {t(
                'ovasense.mealDetails.readOnlyNotice',
                'Viewing planned meal details. Logging updates your daily totals.'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
            >
              {t('ovasense.mealDetails.close', 'Close')}
            </button>

            {meal.is_logged ? (
              <span className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t('ovasense.mealPlan.logged', 'Already Logged')}</span>
              </span>
            ) : onLogMeal ? (
              <button
                type="button"
                onClick={handleLogClick}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#BE185D] hover:bg-[#9D174D] active:scale-[0.98] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{t('ovasense.mealDetails.logThisMeal', 'Log This Meal')}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
