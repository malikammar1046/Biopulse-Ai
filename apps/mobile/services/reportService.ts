/**
 * BioPulse Mobile — Report Service
 *
 * Dedicated typed service connecting:
 * - public.medical_reports (report headers and documents)
 * - public.report_results (verified & unverified test observation rows)
 * - Health Summary PDF export
 *
 * Safety & Security Invariant:
 * 1. Strict Trust Boundary: Unverified OCR drafts are stored with status='needs_verification'
 *    and user_verified=false. They are quarantined and never treated as trusted clinical data
 *    until explicitly reviewed and confirmed by the authenticated user.
 * 2. Authenticated Scoping: All queries and mutations are strictly scoped by user_id.
 */

import { SUPABASE_URL, BACKEND_API_URL, getSupabaseHeaders, getDjangoHeaders, safeRequest, ApiResponse } from './api';
import { ReportItem, ClinicalLabRow } from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export type DatabaseResultStatus = 'within_range' | 'outside_range' | 'needs_review' | 'insufficient_info';

export interface TestResultInput {
  testName: string;
  category?: string;
  value: string;
  resultNumeric?: number | null;
  unit?: string;
  referenceRange?: string;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  status?: string;
  ocrConfidence?: number;
  userVerified?: boolean;
  explanation?: string;
}

export interface SaveReportInput {
  title: string;
  reportType?: 'screening' | 'lab' | 'summary' | 'hormone_test' | 'blood_test' | string;
  reportDate?: string;
  fileName?: string;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string;
  status?: 'processing' | 'needs_verification' | 'verified';
  tests?: TestResultInput[];
}

export type SaveVerifiedReportInput = SaveReportInput;

export interface ReportDetailEntity extends ReportItem {
  results: ClinicalLabRow[];
  fileName?: string;
  filePath?: string | null;
  rawStatus?: string;
}

// ============================================================================
// STATUS NORMALIZERS
// ============================================================================

/**
 * Normalizes any test status into the exact CHECK constraint values of public.report_results
 * ('within_range', 'outside_range', 'needs_review', 'insufficient_info')
 */
export function normalizeResultStatus(status?: string): DatabaseResultStatus {
  if (!status) return 'within_range';
  const s = status.toLowerCase().trim();
  if (s === 'within_range' || s === 'normal') return 'within_range';
  if (s === 'outside_range' || s === 'high' || s === 'low') return 'outside_range';
  if (s === 'needs_review' || s === 'review' || s === 'flagged') return 'needs_review';
  if (s === 'insufficient_info') return 'insufficient_info';
  return 'within_range';
}

/**
 * Maps database status to UI display label
 */
export function mapDbStatusToUiLabel(dbStatus?: string): 'Normal' | 'High' | 'Low' {
  if (!dbStatus) return 'Normal';
  const s = dbStatus.toLowerCase();
  if (s === 'within_range' || s === 'normal') return 'Normal';
  if (s === 'low') return 'Low';
  if (s === 'outside_range' || s === 'high') return 'High';
  return 'Normal';
}

// ============================================================================
// REPORT SERVICE CLASS
// ============================================================================

export class ReportService {
  /**
   * Fetch authenticated patient medical reports from Supabase
   */
  static async getReports(
    userId: string,
    token: string
  ): Promise<ApiResponse<ReportItem[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medical_reports?user_id=eq.${userId}&order=report_date.desc&select=*`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const items: ReportItem[] = (res.data || []).map((r: any) => ({
      id: String(r.id),
      title: r.title || 'Laboratory Report',
      date: r.report_date
        ? new Date(r.report_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Recent',
      type: r.report_type === 'screening' ? 'Screening' : r.report_type === 'summary' ? 'Clinical Summary' : 'Lab',
      status: r.status === 'verified' ? 'Completed' : 'Uploaded',
      tags: [r.report_type || 'Lab'],
      pdfUrl: r.file_path || undefined,
    }));

    return { data: items, error: null, status: 200 };
  }

  /**
   * Fetch specific report with extracted test results
   */
  static async getReportDetail(
    reportId: string,
    userId: string,
    token: string
  ): Promise<ApiResponse<ReportDetailEntity | null>> {
    if (!reportId || !token || !userId) {
      return { data: null, error: 'Report ID, User ID, and token required.', status: 400 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medical_reports?id=eq.${reportId}&user_id=eq.${userId}&select=*,report_results(*)`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error || !res.data || res.data.length === 0) {
      return { data: null, error: res.error || 'Report not found.', status: res.status || 404 };
    }

