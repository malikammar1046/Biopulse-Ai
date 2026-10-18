import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type {
  LifestyleRecommendationsResult,
  RecommendationItem,
} from '../../../types/lifestyle';
import type { SingleMeal } from '../../../types/nutrition';
import { useUserHealth } from '../../../context/UserHealthContext';
import { nutritionService } from '../../../services/nutritionService';

import { AndroSenseHero } from './AndroSenseHero';
import { AndroSenseProgressCard } from './AndroSenseProgressCard';
import { AndroSenseCategoryTabs, type AndroSenseTab } from './AndroSenseCategoryTabs';
import { AndroSenseNutritionOverviewCard } from './AndroSenseNutritionOverviewCard';
import { AndroSenseRecommendedFoodsCard } from './AndroSenseRecommendedFoodsCard';
import { AndroSenseFoodsToLimitCard } from './AndroSenseFoodsToLimitCard';
import { AndroSenseDailyMealPlanCard } from './AndroSenseDailyMealPlanCard';
import { AndroSenseNutritionTipsCard } from './AndroSenseNutritionTipsCard';
import { AndroSenseTodaysGoalsCard } from './AndroSenseTodaysGoalsCard';
import { AndroSenseMotivationCards } from './AndroSenseMotivationCards';
import { AndroSenseAlternateTabsView } from './AndroSenseAlternateTabsView';
import { AndroSenseWeeklyPlanModal } from './AndroSenseWeeklyPlanModal';
import { AndroSenseMealDetailsModal } from './AndroSenseMealDetailsModal';

import { PlanGenerationWizardModal } from '../PlanGenerationWizardModal';
import { LogMealModal } from '../LogMealModal';
import { MealRemindersModal } from '../MealRemindersModal';
import { EvidenceSourcesSection } from '../EvidenceSourcesSection';
import { ClinicianReviewBanner } from '../ClinicianReviewBanner';
import { RecommendationDetailModal } from '../RecommendationDetailModal';

interface AndroSenseLifestyleDashboardProps {
  data: LifestyleRecommendationsResult;
  onUpdateStatus: (
    recommendationId: string,
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED'
  ) => void;
  onRefresh?: () => void;
  activeUserId?: string;
  nonBlockingNotice?: string | null;
  onClearNonBlockingNotice?: () => void;
}

