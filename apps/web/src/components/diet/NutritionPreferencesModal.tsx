import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XClose,
  AlertTriangle,
  Sliders01,
  Check,
  AlertCircle,
  Clock,
  Coins01,
  ActivityHeart,
  XCircle,
  Scales01,
} from '@untitledui/icons';
import { nutritionService } from '../../services/nutritionService';
import type {
  NutritionPreferences,
  DietaryPattern,
  BudgetTier,
  CookingTimePreference,
} from '../../types/nutrition';

interface NutritionPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesUpdated?: (prefs: NutritionPreferences) => void;
}

const SUPPORTED_ALLERGENS: { id: string; label: string; description: string }[] = [
  { id: 'peanut', label: 'Peanuts', description: 'Groundnuts, peanut butter, peanut oil' },
  { id: 'tree_nut', label: 'Tree Nuts', description: 'Almonds, walnuts, cashews, pistachios' },
  { id: 'milk', label: 'Milk / Dairy', description: 'Cow milk, yogurt, dahi, paneer, cream, cheese' },
  { id: 'egg', label: 'Eggs', description: 'Egg whites, yolks, whole egg dishes' },
  { id: 'wheat', label: 'Wheat', description: 'Atta, flour, semolina / suji, chapati wheat' },
  { id: 'soy', label: 'Soy / Soya', description: 'Soybeans, soy chunks, soy sauce' },
  { id: 'fish', label: 'Fish', description: 'Rohu, trout, salmon, all finfish' },
  { id: 'shellfish', label: 'Shellfish', description: 'Shrimp, prawns, crab, lobster' },
  { id: 'sesame', label: 'Sesame', description: 'Til, tahini, sesame seeds & oil' },
];

const SUPPORTED_INTOLERANCES: { id: string; label: string; description: string }[] = [
  { id: 'gluten', label: 'Gluten Sensitivity', description: 'Non-celiac gluten sensitivity / celiac restriction' },
  { id: 'lactose', label: 'Lactose Intolerance', description: 'Difficulty digesting dairy lactose' },
  { id: 'fructose', label: 'Fructose Sensitivity', description: 'High-fructose sensitivity' },
  { id: 'histamine', label: 'Histamine Intolerance', description: 'Sensitivity to aged/fermented foods' },
];

const DIETARY_PATTERNS: { id: DietaryPattern; title: string; subtitle: string }[] = [
  {
    id: 'halal_omnivore',
    title: 'Halal Omnivore',
    subtitle: 'Halal poultry, meat, fish, eggs, dairy, and plants (Pakistani standard)',
  },
  {
    id: 'omnivore',
    title: 'Omnivore',
    subtitle: 'All food groups without restriction',
  },
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    subtitle: 'Plant foods, legumes, dairy, and eggs; strictly no meat or fish',
  },
  {
    id: 'vegan',
    title: 'Vegan',
    subtitle: 'Strictly plant-based; no meat, poultry, fish, eggs, or dairy',
  },
  {
    id: 'pescatarian',
    title: 'Pescatarian',
    subtitle: 'Plant foods and fish/seafood; strictly no poultry or red meat',
  },
];

