/**
 * ==============================================================================
 * VITASense Phase 6: Dashboard Action Engine
 * ==============================================================================
 *
 * Produces a deterministic, prioritized list of "Today's Actions" from existing
 * context providers. No new API calls — purely derived from UserHealthContext.
 *
 * Priority order: critical > high > medium > low
 * Category order within priority: safety > profile > verification > tracking > progression
 */

import type { UserProfile, HealthPathway } from '../types/onboarding';
import type { AdaptiveHealthProfile } from '../types/adaptiveScreening';
import type { MedicalReport } from '../types/report';
import { ROUTES } from '../constants/routes';
import type { NutritionData, FitnessData, HealthSnapshotMetrics, TodayReminder } from '../types/dashboard';
import type { ProfileCompletionResult } from './profileCompletion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionCategory = 'safety' | 'profile' | 'verification' | 'tracking' | 'progression';

export interface DashboardAction {
  id: string;
  priority: ActionPriority;
  category: ActionCategory;
  title: string;
  description: string;
  iconName: string; // lucide icon identifier
  actionLabel: string;
  route?: string;
  callbackId?: string;
  pathways: HealthPathway[];
  isCompleted: boolean;
}

// ---------------------------------------------------------------------------
// Priority & Category Scoring (for sort order)
// ---------------------------------------------------------------------------

const PRIORITY_WEIGHT: Record<ActionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CATEGORY_WEIGHT: Record<ActionCategory, number> = {
  safety: 0,
  profile: 1,
  verification: 2,
  tracking: 3,
  progression: 4,
};

function actionSortScore(action: DashboardAction): number {
  const completedPenalty = action.isCompleted ? 1000 : 0;
  return completedPenalty + PRIORITY_WEIGHT[action.priority] * 10 + CATEGORY_WEIGHT[action.category];
}

// ---------------------------------------------------------------------------
// Input Bundle
// ---------------------------------------------------------------------------

export interface DashboardActionInputs {
  userProfile: UserProfile;
  pathway: HealthPathway;
  adaptiveProfile: AdaptiveHealthProfile;
  profileCompletion: ProfileCompletionResult;
  reports: MedicalReport[];
  snapshotMetrics: HealthSnapshotMetrics;
  nutrition: NutritionData;
  fitness: FitnessData;
  reminders: TodayReminder[];
}

// ---------------------------------------------------------------------------
// Action Builder
// ---------------------------------------------------------------------------