export const AndroSenseLifestyleDashboard: React.FC<AndroSenseLifestyleDashboardProps> = ({
  data,
  onUpdateStatus,
  onRefresh,
  activeUserId,
  nonBlockingNotice,
  onClearNonBlockingNotice,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const { userProfile, waterLog, incrementWater, decrementWater, fitnessLogs } = useUserHealth();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo<AndroSenseTab>(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase();
    if (tabParam === 'exercise' || tabParam === 'fitness') return 'exercise';
    if (tabParam === 'stress') return 'stress';
    if (tabParam === 'sleep') return 'sleep';
    if (tabParam === 'hydration') return 'hydration';
    return 'nutrition';
  }, [searchParams]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<AndroSenseTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase();
    if (tabParam === 'exercise' || tabParam === 'fitness') {
      setActiveTab('exercise');
    } else if (tabParam === 'stress') {
      setActiveTab('stress');
    } else if (tabParam === 'sleep') {
      setActiveTab('sleep');
    } else if (tabParam === 'hydration') {
      setActiveTab('hydration');
    } else if (tabParam === 'nutrition') {
      setActiveTab('nutrition');
    }
  }, [searchParams]);

  const handleTabChange = (tab: AndroSenseTab) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'nutrition') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true }
    );
  };

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isMealDetailsModalOpen, setIsMealDetailsModalOpen] = useState(false);
  const [selectedMealForDetails, setSelectedMealForDetails] = useState<SingleMeal | any | null>(null);
  const [selectedMealForLog, setSelectedMealForLog] = useState<SingleMeal | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationItem | null>(null);
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);

  // Active Meal Plan from nutrition service
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [todayFoodLogs, setTodayFoodLogs] = useState<any[]>([]);

  // Today day name for meal matching
  const todayDayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  // Today's goals state synchronized from storage
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const storageKey = `androsense_daily_goals_${activeUserId || 'default_user'}_${todayStr}`;
  const [, setTodayGoalsState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const handleGoalToggle = (goalId: string, completed: boolean) => {
    setTodayGoalsState((prev) => ({ ...prev, [goalId]: completed }));
  };

  // Custom scheduled meals selected from 3-day plan for today
  const scheduledStorageKey = `androsense_scheduled_meals_${activeUserId || 'default'}_${todayStr}`;
  const [scheduledMeals, setScheduledMeals] = useState<Record<string, SingleMeal>>(() => {
    try {
      const saved = localStorage.getItem(scheduledStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const handleSelectAndScheduleMeal = async (meal: SingleMeal, dayName?: string) => {
    const roleKey = (meal.role || 'lunch').toLowerCase();
    // 1. Immediate optimistic UI update + offline cache
    setScheduledMeals((prev) => {
      const updated = { ...prev, [roleKey]: meal };
      try {
        localStorage.setItem(scheduledStorageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // 2. Server-side persistence (stores in public.meal_plans for authenticated user)
    try {
      await nutritionService.scheduleMeal({
        date: todayStr,
        meal_type: meal.role || 'lunch',
        meal_name: meal.title,
        meal_data: {
          ...meal,
          day_name: dayName || todayDayName,
          plan_id: currentPlan?.id,
          scheduled_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn('Failed to persist scheduled meal to server:', err);
    }
  };

  // Fetch food logs for today
  const refreshFoodLogs = React.useCallback(async () => {
    try {
      const logs = await nutritionService.fetchFoodLogs(todayStr, todayStr);
      setTodayFoodLogs(logs || []);
    } catch (err) {
      console.warn('Failed to load today food logs:', err);
    }
  }, [todayStr]);

  // Fetch server-persisted scheduled meals for today
  const refreshScheduledMeals = React.useCallback(async () => {
    try {
      const serverMeals = await nutritionService.getScheduledMeals(todayStr);
      if (serverMeals && serverMeals.length > 0) {
        const fromServer: Record<string, SingleMeal> = {};
        for (const item of serverMeals) {
          const role = (item.meal_type || 'lunch').toLowerCase();
          fromServer[role] = {
            id: item.meal_data?.id || item.id,
            role: item.meal_type,
            title: item.meal_name,
            description: item.meal_data?.description || '',
            energy_kcal: item.meal_data?.energy_kcal ?? null,
            protein_g: item.meal_data?.protein_g ?? null,
            carbohydrate_g: item.meal_data?.carbohydrate_g ?? null,
            fat_g: item.meal_data?.fat_g ?? null,
            items: item.meal_data?.items || [],
            ...item.meal_data,
          };
        }
        setScheduledMeals((prev) => {
          const merged = { ...prev, ...fromServer };
          try {
            localStorage.setItem(scheduledStorageKey, JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('AndroSense server scheduled meals fetch notice:', err);
    }
  }, [todayStr, scheduledStorageKey]);

  // Fetch active meal plan, today's logs, and server scheduled meals on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const plan = await nutritionService.getCurrentPlan();
        if (mounted && plan) {
          setCurrentPlan(plan);
        }
      } catch (err) {
        console.warn('AndroSense active plan lookup notice:', err);
      }
      if (mounted) {
        refreshFoodLogs();
        refreshScheduledMeals();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshFoodLogs, refreshScheduledMeals]);

  // Today's meals from active plan + scheduled choices + log status
  const todayMeals = useMemo(() => {
    let baseMeals: SingleMeal[] = [];
    if (currentPlan?.days && currentPlan.days.length > 0) {
      const dayMatch = currentPlan.days.find(
        (d: any) => d.day_name.toLowerCase() === todayDayName.toLowerCase()
      );
      baseMeals = dayMatch?.meals || currentPlan.days[0]?.meals || [];
    }

    if (baseMeals.length === 0) return null;

    // Merge with any custom scheduled meals chosen by the user and check logged status
    return baseMeals.map((m) => {
      const roleKey = (m.role || '').toLowerCase();
      const customScheduled = scheduledMeals[roleKey];
      const effectiveMeal = customScheduled || m;

      // Check if logged in today's food logs
      const isLogged = todayFoodLogs.some((log) => {
        const logMealType = (log.meal_type || '').toLowerCase().replace(/_/g, ' ');
        const roleClean = (effectiveMeal.role || '').toLowerCase().replace(/_/g, ' ');
        const nameClean = (effectiveMeal.title || '').toLowerCase();
        const logNameClean = (log.food_name || '').toLowerCase();
        return (
          logMealType.includes(roleClean) ||
          roleClean.includes(logMealType) ||
          nameClean.includes(logNameClean) ||
          logNameClean.includes(nameClean)
        );
      });

      return {
        ...effectiveMeal,
        is_logged: isLogged,
      };
    });
  }, [currentPlan, todayDayName, scheduledMeals, todayFoodLogs]);

  // Real Progress Calculations (Strictly decoupled from habit checkboxes per clinical requirements)
  // 1. Nutrition progress %: Numerator = logged meals today; Denominator = total meals in active plan.
  const nutritionProgressPercent = useMemo(() => {
    const totalCount = todayMeals ? todayMeals.length : 4;
    const loggedCount = todayFoodLogs.length;
    if (loggedCount > 0) {
      return Math.min(100, Math.round((loggedCount / totalCount) * 100));
    }
    return null; // Empty state: no genuine meals logged yet
  }, [todayMeals, todayFoodLogs.length]);

  // Tracked active exercise minutes today
  const todayActiveMinutes = useMemo(() => {
    return fitnessLogs
      .filter((l) => l.occurredAt === todayStr)
      .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  }, [fitnessLogs, todayStr]);

  // 2. Exercise progress %: Numerator = total tracked active minutes today; Denominator = individualized daily pace.
  const exerciseProgressPercent = useMemo(() => {
    const dailyTargetMinutes = (userProfile?.lifestyle as any)?.fitnessTargetMinutes || 30;
    if (todayActiveMinutes > 0) {
      return Math.min(100, Math.round((todayActiveMinutes / dailyTargetMinutes) * 100));
    }
    return null; // Empty state: no genuine exercise logged yet
  }, [todayActiveMinutes, (userProfile?.lifestyle as any)?.fitnessTargetMinutes]);

  // 3. Sleep progress %: Grounded in genuine daily sleep tracking records. Null if unrecorded for today.
  const sleepProgressPercent = useMemo(() => {
    const recordedSleep = (userProfile?.lifestyle as any)?.todaySleepHours;
    if (typeof recordedSleep === 'number' && recordedSleep > 0) {
      return Math.min(100, Math.round((recordedSleep / 8) * 100));
    }
    return null; // Empty state: no genuine sleep logs today
  }, [(userProfile?.lifestyle as any)?.todaySleepHours]);

  // 4. Stress balance %: Grounded in genuine mindfulness or HRV tracking records. Null if unrecorded.
  const stressProgressPercent = useMemo(() => {
    return null; // Empty state: no genuine mindfulness tracking today
  }, []);

  // User allergens & restrictions
  const userAllergens = useMemo(() => {
    return userProfile?.medical?.allergies || [];
  }, [userProfile?.medical?.allergies]);

  const userConditions = useMemo(() => {
    return userProfile?.medical?.conditions || [];
  }, [userProfile?.medical?.conditions]);

  const isVegetarian = useMemo(() => {
    const pref = userProfile?.lifestyle?.dietaryPreference?.toLowerCase();
    return pref === 'vegetarian' || pref === 'vegan';
  }, [userProfile?.lifestyle?.dietaryPreference]);

  const hasDiabetesOrPrediabetes = useMemo(() => {
    return userConditions.some((c: string) => c.toLowerCase().includes('diabet'));
  }, [userConditions]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`max-w-7xl mx-auto space-y-6 pb-20 ${isUrdu ? 'text-right' : 'text-left'}`}
    >
      {/* Subtle non-blocking banner if fresh background sync failed while showing cached data */}
      {nonBlockingNotice && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/70 p-3.5 flex items-center justify-between gap-3 text-xs text-amber-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{nonBlockingNotice}</span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={() => {
                onClearNonBlockingNotice?.();
                onRefresh();
              }}
              className="font-semibold text-amber-900 underline hover:no-underline shrink-0 cursor-pointer"
            >
              Retry Refresh
            </button>
          )}
        </div>
      )}

      {/* ── Top Subtle Indicator / Breadcrumb: Male • Hypogonadism Pathway ── */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0868B9]" />
          <span className="font-semibold text-slate-700">
            {t('androsense.headerBadge', 'Male • AndroSense Protocol')}
          </span>
          {data.risk_category && (
            <>
              <span className="text-slate-300">•</span>
              <span className="capitalize">{data.risk_category.replace(/_/g, ' ')} Risk Tier</span>
            </>
          )}
        </div>
      </div>

      {/* Clinician Review Banner if medically indicated */}
      {data.clinician_review?.recommended && (
        <ClinicianReviewBanner clinicianReview={data.clinician_review} />
      )}

      {/* ── Responsive 2-Column Layout (Desktop: 67% Main, 33% Sidebar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT MAIN DASHBOARD COLUMN (Approx 67% width — 8 cols)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: Lifestyle Hero Banner */}
          <AndroSenseHero
            onPillarClick={(pillar) => {
              if (pillar === 'nutrition') handleTabChange('nutrition');
              else if (pillar === 'fitness') handleTabChange('exercise');
              else if (pillar === 'sleep') handleTabChange('sleep');
              else if (pillar === 'stress') handleTabChange('stress');
            }}
            riskCategory={data.risk_category}
            hasHypogonadismPattern={data.pathway === 'androsense' || data.pathway === 'male_hypogonadism'}
            userConditions={userConditions}
          />

          {/* Section C: Category Navigation Tabs */}
          <AndroSenseCategoryTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab Content Panels */}
          {activeTab === 'nutrition' ? (
            /* ── Nutrition Primary View: Spacious Sequential Layout ── */
            <div className="space-y-6 pt-1 w-full">
              {/* 1. Nutrition Overview Card */}
              <AndroSenseNutritionOverviewCard
                dailyTargets={data.nutrition?.daily_targets}
                onViewDetails={() => setIsWizardOpen(true)}
              />

              {/* 2. Your Daily Meal Plan Card (Spacious Horizontal 4-Card Layout) */}
              <AndroSenseDailyMealPlanCard
                meals={todayMeals}
                mealConcepts={data.nutrition?.meal_concepts}
                isVegetarian={isVegetarian}
                userAllergens={userAllergens}
                onViewFullPlan={() => setIsWeeklyPlanModalOpen(true)}
                onSelectMeal={(meal) => {
                  setSelectedMealForDetails(meal);
                  setIsMealDetailsModalOpen(true);
                }}
                onLogMeal={(meal) => {
                  setSelectedMealForLog(meal);
                  setIsLogModalOpen(true);
                }}
                onLogCustomMeal={() => {
                  setSelectedMealForLog(null);
                  setIsLogModalOpen(true);
                }}
              />

              {/* 3. Recommended Foods Card */}
              <AndroSenseRecommendedFoodsCard
                userAllergens={userAllergens}
                isVegetarian={isVegetarian}
                hasDiabetesOrPrediabetes={hasDiabetesOrPrediabetes}
              />

              {/* 4. Foods to Limit Card */}
              <AndroSenseFoodsToLimitCard userAllergens={userAllergens} />

              {/* 5. Nutrition Tips Card */}
              <AndroSenseNutritionTipsCard
                customTips={data.nutrition?.key_guidelines}
                userAllergens={userAllergens}
              />
            </div>
          ) : (
            /* ── Alternate Tab Views: Exercise, Sleep, Stress, Hydration ── */
            <AndroSenseAlternateTabsView
              activeTab={activeTab}
              fitness={data.fitness}
              lifestyle={data.lifestyle}
              waterGlasses={waterLog.glasses}
              targetGlasses={waterLog.targetGlasses || 8}
              onIncrementWater={incrementWater}
              onDecrementWater={decrementWater}
              onOpenLogActivity={() => {}}
            />
          )}

          {/* Collapsible Clinical Evidence Drawer */}
          <section className="rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm space-y-3">
            <button
              type="button"
              onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
              className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Clinical Foundations & Research Sources
                  </h4>
                  <p className="text-xs text-slate-500">
                    Explore peer-reviewed guidelines, endocrine consensus, and evidence registries
                  </p>
                </div>
              </div>
              {showEvidenceDrawer ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showEvidenceDrawer && (
              <div className="pt-4 border-t border-sky-50 animate-fadeIn">
                <EvidenceSourcesSection
                  evidenceRegistry={data.evidence_registry}
                  evidenceRationale={data.evidence_rationale}
                  recommendations={data.recommendations}
                  disclaimer={data.disclaimer}
                  isMale={true}
                />
              </div>
            )}
          </section>

          {/* Medical Disclaimer */}
          <footer className="text-center pt-2 pb-4 text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {data.disclaimer ||
              'BioPulse AI lifestyle recommendations provide educational guidance based on clinical consensus. This protocol is not a medical diagnosis or treatment plan. Always consult your healthcare professional before making major dietary or activity changes.'}
          </footer>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT SIDEBAR COLUMN (Approx 33% width — 4 cols)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section B: Your Lifestyle Progress Card */}
          <AndroSenseProgressCard
            nutritionPercent={nutritionProgressPercent}
            exercisePercent={exerciseProgressPercent}
            sleepPercent={sleepProgressPercent}
            stressPercent={stressProgressPercent}
            onViewAll={() => setActiveTab('nutrition')}
          />

          {/* Section I: Today's Goals Card */}
          <AndroSenseTodaysGoalsCard
            userId={activeUserId}
            todayWaterGlasses={waterLog.glasses}
            todayFitnessMinutes={todayActiveMinutes}
            todayMealsLogged={todayFoodLogs.length}
            onGoalToggle={handleGoalToggle}
          />

          {/* Section J: Motivation and Meal-Plan Cards */}
          <AndroSenseMotivationCards
            onExploreMealPlans={() => setIsWizardOpen(true)}
            hasTrackedActions={Boolean(
              (nutritionProgressPercent && nutritionProgressPercent > 0) ||
              (exerciseProgressPercent && exerciseProgressPercent > 0) ||
              waterLog.glasses > 0
            )}
          />
        </div>
      </div>

      {/* ── Modal Dialogs ── */}
      {isWeeklyPlanModalOpen && (
        <AndroSenseWeeklyPlanModal
          isOpen={isWeeklyPlanModalOpen}
          onClose={() => setIsWeeklyPlanModalOpen(false)}
          currentPlan={currentPlan}
          isVegetarian={isVegetarian}
          userAllergens={userAllergens}
          todayDayName={todayDayName}
          onSelectAndScheduleMeal={handleSelectAndScheduleMeal}
          onLogMeal={(meal) => {
            setSelectedMealForLog(meal);
            setIsLogModalOpen(true);
          }}
          onOpenWizard={() => {
            setIsWeeklyPlanModalOpen(false);
            setIsWizardOpen(true);
          }}
        />
      )}

      {isWizardOpen && (
        <PlanGenerationWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onPlanGenerated={(newPlan) => {
            setCurrentPlan(newPlan);
            setIsWizardOpen(false);
            setIsWeeklyPlanModalOpen(true);
          }}
          isMale={true}
        />
      )}

      {isMealDetailsModalOpen && selectedMealForDetails && (
        <AndroSenseMealDetailsModal
          isOpen={isMealDetailsModalOpen}
          onClose={() => {
            setIsMealDetailsModalOpen(false);
            setSelectedMealForDetails(null);
          }}
          meal={selectedMealForDetails}
          userAllergens={userAllergens}
          isVegetarian={isVegetarian}
          plannedDate={todayDayName}
          onLogMeal={(meal) => {
            setIsMealDetailsModalOpen(false);
            setSelectedMealForDetails(null);
            setSelectedMealForLog(meal);
            setIsLogModalOpen(true);
          }}
        />
      )}

      {isLogModalOpen && (
        <LogMealModal
          isOpen={isLogModalOpen}
          onClose={() => {
            setIsLogModalOpen(false);
            setSelectedMealForLog(null);
          }}
          onFoodLogged={async () => {
            setIsLogModalOpen(false);
            setSelectedMealForLog(null);
            await refreshFoodLogs();
            try {
              const plan = await nutritionService.getCurrentPlan();
              if (plan) setCurrentPlan(plan);
            } catch {
              // ignore
            }
          }}
          plannedMeal={selectedMealForLog}
          isMale={true}
        />
      )}

      {isRemindersOpen && (
        <MealRemindersModal
          isOpen={isRemindersOpen}
          onClose={() => setIsRemindersOpen(false)}
        />
      )}

      {selectedRecommendation && (
        <RecommendationDetailModal
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
          onUpdateStatus={onUpdateStatus}
          evidenceRegistry={data.evidence_registry}
          isMale={true}
        />
      )}
    </div>
  );
};
