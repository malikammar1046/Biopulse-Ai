import React, { useState, useEffect } from 'react';
import {
  Apple,
  Sparkles,
  Plus,
  Bell,
  RefreshCw,
  Lock,
  Unlock,
  Check,
  ChevronDown,
  ChevronUp,
  Utensils,
  Trash2,
  CheckCircle2,
  Flame,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type {
  NutritionPillar,
  RecommendationItem,
} from '../../types/lifestyle';
import type {
  FoodLogItem,
  SingleMeal,
  NutritionPlanSummary,
  NutritionReadiness,
} from '../../types/nutrition';
import { nutritionService } from '../../services/nutritionService';
import { useUserHealth } from '../../context/UserHealthContext';
import { RecommendationCard } from './RecommendationCard';
import { PlanGenerationWizardModal } from './PlanGenerationWizardModal';
import { LogMealModal } from './LogMealModal';
import { MealRemindersModal } from './MealRemindersModal';
import { MissingDataBanner } from './MissingDataBanner';
import { getMealImage } from '../../utils/lifestyleImages';
import { AIPersonalizedRecipeSection } from './AIPersonalizedRecipeSection';

interface NutritionPillarViewProps {
  nutrition?: NutritionPillar;
  recommendations: RecommendationItem[];
  recommendationsLoading?: boolean;
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
  recommendationsLoading: _recommendationsLoading = false,
  onSelectRecommendation,
  onUpdateStatus,
  isMale = false,
}) => {
  const { foodLogs: contextFoodLogs, userProfile } = useUserHealth();

  // Active Plan State
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState<boolean>(true);
  const [selectedDayName, setSelectedDayName] = useState<string>('Monday');
  const [expandedMealRole, setExpandedMealRole] = useState<string | null>(null);

  // Readiness State
  const [readiness, setReadiness] = useState<NutritionReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState<boolean>(true);

  // Food Logs State
  const [foodLogs, setFoodLogs] = useState<FoodLogItem[]>(() => {
    if (contextFoodLogs && contextFoodLogs.length > 0) {
      return contextFoodLogs.map((l) => ({
        id: l.id,
        user_id: l.userId,
        meal_type: l.mealType,
        food_name: l.foodName,
        serving: l.serving || '1 serving',
        portion_amount: 1,
        portion_unit: l.serving,
        calories: l.calories || 0,
        protein_g: l.proteinG || 0,
        carbs_g: l.carbsG || 0,
        fat_g: l.fatG || 0,
        logged_at: l.loggedAt,
      }));
    }
    return [];
  });
  const [logsLoading, setLogsLoading] = useState<boolean>(() => !contextFoodLogs || contextFoodLogs.length === 0);
  const [showFoodLogDrawer, setShowFoodLogDrawer] = useState<boolean>(false);

  // Plan History
  const [, setPlanHistory] = useState<NutritionPlanSummary[]>([]);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedMealForLog, setSelectedMealForLog] = useState<SingleMeal | null>(null);
  const [isRemindersOpen, setIsRemindersOpen] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Today's day name
  const todayDayName = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  // Sync context foodLogs into local state if initialized later
  useEffect(() => {
    if (contextFoodLogs && contextFoodLogs.length > 0 && foodLogs.length === 0) {
      setFoodLogs(
        contextFoodLogs.map((l) => ({
          id: l.id,
          user_id: l.userId,
          meal_type: l.mealType,
          food_name: l.foodName,
          serving: l.serving || '1 serving',
          portion_amount: 1,
          portion_unit: l.serving,
          calories: l.calories || 0,
          protein_g: l.proteinG || 0,
          carbs_g: l.carbsG || 0,
          fat_g: l.fatG || 0,
          logged_at: l.loggedAt,
        }))
      );
      setLogsLoading(false);
    }
  }, [contextFoodLogs]);

  // Concurrent independent fetches
  const loadData = async () => {
    setPlanLoading(true);
    setReadinessLoading(true);
    if (!contextFoodLogs || contextFoodLogs.length === 0) {
      setLogsLoading(true);
    }

    const [planRes, readinessRes, logsRes, histRes] = await Promise.allSettled([
      nutritionService.getCurrentPlan(),
      nutritionService.getReadiness(),
      contextFoodLogs && contextFoodLogs.length > 0 ? Promise.resolve(null) : nutritionService.fetchFoodLogs(),
      nutritionService.getPlanHistory(5),
    ]);

    if (planRes.status === 'fulfilled' && planRes.value) {
      const plan = planRes.value;
      setCurrentPlan(plan);
      if (plan && plan.days && plan.days.length > 0) {
        const hasToday = plan.days.some((d) => d.day_name.toLowerCase() === todayDayName.toLowerCase());
        setSelectedDayName(hasToday ? todayDayName : plan.days[0].day_name);
      }
    }
    setPlanLoading(false);

    if (readinessRes.status === 'fulfilled' && readinessRes.value) {
      setReadiness(readinessRes.value);
    }
    setReadinessLoading(false);

    if (logsRes.status === 'fulfilled' && logsRes.value) {
      setFoodLogs(logsRes.value);
    }
    setLogsLoading(false);

    if (histRes.status === 'fulfilled' && histRes.value) {
      setPlanHistory(histRes.value);
    }
  };

  useEffect(() => {
    loadData();
  }, [todayDayName]);

  // Handle Meal Locking
  const handleToggleLock = async (dayName: string, mealRole: string, currentlyLocked: boolean) => {
    if (!currentPlan) return;
    const actionKey = `lock-${dayName}-${mealRole}`;
    setActionInProgress(actionKey);
    try {
      const updated = await nutritionService.lockMeal(
        currentPlan.id,
        dayName,
        mealRole,
        !currentlyLocked
      );
      setCurrentPlan(updated);
    } catch (err: any) {
      console.error('Failed to toggle meal lock:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Meal Swapping
  const handleSwapMeal = async (dayName: string, mealRole: string) => {
    if (!currentPlan) return;
    const actionKey = `swap-${dayName}-${mealRole}`;
    setActionInProgress(actionKey);
    try {
      const updated = await nutritionService.swapMeal(
        currentPlan.id,
        dayName,
        mealRole
      );
      setCurrentPlan(updated);
    } catch (err: any) {
      console.error('Failed to swap meal:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Regenerate Day
  const handleRegenerateDay = async (dayName: string) => {
    if (!currentPlan) return;
    setActionInProgress(`regen-day-${dayName}`);
    try {
      const updated = await nutritionService.regenerateDay(currentPlan.id, dayName);
      setCurrentPlan(updated);
    } catch (err: any) {
      console.error('Failed to regenerate day:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Food Log Deletion
  const handleDeleteFoodLog = async (logId?: string) => {
    if (!logId) return;
    try {
      await nutritionService.deleteFoodLog(logId);
      setFoodLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (err) {
      console.error('Failed to delete food log:', err);
    }
  };

  // Selected Day Data
  const selectedDay = currentPlan?.days?.find(
    (d: any) => d.day_name.toLowerCase() === selectedDayName.toLowerCase()
  ) || currentPlan?.days?.[0];

  // Today's Logs & Calculations
  const todayLogs = foodLogs.filter((l) => {
    if (!l.logged_at) return false;
    const logDate = new Date(l.logged_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return logDate >= today;
  });

  const loggedTotals = todayLogs.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein_g || 0),
      carbs: acc.carbs + (item.carbs_g || 0),
      fat: acc.fat + (item.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Targets
  const planTargets = (currentPlan?.targets || {}) as Record<string, any>;
  const targetCalories =
    Number(planTargets.energy_kcal || planTargets.daily_calories_kcal || nutrition?.daily_targets?.daily_calories_kcal || 1650);
  const targetProtein =
    typeof planTargets.protein_g === 'object' && planTargets.protein_g !== null
      ? Number(planTargets.protein_g.max || planTargets.protein_g.min || 110)
      : Number(planTargets.protein_g || nutrition?.daily_targets?.protein?.grams || 110);
  const targetCarbs =
    typeof planTargets.carbohydrate_g === 'object' && planTargets.carbohydrate_g !== null
      ? Number(planTargets.carbohydrate_g.max || planTargets.carbohydrate_g.min || 135)
      : Number(planTargets.carbohydrate_g || nutrition?.daily_targets?.carbohydrates?.grams || 135);
  const targetFat =
    typeof planTargets.fat_g === 'object' && planTargets.fat_g !== null
      ? Number(planTargets.fat_g.max || planTargets.fat_g.min || 55)
      : Number(planTargets.fat_g || nutrition?.daily_targets?.fats?.grams || 55);

  const primaryBtnClass = isMale
    ? 'bg-[#0868B9] hover:bg-[#07599c] text-white'
    : 'bg-[#0E9EAA] hover:bg-[#0b828c] text-white';

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* ── 1. NUTRITION PRECISION & TARGET STRIP ── */}
      <section className="rounded-3xl bg-white border border-[#E2EEF4] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-teal-50 text-[#0E9EAA]'
              }`}
            >
              <Apple className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F]">
                  Clinical Nutrition Intelligence
                </span>
                {currentPlan?.is_active && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0E9EAA] border border-teal-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Active Protocol
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#073B72]">
                Daily Fuel & Macro Precision
              </h2>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${primaryBtnClass}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{currentPlan ? 'Customize 7-Day Plan' : 'Generate 7-Day Plan'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMealForLog(null);
                setIsLogModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition bg-white border border-[#D7EAF2] text-[#073B72] hover:bg-slate-50 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#20B486]" />
              <span>Log Meal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRemindersOpen(true)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-[#073B72] bg-white border border-[#D7EAF2] hover:bg-slate-50 cursor-pointer shadow-xs transition"
              title="Meal Reminders"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Missing Data Guidance */}
        {readinessLoading ? (
          <div className="h-10 rounded-2xl bg-slate-100 animate-pulse" />
        ) : readiness ? (
          <MissingDataBanner
            readiness={readiness}
            isMale={isMale}
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        ) : null}

        {/* 4 Clean Glassmorphic Macro Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {/* Energy Target */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Daily Energy
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {Math.round(loggedTotals.calories)} / {Math.round(targetCalories)} kcal
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#073B72] font-mono">
              ~{Math.round(targetCalories)} <span className="text-xs font-normal text-slate-500">kcal</span>
            </div>
            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (loggedTotals.calories / (targetCalories || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Protein Target */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Protein</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {Math.round(loggedTotals.protein)}g / {Math.round(targetProtein)}g
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#073B72] font-mono">
              {Math.round(targetProtein)}<span className="text-xs font-normal text-slate-500">g</span>
            </div>
            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0E9EAA] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (loggedTotals.protein / (targetProtein || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Complex Carbohydrates Target */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Complex Carbs</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {Math.round(loggedTotals.carbs)}g / {Math.round(targetCarbs)}g
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#073B72] font-mono">
              {Math.round(targetCarbs)}<span className="text-xs font-normal text-slate-500">g</span>
            </div>
            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className={`${isMale ? 'bg-sky-500' : 'bg-[#F43F7D]'} h-full rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, (loggedTotals.carbs / (targetCarbs || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Healthy Fats Target */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Healthy Fats</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {Math.round(loggedTotals.fat)}g / {Math.round(targetFat)}g
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#073B72] font-mono">
              {Math.round(targetFat)}<span className="text-xs font-normal text-slate-500">g</span>
            </div>
            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (loggedTotals.fat / (targetFat || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. DAILY MEAL SCHEDULE WITH CULINARY VISUALS ── */}
      <section className="space-y-6">
        {/* Day of Week Selector */}
        {currentPlan?.days && currentPlan.days.length > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {currentPlan.days.map((day: any) => {
                const isSelected = selectedDay?.day_name.toLowerCase() === day.day_name.toLowerCase();
                const isToday = day.day_name.toLowerCase() === todayDayName.toLowerCase();
                return (
                  <button
                    key={day.day_name}
                    type="button"
                    onClick={() => setSelectedDayName(day.day_name)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? isMale
                          ? 'bg-[#0868B9] text-white border-[#0868B9] shadow-sm'
                          : 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-sm'
                        : 'bg-white border-[#E2EEF4] text-slate-600 hover:text-[#073B72] hover:bg-slate-50'
                    }`}
                  >
                    <span>{day.day_name.slice(0, 3)}</span>
                    {isToday && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-[#0E9EAA]'
                        }`}
                      >
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <button
                type="button"
                disabled={actionInProgress === `regen-day-${selectedDay.day_name}`}
                onClick={() => handleRegenerateDay(selectedDay.day_name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#D7EAF2] text-[#073B72] hover:bg-slate-50 cursor-pointer shadow-xs transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    actionInProgress === `regen-day-${selectedDay.day_name}` ? 'animate-spin' : ''
                  }`}
                />
                <span>Regenerate Day</span>
              </button>
            )}
          </div>
        )}

        {/* Visual Meal Cards Grid */}
        {planLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-slate-100 animate-pulse border border-[#E2EEF4]" />
            ))}
          </div>
        ) : selectedDay?.meals && selectedDay.meals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedDay.meals.map((meal: any) => {
              const isLocked = Boolean(meal.is_locked);
              const isExpanded = expandedMealRole === meal.role;
              const isActionBusy =
                actionInProgress === `lock-${selectedDay.day_name}-${meal.role}` ||
                actionInProgress === `swap-${selectedDay.day_name}-${meal.role}`;
              const visual = getMealImage(meal.role, meal.title);

              return (
                <div
                  key={meal.role}
                  className="rounded-3xl bg-white border border-[#E2EEF4] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* High-Resolution Culinary Photography Banner */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 group">
                      <img
                        src={visual.url}
                        alt={visual.alt}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken image and reveal gradient fallback
                          (e.target as HTMLElement).style.opacity = '0';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                      {/* Floating Role Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#073B72] shadow-sm">
                          {meal.role}
                        </span>
                        {isLocked && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                      </div>

                      {/* Energy Badge */}
                      {meal.energy_kcal && (
                        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                          ~{Math.round(meal.energy_kcal)} kcal
                        </div>
                      )}
                    </div>

                    {/* Meal Body */}
                    <div className="p-6 space-y-3.5">
                      {/* Dish Title */}
                      <h3 className="text-lg font-bold text-[#073B72] leading-snug">
                        {meal.title}
                      </h3>

                      {/* Hormonal & Metabolic Benefit Chip */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          isMale
                            ? 'bg-sky-50 text-[#0868B9] border-sky-200'
                            : 'bg-teal-50 text-[#0E9EAA] border-teal-100'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {isMale
                            ? 'Metabolic Vitality • Balanced Nutrition'
                            : 'Low Glycemic Impact • Steady Energy'}
                        </span>
                      </div>

                      {/* Macro Breakdown Strip */}
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 pt-1">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100">
                          P: {Math.round(meal.protein_g)}g
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100">
                          C: {Math.round(meal.carbohydrate_g)}g
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100">
                          F: {Math.round(meal.fat_g)}g
                        </span>
                      </div>

                      {/* Ingredients Pills */}
                      {meal.items && meal.items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {meal.items.map((item: any, iIdx: number) => (
                            <span
                              key={iIdx}
                              className="text-xs px-2.5 py-1 rounded-xl bg-[#F7FBFC] border border-[#E2EEF4] text-slate-700 font-medium"
                            >
                              {item.display_name} ({item.standard_portion || `${item.grams}g`})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Clinical Rationale Accordion */}
                      <button
                        type="button"
                        onClick={() => setExpandedMealRole(isExpanded ? null : meal.role)}
                        className={`text-xs font-semibold flex items-center gap-1 pt-2 cursor-pointer ${
                          isMale ? 'text-[#0868B9] hover:text-[#07599c]' : 'text-[#0E9EAA] hover:text-[#0b828c]'
                        }`}
                      >
                        <span>Why this meal for your biology?</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="p-3.5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] text-xs text-slate-700 leading-relaxed animate-fadeIn">
                          {isMale
                            ? `Formulated to meet your ${Math.round(meal.energy_kcal)} kcal target with quality protein and essential micronutrients supporting metabolic health and vitality.`
                            : `Formulated to meet your ${Math.round(meal.energy_kcal)} kcal target with complex fiber and high satiety proteins to support hormone balance and insulin regulation.`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isActionBusy}
                        onClick={() => handleToggleLock(selectedDay.day_name, meal.role, isLocked)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isLocked
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-[#E2EEF4] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                        title={isLocked ? 'Unlock meal' : 'Lock meal from regeneration'}
                      >
                        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        disabled={isActionBusy}
                        onClick={() => handleSwapMeal(selectedDay.day_name, meal.role)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2EEF4] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition shadow-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isMale ? 'text-[#0868B9]' : 'text-[#0E9EAA]'}`} />
                        <span>Swap</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMealForLog(meal);
                        setIsLogModalOpen(true);
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${primaryBtnClass}`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Log as Eaten</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback when no plan active: render clinical meal concepts */
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-[#E2EEF4] text-center space-y-4 shadow-sm">
              <Sparkles className={`w-8 h-8 mx-auto ${isMale ? 'text-[#0868B9]' : 'text-[#0E9EAA]'}`} />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-[#073B72]">Personalized 7-Day Protocol Ready to Generate</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generate your clinical 7-day culinary roadmap grounded in verified macro floors and blood glucose stability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold shadow-md transition cursor-pointer ${primaryBtnClass}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate My 7-Day Plan</span>
              </button>
            </div>

            {nutrition?.meal_concepts && nutrition.meal_concepts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nutrition.meal_concepts.map((concept, cIdx) => {
                  const visual = getMealImage(concept.meal_type, concept.title);
                  return (
                    <div
                      key={cIdx}
                      className="rounded-3xl bg-white border border-[#E2EEF4] overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                          <img
                            src={visual.url}
                            alt={concept.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 text-[#073B72]">
                            {concept.meal_type}
                          </div>
                        </div>
                        <div className="p-6 space-y-2.5">
                          <h4 className="text-base font-bold text-[#073B72]">{concept.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{concept.description}</p>
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                              isMale
                                ? 'bg-sky-50 text-[#0868B9] border-sky-200'
                                : 'bg-teal-50 text-[#0E9EAA] border-teal-100'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{concept.hormonal_benefit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 2B. DEDICATED AI PERSONALIZED RECIPE GENERATION ── */}
      <AIPersonalizedRecipeSection
        isMale={isMale}
        pathway={isMale ? 'androsense' : 'ovasense'}
        userDietaryPreference={userProfile?.lifestyle?.dietaryPreference}
        userAllergens={userProfile?.medical?.allergies}
        hasBiometrics={Boolean(userProfile?.heightCm && userProfile?.weightKg)}
      />

      {/* ── 3. SMART FOOD SWAPS ── */}
      {nutrition?.targeted_swaps && nutrition.targeted_swaps.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#073B72]">High-Impact Food Swaps</h3>
              <p className="text-xs text-slate-500">Simple substitutions with verified hormonal impact</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nutrition.targeted_swaps.map((swap, sIdx) => (
              <div
                key={sIdx}
                className="p-6 rounded-3xl bg-white border border-[#E2EEF4] shadow-sm space-y-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F]">
                    Target: {swap.trigger_factor}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {swap.impact_level} Impact
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold flex-1 line-through decoration-rose-400">
                    {swap.replace_food}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold flex-1">
                    {swap.recommended_alternative}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  <strong className="text-[#073B72]">Mechanism: </strong>
                  {swap.clinical_mechanism}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. QUIET COLLAPSIBLE FOOD LOG (Eliminates Screen Clutter) ── */}
      <section className="rounded-3xl bg-white border border-[#E2EEF4] p-5 sm:p-6 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowFoodLogDrawer(!showFoodLogDrawer)}
          className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#073B72]">
                Today&apos;s Meal Logs ({todayLogs.length} items logged)
              </h4>
              <p className="text-xs text-slate-500">
                {logsLoading ? 'Loading logs...' : 'Click to view, review or remove logged items'}
              </p>
            </div>
          </div>
          {showFoodLogDrawer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showFoodLogDrawer && (
          <div className="pt-4 border-t border-slate-100 space-y-2 animate-fadeIn">
            {todayLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No meals logged today yet. Use "+ Log Meal" or "Log as Eaten" on your meals above.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#073B72] capitalize">{log.meal_type}: </span>
                      <span className="font-medium text-slate-700">{log.food_name}</span>
                      <span className="text-slate-400 ml-1.5">({log.serving})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.calories && (
                        <span className="font-mono text-slate-600">~{Math.round(log.calories)} kcal</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteFoodLog(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 5. CLINICAL NUTRITION RECOMMENDATIONS ── */}
      {recommendations && recommendations.filter((r) => r.category === 'nutrition').length > 0 && (
        <section className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-[#073B72]">Evidence-Based Nutrition Priorities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendations
              .filter((r) => r.category === 'nutrition')
              .map((rec) => (
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

      {/* ── MODALS ── */}
      <PlanGenerationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onPlanGenerated={(newPlan) => {
          setCurrentPlan(newPlan);
          setSelectedDayName('Monday');
          loadData();
        }}
        isMale={isMale}
      />

      <LogMealModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onFoodLogged={(newLog) => {
          setFoodLogs([newLog, ...foodLogs]);
          loadData();
        }}
        plannedMeal={selectedMealForLog}
      />

      <MealRemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
      />
    </div>
  );
};