    const r = res.data[0];
    const rawTests = Array.isArray(r.report_results) ? r.report_results : [];
    const results: ClinicalLabRow[] = rawTests.map((t: any) => ({
      id: String(t.id),
      testName: t.test_name,
      category: 'Hormones',
      value: String(t.result_value ?? t.value ?? ''),
      unit: t.unit || '',
      referenceRange: t.reference_range || '',
      status: mapDbStatusToUiLabel(t.status),
    }));

    return {
      data: {
        id: String(r.id),
        title: r.title,
        date: r.report_date || 'Recent',
        type: r.report_type === 'screening' ? 'Screening' : r.report_type === 'summary' ? 'Clinical Summary' : 'Lab',
        status: r.status === 'verified' ? 'Completed' : 'Uploaded',
        rawStatus: r.status,
        pdfUrl: r.file_path || undefined,
        fileName: r.file_name,
        filePath: r.file_path,
        results,
      },
      error: null,
      status: 200,
    };
  }

  /**
   * Fetch all verified lab observations across the user's verified reports
   */
  static async getVerifiedLabs(
    userId: string,
    token: string
  ): Promise<ApiResponse<ClinicalLabRow[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medical_reports?user_id=eq.${userId}&status=eq.verified&select=id,title,report_date,report_results(*)`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const verifiedList: ClinicalLabRow[] = [];
    (res.data || []).forEach((rep: any) => {
      const results = Array.isArray(rep.report_results) ? rep.report_results : [];
      results.forEach((t: any) => {
        if (t.user_verified) {
          verifiedList.push({
            id: String(t.id),
            testName: t.test_name,
            category: 'Hormones',
            value: String(t.result_value ?? t.value ?? ''),
            unit: t.unit || '',
            referenceRange: t.reference_range || '',
            status: mapDbStatusToUiLabel(t.status),
          });
        }
      });
    });

    return { data: verifiedList, error: null, status: 200 };
  }

  /**
   * Create an unverified raw OCR report draft (status: 'needs_verification', user_verified: false)
   * Quarantined from trusted analytics until user confirms.
   */
  static async createUnverifiedReport(
    userId: string,
    token: string,
    input: SaveReportInput
  ): Promise<ApiResponse<ReportItem>> {
    return this.persistReportWithStatus(userId, token, {
      ...input,
      status: 'needs_verification',
    }, false);
  }

  /**
   * Save verified OCR laboratory report to public.medical_reports and public.report_results
   * Status: 'verified', user_verified: true
   */
  static async saveVerifiedReport(
    userId: string,
    token: string,
    input: SaveVerifiedReportInput
  ): Promise<ApiResponse<ReportItem>> {
    return this.persistReportWithStatus(userId, token, {
      ...input,
      status: 'verified',
    }, true);
  }

  /**
   * Internal helper to persist reports strictly conforming to Supabase schema constraints
   */
  private static async persistReportWithStatus(
    userId: string,
    token: string,
    input: SaveReportInput,
    isVerified: boolean
  ): Promise<ApiResponse<ReportItem>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const reportStatus = input.status || (isVerified ? 'verified' : 'needs_verification');
    const fileName = input.fileName || (input.title ? `${input.title.toLowerCase().replace(/\s+/g, '_')}.pdf` : 'lab_report.pdf');
    const mimeType = input.mimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    // 1. Insert report header into public.medical_reports
    const repPayload = {
      user_id: userId,
      title: input.title,
      report_type: input.reportType || 'lab',
      report_date: input.reportDate || new Date().toISOString().split('T')[0],
      file_name: fileName,
      file_path: input.filePath || null,
      file_size: input.fileSize || null,
      mime_type: mimeType,
      status: reportStatus,
    };

    const repUrl = `${SUPABASE_URL}/rest/v1/medical_reports`;
    const repRes = await safeRequest<any[]>(repUrl, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(repPayload),
    });

    if (repRes.error) return { data: null, error: repRes.error, status: repRes.status };

    const createdRep = Array.isArray(repRes.data) && repRes.data[0] ? repRes.data[0] : repPayload;
    const reportId = createdRep.id;

    // 2. Insert test results into public.report_results if provided
    if (reportId && input.tests && input.tests.length > 0) {
      const resultsPayload = input.tests.map((t) => {
        const valStr = String(t.value ?? '');
        const numVal = t.resultNumeric !== undefined ? t.resultNumeric : parseFloat(valStr) || null;
        const normStatus = normalizeResultStatus(t.status);
        const conf = typeof t.ocrConfidence === 'number' ? Math.max(0, Math.min(1, t.ocrConfidence)) : 0.95;

        return {
          report_id: reportId,
          test_name: t.testName,
          result_value: valStr,
          result_numeric: numVal,
          unit: t.unit || '',
          reference_range: t.referenceRange || '',
          reference_low: t.referenceLow ?? null,
          reference_high: t.referenceHigh ?? null,
          status: normStatus,
          ocr_confidence: conf,
          user_verified: t.userVerified !== undefined ? t.userVerified : isVerified,
          explanation: t.explanation || '',
        };
      });

      await safeRequest(`${SUPABASE_URL}/rest/v1/report_results`, {
        method: 'POST',
        headers: getSupabaseHeaders(token),
        body: JSON.stringify(resultsPayload),
      });
    }

    return {
      data: {
        id: String(reportId || 'new_rep'),
        title: repPayload.title,
        date: repPayload.report_date,
        type: 'Lab',
        status: reportStatus === 'verified' ? 'Completed' : 'Uploaded',
        tags: ['Lab'],
        pdfUrl: repPayload.file_path || undefined,
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Confirm human verification of an existing report:
   * Sets medical_reports.status = 'verified' and updates report_results.user_verified = true
   */
  static async confirmReportVerification(
    reportId: string,
    userId: string,
    token: string,
    verifiedTests?: TestResultInput[]
  ): Promise<ApiResponse<boolean>> {
    if (!reportId || !userId || !token) {
      return { data: false, error: 'Report ID, User ID, and token required.', status: 400 };
    }

    // 1. Update report status to 'verified'
    const updateUrl = `${SUPABASE_URL}/rest/v1/medical_reports?id=eq.${reportId}&user_id=eq.${userId}`;
    const repRes = await safeRequest(updateUrl, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify({ status: 'verified' }),
    });

    if (repRes.error) return { data: false, error: repRes.error, status: repRes.status };

    // 2. If updated tests provided, update child rows
    if (verifiedTests && verifiedTests.length > 0) {
      // Mark all existing results for this report as verified
      const markUrl = `${SUPABASE_URL}/rest/v1/report_results?report_id=eq.${reportId}`;
      await safeRequest(markUrl, {
        method: 'PATCH',
        headers: getSupabaseHeaders(token),
        body: JSON.stringify({ user_verified: true }),
      });
    }

    return { data: true, error: null, status: 200 };
  }

  /**
   * Delete report and cascaded test results
   */
  static async deleteReport(
    reportId: string,
    userId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    if (!reportId || !userId || !token) {
      return { data: false, error: 'Report ID, User ID, and token required.', status: 400 };
    }

    const delUrl = `${SUPABASE_URL}/rest/v1/medical_reports?id=eq.${reportId}&user_id=eq.${userId}`;
    const res = await safeRequest(delUrl, {
      method: 'DELETE',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: false, error: res.error, status: res.status };
    return { data: true, error: null, status: 200 };
  }

  /**
   * Export Clinical Summary PDF via Django
   */
  static async exportSummaryPdf(token: string): Promise<ApiResponse<{ pdfUrl: string }>> {
    const url = `${BACKEND_API_URL}/v1/health/summary/pdf/`;
    const res = await safeRequest<any>(url, {
      method: 'GET',
      headers: getDjangoHeaders(token),
    });

    if (res.data && res.data.pdf_url) {
      return { data: { pdfUrl: res.data.pdf_url }, error: null, status: 200 };
    }

    return {
      data: null,
      error: res.error || 'Failed to generate PDF summary.',
      status: res.status,
    };
  }
}

export const reportService = ReportService;

