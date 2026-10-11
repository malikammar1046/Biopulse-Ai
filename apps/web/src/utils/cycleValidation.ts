import type { CycleRecord, CycleRecordInput } from '../types/cycle';
import {
  formatDisplayDate,
  getDaysDifference,
  getTodayDateString,
  toCalendarEpochDays,
} from './cycleCalculations.ts';

export interface CycleValidationResult {
  isValid: boolean;
  errors: {
    startDate?: string;
    endDate?: string;
    flow?: string;
    general?: string;
  };
}

/**
 * Validates a period log entry to protect against invalid data, impossible ranges, and overlapping periods.
 * Pure timezone-immune calendar day validation.
 */
export function validateCycleRecord(
  input: CycleRecordInput,
  existingRecords: CycleRecord[] = [],
  editingRecordId?: string
): CycleValidationResult {
  const errors: CycleValidationResult['errors'] = {};

  // 1. Validate Start Date presence & format
  if (!input.periodStartDate || input.periodStartDate.trim() === '') {
    errors.startDate = 'Please select a period start date.';
  } else {
    const epochDays = toCalendarEpochDays(input.periodStartDate);
    if (isNaN(epochDays)) {
      errors.startDate = 'Invalid start date format. Please use YYYY-MM-DD.';
    }
  }

  // 2. Validate End Date presence & format
  if (!input.periodEndDate || input.periodEndDate.trim() === '') {
    errors.endDate = 'Please select a period end date.';
  } else {
    const epochDays = toCalendarEpochDays(input.periodEndDate);
    if (isNaN(epochDays)) {
      errors.endDate = 'Invalid end date format. Please use YYYY-MM-DD.';
    }
  }

  // 3. Chronological Consistency & Duration Check
  if (!errors.startDate && !errors.endDate) {
    const startEpoch = toCalendarEpochDays(input.periodStartDate);
    const endEpoch = toCalendarEpochDays(input.periodEndDate);
    const todayStr = getTodayDateString();
    const todayEpoch = toCalendarEpochDays(todayStr);

    if (endEpoch < startEpoch) {
      errors.endDate = 'Period end date cannot be earlier than the start date.';
    }

    if (startEpoch > todayEpoch) {
      errors.startDate = 'Period start date cannot be set in the future.';
    }

    const durationDays = getDaysDifference(input.periodStartDate, input.periodEndDate) + 1;
    if (durationDays < 1) {
      errors.endDate = 'Period duration must be at least 1 day.';
    } else if (durationDays > 14) {
      errors.endDate = 'Period bleeding duration cannot exceed 14 consecutive days. Please review dates or consult a doctor for prolonged bleeding.';
    }
  }

  // 4. Validate Menstrual Flow (Allow spotting, light, medium, heavy)
  if (!input.flow || !['spotting', 'light', 'medium', 'heavy'].includes(input.flow)) {
    errors.flow = 'Please select a flow intensity (Spotting, Light, Medium, or Heavy).';
  }

  // 5. Overlapping Range Check
  if (!errors.startDate && !errors.endDate) {
    const newStart = input.periodStartDate;
    const newEnd = input.periodEndDate;
    const newStartEpoch = toCalendarEpochDays(newStart);
    const newEndEpoch = toCalendarEpochDays(newEnd);

    const overlappingRecord = existingRecords.find((rec) => {
      if (editingRecordId && rec.id === editingRecordId) {
        return false;
      }
      const recStartEpoch = toCalendarEpochDays(rec.periodStartDate);
      const recEndEpoch = toCalendarEpochDays(rec.periodEndDate);

      // Two intervals [A, B] and [C, D] overlap if A <= D and B >= C
      return newStartEpoch <= recEndEpoch && newEndEpoch >= recStartEpoch;
    });

    if (overlappingRecord) {
      errors.general = `These dates overlap with an existing period record (${formatDisplayDate(
        overlappingRecord.periodStartDate
      )} – ${formatDisplayDate(overlappingRecord.periodEndDate)}). Please adjust the dates.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
