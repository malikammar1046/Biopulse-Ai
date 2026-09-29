import React from 'react';
import {
  Apple,
  CheckCircle2,
  Info,
  ArrowRight,
} from 'lucide-react';
import type {
  NutritionPillar,
  RecommendationItem,
} from '../../types/lifestyle';
import { RecommendationCard } from './RecommendationCard';

interface NutritionPillarViewProps {
  nutrition: NutritionPillar;
  recommendations: RecommendationItem[];
  onSelectRecommendation: (rec: RecommendationItem) => void;
  onUpdateStatus?: (
    recommendationId: string,
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED'
  ) => void;
  isMale?: boolean;
}

export const NutritionPillarView: React.FC<NutritionPillarViewProps> = ({
  nutrition,
  recommendations,
  onSelectRecommendation,
  onUpdateStatus,
  isMale = false,
}) => {
  const nutritionRecs = recommendations.filter((r) => r.category === 'nutrition');
  const targets = nutrition.daily_targets;
  const hasTargets = targets && targets.daily_calories_kcal !== null && targets.daily_calories_kcal > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Nutrition Strategy Overview */}
      <section
        aria-labelledby="nutrition-strategy-title"
        className="rounded-2xl bg-white border border-[#D7EAF2] p-6 sm:p-8 space-y-4 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-teal-50 text-[#0E9EAA]'
            }`}
          >
            <Apple className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F] block">
              Nutrition Strategy
            </span>
            <h2 id="nutrition-strategy-title" className="text-xl sm:text-2xl font-bold text-[#073B72]">
              {nutrition.strategy_title}
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-4xl">
          {nutrition.strategy_summary}
        </p>

        {/* Key Guidelines */}
        {nutrition.key_guidelines && nutrition.key_guidelines.length > 0 && (
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {nutrition.key_guidelines.map((guideline, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-xs sm:text-sm text-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-[#20B486] shrink-0 mt-0.5" />
                <span className="leading-snug">{guideline}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Daily Targets (ONLY when available, otherwise graceful pending state) */}
      <section aria-labelledby="daily-targets-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 id="daily-targets-title" className="text-lg font-bold text-[#073B72]">
              Daily Nutritional Targets
            </h3>
            <p className="text-xs text-[#55718F]">
              Personalized metabolic benchmarks based on your biometrics and daily activity
            </p>
          </div>
          {hasTargets && targets.calorie_range_min && targets.calorie_range_max && (
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              Target Range: {targets.calorie_range_min}–{targets.calorie_range_max} kcal
            </span>
          )}
        </div>

        {!hasTargets ? (
          /* Graceful Target Pending State */
          <div className="rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] p-6 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[#073B72]">
              Personalized target pending
            </h4>
            <p className="text-xs sm:text-sm text-[#55718F] max-w-md mx-auto">
              Complete your weight and height information to calculate calibrated daily energy and macronutrient targets.
            </p>
          </div>
        ) : (
          /* Compact Metric Cards (Avoid giant fitness rings) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Daily Energy */}
            <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#55718F] block">
                Daily Energy
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#073B72]">
                {targets.daily_calories_kcal?.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">kcal</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Personalized estimate
              </p>
            </div>

            {/* Protein */}
            <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#073B72] block">
                Protein {targets.protein?.percent_of_energy ? `(${targets.protein.percent_of_energy}%)` : ''}
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#073B72]">
                {targets.protein?.grams ?? '--'}
                <span className="text-xs font-normal text-slate-500 ml-1">g</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Daily target
              </p>
            </div>

            {/* Carbohydrates */}
            <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
                Carbs {targets.carbohydrates?.percent_of_energy ? `(${targets.carbohydrates.percent_of_energy}%)` : ''}
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-800">
                {targets.carbohydrates?.grams ?? '--'}
                <span className="text-xs font-normal text-slate-500 ml-1">g</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Complex energy source
              </p>
            </div>

            {/* Healthy Fats */}
            <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">
                Fats {targets.fats?.percent_of_energy ? `(${targets.fats.percent_of_energy}%)` : ''}
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-800">
                {targets.fats?.grams ?? '--'}
                <span className="text-xs font-normal text-slate-500 ml-1">g</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Hormonal support
              </p>
            </div>

            {/* Dietary Fiber */}
            <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#20B486] block">
                Fiber
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#20B486]">
                {targets.fiber_grams ?? '--'}
                <span className="text-xs font-normal text-slate-500 ml-1">g</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Daily reference
              </p>
            </div>

            {/* Hydration */}
            <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#16B8C4] block">
                Hydration
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#16B8C4]">
                {targets.hydration_liters ?? '--'}
                <span className="text-xs font-normal text-slate-500 ml-1">L</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                General guidance
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Targeted Food Swaps */}
      {nutrition.targeted_swaps && nutrition.targeted_swaps.length > 0 && (
        <section aria-labelledby="food-swaps-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="food-swaps-title" className="text-lg font-bold text-[#073B72]">
                Smart Food Swaps
              </h3>
              <p className="text-xs text-[#55718F]">
                Practical substitutions to stabilize glucose and support hormone balance
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F5FBFD] border border-[#D7EAF2] text-[#073B72]">
              {nutrition.targeted_swaps.length} Actionable Swaps
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nutrition.targeted_swaps.map((swap, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#D7EAF2] p-5 space-y-3 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F5FBFD] text-[#073B72] border border-[#D7EAF2]">
                      Target: {swap.trigger_factor}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        swap.impact_level === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {swap.impact_level} impact
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-[#073B72]">
                    {swap.swap_title}
                  </h4>

                  {/* Side-by-side / Arrow Swap Layout */}
                  <div className="p-3 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2]/80 flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="text-slate-500 line-through">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Instead of
                      </span>
                      {swap.replace_food}
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#16B8C4] shrink-0" />
                    <div className="font-semibold text-slate-900 text-right">
                      <span className="text-[10px] uppercase font-bold text-[#16B8C4] block">
                        Try
                      </span>
                      {swap.recommended_alternative}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#55718F] pt-2 border-t border-[#D7EAF2]/60">
                  <strong className="text-[#073B72] font-semibold">Why: </strong>
                  <span>{swap.clinical_mechanism}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Personalized Meal Concepts */}
      {nutrition.meal_concepts && nutrition.meal_concepts.length > 0 && (
        <section aria-labelledby="meal-concepts-title" className="space-y-4">
          <h3 id="meal-concepts-title" className="text-lg font-bold text-[#073B72]">
            Personalized Meal Concepts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nutrition.meal_concepts.map((meal, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#D7EAF2] p-5 space-y-3 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#55718F]">
                      {meal.meal_type}
                    </span>
                    {meal.est_calories && (
                      <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        ~{meal.est_calories} kcal
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-[#073B72] leading-snug">
                    {meal.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {meal.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#D7EAF2]/60">
                  <div className="flex flex-wrap gap-1">
                    {meal.key_ingredients.map((ing, iIdx) => (
                      <span
                        key={iIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#F5FBFD] border border-[#D7EAF2] text-slate-700 font-medium"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#20B486] font-medium flex items-start gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{meal.hormonal_benefit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Filtered Nutrition Recommendations */}
      {nutritionRecs.length > 0 && (
        <section aria-labelledby="nutrition-recs-title" className="space-y-4 pt-4 border-t border-[#D7EAF2]">
          <h3 id="nutrition-recs-title" className="text-lg font-bold text-[#073B72]">
            Specific Nutrition Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {nutritionRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onSelect={onSelectRecommendation}
                onUpdateStatus={onUpdateStatus}
                isMale={isMale}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
