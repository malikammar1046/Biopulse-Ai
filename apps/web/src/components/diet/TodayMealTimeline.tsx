import React from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Coffee,
  Utensils,
  CupSoda,
  Moon,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { MealType, PlannedMeal, FoodLogEntry } from '../../types/diet';

interface TodayMealTimelineProps {
  meals: Record<MealType, PlannedMeal>;
  loggedLogs: FoodLogEntry[];
  onSelectMealDetail: (meal: PlannedMeal) => void;
  onQuickLogMeal: (meal: PlannedMeal) => void;
}

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  breakfast: <Sun className="w-4 h-4 text-[#F59E0B]" />,
  morning_snack: <Coffee className="w-4 h-4 text-[#8E3EAF]" />,
  lunch: <Utensils className="w-4 h-4 text-[#10B981]" />,
  afternoon_snack: <CupSoda className="w-4 h-4 text-[#EC4899]" />,
  dinner: <Moon className="w-4 h-4 text-[#6366F1]" />,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
};

export const TodayMealTimeline: React.FC<TodayMealTimelineProps> = ({
  meals,
  loggedLogs,
  onSelectMealDetail,
  onQuickLogMeal,
}) => {
  const mealKeys: MealType[] = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'];

  return (
    <div className="space-y-4 text-left select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold font-display text-[#1C1326]">
            Today’s Food Plan
          </h2>
        </div>

        <span className="text-xs font-mono text-[#584B68]">
          5 Balanced Food Touchpoints
        </span>
      </div>

      <div className="space-y-4">
        {mealKeys.map((mKey, index) => {
          const meal = meals[mKey];
          const isLogged = loggedLogs.some((l) => l.mealType === mKey);

          return (
            <motion.div
              key={meal.id || mKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 sm:p-6 rounded-[28px] bg-white border border-[#E7DFEF] hover:border-[#D8B4FE] shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
            >
              {/* Top Row: Meal Slot Name & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F0FA]">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">
                    {MEAL_ICONS[mKey]}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#8E3EAF]">
                        {MEAL_LABELS[mKey]}
                      </span>
                      {isLogged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Logged</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold font-display text-[#1C1326] mt-0.5">
                      {meal.title}
                    </h3>
                  </div>
                </div>

                {/* Macro summary pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#F8F5FA] text-[#1C1326] border border-[#E7DFEF]">
                    {meal.calories} kcal
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
                    {meal.proteinG}g Protein
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded-xl bg-[#FDF2F8] text-[#BE185D]">
                    {meal.fiberG}g Fiber
                  </span>
                </div>
              </div>

              {/* Middle Section: Food Items & Serving */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Items list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-[#8D7E9E] uppercase tracking-wider block">
                    Included Items & Portion
                  </span>
                  <ul className="space-y-1.5">
                    {meal.items.map((item, iIdx) => (
                      <li key={iIdx} className="text-xs text-[#2D213F] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8E3EAF] mt-1.5 shrink-0" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* "Why this may work for you" */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F8F5FA] to-[#FAF5FF] border border-[#E7DFEF] space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E2D8B] flex items-center gap-1">
                      <Info className="w-3 h-3 text-[#8E3EAF]" />
                      <span>Why this may work for you</span>
                    </span>
                    <p className="text-xs text-[#584B68] leading-relaxed font-sans">
                      {meal.whyItWorks}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-[10px] font-mono text-[#8D7E9E]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8E3EAF]" />
                      <span>~{meal.prepTimeMinutes} mins prep</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize">{meal.budgetCategory} budget</span>
                  </div>
                </div>
              </div>

              {/* Allergy Warning if applicable */}
              {!meal.isAllergySafe && meal.allergyWarning && (
                <div className="p-3 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[11px] text-[#9F1239] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
                  <span>{meal.allergyWarning}</span>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectMealDetail(meal)}
                  className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors cursor-pointer"
                >
                  View Ingredients & Simple Prep →
                </button>

                <button
                  type="button"
                  onClick={() => onQuickLogMeal(meal)}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-sans text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isLogged ? 'Log Another Serving' : `Log This ${MEAL_LABELS[mKey]}`}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
