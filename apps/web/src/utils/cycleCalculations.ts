import type {
  CycleRecord,
  CycleSummaryStats,
  CycleHistoryItem,
  CyclePhaseInfo,
  RegularityStatus,
  CycleLengthSource,
  OvulationEstimate,
  PhaseDayRanges,
} from '../types/cycle';

// ---------------------------------------------------------------------------
// 1. Timezone-Immune Calendar Date Utilities (Pure UTC Integer Arithmetic)
// ---------------------------------------------------------------------------

/**
 * Safely parses a 'YYYY-MM-DD' or ISO timestamp string into a [year, month, day] integer tuple.
 * Avoids browser-local timezone shifting when parsing date-only strings.
 */
export function parseDateParts(dateStr: string): [number, number, number] {
  if (!dateStr || typeof dateStr !== 'string') {
    const today = new Date();
    return [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  }
  const cleaned = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  const parts = cleaned.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const today = new Date();
    return [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  }
  return [parts[0], parts[1], parts[2]];
}

/**
 * Returns integer days since UTC epoch for a date string.
 * Pure UTC integer arithmetic — completely immune to DST and timezone differences.
 */
export function toCalendarEpochDays(dateStr: string): number {
  const [y, m, d] = parseDateParts(dateStr);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * Calculates calendar day difference (endDate - startDate).
 */
export function getDaysDifference(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  return toCalendarEpochDays(endDateStr) - toCalendarEpochDays(startDateStr);
}

/**
 * Adds an integer number of calendar days to a date string, returning 'YYYY-MM-DD'.
 * Seamlessly handles leap years and month/year boundaries via standard Date.UTC.
 */
export function addCalendarDays(dateStr: string, daysToAdd: number): string {
  const [y, m, d] = parseDateParts(dateStr);
  const target = new Date(Date.UTC(y, m - 1, d + daysToAdd));
  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, '0');
  const day = String(target.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in the user's local timezone.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date string into human-readable format (e.g. "Aug 12, 2026").
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = parseDateParts(dateStr);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats a YYYY-MM-DD date into Month Year (e.g. "Aug 2026").
 */
export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = parseDateParts(dateStr);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

// ---------------------------------------------------------------------------
// 2. Scientifically Defensible Ovulation & Fertile Window Estimation
// ---------------------------------------------------------------------------

const CLINICAL_CYCLE_DISCLAIMER =
  'Calendar-based estimates are educational approximations for wellness tracking only. They do not confirm ovulation has occurred and must never be used as a method of natural contraception or medical birth control.';

/**
 * Estimates ovulation day and fertile window based on luteal phase consistency (~14 days before menses).
 * Correctly flags uncertainty for irregular cycles, PCOS, overdue cycles, or insufficient data.
 */
export function calculateOvulationEstimate(
  periodStartDate: string,
  cycleLength: number,
  regularityStatus: RegularityStatus,
  completedCyclesCount: number,
  isPcosOrIrregularOnboarding: boolean = false,
  isOverdue: boolean = false
): OvulationEstimate {
  const safeCycleLength = Math.max(20, Math.min(cycleLength, 60));

  // Physiological rule: Luteal phase averages 14 days before the next period
  const ovulationDay = Math.max(1, safeCycleLength - 14);
  const fertileStartDay = Math.max(1, ovulationDay - 5);
  const fertileEndDay = Math.min(safeCycleLength, ovulationDay + 1);

  const ovulationDate = addCalendarDays(periodStartDate, ovulationDay - 1);
  const fertileStartDate = addCalendarDays(periodStartDate, fertileStartDay - 1);
  const fertileEndDate = addCalendarDays(periodStartDate, fertileEndDay - 1);

  const ovulationDateFormatted = formatDisplayDate(ovulationDate);
  const fertileWindowFormatted = `${formatDisplayDate(fertileStartDate)} – ${formatDisplayDate(fertileEndDate)}`;

  // 1. Insufficient data: less than 1 completed cycle interval
  if (completedCyclesCount < 1) {
    return {
      status: 'insufficient_data',
      ovulationDay,
      ovulationDate,
      ovulationDateFormatted,
      fertileWindowStartDay: fertileStartDay,
      fertileWindowEndDay: fertileEndDay,
      fertileWindowStartDate: fertileStartDate,
      fertileWindowEndDate: fertileEndDate,
      fertileWindowFormatted,
      confidence: 'none',
      isApproximate: true,
      uncertaintyExplanation:
        'At least 2 to 3 logged cycles are required to observe your personal cadence before estimating ovulation windows.',
      clinicalDisclaimer: CLINICAL_CYCLE_DISCLAIMER,
    };
  }

  // 2. Overdue: Cycle has exceeded expected length
  if (isOverdue) {
    return {
      status: 'irregular_uncertain',
      ovulationDay,
      ovulationDate,
      ovulationDateFormatted,
      fertileWindowStartDay: fertileStartDay,
      fertileWindowEndDay: fertileEndDay,
      fertileWindowStartDate: fertileStartDate,
      fertileWindowEndDate: fertileEndDate,
      fertileWindowFormatted,
      confidence: 'low',
      isApproximate: true,
      uncertaintyExplanation:
        'Your expected period date has passed. When a cycle is extended or delayed, standard calendar ovulation estimates from earlier in the cycle are no longer applicable.',
      clinicalDisclaimer: CLINICAL_CYCLE_DISCLAIMER,
    };
  }

  // 3. Irregular or variable cycles (PCOS, high cycle variance)
  if (isPcosOrIrregularOnboarding || regularityStatus === 'irregular' || regularityStatus === 'variable') {
    return {
      status: 'irregular_uncertain',
      ovulationDay,
      ovulationDate,
      ovulationDateFormatted,
      fertileWindowStartDay: fertileStartDay,
      fertileWindowEndDay: fertileEndDay,
      fertileWindowStartDate: fertileStartDate,
      fertileWindowEndDate: fertileEndDate,
      fertileWindowFormatted,
      confidence: 'low',
      isApproximate: true,
      uncertaintyExplanation:
        'Ovulation timing is unpredictable due to cycle irregularity. In irregular cycles or PCOS, ovulation may be delayed, occur at variable cycle days, or cycles may be anovulatory. Calendar predictions are approximations only.',
      clinicalDisclaimer: CLINICAL_CYCLE_DISCLAIMER,
    };
  }

  // 4. Regular cycles with verified history
  return {
    status: 'estimated',
    ovulationDay,
    ovulationDate,
    ovulationDateFormatted,
    fertileWindowStartDay: fertileStartDay,
    fertileWindowEndDay: fertileEndDay,
    fertileWindowStartDate: fertileStartDate,
    fertileWindowEndDate: fertileEndDate,
    fertileWindowFormatted,
    confidence: completedCyclesCount >= 3 ? 'moderate' : 'low',
    isApproximate: true,
    uncertaintyExplanation: undefined,
    clinicalDisclaimer: CLINICAL_CYCLE_DISCLAIMER,
  };
}

// ---------------------------------------------------------------------------
// 3. Cycle Phase Visual Tokens & Guidance
// ---------------------------------------------------------------------------

/**
 * Returns phase visual tokens and clinical non-diagnostic guidance for a given cycle day.
 */
export function getCyclePhase(
  day: number,
  totalCycleDays: number = 28,
  periodDuration: number = 5,
  ovulationDay: number = 14,
  fertileStartDay: number = 9,
  fertileEndDay: number = 15,
  isOverdue: boolean = false,
  isIrregular: boolean = false
): CyclePhaseInfo {
  const safeTotal = Math.max(20, Math.min(totalCycleDays, 60));
  const safePeriod = Math.max(1, Math.min(periodDuration, 14));

  // Menstrual phase (Period)
  if (day <= safePeriod) {
    return {
      key: 'menstrual',
      name: 'Your Period',
      displayName: 'Estimated Period (Menstrual Phase)',
      tag: 'Period',
      badgeColor: 'bg-[#FB7185] text-white',
      cardColor: 'bg-[#FDF2F8] border-[#FDA4AF]/40',
      textColor: 'text-[#FB7185]',
      description: 'The days of your period when uterine lining sheds and baseline hormone levels reset.',
      guidance: 'Focus on restorative rest, warmth, iron-rich nourishment, and staying gently hydrated.',
    };
  }

  // Overdue / Extended cycle state
  if (isOverdue || day > safeTotal) {
    return {
      key: 'overdue',
      name: 'Extended Cycle',
      displayName: `Extended Cycle (Day ${day})`,
      tag: 'Delayed',
      badgeColor: 'bg-[#D97706] text-white',
      cardColor: 'bg-[#FFFBEB] border-[#FDE68A]',
      textColor: 'text-[#D97706]',
      description: `Cycle day ${day} exceeds your expected ~${safeTotal}-day cycle length.`,
      guidance:
        'Cycle lengths vary naturally with stress, sleep, travel, or hormonal shifts like PCOS. If bleeding begins, log day 1 to start your new cycle.',
    };
  }

  // Follicular phase (pre-ovulatory)
  if (day < fertileStartDay) {
    return {
      key: 'follicular',
      name: 'Follicular Phase',
      displayName: 'Follicular Phase (Follicle Development)',
      tag: 'Follicular',
      badgeColor: 'bg-[#8E3EAF] text-white',
      cardColor: 'bg-[#EDE4F7] border-[#D8B4FE]/40',
      textColor: 'text-[#8E3EAF]',
      description: 'The part of your cycle when estrogen naturally rises as ovarian follicles mature.',
      guidance: 'Your natural energy is rising. Ideal time for creative focus, progressive movement, and balanced meals.',
    };
  }

  // Ovulatory window
  if (day >= fertileStartDay && day <= fertileEndDay) {
    return {
      key: 'ovulation',
      name: isIrregular ? 'Est. Ovulation Window (Uncertain)' : 'Ovulation Window',
      displayName: isIrregular
        ? 'Estimated Fertile Window (Variable Cadence)'
        : 'Ovulation Window (Peak Fertility)',
      tag: isIrregular ? 'Est. Window' : 'Peak Fertile',
      badgeColor: 'bg-[#A21CAF] text-white ring-2 ring-[#FB7185]',
      cardColor: 'bg-[#FAF5FF] border-[#C084FC]/40',
      textColor: 'text-[#A21CAF]',
      description: isIrregular
        ? `Calendar estimate only (approx. Day ${ovulationDay}). Because your cycle cadence varies, exact ovulation day cannot be confirmed by calendar dates alone.`
        : `The estimated peak fertile window (approx. Day ${ovulationDay}) when an ovary is expected to release a mature egg.`,
      guidance: isIrregular
        ? 'For cycle irregularity or PCOS, tracking cervical fluid, basal body temperature, or LH surge strips provides clearer biological signals.'
        : 'Estimated fertile window. Peak physical energy and high vitality. Note: calendar tracking is not a method of contraception.',
    };
  }

  // Luteal phase
  return {
    key: 'luteal',
    name: 'Luteal Phase',
    displayName: 'Luteal Phase (Post-Ovulation)',
    tag: 'Luteal',
    badgeColor: 'bg-[#6E2D8B] text-white',
    cardColor: 'bg-[#F8F5FA] border-[#E7DFEF]',
    textColor: 'text-[#6E2D8B]',
    description: 'The days after ovulation when progesterone supports your body.',
    guidance: 'Support steady energy with complex carbohydrates, magnesium, and calming evening routines.',
  };
}

// ---------------------------------------------------------------------------
// 4. Primary Authoritative Cycle Analysis Engine
// ---------------------------------------------------------------------------

export interface ProfileCycleFallback {
  cycleLength?: number | 'irregular';
  periodDuration?: number;
  lastPeriodDate?: string;
  periodRegularity?: 'regular' | 'mostly_regular' | 'irregular' | 'very_irregular';
}

/**
 * Pure calculation engine deriving authoritative cycle statistics from stored period records.
 * Synchronizes with Overview Dashboard and Cycle & Ovulation page.
 */
export function calculateCycleStats(
  records: CycleRecord[] = [],
  profileFallback?: ProfileCycleFallback
): CycleSummaryStats {
  const todayStr = getTodayDateString();

  // Baseline empty state when no records are on file
  if (!records || records.length === 0) {
    const baselineCycle = typeof profileFallback?.cycleLength === 'number' ? profileFallback.cycleLength : 28;
    const baselineDuration = profileFallback?.periodDuration || 5;
    const isProfileIrregular = profileFallback?.cycleLength === 'irregular' || profileFallback?.periodRegularity === 'irregular';

    const emptyOvulation = calculateOvulationEstimate(
      todayStr,
      baselineCycle,
      isProfileIrregular ? 'irregular' : 'insufficient_data',
      0,
      isProfileIrregular,
      false
    );

    return {
      hasData: false,
      totalRecordsCount: 0,
      completedCyclesCount: 0,
      currentCycleDay: null,
      totalCycleDays: baselineCycle,
      periodDuration: baselineDuration,
      estimatedPhase: null,
      periodStatus: 'No cycle records logged yet',
      isOverdue: false,
      daysOverdue: 0,
      nextPeriodDays: null,
      nextPeriodDate: null,
      rawNextPeriodDate: null,
      averageCycleLength: null,
      averagePeriodDuration: null,
      cycleLengthSource: 'insufficient_history',
      regularityStatus: isProfileIrregular ? 'irregular' : 'insufficient_data',
      regularityLabel: isProfileIrregular ? 'Irregular (Self-reported)' : 'Awaiting records',
      regularityDescription: 'Log your menstrual periods to establish your personal cycle cadence and regularity.',
      dataConfidence: 'insufficient',
      isCycleActive: false,
      activePeriodDay: null,
      lastPeriodStartDate: profileFallback?.lastPeriodDate || null,
      lastPeriodEndDate: null,
      ovulation: emptyOvulation,
      ovulationEstimate: emptyOvulation,
      phaseDayRanges: {
        period: `Days 1–${baselineDuration}`,
        follicular: `Days ${baselineDuration + 1}–13`,
        fertile: 'Pending logged cycles',
        ovulation: 'Pending logged cycles',
        luteal: `Days 16–${baselineCycle}`,
        menstrual: {
          start: 1,
          end: baselineDuration,
          display: `Days 1–${baselineDuration}`,
        },
        follicularRange: {
          start: baselineDuration + 1,
          end: 13,
          display: `Days ${baselineDuration + 1}–13`,
        },
        ovulationRange: {
          start: 14,
          end: 14,
          display: 'Day ~14',
        },
        lutealRange: {
          start: 15,
          end: baselineCycle,
          display: `Days 15–${baselineCycle}`,
        },
        fertileWindow: null,
      },
      clinicalNotice: undefined,
      clinicalNotices: [],
      history: [],
    };
  }

  // 1. Sort records ascending chronologically by periodStartDate
  const validRecords = records.filter(
    (r) => r.periodStartDate && !isNaN(toCalendarEpochDays(r.periodStartDate))
  );

  const sortedAsc = [...validRecords].sort(
    (a, b) => toCalendarEpochDays(a.periodStartDate) - toCalendarEpochDays(b.periodStartDate)
  );

  // 2. Compute cycle intervals between consecutive period start dates
  const calculatedIntervals: number[] = [];
  const durations: number[] = [];
  const historyItemsAsc: CycleHistoryItem[] = [];
  let hasProlongedGap = false;

  for (let i = 0; i < sortedAsc.length; i++) {
    const current = sortedAsc[i];
    const next = sortedAsc[i + 1];

    const dur = Math.max(1, getDaysDifference(current.periodStartDate, current.periodEndDate) + 1);
    durations.push(dur);

    let cycleLengthDays: number | null = null;
    let isIrregularInterval = false;
    let isProlongedGap = false;

    if (next) {
      const interval = getDaysDifference(current.periodStartDate, next.periodStartDate);
      if (interval > 0) {
        cycleLengthDays = interval;
        if (interval >= 15 && interval <= 90) {
          calculatedIntervals.push(interval);
          if (interval < 21 || interval > 38) {
            isIrregularInterval = true;
          }
        } else if (interval > 90) {
          isProlongedGap = true;
          hasProlongedGap = true;
        }
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
      periodDurationDays: dur,
      flow: current.flow || 'medium',
      symptoms: current.symptoms || [],
      notes: current.notes,
      isLatest: i === sortedAsc.length - 1,
      isIrregularInterval,
      isProlongedGap,
    });
  }

  // Reverse history so newest cycle is on top for UI
  const history = [...historyItemsAsc].reverse();

  // 3. Calculate Averages and Cycle Cadence
  const completedCyclesCount = calculatedIntervals.length;
  const totalPeriodDuration = durations.reduce((sum, d) => sum + d, 0);
  const averagePeriodDuration = Math.round(totalPeriodDuration / durations.length) || 5;

  let averageCycleLength: number | null = null;
  let totalCycleDays: number = 28;
  let cycleLengthSource: CycleLengthSource = 'default_estimate';

  if (completedCyclesCount > 0) {
    averageCycleLength = Math.round(
      calculatedIntervals.reduce((sum, val) => sum + val, 0) / completedCyclesCount
    );
    totalCycleDays = averageCycleLength;
    cycleLengthSource = 'calculated_history';
  } else if (typeof profileFallback?.cycleLength === 'number') {
    totalCycleDays = profileFallback.cycleLength;
    cycleLengthSource = 'profile_baseline';
  } else {
    totalCycleDays = 28;
    cycleLengthSource = 'default_estimate';
  }

  // 4. Regularity Status
  let regularityStatus: RegularityStatus = 'insufficient_data';
  let regularityLabel = 'Awaiting more cycles';
  let regularityDescription = 'Log at least 2 consecutive periods to calculate cycle regularity.';

  const isProfileIrregular =
    profileFallback?.cycleLength === 'irregular' ||
    profileFallback?.periodRegularity === 'irregular' ||
    profileFallback?.periodRegularity === 'very_irregular';

  if (completedCyclesCount >= 2) {
    const minInterval = Math.min(...calculatedIntervals);
    const maxInterval = Math.max(...calculatedIntervals);
    const intervalRange = maxInterval - minInterval;

    if (hasProlongedGap || intervalRange > 7 || minInterval < 21 || maxInterval > 38 || isProfileIrregular) {
      regularityStatus = 'irregular';
      regularityLabel = 'Irregular / Variable';
      regularityDescription = hasProlongedGap
        ? 'Your records contain intervals exceeding 90 days. Prolonged gaps or variable cycle lengths are common in hormonal shifts such as PCOS.'
        : `Your cycle length varies by ${intervalRange} days (${minInterval}–${maxInterval} days). Variations greater than 7 days indicate an irregular cadence.`;
    } else {
      regularityStatus = 'regular';
      regularityLabel = 'Predictable / Regular';
      regularityDescription = `Your cycles demonstrate a consistent cadence (~${averageCycleLength} days with ≤${intervalRange} days variation).`;
    }
  } else if (completedCyclesCount === 1) {
    const singleInterval = calculatedIntervals[0];
    if (singleInterval < 21 || singleInterval > 38 || isProfileIrregular) {
      regularityStatus = 'variable';
      regularityLabel = 'Preliminary: Variable';
      regularityDescription = `Your first recorded cycle interval was ${singleInterval} days. More cycles will clarify your baseline rhythm.`;
    } else {
      regularityStatus = 'regular';
      regularityLabel = 'Preliminary: Consistent';
      regularityDescription = `Your first recorded cycle interval was ${singleInterval} days. Additional logs will confirm rhythm consistency.`;
    }
  } else if (isProfileIrregular) {
    regularityStatus = 'irregular';
    regularityLabel = 'Irregular (Self-reported)';
    regularityDescription = 'Based on your health profile, your cycle cadence is variable. Calendar predictions are approximations only.';
  }

  // 5. Active Cycle Analysis (Latest Period)
  const latestRecord = sortedAsc[sortedAsc.length - 1];
  const daysSinceStart = getDaysDifference(latestRecord.periodStartDate, todayStr);
  const currentCycleDay = Math.max(1, daysSinceStart + 1);

  const latestDuration = Math.max(
    1,
    getDaysDifference(latestRecord.periodStartDate, latestRecord.periodEndDate) + 1
  );

  const isCycleActive =
    toCalendarEpochDays(todayStr) >= toCalendarEpochDays(latestRecord.periodStartDate) &&
    toCalendarEpochDays(todayStr) <= toCalendarEpochDays(latestRecord.periodEndDate);

  let activePeriodDay: number | null = null;
  if (isCycleActive) {
    activePeriodDay = currentCycleDay;
  }

  // Expected next period date based on reference cycle length
  const rawNextPeriodDate = addCalendarDays(latestRecord.periodStartDate, totalCycleDays);
  const nextPeriodDate = formatDisplayDate(rawNextPeriodDate);
  const diffToExpected = getDaysDifference(todayStr, rawNextPeriodDate);

  let isOverdue = false;
  let daysOverdue = 0;
  let nextPeriodDays: number | null = null;
  let periodStatus = '';

  if (isCycleActive) {
    periodStatus = `Period active (Day ${activePeriodDay} of ${latestDuration})`;
    nextPeriodDays = Math.max(1, diffToExpected);
  } else if (diffToExpected < 0) {
    // Expected date has passed! Overdue state
    isOverdue = true;
    daysOverdue = Math.abs(diffToExpected);
    nextPeriodDays = null;
    periodStatus = `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue (expected ${nextPeriodDate})`;
  } else if (diffToExpected === 0) {
    isOverdue = false;
    daysOverdue = 0;
    nextPeriodDays = 0;
    periodStatus = `Expected today (${nextPeriodDate})`;
  } else {
    // Normal in-cycle countdown
    isOverdue = false;
    daysOverdue = 0;
    nextPeriodDays = diffToExpected;
    const daysSinceEnd = getDaysDifference(latestRecord.periodEndDate, todayStr);
    if (daysSinceEnd > 0) {
      periodStatus = `Period ended ${daysSinceEnd} day${daysSinceEnd === 1 ? '' : 's'} ago`;
    } else {
      periodStatus = `In cycle (Day ${currentCycleDay})`;
    }
  }

  // 6. Ovulation & Fertile Window Estimation
  const ovulationEstimate = calculateOvulationEstimate(
    latestRecord.periodStartDate,
    totalCycleDays,
    regularityStatus,
    completedCyclesCount,
    isProfileIrregular,
    isOverdue
  );

  // 7. Dynamic Phase Day Ranges
  const ovDay = ovulationEstimate.ovulationDay || 14;
  const fStart = ovulationEstimate.fertileWindowStartDay || 9;
  const fEnd = ovulationEstimate.fertileWindowEndDay || 15;

  const phaseDayRanges: PhaseDayRanges = {
    period: `Days 1–${latestDuration}`,
    follicular: `Days ${latestDuration + 1}–${Math.max(latestDuration + 1, fStart - 1)}`,
    fertile:
      ovulationEstimate.status === 'irregular_uncertain'
        ? 'Timing Variable'
        : `Days ${fStart}–${fEnd}`,
    ovulation:
      ovulationEstimate.status === 'irregular_uncertain'
        ? 'Uncertain'
        : `Day ~${ovDay}`,
    luteal: `Days ${fEnd + 1}–${totalCycleDays}`,
    menstrual: {
      start: 1,
      end: latestDuration,
      display: `Days 1–${latestDuration}`,
    },
    follicularRange: {
      start: latestDuration + 1,
      end: Math.max(latestDuration + 1, fStart - 1),
      display: `Days ${latestDuration + 1}–${Math.max(latestDuration + 1, fStart - 1)}`,
    },
    ovulationRange: {
      start: ovDay,
      end: ovDay,
      display: `Day ~${ovDay}`,
    },
    lutealRange: {
      start: fEnd + 1,
      end: totalCycleDays,
      display: `Days ${fEnd + 1}–${totalCycleDays}`,
    },
    fertileWindow: {
      start: fStart,
      end: fEnd,
      display: `Days ${fStart}–${fEnd}`,
    },
  };

  // 8. Estimated Phase Determination
  const estimatedPhase = getCyclePhase(
    currentCycleDay,
    totalCycleDays,
    latestDuration,
    ovDay,
    fStart,
    fEnd,
    isOverdue,
    regularityStatus === 'irregular' || regularityStatus === 'variable'
  );

  // 9. Data Confidence
  let dataConfidence: 'high' | 'moderate' | 'preliminary' | 'insufficient' = 'insufficient';
  if (completedCyclesCount >= 3 && regularityStatus === 'regular') {
    dataConfidence = 'high';
  } else if (completedCyclesCount >= 2) {
    dataConfidence = 'moderate';
  } else if (completedCyclesCount === 1 || records.length >= 1) {
    dataConfidence = 'preliminary';
  }

  // 10. Educational & Clinical Notice
  let clinicalNotice: string | undefined = undefined;
  if (isOverdue) {
    clinicalNotice =
      'Your cycle has exceeded your typical cadence. Delays can result from stress, illness, travel, or hormonal conditions like PCOS. If bleeding starts, log day 1 to reset your cycle.';
  } else if (regularityStatus === 'irregular') {
    clinicalNotice =
      'Your historical cycle intervals demonstrate natural variation. While BioPulse AI provides estimated phases for general wellness context, calendar-based ovulation and fertile dates cannot be confirmed with precision.';
  }

  return {
    hasData: true,
    totalRecordsCount: records.length,
    completedCyclesCount,
    currentCycleDay,
    totalCycleDays,
    periodDuration: latestDuration,
    estimatedPhase,
    periodStatus,
    isOverdue,
    daysOverdue,
    nextPeriodDays,
    nextPeriodDate,
    rawNextPeriodDate,
    averageCycleLength,
    averagePeriodDuration,
    cycleLengthSource,
    regularityStatus,
    regularityLabel,
    regularityDescription,
    dataConfidence,
    isCycleActive,
    activePeriodDay,
    lastPeriodStartDate: latestRecord.periodStartDate,
    lastPeriodEndDate: latestRecord.periodEndDate,
    ovulation: ovulationEstimate,
    ovulationEstimate,
    phaseDayRanges,
    clinicalNotice,
    clinicalNotices: clinicalNotice ? [clinicalNotice] : [],
    history,
  };
}
