import type {
  CycleRecord,
  CycleSummaryStats,
  CycleHistoryItem,
  CyclePhaseInfo,
} from '../types/cycle';

/**
 * Returns phase visual tokens and clinical non-diagnostic guidance for a given cycle day.
 */
export function getCyclePhase(
  day: number,
  totalCycleDays: number = 28,
  periodDuration: number = 5
): CyclePhaseInfo {
  const safeTotal = Math.max(20, Math.min(totalCycleDays, 45));
  const safePeriod = Math.max(1, Math.min(periodDuration, 10));
  const midpoint = Math.floor(safeTotal / 2);

  if (day <= safePeriod) {
    return {
      key: 'menstrual',
      name: 'Your Period',
      displayName: 'Estimated Period (Menstrual Phase)',
      tag: 'Period',
      badgeColor: 'bg-[#FB7185] text-white',
      cardColor: 'bg-[#FDF2F8] border-[#FDA4AF]/40',
      textColor: 'text-[#FB7185]',
      description: 'The days of your period when bleeding occurs and hormone levels are at baseline.',
      guidance: 'Focus on restorative rest, warmth, iron-rich nourishment, and staying gently hydrated.',
    };
  }

  if (day < midpoint) {
    return {
      key: 'follicular',
      name: 'Follicular Phase',
      displayName: 'Follicular Phase (when an egg develops)',
      tag: 'Follicular',
      badgeColor: 'bg-[#8E3EAF] text-white',
      cardColor: 'bg-[#EDE4F7] border-[#D8B4FE]/40',
      textColor: 'text-[#8E3EAF]',
      description: 'The part of your cycle when estrogen naturally rises as an egg matures.',
      guidance: 'Your natural energy is rising. Ideal time for creative focus, progressive movement, and balanced meals.',
    };
  }

  if (day >= midpoint && day <= midpoint + 1) {
    return {
      key: 'ovulation',
      name: 'Ovulation Window',
      displayName: 'Ovulation Window (when an egg is released)',
      tag: 'Peak Fertile',
      badgeColor: 'bg-[#A21CAF] text-white ring-2 ring-[#FB7185]',
      cardColor: 'bg-[#FAF5FF] border-[#C084FC]/40',
      textColor: 'text-[#A21CAF]',
      description: 'The estimated peak fertile window when an ovary releases a mature egg.',
      guidance: 'Estimated fertile window. Peak physical energy, high vitality, and steady metabolic energy.',
    };
  }

  return {
    key: 'luteal',
    name: 'Luteal Phase',
    displayName: 'Luteal Phase (the days after ovulation)',
    tag: 'Luteal',
    badgeColor: 'bg-[#6E2D8B] text-white',
    cardColor: 'bg-[#F8F5FA] border-[#E7DFEF]',
    textColor: 'text-[#6E2D8B]',
    description: 'The days after ovulation when progesterone supports your body.',
    guidance: 'Support steady energy with complex carbohydrates, magnesium, and calming evening routines.',
  };
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD date strings.
 */
export function getDaysDifference(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffMs = endMidnight.getTime() - startMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD date string into human-readable format (e.g. "Aug 12, 2026").
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats a YYYY-MM-DD date into Month Year (e.g. "Aug 2026").
 */
export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Pure calculation function deriving comprehensive cycle statistics from actual stored cycle records.
 */
export function calculateCycleStats(
  records: CycleRecord[] = [],
  profileFallback?: {
    cycleLength?: number | 'irregular';
    periodDuration?: number;
    lastPeriodDate?: string;
  }
): CycleSummaryStats {
  if (!records || records.length === 0) {
    return {
      hasData: false,
      totalRecordsCount: 0,
      currentCycleDay: null,
      totalCycleDays: typeof profileFallback?.cycleLength === 'number' ? profileFallback.cycleLength : 28,
      periodDuration: profileFallback?.periodDuration || 5,
      estimatedPhase: null,
      periodStatus: 'Not enough data yet',
      nextPeriodDays: null,
      nextPeriodDate: null,
      averageCycleLength: null,
      averagePeriodDuration: null,
      isCycleActive: false,
      activePeriodDay: null,
      lastPeriodStartDate: null,
      lastPeriodEndDate: null,
      history: [],
    };
  }

  // 1. Sort records by periodStartDate ascending for chronological cycle interval calculations
  const sortedAsc = [...records].sort(
    (a, b) => new Date(a.periodStartDate).getTime() - new Date(b.periodStartDate).getTime()
  );

  // 2. Compute cycle lengths between consecutive period starts
  const calculatedIntervals: number[] = [];
  const historyItemsAsc: CycleHistoryItem[] = [];

  for (let i = 0; i < sortedAsc.length; i++) {
    const current = sortedAsc[i];
    const next = sortedAsc[i + 1];

    const periodDurationDays = Math.max(1, getDaysDifference(current.periodStartDate, current.periodEndDate) + 1);

    let cycleLengthDays: number | null = null;
    if (next) {
      const interval = getDaysDifference(current.periodStartDate, next.periodStartDate);
      if (interval >= 15 && interval <= 90) {
        cycleLengthDays = interval;
        calculatedIntervals.push(interval);
      }
    }

    historyItemsAsc.push({
      id: current.id,
      monthYear: formatMonthYear(current.periodStartDate),
      startDateFormatted: formatDisplayDate(current.periodStartDate),
      endDateFormatted: formatDisplayDate(current.periodEndDate),
      rawStartDate: current.periodStartDate,
      rawEndDate: current.periodEndDate,
      cycleLengthDays,
      periodDurationDays,
      flow: current.flow,
      symptoms: current.symptoms || [],
      notes: current.notes,
      isLatest: i === sortedAsc.length - 1,
    });
  }

  // 3. Reverse history items to newest first for UI display
  const history = [...historyItemsAsc].reverse();

  // 4. Calculate Averages
  const totalPeriodsDuration = history.reduce((sum, item) => sum + item.periodDurationDays, 0);
  const averagePeriodDuration = Math.round(totalPeriodsDuration / history.length) || 5;

  const baselineCycle = typeof profileFallback?.cycleLength === 'number' ? profileFallback.cycleLength : 28;
  const averageCycleLength = calculatedIntervals.length > 0
    ? Math.round(calculatedIntervals.reduce((sum, val) => sum + val, 0) / calculatedIntervals.length)
    : baselineCycle;

  // 5. Active / Latest Cycle Analysis
  const latestRecord = sortedAsc[sortedAsc.length - 1];
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const latestStart = new Date(latestRecord.periodStartDate);
  const latestStartMidnight = new Date(latestStart.getFullYear(), latestStart.getMonth(), latestStart.getDate());
  const latestEnd = new Date(latestRecord.periodEndDate);
  const latestEndMidnight = new Date(latestEnd.getFullYear(), latestEnd.getMonth(), latestEnd.getDate());

  const daysSinceStart = Math.max(
    0,
    Math.floor((todayMidnight.getTime() - latestStartMidnight.getTime()) / (1000 * 60 * 60 * 24))
  );
  const currentCycleDay = daysSinceStart + 1;

  const isCycleActive =
    todayMidnight.getTime() >= latestStartMidnight.getTime() &&
    todayMidnight.getTime() <= latestEndMidnight.getTime();

  let activePeriodDay: number | null = null;
  let periodStatus = '';

  const periodDurationOfLatest = Math.max(
    1,
    getDaysDifference(latestRecord.periodStartDate, latestRecord.periodEndDate) + 1
  );

  if (isCycleActive) {
    activePeriodDay = daysSinceStart + 1;
    periodStatus = `Period active (Day ${activePeriodDay} of ${periodDurationOfLatest})`;
  } else if (todayMidnight.getTime() > latestEndMidnight.getTime()) {
    const daysSinceEnd = Math.max(
      1,
      Math.floor((todayMidnight.getTime() - latestEndMidnight.getTime()) / (1000 * 60 * 60 * 24))
    );
    periodStatus = `Period ended ${daysSinceEnd} day${daysSinceEnd === 1 ? '' : 's'} ago`;
  } else {
    // Start date is in future
    periodStatus = `Upcoming period scheduled`;
  }

  // 6. Estimated Phase & Next Period Projection
  const estimatedPhase = getCyclePhase(currentCycleDay, averageCycleLength, periodDurationOfLatest);

  const nextPeriodDays = Math.max(1, averageCycleLength - currentCycleDay + 1);
  const nextPeriodDateObj = new Date(todayMidnight.getTime() + nextPeriodDays * 24 * 60 * 60 * 1000);
  const nextPeriodDate = formatDisplayDate(nextPeriodDateObj.toISOString().split('T')[0]);

  return {
    hasData: true,
    totalRecordsCount: records.length,
    currentCycleDay,
    totalCycleDays: averageCycleLength,
    periodDuration: periodDurationOfLatest,
    estimatedPhase,
    periodStatus,
    nextPeriodDays,
    nextPeriodDate,
    averageCycleLength,
    averagePeriodDuration,
    isCycleActive,
    activePeriodDay,
    lastPeriodStartDate: latestRecord.periodStartDate,
    lastPeriodEndDate: latestRecord.periodEndDate,
    history,
  };
}
