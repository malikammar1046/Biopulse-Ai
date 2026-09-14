/**
 * VITASense — Longitudinal Health Service (Phase 8)
 *
 * Orchestrates deterministic longitudinal trend synthesis, period-over-period comparisons,
 * verified clinical biomarker changes, and pathway-isolated progress tracking.
 *
 * Integrates directly with:
 *   - Digital Twin (historical state & trajectory dimensions)
 *   - Research Intelligence (Phase 7 ExplainableInsight architecture)
 *   - Master Health Timeline (grouped chronological history)
 */

import type { UserProfile, HealthPathway } from '../types/onboarding';
import type { CycleRecord } from '../types/cycle';
import type { SymptomRecord } from '../types/symptom';
import type { MedicalReport } from '../types/report';
import type { FoodLogEntry, WaterLogEntry } from '../types/diet';
import type { FitnessLogEntry } from '../types/fitness';
import type { MedicationItem, MedicationLogEntry } from '../types/medication';
import type { AppointmentItem } from '../types/appointment';
import type { CareCircleMember } from '../types/careCircle';
import type { ExplainableInsight, ExplainableDimensionNode } from '../types/researchIntelligence';
import type { TimelineEvent } from '../types/timeline';
import type {
  MonitoringPeriod,
  LongitudinalHealthState,
  TrendMetric,
} from '../types/longitudinal';
import {
  getPeriodDateBounds,
  calculateSymptomLongitudinal,
  calculateCycleLongitudinal,
  calculateAndroSenseLongitudinal,
  calculateGeneralLongitudinal,
  calculateBiomarkerLongitudinal,
  calculatePeriodComparisons,
  groupTimelineEvents,
  synthesizeProgressOverview,
  filterRecordsByPeriod,
} from '../utils/longitudinalCalculations.ts';
import { timelineService } from './timelineService.ts';

export interface LongitudinalServiceInput {
  userProfile: Partial<UserProfile>;
  symptomRecords: SymptomRecord[];
  cycleRecords: CycleRecord[];
  reports: MedicalReport[];
  foodLogs: FoodLogEntry[];
  waterLog: WaterLogEntry | null;
  fitnessLogs: FitnessLogEntry[];
  medications: MedicationItem[];
  medicationLogs: MedicationLogEntry[];
  appointments: AppointmentItem[];
  careCircleMembers: CareCircleMember[];
  pathway: HealthPathway;
  period?: MonitoringPeriod;
}