export const NutritionPreferencesModal: React.FC<NutritionPreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [foodIntolerances, setFoodIntolerances] = useState<string[]>([]);
  const [dietaryPattern, setDietaryPattern] = useState<DietaryPattern>('halal_omnivore');
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(['pakistani']);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('medium');
  const [cookingTime, setCookingTime] = useState<CookingTimePreference>('moderate');
  const [mealsPerDay, setMealsPerDay] = useState<number>(4);

  // Quick tag inputs
  const [likeInput, setLikeInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const prefs = await nutritionService.getPreferences();
        if (isMounted) {
          setFoodAllergies(prefs.food_allergies || []);
          setFoodIntolerances(prefs.food_intolerances || []);
          setDietaryPattern((prefs.dietary_pattern as DietaryPattern) || 'halal_omnivore');
          setFavoriteIngredients(prefs.favorite_ingredients || []);
          setDislikedIngredients(prefs.disliked_ingredients || []);
          setPreferredCuisines(prefs.preferred_cuisines || ['pakistani']);
          setBudgetTier((prefs.budget_tier as BudgetTier) || 'medium');
          setCookingTime((prefs.cooking_time_preference as CookingTimePreference) || 'moderate');
          setMealsPerDay(prefs.meals_per_day || 4);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load existing nutrition preferences.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const toggleAllergen = (allergenId: string) => {
    setFoodAllergies((prev) =>
      prev.includes(allergenId) ? prev.filter((id) => id !== allergenId) : [...prev, allergenId]
    );
  };

  const toggleIntolerance = (intoleranceId: string) => {
    setFoodIntolerances((prev) =>
      prev.includes(intoleranceId)
        ? prev.filter((id) => id !== intoleranceId)
        : [...prev, intoleranceId]
    );
  };

  const handleAddLike = () => {
    const trimmed = likeInput.trim().toLowerCase();
    if (trimmed && !favoriteIngredients.includes(trimmed)) {
      setFavoriteIngredients((prev) => [...prev, trimmed]);
      setLikeInput('');
    }
  };

  const handleRemoveLike = (item: string) => {
    setFavoriteIngredients((prev) => prev.filter((i) => i !== item));
  };

  const handleAddDislike = () => {
    const trimmed = dislikeInput.trim().toLowerCase();
    if (trimmed && !dislikedIngredients.includes(trimmed)) {
      setDislikedIngredients((prev) => [...prev, trimmed]);
      setDislikeInput('');
    }
  };

  const handleRemoveDislike = (item: string) => {
    setDislikedIngredients((prev) => prev.filter((i) => i !== item));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<NutritionPreferences> = {
        food_allergies: foodAllergies,
        food_intolerances: foodIntolerances,
        dietary_pattern: dietaryPattern,
        favorite_ingredients: favoriteIngredients,
        disliked_ingredients: dislikedIngredients,
        preferred_cuisines: preferredCuisines,
        budget_tier: budgetTier,
        cooking_time_preference: cookingTime,
        meals_per_day: mealsPerDay,
      };
      const updated = await nutritionService.updatePreferences(payload);
      if (onPreferencesUpdated) {
        onPreferencesUpdated(updated);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save nutrition preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-[#BAE6FD] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-gradient-to-r from-sky-50/60 to-white">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
                <Sliders01 className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Nutrition & Safety Preferences
                </h2>
                <p className="text-xs text-[#64748B]">
                  Authoritative safety filters, dietary restrictions, and planning settings
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-left">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
                <div className="w-6 h-6 border-2 border-[#0288D1] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading your saved preferences...</p>
              </div>
            ) : (
              <>
                {/* ── 1. FOOD SAFETY (Hard Constraints) ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-[#0F172A]">
                        1. Food Safety & Allergies (Hard Exclusions)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      Fail-Closed Safety
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Food allergies trigger strict deterministic exclusions. Any candidate dish with confirmed or unverified allergen presence will be excluded.
                  </p>

                  {/* Food Allergies Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUPPORTED_ALLERGENS.map((allergen) => {
                      const isSelected = foodAllergies.includes(allergen.id);
                      return (
                        <button
                          key={allergen.id}
                          type="button"
                          onClick={() => toggleAllergen(allergen.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                              : 'bg-white border-[#E2E8F0] hover:border-[#BAE6FD] text-[#334155]'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold block">{allergen.label}</span>
                            <span className="text-[10px] text-[#64748B] block mt-0.5 leading-snug">
                              {allergen.description}
                            </span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'bg-rose-600 border-rose-600 text-white'
                                : 'border-[#CBD5E1] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Food Intolerances */}
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-semibold text-[#0F172A] block">
                      Food Intolerances & Sensitivities:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUPPORTED_INTOLERANCES.map((into) => {
                        const isSelected = foodIntolerances.includes(into.id);
                        return (
                          <button
                            key={into.id}
                            type="button"
                            onClick={() => toggleIntolerance(into.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                                : 'bg-white border-[#E2E8F0] hover:border-[#BAE6FD] text-[#334155]'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold block">{into.label}</span>
                              <span className="text-[10px] text-[#64748B] block">
                                {into.description}
                              </span>
                            </div>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'border-[#CBD5E1] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <hr className="border-[#E2E8F0]" />

                {/* ── 2. DIETARY PATTERN (Hard Constraints) ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Scales01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      2. Dietary Pattern (Hard Restriction)
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {DIETARY_PATTERNS.map((pattern) => {
                      const isSelected = dietaryPattern === pattern.id;
                      return (
                        <button
                          key={pattern.id}
                          type="button"
                          onClick={() => setDietaryPattern(pattern.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#F0F9FF] border-[#0288D1] text-[#01579B]'
                              : 'bg-white border-[#E2E8F0] hover:border-[#BAE6FD] text-[#334155]'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold block">{pattern.title}</span>
                            <span className="text-[11px] text-[#64748B] block mt-0.5">
                              {pattern.subtitle}
                            </span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[#0288D1] bg-[#0288D1]' : 'border-[#CBD5E1]'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr className="border-[#E2E8F0]" />

                {/* ── 3. FOOD PREFERENCES (Likes & Dislikes) ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      3. Food Preferences (Soft Constraints)
                    </h3>
                  </div>

                  {/* Likes */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <ActivityHeart className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Favorite Ingredients (Foods I Like)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={likeInput}
                        onChange={(e) => setLikeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLike();
                          }
                        }}
                        placeholder="e.g. daal, chicken, spinach, dahi"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
                      />
                      <button
                        type="button"
                        onClick={handleAddLike}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#E0F2FE] text-[#0288D1] hover:bg-[#BAE6FD] transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    {favoriteIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {favoriteIngredients.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLike(item)}
                              className="hover:text-emerald-950 cursor-pointer"
                              aria-label={`Remove ${item}`}
                            >
                              <XClose className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dislikes */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                      <span>Disliked Ingredients (Foods to Avoid)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={dislikeInput}
                        onChange={(e) => setDislikeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDislike();
                          }
                        }}
                        placeholder="e.g. karela, bhindi, mutton"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
                      />
                      <button
                        type="button"
                        onClick={handleAddDislike}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    {dislikedIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {dislikedIngredients.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200"
                          >
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDislike(item)}
                              className="hover:text-rose-950 cursor-pointer"
                              aria-label={`Remove ${item}`}
                            >
                              <XClose className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <hr className="border-[#E2E8F0]" />

                {/* ── 4. PLANNING PREFERENCES ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      4. Planning & Lifestyle Preferences
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Budget */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                        <Coins01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                        <span>Budget Preference</span>
                      </label>
                      <select
                        value={budgetTier}
                        onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs bg-white text-[#334155] focus:outline-none focus:border-[#0288D1]"
                      >
                        <option value="low">Low (Everyday economic staples)</option>
                        <option value="medium">Medium (Standard balanced basket)</option>
                        <option value="flexible">Flexible (Diverse & premium ingredients)</option>
                      </select>
                    </div>

                    {/* Cooking Time */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                        <span>Cooking Time Effort</span>
                      </label>
                      <select
                        value={cookingTime}
                        onChange={(e) => setCookingTime(e.target.value as CookingTimePreference)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs bg-white text-[#334155] focus:outline-none focus:border-[#0288D1]"
                      >
                        <option value="quick">Quick (&lt; 15 mins prep)</option>
                        <option value="moderate">Moderate (15–30 mins prep)</option>
                        <option value="flexible">Flexible (30+ mins prep)</option>
                      </select>
                    </div>
                  </div>

                  {/* Meals Per Day Note */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#0F172A] block">
                        Target Meals Per Day: {mealsPerDay}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Automated weekly generation currently produces 4 balanced touchpoints per day.
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setMealsPerDay(num)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                            mealsPerDay === num
                              ? 'bg-[#0288D1] text-white shadow-sm'
                              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
