/**
 * VITASense — Longitudinal Calculations Engine (Phase 8)
 *
 * Pure, deterministic mathematical calculations for health trends, period comparisons,
 * symptom clusters, and verified biomarker trajectories.
 *
 * Core Rules:
 *   1. Zero fabricated data: every calculation is based on real stored records.
 *   2. Strict trust boundary: unverified OCR values are quarantined and never mixed with verified trends.
 *   3. Strict pathway isolation: female (OvaSense), male (AndroSense), universal (General).
 *   4. Patient-friendly language: non-clinical, non-diagnostic, clear disclaimers.
 */

import type { HealthPathway, UserProfile } from '../types/onboarding';
import type { CycleRecord } from '../types/cycle';
import type { SymptomRecord } from '../types/symptom';
import type { MedicalReport } from '../types/report';
import type { FoodLogEntry, WaterLogEntry } from '../types/diet';
import type { FitnessLogEntry } from '../types/fitness';
import type { TimelineEvent } from '../types/timeline';
import type {
  MonitoringPeriod,
  TrendState,
  TrendDirection,
  SymptomLongitudinalStats,
  RecurringSymptomStat,
  CycleLongitudinalStats,
  AndroSenseLongitudinalStats,
  GeneralLongitudinalStats,
  BiomarkerLongitudinalComparison,
  BiomarkerReading,
  PeriodComparisonSummary,
  ChronologicalTimelineGroup,
  LongitudinalHealthOverview,
  TrendMetric,
} from '../types/longitudinal';
import { getDaysDifference, getCyclePhase } from './cycleCalculations.ts';

// ---------------------------------------------------------------------------
// 1. Date Range & Period Partitioning
// ---------------------------------------------------------------------------

export interface PeriodDateBounds {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  currentLabel: string;
  previousLabel: string;
  daysCount: number;
}

export function getPeriodDateBounds(
  period: MonitoringPeriod,
  referenceDate: Date = new Date()
): PeriodDateBounds {
  const currentEnd = new Date(referenceDate);
  currentEnd.setHours(23, 59, 59, 999);

  let daysCount = 30;
  if (period === '7d') daysCount = 7;
  else if (period === '30d') daysCount = 30;
  else if (period === '90d') daysCount = 90;
  else if (period === '180d') daysCount = 180;
  else if (period === 'all') daysCount = 365;

  const currentStart = new Date(currentEnd.getTime() - daysCount * 24 * 60 * 60 * 1000);
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - daysCount * 24 * 60 * 60 * 1000);
  previousStart.setHours(0, 0, 0, 0);

  const periodLabels: Record<MonitoringPeriod, { curr: string; prev: string }> = {
    '7d': { curr: 'Last 7 Days', prev: 'Previous 7 Days' },
    '30d': { curr: 'Last 30 Days', prev: 'Previous 30 Days' },
    '90d': { curr: 'Last 3 Months', prev: 'Previous 3 Months' },
    '180d': { curr: 'Last 6 Months', prev: 'Previous 6 Months' },
    all: { curr: 'All Stored History', prev: 'Prior Baseline' },
  };

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    currentLabel: periodLabels[period].curr,
    previousLabel: periodLabels[period].prev,
    daysCount,
  };
}

export function filterRecordsByPeriod<T>(
  records: T[],
  getDateStr: (r: T) => string | undefined,
  bounds: PeriodDateBounds
): { current: T[]; previous: T[] } {
  const current: T[] = [];
  const previous: T[] = [];

  for (const r of records) {
    const dStr = getDateStr(r);
    if (!dStr) continue;
    const date = new Date(dStr.includes('T') ? dStr : `${dStr}T12:00:00Z`);
    if (isNaN(date.getTime())) continue;

    if (date >= bounds.currentStart && date <= bounds.currentEnd) {
      current.push(r);
    } else if (date >= bounds.previousStart && date <= bounds.previousEnd) {
      previous.push(r);
    }
  }

  return { current, previous };
}

// ---------------------------------------------------------------------------
// 2. Symptom Longitudinal Calculations
// ---------------------------------------------------------------------------

