import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Scales01,
  Calendar,
  Plus,
  Trash01,
  CheckCircle,
  Sliders01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import type { MealType, PlannedMeal, BuildMealResult, DailyNutritionTargets } from '../../types/diet';
import { PersonalizedDietHeader } from '../../components/diet/PersonalizedDietHeader';
import { TodayMealTimeline } from '../../components/diet/TodayMealTimeline';
import { WaterTrackerWidget } from '../../components/diet/WaterTrackerWidget';
import { NutritionTargetsCard } from '../../components/diet/NutritionTargetsCard';
import { FoodLogModal } from '../../components/diet/FoodLogModal';
import { MealBuilderModal } from '../../components/diet/MealBuilderModal';
import { MealDetailModal } from '../../components/diet/MealDetailModal';
import { WeeklyDietView } from '../../components/diet/WeeklyDietView';
import { NutritionReadinessBanner } from '../../components/diet/NutritionReadinessBanner';
import { NutritionPreferencesModal } from '../../components/diet/NutritionPreferencesModal';
import { nutritionService } from '../../services/nutritionService';
import type { NutritionReadiness, NutritionTargets, WeeklyNutritionPlan } from '../../types/nutrition';

export const DietPage: React.FC = () => {
  const location = useLocation();

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

  const isMale = userProfile?.pathway === 'male' || userProfile?.gender === 'male';
  const isFemale = !isMale;

  // Tab State: Default to 'plan' (7-Day Pakistani Meal Plan) for both /app/diet and /app/diet/week
  const [activeTab, setActiveTab] = useState<'plan' | 'logging'>(() =>
    location.pathname.endsWith('/log') ? 'logging' : 'plan'
  );

  // Nutrition engine state
  const [readiness, setReadiness] = useState<NutritionReadiness | null>(null);
  const [activePlan, setActivePlan] = useState<WeeklyNutritionPlan | null>(null);
  const [backendTargets, setBackendTargets] = useState<NutritionTargets | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchNutritionEngineState = async () => {
      setLoadingReadiness(true);
      try {
        const [readinessRes, planRes, targetsRes] = await Promise.allSettled([
          nutritionService.getReadiness(),
          nutritionService.getCurrentPlan(),
          nutritionService.getTargets(),
        ]);
        if (isMounted) {
          if (readinessRes.status === 'fulfilled') {
            setReadiness(readinessRes.value);
          }
          if (planRes.status === 'fulfilled') {
            setActivePlan(planRes.value);
          }
          if (targetsRes.status === 'fulfilled') {
            setBackendTargets(targetsRes.value);
          }
        }
      } catch (err) {
        console.warn('Error fetching nutrition state:', err);
      } finally {
        if (isMounted) setLoadingReadiness(false);
      }
    };

    fetchNutritionEngineState();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute effective targets calibrated from backend Phase 5A targets or active plan
  const effectiveTargets: DailyNutritionTargets = useMemo(() => {
    if (activePlan?.targets) {
      return {
        calories: Math.round(activePlan.targets.energy_kcal),
        proteinG: Math.round(activePlan.targets.protein_g.min),
        carbsG: Math.round(activePlan.targets.carbohydrate_g.min),
        fatG: Math.round(activePlan.targets.fat_g.min),
        fiberG: 25,
        waterGlasses: dailyNutritionTargets.waterGlasses || 8,
        isCustomOrEstimated: true,
        calculationRationale: 'Calibrated via BioPulse Phase 5A targets and 7-day meal plan',
      };
    }
    if (backendTargets) {
      return {
        calories: Math.round(backendTargets.energy_kcal),
        proteinG: Math.round(backendTargets.protein_g.min),
        carbsG: Math.round(backendTargets.carbohydrate_g.min),
        fatG: Math.round(backendTargets.fat_g.min),
        fiberG: 25,
        waterGlasses: dailyNutritionTargets.waterGlasses || 8,
        isCustomOrEstimated: false,
        calculationRationale: 'Calibrated from metabolic baseline recommendations',
      };
    }
    return dailyNutritionTargets;
  }, [activePlan, backendTargets, dailyNutritionTargets]);

  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalMealType, setLogModalMealType] = useState<MealType>('breakfast');
  const [logModalFoodName, setLogModalFoodName] = useState<string>('');

  const [isMealBuilderOpen, setIsMealBuilderOpen] = useState(false);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<PlannedMeal | null>(null);

  const handlePreferencesUpdated = async () => {
    try {
      const r = await nutritionService.getReadiness();
      setReadiness(r);
    } catch {
      // ignore
    }
  };

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
        cycleStageName={isMale ? undefined : snapshotMetrics.phaseName}
        symptomNotice={dailyMealPlan.symptomNotice}
        onOpenLogFood={handleOpenGeneralLog}
        onOpenMealBuilder={() => setIsMealBuilderOpen(true)}
        onAskAi={() =>
          openAiChatWithPrompt(
            isMale
              ? `Suggest a hormone-friendly Pakistani meal aligned with my ${userProfile.lifestyle?.dietaryPreference || 'diet'} for metabolic and energy support.`
              : `Suggest a hormone-friendly Pakistani meal aligned with my ${userProfile.lifestyle?.dietaryPreference || 'diet'} and ${snapshotMetrics.phaseName}`
          )
        }
      />

      {/* ── 1.1 READINESS / SAFETY BANNER ── */}
      <NutritionReadinessBanner
        readiness={readiness}
        loading={loadingReadiness}
      />

      {/* ── 2. TAB NAVIGATION (7-Day Plan vs Daily Log) ── */}
      <div className="flex items-center justify-between gap-4 p-1.5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`h-9 px-4 rounded-lg text-xs font-medium font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'plan'
                ? isFemale
                  ? 'bg-[#F43F7D] text-white shadow-xs'
                  : 'bg-[#29B6F6] text-white shadow-xs'
                : isFemale
                ? 'text-[#475569] hover:text-[#0F172A] hover:bg-[#FDE6EF]/50'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F9FF]'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>7-Day Nutrition Plan</span>
            {activePlan && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logging')}
            className={`h-9 px-4 rounded-lg text-xs font-medium font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logging'
                ? isFemale
                  ? 'bg-[#F43F7D] text-white shadow-xs'
                  : 'bg-[#29B6F6] text-white shadow-xs'
                : isFemale
                ? 'text-[#475569] hover:text-[#0F172A] hover:bg-[#FDE6EF]/50'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F9FF]'
            }`}
          >
            <Scales01 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Daily Meals & Tracking</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreferencesModalOpen(true)}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isFemale
                ? 'text-[#DC326C] bg-[#FDE6EF] border border-[#F43F7D]/20 hover:bg-[#FDE6EF]/80'
                : 'text-[#0288D1] bg-[#F0F9FF] border border-[#BAE6FD] hover:bg-[#E0F2FE]'
            }`}
          >
            <Sliders01 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Preferences & Safety</span>
          </button>

          <button
            type="button"
            onClick={handleOpenGeneralLog}
            className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isFemale
                ? 'text-[#F43F7D] hover:bg-[#FDE6EF]/50'
                : 'text-[#0288D1] hover:bg-[#E0F2FE]'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Quick Log</span>
          </button>
        </div>
      </div>

      {/* ── 3. MAIN CONTENT: 7-DAY PLAN vs DAILY LOGGING ── */}
      {activeTab === 'plan' ? (
        <div className="space-y-6">
          {/* Primary 7-Day Plan Engine (handles LOADING, READY_NO_PLAN, GENERATING, PLAN_READY, BEST_AVAILABLE_WITH_DEVIATIONS, API_ERROR) */}
          <WeeklyDietView
            userId={userProfile.id || 'default'}
            onPlanGenerated={(newPlan) => setActivePlan(newPlan)}
          />

          {/* Calibrated Nutrition Targets Card & Water Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <NutritionTargetsCard
                targets={effectiveTargets}
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

          {/* Today's Logged Items Summary */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAECF0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle className={`w-5 h-5 shrink-0 ${isFemale ? 'text-[#F43F7D]' : 'text-[#29B6F6]'}`} aria-hidden="true" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Today’s Logged Items ({foodLogs.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={handleOpenGeneralLog}
                className={`text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                  isFemale ? 'text-[#F43F7D] hover:text-[#DC326C]' : 'text-[#0288D1] hover:text-[#0277BD]'
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>+ Add Item</span>
              </button>
            </div>

            {foodLogs.length > 0 ? (
              <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                {foodLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md ${
                          isFemale ? 'bg-[#FDE6EF] text-[#DC326C]' : 'bg-[#E0F2FE] text-[#01579B]'
                        }`}>
                          {log.mealType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-[#0F172A]">
                          {log.foodName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Portion: {log.serving} {log.notes && `• Note: ${log.notes}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-[#0F172A]">{log.calories} kcal</span>
                        <span className="text-[#64748B]">({log.proteinG}g Protein)</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteFoodLogItem(log.id)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete log entry"
                        aria-label="Delete log entry"
                      >
                        <Trash01 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-[#F8FAFC] border border-dashed border-[#EAECF0] text-center space-y-2">
                <Scales01 className={`w-8 h-8 mx-auto shrink-0 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
                <p className="text-xs text-[#475569]">
                  No meals logged yet today. Tap <strong>+ Log Food</strong> or choose an item from the plan above.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── DAILY TRACKING TIMELINE & LOG VIEW ── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <NutritionTargetsCard
                targets={effectiveTargets}
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

          <TodayMealTimeline
            meals={dailyMealPlan.meals}
            loggedLogs={foodLogs}
            onSelectMealDetail={(meal) => setSelectedMealForDetail(meal)}
            onQuickLogMeal={handleOpenLogForMeal}
          />

          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAECF0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle className={`w-5 h-5 shrink-0 ${isFemale ? 'text-[#F43F7D]' : 'text-[#29B6F6]'}`} aria-hidden="true" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Today’s Logged Items ({foodLogs.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={handleOpenGeneralLog}
                className={`text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                  isFemale ? 'text-[#F43F7D] hover:text-[#DC326C]' : 'text-[#0288D1] hover:text-[#0277BD]'
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>+ Add Item</span>
              </button>
            </div>

            {foodLogs.length > 0 ? (
              <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                {foodLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md ${
                          isFemale ? 'bg-[#FDE6EF] text-[#DC326C]' : 'bg-[#E0F2FE] text-[#01579B]'
                        }`}>
                          {log.mealType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-[#0F172A]">
                          {log.foodName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Portion: {log.serving} {log.notes && `• Note: ${log.notes}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-[#0F172A]">{log.calories} kcal</span>
                        <span className="text-[#64748B]">({log.proteinG}g Protein)</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteFoodLogItem(log.id)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete log entry"
                        aria-label="Delete log entry"
                      >
                        <Trash01 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-[#F8FAFC] border border-dashed border-[#EAECF0] text-center space-y-2">
                <Scales01 className={`w-8 h-8 mx-auto shrink-0 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
                <p className="text-xs text-[#475569]">
                  No meals logged yet today. Tap <strong>+ Log Food</strong> or choose an item from the plan above.
                </p>
              </div>
            )}
          </div>
        </div>
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

      {/* 4. Nutrition Preferences & Safety Modal */}
      <NutritionPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        onPreferencesUpdated={handlePreferencesUpdated}
      />
    </motion.div>
  );
};

export default DietPage;