export class LongitudinalHealthService {
  /**
   * Synthesizes the full longitudinal state for the active pathway and monitoring period.
   */
  public static synthesizeState(input: LongitudinalServiceInput): LongitudinalHealthState {
    const {
      userProfile,
      symptomRecords,
      cycleRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs,
      appointments,
      careCircleMembers,
      pathway,
      period = '30d',
    } = input;

    const bounds = getPeriodDateBounds(period);

    // 1. Symptom Longitudinal Analytics
    const symptomLongitudinal = calculateSymptomLongitudinal(
      symptomRecords,
      cycleRecords,
      pathway,
      period,
      bounds
    );

    // 2. Pathway-Specific Longitudinal Domain
    let cycleLongitudinal = undefined;
    let androSenseLongitudinal = undefined;
    let generalLongitudinal = undefined;

    if (pathway === 'female') {
      cycleLongitudinal = calculateCycleLongitudinal(cycleRecords, period, bounds);
    } else if (pathway === 'male') {
      androSenseLongitudinal = calculateAndroSenseLongitudinal(
        userProfile as UserProfile,
        fitnessLogs,
        symptomRecords,
        reports,
        period,
        bounds
      );
    } else {
      generalLongitudinal = calculateGeneralLongitudinal(
        foodLogs,
        waterLog,
        fitnessLogs,
        userProfile as UserProfile,
        period,
        bounds
      );
    }

    // 3. Lab Biomarker Longitudinal Analytics (Verified Trust Boundary)
    const { comparisons: biomarkerComparisons, quarantinedCount } =
      calculateBiomarkerLongitudinal(reports);

    // 4. Period Comparison Summaries
    const periodComparisons = calculatePeriodComparisons(
      symptomRecords,
      fitnessLogs,
      foodLogs,
      waterLog,
      bounds
    );

    // 5. Timeline Synthesis & Grouping
    // Build unified events using existing timelineService
    const rawEvents: TimelineEvent[] = timelineService.synthesizeTimelineEvents({
      userProfile: userProfile as UserProfile,
      cycleRecords: pathway === 'female' ? cycleRecords : [], // Isolate female cycles
      symptomRecords,
      reports,
      foodLogs,
      waterLog: waterLog || undefined,
      fitnessLogs,
      medications,
      medicationLogs,
      appointments,
      careCircleMembers,
    });

    const groupedTimeline = groupTimelineEvents(rawEvents);

    // 6. Synthesize Unified Trend Metrics Cards
    const trends: TrendMetric[] = this.buildTrendMetrics({
      symptomLongitudinal,
      cycleLongitudinal,
      androSenseLongitudinal,
      generalLongitudinal,
      biomarkerComparisons,
      pathway,
      bounds,
      fitnessLogs,
      medicationLogs,
    });

    // 7. Central Progress Overview
    const overview = synthesizeProgressOverview(
      trends,
      periodComparisons,
      biomarkerComparisons,
      pathway
    );

    // 8. Explainable Longitudinal Insights (Phase 7 extension)
    const explainableInsights = this.buildLongitudinalInsights({
      symptomLongitudinal,
      cycleLongitudinal,
      androSenseLongitudinal,
      generalLongitudinal,
      biomarkerComparisons,
      pathway,
      bounds,
    });

    const hasAnyData =
      symptomRecords.length > 0 ||
      cycleRecords.length > 0 ||
      reports.length > 0 ||
      fitnessLogs.length > 0 ||
      foodLogs.length > 0;

    return {
      pathway,
      selectedPeriod: period,
      periodLabel: bounds.currentLabel,
      overview,
      trends,
      periodComparisons,
      symptomLongitudinal,
      cycleLongitudinal,
      androSenseLongitudinal,
      generalLongitudinal,
      biomarkerComparisons,
      quarantinedBiomarkersCount: quarantinedCount,
      groupedTimeline,
      explainableInsights,
      hasAnyData,
      totalEventsAnalyzed: rawEvents.length,
    };
  }

  // ---------------------------------------------------------------------------
  // Build Trend Metrics for UI Display
  // ---------------------------------------------------------------------------

