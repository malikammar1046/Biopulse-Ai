import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChefHat,
  Clock,
  Flame,
  Users,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
} from 'lucide-react';
import { lifestyleService } from '../../services/lifestyleService';
import type { PersonalizedRecipe } from '../../types/lifestyle';

interface AIPersonalizedRecipeSectionProps {
  isMale?: boolean;
  pathway?: string;
  userDietaryPreference?: string;
  userAllergens?: string[];
  hasBiometrics?: boolean;
}

export const AIPersonalizedRecipeSection: React.FC<AIPersonalizedRecipeSectionProps> = ({
  isMale = false,
  pathway = 'androsense',
  userDietaryPreference,
  userAllergens = [],
  hasBiometrics = true,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [selectedFocus, setSelectedFocus] = useState<string>('high_protein');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [recipe, setRecipe] = useState<PersonalizedRecipe | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubstitutions, setShowSubstitutions] = useState<boolean>(true);

  // Load existing / cached recipe on initial render
  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const latest = await lifestyleService.getLatestRecipe(pathway);
        if (isMounted && latest) {
          setRecipe(latest);
        }
      } catch (e) {
        // Non-blocking if no prior recipe exists
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };
    fetchLatest();
    return () => {
      isMounted = false;
    };
  }, [pathway]);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const generated = await lifestyleService.generateRecipe({
        module: pathway as any,
        meal_type: selectedMealType,
        preference: selectedFocus,
        custom_notes: customNotes.trim() || undefined,
        dietary_preference: userDietaryPreference,
        allergens: userAllergens,
      });
      setRecipe(generated);
    } catch (err: any) {
      console.error('Failed to generate personalized recipe:', err);
      setError(
        err.message ||
          'Unable to generate recipe with current preferences. Please try again with different options.'
      );
    } finally {
      setLoading(false);
    }
  };

  const focusOptions = [
    { id: 'high_protein', label: 'High Protein' },
    { id: 'quick', label: 'Quick Prep (<20m)' },
    { id: 'budget', label: 'Budget Friendly' },
    { id: 'heart_healthy', label: 'Endocrine & Heart Support' },
  ];

  const primaryBtnClass = isMale
    ? 'bg-[#0868B9] hover:bg-[#07599c] text-white shadow-sky-900/10'
    : 'bg-[#0E9EAA] hover:bg-[#0b828c] text-white shadow-teal-900/10';

  const accentBadgeClass = isMale
    ? 'bg-sky-50 text-[#0868B9] border-sky-200'
    : 'bg-teal-50 text-[#0E9EAA] border-teal-200';

  return (
    <section className="rounded-3xl bg-white border border-[#E2EEF4] p-6 sm:p-8 shadow-sm space-y-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-teal-50 text-[#0E9EAA]'
            }`}
          >
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F]">
                AI Culinary Personalization
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${accentBadgeClass}`}>
                Gemini Powered
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#073B72] tracking-tight">
              AI Personalized Recipes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authentic Pakistani home recipes dynamically synthesized from your biometrics, micronutrient needs, and dietary restrictions.
            </p>
          </div>
        </div>

        {recipe && (
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 ${primaryBtnClass} ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate Recipe</span>
          </button>
        )}
      </div>

      {/* ── Recipe Request Controls ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Meal Type Pills */}
          <div>
            <label className="block text-xs font-bold text-[#073B72] mb-1.5">
              Select Meal Slot
            </label>
            <div className="inline-flex rounded-xl bg-white border border-[#E2EEF4] p-1 gap-1">
              {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMealType(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedMealType === m
                      ? isMale
                        ? 'bg-[#0868B9] text-white shadow-xs'
                        : 'bg-[#0E9EAA] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Preference Focus Chips */}
          <div>
            <label className="block text-xs font-bold text-[#073B72] mb-1.5">
              Nutritional Focus
            </label>
            <div className="flex flex-wrap gap-1.5">
              {focusOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedFocus(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    selectedFocus === opt.id
                      ? isMale
                        ? 'bg-sky-100 text-[#0868B9] border-sky-300 font-bold'
                        : 'bg-teal-100 text-[#0E9EAA] border-teal-300 font-bold'
                      : 'bg-white text-slate-600 border-[#E2EEF4] hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom notes & action row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <input
            type="text"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="e.g. Include spinach and lentils, or prefer river fish..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2EEF4] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0868B9]/30"
          />

          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 ${primaryBtnClass} ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Synthesizing...' : 'Generate Personalized Recipe'}</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold text-rose-900">Generation Notice</p>
            <p className="leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate()}
            className="font-bold text-rose-900 underline hover:no-underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading Skeleton / State ── */}
      {loading && (
        <div className="p-8 rounded-3xl bg-[#F7FBFC] border border-[#E2EEF4] text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0868B9] flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-[#073B72]">
              Generating Tailored {selectedMealType} Recipe...
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Evaluating clinical boundaries, checking allergy exclusions, and calibrating micronutrient density with authentic Pakistani ingredients.
            </p>
          </div>
        </div>
      )}

      {/* ── Initial Loading or Empty State ── */}
      {!loading && !recipe && !error && (
        initialLoading ? (
          <div className="p-8 rounded-3xl bg-[#F7FBFC] border border-[#E2EEF4] text-center space-y-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto" />
            <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#F7FBFC] border border-[#E2EEF4] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2EEF4] text-[#0868B9] flex items-center justify-center mx-auto shadow-xs">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-[#073B72]">
                No Recipe Generated Yet
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click &quot;Generate Personalized Recipe&quot; above to receive a freshly composed whole-food recipe grounded in your health profile and dietary preferences.
              </p>
            </div>
          </div>
        )
      )}

      {/* ── Generated Recipe Presentation Card ── */}
      {!loading && recipe && (
        <div className="rounded-3xl bg-white border border-[#E2EEF4] overflow-hidden shadow-xs space-y-6 p-6 sm:p-7 animate-fadeIn">
          {/* Recipe Top Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${accentBadgeClass}`}>
                {recipe.meal_type}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Allergens Verified Safe</span>
              </span>
            </div>

            <h3 className="text-2xl font-extrabold text-[#073B72] leading-snug">
              {recipe.recipe_name}
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {recipe.short_description}
            </p>
          </div>

          {/* Cooking Metric Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] text-center">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Prep Time</span>
              </div>
              <p className="text-sm font-bold text-[#073B72]">{recipe.prep_time_minutes} mins</p>
            </div>
            <div className="space-y-0.5 border-x border-slate-200">
              <div className="flex items-center justify-center gap-1 text-slate-400">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cook Time</span>
              </div>
              <p className="text-sm font-bold text-[#073B72]">{recipe.cook_time_minutes} mins</p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Servings</span>
              </div>
              <p className="text-sm font-bold text-[#073B72]">{recipe.servings} portions</p>
            </div>
          </div>

          {/* Why This Suits Your Profile */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0868B9]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Why This Recipe Suits Your Profile</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {recipe.why_suits_profile}
            </p>
          </div>

          {/* Nutritional Highlights */}
          {recipe.nutritional_highlights && (
            <div className="p-4 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#073B72] uppercase tracking-wider">
                  Nutritional Highlights (Per Serving)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {recipe.nutritional_highlights.qualitative_summary}
                </span>
              </div>

              {recipe.nutritional_highlights.estimated_calories_per_serving && hasBiometrics ? (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-xl bg-white border border-[#E2EEF4] text-[#073B72] font-bold">
                    ~{recipe.nutritional_highlights.estimated_calories_per_serving} kcal
                  </span>
                  {recipe.nutritional_highlights.protein_grams !== null && (
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E2EEF4] text-slate-700">
                      Protein: {recipe.nutritional_highlights.protein_grams}g
                    </span>
                  )}
                  {recipe.nutritional_highlights.carbs_grams !== null && (
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E2EEF4] text-slate-700">
                      Carbs: {recipe.nutritional_highlights.carbs_grams}g
                    </span>
                  )}
                  {recipe.nutritional_highlights.fat_grams !== null && (
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E2EEF4] text-slate-700">
                      Fat: {recipe.nutritional_highlights.fat_grams}g
                    </span>
                  )}
                  {recipe.nutritional_highlights.fiber_grams !== null && (
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E2EEF4] text-slate-700">
                      Fiber: {recipe.nutritional_highlights.fiber_grams}g
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-[#E2EEF4]">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Exact calorie numbers omitted because height or weight are not on file. Qualitative nutritional balance is prioritized.
                  </span>
                </div>
              )}

              {recipe.nutritional_highlights.key_micronutrients &&
                recipe.nutritional_highlights.key_micronutrients.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Micronutrients:</span>
                    {recipe.nutritional_highlights.key_micronutrients.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#E2EEF4] text-[11px] font-medium text-slate-600"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Two Columns: Ingredients & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Ingredients */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                <span>Ingredients &amp; Measures</span>
                <span className="text-[11px] font-semibold text-slate-400">
                  ({recipe.ingredients.length} items)
                </span>
              </h4>
              <ul className="divide-y divide-slate-100 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] p-3 space-y-1">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="py-2 px-1 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-800">{ing.item}</span>
                    </div>
                    <span className="font-mono text-slate-500 shrink-0 text-right">
                      {ing.practical_measure || ing.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preparation Steps */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#073B72] uppercase tracking-wider">
                Preparation Instructions
              </h4>
              <ol className="rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] p-4 space-y-3 text-xs text-slate-700">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E2EEF4] text-[#073B72] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Substitutions & Dietary Flexibility */}
          {recipe.substitutions && recipe.substitutions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubstitutions(!showSubstitutions)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-[#073B72] cursor-pointer"
              >
                <span>Practical Substitutions &amp; Ingredient Swaps</span>
                {showSubstitutions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showSubstitutions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {recipe.substitutions.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="text-slate-500 line-through">{sub.original}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-[#073B72]">{sub.substitute}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{sub.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Safety Disclaimer Footer */}
          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 leading-relaxed border border-slate-200/60 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{recipe.disclaimer}</span>
          </div>
        </div>
      )}
    </section>
  );
};
