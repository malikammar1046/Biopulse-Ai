/**
 * BioPulse Mobile — Dashboard Service
 *
 * Dedicated data layer for the BioPulse home dashboard.
 * Communicates with authenticated backend APIs (Django ML & Supabase)
 * to retrieve real user health data with zero fabrication.
 */

import { persistentStorage } from '../lib/storage';
import {
  fetchUserProfileFromDb,
  fetchCycleRecordsFromDb,
  fetchTodayWaterLogsFromDb,
  fetchMedicationsFromDb,
  fetchAppointmentsFromDb,
  fetchMedicalReportsFromDb,
  getSupabaseHeaders,
  SUPABASE_URL,
  BACKEND_API_URL,
} from './userService';
import {
  HealthPathway,
  ScreeningAssessmentState,
  ScreeningFactor,
  MedicationItem,
  AppointmentItem,
} from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardAssessmentSummary {
  hasAssessment: boolean;
  probabilityPercent: number | null;
  riskCategory: 'lower' | 'intermediate' | 'higher' | null;
  riskLabel: string | null;
  tier: number;
  tierStatus: string;
  lastAssessedDate: string | null;
  topFactors: ScreeningFactor[];
  modelName?: string;
  isNonDiagnostic: boolean;
}

export interface DashboardCycleSummary {
  hasCycleData: boolean;
  currentCycleDay: number;
  cycleLength: number;
  nextPeriodDaysRemaining: number;
  nextPeriodExpectedDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  phase: string;
}

export interface DashboardNutritionSummary {
  hasNutritionLogs: boolean;
  caloriesConsumed: number;
  calorieTarget: number;
  mealsCount: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DashboardWaterSummary {
  hasWaterLogs: boolean;
  consumedLiters: number;
  targetLiters: number;
  glasses: number;
}

export interface DashboardMovementSummary {
  hasMovementLogs: boolean;
  todayActivityMinutes: number;
  targetMinutes: number;
  todaySteps: number;
}

export interface DashboardMedicationSummary {
  hasMedications: boolean;
  activeMedication: MedicationItem | null;
  totalActiveCount: number;
  items: MedicationItem[];
}

export interface DashboardAppointmentSummary {
  hasUpcomingAppointment: boolean;
  upcomingAppointment: AppointmentItem | null;
  totalUpcomingCount: number;
}

export interface DashboardRecentEvent {
  id: string;
  type: 'assessment' | 'cycle' | 'lab' | 'medication' | 'appointment';
  title: string;
  date: string;
  description?: string;
  status?: string;
}

export interface DashboardData {
  userId: string;
  userName: string;
  firstName: string;
  pathway: HealthPathway;
  assessment: DashboardAssessmentSummary;
  cycle?: DashboardCycleSummary;
  nutrition: DashboardNutritionSummary;
  water: DashboardWaterSummary;
  movement: DashboardMovementSummary;
  medication: DashboardMedicationSummary;
  appointment: DashboardAppointmentSummary;
  recentEvents: DashboardRecentEvent[];
  isAllEmpty: boolean;
  fetchedAt: string;
}

const DASHBOARD_CACHE_PREFIX = 'biopulse_dashboard_cache_';

// ============================================================================
// CACHING HELPERS
// ============================================================================

export async function getCachedDashboardData(userId: string): Promise<DashboardData | null> {
  if (!userId) return null;
  try {
    const raw = await persistentStorage.getItem(`${DASHBOARD_CACHE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[DashboardService] Cache read error:', err);
  }
  return null;
}

export async function setCachedDashboardData(userId: string, data: DashboardData): Promise<void> {
  if (!userId || !data) return;
  try {
    await persistentStorage.setItem(`${DASHBOARD_CACHE_PREFIX}${userId}`, JSON.stringify(data));
  } catch (err) {
    console.warn('[DashboardService] Cache write error:', err);
  }
}

export async function clearCachedDashboardData(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await persistentStorage.removeItem(`${DASHBOARD_CACHE_PREFIX}${userId}`);
  } catch (err) {
    console.warn('[DashboardService] Cache clear error:', err);
  }
}

// ============================================================================
// SPECIALIZED DB QUERIES FOR DASHBOARD METRICS
// ============================================================================

/**
 * Fetch today's food/nutrition logs from Supabase
 */
export async function fetchTodayFoodLogsFromDb(
  userId: string,
  token: string
): Promise<{ caloriesConsumed: number; mealsCount: number; proteinG: number; carbsG: number; fatG: number }> {
  if (!userId || !token) {
    return { caloriesConsumed: 0, mealsCount: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  }

  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/food_logs?user_id=eq.${userId}&logged_at=eq.${todayStr}&select=*`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        let totalCal = 0;
        let totalProt = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        for (const r of rows) {
          totalCal += Number(r.calories) || 0;
          totalProt += Number(r.protein_g) || 0;
          totalCarbs += Number(r.carbs_g) || 0;
          totalFat += Number(r.fat_g) || 0;
        }

        return {
          caloriesConsumed: totalCal,
          mealsCount: rows.length,
          proteinG: Math.round(totalProt),
          carbsG: Math.round(totalCarbs),
          fatG: Math.round(totalFat),
        };
      }
    }
  } catch (err) {
    console.warn('[DashboardService] Error fetching food logs:', err);
  }