  private static buildTrendMetrics(params: {
    symptomLongitudinal: any;
    cycleLongitudinal?: any;
    androSenseLongitudinal?: any;
    generalLongitudinal?: any;
    biomarkerComparisons: any[];
    pathway: HealthPathway;
    bounds: any;
    fitnessLogs: FitnessLogEntry[];
    medicationLogs: MedicationLogEntry[];
  }): TrendMetric[] {
    const {
      symptomLongitudinal,
      cycleLongitudinal,
      androSenseLongitudinal,
      generalLongitudinal,
      biomarkerComparisons,
      pathway,
      bounds,
      fitnessLogs,
      medicationLogs,
    } = params;

    const metrics: TrendMetric[] = [];

    // Metric 1: Symptom Frequency Trend
    metrics.push({
      id: 'trend-symptoms',
      category: 'symptoms',
      title: 'How your symptoms have changed',
      trendState: symptomLongitudinal.trendState,
      direction:
        symptomLongitudinal.totalLoggedCurrentPeriod < symptomLongitudinal.totalLoggedPreviousPeriod
          ? 'decreased'
          : symptomLongitudinal.totalLoggedCurrentPeriod > symptomLongitudinal.totalLoggedPreviousPeriod
          ? 'increased'
          : 'unchanged',
      whatChanged: symptomLongitudinal.frequencySummary,
      overWhatPeriod: `Across ${bounds.currentLabel} (${symptomLongitudinal.totalLoggedCurrentPeriod} events)`,
      basedOn: symptomLongitudinal.evidence,
      limitation: symptomLongitudinal.limitation,
      currentValue: symptomLongitudinal.totalLoggedCurrentPeriod,
      previousValue: symptomLongitudinal.totalLoggedPreviousPeriod,
      actionTip: 'Continue noting symptom changes and triggers when they occur.',
      pathway,
    });

    // Metric 2: Pathway-Specific Rhythm (OvaSense Cycle / AndroSense Energy / General Hydration)
    if (pathway === 'female' && cycleLongitudinal) {
      metrics.push({
        id: 'trend-cycle-regularity',
        category: 'cycle',
        title: 'Menstrual Interval Cadence',
        trendState: cycleLongitudinal.trendState,
        direction: cycleLongitudinal.regularityClassification === 'consistent' ? 'unchanged' : 'variable',
        whatChanged: cycleLongitudinal.observation,
        overWhatPeriod: `Across your ${cycleLongitudinal.recordedCyclesCount} recorded cycle(s)`,
        basedOn: cycleLongitudinal.evidence,
        limitation: cycleLongitudinal.limitation,
        currentValue: cycleLongitudinal.averageCycleLength ? `${cycleLongitudinal.averageCycleLength} days` : 'Not enough data',
        actionTip: 'Log your next period start date on the first day of flow.',
        pathway: 'female',
      });
    } else if (pathway === 'male' && androSenseLongitudinal) {
      metrics.push({
        id: 'trend-male-energy',
        category: 'sleep',
        title: 'Diurnal Recovery & Alertness',
        trendState: androSenseLongitudinal.trendState,
        direction: androSenseLongitudinal.sleepAdherence === 'consistent' ? 'unchanged' : 'variable',
        whatChanged: androSenseLongitudinal.observation,
        overWhatPeriod: `Across ${bounds.currentLabel}`,
        basedOn: androSenseLongitudinal.evidence,
        limitation: androSenseLongitudinal.limitation,
        currentValue: `${androSenseLongitudinal.sleepDurationAverage}h sleep`,
        actionTip: 'Keep consistent sleep and morning wake times to support endocrine circadian rhythm.',
        pathway: 'male',
      });
    } else if (generalLongitudinal) {
      metrics.push({
        id: 'trend-general-lifestyle',
        category: 'nutrition',
        title: 'Daily Lifestyle & Nutrition Pace',
        trendState: generalLongitudinal.trendState,
        direction: 'unchanged',
        whatChanged: generalLongitudinal.observation,
        overWhatPeriod: `Across ${bounds.currentLabel}`,
        basedOn: generalLongitudinal.evidence,
        limitation: generalLongitudinal.limitation,
        actionTip: 'Steady hydration and balanced meals promote daily metabolic energy.',
        pathway: 'general',
      });
    }

    // Metric 3: Movement & Activity Consistency
    const movementCount = fitnessLogs.length;
    metrics.push({
      id: 'trend-movement',
      category: 'movement',
      title: 'Physical Movement & Exercise',
      trendState: movementCount >= 3 ? 'improving' : movementCount > 0 ? 'developing_pattern' : 'insufficient_data',
      direction: movementCount > 0 ? 'increased' : 'insufficient',
      whatChanged: movementCount > 0
        ? `You recorded ${movementCount} activity session${movementCount === 1 ? '' : 's'} across your health records.`
        : 'No movement activities logged yet. Adding gentle walks or workouts helps monitor activity progress.',
      overWhatPeriod: `Recorded history (${movementCount} sessions)`,
      basedOn: {
        source: 'movement',
        label: 'Movement Logs',
        recordCount: movementCount,
        trustLevel: 'user_entered',
        description: `${movementCount} workout logs entered.`,
      },
      limitation: 'Workout logging measures self-reported sessions, not continuous cardiac output.',
      currentValue: movementCount,
      actionTip: 'Aim for gentle or moderate movement that feels energizing rather than exhausting.',
      pathway,
    });

    // Metric 4: Medication & Supplement Adherence
    if (medicationLogs.length > 0) {
      const taken = medicationLogs.filter((m) => m.status === 'taken').length;
      const rate = Math.round((taken / medicationLogs.length) * 100);
      metrics.push({
        id: 'trend-medications',
        category: 'medications',
        title: 'Medication & Supplement Routine',
        trendState: rate >= 80 ? 'stable' : 'changing',
        direction: rate >= 80 ? 'unchanged' : 'variable',
        whatChanged: `Confirmed ${taken} of ${medicationLogs.length} scheduled doses (${rate}% adherence).`,
        overWhatPeriod: `Logged medication entries (${medicationLogs.length} doses)`,
        basedOn: {
          source: 'medical_reports',
          label: 'Medication Logs',
          recordCount: medicationLogs.length,
          trustLevel: 'user_entered',
          description: 'Daily dose check-ins.',
        },
        limitation: 'Tracks logged confirmations; does not monitor pharmacokinetic blood concentrations.',
        currentValue: `${rate}%`,
        actionTip: 'Consistent timing helps optimize therapeutic benefits.',
        pathway,
      });
    }

    // Metric 5: Verified Lab Biomarkers (If any comparable exist)
    if (biomarkerComparisons.length > 0) {
      const topBio = biomarkerComparisons[0];
      metrics.push({
        id: `trend-biomarker-${topBio.testName}`,
        category: 'reports',
        title: `Verified Lab: ${topBio.testName}`,
        trendState: 'stable',
        direction: topBio.direction,
        whatChanged: topBio.observation,
        overWhatPeriod: `Verified clinical reports (${topBio.verifiedReadings.length} draw dates)`,
        basedOn: {
          source: 'verified_labs',
          label: 'Verified Lab Reports',
          recordCount: topBio.verifiedReadings.length,
          trustLevel: 'verified',
          description: 'Confirmed laboratory biomarker results.',
        },
        limitation: topBio.limitation,
        currentValue: `${topBio.latestValue} ${topBio.unit}`,
        previousValue: topBio.previousValue !== undefined ? `${topBio.previousValue} ${topBio.unit}` : undefined,
        actionTip: 'Discuss this verified laboratory trend with your doctor at your next visit.',
        pathway,
      });
    }

    return metrics;
  }

