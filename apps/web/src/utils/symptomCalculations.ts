import type {
  SymptomRecord,
  SymptomPatternObservation,
  SymptomSummaryStats,
  SymptomCategory,
} from '../types/symptom';
import type { CycleRecord } from '../types/cycle';

/**
 * Calculates the exact cycle day for a given calendar date based on recorded period start dates.
 * Returns null if no relevant cycle record exists before or on the target date.
 */
export function deriveCycleDayForDate(
  targetDateStr: string,
  cycleRecords: CycleRecord[]
): number | null {
  if (!targetDateStr || !cycleRecords || cycleRecords.length === 0) {
    return null;
  }

  const targetDate = new Date(targetDateStr + 'T00:00:00Z');
  if (isNaN(targetDate.getTime())) return null;

  // Sort cycles newest to oldest
  const sorted = [...cycleRecords].sort(
    (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
  );

  // Find the closest period start date that is on or before targetDate
  const matchingCycle = sorted.find((c) => {
    const periodStart = new Date(c.periodStartDate + 'T00:00:00Z');
    return periodStart.getTime() <= targetDate.getTime();
  });

  if (!matchingCycle) {
    return null;
  }

  const periodStart = new Date(matchingCycle.periodStartDate + 'T00:00:00Z');
  const diffDays = Math.floor((targetDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = diffDays + 1;

  // Safety bound: if it's beyond 120 days since the last period, still provide the count but cap cleanly
  return cycleDay >= 1 && cycleDay <= 120 ? cycleDay : null;
}

/**
 * Formats a date into a human-friendly relative string ("Today", "Yesterday", "3 days ago").
 */
export function getRelativeDateLabel(dateStr: string): string {
  if (!dateStr) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr + 'T00:00:00');
  target.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: target.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  }).format(target);
}

/**
 * Pure observational pattern engine that discovers factual patterns from user logs.
 * Strictly non-diagnostic and observational.
 */
export function generatePatternObservations(
  symptoms: SymptomRecord[]
): SymptomPatternObservation[] {
  if (!symptoms || symptoms.length < 3) {
    return [];
  }

  const observations: SymptomPatternObservation[] = [];

  // 1. Group symptoms by type
  const countsByType: Record<string, { count: number; severities: string[]; cycleDays: number[] }> = {};

  for (const item of symptoms) {
    if (!countsByType[item.symptomType]) {
      countsByType[item.symptomType] = { count: 0, severities: [], cycleDays: [] };
    }
    countsByType[item.symptomType].count += 1;
    countsByType[item.symptomType].severities.push(item.severity);
    if (item.cycleDay !== null) {
      countsByType[item.symptomType].cycleDays.push(item.cycleDay);
    }
  }

  // Sort by frequency
  const sortedTypes = Object.entries(countsByType).sort((a, b) => b[1].count - a[1].count);

  // Pattern 1: Most frequent symptom
  if (sortedTypes.length > 0) {
    const [topName, topData] = sortedTypes[0];
    if (topData.count >= 2) {
      observations.push({
        id: `obs_freq_${topName}`,
        title: `Most Recorded: ${topName}`,
        description: `You have logged ${topName.toLowerCase()} ${topData.count} times in your records.`,
        type: 'frequency',
        symptomName: topName,
        occurrenceCount: topData.count,
      });
    }
  }

  // Pattern 2: Cycle timing cluster (e.g. cramps around Cycle Days 1–3)
  for (const [name, data] of sortedTypes) {
    if (data.cycleDays.length >= 2) {
      const avgDay = Math.round(data.cycleDays.reduce((a, b) => a + b, 0) / data.cycleDays.length);
      const minDay = Math.min(...data.cycleDays);
      const maxDay = Math.max(...data.cycleDays);

      let timingLabel = `around Cycle Day ${avgDay}`;
      if (maxDay - minDay <= 4 && maxDay !== minDay) {
        timingLabel = `between Cycle Days ${minDay}–${maxDay}`;
      }

      observations.push({
        id: `obs_timing_${name}`,
        title: `${name} Rhythm`,
        description: `Your records show ${name.toLowerCase()} was most often recorded ${timingLabel}.`,
        type: 'timing',
        symptomName: name,
        occurrenceCount: data.count,
        cycleTimingInfo: timingLabel,
      });
      break; // Only show one key timing insight to keep UI focused
    }
  }

  // Pattern 3: Predominant severity observation
  for (const [name, data] of sortedTypes) {
    if (data.count >= 2) {
      const mildCount = data.severities.filter((s) => s === 'mild').length;
      const modCount = data.severities.filter((s) => s === 'moderate').length;
      const sevCount = data.severities.filter((s) => s === 'severe').length;

      let dominantSeverity = 'mild';
      if (modCount >= mildCount && modCount >= sevCount) dominantSeverity = 'moderate';
      if (sevCount > mildCount && sevCount > modCount) dominantSeverity = 'severe';

      observations.push({
        id: `obs_sev_${name}`,
        title: `${name} Intensity`,
        description: `Most of your ${name.toLowerCase()} entries were recorded with ${dominantSeverity} intensity.`,
        type: 'severity',
        symptomName: name,
        occurrenceCount: data.count,
      });
      break;
    }
  }

  return observations.slice(0, 3);
}

/**
 * Calculates overall summary statistics from symptom records.
 */
export function calculateSymptomStats(
  symptoms: SymptomRecord[]
): SymptomSummaryStats {
  const todayStr = new Date().toISOString().split('T')[0];

  const loggedToday = symptoms.filter((s) => s.occurredAt === todayStr);

  const categoryMap: Record<string, { count: number; category: SymptomCategory }> = {};
  for (const s of symptoms) {
    if (!categoryMap[s.symptomType]) {
      categoryMap[s.symptomType] = { count: 0, category: s.category };
    }
    categoryMap[s.symptomType].count += 1;
  }

  const topSymptoms = Object.entries(categoryMap)
    .map(([name, data]) => ({ name, count: data.count, category: data.category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const patternObservations = generatePatternObservations(symptoms);

  return {
    totalLoggedCount: symptoms.length,
    loggedTodayCount: loggedToday.length,
    topSymptoms,
    patternObservations,
    hasEnoughDataForPatterns: symptoms.length >= 3,
  };
}
