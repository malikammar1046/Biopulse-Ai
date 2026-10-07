import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Apple,
  Calendar,
  Sparkles,
  Plus,
  RefreshCw,
  Bell,
  History,
  ShieldCheck,
  Flame,
  CheckCircle2,
  ChevronRight,
  Send,
  Utensils,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { nutritionService } from '../../services/nutritionService';
import type {
  WeeklyNutritionPlan,
  NutritionReadiness,
  NutritionTargets,
  SingleMeal,
  FoodLogEntry,
  PlanAdherenceSummary,
  NutritionReminderPreferences,
  NutritionPreferences,
  MealType,
} from '../../types/nutrition';

import { NutritionWizardModal } from '../../components/nutrition/NutritionWizardModal';
import { LogMealModal } from '../../components/nutrition/LogMealModal';
import { MealSwapModal } from '../../components/nutrition/MealSwapModal';
import { NutritionRemindersModal } from '../../components/nutrition/NutritionRemindersModal';
import { PlanHistoryModal } from '../../components/nutrition/PlanHistoryModal';
import { MealCard } from '../../components/nutrition/MealCard';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const NutritionPage: React.FC = () => {
  const { userProfile } = useUserHealth();
  const isMale = userProfile?.pathway === 'male' || userProfile?.gender === 'male';

  // Core Data States
  const [readiness, setReadiness] = useState<NutritionReadiness | null>(null);
  const [_targets, setTargets] = useState<NutritionTargets | null>(null);
  const [currentPlan, setCurrentPlan] = useState<WeeklyNutritionPlan | null>(null);
  const [preferences, setPreferences] = useState<NutritionPreferences | null>(null);
  const [reminders, setReminders] = useState<NutritionReminderPreferences | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [adherence, setAdherence] = useState<{
    today: PlanAdherenceSummary;
    week: PlanAdherenceSummary & { days_engaged: number; days_total: number };
  } | null>(null);

  // UI Navigation States
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    // Default to today's day of week (1=Mon, 7=Sun)
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  });
  const [logFilterTab, setLogFilterTab] = useState<'today' | 'yesterday' | 'week'>('today');

  // AI Modification Bar State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiModifying, setAiModifying] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Modals
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [showRemindersModal, setShowRemindersModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [swapMealTarget, setSwapMealTarget] = useState<SingleMeal | null>(null);

  // Regenerating states
  const [regeneratingDay, setRegeneratingDay] = useState<boolean>(false);
  const [regeneratingPlan, setRegeneratingPlan] = useState<boolean>(false);

  // Accent Styles
  const accentColor = isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]';

  // ─── Fetch All Nutrition Context ──────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [readinessRes, targetsRes, planRes, prefsRes, logsRes, adherenceRes, remRes] =
        await Promise.allSettled([
          nutritionService.getReadiness(),
          nutritionService.getTargets(),
          nutritionService.getCurrentPlan(),
          nutritionService.getPreferences(),
          nutritionService.getMealLogs(),
          nutritionService.getAdherence(),
          nutritionService.getReminders(),
        ]);

      if (readinessRes.status === 'fulfilled') setReadiness(readinessRes.value);
      if (targetsRes.status === 'fulfilled') setTargets(targetsRes.value);
      if (planRes.status === 'fulfilled') setCurrentPlan(planRes.value);
      if (prefsRes.status === 'fulfilled') setPreferences(prefsRes.value);
      if (logsRes.status === 'fulfilled') setFoodLogs(logsRes.value.entries || []);
      if (adherenceRes.status === 'fulfilled') setAdherence(adherenceRes.value);
      if (remRes.status === 'fulfilled') setReminders(remRes.value);
    } catch (err: any) {
      console.error('Failed to load nutrition data:', err);
      setError('Unable to load nutrition intelligence.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Today's Date helpers
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Filtered food logs
  const filteredFoodLogs = useMemo(() => {
    if (logFilterTab === 'today') {
      return foodLogs.filter((l) => l.logged_at.startsWith(todayStr));
    }
    if (logFilterTab === 'yesterday') {
      return foodLogs.filter((l) => l.logged_at.startsWith(yesterdayStr));
    }
    return foodLogs;
  }, [foodLogs, logFilterTab, todayStr, yesterdayStr]);

  // Today's total logged calories & macros
  const todayTotals = useMemo(() => {
    const todays = foodLogs.filter((l) => l.logged_at.startsWith(todayStr));
    let kcal = 0;
    let prot = 0;
    let carbs = 0;
    let fat = 0;
    todays.forEach((l) => {
      if (l.calories) kcal += l.calories;
      if (l.protein_g) prot += l.protein_g;
      if (l.carbs_g) carbs += l.carbs_g;
      if (l.fat_g) fat += l.fat_g;
    });
    return {
      kcal: Math.round(kcal),
      prot: Math.round(prot),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      count: todays.length,
    };
  }, [foodLogs, todayStr]);

  // Check if a specific meal role was logged today
  const isMealRoleLoggedToday = useCallback(
    (role: string) => {
      const roleLower = role.toLowerCase();
      return foodLogs.some(
        (l) => l.logged_at.startsWith(todayStr) && l.meal_type.toLowerCase() === roleLower
      );
    },
    [foodLogs, todayStr]
  );

  // Selected Day Plan
  const selectedDayPlan = useMemo(() => {
    if (!currentPlan?.days) return null;
    return (
      currentPlan.days.find((d) => d.day_index === selectedDayIndex) ||
      currentPlan.days[0]
    );
  }, [currentPlan, selectedDayIndex]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  // Generate / Regenerate Full 7-Day Plan
  const handleGeneratePlan = async (prefsOverride: Partial<NutritionPreferences>) => {
    try {
      if (Object.keys(prefsOverride).length > 0) {
        await nutritionService.updatePreferences(prefsOverride);
      }
      const newPlan = await nutritionService.generateWeeklyPlan();
      setCurrentPlan(newPlan);
      await fetchAllData();
    } catch (err: any) {
      console.error('Plan generation error:', err);
      throw err;
    }
  };

  const handleRegenerateWholeWeek = async () => {
    setRegeneratingPlan(true);
    try {
      const refreshed = await nutritionService.regeneratePlan();
      setCurrentPlan(refreshed);
      await fetchAllData();
    } catch (err) {
      console.error('Regenerate week error:', err);
    } finally {
      setRegeneratingPlan(false);
    }
  };

  // Regenerate Single Day (Preserves Locked Meals!)
  const handleRegenerateDay = async () => {
    if (!currentPlan) return;
    setRegeneratingDay(true);
    try {
      const res = await nutritionService.regenerateDay(currentPlan.id, selectedDayIndex);
      if (res?.plan_data && currentPlan) {
        setCurrentPlan({
          ...currentPlan,
          days: res.plan_data.days || currentPlan.days,
        });
      } else {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to regenerate day:', err);
    } finally {
      setRegeneratingDay(false);
    }
  };

  // Mark Planned Meal as Eaten (Authoritative food_logs record)
  const handleMarkAsEaten = async (meal: SingleMeal) => {
    if (!currentPlan) return;
    await nutritionService.markMealAsEaten({
      meal_type: meal.role.toLowerCase(),
      food_name: meal.title,
      plan_id: currentPlan.id,
      day_index: selectedDayIndex,
      calories: meal.energy_kcal,
      protein_g: meal.protein_g,
      carbs_g: meal.carbohydrate_g,
      fat_g: meal.fat_g,
      portion_description: 'Planned portion',
    });
    // Refresh food logs and adherence
    const logsRes = await nutritionService.getMealLogs();
    setFoodLogs(logsRes.entries || []);
    const adhRes = await nutritionService.getAdherence();
    setAdherence(adhRes);
  };

  // Custom Log Meal Submission
  const handleLogCustomMeal = async (data: {
    meal_type: MealType;
    food_name: string;
    portion_description?: string;
    logged_at?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    notes?: string;
  }) => {
    await nutritionService.logMeal(data);
    const logsRes = await nutritionService.getMealLogs();
    setFoodLogs(logsRes.entries || []);
    const adhRes = await nutritionService.getAdherence();
    setAdherence(adhRes);
  };

  // Meal Lock / Unlock
  const handleToggleMealLock = async (mealRole: string, locked: boolean) => {
    if (!currentPlan) return;
    await nutritionService.lockMeal(currentPlan.id, selectedDayIndex, mealRole, locked);
    // Optimistically update currentPlan in memory
    setCurrentPlan((prev) => {
      if (!prev) return null;
      const nextDays = prev.days.map((d) => {
        if (d.day_index !== selectedDayIndex) return d;
        const nextMeals = d.meals.map((m) => {
          if (m.role.toUpperCase() !== mealRole.toUpperCase()) return m;
          return { ...m, is_locked: locked };
        });
        return { ...d, meals: nextMeals };
      });
      return { ...prev, days: nextDays };
    });
  };

  // Meal Swap
  const handleSwapMeal = async (
    planId: string,
    dayIndex: number,
    mealRole: string,
    customDish?: string
  ) => {
    const res = await nutritionService.swapMeal(planId, dayIndex, mealRole, customDish);
    if (res?.plan_data && currentPlan) {
      setCurrentPlan({
        ...currentPlan,
        days: res.plan_data.days || currentPlan.days,
      });
    } else {
      await fetchAllData();
    }
  };

  // AI Companion Natural Language Modification
  const handleAiModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !currentPlan) return;
    setAiModifying(true);
    setAiMessage(null);
    try {
      const res = await nutritionService.modifyPlanByAI(currentPlan.id, aiPrompt);
      if (res?.plan_data) {
        setCurrentPlan({
          ...currentPlan,
          days: res.plan_data.days || currentPlan.days,
        });
      }
      setAiMessage(res.modifications?.join(' • ') || res.message || 'Plan updated.');
      setAiPrompt('');
    } catch (err: any) {
      console.error('AI modify plan error:', err);
      setAiMessage(err?.message || 'Could not process modification.');
    } finally {
      setAiModifying(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading && !currentPlan && !readiness) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-[#0E9EAA] flex items-center justify-center animate-pulse">
          <Apple className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#073B72]">Calibrating Nutrition Intelligence...</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Synchronizing clinical screening evidence, biometrics, and Pakistani food composition tables.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 text-left px-2 sm:px-4">
      {/* ─── A. Header Toolbar ────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white border border-[#D7EAF2] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isMale
                    ? 'bg-sky-50 text-[#0868B9] border-sky-200'
                    : 'bg-teal-50 text-[#0E9EAA] border-teal-200'
                }`}
              >
                {isMale ? 'AndroSense • Male Health' : 'OvaSense • PCOS Metabolic Pathway'}
              </span>

              {readiness?.personalization_level && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {readiness.personalization_level === 'LEVEL_3_FULL'
                      ? 'Level 3: Full Precision'
                      : readiness.personalization_level === 'LEVEL_2_SCREENING'
                      ? 'Level 2: Screening Context'
                      : 'Level 1: Profile Calibrated'}
                  </span>
                </span>
              )}

              {currentPlan && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Active 7-Day Plan</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#073B72] tracking-tight">
              Personalized Nutrition &amp; Meal Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Evidence-calibrated daily nutrition, authentic Pakistani recipes, and proactive meal tracking.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-xs transition-all ${accentColor} hover:opacity-95`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{currentPlan ? 'Update 7-Day Plan' : 'Generate 7-Day Plan'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Meal</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRemindersModal(true)}
              className="p-2.5 rounded-2xl border border-[#D7EAF2] hover:bg-slate-50 text-slate-600 transition-colors"
              title="Meal Reminders"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="p-2.5 rounded-2xl border border-[#D7EAF2] hover:bg-slate-50 text-slate-600 transition-colors"
              title="Plan History"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── B. Personalization Status Banner (Phases 1, 19, 20) ─────────────── */}
      {readiness && (
        <aside
          aria-label="Personalization status"
          className={`rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border ${
            readiness.available && readiness.available.length > 0 && (!readiness.missing_required || readiness.missing_required.length === 0)
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-slate-700'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="font-bold text-[#166534] mr-1.5">
                Your plan is personalized using:
              </strong>
              <span className="text-slate-700 font-medium">
                {readiness.available && readiness.available.length > 0
                  ? readiness.available.join(' • ')
                  : 'Core health profile & biometrics'}
              </span>
            </div>
          </div>

          {/* Actionable Missing Recommendation */}
          {readiness.missing_optional && readiness.missing_optional.length > 0 && (
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-1 font-bold text-[#0E9EAA] hover:underline shrink-0"
            >
              <span>Add preferences</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </aside>
      )}

      {/* ─── C. Hero Empty State (If No Active Plan) ─────────────────────────── */}
      {!currentPlan && (
        <div className="rounded-3xl bg-white border border-[#D7EAF2] p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <div className={`w-16 h-16 mx-auto rounded-3xl ${accentColor} text-white flex items-center justify-center shadow-md`}>
            <Utensils className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-[#073B72]">Create Your Personalized 7-Day Plan</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              BioPulse calculates your exact daily energy expenditure using 2023 NASEM guidelines
              and pairs it with verified laboratory-tested Pakistani recipes, honoring your cultural preferences and clinical safety.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white shadow-md transition-all ${accentColor} hover:opacity-95`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Start 7-Day Plan Wizard</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── D. Active Plan Dashboard ────────────────────────────────────────── */}
      {currentPlan && (
        <>
          {/* Target Calorie & Macronutrient Overview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Daily Calorie Target vs Logged Intake */}
            <div className="lg:col-span-2 rounded-3xl bg-white border border-[#D7EAF2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Today&apos;s Energy Balance</span>
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#073B72]">
                    {todayTotals.kcal}
                  </span>
                  <span className="text-xs text-slate-500">
                    / ~{currentPlan.targets.energy_kcal} kcal targeted
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${accentColor}`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((todayTotals.kcal / (currentPlan.targets.energy_kcal || 2000)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Adherence Summary Line */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {adherence?.today
                      ? `${adherence.today.logged_meals} of ${adherence.today.planned_meals} planned meals logged today`
                      : `${todayTotals.count} meals logged today`}
                  </span>
                </span>
                {adherence?.week && (
                  <span className="text-[11px] text-slate-500">
                    {adherence.week.days_engaged} of 7 days active this week
                  </span>
                )}
              </div>
            </div>

            {/* Protein Target */}
            <div className="rounded-3xl bg-white border border-[#D7EAF2] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Protein Target</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-2 text-2xl font-black text-[#073B72]">
                  {todayTotals.prot}g
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Target: {currentPlan.targets.protein_g.min}–{currentPlan.targets.protein_g.max}g
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                Satiety &amp; endocrine health
              </p>
            </div>

            {/* Carbohydrates & Fat Target */}
            <div className="rounded-3xl bg-white border border-[#D7EAF2] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Carbs &amp; Fat</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-black text-[#073B72]">{todayTotals.carbs}g C</span>
                  <span className="text-sm font-bold text-slate-400">•</span>
                  <span className="text-xl font-black text-slate-700">{todayTotals.fat}g F</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Carbs: {currentPlan.targets.carbohydrate_g.min}–{currentPlan.targets.carbohydrate_g.max}g • Fat: {currentPlan.targets.fat_g.min}–{currentPlan.targets.fat_g.max}g
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                Low glycemic whole food sources
              </p>
            </div>
          </div>

          {/* ─── E. 7-Day Day Selector Tabs ─────────────────────────────────── */}
          <div className="rounded-3xl bg-white border border-[#D7EAF2] p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D7EAF2]">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                {DAY_NAMES.map((name, idx) => {
                  const dayIdx = idx + 1;
                  const isSelected = selectedDayIndex === dayIdx;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedDayIndex(dayIdx)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? `${accentColor} text-white shadow-xs`
                          : 'text-slate-600 hover:text-[#073B72] hover:bg-slate-100'
                      }`}
                    >
                      <span>{name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Day / Week Level Regeneration Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRegenerateDay}
                  disabled={regeneratingDay}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D7EAF2] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  title="Regenerates meals for this day while preserving locked dishes"
                >
                  <RefreshCw className={`w-3 h-3 ${regeneratingDay ? 'animate-spin' : ''}`} />
                  <span>Regenerate Day</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateWholeWeek}
                  disabled={regeneratingPlan}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D7EAF2] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  title="Regenerates the full 7-day schedule, retaining locked dishes"
                >
                  <Sparkles className="w-3 h-3 text-[#16B8C4]" />
                  <span className="hidden sm:inline">Regenerate Week</span>
                </button>
              </div>
            </div>

            {/* Selected Day Meals Grid */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#073B72]">
                  {DAY_NAMES[selectedDayIndex - 1]}’s Planned Meals
                </h3>
                {selectedDayPlan && (
                  <span className="text-xs text-slate-500">
                    Day Total: ~{Math.round(selectedDayPlan.energy_kcal)} kcal • P:{Math.round(selectedDayPlan.protein_g)}g C:{Math.round(selectedDayPlan.carbohydrate_g)}g F:{Math.round(selectedDayPlan.fat_g)}g
                  </span>
                )}
              </div>

              {selectedDayPlan && selectedDayPlan.meals && selectedDayPlan.meals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDayPlan.meals.map((meal) => (
                    <MealCard
                      key={`${meal.role}-${meal.title}`}
                      meal={meal}
                      dayIndex={selectedDayIndex}
                      dayName={DAY_NAMES[selectedDayIndex - 1]}
                      planId={currentPlan.id}
                      isMale={isMale}
                      isLoggedToday={isMealRoleLoggedToday(meal.role)}
                      onMarkAsEaten={handleMarkAsEaten}
                      onSwapClick={(m) => setSwapMealTarget(m)}
                      onToggleLock={handleToggleMealLock}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No meals configured for this day. Click &ldquo;Regenerate Day&rdquo; to populate.
                </div>
              )}
            </div>
          </div>

          {/* ─── F. AI Companion Plan Customization Prompt Bar (Phases 17 & 18) ─── */}
          <div className="rounded-3xl bg-[#F5FBFD] border border-[#D7EAF2] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#16B8C4]" />
              <h3 className="text-xs font-bold text-[#073B72] uppercase tracking-wider">
                Ask AI Companion to Customize Your Plan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Describe modifications naturally (e.g., &ldquo;Make Tuesday vegetarian&rdquo;, &ldquo;Replace oats with eggs&rdquo;, &ldquo;I don&apos;t have chicken&rdquo;).
              All requests are checked through deterministic safety filters before updating.
            </p>

            <form onSubmit={handleAiModifySubmit} className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Replace oats across all days, or make dinner lighter"
                disabled={aiModifying}
                className="flex-1 text-xs px-4 py-2.5 rounded-2xl border border-[#D7EAF2] bg-white focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
              />
              <button
                type="submit"
                disabled={aiModifying || !aiPrompt.trim()}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold text-white transition-opacity ${accentColor} disabled:opacity-50`}
              >
                {aiModifying ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Apply</span>
              </button>
            </form>

            {aiMessage && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-[#D7EAF2] text-xs text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aiMessage}</span>
              </div>
            )}
          </div>

          {/* ─── G. Logged Meals & History Section (Phase 3) ────────────────── */}
          <div className="rounded-3xl bg-white border border-[#D7EAF2] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#073B72]">Meal Log History</h3>
                <p className="text-xs text-slate-500">
                  Track actual daily intake and compare against calibrated targets
                </p>
              </div>

              {/* Timeframe Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(['today', 'yesterday', 'week'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLogFilterTab(tab)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                      logFilterTab === tab
                        ? 'bg-white text-[#073B72] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'week' ? 'Past 7 Days' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Logs List */}
            {filteredFoodLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No meals logged for this timeframe. Click &ldquo;+ Log Meal&rdquo; or &ldquo;Log as Eaten&rdquo; above.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredFoodLogs.map((log, idx) => (
                  <div key={log.id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {log.meal_type}
                      </span>
                      <div>
                        <div className="font-bold text-[#073B72]">{log.food_name}</div>
                        {log.portion_description && (
                          <div className="text-[11px] text-slate-500">{log.portion_description}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {log.calories ? (
                        <div className="font-bold text-slate-800">~{Math.round(log.calories)} kcal</div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Intake logged</div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        {new Date(log.logged_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Modals ────────────────────────────────────────────────────────── */}
      <NutritionWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        readiness={readiness}
        existingPreferences={preferences}
        onGeneratePlan={handleGeneratePlan}
        isMale={isMale}
      />

      <LogMealModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onLogMeal={handleLogCustomMeal}
        isMale={isMale}
      />

      <MealSwapModal
        isOpen={Boolean(swapMealTarget)}
        onClose={() => setSwapMealTarget(null)}
        meal={swapMealTarget}
        dayIndex={selectedDayIndex}
        dayName={DAY_NAMES[selectedDayIndex - 1]}
        planId={currentPlan?.id || ''}
        onSwapMeal={handleSwapMeal}
        isMale={isMale}
        userAllergies={preferences?.food_allergies}
      />

      <NutritionRemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        currentPreferences={reminders}
        onSave={async (prefs) => {
          await nutritionService.updateReminders(prefs);
          setReminders(prefs);
        }}
        isMale={isMale}
      />

      <PlanHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        currentPlanId={currentPlan?.id}
        onSelectPlan={async (planId) => {
          const selected = await nutritionService.getPlanById(planId);
          setCurrentPlan(selected);
          await fetchAllData();
        }}
        isMale={isMale}
      />
    </div>
  );
};

export default NutritionPage;