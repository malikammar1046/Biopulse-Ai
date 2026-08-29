import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ArrowRight, Sparkles } from 'lucide-react';
import type { NutritionData } from '../../types/dashboard';
import { ROUTES } from '../../constants/routes';

interface NutritionProps {
  data: NutritionData;
}

export const NutritionSnapshotCard: React.FC<NutritionProps> = ({ data }) => {
  const calPercent = Math.min((data.caloriesLogged / data.caloriesTarget) * 100, 100);

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Utensils className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            Today’s Nutrition
          </h3>
        </div>

        <span className="text-xs font-mono font-bold text-[#8E3EAF] bg-[#EDE4F7] px-2.5 py-1 rounded-full">
          Low Glycemic PCOS Focus
        </span>
      </div>

      {/* Calorie & Macros Split */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Calorie Dial Indicator */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#F2ECF7"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#8E3EAF"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={(2 * Math.PI * 48) * (1 - calPercent / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-extrabold font-display text-[#1C1326] leading-none">
              {data.caloriesLogged.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#8D7E9E] mt-0.5">
              of {data.caloriesTarget} kcal
            </span>
          </div>
        </div>

        {/* Macronutrients Breakdown Bars */}
        <div className="space-y-3 flex-1 w-full">
          {/* Protein */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-sans">
              <span className="font-semibold text-[#1C1326]">Protein</span>
              <span className="font-mono text-[#8D7E9E]">{data.proteinGrams}g / {data.proteinTarget}g</span>
            </div>
            <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
              <div
                className="h-full bg-[#8E3EAF] rounded-full"
                style={{ width: `${(data.proteinGrams / data.proteinTarget) * 100}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-sans">
              <span className="font-semibold text-[#1C1326]">Complex Carbs</span>
              <span className="font-mono text-[#8D7E9E]">{data.carbsGrams}g / {data.carbsTarget}g</span>
            </div>
            <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
              <div
                className="h-full bg-[#FB7185] rounded-full"
                style={{ width: `${(data.carbsGrams / data.carbsTarget) * 100}%` }}
              />
            </div>
          </div>

          {/* Healthy Fats */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-sans">
              <span className="font-semibold text-[#1C1326]">Healthy Fats</span>
              <span className="font-mono text-[#8D7E9E]">{data.fatGrams}g / {data.fatTarget}g</span>
            </div>
            <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
              <div
                className="h-full bg-[#34D399] rounded-full"
                style={{ width: `${(data.fatGrams / data.fatTarget) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Phase Meal Pill */}
      {data.suggestedMeals[0] && (
        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6E2D8B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
              Suggested: {data.suggestedMeals[0].name}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] font-bold">
              {data.suggestedMeals[0].culturalTag || 'Hormone Balanced'}
            </span>
          </div>
          <p className="text-[11px] text-[#584B68] leading-tight font-sans">
            {data.suggestedMeals[0].desc}
          </p>
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#F0EAF5] flex items-center justify-between">
        <Link
          to={ROUTES.APP.DIET}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors group"
        >
          <span>View Full Meal Plan</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>

        <span className="text-[10px] font-mono text-[#8D7E9E]">
          Roti • Daal • Rice • Chai
        </span>
      </div>
    </div>
  );
};