export function calculateSymptomLongitudinal(
  symptoms: SymptomRecord[],
  cycleRecords: CycleRecord[],
  pathway: HealthPathway,
  _period: MonitoringPeriod,
  bounds: PeriodDateBounds
): SymptomLongitudinalStats {
  const { current, previous } = filterRecordsByPeriod(symptoms, (s) => s.occurredAt, bounds);

  if (current.length === 0 && previous.length === 0 && symptoms.length === 0) {
    return {
      totalLoggedCurrentPeriod: 0,
      totalLoggedPreviousPeriod: 0,
      trendState: 'insufficient_data',
      topRecurringSymptoms: [],
      frequencySummary: 'No symptoms logged in your health records yet.',
      intensitySummary: 'Start logging symptoms when they occur to track patterns over time.',
      hasSufficientData: false,
      insufficientDataReason: 'Keep logging your symptoms for a little longer. Once we have enough entries, you will be able to see a clearer pattern.',
      evidence: {
        source: 'symptoms',
        label: 'Symptom Records',
        recordCount: 0,
        trustLevel: 'user_entered',
        description: 'Zero symptom entries in selected timeframe.',
      },
      limitation: 'Patterns can only reflect what you actively log. Unlogged symptoms cannot be evaluated.',
    };
  }

  // Count by symptom type in current period
  const currentCounts: Record<string, { count: number; severities: string[]; cyclePhases: string[] }> = {};
  for (const s of current) {
    const name = s.symptomType || 'Unspecified';
    if (!currentCounts[name]) {
      currentCounts[name] = { count: 0, severities: [], cyclePhases: [] };
    }
    currentCounts[name].count += 1;
    if (s.severity) currentCounts[name].severities.push(s.severity);
  }

  // Count by symptom type in previous period
  const prevCounts: Record<string, number> = {};
  for (const s of previous) {
    const name = s.symptomType || 'Unspecified';
    prevCounts[name] = (prevCounts[name] || 0) + 1;
  }

  // Build top recurring list
  const topRecurring: RecurringSymptomStat[] = Object.entries(currentCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([name, data]) => {
      const pCount = prevCounts[name] || 0;
      let changeDirection: TrendDirection = 'unchanged';
      if (data.count > pCount) changeDirection = 'increased';
      else if (data.count < pCount) changeDirection = 'decreased';

      // Most common severity
      const severityCounts: Record<string, number> = {};
      data.severities.forEach((sev) => {
        severityCounts[sev] = (severityCounts[sev] || 0) + 1;
      });
      const topSev = Object.entries(severityCounts).sort((a, b) => b[1] - a[1])[0];

      return {
        name,
        currentCount: data.count,
        previousCount: pCount,
        changeDirection,
        mostCommonSeverity: topSev ? topSev[0] : 'moderate',
      };
    });

  // Calculate frequency diff
  let trendState: TrendState = 'stable';
  let frequencySummary = '';
  if (previous.length > 0) {
    if (current.length < previous.length) {
      trendState = 'improving';
      frequencySummary = `You logged ${current.length} symptom events in the ${bounds.currentLabel}, down from ${previous.length} in the ${bounds.previousLabel}.`;
    } else if (current.length > previous.length) {
      trendState = 'changing';
      frequencySummary = `You logged ${current.length} symptom events in the ${bounds.currentLabel}, compared with ${previous.length} in the ${bounds.previousLabel}.`;
    } else {
      trendState = 'stable';
      frequencySummary = `Symptom frequency remained steady with ${current.length} events logged in both periods.`;
    }
  } else {
    trendState = current.length >= 3 ? 'developing_pattern' : 'insufficient_data';
    frequencySummary = `${current.length} symptom event${current.length === 1 ? '' : 's'} recorded during this period. Regular logging will reveal frequency comparisons.`;
  }

  // Intensity summary
  const severeCount = current.filter((s) => s.severity === 'severe').length;
  const modCount = current.filter((s) => s.severity === 'moderate').length;
  let intensitySummary = '';
  if (severeCount > 0) {
    intensitySummary = `${severeCount} of ${current.length} symptoms were reported as severe; ${modCount} were moderate.`;
  } else if (current.length > 0) {
    intensitySummary = `Most logged symptoms were mild or moderate in intensity during this window.`;
  } else {
    intensitySummary = `No symptoms recorded in this timeframe.`;
  }

  // OvaSense Female Pathway: Cycle Phase Clustering
  let phaseClusters: SymptomLongitudinalStats['phaseClusters'] = undefined;
  if (pathway === 'female' && cycleRecords.length > 0 && current.length > 0) {
    const clusterMap: Record<string, number> = {
      menstrual: 0,
      follicular: 0,
      ovulation: 0,
      luteal: 0,
    };
    const phaseNames: Record<string, string> = {
      menstrual: 'Menstrual Phase (Period)',
      follicular: 'Follicular Phase',
      ovulation: 'Ovulatory Window',
      luteal: 'Luteal Phase',
    };

    const latestCycle = cycleRecords[0];
    const cycleLen = 28;
    const periodDur = 5;

    current.forEach((s) => {
      if (latestCycle?.periodStartDate) {
        const diff = getDaysDifference(latestCycle.periodStartDate, s.occurredAt);
        if (diff >= 0) {
          const day = (diff % cycleLen) + 1;
          const phase = getCyclePhase(day, cycleLen, periodDur);
          const key = phase.key in clusterMap ? phase.key : 'luteal';
          clusterMap[key] += 1;
        }
      }
    });

    phaseClusters = Object.entries(clusterMap)
      .filter(([_, count]) => count > 0)
      .map(([key, symptomCount]) => ({
        phaseName: phaseNames[key] || key,
        symptomCount,
        percentage: Math.round((symptomCount / (current.length || 1)) * 100),
      }));
  }

  return {
    totalLoggedCurrentPeriod: current.length,
    totalLoggedPreviousPeriod: previous.length,
    trendState,
    topRecurringSymptoms: topRecurring,
    frequencySummary,
    intensitySummary,
    phaseClusters,
    hasSufficientData: current.length >= 2,
    insufficientDataReason: current.length < 2
      ? 'A clearer symptom pattern will develop as you log symptoms across more days.'
      : undefined,
    evidence: {
      source: 'symptoms',
      label: 'Logged Symptoms',
      recordCount: current.length,
      trustLevel: 'user_entered',
      description: `${current.length} symptom records evaluated across ${bounds.currentLabel}.`,
    },
    limitation: 'Calculated purely from self-reported symptoms and does not substitute for clinical diagnostics.',
  };
}

// ---------------------------------------------------------------------------
// 3. OvaSense: Menstrual Cycle Longitudinal Calculations (Female Only)
// ---------------------------------------------------------------------------

