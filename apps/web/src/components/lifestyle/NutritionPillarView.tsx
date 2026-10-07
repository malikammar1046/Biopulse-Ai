import React, { useState, useEffect } from 'react';
import {
  Apple,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Utensils,
  Plus,
  Lock,
  Unlock,
  RefreshCw,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  History,
} from 'lucide-react';
import type {
  NutritionPillar,
  RecommendationItem,
} from '../../types/lifestyle';
import type {
  WeeklyNutritionPlan,
  NutritionReadiness,
  FoodLogItem,
  SingleMeal,
  NutritionPlanSummary,
} from '../../types/nutrition';
import { nutritionService } from '../../services/nutritionService';
import { useUserHealth } from '../../context/UserHealthContext';
import { RecommendationCard } from './RecommendationCard';
import { MissingDataBanner } from './MissingDataBanner';
import { PlanGenerationWizardModal } from './PlanGenerationWizardModal';
import { LogMealModal } from './LogMealModal';
import { MealRemindersModal } from './MealRemindersModal';

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
  recommendationsLoading = false,
  onSelectRecommendation,
  onUpdateStatus,
  isMale = false,
}) => {
  const { foodLogs: contextFoodLogs } = useUserHealth();

  // Plan State
  const [currentPlan, setCurrentPlan] = useState<WeeklyNutritionPlan | null>(null);
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
  const [logFilter, setLogFilter] = useState<'today' | 'yesterday' | 'week'>('today');

  // Plan History State
  const [planHistory, setPlanHistory] = useState<NutritionPlanSummary[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Modals State
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedMealForLog, setSelectedMealForLog] = useState<SingleMeal | null>(null);
  const [isRemindersOpen, setIsRemindersOpen] = useState<boolean>(false);
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Determine today's day name (e.g. 'Monday', 'Tuesday')
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

  // Fetch initial data concurrently with independent section resolution
  const loadData = async () => {
    setPlanLoading(true);
    setReadinessLoading(true);
    if (!contextFoodLogs || contextFoodLogs.length === 0) {
      setLogsLoading(true);
    }

    const [planRes, readinessRes, logsRes, histRes] = await Promise.allSettled([
      nutritionService.getCurrentPlan(),
      nutritionService.getReadiness(),
      contextFoodLogs && contextFoodLogs.length > 0
        ? Promise.resolve(null)
        : nutritionService.fetchFoodLogs(),
      nutritionService.getPlanHistory(5),
    ]);

    // 1. Current Plan result
    if (planRes.status === 'fulfilled' && planRes.value) {
      const plan = planRes.value;
      setCurrentPlan(plan);
      if (plan && plan.days && plan.days.length > 0) {
        const hasToday = plan.days.some((d) => d.day_name.toLowerCase() === todayDayName.toLowerCase());
        setSelectedDayName(hasToday ? todayDayName : plan.days[0].day_name);
      }
    } else if (planRes.status === 'rejected') {
      console.warn('Error loading current nutrition plan:', planRes.reason);
    }
    setPlanLoading(false);

    // 2. Readiness result
    if (readinessRes.status === 'fulfilled' && readinessRes.value) {
      setReadiness(readinessRes.value);
    } else if (readinessRes.status === 'rejected') {
      console.warn('Error checking readiness:', readinessRes.reason);
    }
    setReadinessLoading(false);

    // 3. Food Logs result
    if (logsRes.status === 'fulfilled' && logsRes.value) {
      setFoodLogs(logsRes.value);
    } else if (logsRes.status === 'rejected') {
      console.warn('Error fetching food logs:', logsRes.reason);
    }
    setLogsLoading(false);

    // 4. Plan History result
    if (histRes.status === 'fulfilled' && histRes.value) {
      setPlanHistory(histRes.value);
    } else if (histRes.status === 'rejected') {
      console.warn('Error fetching plan history:', histRes.reason);
    }
  };

  useEffect(() => {
    loadData();
  }, [todayDayName]);

  // Handle Meal Locking
  const handleToggleLock = async (dayName: string, mealType: string, currentlyLocked: boolean) => {
    if (!currentPlan) return;
    const actionKey = `lock-${dayName}-${mealType}`;
    setActionInProgress(actionKey);
    try {
      const updated = await nutritionService.lockMeal(
        currentPlan.id,
        dayName,
        mealType,
        !currentlyLocked
      );
      setCurrentPlan(updated);
    } catch (err: any) {
      console.error('Failed to toggle meal lock:', err);
      alert(err?.message || 'Could not update meal lock.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Meal Swapping
  const handleSwapMeal = async (dayName: string, mealType: string) => {
    if (!currentPlan) return;
    const actionKey = `swap-${dayName}-${mealType}`;
    setActionInProgress(actionKey);
    try {
      const updated = await nutritionService.swapMeal(
        currentPlan.id,
        dayName,
        mealType
      );
      setCurrentPlan(updated);
    } catch (err: any) {
      console.error('Failed to swap meal:', err);
      alert(err?.message || 'Could not swap meal.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Regenerate Day
  const handleRegenerateDay = async (dayName: string) => {
    if (!currentPlan) return;
    if (!confirm(`Regenerate unlocked meals for ${dayName}? Locked meals will be preserved.`)) return;

    setActionInProgress(`regen-day-${dayName}`);
    try {
      const updated = await nutritionService.regenerateDay(currentPlan.id, dayName);
      setCurrentPlan(updated);
    } catch (err: any) {
      console.error('Failed to regenerate day:', err);
      alert(err?.message || 'Failed to regenerate day.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Regenerate Full Week
  const handleRegenerateWeek = async () => {
    if (!confirm('Regenerate your 7-day meal plan? Locked meals will remain locked.')) return;
    setActionInProgress('regen-week');
    try {
      const updated = await nutritionService.regeneratePlan();
      setCurrentPlan(updated);
    } catch (err: any) {
      console.error('Failed to regenerate week plan:', err);
      alert(err?.message || 'Failed to regenerate meal plan.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Save & Start Plan
  const handleActivatePlan = async (startDateChoice: 'today' | 'next_monday') => {
    if (!currentPlan) return;
    setIsSavingPlan(true);
    try {
      let startDateStr: string;
      const now = new Date();
      if (startDateChoice === 'today') {
        startDateStr = now.toISOString().slice(0, 10);
      } else {
        const dayOfWeek = now.getDay();
        const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
        const nextMonday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
        startDateStr = nextMonday.toISOString().slice(0, 10);
      }

      const updated = await nutritionService.updatePlanStatus(
        currentPlan.id,
        'active',
        startDateStr
      );
      setCurrentPlan(updated);
      alert('Your 7-day meal plan is now active! Log your meals daily to track adherence.');
    } catch (err: any) {
      console.error('Failed to activate plan:', err);
      alert(err?.message || 'Failed to activate meal plan.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Handle Food Log Deletion
  const handleDeleteFoodLog = async (logId?: string) => {
    if (!logId) return;
    if (!confirm('Delete this food log entry?')) return;
    try {
      await nutritionService.deleteFoodLog(logId);
      setFoodLogs(foodLogs.filter((l) => l.id !== logId));
    } catch (err: any) {
      console.error('Failed to delete food log:', err);
      alert('Could not delete log.');
    }
  };

  // Selected Day Data
  const selectedDay = currentPlan?.days.find(
    (d) => d.day_name.toLowerCase() === selectedDayName.toLowerCase()
  ) || currentPlan?.days[0];

  // Filtered Food Logs
  const filteredLogs = foodLogs.filter((l) => {
    if (!l.logged_at) return true;
    const logDate = new Date(l.logged_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (logFilter === 'today') {
      return logDate >= today;
    }
    if (logFilter === 'yesterday') {
      const yest = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return logDate >= yest && logDate < today;
    }
    // week
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return logDate >= weekAgo;
  });

  // Calculate Today's Logged Macros
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

  // Targets from plan or lifestyle
  const planTargets = (currentPlan?.targets || {}) as Record<string, any>;
  const targetCalories =
    Number(planTargets.energy_kcal || planTargets.daily_calories_kcal || nutrition?.daily_targets?.daily_calories_kcal || 0);
  const targetProtein =
    typeof planTargets.protein_g === 'object' && planTargets.protein_g !== null
      ? Number(planTargets.protein_g.max || planTargets.protein_g.min || 0)
      : Number(planTargets.protein_g || nutrition?.daily_targets?.protein?.grams || 0);
  const targetCarbs =
    typeof planTargets.carbohydrate_g === 'object' && planTargets.carbohydrate_g !== null
      ? Number(planTargets.carbohydrate_g.max || planTargets.carbohydrate_g.min || 0)
      : Number(planTargets.carbohydrate_g || nutrition?.daily_targets?.carbohydrates?.grams || 0);
  const targetFat =
    typeof planTargets.fat_g === 'object' && planTargets.fat_g !== null
      ? Number(planTargets.fat_g.max || planTargets.fat_g.min || 0)
      : Number(planTargets.fat_g || nutrition?.daily_targets?.fats?.grams || 0);

  // Planned meals completed count for today
  const plannedMealCount = selectedDay?.meals?.length || 4;
  const plannedLoggedCount = Math.min(todayLogs.length, plannedMealCount);

  const primaryBtnClass = isMale
    ? 'bg-[#0868B9] hover:bg-[#07599c] text-white'
    : 'bg-[#0E9EAA] hover:bg-[#0b828c] text-white';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── 1. HEADER & PRIMARY ACTIONS (Phase 2) ── */}
      <section className="rounded-3xl bg-white border border-[#D7EAF2] p-6 sm:p-8 space-y-6 shadow-xs">
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
                  BioPulse Nutrition Intelligence
                </span>
                {currentPlan?.is_active && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0E9EAA] border border-teal-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Active Plan
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#073B72]">
                Nutrition & 7-Day Meal Plan
              </h1>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${primaryBtnClass}`}
            >
              <Sparkles className="w-4 h-4" />
              {currentPlan ? 'Update / Regenerate Plan' : 'Generate My 7-Day Plan'}
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
              Log Meal
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

        {/* Structured Missing Data Banner (Phase 1 & 19: No false age/SHAP warnings) */}
        {readinessLoading ? (
          <div className="h-10 rounded-2xl bg-slate-100 animate-pulse" />
        ) : readiness ? (
          <MissingDataBanner
            readiness={readiness}
            isMale={isMale}
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        ) : null}
      </section>

      {/* ── 2. ACTIVE 7-DAY MEAL PLAN (Phase 6, 10, 11, 12) ── */}
      {planLoading && !currentPlan ? (
        <section className="rounded-3xl border border-[#D7EAF2] bg-white p-6 sm:p-8 space-y-5 animate-pulse shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-200/80 rounded-md" />
              <div className="h-3.5 w-64 bg-slate-100 rounded-md" />
            </div>
            <div className="h-8 w-28 bg-slate-100 rounded-xl" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="h-9 w-16 bg-slate-100 rounded-xl shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-50 border border-[#D7EAF2]/60 rounded-2xl p-4 space-y-2">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-44 bg-slate-100 rounded" />
                <div className="h-3 w-36 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </section>
      ) : currentPlan ? (
        <section className="space-y-5">
          {/* Plan Status Bar & Controls */}
          <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0E9EAA]" />
                <h2 className="text-base font-bold text-[#073B72]">
                  {currentPlan.is_active ? 'Your Active 7-Day Plan' : 'Plan Preview (Not yet activated)'}
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {currentPlan.start_date} to {currentPlan.end_date}
                </span>
              </div>
              <p className="text-xs text-[#55718F] mt-0.5">
                Ground in authentic Pakistani and cultural foods, calibrated to your clinical targets.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!currentPlan.is_active && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingPlan}
                    onClick={() => handleActivatePlan('today')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${primaryBtnClass}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save & Start Today
                  </button>
                  <button
                    type="button"
                    disabled={isSavingPlan}
                    onClick={() => handleActivatePlan('next_monday')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#D7EAF2] text-[#073B72] hover:bg-slate-50 cursor-pointer"
                  >
                    Start Next Monday
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={actionInProgress === 'regen-week'}
                onClick={handleRegenerateWeek}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#D7EAF2] text-[#073B72] hover:bg-slate-50 cursor-pointer"
                title="Regenerates unlocked meals for all 7 days"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${actionInProgress === 'regen-week' ? 'animate-spin' : ''}`}
                />
                Regenerate Week
              </button>

              {planHistory.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#D7EAF2] text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  History
                </button>
              )}
            </div>
          </div>

          {/* Plan History Drawer */}
          {showHistory && (
            <div className="p-4 rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-2 animate-fadeIn text-xs">
              <span className="font-bold text-[#073B72] block uppercase tracking-wider text-[10px]">
                Historical Plan Snapshots
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {planHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl bg-white border border-[#D7EAF2] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {h.start_date} - {h.end_date}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">{h.status}</div>
                    </div>
                    {h.is_active && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Horizontal Day Tabs (Phase 28: Mobile Responsive) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {currentPlan.days.map((day) => {
              const isSelected = selectedDay?.day_name.toLowerCase() === day.day_name.toLowerCase();
              const isToday = day.day_name.toLowerCase() === todayDayName.toLowerCase();
              return (
                <button
                  key={day.day_name}
                  type="button"
                  onClick={() => setSelectedDayName(day.day_name)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? isMale
                        ? 'bg-[#0868B9] text-white border-[#0868B9] shadow-xs'
                        : 'bg-[#0E9EAA] text-white border-[#0E9EAA] shadow-xs'
                      : 'bg-white border-[#D7EAF2] text-[#55718F] hover:text-[#073B72] hover:bg-slate-50'
                  }`}
                >
                  <span>{day.day_name}</span>
                  {isToday && (
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isMale
                          ? 'bg-sky-100 text-[#0868B9]'
                          : 'bg-teal-100 text-[#0E9EAA]'
                      }`}
                    >
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day View Header */}
          {selectedDay && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#073B72]">
                    {selectedDay.day_name} Planned Meals
                  </h3>
                  <p className="text-xs text-[#55718F]">
                    {selectedDay.energy_kcal ? `~${Math.round(selectedDay.energy_kcal)} kcal` : ''} • Protein:{' '}
                    {Math.round(selectedDay.protein_g)}g • Carbs: {Math.round(selectedDay.carbohydrate_g)}g •
                    Fat: {Math.round(selectedDay.fat_g)}g
                  </p>
                </div>

                <button
                  type="button"
                  disabled={actionInProgress === `regen-day-${selectedDay.day_name}`}
                  onClick={() => handleRegenerateDay(selectedDay.day_name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#D7EAF2] text-[#073B72] hover:bg-slate-50 cursor-pointer shadow-xs"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      actionInProgress === `regen-day-${selectedDay.day_name}` ? 'animate-spin' : ''
                    }`}
                  />
                  Regenerate {selectedDay.day_name}
                </button>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDay.meals.map((meal) => {
                  const isLocked = Boolean(meal.is_locked);
                  const isExpanded = expandedMealRole === meal.role;
                  const isActionBusy =
                    actionInProgress === `lock-${selectedDay.day_name}-${meal.role}` ||
                    actionInProgress === `swap-${selectedDay.day_name}-${meal.role}`;

                  return (
                    <div
                      key={meal.role}
                      className="rounded-2xl bg-white border border-[#D7EAF2] p-5 space-y-3.5 shadow-xs flex flex-col justify-between hover:border-[#16B8C4]/40 transition"
                    >
                      <div className="space-y-2.5">
                        {/* Meal Role & Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#55718F]">
                              {meal.role}
                            </span>
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-600" />
                                Locked
                              </span>
                            )}
                          </div>
                          {meal.energy_kcal && (
                            <span className="text-xs font-mono font-bold text-[#073B72] bg-slate-100 px-2.5 py-0.5 rounded-full">
                              ~{Math.round(meal.energy_kcal)} kcal
                            </span>
                          )}
                        </div>

                        {/* Dish Title */}
                        <h4 className="text-base font-bold text-[#073B72] leading-snug">
                          {meal.title}
                        </h4>

                        {/* Macros & Items Preview */}
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                          <span>P: {Math.round(meal.protein_g)}g</span>
                          <span>•</span>
                          <span>C: {Math.round(meal.carbohydrate_g)}g</span>
                          <span>•</span>
                          <span>F: {Math.round(meal.fat_g)}g</span>
                        </div>

                        {/* Key Ingredients */}
                        {meal.items && meal.items.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {meal.items.map((item, iIdx) => (
                              <span
                                key={iIdx}
                                className="text-[11px] px-2 py-0.5 rounded-lg bg-[#F5FBFD] border border-[#D7EAF2] text-slate-700"
                              >
                                {item.display_name} ({item.standard_portion || `${item.grams}g`})
                              </span>
                            ))}
                          </div>
                        )}

                        {/* "Why this meal?" Explainability Accordion (Phase 30) */}
                        <button
                          type="button"
                          onClick={() => setExpandedMealRole(isExpanded ? null : meal.role)}
                          className="text-[11px] font-semibold text-[#0E9EAA] hover:text-[#0b828c] flex items-center gap-1 pt-1"
                        >
                          <span>Why this meal?</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-3 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-xs text-slate-700 space-y-1.5 animate-fadeIn">
                            <p>
                              <strong>Clinical & Cultural Grounding:</strong> Formulated to meet your{' '}
                              {Math.round(meal.energy_kcal)} kcal target and {Math.round(meal.protein_g)}g protein goal
                              with low glycemic impact.
                            </p>
                            {meal.items[0]?.recipe_note && (
                              <p className="text-[11px] text-slate-500 italic">
                                Note: {meal.items[0].recipe_note}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons (Lock, Swap, Log as Eaten) */}
                      <div className="pt-3 border-t border-[#D7EAF2]/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* Lock Button */}
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleToggleLock(selectedDay.day_name, meal.role, isLocked)}
                            className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                              isLocked
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-white border-[#D7EAF2] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            title={isLocked ? 'Unlock meal' : 'Lock meal (protects against regeneration)'}
                          >
                            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Swap Button */}
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleSwapMeal(selectedDay.day_name, meal.role)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#D7EAF2] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition"
                            title="Swap with a validated safe alternative"
                          >
                            <RefreshCw className="w-3 h-3 text-[#16B8C4]" />
                            <span>Swap</span>
                          </button>
                        </div>

                        {/* 1-Click Log as Eaten (Phase 3 & 8) */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMealForLog(meal);
                            setIsLogModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${primaryBtnClass}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Log as Eaten</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Empty Plan State (Phase 29) */
        <section className="rounded-3xl bg-white border border-[#D7EAF2] p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-teal-50 text-[#0E9EAA] flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-bold text-[#073B72]">
              Build your personalized 7-day meal plan
            </h3>
            <p className="text-xs sm:text-sm text-[#55718F] leading-relaxed">
              Personalized around your metabolic data, clinical risk tier, and authentic Pakistani
              dishes. Fully editable with one-click meal swaps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${primaryBtnClass}`}
          >
            <Sparkles className="w-4 h-4" />
            Generate My 7-Day Plan
          </button>
        </section>
      )}

      {/* ── 3. TODAY'S TARGETS VS LOGGED INTAKE & ADHERENCE (Phase 14 & 15) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#073B72]">
              Today's Targets vs Actual Intake
            </h3>
            <p className="text-xs text-[#55718F]">
              Real nutrition comparisons based on authoritative logged entries. No fake precision.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800">
              {plannedLoggedCount} of {plannedMealCount} planned meals logged today
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Energy */}
          <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#55718F] block">
              Energy (Calories)
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#073B72]">
              {Math.round(loggedTotals.calories)}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {targetCalories ? `${Math.round(targetCalories)} kcal` : 'target pending'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#0E9EAA] h-full transition-all"
                style={{
                  width: `${Math.min(100, targetCalories ? (loggedTotals.calories / targetCalories) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>

          {/* Protein */}
          <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#073B72] block">
              Protein
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#073B72]">
              {Math.round(loggedTotals.protein)}g{' '}
              <span className="text-xs font-normal text-slate-500">
                / {targetProtein ? `${Math.round(targetProtein)}g` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#073B72] h-full transition-all"
                style={{
                  width: `${Math.min(100, targetProtein ? (loggedTotals.protein / targetProtein) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
              Carbohydrates
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-800">
              {Math.round(loggedTotals.carbs)}g{' '}
              <span className="text-xs font-normal text-slate-500">
                / {targetCarbs ? `${Math.round(targetCarbs)}g` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-500 h-full transition-all"
                style={{
                  width: `${Math.min(100, targetCarbs ? (loggedTotals.carbs / targetCarbs) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>

          {/* Fats */}
          <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">
              Healthy Fats
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-800">
              {Math.round(loggedTotals.fat)}g{' '}
              <span className="text-xs font-normal text-slate-500">
                / {targetFat ? `${Math.round(targetFat)}g` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-rose-500 h-full transition-all"
                style={{
                  width: `${Math.min(100, targetFat ? (loggedTotals.fat / targetFat) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. MEAL LOG HISTORY (Phase 3 & 25) ── */}
      <section className="rounded-3xl bg-white border border-[#D7EAF2] p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#073B72]">
              Meal Log History
            </h3>
            <p className="text-xs text-[#55718F]">
              Authoritative records saved to your longitudinal health timeline.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F5FBFD] p-1 rounded-xl border border-[#D7EAF2]">
            {(['today', 'yesterday', 'week'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setLogFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                  logFilter === filter
                    ? 'bg-white text-[#073B72] shadow-xs'
                    : 'text-[#55718F] hover:text-[#073B72]'
                }`}
              >
                {filter === 'week' ? 'Past 7 Days' : filter}
              </button>
            ))}
          </div>
        </div>

        {logsLoading ? (
          <div className="p-6 rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] text-center space-y-1.5 animate-pulse">
            <Utensils className="w-6 h-6 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500">Loading meals...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] text-center space-y-1.5">
            <Utensils className="w-6 h-6 mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-700">No meals logged for this period</p>
            <p className="text-[11px] text-[#55718F]">
              Click "+ Log Meal" above or "Log as Eaten" on your planned meals.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/60 rounded-xl px-2 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#073B72] capitalize">{log.meal_type}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-800">{log.food_name}</span>
                    <span className="text-slate-500">({log.serving})</span>
                  </div>
                  {log.notes && <p className="text-[11px] text-slate-500">{log.notes}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {log.calories && (
                    <span className="font-mono text-slate-600 font-medium">
                      ~{Math.round(log.calories)} kcal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteFoodLog(log.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 5. TARGETED FOOD SWAPS (Preserved from Lifestyle Architecture) ── */}
      {nutrition?.targeted_swaps && nutrition.targeted_swaps.length > 0 && (
        <section aria-labelledby="food-swaps-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="food-swaps-title" className="text-lg font-bold text-[#073B72]">
                Smart Food Swaps
              </h3>
              <p className="text-xs text-[#55718F]">
                Evidence-aligned substitutions to stabilize glucose and support hormone balance
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

      {/* ── 6. SPECIFIC NUTRITION ACTIONS & RECOMMENDATIONS ── */}
      {recommendationsLoading && (!recommendations || recommendations.filter((r) => r.category === 'nutrition').length === 0) ? (
        <section aria-labelledby="nutrition-recs-title" className="space-y-4 pt-4 border-t border-[#D7EAF2]">
          <div className="h-5 w-52 bg-slate-200/80 rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-50 border border-[#D7EAF2] p-5 space-y-3 animate-pulse">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-4/5 bg-slate-100 rounded" />
                <div className="h-3 w-3/5 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </section>
      ) : recommendations && recommendations.filter((r) => r.category === 'nutrition').length > 0 ? (
        <section aria-labelledby="nutrition-recs-title" className="space-y-4 pt-4 border-t border-[#D7EAF2]">
          <h3 id="nutrition-recs-title" className="text-lg font-bold text-[#073B72]">
            Evidence-Based Lifestyle Priorities
          </h3>
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
      ) : null}

      {/* ── MODALS ── */}
      {/* 1. Plan Generation 5-Step Wizard */}
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

      {/* 2. Log Meal Modal (Planned or Custom) */}
      <LogMealModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onFoodLogged={(newLog) => {
          setFoodLogs([newLog, ...foodLogs]);
          loadData();
        }}
        plannedMeal={selectedMealForLog}
        dayName={selectedDay?.day_name}
        isMale={isMale}
      />

      {/* 3. Meal Reminders Modal */}
      <MealRemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        isMale={isMale}
      />
    </div>
  );
};
