import type { CycleRecord, CycleRecordInput } from '../types/cycle';
import { formatDisplayDate, getDaysDifference } from './cycleCalculations';

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
    const startDate = new Date(input.periodStartDate);
    if (isNaN(startDate.getTime())) {
      errors.startDate = 'Invalid start date format.';
    }
  }

  // 2. Validate End Date presence & format
  if (!input.periodEndDate || input.periodEndDate.trim() === '') {
    errors.endDate = 'Please select a period end date.';
  } else {
    const endDate = new Date(input.periodEndDate);
    if (isNaN(endDate.getTime())) {
      errors.endDate = 'Invalid end date format.';
    }
  }

  // 3. Chronological Consistency & Duration Check
  if (!errors.startDate && !errors.endDate) {
    const start = new Date(input.periodStartDate);
    const end = new Date(input.periodEndDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (end < start) {
      errors.endDate = 'Period end date cannot be before the start date.';
    }

    if (start > today) {
      errors.startDate = 'Start date cannot be set in the future.';
    }

    const durationDays = getDaysDifference(input.periodStartDate, input.periodEndDate) + 1;
    if (durationDays < 1) {
      errors.endDate = 'Period duration must be at least 1 day.';
    } else if (durationDays > 14) {
      errors.endDate = 'Period duration cannot exceed 14 consecutive days.';
    }
  }

  // 4. Validate Menstrual Flow
  if (!input.flow || !['light', 'medium', 'heavy'].includes(input.flow)) {
    errors.flow = 'Please select a flow intensity (Light, Medium, or Heavy).';
  }

  // 5. Overlapping Range Check
  if (!errors.startDate && !errors.endDate) {
    const newStart = input.periodStartDate;
    const newEnd = input.periodEndDate;

    const overlappingRecord = existingRecords.find((rec) => {
      if (editingRecordId && rec.id === editingRecordId) {
        return false;
      }
      const existingStart = rec.periodStartDate;
      const existingEnd = rec.periodEndDate;

      // Two ranges [A, B] and [C, D] overlap if A <= D and B >= C
      return newStart <= existingEnd && newEnd >= existingStart;
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
