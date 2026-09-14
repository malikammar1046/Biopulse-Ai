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
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#BAE6FD] shadow-none select-none text-left space-y-5">
      {/* Header & Balance Check-In Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#0F172A]">
              Today’s Nutrition Check-In
            </h3>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed font-sans">
            Based on the foods and water you’ve logged today.
          </p>
        </div>

        {/* Balance Score Badge */}
        <div className="flex items-center gap-3 bg-[#F0F9FF] px-4 py-2 rounded-xl border border-[#BAE6FD]">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0288D1] block font-bold">
              Today’s Balance
            </span>
            <span className="text-xl font-extrabold text-[#01579B] leading-none">
              {finalScore} <span className="text-xs font-mono font-normal text-[#64748B]">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Calories Gauge & Summary */}
      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#0288D1]" />
            <span>Estimated Energy Target</span>
          </span>
          <span className="font-mono text-[#0288D1] font-bold">
            {totalCalories} / {targets.calories} kcal ({calPercent}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
          <div
            className="h-full bg-[#0288D1] rounded-full transition-all duration-500"
            style={{ width: `${calPercent}%` }}
          />
        </div>
      </div>

      {/* Granular Nutrient Progress Rows */}
      <div className="space-y-3">
        {/* Protein */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#0F172A]">
              Protein <span className="text-[10px] text-[#64748B]">(Tissues & Satiety)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#0F172A]">
              {Math.round(totalProtein)}g <span className="text-[#64748B] font-normal">/ {targets.proteinG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full bg-[#0288D1] rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* Complex Carbs */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#0F172A]">
              Complex Carbs <span className="text-[10px] text-[#64748B]">(Steady Glucose)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#0F172A]">
              {Math.round(totalCarbs)}g <span className="text-[#64748B] font-normal">/ {targets.carbsG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full bg-[#0284C7] rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Healthy Fats */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#0F172A]">
              Healthy Fats <span className="text-[10px] text-[#64748B]">(Cellular Calm)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#0F172A]">
              {Math.round(totalFat)}g <span className="text-[#64748B] font-normal">/ {targets.fatG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full bg-[#059669] rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>

        {/* Fiber */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-medium text-[#0F172A]">
              Dietary Fiber <span className="text-[10px] text-[#64748B]">(Digestive Motility)</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#0F172A]">
              {Math.round(totalFiber)}g <span className="text-[#64748B] font-normal">/ {targets.fiberG}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full bg-[#D97706] rounded-full transition-all duration-500"
              style={{ width: `${fiberPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Educational Disclaimer Footer */}
      <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[11px] text-[#475569] flex items-start gap-2 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-[#0288D1] shrink-0 mt-0.5" />
        <span>
          <strong>Estimated daily target:</strong> {targets.calculationRationale} These suggestions are educational guidance to support balanced eating.
        </span>
      </div>
    </div>
  );
};