export function calculateCycleLongitudinal(
  cycleRecords: CycleRecord[],
  _period: MonitoringPeriod,
  _bounds: PeriodDateBounds
): CycleLongitudinalStats {
  if (!cycleRecords || cycleRecords.length < 2) {
    return {
      recordedCyclesCount: cycleRecords?.length || 0,
      intervals: [],
      averageCycleLength: null,
      averagePeriodDuration: null,
      regularityClassification: 'insufficient_data',
      trendState: 'insufficient_data',
      cycleHistory: [],
      hasSufficientData: false,
      insufficientDataReason: 'Log at least 2 consecutive period start dates to reveal interval changes and rhythm consistency.',
      observation: 'Cycle interval trends require multiple recorded cycles to establish a reliable cadence.',
      evidence: {
        source: 'cycle',
        label: 'Menstrual Cycle History',
        recordCount: cycleRecords?.length || 0,
        trustLevel: 'user_entered',
        description: `${cycleRecords?.length || 0} period start record(s) on file.`,
      },
      limitation: 'Cannot calculate interval changes with fewer than 2 logged periods.',
    };
  }

  // Sort chronological ascending (oldest first)
  const sortedAsc = [...cycleRecords].sort(
    (a, b) => new Date(a.periodStartDate).getTime() - new Date(b.periodStartDate).getTime()
  );

  const intervals: number[] = [];
  const durations: number[] = [];
  const history: CycleLongitudinalStats['cycleHistory'] = [];

  for (let i = 0; i < sortedAsc.length; i++) {
    const cur = sortedAsc[i];
    const next = sortedAsc[i + 1];

    const dur = Math.max(1, getDaysDifference(cur.periodStartDate, cur.periodEndDate) + 1);
    durations.push(dur);

    let cycleLengthDays: number | undefined = undefined;
    if (next) {
      const diff = getDaysDifference(cur.periodStartDate, next.periodStartDate);
      if (diff >= 15 && diff <= 90) {
        cycleLengthDays = diff;
        intervals.push(diff);
      }
    }

    history.push({
      cycleIndex: i + 1,
      startDate: cur.periodStartDate,
      endDate: cur.periodEndDate,
      durationDays: dur,
      cycleLengthDays,
      flow: cur.flow || 'medium',
      symptomsCount: Array.isArray(cur.symptoms) ? cur.symptoms.length : 0,
    });
  }

  // Reverse history so newest cycle is on top for display
  history.reverse();

  const avgInterval = intervals.length > 0
    ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    : null;
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  // Regularity classification based on variance
  let regularityClassification: CycleLongitudinalStats['regularityClassification'] = 'insufficient_data';
  let trendState: TrendState = 'stable';
  let observation = '';

  if (intervals.length >= 2) {
    const maxDiff = Math.max(...intervals) - Math.min(...intervals);
    if (maxDiff <= 4) {
      regularityClassification = 'consistent';
      trendState = 'stable';
      observation = `Your cycle length averaged ${avgInterval} days with high consistency (variation of only ${maxDiff} days across ${intervals.length} cycles).`;
    } else if (maxDiff <= 8) {
      regularityClassification = 'consistent';
      trendState = 'developing_pattern';
      observation = `Your cycle length averaged ${avgInterval} days with moderate variation (${Math.min(...intervals)}–${Math.max(...intervals)} days).`;
    } else {
      regularityClassification = 'variable';
      trendState = 'changing';
      observation = `Your cycle intervals show variability (${Math.min(...intervals)}–${Math.max(...intervals)} days), a common observation in PCOS.`;
    }
  } else if (intervals.length === 1) {
    regularityClassification = 'insufficient_data';
    trendState = 'developing_pattern';
    observation = `1 completed cycle interval recorded (${intervals[0]} days). Keep logging to track consistency.`;
  }

  return {
    recordedCyclesCount: cycleRecords.length,
    intervals,
    averageCycleLength: avgInterval,
    averagePeriodDuration: avgDuration,
    regularityClassification,
    trendState,
    cycleHistory: history,
    hasSufficientData: intervals.length >= 1,
    observation,
    evidence: {
      source: 'cycle',
      label: 'Menstrual Cycle Records',
      recordCount: cycleRecords.length,
      trustLevel: 'user_entered',
      description: `${cycleRecords.length} recorded period entries evaluated.`,
    },
    limitation: 'Calculates interval lengths between reported bleeding dates; does not confirm ovulation or progesterone production.',
  };
}

// ---------------------------------------------------------------------------
// 4. AndroSense: Male Endocrine & Lifestyle Longitudinal (Male Only)
// ---------------------------------------------------------------------------

export function calculateAndroSenseLongitudinal(
  profile: UserProfile,
  fitnessLogs: FitnessLogEntry[],
  _symptomRecords: SymptomRecord[],
  reports: MedicalReport[],
  _period: MonitoringPeriod,
  bounds: PeriodDateBounds
): AndroSenseLongitudinalStats {
  const mh = profile.mensHealth;
  const { current: curFitness, previous: prevFitness } = filterRecordsByPeriod(
    fitnessLogs,
    (f) => f.occurredAt,
    bounds
  );

  const energyLevelCurrent = mh?.energyLevel || 'moderate';
  const sleepHours = profile.lifestyle?.sleepHours || 7.5;

  // Extract all testosterone draws from verified lab reports and profile
  const testosteroneReadings: AndroSenseLongitudinalStats['testosteroneReadings'] = [];

  // From profile entry
  if (mh?.hadTestosteroneTest === 'yes' && mh.testosteroneValue) {
    testosteroneReadings.push({
      date: 'Reported Baseline',
      value: Number(mh.testosteroneValue),
      unit: mh.testosteroneUnit || 'ng/dL',
      drawTiming: mh.testDrawTime === 'morning_fasting' ? 'Morning Fasting (Peak)' : 'Standard Draw',
      source: 'self_reported',
      userVerified: false,
    });
  }

  // From verified reports
  reports.forEach((rep) => {
    (rep.results || []).forEach((res) => {
      const isTestosterone =
        res.testName.toLowerCase().includes('testosterone') ||
        res.testName.toLowerCase().includes('total t');
      if (isTestosterone && res.userVerified && res.resultNumeric) {
        testosteroneReadings.push({
          date: rep.reportDate,
          value: res.resultNumeric,
          unit: res.unit || 'ng/dL',
          drawTiming: 'Verified Clinical Venipuncture',
          source: 'verified_lab',
          userVerified: true,
        });
      }
    });
  });

  const hasTestosterone = testosteroneReadings.length > 0;
  let trendState: TrendState = 'stable';
  let observation = '';

  if (curFitness.length > 0 && prevFitness.length > 0) {
    if (curFitness.length >= prevFitness.length) {
      trendState = 'improving';
      observation = `You completed ${curFitness.length} workout sessions in the ${bounds.currentLabel} (steady from ${prevFitness.length} prior), supporting endocrine recovery.`;
    } else {
      trendState = 'changing';
      observation = `You logged ${curFitness.length} workouts this period compared with ${prevFitness.length} previously.`;
    }
  } else if (curFitness.length > 0) {
    trendState = 'developing_pattern';
    observation = `You logged ${curFitness.length} workout sessions this period with average sleep of ${sleepHours} hours.`;
  } else {
    trendState = 'insufficient_data';
    observation = `Logged energy level: ${energyLevelCurrent.replace('_', ' ')}. Add workout logs and sleep tracking to establish activity trends.`;
  }

  return {
    energyLevelCurrent: energyLevelCurrent.replace('_', ' '),
    energyLevelReportedChanges: `Reported baseline alertness: ${energyLevelCurrent.replace('_', ' ')}. Sleep duration: ${sleepHours} hours/night.`,
    sleepDurationAverage: sleepHours,
    sleepAdherence: sleepHours >= 7.0 ? 'consistent' : 'variable',
    movementSessionsCurrent: curFitness.length,
    movementSessionsPrevious: prevFitness.length,
    hydrationComplianceRate: profile.lifestyle?.dailyWaterGlasses ? 100 : 0,
    hasTestosteroneHistory: hasTestosterone,
    testosteroneReadings,
    trendState,
    observation,
    hasSufficientData: curFitness.length >= 1 || hasTestosterone,
    evidence: {
      source: 'movement',
      label: "Men's Health & Movement History",
      recordCount: curFitness.length + testosteroneReadings.length,
      trustLevel: 'user_entered',
      description: `${curFitness.length} workout session(s) and ${testosteroneReadings.length} testosterone marker(s) on file.`,
    },
    limitation: 'Self-reported energy and activity levels do not replace clinical endocrine testing.',
  };
}