  // ---------------------------------------------------------------------------
  // Build Phase 7 Compatible Explainable Insights
  // ---------------------------------------------------------------------------

  private static buildLongitudinalInsights(params: {
    symptomLongitudinal: any;
    cycleLongitudinal?: any;
    androSenseLongitudinal?: any;
    generalLongitudinal?: any;
    biomarkerComparisons: any[];
    pathway: HealthPathway;
    bounds: any;
  }): ExplainableInsight[] {
    const {
      symptomLongitudinal,
      cycleLongitudinal,
      androSenseLongitudinal,
      generalLongitudinal,
      biomarkerComparisons,
      pathway,
      bounds,
    } = params;

    const insights: ExplainableInsight[] = [];

    // 1. Symptom Longitudinal Insight
    if (symptomLongitudinal.hasSufficientData) {
      insights.push({
        id: 'longitudinal-symptoms-trajectory',
        title: 'Longitudinal Symptom Trajectory',
        summary: symptomLongitudinal.frequencySummary,
        why: `Calculated from ${symptomLongitudinal.totalLoggedCurrentPeriod} self-reported entries in the ${bounds.currentLabel} compared with ${symptomLongitudinal.totalLoggedPreviousPeriod} in the ${bounds.previousLabel}.`,
        type: 'trend',
        status: symptomLongitudinal.trendState,
        signalStrength: symptomLongitudinal.totalLoggedCurrentPeriod >= 5 ? 'stronger_pattern' : 'developing_pattern',
        confidenceLabel: symptomLongitudinal.totalLoggedCurrentPeriod >= 5 ? 'Strong Pattern' : 'Developing Pattern',
        dataSources: [symptomLongitudinal.evidence],
        contributingFactors: symptomLongitudinal.topRecurringSymptoms.map((r: any) => ({
          name: r.name,
          label: r.name,
          influence: r.changeDirection === 'decreased' ? 'positive' : 'contributing',
          category: 'symptom',
          explanation: `Reported ${r.currentCount} times (previously ${r.previousCount}), typically ${r.mostCommonSeverity}.`,
        })),
        limitations: symptomLongitudinal.limitation,
        recommendedAction: 'Keep logging symptoms consistently so subtle shifts in your health pattern remain visible.',
        whatThisDoesNotMean: 'Changes in logged frequency reflect your entries, not a clinical diagnosis or cure.',
        pathway,
        createdAt: new Date().toISOString(),
        engineType: 'pattern',
      });
    }

    // 2. OvaSense Cycle Cadence Insight
    if (pathway === 'female' && cycleLongitudinal && cycleLongitudinal.hasSufficientData) {
      insights.push({
        id: 'longitudinal-cycle-cadence',
        title: 'Cycle Interval Longitudinal Consistency',
        summary: cycleLongitudinal.observation,
        why: `Derived from consecutive interval calculations between ${cycleLongitudinal.recordedCyclesCount} recorded menstrual start dates.`,
        type: 'trend',
        status: cycleLongitudinal.trendState,
        signalStrength: cycleLongitudinal.intervals.length >= 3 ? 'stronger_pattern' : 'developing_pattern',
        confidenceLabel: cycleLongitudinal.intervals.length >= 3 ? 'Multi-Cycle History' : 'Initial Cycle Baseline',
        dataSources: [cycleLongitudinal.evidence],
        contributingFactors: [
          {
            name: 'cycle_regularity',
            label: 'Cycle Regularity',
            influence: cycleLongitudinal.regularityClassification === 'consistent' ? 'positive' : 'contributing',
            category: 'cycle',
            explanation: `Classification: ${cycleLongitudinal.regularityClassification}. Intervals: ${cycleLongitudinal.intervals.join(', ')} days.`,
          },
        ],
        limitations: cycleLongitudinal.limitation,
        recommendedAction: 'Continue recording each period on day one of bleeding to maintain interval tracking accuracy.',
        whatThisDoesNotMean: 'Menstrual interval consistency does not verify luteal progesterone levels or confirm ovulation.',
        pathway: 'female',
        createdAt: new Date().toISOString(),
        engineType: 'deterministic',
      });
    }

    // 3. AndroSense Energy & Recovery Insight
    if (pathway === 'male' && androSenseLongitudinal && androSenseLongitudinal.hasSufficientData) {
      insights.push({
        id: 'longitudinal-androsense-rhythm',
        title: 'Male Energy & Endocrine Recovery Pattern',
        summary: androSenseLongitudinal.observation,
        why: `Synthesized from reported energy level (${androSenseLongitudinal.energyLevelCurrent}), sleep average (${androSenseLongitudinal.sleepDurationAverage}h), and workout consistency.`,
        type: 'trend',
        status: androSenseLongitudinal.trendState,
        signalStrength: 'developing_pattern',
        confidenceLabel: 'Lifestyle Observation',
        dataSources: [androSenseLongitudinal.evidence],
        contributingFactors: [
          {
            name: 'sleep_hours',
            label: 'Sleep Duration',
            influence: androSenseLongitudinal.sleepDurationAverage >= 7.0 ? 'positive' : 'contributing',
            category: 'lifestyle',
            explanation: `${androSenseLongitudinal.sleepDurationAverage} hours reported average. Endocrine synthesis peaks during deep sleep.`,
          },
        ],
        limitations: androSenseLongitudinal.limitation,
        recommendedAction: 'Maintain your consistent sleep schedule to support morning hormonal vitality.',
        whatThisDoesNotMean: 'Lifestyle patterns do not replace clinical morning fasting serum testosterone assays.',
        pathway: 'male',
        createdAt: new Date().toISOString(),
        engineType: 'pattern',
      });
    }

    // 4. General Pathway Insight
    if (pathway === 'general' && generalLongitudinal) {
      insights.push({
        id: 'longitudinal-general-lifestyle',
        title: 'Daily Lifestyle & Pacing Routine',
        summary: generalLongitudinal.observation,
        why: 'Synthesized from daily hydration entries, meal frequency, and activity logs across the selected period.',
        type: 'lifestyle',
        status: generalLongitudinal.trendState,
        signalStrength: 'developing_pattern',
        confidenceLabel: 'Habit Observation',
        dataSources: [generalLongitudinal.evidence],
        contributingFactors: [],
        limitations: generalLongitudinal.limitation,
        recommendedAction: 'Continue your regular logging to maintain accurate habit pacing.',
        whatThisDoesNotMean: 'Lifestyle tracking is for wellness awareness and does not substitute for medical evaluation.',
        pathway: 'general',
        createdAt: new Date().toISOString(),
        engineType: 'deterministic',
      });
    }

    // 5. Verified Lab Report Insight
    if (biomarkerComparisons.length > 0) {
      const topBio = biomarkerComparisons[0];
      insights.push({
        id: 'longitudinal-verified-biomarkers',
        title: `Verified Biomarker Progress: ${topBio.testName}`,
        summary: topBio.observation,
        why: `Observed across ${topBio.verifiedReadings.length} confirmed laboratory test results in your records.`,
        type: 'report',
        status: 'stable',
        signalStrength: 'stronger_pattern',
        confidenceLabel: 'Clinically Verified',
        dataSources: [
          {
            source: 'verified_labs',
            label: 'Confirmed Biomarker Readings',
            recordCount: topBio.verifiedReadings.length,
            trustLevel: 'verified',
            description: 'Historical values recorded across multiple test dates.',
          },
        ],
        contributingFactors: [],
        limitations: topBio.limitation,
        recommendedAction: 'Discuss these verified laboratory changes with your doctor during your consultation.',
        whatThisDoesNotMean: 'Laboratory values should be evaluated by a healthcare professional in clinical context.',
        pathway,
        createdAt: new Date().toISOString(),
        engineType: 'deterministic',
      });
    }

    return insights;
  }

