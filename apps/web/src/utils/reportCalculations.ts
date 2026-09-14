import type {
  MedicalReport,
  ReportResultStatus,
  ReportSummaryStats,
  BiomarkerTrendPoint,
  ReportType,
} from '../types/report';

/**
 * Extracts a clean floating-point number from a string with possible prefixes/units ("12.4 g/dL" -> 12.4).
 */
export function parseNumericValue(rawStr: string): number | null {
  if (!rawStr) return null;
  const match = rawStr.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (match) {
    const num = parseFloat(match[0]);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Evaluates whether a result value is within or outside the provided reference interval.
 * Strictly observational and non-diagnostic.
 */
export function evaluateResultStatus(
  resultVal: string | number,
  low?: number | null,
  high?: number | null
): ReportResultStatus {
  const numeric = typeof resultVal === 'number' ? resultVal : parseNumericValue(String(resultVal));

  if (numeric === null) {
    return 'insufficient_info';
  }

  if (low !== undefined && low !== null && high !== undefined && high !== null) {
    if (numeric >= low && numeric <= high) {
      return 'within_range';
    }
    return 'outside_range';
  }

  if (low !== undefined && low !== null && (high === undefined || high === null)) {
    return numeric >= low ? 'within_range' : 'outside_range';
  }

  if (high !== undefined && high !== null && (low === undefined || low === null)) {
    return numeric <= high ? 'within_range' : 'outside_range';
  }

  return 'insufficient_info';
}

/**
 * Computes aggregate summary metrics across all user medical reports.
 */
export function calculateReportSummaryStats(reports: MedicalReport[]): ReportSummaryStats {
  const categoryCounts: Record<ReportType, number> = {
    blood_test: 0,
    hormone_test: 0,
    ultrasound: 0,
    thyroid_test: 0,
    glucose_sugar: 0,
    lipid_cholesterol: 0,
    vitamin_test: 0,
    other: 0,
  };

  let needsReviewCount = 0;
  let totalTestsCount = 0;
  let latestDate: string | null = null;

  for (const rep of reports) {
    if (categoryCounts[rep.reportType] !== undefined) {
      categoryCounts[rep.reportType] += 1;
    } else {
      categoryCounts.other += 1;
    }

    if (!latestDate || rep.reportDate > latestDate) {
      latestDate = rep.reportDate;
    }

    for (const result of rep.results || []) {
      totalTestsCount += 1;
      if (result.status === 'outside_range' || result.status === 'needs_review') {
        needsReviewCount += 1;
      }
    }
  }

  return {
    totalReportsCount: reports.length,
    needsReviewCount,
    latestReportDate: latestDate,
    recognizedTestsCount: totalTestsCount,
    categoryCounts,
  };
}

/**
 * Finds all historical readings for a given test across all chronological reports.
 */
export function extractHistoricalTrends(
  reports: MedicalReport[],
  targetTestName: string,
  onlyVerified: boolean = false
): BiomarkerTrendPoint[] {
  if (!reports || !targetTestName) return [];

  const normalizedTarget = targetTestName.toLowerCase().trim();
  const trendPoints: BiomarkerTrendPoint[] = [];

  for (const rep of reports) {
    for (const res of rep.results || []) {
      if (onlyVerified && !res.userVerified) {
        continue; // Quarantined: exclude unverified OCR extractions
      }
      if (
        res.testName.toLowerCase().includes(normalizedTarget) ||
        normalizedTarget.includes(res.testName.toLowerCase())
      ) {
        const num = res.resultNumeric ?? parseNumericValue(res.resultValue);
        if (num !== null) {
          trendPoints.push({
            date: rep.reportDate,
            reportId: rep.id,
            reportTitle: rep.title,
            resultValue: res.resultValue,
            numericValue: num,
            unit: res.unit,
            status: res.status,
            referenceRange: res.referenceRange,
          });
        }
      }
    }
  }

  // Sort chronological oldest to newest for trend graph
  return trendPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Discovers tests that appear in 2 or more reports to offer trend view.
 */
export function getCommonTrendableTests(reports: MedicalReport[]): string[] {
  const counts: Record<string, number> = {};

  for (const rep of reports) {
    for (const res of rep.results || []) {
      const name = res.testName.trim();
      counts[name] = (counts[name] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .filter(([_, count]) => count >= 2)
    .map(([name]) => name);
}