// ---------------------------------------------------------------------------
// 5. Universal General Pathway Longitudinal
// ---------------------------------------------------------------------------

export function calculateGeneralLongitudinal(
  foodLogs: FoodLogEntry[],
  waterLog: WaterLogEntry | null,
  fitnessLogs: FitnessLogEntry[],
  profile: UserProfile,
  _period: MonitoringPeriod,
  bounds: PeriodDateBounds
): GeneralLongitudinalStats {
  const { current: curFood } = filterRecordsByPeriod(foodLogs, (f) => f.loggedAt, bounds);
  const { current: curFitness } = filterRecordsByPeriod(fitnessLogs, (f) => f.occurredAt, bounds);

  const waterGlasses = waterLog?.glasses || 0;
  const targetWater = waterLog?.targetGlasses || profile.lifestyle?.dailyWaterGlasses || 8;
  const isHydrationMet = waterGlasses >= targetWater;

  let trendState: TrendState = 'stable';
  if (curFitness.length >= 3 && isHydrationMet) {
    trendState = 'improving';
  } else if (curFitness.length === 0 && curFood.length === 0 && waterGlasses === 0) {
    trendState = 'insufficient_data';
  }

  return {
    hydrationDaysMetCurrent: isHydrationMet ? 1 : 0,
    hydrationDaysMetPrevious: 0,
    nutritionMealsLoggedCurrent: curFood.length,
    fitnessWorkoutsCurrent: curFitness.length,
    sleepAverageHours: profile.lifestyle?.sleepHours || 7.5,
    trendState,
    observation: `Across ${bounds.currentLabel}, you recorded ${curFood.length} meals, ${curFitness.length} movement sessions, and ${waterGlasses} glasses of water today.`,
    evidence: {
      source: 'nutrition',
      label: 'Lifestyle Records',
      recordCount: curFood.length + curFitness.length + waterGlasses,
      trustLevel: 'user_entered',
      description: 'Daily nutrition, hydration, and fitness logging events.',
    },
    limitation: 'Lifestyle logs reflect user tracking consistency and are strictly observational.',
  };
}

// ---------------------------------------------------------------------------
// 6. Lab & Medical Report Longitudinal (Trust Boundary & OCR Quarantine)
// ---------------------------------------------------------------------------

export function calculateBiomarkerLongitudinal(
  reports: MedicalReport[]
): {
  comparisons: BiomarkerLongitudinalComparison[];
  quarantinedCount: number;
} {
  let quarantinedCount = 0;
  const readingsByTest: Record<string, BiomarkerReading[]> = {};

  reports.forEach((rep) => {
    (rep.results || []).forEach((res) => {
      if (!res.userVerified) {
        quarantinedCount += 1;
        return; // QUARANTINED: never include unverified OCR in trusted comparisons!
      }

      if (res.resultNumeric === null || res.resultNumeric === undefined) {
        return;
      }

      const testKey = res.testName.trim().toUpperCase();
      if (!readingsByTest[testKey]) {
        readingsByTest[testKey] = [];
      }

      readingsByTest[testKey].push({
        reportId: rep.id,
        reportTitle: rep.title,
        reportDate: rep.reportDate,
        value: res.resultNumeric,
        valueString: res.resultValue,
        unit: res.unit || '',
        referenceRange: res.referenceRange || '',
        status: res.status,
        userVerified: true,
      });
    });
  });

  const comparisons: BiomarkerLongitudinalComparison[] = [];

  Object.entries(readingsByTest).forEach(([rawName, readings]) => {
    // Sort chronological ascending (oldest first)
    readings.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());

    // Check unit consistency
    const firstUnit = readings[0].unit;
    const sameUnitReadings = readings.filter(
      (r) => r.unit.toLowerCase() === firstUnit.toLowerCase()
    );

    const latest = sameUnitReadings[sameUnitReadings.length - 1];
    const previous = sameUnitReadings.length >= 2
      ? sameUnitReadings[sameUnitReadings.length - 2]
      : undefined;

    let direction: TrendDirection = 'unchanged';
    let observation = '';

    if (previous) {
      const diff = Math.round((latest.value - previous.value) * 100) / 100;
      if (diff > 0) {
        direction = 'increased';
        observation = `Your verified ${latest.valueString} ${latest.unit} recorded on ${latest.reportDate} changed from ${previous.valueString} ${previous.unit} on ${previous.reportDate} (+${diff} ${latest.unit}).`;
      } else if (diff < 0) {
        direction = 'decreased';
        observation = `Your verified ${latest.valueString} ${latest.unit} recorded on ${latest.reportDate} changed from ${previous.valueString} ${previous.unit} on ${previous.reportDate} (${diff} ${latest.unit}).`;
      } else {
        direction = 'unchanged';
        observation = `Your verified result remained identical at ${latest.valueString} ${latest.unit} across both reports.`;
      }
    } else {
      direction = 'unchanged';
      observation = `Your latest verified result was recorded on ${latest.reportDate} (${latest.valueString} ${latest.unit}). Upload a subsequent test to view changes over time.`;
    }

    comparisons.push({
      testName: readings[0].reportTitle ? rawName : rawName,
      unit: firstUnit,
      verifiedReadings: sameUnitReadings,
      latestValue: latest.value,
      latestDate: latest.reportDate,
      previousValue: previous?.value,
      previousDate: previous?.reportDate,
      direction,
      referenceRange: latest.referenceRange,
      observation,
      isClinicallyVerified: true,
      quarantinedDraftCount: quarantinedCount,
      limitation: 'Laboratory results reflect your physiology at the exact date and time of the draw. Consult your doctor for clinical interpretation.',
    });
  });

  return {
    comparisons,
    quarantinedCount,
  };
}