  // ---------------------------------------------------------------------------
  // Digital Twin Longitudinal Dimensions Synthesizer
  // ---------------------------------------------------------------------------

  public static getLongitudinalDimensions(input: LongitudinalServiceInput): ExplainableDimensionNode[] {
    const {
      userProfile,
      symptomRecords,
      cycleRecords,
      reports,
      waterLog,
      fitnessLogs,
      pathway,
      period = '30d',
    } = input;

    const bounds = getPeriodDateBounds(period);
    const nodes: ExplainableDimensionNode[] = [];

    // 1. Symptoms Dimension
    const { current: curSymp, previous: prevSymp } = filterRecordsByPeriod(
      symptomRecords,
      (s: SymptomRecord) => s.occurredAt,
      bounds
    );

    let sympChange: ExplainableDimensionNode['change'] = 'stable';
    if (curSymp.length === 0 && prevSymp.length === 0 && symptomRecords.length === 0) {
      sympChange = 'insufficient_data';
    } else if (curSymp.length < prevSymp.length) {
      sympChange = 'improving';
    } else if (curSymp.length > prevSymp.length) {
      sympChange = 'changing';
    }

    nodes.push({
      id: 'dt-symptoms',
      title: 'Symptom Trajectory',
      category: 'physiology',
      currentState: curSymp.length > 0
        ? `${curSymp.length} symptom events logged in the ${bounds.currentLabel}.`
        : 'No symptoms logged in the current window.',
      historicalState: prevSymp.length > 0
        ? `${prevSymp.length} symptom events logged in the ${bounds.previousLabel}.`
        : 'No symptom records in the prior comparison period.',
      supportingData: [
        {
          source: 'symptoms',
          label: 'Symptom Logs',
          recordCount: curSymp.length,
          trustLevel: 'user_entered',
          description: `${curSymp.length} current vs ${prevSymp.length} previous logs evaluated.`,
        },
      ],
      change: sympChange,
      directionOfChange: sympChange,
      changeDescription: prevSymp.length > 0
        ? `${curSymp.length} entries compared with ${prevSymp.length} entries in the preceding window.`
        : 'Tracking baseline actively accumulating.',
      limitation: 'Calculated purely from self-reported symptoms; not an objective clinical measurement.',
    });

    // 2. Reproductive / Hormonal Vitality Dimension
    if (pathway === 'female') {
      const cycleStats = calculateCycleLongitudinal(cycleRecords, period, bounds);
      nodes.push({
        id: 'dt-cycle',
        title: 'Menstrual Cycle Cadence',
        category: 'physiology',
        currentState: cycleStats.hasSufficientData
          ? `Average cycle length: ${cycleStats.averageCycleLength} days across ${cycleStats.recordedCyclesCount} recorded cycle(s).`
          : `${cycleRecords.length} period start record(s) on file.`,
        historicalState: cycleStats.intervals.length >= 2
          ? `Recorded intervals: ${cycleStats.intervals.join(', ')} days (variation: ${Math.max(...cycleStats.intervals) - Math.min(...cycleStats.intervals)} days).`
          : 'Log at least 2 consecutive periods to calculate historical interval consistency.',
        supportingData: [cycleStats.evidence],
        change: cycleStats.trendState,
        directionOfChange: cycleStats.trendState,
        changeDescription: cycleStats.observation,
        limitation: cycleStats.limitation,
      });
    } else if (pathway === 'male') {
      const androStats = calculateAndroSenseLongitudinal(
        userProfile as UserProfile,
        fitnessLogs,
        symptomRecords,
        reports,
        period,
        bounds
      );
      nodes.push({
        id: 'dt-male-vitality',
        title: 'Male Endocrine Rhythm & Recovery',
        category: 'physiology',
        currentState: `Reported alertness: ${androStats.energyLevelCurrent}. ${androStats.movementSessionsCurrent} workouts in current window.`,
        historicalState: `Prior window workouts: ${androStats.movementSessionsPrevious}. Average sleep: ${androStats.sleepDurationAverage} hours.`,
        supportingData: [androStats.evidence],
        change: androStats.trendState,
        directionOfChange: androStats.trendState,
        changeDescription: androStats.observation,
        limitation: androStats.limitation,
      });
    }

    // 3. Lifestyle & Habits Dimension
    const waterGlasses = waterLog?.glasses || 0;
    const { current: curFitness, previous: prevFitness } = filterRecordsByPeriod(
      fitnessLogs,
      (f: FitnessLogEntry) => f.occurredAt,
      bounds
    );
    nodes.push({
      id: 'dt-lifestyle',
      title: 'Lifestyle, Hydration & Movement Pace',
      category: 'habits',
      currentState: `${curFitness.length} workout(s) logged in ${bounds.currentLabel}; ${waterGlasses} glasses water today.`,
      historicalState: `${prevFitness.length} workout(s) logged in ${bounds.previousLabel}.`,
      supportingData: [
        {
          source: 'movement',
          label: 'Fitness Logs',
          recordCount: curFitness.length,
          trustLevel: 'user_entered',
          description: 'Exercise and activity sessions.',
        },
      ],
      change: curFitness.length >= prevFitness.length && curFitness.length > 0 ? 'improving' : 'stable',
      directionOfChange: curFitness.length >= prevFitness.length && curFitness.length > 0 ? 'improving' : 'stable',
      changeDescription: `${curFitness.length} workout sessions current vs ${prevFitness.length} prior.`,
      limitation: 'Self-reported movement and hydration logs subject to user recall.',
    });

    // 4. Clinical Evidence & Verified Reports Dimension
    const { comparisons, quarantinedCount } = calculateBiomarkerLongitudinal(reports);
    let verifiedCount = 0;
    reports.forEach((r) => (r.results || []).forEach((res) => { if (res.userVerified) verifiedCount++; }));

    nodes.push({
      id: 'dt-reports',
      title: 'Clinical Laboratory Evidence',
      category: 'clinical',
      currentState: `${verifiedCount} verified biomarker values across ${reports.length} report document(s).`,
      historicalState: comparisons.length > 0
        ? `${comparisons.length} comparable biomarker(s) with multi-date verified history.`
        : quarantinedCount > 0
        ? `${quarantinedCount} unverified OCR result(s) quarantined pending your confirmation.`
        : 'Upload and verify medical lab reports to track objective clinical changes.',
      supportingData: [
        {
          source: 'verified_labs',
          label: 'Verified Lab Values',
          recordCount: verifiedCount,
          trustLevel: 'verified',
          description: 'Confirmed diagnostic biomarker results.',
        },
      ],
      change: verifiedCount > 0 ? 'stable' : 'insufficient_data',
      directionOfChange: verifiedCount > 0 ? 'stable' : 'insufficient_data',
      changeDescription: verifiedCount > 0
        ? 'Verified results are incorporated into your Trusted Health Profile.'
        : 'No verified report results on record yet.',
      limitation: 'Laboratory reports capture isolated points in time and should be interpreted by your physician.',
    });

    return nodes;
  }
}
