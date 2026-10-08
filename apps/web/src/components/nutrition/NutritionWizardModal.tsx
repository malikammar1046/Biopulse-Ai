import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Heart,
  Clock,
  DollarSign,
  Utensils,
  Check,
} from 'lucide-react';
import type {
  DietaryPattern,
  BudgetTier,
  CookingTimePreference,
  MealGoal,
  NutritionPreferences,
  NutritionReadiness,
} from '../../types/nutrition';

interface NutritionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  readiness: NutritionReadiness | null;
  existingPreferences: NutritionPreferences | null;
  onGeneratePlan: (prefs: Partial<NutritionPreferences>) => Promise<void>;
  isMale: boolean;
}

const DIETARY_OPTIONS: { id: DietaryPattern; label: string; desc: string }[] = [
  { id: 'halal_omnivore', label: 'Halal Omnivore', desc: 'Halal meats, poultry, seafood, dairy, and plants' },
  { id: 'omnivore', label: 'Omnivore', desc: 'All poultry, meats, seafood, and plant foods' },
  { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy and eggs; no meat or fish' },
  { id: 'pescatarian', label: 'Pescatarian', desc: 'Vegetarian plus fish and seafood; no poultry or red meat' },
  { id: 'vegan', label: 'Vegan', desc: 'Strictly plant-based foods; zero animal products' },
];

const COMMON_ALLERGIES = [
  'peanut',
  'tree_nut',
  'milk',
  'egg',
  'wheat',
  'fish',
  'shellfish',
  'soy',
  'sesame',
];

const COMMON_INTOLERANCES = [
  'lactose',
  'gluten',
  'fructose',
  'histamine',
  'caffeine',
];

const POPULAR_CUISINES = [
  'pakistani',
  'indian',
  'mediterranean',
  'middle_eastern',
  'asian',
  'western',
];

const POPULAR_INGREDIENTS = [
  'chicken',
  'lentils',
  'eggs',
  'whole_wheat',
  'rice',
  'spinach',
  'yogurt',
  'tomatoes',
  'chickpeas',
  'fish',
  'oats',
];

const GOAL_OPTIONS: { id: MealGoal; label: string; desc: string }[] = [
  { id: 'maintain_health', label: 'Maintain Health & Vitality', desc: 'Sustained daily energy and balanced nutrition' },
  { id: 'metabolic_health', label: 'Metabolic & Endocrine Balance', desc: 'Steadier glucose response and hormone support' },
  { id: 'weight_reduction', label: 'Gradual Healthy Weight Management', desc: 'Portion-aware, satisfying whole food meals' },
  { id: 'weight_gain', label: 'Nourishing Caloric Density', desc: 'Wholesome energy-dense foods to support healthy weight' },
  { id: 'improve_eating_consistency', label: 'Improve Routine & Consistency', desc: 'Structured, reliable meals matching your busy schedule' },
  { id: 'energy', label: 'Energy & Fatigue Support', desc: 'Complex carbs and proteins to overcome mid-day slumps' },
  { id: 'fitness_support', label: 'Active Fitness & Muscle Recovery', desc: 'Adequate protein distribution and post-workout fuel' },
];

export const NutritionWizardModal: React.FC<NutritionWizardModalProps> = ({
  isOpen,
  onClose,
  readiness: _readiness,
  existingPreferences,
  onGeneratePlan,
  isMale,
}) => {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [dietaryPattern, setDietaryPattern] = useState<DietaryPattern>(
    (existingPreferences?.dietary_pattern as DietaryPattern) || 'halal_omnivore'
  );
  const [foodAllergies, setFoodAllergies] = useState<string[]>(
    existingPreferences?.food_allergies || []
  );
  const [foodIntolerances, setFoodIntolerances] = useState<string[]>(
    existingPreferences?.food_intolerances || []
  );
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>(
    existingPreferences?.favorite_ingredients || ['chicken', 'lentils', 'spinach', 'whole_wheat']
  );
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>(
    existingPreferences?.disliked_ingredients || []
  );
  const [customDislike, setCustomDislike] = useState<string>('');
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(
    existingPreferences?.preferred_cuisines || ['pakistani']
  );
  const [mealsPerDay, setMealsPerDay] = useState<number>(
    existingPreferences?.meals_per_day || 4
  );
  const [cookingTime, setCookingTime] = useState<CookingTimePreference>(
    (existingPreferences?.cooking_time_preference as CookingTimePreference) || 'moderate'
  );
  const [budgetTier, setBudgetTier] = useState<BudgetTier>(
    (existingPreferences?.budget_tier as BudgetTier) || 'medium'
  );
  const [goal, setGoal] = useState<MealGoal>('metabolic_health');

  if (!isOpen) return null;

  const toggleAllergy = (allergen: string) => {
    setFoodAllergies((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const toggleIntolerance = (item: string) => {
    setFoodIntolerances((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleCuisine = (cuisine: string) => {
    setPreferredCuisines((prev) => {
      if (prev.includes(cuisine)) {
        return prev.length > 1 ? prev.filter((c) => c !== cuisine) : prev;
      }
      return [...prev, cuisine];
    });
  };

  const toggleFavoriteIngredient = (ingredient: string) => {
    setFavoriteIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const addDislike = () => {
    const clean = customDislike.trim().toLowerCase();
    if (clean && !dislikedIngredients.includes(clean)) {
      setDislikedIngredients((prev) => [...prev, clean]);
      setCustomDislike('');
    }
  };

  const removeDislike = (item: string) => {
    setDislikedIngredients((prev) => prev.filter((i) => i !== item));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onGeneratePlan({
        dietary_pattern: dietaryPattern,
        food_allergies: foodAllergies,
        food_intolerances: foodIntolerances,
        favorite_ingredients: favoriteIngredients,
        disliked_ingredients: dislikedIngredients,
        preferred_cuisines: preferredCuisines,
        meals_per_day: mealsPerDay,
        cooking_time_preference: cookingTime,
        budget_tier: budgetTier,
      });
      onClose();
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]';
  const accentBorder = isMale ? 'border-[#0868B9]' : 'border-[#0E9EAA]';
  const accentText = isMale ? 'text-[#0868B9]' : 'text-[#0E9EAA]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#D7EAF2] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7EAF2] bg-[#F5FBFD]">
          <div>
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-xl ${accentColor} text-white`}>
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-[#073B72]">Personalized 7-Day Meal Plan</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of 5 • {step === 1 ? 'Dietary Safety' : step === 2 ? 'Food Preferences' : step === 3 ? 'Lifestyle & Routine' : step === 4 ? 'Health Goal' : 'Review & Generate'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className={`h-full transition-all duration-300 ${accentColor}`}
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: Dietary Safety */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#073B72] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dietary Pattern</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your daily nutritional framework. Recommendations strictly enforce this pattern.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  {DIETARY_OPTIONS.map((opt) => {
                    const isSelected = dietaryPattern === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDietaryPattern(opt.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? `${accentBorder} bg-[#F5FBFD] shadow-xs`
                            : 'border-[#D7EAF2] hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#073B72]">{opt.label}</span>
                          {isSelected && <Check className={`w-4 h-4 ${accentText}`} />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergies */}
              <div className="border-t border-[#D7EAF2] pt-4">
                <h3 className="text-sm font-bold text-[#073B72]">Food Allergies (Hard Safety Exclusions)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Any meals containing these will be zero-tolerance excluded from all plans and swaps.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const isSelected = foodAllergies.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                            : 'bg-white border-[#D7EAF2] text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✕ ' : '+ '}
                        {allergy.replace('_', ' ').toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intolerances */}
              <div className="border-t border-[#D7EAF2] pt-4">
                <h3 className="text-sm font-bold text-[#073B72]">Food Intolerances</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items to minimize or substitute to reduce digestive distress.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {COMMON_INTOLERANCES.map((item) => {
                    const isSelected = foodIntolerances.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleIntolerance(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-[#D7EAF2] text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Food Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#073B72] flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-[#16B8C4]" />
                  <span>Preferred Cuisines</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We generate authentic, culturally familiar recipes matched to your targets.
                </p>
                <div className="flex flex-wrap gap-2.5 mt-3">
                  {POPULAR_CUISINES.map((cuisine) => {
                    const isSelected = preferredCuisines.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? `${accentBorder} bg-[#F5FBFD] ${accentText} shadow-xs font-bold`
                            : 'bg-white border-[#D7EAF2] text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}
                        {cuisine.replace('_', ' ').toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite Ingredients */}
              <div className="border-t border-[#D7EAF2] pt-4">
                <h3 className="text-sm font-bold text-[#073B72] flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Favorite Foods & Ingredients</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selected ingredients will be prioritized and incorporated across your weekly meals.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {POPULAR_INGREDIENTS.map((ing) => {
                    const isSelected = favoriteIngredients.includes(ing);
                    return (
                      <button
                        key={ing}
                        type="button"
                        onClick={() => toggleFavoriteIngredient(ing)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? `${accentBorder} bg-[#F5FBFD] ${accentText}`
                            : 'bg-white border-[#D7EAF2] text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '♥ ' : '+ '}
                        {ing.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dislikes */}
              <div className="border-t border-[#D7EAF2] pt-4">
                <h3 className="text-sm font-bold text-[#073B72]">Foods You Dislike (Excluded)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add any foods or ingredients you dislike or avoid.
                </p>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={customDislike}
                    onChange={(e) => setCustomDislike(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDislike();
                      }
                    }}
                    placeholder="e.g. bitter gourd, mutton, okra"
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-[#D7EAF2] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
                  />
                  <button
                    type="button"
                    onClick={addDislike}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>
                {dislikedIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {dislikedIngredients.map((dis) => (
                      <span
                        key={dis}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs"
                      >
                        <span>{dis}</span>
                        <button
                          type="button"
                          onClick={() => removeDislike(dis)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          ✕
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
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#073B72]">Meals Per Day</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  How many eating windows do you prefer to divide your daily intake into?
                </p>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[3, 4, 5].map((count) => {
                    const isSelected = mealsPerDay === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setMealsPerDay(count)}
                        className={`p-3.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? `${accentBorder} bg-[#F5FBFD] shadow-xs`
                            : 'border-[#D7EAF2] hover:border-slate-300'
                        }`}
                      >
                        <div className="text-base font-bold text-[#073B72]">{count} Meals</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {count === 3 ? 'B + L + D' : count === 4 ? 'B + L + D + 1 Snack' : 'B + L + D + 2 Snacks'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cooking Preference */}
              <div className="border-t border-[#D7EAF2] pt-4">
                <h3 className="text-sm font-bold text-[#073B72] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Cooking Time Preference</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { id: 'quick', label: 'Quick (<20 min)', desc: 'Fast, minimal assembly' },
                    { id: 'moderate', label: 'Moderate (20-40 min)', desc: 'Standard home cooking' },
                    { id: 'flexible', label: 'Flexible', desc: 'Enjoys traditional slow cooking' },
                  ].map((t) => {
                    const isSelected = cookingTime === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCookingTime(t.id as CookingTimePreference)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? `${accentBorder} bg-[#F5FBFD] shadow-xs`
                            : 'border-[#D7EAF2] hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#073B72]">{t.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div className="border-t border-[#D7EAF2] pt-4">
                <h3 className="text-sm font-bold text-[#073B72] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Grocery Budget Preference</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { id: 'low', label: 'Affordable / Student', desc: 'Lentils, eggs, seasonal vegetables' },
                    { id: 'medium', label: 'Moderate / Balanced', desc: 'Standard varied household pantry' },
                    { id: 'flexible', label: 'Flexible / Premium', desc: 'Fresh seafood, specialty ingredients' },
                  ].map((b) => {
                    const isSelected = budgetTier === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBudgetTier(b.id as BudgetTier)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? `${accentBorder} bg-[#F5FBFD] shadow-xs`
                            : 'border-[#D7EAF2] hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#073B72]">{b.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{b.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Health Goal */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#073B72]">Primary Health & Wellness Goal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calorie distributions and meal structures align with your overarching health journey.
                </p>
              </div>
              <div className="space-y-2.5">
                {GOAL_OPTIONS.map((g) => {
                  const isSelected = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between ${
                        isSelected
                          ? `${accentBorder} bg-[#F5FBFD] shadow-xs`
                          : 'border-[#D7EAF2] hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#073B72]">{g.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{g.desc}</div>
                      </div>
                      {isSelected && <Check className={`w-4 h-4 mt-0.5 ${accentText}`} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Generate */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 text-xs text-slate-700">
                <div className="font-bold text-[#166534] mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Clinical & Deterministic Health Grounding</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Your 7-day meal plan is calculated using official 2023 NASEM EER guidelines,
                  calibrated for your profile biometrics and active screening context.
                  All recipes are checked through Pakistani Food Composition and clinical safety constraints.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-[#D7EAF2]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Dietary Pattern</span>
                  <p className="font-bold text-[#073B72] mt-0.5 capitalize">
                    {dietaryPattern.replace('_', ' ')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D7EAF2]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Allergens Excluded</span>
                  <p className="font-bold text-[#073B72] mt-0.5">
                    {foodAllergies.length > 0
                      ? foodAllergies.map((a) => a.replace('_', ' ')).join(', ')
                      : 'None declared'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D7EAF2]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Meals / Day</span>
                  <p className="font-bold text-[#073B72] mt-0.5">{mealsPerDay} meals daily</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D7EAF2]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Cuisine & Cooking</span>
                  <p className="font-bold text-[#073B72] mt-0.5 capitalize">
                    {preferredCuisines.join(', ')} • {cookingTime} prep
                  </p>
                </div>
              </div>

              {favoriteIngredients.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#D7EAF2] text-xs">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Favorite Foods Prioritized</span>
                  <p className="text-slate-700 mt-1 capitalize">
                    {favoriteIngredients.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D7EAF2] bg-[#F5FBFD]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs ${accentColor} hover:opacity-95`}
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${accentColor} hover:opacity-95`}
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Building 7-Day Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate My 7-Day Plan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