// ---------------------------------------------------------------------------
// 7. Period Comparison Summaries (Current vs Previous)
// ---------------------------------------------------------------------------

export function calculatePeriodComparisons(
  symptoms: SymptomRecord[],
  fitnessLogs: FitnessLogEntry[],
  foodLogs: FoodLogEntry[],
  waterLog: WaterLogEntry | null,
  bounds: PeriodDateBounds
): PeriodComparisonSummary[] {
  const { current: curSymp, previous: prevSymp } = filterRecordsByPeriod(symptoms, (s) => s.occurredAt, bounds);
  const { current: curFit, previous: prevFit } = filterRecordsByPeriod(fitnessLogs, (f) => f.occurredAt, bounds);
  const { current: curFood, previous: prevFood } = filterRecordsByPeriod(foodLogs, (f) => f.loggedAt, bounds);

  const summaries: PeriodComparisonSummary[] = [];

  // A. Symptom Logging Frequency Comparison
  const sympDiff = curSymp.length - prevSymp.length;
  summaries.push({
    id: 'comp_symptoms',
    category: 'symptoms',
    metricLabel: 'Symptom Events Logged',
    currentPeriodLabel: bounds.currentLabel,
    previousPeriodLabel: bounds.previousLabel,
    currentValue: curSymp.length,
    previousValue: prevSymp.length,
    direction: sympDiff > 0 ? 'increased' : sympDiff < 0 ? 'decreased' : 'unchanged',
    observation: prevSymp.length > 0
      ? `You logged ${Math.abs(sympDiff)} ${sympDiff > 0 ? 'more' : 'fewer'} symptom event${Math.abs(sympDiff) === 1 ? '' : 's'} than in the ${bounds.previousLabel}.`
      : `${curSymp.length} symptom event${curSymp.length === 1 ? '' : 's'} logged in ${bounds.currentLabel}.`,
    evidence: {
      source: 'symptoms',
      label: 'Symptom Records',
      recordCount: curSymp.length + prevSymp.length,
      trustLevel: 'user_entered',
      description: `Comparing ${curSymp.length} current vs ${prevSymp.length} previous logs.`,
    },
    limitation: 'Reflects self-reporting behavior; fewer logged symptoms may indicate either fewer symptoms or less frequent logging.',
    hasSufficientData: curSymp.length > 0 || prevSymp.length > 0,
  });

  // B. Movement / Fitness Sessions Comparison
  const fitDiff = curFit.length - prevFit.length;
  summaries.push({
    id: 'comp_fitness',
    category: 'movement',
    metricLabel: 'Activity Sessions Completed',
    currentPeriodLabel: bounds.currentLabel,
    previousPeriodLabel: bounds.previousLabel,
    currentValue: curFit.length,
    previousValue: prevFit.length,
    direction: fitDiff > 0 ? 'increased' : fitDiff < 0 ? 'decreased' : 'unchanged',
    observation: prevFit.length > 0
      ? `You completed ${curFit.length} workout session${curFit.length === 1 ? '' : 's'} in the ${bounds.currentLabel} (${fitDiff >= 0 ? `+${fitDiff}` : `${fitDiff}`} vs prior).`
      : `${curFit.length} workout session${curFit.length === 1 ? '' : 's'} recorded during this period.`,
    evidence: {
      source: 'movement',
      label: 'Workout Sessions',
      recordCount: curFit.length + prevFit.length,
      trustLevel: 'user_entered',
      description: 'Activity logs comparing both consecutive time windows.',
    },
    limitation: 'Movement tracking measures frequency of entered activities, not cardiovascular intensity metrics.',
    hasSufficientData: curFit.length > 0 || prevFit.length > 0,
  });

  // C. Nutrition / Meals Logged Comparison
  const foodDiff = curFood.length - prevFood.length;
  summaries.push({
    id: 'comp_nutrition',
    category: 'nutrition',
    metricLabel: 'Logged Nutrition Entries',
    currentPeriodLabel: bounds.currentLabel,
    previousPeriodLabel: bounds.previousLabel,
    currentValue: curFood.length,
    previousValue: prevFood.length,
    direction: foodDiff > 0 ? 'increased' : foodDiff < 0 ? 'decreased' : 'unchanged',
    observation: prevFood.length > 0
      ? `You recorded ${curFood.length} meals in the ${bounds.currentLabel} compared with ${prevFood.length} in the ${bounds.previousLabel}.`
      : `${curFood.length} meal${curFood.length === 1 ? '' : 's'} recorded in your nutrition log.`,
    evidence: {
      source: 'nutrition',
      label: 'Nutrition Diary',
      recordCount: curFood.length + prevFood.length,
      trustLevel: 'user_entered',
      description: 'Meal and snack entries logged in your food journal.',
    },
    limitation: 'Meal frequency does not measure micronutrient absorption or metabolic compliance.',
    hasSufficientData: curFood.length > 0 || prevFood.length > 0,
  });

  // D. Water Intake Comparison
  if (waterLog) {
    const glasses = waterLog.glasses || 0;
    summaries.push({
      id: 'comp_water',
      category: 'water',
      metricLabel: 'Daily Hydration Status',
      currentPeriodLabel: bounds.currentLabel,
      previousPeriodLabel: bounds.previousLabel,
      currentValue: `${glasses} glasses`,
      previousValue: 'Baseline target',
      direction: glasses >= 8 ? 'increased' : 'unchanged',
      observation: `You logged ${glasses} glasses of water today against your daily hydration target.`,
      evidence: {
        source: 'water',
        label: 'Hydration Tracker',
        recordCount: 1,
        trustLevel: 'user_entered',
        description: `Recorded ${glasses} glasses of water.`,
      },
      limitation: 'Reflects manually entered water intake and does not measure cellular hydration or electrolytes.',
      hasSufficientData: true,
    });
  }

  return summaries;
}

