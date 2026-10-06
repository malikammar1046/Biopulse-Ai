import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  Utensils,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { nutritionService } from '../../services/nutritionService';
import type { WeeklyNutritionPlan } from '../../types/nutrition';

interface PlanGenerationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (plan: WeeklyNutritionPlan) => void;
  isMale?: boolean;
}

const COMMON_ALLERGIES = [
  { id: 'dairy', label: 'Dairy' },
  { id: 'egg', label: 'Eggs' },
  { id: 'fish', label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'tree_nuts', label: 'Tree Nuts' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'wheat', label: 'Wheat / Gluten' },
  { id: 'soy', label: 'Soy' },
  { id: 'sesame', label: 'Sesame' },
];

const COMMON_INTOLERANCES = [
  { id: 'lactose', label: 'Lactose' },
  { id: 'gluten', label: 'Gluten' },
  { id: 'fructose', label: 'Fructose' },
  { id: 'caffeine', label: 'Caffeine' },
  { id: 'histamine', label: 'Histamine' },
];

const POPULAR_PAKISTANI_DISHES = [
  'Daal Chana',
  'Daal Mash',
  'Chicken Tikka',
  'Chicken Karahi',
  'Palak Sabzi',
  'Bhindi Masala',
  'Brown Rice Pulao',
  'Roti (Whole Wheat)',
  'Boiled Egg & Toast',
  'Vegetable Raita',
  'Chana Chaat',
  'Fish Curry',
];

const CUISINES = [
  { id: 'pakistani', label: 'Pakistani / Desi' },
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'middle_eastern', label: 'Middle Eastern' },
  { id: 'south_asian', label: 'South Asian' },
  { id: 'western', label: 'Western / Continental' },
];

