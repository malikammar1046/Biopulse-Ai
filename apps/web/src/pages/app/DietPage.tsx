import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Utensils,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import type { MealType, PlannedMeal, BuildMealResult } from '../../types/diet';
import { PersonalizedDietHeader } from '../../components/diet/PersonalizedDietHeader';
import { TodayMealTimeline } from '../../components/diet/TodayMealTimeline';
import { WaterTrackerWidget } from '../../components/diet/WaterTrackerWidget';
import { NutritionTargetsCard } from '../../components/diet/NutritionTargetsCard';
import { FoodLogModal } from '../../components/diet/FoodLogModal';
import { MealBuilderModal } from '../../components/diet/MealBuilderModal';
import { MealDetailModal } from '../../components/diet/MealDetailModal';
import { WeeklyDietView } from '../../components/diet/WeeklyDietView';
import { ROUTES } from '../../constants/routes';

export const DietPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    userProfile,
    snapshotMetrics,
    foodLogs,
    waterLog,
    dailyNutritionTargets,
    dailyMealPlan,
    logFoodItem,
    deleteFoodLogItem,
    incrementWater,
    decrementWater,
    openAiChatWithPrompt,
  } = useUserHealth();

  // Tab State (Today's Plan vs Weekly Overview)
  const isWeeklyView = location.pathname.endsWith('/week');

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalMealType, setLogModalMealType] = useState<MealType>('breakfast');
  const [logModalFoodName, setLogModalFoodName] = useState<string>('');

  const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<PlannedMeal | null>(null);

  const handleOpenLogForMeal = (meal: PlannedMeal) => {
    setLogModalMealType(meal.mealType);
    setLogModalFoodName(meal.title);
    setIsLogModalOpen(true);
  };

  const handleOpenGeneralLog = () => {
    setLogModalMealType('lunch');
    setLogModalFoodName('');
    setIsLogModalOpen(true);
  };

  const handleLoggedFromBuilder = async (meal: BuildMealResult) => {
    await logFoodItem({
      mealType: meal.mealType,
      foodName: meal.title,
      serving: meal.servingGuidance,
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      fiberG: meal.fiberG,
      notes: meal.whyItWasSuggested,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-16"
    >
      {/* ── 1. PERSONALIZED HEADER ── */}
      <PersonalizedDietHeader
        userProfile={userProfile}
        cycleStageName={snapshotMetrics.phaseName}
        symptomNotice={dailyMealPlan.symptomNotice}
        onOpenLogFood={handleOpenGeneralLog}
        onOpenMealBuilder={() => setIsMealBuilderOpen(true)}
        onAskAi={() =>
          openAiChatWithPrompt(
            `Suggest a hormone-friendly Pakistani meal aligned with my ${userProfile.lifestyle?.dietaryPreference || 'diet'} and ${snapshotMetrics.phaseName}`
          )
        }
      />

      {/* ── 2. TAB NAVIGATION (Today's Plan vs 7-Day Week) ── */}
      <div className="flex items-center justify-between gap-4 p-1.5 rounded-2xl bg-white border border-[#E7DFEF] shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.DIET)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              !isWeeklyView
                ? 'bg-[#6E2D8B] text-white shadow-sm'
                : 'text-[#584B68] hover:text-[#1C1326] hover:bg-[#FAF5FF]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Today’s Food & Nutrition</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/diet/week')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              isWeeklyView
                ? 'bg-[#6E2D8B] text-white shadow-sm'
                : 'text-[#584B68] hover:text-[#1C1326] hover:bg-[#FAF5FF]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>7-Day Weekly Trends</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenGeneralLog}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#6E2D8B] hover:bg-[#EDE4F7] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Log</span>
        </button>
      </div>

      {/* ── 3. MAIN CONTENT: TODAY'S PLAN vs WEEKLY VIEW ── */}
      {!isWeeklyView ? (
        <div className="space-y-6">
          {/* Top Row: Nutrition Targets & Water Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <NutritionTargetsCard
                targets={dailyNutritionTargets}
                loggedFoods={foodLogs}
                waterLog={waterLog}
              />
            </div>
            <div className="lg:col-span-5">
              <WaterTrackerWidget
                waterLog={waterLog}
                onIncrement={incrementWater}
                onDecrement={decrementWater}
              />
            </div>
          </div>

          {/* Middle Section: Today's 5-Meal Structured Timeline */}
          <TodayMealTimeline
            meals={dailyMealPlan.meals}
            loggedLogs={foodLogs}
            onSelectMealDetail={(meal) => setSelectedMealForDetail(meal)}
            onQuickLogMeal={handleOpenLogForMeal}
          />

          {/* Bottom Section: Today's Logged Foods Summary */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold font-display text-[#1C1326]">
                  Today’s Logged Items ({foodLogs.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={handleOpenGeneralLog}
                className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            {foodLogs.length > 0 ? (
              <div className="divide-y divide-[#F5F0FA] border border-[#E7DFEF] rounded-2xl overflow-hidden bg-white">
                {foodLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5FF] transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-[#EDE4F7] text-[#6E2D8B]">
                          {log.mealType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-[#1C1326]">
                          {log.foodName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8D7E9E]">
                        Portion: {log.serving} {log.notes && `• Note: ${log.notes}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-[#1C1326]">{log.calories} kcal</span>
                        <span className="text-[#8D7E9E]">({log.proteinG}g Protein)</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteFoodLogItem(log.id)}
                        className="p-1.5 rounded-lg text-[#8D7E9E] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#D8B4FE] text-center space-y-2">
                <Utensils className="w-6 h-6 text-[#8E3EAF] mx-auto" />
                <p className="text-xs text-[#584B68]">
                  No meals logged yet today. Tap <strong>+ Log Food</strong> or choose an item from the plan above.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── WEEKLY TRENDS VIEW ── */
        <WeeklyDietView userId={userProfile.id || 'default'} />
      )}

      {/* ── MODALS ── */}
      {/* 1. Food Log Modal */}
      <FoodLogModal
        isOpen={isLogModalOpen}
        initialMealType={logModalMealType}
        initialFoodName={logModalFoodName}
        onClose={() => setIsLogModalOpen(false)}
        onSaveLog={logFoodItem}
      />

      {/* 2. "Build My Meal" Generator Modal */}
      <MealBuilderModal
        isOpen={isMealBuilderOpen}
        userPreference={userProfile.lifestyle?.dietaryPreference}
        userAllergies={userProfile.medical?.allergies}
        onClose={() => setIsMealBuilderOpen(false)}
        onSelectAndLog={handleLoggedFromBuilder}
      />

      {/* 3. Recipe Detail Modal */}
      <MealDetailModal
        meal={selectedMealForDetail}
        isOpen={Boolean(selectedMealForDetail)}
        onClose={() => setSelectedMealForDetail(null)}
        onLogMeal={handleOpenLogForMeal}
      />
    </motion.div>
  );
};

export default DietPage;
