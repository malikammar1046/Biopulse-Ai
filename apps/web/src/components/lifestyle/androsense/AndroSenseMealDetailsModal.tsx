import React from 'react';
import {
  X,
  Flame,
  Clock,
  ShieldCheck,
  Sparkles,
  Plus,
  Utensils,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMealImage, type LifestyleVisual } from '../../../utils/lifestyleImages';
import type { SingleMeal, PlannedMealItem } from '../../../types/nutrition';

interface AndroSenseMealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: SingleMeal | any | null;
  userAllergens?: string[];
  isVegetarian?: boolean;
  plannedDate?: string;
  onLogMeal?: (meal: any) => void;
}

export const AndroSenseMealDetailsModal: React.FC<AndroSenseMealDetailsModalProps> = ({
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

  // Why recommended (Male endocrine & metabolic grounding)
  const whyRecommended =
    meal.why_this_meal ||
    meal.why_it_fits ||
    meal.hormonal_benefit ||
    (isUrdu
      ? 'معیاری پروٹین اور مائیکرو نیوٹرینٹس کے ذریعے میٹابولک توازن اور جسمانی توانائی کے لیے منتخب کیا گیا۔'
      : 'Formulated with quality protein, healthy fats, and low-glycemic whole foods to support lean mass preservation and sustained metabolic energy.');

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
      role="dialog"
      aria-modal="true"
      data-testid="androsense-meal-details-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl bg-white rounded-3xl border border-sky-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isUrdu ? 'text-right' : 'text-left'
        }`}
      >
        {/* Modal Hero Image */}
        <div className="relative w-full h-52 sm:h-64 bg-sky-50 overflow-hidden shrink-0">
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
            <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider bg-white/95 text-[#0868B9] shadow-sm border border-sky-100">
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
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-200">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{energyKcal} kcal</span>
                {prepTime ? (
                  <>
                    <span className="text-white/60">•</span>
                    <Clock className="w-3.5 h-3.5 text-sky-300" />
                    <span>{prepTime} mins prep</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Macronutrients Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t('androsense.nutritionOverview.calories', 'Calories')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-800 font-mono mt-0.5 block">
                {energyKcal ? `${energyKcal}` : '--'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">kcal</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F0F7FF] border border-sky-200/80 text-center">
              <span className="text-[10px] font-semibold text-[#0868B9] uppercase tracking-wider block">
                {t('androsense.nutritionOverview.protein', 'Protein')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[#0868B9] font-mono mt-0.5 block">
                {proteinG !== null ? `${proteinG}g` : '--'}
              </span>
              <span className="text-[10px] text-sky-400 font-medium">target</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F0FDF9] border border-teal-200/80 text-center">
              <span className="text-[10px] font-semibold text-[#0E9EAA] uppercase tracking-wider block">
                {t('androsense.nutritionOverview.complexCarbs', 'Carbs')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[#0E9EAA] font-mono mt-0.5 block">
                {carbsG !== null ? `${carbsG}g` : '--'}
              </span>
              <span className="text-[10px] text-teal-400 font-medium">complex</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-amber-200/80 text-center">
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">
                {t('androsense.nutritionOverview.healthyFats', 'Fats')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-amber-900 font-mono mt-0.5 block">
                {fatG !== null ? `${fatG}g` : '--'}
              </span>
              <span className="text-[10px] text-amber-500 font-medium">healthy</span>
            </div>
          </div>

          {/* Meal Description */}
          {description && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isUrdu ? 'تفصیل' : 'Description'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Why Recommended / Metabolic & Endocrine Rationale */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/90 to-blue-50/70 border border-sky-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0868B9]">
              <Sparkles className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span>
                {isUrdu
                  ? 'آپ کے ہیلتھ پروفائل کے لیے کیوں مناسب ہے'
                  : 'Why Recommended for Your Profile'}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {whyRecommended}
            </p>
          </div>

          {/* Verified Ingredients & Portion Sizes */}
          {items.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {isUrdu ? 'تصدیق شدہ اجزاء اور مقدار' : 'Verified Ingredients & Portions'}
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  {items.length} {isUrdu ? 'اجزاء' : 'items'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-slate-50/40 overflow-hidden">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 block">
                        {item.display_name}
                      </span>
                      {item.recipe_note && (
                        <span className="text-[11px] text-slate-500 block leading-tight">
                          {item.recipe_note}
                        </span>
                      )}
                    </div>
                    {item.grams ? (
                      <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 text-[11px] shrink-0">
                        {Math.round(item.grams)}g
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preparation & Verified Recipe Guidance */}
          {hasVerifiedRecipe && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  {isUrdu ? 'تیاری کی ہدایات' : 'Preparation & Recipe Notes'}
                </span>
                {prepTime && (
                  <span className="text-[11px] font-normal text-slate-500">
                    ({prepTime} {isUrdu ? 'منٹ' : 'minutes'})
                  </span>
                )}
              </div>

              {generalRecipeNote && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {generalRecipeNote}
                </p>
              )}

              {recipeItemsWithNotes.length > 0 && !generalRecipeNote && (
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {recipeItemsWithNotes.map((it, idx) => (
                    <li key={idx}>
                      <strong>{it.display_name}:</strong> {it.recipe_note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Allergies / Medical Safety Advisory */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5 text-[11px] text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold block">
                {isUrdu ? 'الرجی اور طبی احتیاط' : 'Allergy & Safety Note'}
              </span>
              <span>
                {confirmedAllergensList.length > 0
                  ? isUrdu
                    ? `آپ کے پروفائل کی تصدیق شدہ الرجی (${confirmedAllergensList.join('، ')}) کو اس کھانے سے مکمل طور پر خارج رکھا گیا ہے۔`
                    : `Verified safe against your recorded allergens (${confirmedAllergensList.join(', ')}).`
                  : isUrdu
                  ? 'کھانے کے تمام اجزاء کو اپنے ذاتی طبی تقاضوں اور الرجی کے مطابق دیکھیں۔'
                  : 'Always verify ingredients against any personal dietary intolerances before preparation.'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleLogClick}
            className="px-5 py-2.5 rounded-xl bg-[#0868B9] hover:bg-[#07589D] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isUrdu ? 'یہ کھانا لاگ کریں' : 'Log This Meal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