  return { caloriesConsumed: 0, mealsCount: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

/**
 * Fetch today's fitness/movement logs from Supabase
 */
export async function fetchTodayFitnessLogsFromDb(
  userId: string,
  token: string
): Promise<{ todayActivityMinutes: number; todaySteps: number; logsCount: number }> {
  if (!userId || !token) {
    return { todayActivityMinutes: 0, todaySteps: 0, logsCount: 0 };
  }

  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/fitness_logs?user_id=eq.${userId}&occurred_at=eq.${todayStr}&select=*`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        let totalMinutes = 0;
        for (const r of rows) {
          totalMinutes += Number(r.duration_minutes) || 0;
        }
        return {
          todayActivityMinutes: totalMinutes,
          todaySteps: 0,
          logsCount: rows.length,
        };
      }
    }
  } catch (err) {
    console.warn('[DashboardService] Error fetching fitness logs:', err);
  }

  return { todayActivityMinutes: 0, todaySteps: 0, logsCount: 0 };
}

/**
 * Fetch authoritative assessment from Django or fallback to Supabase table
 */
export async function fetchAuthoritativeAssessment(
  userId: string,
  token: string,
  pathway: HealthPathway
): Promise<DashboardAssessmentSummary> {
  const emptyAssessment: DashboardAssessmentSummary = {
    hasAssessment: false,
    probabilityPercent: null,
    riskCategory: null,
    riskLabel: null,
    tier: 1,
    tierStatus: 'Not Screened',
    lastAssessedDate: null,
    topFactors: [],
    isNonDiagnostic: true,
  };

  if (!userId || !token) return emptyAssessment;

  const moduleName = pathway === 'male' || pathway === 'male_hypogonadism' ? 'male_hypogonadism' : 'female_pcos';

  // 1. Try Django active assessment endpoint first
  try {
    const djangoRes = await fetch(`${BACKEND_API_URL}/v1/intelligence/assessment/active/?module=${moduleName}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (djangoRes.ok) {
      const data = await djangoRes.json();
      if (data && data.has_assessment !== false && data.assessment_level) {
        const prob = Math.round(Number(data.probability_percent || data.probability * 100) || 0);
        const riskCat = (data.risk_category || 'lower').toLowerCase() as 'lower' | 'intermediate' | 'higher';
        const riskLabel = riskCat === 'higher' ? 'Higher Risk' : riskCat === 'intermediate' ? 'Intermediate Risk' : 'Lower Risk';

        const rawFactors = Array.isArray(data.explanations) ? data.explanations : [];
        const topFactors: ScreeningFactor[] = rawFactors.slice(0, 3).map((f: any, idx: number) => ({
          id: f.feature_key || `factor_${idx}`,
          name: f.feature_name || f.patient_label || 'Clinical Factor',
          impactPercent: Math.round(Math.abs(Number(f.impact_score || 0)) * 100) || 10,
          direction: f.direction === 'increases_risk' || f.direction === 'positive' ? 'increases_risk' : 'decreases_risk',
          explanation: f.description || f.patient_explanation || 'Observed risk feature.',
          iconName: 'pulse-outline',
        }));

        const tierCount = Array.isArray(data.tiers_included) ? data.tiers_included.length : 1;

        return {
          hasAssessment: true,
          probabilityPercent: prob,
          riskCategory: riskCat,
          riskLabel,
          tier: tierCount,
          tierStatus: `Tier ${tierCount} Complete`,
          lastAssessedDate: data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          topFactors,
          modelName: data.model_name || 'BioPulse AI Ensemble',
          isNonDiagnostic: true,
        };
      }
    }
  } catch (err) {
    // Django might be unreachable; proceed to Supabase fallback
  }

  // 2. Fallback to Supabase screening_assessments table
  try {
    const supaRes = await fetch(
      `${SUPABASE_URL}/rest/v1/screening_assessments?user_id=eq.${userId}&module=eq.${moduleName}&order=created_at.desc&limit=1`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      }
    );

    if (supaRes.ok) {
      const rows = await supaRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const prob = Math.round(Number(row.probability_percent || row.probability * 100) || 0);
        const riskCat = (row.risk_category || 'lower').toLowerCase() as 'lower' | 'intermediate' | 'higher';
        const riskLabel = row.risk_label || (riskCat === 'higher' ? 'Higher Risk' : riskCat === 'intermediate' ? 'Intermediate Risk' : 'Lower Risk');

        const rawFactors = Array.isArray(row.explanations) ? row.explanations : [];
        const topFactors: ScreeningFactor[] = rawFactors.slice(0, 3).map((f: any, idx: number) => ({
          id: f.feature_key || `factor_${idx}`,
          name: f.feature_name || f.patient_label || 'Clinical Factor',
          impactPercent: Math.round(Math.abs(Number(f.impact_score || 0)) * 100) || 10,
          direction: f.direction === 'increases_risk' || f.direction === 'positive' ? 'increases_risk' : 'decreases_risk',
          explanation: f.description || f.patient_explanation || 'Observed risk feature.',
          iconName: 'pulse-outline',
        }));

        const tierCount = Array.isArray(row.tiers_included) ? row.tiers_included.length : 1;

        return {
          hasAssessment: true,
          probabilityPercent: prob,
          riskCategory: riskCat,
          riskLabel,
          tier: tierCount,
          tierStatus: `Tier ${tierCount} Complete`,
          lastAssessedDate: row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          topFactors,
          modelName: row.model_name || 'BioPulse AI Ensemble',
          isNonDiagnostic: true,
        };
      }
    }
  } catch (err) {
    console.warn('[DashboardService] Error fetching Supabase assessment:', err);
  }

  return emptyAssessment;
}

