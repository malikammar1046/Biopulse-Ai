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
  breakfast: <Sun className="w-4 h-4 text-amber-500" />,
  morning_snack: <Coffee className="w-4 h-4 text-[#0288D1]" />,
  lunch: <Utensils className="w-4 h-4 text-emerald-600" />,
  afternoon_snack: <CupSoda className="w-4 h-4 text-[#0288D1]" />,
  dinner: <Moon className="w-4 h-4 text-sky-600" />,
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
          <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-[#0F172A]">
            Today’s Food Plan
          </h2>
        </div>

        <span className="text-xs font-mono text-[#64748B]">
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
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[#BAE6FD] hover:border-[#0288D1] shadow-none transition-all space-y-4 relative overflow-hidden"
            >
              {/* Top Row: Meal Slot Name & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    {MEAL_ICONS[mKey]}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#0288D1]">
                        {MEAL_LABELS[mKey]}
                      </span>
                      {isLogged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Logged</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                      {meal.title}
                    </h3>
                  </div>
                </div>

                {/* Macro summary pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]">
                    {meal.calories} kcal
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded-xl bg-[#E0F2FE] text-[#01579B]">
                    {meal.proteinG}g Protein
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {meal.fiberG}g Fiber
                  </span>
                </div>
              </div>

              {/* Middle Section: Food Items & Serving */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Items list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider block">
                    Included Items & Portion
                  </span>
                  <ul className="space-y-1.5">
                    {meal.items.map((item, iIdx) => (
                      <li key={iIdx} className="text-xs text-[#334155] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1] mt-1.5 shrink-0" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* "Why this may work for you" */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0288D1] flex items-center gap-1">
                      <Info className="w-3 h-3 text-[#0288D1]" />
                      <span>Why this may work for you</span>
                    </span>
                    <p className="text-xs text-[#475569] leading-relaxed font-sans">
                      {meal.whyItWorks}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-[10px] font-mono text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#0288D1]" />
                      <span>~{meal.prepTimeMinutes} mins prep</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize">{meal.budgetCategory} budget</span>
                  </div>
                </div>
              </div>

              {/* Allergy Warning if applicable */}
              {!meal.isAllergySafe && meal.allergyWarning && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{meal.allergyWarning}</span>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectMealDetail(meal)}
                  className="text-xs font-semibold text-[#0288D1] hover:text-[#01579B] transition-colors cursor-pointer"
                >
                  View Ingredients & Simple Prep →
                </button>

                <button
                  type="button"
                  onClick={() => onQuickLogMeal(meal)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold font-sans text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
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
