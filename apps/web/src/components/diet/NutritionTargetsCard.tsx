import React from 'react';
import { Target, Flame, Info } from 'lucide-react';
import type { DailyNutritionTargets, FoodLogEntry, WaterLogEntry } from '../../types/diet';

interface NutritionTargetsCardProps {
  targets: DailyNutritionTargets;
  loggedFoods: FoodLogEntry[];
  waterLog: WaterLogEntry;
}

export const NutritionTargetsCard: React.FC<NutritionTargetsCardProps> = ({
  targets,
  loggedFoods,
  waterLog,
}) => {
  const totalCalories = loggedFoods.reduce((sum, l) => sum + (l.calories || 0), 0);
  const totalProtein = loggedFoods.reduce((sum, l) => sum + (l.proteinG || 0), 0);
  const totalCarbs = loggedFoods.reduce((sum, l) => sum + (l.carbsG || 0), 0);
  const totalFat = loggedFoods.reduce((sum, l) => sum + (l.fatG || 0), 0);
  const totalFiber = loggedFoods.reduce((sum, l) => sum + (l.fiberG || 0), 0);

  const calPercent = Math.min(100, Math.round((totalCalories / targets.calories) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / targets.proteinG) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / targets.carbsG) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / targets.fatG) * 100));
  const fiberPercent = Math.min(100, Math.round((totalFiber / targets.fiberG) * 100));

  // Balanced Score calculation (0-100)
  let balanceScore = 50;
  if (loggedFoods.length >= 3) balanceScore += 25;
  else if (loggedFoods.length >= 1) balanceScore += 12;

  if (waterLog.glasses >= 6) balanceScore += 20;
  else if (waterLog.glasses >= 4) balanceScore += 10;

  if (totalProtein >= targets.proteinG * 0.7) balanceScore += 5;

  const finalScore = Math.min(balanceScore, 96);

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm select-none text-left space-y-5">
      {/* Header & Balance Check-In Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F0FA]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold font-display text-[#1C1326]">
              Today’s Nutrition Check-In
            </h3>
          </div>
          <p className="text-xs text-[#584B68] leading-relaxed font-sans">
            Based on the foods and water you’ve logged today.
          </p>
        </div>

        {/* Balance Score Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#FAF5FF] to-[#FDF2F8] px-4 py-2 rounded-2xl border border-[#EDE4F7]">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E3EAF] block font-bold">
              Today’s Balance
            </span>
            <span className="text-xl font-extrabold font-display text-[#6E2D8B] leading-none">
              {finalScore} <span className="text-xs font-mono font-normal text-[#8D7E9E]">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Calories Gauge & Summary */}
      <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-[#1C1326] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Estimated Energy Target</span>
          </span>
          <span className="font-mono text-[#8E3EAF] font-bold">
            {totalCalories} / {targets.calories} kcal ({calPercent}%)
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-[#E7DFEF] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] rounded-full transition-all duration-500"
            style={{ width: `${calPercent}%` }}
          />
        </div>
      </div>

      {/* Granular Nutrient Progress Rows */}
      <div className="space-y-3">
        {/* Protein */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#1C1326]">
              Protein <span className="text-[10px] text-[#8D7E9E]">(Tissues & Satiety)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#1C1326]">
              {Math.round(totalProtein)}g <span className="text-[#8D7E9E] font-normal">/ {targets.proteinG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
            <div
              className="h-full bg-[#8E3EAF] rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* Complex Carbs */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#1C1326]">
              Complex Carbs <span className="text-[10px] text-[#8D7E9E]">(Steady Glucose)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#1C1326]">
              {Math.round(totalCarbs)}g <span className="text-[#8D7E9E] font-normal">/ {targets.carbsG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
            <div
              className="h-full bg-[#FB7185] rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Healthy Fats */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#1C1326]">
              Healthy Fats <span className="text-[10px] text-[#8D7E9E]">(Cellular Calm)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#1C1326]">
              {Math.round(totalFat)}g <span className="text-[#8D7E9E] font-normal">/ {targets.fatG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
            <div
              className="h-full bg-[#34D399] rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>

        {/* Fiber */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#1C1326]">
              Dietary Fiber <span className="text-[10px] text-[#8D7E9E]">(Digestive Motility)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#1C1326]">
              {Math.round(totalFiber)}g <span className="text-[#8D7E9E] font-normal">/ {targets.fiberG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
              style={{ width: `${fiberPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Educational Disclaimer Footer */}
      <div className="p-3 rounded-xl bg-[#FAF5FF] border border-[#EDE4F7] text-[11px] text-[#584B68] flex items-start gap-2 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-[#8E3EAF] shrink-0 mt-0.5" />
        <span>
          <strong>Estimated daily target:</strong> {targets.calculationRationale} These suggestions are educational guidance to support balanced eating.
        </span>
      </div>
    </div>
  );
};