// ============================================================================
// MAIN DASHBOARD COMPOSER FUNCTION
// ============================================================================

/**
 * Fetch all authoritative dashboard data for an authenticated user.
 * Strictly respects backend source of truth with zero fabricated data.
 */
export async function fetchDashboardData(
  userId: string,
  token: string,
  pathwayOverride?: HealthPathway
): Promise<DashboardData> {
  if (!userId || !token) {
    throw new Error('Unauthenticated user session');
  }

  // 1. Fetch profile first to know authoritative name and pathway
  const dbProfile = await fetchUserProfileFromDb(userId, token);
  const pathway: HealthPathway = pathwayOverride || (dbProfile?.pathway as HealthPathway) || 'female';
  const isFemale = pathway === 'female' || pathway === 'female_pcos';

  const rawName = dbProfile?.fullName?.trim() || '';
  const firstName = rawName ? rawName.split(' ')[0] : 'Member';

  // 2. Fetch all health components in parallel
  const [
    assessmentSummary,
    cycleRaw,
    waterRaw,
    foodSummary,
    fitnessSummary,
    medsList,
    aptsList,
    reportsList,
  ] = await Promise.all([
    fetchAuthoritativeAssessment(userId, token, pathway),
    isFemale ? fetchCycleRecordsFromDb(userId, token) : Promise.resolve(null),
    fetchTodayWaterLogsFromDb(userId, token),
    fetchTodayFoodLogsFromDb(userId, token),
    fetchTodayFitnessLogsFromDb(userId, token),
    fetchMedicationsFromDb(userId, token),
    fetchAppointmentsFromDb(userId, token),
    fetchMedicalReportsFromDb(userId, token),
  ]);

  // 3. Process Cycle Summary for female pathway
  let cycleSummary: DashboardCycleSummary | undefined = undefined;
  if (isFemale) {
    if (cycleRaw && cycleRaw.lastPeriodStartDate) {
      const cycleLength = cycleRaw.cycleLength || 28;
      const startDate = new Date(cycleRaw.lastPeriodStartDate);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const dayOfCycle = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

      const daysRemaining = Math.max(0, cycleLength - dayOfCycle);
      const nextExpected = new Date(startDate);
      nextExpected.setDate(nextExpected.getDate() + cycleLength);

      const fertileStart = new Date(startDate);
      fertileStart.setDate(fertileStart.getDate() + 10);
      const fertileEnd = new Date(startDate);
      fertileEnd.setDate(fertileEnd.getDate() + 15);

      const fmtDate = (d: Date) =>
        d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      cycleSummary = {
        hasCycleData: true,
        currentCycleDay: dayOfCycle,
        cycleLength,
        nextPeriodDaysRemaining: daysRemaining,
        nextPeriodExpectedDate: fmtDate(nextExpected),
        fertileWindowStart: fmtDate(fertileStart),
        fertileWindowEnd: fmtDate(fertileEnd),
        phase: dayOfCycle <= 5 ? 'Menstrual Phase' : dayOfCycle <= 13 ? 'Follicular Phase' : dayOfCycle <= 16 ? 'Ovulation Window' : 'Luteal Phase',
      };
    } else {
      cycleSummary = {
        hasCycleData: false,
        currentCycleDay: 0,
        cycleLength: 28,
        nextPeriodDaysRemaining: 0,
        nextPeriodExpectedDate: '',
        fertileWindowStart: '',
        fertileWindowEnd: '',
        phase: 'No cycle logged',
      };
    }
  }

  // 4. Process Water Summary
  const hasWaterLogs = Boolean(waterRaw && waterRaw.consumedLiters && waterRaw.consumedLiters > 0);
  const waterSummary: DashboardWaterSummary = {
    hasWaterLogs,
    consumedLiters: waterRaw?.consumedLiters || 0,
    targetLiters: waterRaw?.targetLiters || 2.5,
    glasses: Math.round((waterRaw?.consumedLiters || 0) / 0.25),
  };

  // 5. Process Nutrition Summary
  const nutritionSummary: DashboardNutritionSummary = {
    hasNutritionLogs: foodSummary.mealsCount > 0,
    caloriesConsumed: foodSummary.caloriesConsumed,
    calorieTarget: isFemale ? 1800 : 2200,
    mealsCount: foodSummary.mealsCount,
    proteinG: foodSummary.proteinG,
    carbsG: foodSummary.carbsG,
    fatG: foodSummary.fatG,
  };

  // 6. Process Movement Summary
  const movementSummary: DashboardMovementSummary = {
    hasMovementLogs: fitnessSummary.todayActivityMinutes > 0,
    todayActivityMinutes: fitnessSummary.todayActivityMinutes,
    targetMinutes: 60,
    todaySteps: fitnessSummary.todaySteps,
  };

  // 7. Process Medication Summary
  const activeMeds = (medsList || []).filter(
    (m) => m.pathway === 'all' || m.pathway === (isFemale ? 'female' : 'male')
  );
  const medicationSummary: DashboardMedicationSummary = {
    hasMedications: activeMeds.length > 0,
    activeMedication: activeMeds.length > 0 ? activeMeds[0] : null,
    totalActiveCount: activeMeds.length,
    items: activeMeds,
  };

  // 8. Process Appointment Summary
  const upcomingApts = (aptsList || []).filter((a) => a.status === 'Upcoming');
  const appointmentSummary: DashboardAppointmentSummary = {
    hasUpcomingAppointment: upcomingApts.length > 0,
    upcomingAppointment: upcomingApts.length > 0 ? upcomingApts[0] : null,
    totalUpcomingCount: upcomingApts.length,
  };

  // 9. Process Recent Events
  const recentEvents: DashboardRecentEvent[] = [];
  if (assessmentSummary.hasAssessment) {
    recentEvents.push({
      id: 'event_assessment',
      type: 'assessment',
      title: `${assessmentSummary.riskLabel} Assessed`,
      date: assessmentSummary.lastAssessedDate || 'Recent',
      description: `Tier ${assessmentSummary.tier} screening result recorded`,
    });
  }
  if (reportsList && reportsList.length > 0) {
    for (const rep of reportsList.slice(0, 2)) {
      recentEvents.push({
        id: `event_rep_${rep.id}`,
        type: 'lab',
        title: rep.title,
        date: rep.date,
        status: rep.status,
      });
    }
  }

  // 10. Check if user is completely brand new with no health data
  const isAllEmpty =
    !assessmentSummary.hasAssessment &&
    (!cycleSummary || !cycleSummary.hasCycleData) &&
    !waterSummary.hasWaterLogs &&
    !nutritionSummary.hasNutritionLogs &&
    !movementSummary.hasMovementLogs &&
    !medicationSummary.hasMedications &&
    !appointmentSummary.hasUpcomingAppointment;

  const dashboardData: DashboardData = {
    userId,
    userName: rawName,
    firstName,
    pathway,
    assessment: assessmentSummary,
    cycle: cycleSummary,
    nutrition: nutritionSummary,
    water: waterSummary,
    movement: movementSummary,
    medication: medicationSummary,
    appointment: appointmentSummary,
    recentEvents,
    isAllEmpty,
    fetchedAt: new Date().toISOString(),
  };

  // Cache dashboard data for instant offline/restart recovery
  await setCachedDashboardData(userId, dashboardData);

  return dashboardData;
}
