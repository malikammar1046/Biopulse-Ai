import React from 'react';
import { motion } from 'framer-motion';
import {
  Sunrise,
  Sun,
  Scales01,
  Sunset,
  Moon01,
  Plus,
  CheckCircle,
  AlertTriangle,
  InfoCircle,
  Clock,
} from '@untitledui/icons';
import type { MealType, PlannedMeal, FoodLogEntry } from '../../types/diet';
import { useUserHealth } from '../../context/UserHealthContext';

interface TodayMealTimelineProps {
  meals: Record<MealType, PlannedMeal>;
  loggedLogs: FoodLogEntry[];
  onSelectMealDetail: (meal: PlannedMeal) => void;
  onQuickLogMeal: (meal: PlannedMeal) => void;
}

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  breakfast: <Sunrise className="w-4 h-4 text-amber-500" aria-hidden="true" />,
  morning_snack: <Sun className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
  lunch: <Scales01 className="w-4 h-4 text-emerald-600" aria-hidden="true" />,
  afternoon_snack: <Sunset className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
  dinner: <Moon01 className="w-4 h-4 text-sky-600" aria-hidden="true" />,
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
  const { userProfile } = useUserHealth();
  const isFemale = userProfile?.pathway !== 'male' && userProfile?.gender !== 'male';

  const mealKeys: MealType[] = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'];

  return (
    <div className="space-y-4 text-left select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Scales01 className={`w-5 h-5 shrink-0 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
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
          if (!meal) {
            return (
              <div
                key={mKey}
                className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] text-left space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-white border border-[#E2E8F0]">
                    {MEAL_ICONS[mKey]}
                  </span>
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#64748B]">
                    {MEAL_LABELS[mKey]}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] font-sans">
                  No recommendation available for this slot because candidate meals conflicted with your food allergy profile.
                </p>
              </div>
            );
          }
          const isLogged = loggedLogs.some((l) => l.mealType === mKey);

          return (
            <motion.div
              key={meal.id || mKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-5 sm:p-6 rounded-2xl bg-white border border-[#EAECF0] ${
                isFemale ? 'hover:border-[#F43F7D]/30' : 'hover:border-[#0288D1]'
              } shadow-xs transition-all space-y-4 relative overflow-hidden`}
            >
              {/* Top Row: Meal Slot Name & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    {MEAL_ICONS[mKey]}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-mono uppercase tracking-wider ${
                        isFemale ? 'text-[#DC326C]' : 'text-[#0288D1]'
                      }`}>
                        {MEAL_LABELS[mKey]}
                      </span>
                      {isLogged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" aria-hidden="true" />
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
                  <span className={`text-xs font-mono font-semibold px-2 py-1 rounded-xl ${
                    isFemale ? 'bg-[#FDE6EF] text-[#DC326C]' : 'bg-[#E0F2FE] text-[#01579B]'
                  }`}>
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
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          isFemale ? 'bg-[#F43F7D]' : 'bg-[#0288D1]'
                        }`} />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* "Why this may work for you" */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isFemale ? 'text-[#DC326C]' : 'text-[#0288D1]'
                    }`}>
                      <InfoCircle className={`w-3 h-3 ${isFemale ? 'text-[#DC326C]' : 'text-[#0288D1]'}`} aria-hidden="true" />
                      <span>Why this may work for you</span>
                    </span>
                    <p className="text-xs text-[#475569] leading-relaxed font-sans">
                      {meal.whyItWorks}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-[10px] font-mono text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <Clock className={`w-3 h-3 ${isFemale ? 'text-[#DC326C]' : 'text-[#0288D1]'}`} aria-hidden="true" />
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
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{meal.allergyWarning}</span>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectMealDetail(meal)}
                  className={`text-xs font-semibold transition-colors cursor-pointer ${
                    isFemale ? 'text-[#F43F7D] hover:text-[#DC326C]' : 'text-[#0288D1] hover:text-[#01579B]'
                  }`}
                >
                  View Ingredients & Simple Prep →
                </button>

                <button
                  type="button"
                  onClick={() => onQuickLogMeal(meal)}
                  className={`h-9 px-3.5 rounded-lg text-xs font-medium font-sans text-white ${
                    isFemale ? 'bg-[#F43F7D] hover:bg-[#DC326C]' : 'bg-[#0288D1] hover:bg-[#0277BD]'
                  } shadow-xs transition-all flex items-center gap-1.5 cursor-pointer`}
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
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