export function buildDashboardActions(inputs: DashboardActionInputs): DashboardAction[] {
  const {
    userProfile,
    pathway,
    adaptiveProfile,
    profileCompletion,
    reports,
    snapshotMetrics,
    nutrition,
    fitness,
    reminders,
  } = inputs;

  const actions: DashboardAction[] = [];

  // ── 1. SAFETY: Emergency contact missing ────────────────────────────────────
  const hasPrimaryEmergency =
    userProfile.emergencyContacts?.[0]?.name?.trim() &&
    userProfile.emergencyContacts?.[0]?.phone?.trim();

  if (!hasPrimaryEmergency) {
    actions.push({
      id: 'safety_emergency_contact',
      priority: 'critical',
      category: 'safety',
      title: 'Add Emergency Contact',
      description: 'Your safety profile is incomplete. Add a primary emergency contact for your health records.',
      iconName: 'ShieldAlert',
      actionLabel: 'Add Contact',
      route: '/app/settings',
      pathways: ['female', 'male', 'general'],
      isCompleted: false,
    });
  }

  // ── 2. SAFETY: Critical unverified lab results ──────────────────────────────
  const unverifiedReports = reports.filter((r) => r.status === 'needs_verification');
  const unverifiedResultsCount = unverifiedReports.reduce((sum, r) => {
    return sum + (r.results?.filter((res) => !res.userVerified)?.length || 0);
  }, 0);

  if (unverifiedResultsCount > 0) {
    actions.push({
      id: 'safety_unverified_labs',
      priority: 'critical',
      category: 'verification',
      title: `Verify ${unverifiedResultsCount} Lab ${unverifiedResultsCount === 1 ? 'Result' : 'Results'}`,
      description: `You have ${unverifiedReports.length} ${unverifiedReports.length === 1 ? 'report' : 'reports'} with unconfirmed values. Review and confirm extracted data.`,
      iconName: 'FileWarning',
      actionLabel: 'Review & Verify',
      route: '/app/reports',
      pathways: ['female', 'male', 'general'],
      isCompleted: false,
    });
  }

  // ── 3. PROFILE: Incomplete onboarding ───────────────────────────────────────
  if (profileCompletion.percentage < 100) {
    const nextField = profileCompletion.nextAction;
    actions.push({
      id: 'profile_incomplete',
      priority: 'high',
      category: 'profile',
      title: `Complete Your Health Profile (${profileCompletion.percentage}%)`,
      description: nextField
        ? `Next: ${nextField.actionText}`
        : 'Fill in missing health information to improve screening accuracy.',
      iconName: 'UserCircle',
      actionLabel: 'Complete Profile',
      route: '/app/settings',
      pathways: ['female', 'male', 'general'],
      isCompleted: false,
    });
  }

  // ── 4. PROFILE: Missing biometrics (height/weight) ─────────────────────────
  if (!userProfile.heightCm || !userProfile.weightKg) {
    actions.push({
      id: 'profile_biometrics',
      priority: 'high',
      category: 'profile',
      title: 'Add Height & Weight',
      description: 'Biometric measurements are essential for BMI calculation and screening context.',
      iconName: 'Ruler',
      actionLabel: 'Add Measurements',
      route: '/app/settings',
      pathways: ['female', 'male', 'general'],
      isCompleted: false,
    });
  }

  // ── 5. TRACKING: Daily symptoms ─────────────────────────────────────────────
  const loggedSymptomsToday = snapshotMetrics.symptomsCountToday || 0;
  actions.push({
    id: 'tracking_symptoms',
    priority: 'medium',
    category: 'tracking',
    title: 'Log Today\'s Symptoms',
    description: loggedSymptomsToday > 0
      ? `${loggedSymptomsToday} ${loggedSymptomsToday === 1 ? 'symptom' : 'symptoms'} logged today`
      : 'Track how you feel to build longitudinal patterns.',
    iconName: 'Stethoscope',
    actionLabel: loggedSymptomsToday > 0 ? 'Update' : 'Log Now',
    route: '/app/symptoms',
    pathways: ['female', 'male', 'general'],
    isCompleted: loggedSymptomsToday > 0,
  });

  // ── 6. TRACKING: Nutrition ──────────────────────────────────────────────────
  const caloriesLogged = nutrition.caloriesLogged || 0;
  const caloriesTarget = nutrition.caloriesTarget || 2000;
  const nutritionPercent = Math.min(Math.round((caloriesLogged / caloriesTarget) * 100), 100);
  actions.push({
    id: 'tracking_nutrition',
    priority: 'medium',
    category: 'tracking',
    title: 'Log Today\'s Meals',
    description: caloriesLogged > 0
      ? `${caloriesLogged} / ${caloriesTarget} kcal (${nutritionPercent}%)`
      : 'Track your food intake for nutritional insights.',
    iconName: 'Utensils',
    actionLabel: caloriesLogged > 0 ? 'Add More' : 'Log Food',
    route: ROUTES.APP.LIFESTYLE,
    pathways: ['female', 'male', 'general'],
    isCompleted: nutritionPercent >= 80,
  });

  // ── 7. TRACKING: Water intake ───────────────────────────────────────────────
  const waterLogged = nutrition.waterIntakeLiters || 0;
  const waterTarget = nutrition.waterTargetLiters || 2.5;
  const waterPercent = Math.min(Math.round((waterLogged / waterTarget) * 100), 100);
  actions.push({
    id: 'tracking_water',
    priority: 'low',
    category: 'tracking',
    title: 'Stay Hydrated',
    description: `${waterLogged}L of ${waterTarget}L target (${waterPercent}%)`,
    iconName: 'Droplets',
    actionLabel: waterPercent >= 100 ? 'Done ✓' : 'Log Water',
    route: ROUTES.APP.LIFESTYLE,
    pathways: ['female', 'male', 'general'],
    isCompleted: waterPercent >= 100,
  });

  // ── 8. TRACKING: Exercise ───────────────────────────────────────────────────
  const activeMinutes = fitness.activeMinutesToday || 0;
  actions.push({
    id: 'tracking_exercise',
    priority: 'medium',
    category: 'tracking',
    title: 'Log Today\'s Exercise',
    description: activeMinutes > 0
      ? `${activeMinutes} active minutes today`
      : 'Movement supports hormonal balance and recovery.',
    iconName: 'Dumbbell',
    actionLabel: activeMinutes > 0 ? 'Update' : 'Log Exercise',
    route: '/app/fitness',
    pathways: ['female', 'male', 'general'],
    isCompleted: activeMinutes >= 30,
  });

  // ── 9. TRACKING: Cycle (Female only) ────────────────────────────────────────
  if (pathway === 'female') {
    const hasLoggedPeriod = Boolean(userProfile.womensHealth?.lastPeriodDate);
    actions.push({
      id: 'tracking_cycle',
      priority: 'medium',
      category: 'tracking',
      title: hasLoggedPeriod ? 'Update Cycle Log' : 'Log Your Period',
      description: hasLoggedPeriod
        ? `Day ${snapshotMetrics.cycleDay} • ${snapshotMetrics.phaseName}`
        : 'Track your menstrual cycle for accurate phase predictions.',
      iconName: 'Calendar',
      actionLabel: hasLoggedPeriod ? 'View Cycle' : 'Log Period',
      route: '/app/cycle',
      pathways: ['female'],
      isCompleted: hasLoggedPeriod,
    });
  }

  // ── 10. TRACKING: Medication adherence ──────────────────────────────────────
  const pendingReminders = reminders.filter((r) => r.category === 'medication' && !r.completed);
  if (pendingReminders.length > 0) {
    actions.push({
      id: 'tracking_medications',
      priority: 'medium',
      category: 'tracking',
      title: `Take ${pendingReminders.length} ${pendingReminders.length === 1 ? 'Medication' : 'Medications'}`,
      description: 'Mark your medications as taken to track adherence.',
      iconName: 'Pill',
      actionLabel: 'View Meds',
      route: '/app/medications',
      pathways: ['female', 'male', 'general'],
      isCompleted: false,
    });
  }

  // ── 11. PROGRESSION: Tier advancement ───────────────────────────────────────
  if (adaptiveProfile.isSpecializedPathway) {
    const tier1 = adaptiveProfile.tiers.tier_1;
    const tier2 = adaptiveProfile.tiers.tier_2;

    if (tier1.status !== 'ready_for_assessment') {
      actions.push({
        id: 'progression_tier1',
        priority: 'low',
        category: 'progression',
        title: 'Complete Tier 1 Screening',
        description: `${tier1.completenessPercentage}% complete — self-reported health information`,
        iconName: 'Layers',
        actionLabel: 'Continue',
        route: '/app/assessment',
        pathways: ['female', 'male'],
        isCompleted: false,
      });
    } else if (tier2.status !== 'ready_for_assessment') {
      actions.push({
        id: 'progression_tier2',
        priority: 'low',
        category: 'progression',
        title: 'Progress to Tier 2',
        description: `${tier2.completenessPercentage}% complete — routine lab panels`,
        iconName: 'TrendingUp',
        actionLabel: 'View Tiers',
        route: '/app/assessment',
        pathways: ['female', 'male'],
        isCompleted: false,
      });
    }
  }

  // ── 12. PROGRESSION: Upload first report ────────────────────────────────────
  if (reports.length === 0) {
    actions.push({
      id: 'progression_first_report',
      priority: 'low',
      category: 'progression',
      title: 'Upload Your First Lab Report',
      description: 'Scan and digitize your medical reports for intelligent analysis.',
      iconName: 'FileUp',
      actionLabel: 'Upload Report',
      route: '/app/reports',
      pathways: ['female', 'male', 'general'],
      isCompleted: false,
    });
  }

  // ── Filter by active pathway ────────────────────────────────────────────────
  const filtered = actions.filter((a) => a.pathways.includes(pathway));

  // ── Sort by deterministic priority ──────────────────────────────────────────
  filtered.sort((a, b) => actionSortScore(a) - actionSortScore(b));

  return filtered;
}

/**
 * Computes a quick summary for the action list header.
 */
export function getActionsSummary(actions: DashboardAction[]): {
  total: number;
  completed: number;
  criticalCount: number;
  percentage: number;
} {
  const total = actions.length;
  const completed = actions.filter((a) => a.isCompleted).length;
  const criticalCount = actions.filter((a) => a.priority === 'critical' && !a.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;
  return { total, completed, criticalCount, percentage };
}

export const buildTodayActions = buildDashboardActions;