export const PlanGenerationWizardModal: React.FC<PlanGenerationWizardModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
  isMale = false,
}) => {
  const [step, setStep] = useState<number>(1);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Preference fields
  const [dietaryPattern, setDietaryPattern] = useState<string>('halal_omnivore');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [favInput, setFavInput] = useState<string>('');
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [disInput, setDisInput] = useState<string>('');
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(['pakistani']);
  const [budgetTier, setBudgetTier] = useState<'low' | 'medium' | 'flexible'>('medium');
  const [cookingTime, setCookingTime] = useState<'quick' | 'moderate' | 'flexible'>('moderate');
  const [mealsPerDay, setMealsPerDay] = useState<number>(4);
  const [healthGoal, setHealthGoal] = useState<string>('maintain_health');

  // Load existing preferences on open
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setError(null);

    nutritionService
      .getPreferences()
      .then((prefs) => {
        if (prefs) {
          if (prefs.dietary_pattern) setDietaryPattern(prefs.dietary_pattern);
          if (prefs.food_allergies) setAllergies(prefs.food_allergies);
          if (prefs.food_intolerances) setIntolerances(prefs.food_intolerances);
          if (prefs.favorite_ingredients) setFavoriteIngredients(prefs.favorite_ingredients);
          if (prefs.disliked_ingredients) setDislikedIngredients(prefs.disliked_ingredients);
          if (prefs.preferred_cuisines && prefs.preferred_cuisines.length > 0)
            setPreferredCuisines(prefs.preferred_cuisines);
          if (prefs.budget_tier) setBudgetTier(prefs.budget_tier as 'low' | 'medium' | 'flexible');
          if (prefs.cooking_time_preference) setCookingTime(prefs.cooking_time_preference as 'quick' | 'moderate' | 'flexible');
          if (prefs.meals_per_day) setMealsPerDay(prefs.meals_per_day);
        }
      })
      .catch((err) => {
        console.warn('Failed to load initial nutrition preferences:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAllergy = (id: string) => {
    setAllergies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleIntolerance = (id: string) => {
    setIntolerances((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCuisine = (id: string) => {
    setPreferredCuisines((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  const addFavorite = (dish: string) => {
    const trimmed = dish.trim();
    if (trimmed && !favoriteIngredients.includes(trimmed)) {
      setFavoriteIngredients([...favoriteIngredients, trimmed]);
      setFavInput('');
    }
  };

  const removeFavorite = (dish: string) => {
    setFavoriteIngredients(favoriteIngredients.filter((x) => x !== dish));
  };

  const addDisliked = (dish: string) => {
    const trimmed = dish.trim();
    if (trimmed && !dislikedIngredients.includes(trimmed)) {
      setDislikedIngredients([...dislikedIngredients, trimmed]);
      setDisInput('');
    }
  };

  const removeDisliked = (dish: string) => {
    setDislikedIngredients(dislikedIngredients.filter((x) => x !== dish));
  };

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      // 1. Save preferences
      await nutritionService.updatePreferences({
        dietary_pattern: dietaryPattern,
        food_allergies: allergies,
        food_intolerances: intolerances,
        favorite_ingredients: favoriteIngredients,
        disliked_ingredients: dislikedIngredients,
        preferred_cuisines: preferredCuisines,
        budget_tier: budgetTier,
        cooking_time_preference: cookingTime,
        meals_per_day: mealsPerDay,
      });

      // 2. Generate plan
      const plan = await nutritionService.generateWeeklyPlan();
      onPlanGenerated(plan);
      onClose();
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setError(err?.message || 'We could not generate your plan right now. Your preferences were saved.');
    } finally {
      setGenerating(false);
    }
  };

  const primaryBtnClass = isMale
    ? 'bg-[#0868B9] hover:bg-[#07599c] text-white'
    : 'bg-[#0E9EAA] hover:bg-[#0b828c] text-white';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#D7EAF2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7EAF2] bg-[#F5FBFD]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isMale ? 'bg-sky-100 text-[#0868B9]' : 'bg-teal-100 text-[#0E9EAA]'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F]">
                Step {step} of 5
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#073B72]">
                Personalize Your 7-Day Plan
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EBF4F8] h-1.5">
          <div
            className={`h-full transition-all duration-300 ${
              isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]'
            }`}
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Notice</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Dietary Safety */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-[#073B72] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#20B486]" />
                  Dietary Pattern & Hard Safety Constraints
                </h3>
                <p className="text-xs text-[#55718F] mt-1">
                  Allergies and dietary principles are strictly verified by our deterministic engine.
                </p>
              </div>

              {/* Dietary Pattern */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Dietary Pattern
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'halal_omnivore', label: 'Halal Omnivore' },
                    { id: 'omnivore', label: 'Omnivore' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'pescatarian', label: 'Pescatarian' },
                  ].map((pattern) => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => setDietaryPattern(pattern.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                        dietaryPattern === pattern.id
                          ? isMale
                            ? 'bg-sky-50 border-[#0868B9] text-[#0868B9]'
                            : 'bg-teal-50 border-[#0E9EAA] text-[#0E9EAA]'
                          : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{pattern.label}</span>
                      {dietaryPattern === pattern.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Food Allergies (Strict Zero-Leakage)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_ALLERGIES.map((alg) => {
                    const active = allergies.includes(alg.id);
                    return (
                      <button
                        key={alg.id}
                        type="button"
                        onClick={() => toggleAllergy(alg.id)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition flex items-center justify-between ${
                          active
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{alg.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intolerances */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Food Intolerances
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_INTOLERANCES.map((into) => {
                    const active = intolerances.includes(into.id);
                    return (
                      <button
                        key={into.id}
                        type="button"
                        onClick={() => toggleIntolerance(into.id)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition flex items-center justify-between ${
                          active
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{into.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Food Preferences */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-[#073B72] flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#0E9EAA]" />
                  Cuisine & Dish Preferences
                </h3>
                <p className="text-xs text-[#55718F] mt-1">
                  We adapt familiar cultural favorites to fit your targets rather than prescribing foreign foods.
                </p>
              </div>

              {/* Cuisines */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Preferred Cuisines
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CUISINES.map((c) => {
                    const active = preferredCuisines.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCuisine(c.id)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition flex items-center justify-between ${
                          active
                            ? isMale
                              ? 'bg-sky-50 border-[#0868B9] text-[#0868B9]'
                              : 'bg-teal-50 border-[#0E9EAA] text-[#0E9EAA]'
                            : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{c.label}</span>
                        {active && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite dishes */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Favorite Dishes & Ingredients
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={favInput}
                    onChange={(e) => setFavInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFavorite(favInput);
                      }
                    }}
                    placeholder="e.g. Daal Chana, Chicken Tikka, Oats..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden focus:border-[#0E9EAA]"
                  />
                  <button
                    type="button"
                    onClick={() => addFavorite(favInput)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  >
                    Add
                  </button>
                </div>

                {/* Popular chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_PAKISTANI_DISHES.map((dish) => (
                    <button
                      key={dish}
                      type="button"
                      onClick={() => addFavorite(dish)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                        favoriteIngredients.includes(dish)
                          ? 'bg-teal-50 border-[#0E9EAA] text-[#0E9EAA] font-semibold'
                          : 'bg-[#F5FBFD] border-[#D7EAF2] text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      + {dish}
                    </button>
                  ))}
                </div>

                {favoriteIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {favoriteIngredients.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium border border-teal-200"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeFavorite(item)}
                          className="hover:text-teal-950"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dislikes */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Disliked Foods
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={disInput}
                    onChange={(e) => setDisInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDisliked(disInput);
                      }
                    }}
                    placeholder="e.g. Karela, Mushrooms..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden focus:border-[#0E9EAA]"
                  />
                  <button
                    type="button"
                    onClick={() => addDisliked(disInput)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  >
                    Add
                  </button>
                </div>
                {dislikedIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dislikedIngredients.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeDisliked(item)}
                          className="hover:text-rose-950"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Practical Lifestyle */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-[#073B72] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#073B72]" />
                  Meals Per Day, Cooking & Budget
                </h3>
                <p className="text-xs text-[#55718F] mt-1">
                  Tailoring meal timing and recipe complexity to your actual daily schedule.
                </p>
              </div>

              {/* Meals per day */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Meals Per Day
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { num: 3, label: '3 Meals', desc: 'Breakfast, Lunch, Dinner' },
                    { num: 4, label: '4 Meals', desc: '3 Meals + 1 Snack' },
                    { num: 5, label: '5 Meals', desc: '3 Meals + 2 Snacks' },
                  ].map((m) => (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => setMealsPerDay(m.num)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        mealsPerDay === m.num
                          ? isMale
                            ? 'bg-sky-50 border-[#0868B9] text-[#0868B9]'
                            : 'bg-teal-50 border-[#0E9EAA] text-[#0E9EAA]'
                          : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-bold">{m.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cooking time preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Cooking Time Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'quick', label: 'Quick', desc: '< 20 mins / simple prep' },
                    { id: 'moderate', label: 'Moderate', desc: '20–40 mins standard' },
                    { id: 'flexible', label: 'Flexible', desc: 'Cook from scratch' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCookingTime(c.id as any)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        cookingTime === c.id
                          ? isMale
                            ? 'bg-sky-50 border-[#0868B9] text-[#0868B9]'
                            : 'bg-teal-50 border-[#0E9EAA] text-[#0E9EAA]'
                          : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-bold">{c.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
                  Budget Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'low', label: 'Affordable', desc: 'Pantry staples & seasonal' },
                    { id: 'medium', label: 'Balanced', desc: 'Standard grocery budget' },
                    { id: 'flexible', label: 'Flexible', desc: 'Premium ingredients' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetTier(b.id as any)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        budgetTier === b.id
                          ? isMale
                            ? 'bg-sky-50 border-[#0868B9] text-[#0868B9]'
                            : 'bg-teal-50 border-[#0E9EAA] text-[#0E9EAA]'
                          : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-bold">{b.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Goal */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-[#073B72] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Primary Nutrition Goal
                </h3>
                <p className="text-xs text-[#55718F] mt-1">
                  Adjusts energy density, fiber target, and protein proportion safely.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'maintain_health',
                    title: 'Maintain Health & Vitality',
                    desc: 'Balanced macronutrients for sustained energy and hormonal stability.',
                  },
                  {
                    id: 'weight_reduction',
                    title: 'Healthy Weight Reduction',
                    desc: 'Calibrated gentle deficit focusing on fiber, satiety, and blood sugar balance.',
                  },
                  {
                    id: 'weight_gain',
                    title: 'Lean Mass / Weight Support',
                    desc: 'Nutrient-dense calories with adequate protein and healthy fats.',
                  },
                  {
                    id: 'metabolic_health',
                    title: 'Metabolic & Insulin Health',
                    desc: 'Slow-digesting complex carbs, high fiber, and reduced refined sugars.',
                  },
                  {
                    id: 'consistency',
                    title: 'Consistency & Routine',
                    desc: 'Structured easy-to-follow meals to prevent skipping and chaotic snacking.',
                  },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setHealthGoal(g.id)}
                    className={`p-4 rounded-2xl border text-left transition ${
                      healthGoal === g.id
                        ? isMale
                          ? 'bg-sky-50 border-[#0868B9] text-[#0868B9]'
                          : 'bg-teal-50 border-[#0E9EAA] text-[#0E9EAA]'
                        : 'bg-white border-[#D7EAF2] text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-[#073B72]">{g.title}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Generate */}
          {step === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-[#073B72] flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#20B486]" />
                  Review Your Plan Specifications
                </h3>
                <p className="text-xs text-[#55718F] mt-1">
                  Ready to assemble your 7-day personalized meal plan with verified clinical targets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#55718F] block font-medium">Dietary Pattern:</span>
                    <span className="font-bold text-[#073B72] capitalize">
                      {dietaryPattern.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#55718F] block font-medium">Daily Schedule:</span>
                    <span className="font-bold text-[#073B72]">{mealsPerDay} meals / day</span>
                  </div>
                  <div>
                    <span className="text-[#55718F] block font-medium">Cooking Time:</span>
                    <span className="font-bold text-[#073B72] capitalize">{cookingTime}</span>
                  </div>
                  <div>
                    <span className="text-[#55718F] block font-medium">Budget:</span>
                    <span className="font-bold text-[#073B72] capitalize">{budgetTier}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D7EAF2]">
                  <span className="text-[#55718F] block font-medium">Allergies (Excluded):</span>
                  <span className="font-semibold text-rose-700">
                    {allergies.length > 0
                      ? allergies.map((a) => a.replace('_', ' ')).join(', ')
                      : 'None declared'}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#D7EAF2]">
                  <span className="text-[#55718F] block font-medium">Cuisines:</span>
                  <span className="font-semibold text-[#073B72]">
                    {preferredCuisines.map((c) => c.replace('_', ' ')).join(', ')}
                  </span>
                </div>

                {favoriteIngredients.length > 0 && (
                  <div className="pt-2 border-t border-[#D7EAF2]">
                    <span className="text-[#55718F] block font-medium">Favorites Featured:</span>
                    <span className="font-semibold text-teal-800">
                      {favoriteIngredients.slice(0, 6).join(', ')}
                      {favoriteIngredients.length > 6 ? ` +${favoriteIngredients.length - 6} more` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Clinical Notice:</strong> BioPulse meal recommendations are educational and
                  lifestyle-focused. They do not replace prescribed therapies or medical advice from a doctor or dietitian.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#D7EAF2] bg-[#F5FBFD] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D7EAF2] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${primaryBtnClass}`}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${primaryBtnClass} ${
                generating ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Building 7-Day Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate My 7-Day Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