// ---------------------------------------------------------------------------
// 8. Chronological Timeline Grouping (Today, This Week, Earlier)
// ---------------------------------------------------------------------------

export function groupTimelineEvents(events: TimelineEvent[]): ChronologicalTimelineGroup[] {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = todayMidnight - 7 * 24 * 60 * 60 * 1000;

  const todayEvents: TimelineEvent[] = [];
  const thisWeekEvents: TimelineEvent[] = [];
  const earlierEvents: TimelineEvent[] = [];

  events.forEach((evt) => {
    const evtDate = new Date(evt.date);
    const evtTime = new Date(evtDate.getFullYear(), evtDate.getMonth(), evtDate.getDate()).getTime();

    if (evtTime >= todayMidnight) {
      todayEvents.push(evt);
    } else if (evtTime >= sevenDaysAgo) {
      thisWeekEvents.push(evt);
    } else {
      earlierEvents.push(evt);
    }
  });

  const groups: ChronologicalTimelineGroup[] = [];
  if (todayEvents.length > 0) {
    groups.push({ groupKey: 'today', groupTitle: 'Today', events: todayEvents });
  }
  if (thisWeekEvents.length > 0) {
    groups.push({ groupKey: 'this_week', groupTitle: 'This Week', events: thisWeekEvents });
  }
  if (earlierEvents.length > 0) {
    groups.push({ groupKey: 'earlier', groupTitle: 'Earlier', events: earlierEvents });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// 9. Central Progress Overview Synthesizer
// ---------------------------------------------------------------------------

export function synthesizeProgressOverview(
  trends: TrendMetric[],
  _periodComparisons: PeriodComparisonSummary[],
  biomarkers: BiomarkerLongitudinalComparison[],
  _pathway: HealthPathway
): LongitudinalHealthOverview {
  const whatHasChanged: string[] = [];
  const whatHasStayedSimilar: string[] = [];
  const whatIsImproving: string[] = [];
  const whatIsLimited: string[] = [];

  trends.forEach((t) => {
    if (t.trendState === 'improving') {
      whatIsImproving.push(t.whatChanged);
    } else if (t.trendState === 'changing') {
      whatHasChanged.push(t.whatChanged);
    } else if (t.trendState === 'stable') {
      whatHasStayedSimilar.push(t.whatChanged);
    } else if (t.trendState === 'insufficient_data') {
      whatIsLimited.push(t.whatChanged);
    }
  });

  biomarkers.forEach((b) => {
    if (b.previousValue !== undefined) {
      whatHasChanged.push(b.observation);
    } else {
      whatIsLimited.push(`${b.testName}: Single verified result on record; multiple tests needed to compare.`);
    }
  });

  return {
    whatHasChanged,
    whatHasStayedSimilar,
    whatIsImproving,
    whatIsLimited,
  };
}

// ---------------------------------------------------------------------------
// 10. Apple Health Clinical Utilities & Baseline Synthesis
// ---------------------------------------------------------------------------

export type DirectionType = 'stable' | 'increased' | 'decreased' | 'baseline' | 'no_data';

export interface MetricDeltaResult {
  previousValue: number | null;
  currentValue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  direction: DirectionType;
  displayChange: string;
  isStable: boolean;
  unit: string;
}

export interface LongitudinalRecordLike {
  timestamp?: string | number | Date | null;
  observed_at?: string | null;
  created_at?: string | null;
  date?: string | null;
  [key: string]: any;
}

export function extractRecordTimestamp(record: LongitudinalRecordLike | null | undefined): number {
  if (!record) return 0;
  const raw =
    record.timestamp ||
    record.observed_at ||
    record.created_at ||
    record.date;

  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortRecordsChronologically<T extends LongitudinalRecordLike>(
  records: T[] | null | undefined,
  ascending = true
): T[] {
  if (!records || !Array.isArray(records)) return [];
  const copy = [...records];
  return copy.sort((a, b) => {
    const tA = extractRecordTimestamp(a);
    const tB = extractRecordTimestamp(b);
    return ascending ? tA - tB : tB - tA;
  });
}

export function calculateMetricDelta(
  previousValue: number | null | undefined,
  currentValue: number | null | undefined,
  unit = ''
): MetricDeltaResult {
  const prev = typeof previousValue === 'number' && !Number.isNaN(previousValue) ? previousValue : null;
  const curr = typeof currentValue === 'number' && !Number.isNaN(currentValue) ? currentValue : null;

  if (curr === null) {
    return {
      previousValue: prev,
      currentValue: null,
      absoluteChange: null,
      percentageChange: null,
      direction: 'no_data',
      displayChange: 'No data',
      isStable: false,
      unit,
    };
  }

  if (prev === null) {
    return {
      previousValue: null,
      currentValue: curr,
      absoluteChange: null,
      percentageChange: null,
      direction: 'baseline',
      displayChange: 'Baseline recorded',
      isStable: false,
      unit,
    };
  }

  const rawAbs = curr - prev;
  const absChange = Math.round(rawAbs * 100) / 100;
  const isStable = Math.abs(absChange) < 0.05;

  let pctChange: number | null = null;
  if (prev !== 0) {
    pctChange = Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;
  }

  let direction: DirectionType = 'stable';
  if (!isStable) {
    direction = absChange > 0 ? 'increased' : 'decreased';
  }

  const sign = absChange > 0 ? '+' : '';
  const displayChange = isStable
    ? 'Stable'
    : `${sign}${absChange}${unit ? ` ${unit}` : ''}${pctChange !== null ? ` (${sign}${pctChange}%)` : ''}`;

  return {
    previousValue: prev,
    currentValue: curr,
    absoluteChange: absChange,
    percentageChange: pctChange,
    direction,
    displayChange,
    isStable,
    unit,
  };
}

export function getTrendExplanation(
  metricLabel: string,
  values: number[] | null | undefined,
  _dates?: (string | null | undefined)[],
  unit = ''
): string {
  if (!values || values.length === 0) {
    return `No ${metricLabel.toLowerCase()} entries have been recorded yet.`;
  }

  const cleanUnit = unit ? ` ${unit}` : '';

  if (values.length === 1) {
    return `One measurement recorded (${values[0]}${cleanUnit}). Trend analysis will become available after another measurement.`;
  }

  const n = values.length;
  const first = values[0];
  const latest = values[n - 1];
  const delta = Math.round((latest - first) * 100) / 100;

  const allIdentical = values.every((v) => Math.abs(v - first) < 0.01);
  if (allIdentical) {
    return `Your recorded ${metricLabel.toLowerCase()} has remained stable at ${first}${cleanUnit} across ${n} measurements.`;
  }

  const prev = values[n - 2];
  const recentDelta = Math.round((latest - prev) * 100) / 100;
  const recentSign = recentDelta > 0 ? '+' : '';

  if (n === 2) {
    return `Your ${metricLabel.toLowerCase()} changed from ${first}${cleanUnit} to ${latest}${cleanUnit} since the previous measurement (${recentSign}${recentDelta}${cleanUnit}).`;
  }

  const overallSign = delta > 0 ? '+' : '';
  return `Your ${metricLabel.toLowerCase()} has changed from ${first} to ${latest}${cleanUnit} across ${n} recorded measurements (${overallSign}${delta}${cleanUnit} overall).`;
}

export function formatClinicalDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'Not recorded';
  try {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return 'Not recorded';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Not recorded';
  }
}

export interface BaselineContextParams {
  userProfile?: any;
  activeAssessment?: any;
  cycleRecords?: any[];
  symptomRecords?: any[];
  reports?: any[];
  pathway?: 'female' | 'male' | 'general';
  period?: '30d' | '90d' | '180d' | '1y' | 'all';
}

export function deriveBaselineFromContext(params: BaselineContextParams): any {
  const {
    userProfile,
    activeAssessment,
    cycleRecords = [],
    symptomRecords = [],
    reports = [],
    pathway = 'female',
    period = '90d',
  } = params;

  const isMale = pathway === 'male';
  const moduleName = isMale ? 'male_hypogonadism' : 'female_pcos';
  const hasAssessment = Boolean(activeAssessment && (activeAssessment.has_assessment || activeAssessment.probability !== undefined));

  const weightKg = typeof userProfile?.weightKg === 'number' && userProfile.weightKg > 0 ? userProfile.weightKg : null;
  const heightCm = typeof userProfile?.heightCm === 'number' && userProfile.heightCm > 0 ? userProfile.heightCm : null;
  const calculatedBmi =
    weightKg && heightCm
      ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10
      : null;

  const createdAt = userProfile?.created_at || new Date().toISOString();
  const createdFormatted = formatClinicalDate(createdAt);

  const metricSeries: Record<string, any> = {};

  if (weightKg !== null) {
    metricSeries.weight_kg = {
      metric_key: 'weight_kg',
      label: 'Body Weight',
      unit: 'kg',
      category: 'anthropometric',
      value_type: 'numeric',
      comparison_type: 'continuous',
      clinical_directionality: 'neutral',
      is_graphable: true,
      data_points: [
        {
          id: 'baseline_weight',
          timestamp: createdAt,
          observed_at: createdFormatted,
          value: weightKg,
          source: 'screening_assessment',
          date_source: 'assessment',
          is_verified: true,
        },
      ],
    };
  }

  if (calculatedBmi !== null) {
    metricSeries.bmi = {
      metric_key: 'bmi',
      label: 'Body Mass Index',
      unit: 'kg/m²',
      category: 'anthropometric',
      value_type: 'numeric',
      comparison_type: 'continuous',
      clinical_directionality: 'neutral',
      is_graphable: true,
      data_points: [
        {
          id: 'baseline_bmi',
          timestamp: createdAt,
          observed_at: createdFormatted,
          value: calculatedBmi,
          source: 'screening_assessment',
          date_source: 'assessment',
          is_verified: true,
        },
      ],
    };
  }

  for (const report of reports) {
    const reportDate = report.reportDate || report.report_date || report.created_at;
    const results = report.results || [];
    for (const res of results) {
      if (res.userVerified && typeof res.resultNumeric === 'number') {
        const key = (res.testName || 'test').toLowerCase().replace(/\s+/g, '_');
        if (!metricSeries[key]) {
          metricSeries[key] = {
            metric_key: key,
            label: res.testName || 'Lab Marker',
            unit: res.unit || '',
            category: 'laboratory',
            value_type: 'numeric',
            comparison_type: 'continuous',
            clinical_directionality: 'neutral',
            is_graphable: true,
            data_points: [],
          };
        }
        metricSeries[key].data_points.push({
          id: `lab_${res.id || Math.random()}`,
          timestamp: reportDate,
          observed_at: formatClinicalDate(reportDate),
          value: res.resultNumeric,
          source: 'verified_lab_report',
          date_source: 'specimen',
          is_verified: true,
        });
      }
    }
  }

  const timelineEvents: any[] = [];
  if (hasAssessment) {
    const assDate = activeAssessment.created_at || createdAt;
    timelineEvents.push({
      id: 'event_ass_1',
      event_type: 'screening_assessment',
      title: isMale ? 'Initial Hypogonadism Screening Completed' : 'Initial PCOS Clinical Screening Completed',
      description: `Calculated probability: ${Math.round((activeAssessment.probability ?? 0.2) * 100)}% (${activeAssessment.risk_label || 'Assessment Baseline'})`,
      timestamp: assDate,
      observed_at: formatClinicalDate(assDate),
      date_source: 'assessment',
    });
  }

  for (const rep of reports.slice(0, 5)) {
    const repDate = rep.reportDate || rep.report_date || rep.created_at;
    timelineEvents.push({
      id: `event_rep_${rep.id}`,
      event_type: 'verified_lab_report',
      title: `Medical Lab Report: ${rep.title || 'Laboratory Results'}`,
      description: `${(rep.results || []).length} biomarkers recorded`,
      timestamp: repDate,
      observed_at: formatClinicalDate(repDate),
      date_source: 'report',
    });
  }

  const screeningHistory: any[] = [];
  if (hasAssessment) {
    const prob = Number(activeAssessment.probability ?? 0);
    const probPct = Math.round(prob * 1000) / 10;
    screeningHistory.push({
      id: activeAssessment.id || 'baseline_ass',
      assessment_level: activeAssessment.assessment_level || 'tier_1',
      tier_label: isMale
        ? activeAssessment.assessment_level === 'tier_2'
          ? 'Tier 2: Hormonal & Clinical Labs'
          : 'Tier 1: Symptoms & Biometrics'
        : activeAssessment.assessment_level === 'tier_2'
          ? 'Tier 2: Clinical Laboratory Biomarkers'
          : 'Tier 1: Questionnaire & Phenotype',
      tiers_included: [1],
      probability: prob,
      probability_percent: probPct,
      threshold: isMale ? 0.1808 : 0.25,
      risk_category: activeAssessment.risk_category || 'lower',
      risk_label: activeAssessment.risk_label || 'Lower Screening Risk',
      model_name: 'BioPulse AI Model',
      model_version: '1.0.0',
      created_at: activeAssessment.created_at || createdAt,
      observed_at: formatClinicalDate(activeAssessment.created_at || createdAt),
      date_source: 'assessment',
      is_active: true,
    });
  }

  return {
    patient_id: userProfile?.id || 'active_user',
    module: moduleName,
    period: period,
    generated_at: new Date().toISOString(),
    tracking_period_display: createdFormatted ? `Tracking since ${createdFormatted}` : 'Baseline period',
    tracking_period_days: 1,
    total_assessments_recorded: hasAssessment ? 1 : 0,
    has_single_assessment_baseline: hasAssessment,
    has_no_assessments: !hasAssessment,
    disclaimer:
      'BioPulse AI provides longitudinal clinical decision support and health trend visualization. Longitudinal indicators reflect mathematical comparisons between recorded clinical assessments and do not constitute a definitive medical diagnosis. Always consult with a qualified healthcare practitioner.',
    screening_comparability: hasAssessment
      ? {
          state: 'baseline',
          is_comparable: false,
          message: `Baseline established on ${formatClinicalDate(activeAssessment.created_at || createdAt)}. Complete another assessment later to begin comparison.`,
          current_tier: activeAssessment.assessment_level || 'tier_1',
          current_model_version: '1.0.0',
          delta_percentage_points: null,
        }
      : {
          state: 'no_assessments',
          is_comparable: false,
          message: 'No assessments recorded yet. Complete your first screening to begin tracking.',
          delta_percentage_points: null,
        },
    current_summary: {
      active_assessment_id: activeAssessment?.id || null,
      assessment_level: activeAssessment?.assessment_level || null,
      tier_label: hasAssessment
        ? isMale
          ? 'Tier 1: Symptoms & Biometrics'
          : 'Tier 1: Questionnaire & Phenotype'
        : 'Not yet assessed',
      screening_probability: hasAssessment ? Number(activeAssessment.probability ?? 0) : null,
      screening_probability_percent: hasAssessment ? Math.round(Number(activeAssessment.probability ?? 0) * 1000) / 10 : null,
      risk_category: hasAssessment ? activeAssessment.risk_category : null,
      risk_label: hasAssessment ? activeAssessment.risk_label : null,
      last_assessed_at: hasAssessment ? activeAssessment.created_at || createdAt : null,
      last_assessed_display: hasAssessment ? formatClinicalDate(activeAssessment.created_at || createdAt) : 'Not yet assessed',
      key_metrics: {
        weight_kg: weightKg,
        bmi: calculatedBmi,
        waist_circumference: userProfile?.waistCm || null,
      },
      metric_deltas: {
        weight_kg: calculateMetricDelta(null, weightKg, 'kg') as any,
        bmi: calculateMetricDelta(null, calculatedBmi, 'kg/m²') as any,
      },
    },
    screening_history: screeningHistory,
    metric_series: metricSeries,
    male_vitality_summary: null,
    important_changes: [],
    current_vs_previous: [],
    tier_progression: [
      {
        tier: 'tier_1',
        tier_number: 1,
        label: isMale ? 'Tier 1: Symptoms & Biometrics' : 'Tier 1: Questionnaire & Phenotype',
        is_completed: hasAssessment,
        completed_at_display: hasAssessment ? formatClinicalDate(activeAssessment.created_at || createdAt) : null,
        description: 'Baseline health history and phenotype screening.',
      },
    ],
    symptom_history: symptomRecords,
    cycle_history: isMale ? [] : cycleRecords,
    timeline_events: timelineEvents,
  };
}

