/**
 * BioPulse Mobile — Report Service
 *
 * Dedicated typed service connecting:
 * - public.medical_reports (report headers and documents)
 * - public.report_results (verified test observation rows)
 * - Health Summary PDF export
 */

import { SUPABASE_URL, BACKEND_API_URL, getSupabaseHeaders, getDjangoHeaders, safeRequest, ApiResponse } from './api';
import { ReportItem, ClinicalLabRow } from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export interface SaveVerifiedReportInput {
  title: string;
  reportType?: 'screening' | 'lab' | 'summary' | string;
  reportDate?: string;
  fileUrl?: string;
  tests: {
    testName: string;
    category?: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    status?: 'Normal' | 'High' | 'Low' | string;
  }[];
}

export interface ReportDetailEntity extends ReportItem {
  results: ClinicalLabRow[];
}

// ============================================================================
// REPORT SERVICE CLASS
// ============================================================================

export class ReportService {
  /**
   * Fetch patient medical reports from Supabase
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
      date: r.report_date ? new Date(r.report_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
      type: r.report_type === 'screening' ? 'Screening' : r.report_type === 'summary' ? 'Clinical Summary' : 'Lab',
      status: r.status === 'verified' ? 'Completed' : 'Uploaded',
      tags: [r.report_type || 'Lab'],
      pdfUrl: r.file_url,
    }));

    return { data: items, error: null, status: 200 };
  }

  /**
   * Fetch specific report with extracted test results
   */
  static async getReportDetail(
    reportId: string,
    token: string
  ): Promise<ApiResponse<ReportDetailEntity | null>> {
    if (!reportId || !token) {
      return { data: null, error: 'Report ID and token required.', status: 400 };
    }

    const url = `${SUPABASE_URL}/rest/v1/medical_reports?id=eq.${reportId}&select=*,report_results(*)`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error || !res.data || res.data.length === 0) {
      return { data: null, error: res.error || 'Report not found.', status: res.status };
    }

    const r = res.data[0];
    const rawTests = Array.isArray(r.report_results) ? r.report_results : [];
    const results: ClinicalLabRow[] = rawTests.map((t: any) => ({
      id: String(t.id),
      testName: t.test_name,
      category: t.category || 'Hormones',
      value: String(t.value),
      unit: t.unit || '',
      referenceRange: t.reference_range || '',
      status: t.status === 'High' ? 'High' : t.status === 'Low' ? 'Low' : 'Normal',
    }));

    return {
      data: {
        id: String(r.id),
        title: r.title,
        date: r.report_date || 'Recent',
        type: r.report_type === 'screening' ? 'Screening' : r.report_type === 'summary' ? 'Clinical Summary' : 'Lab',
        status: r.status === 'verified' ? 'Completed' : 'Uploaded',
        pdfUrl: r.file_url,
        results,
      },
      error: null,
      status: 200,
    };
  }

  /**
   * Save verified OCR laboratory report to public.medical_reports and public.report_results
   */
  static async saveVerifiedReport(
    userId: string,
    token: string,
    input: SaveVerifiedReportInput
  ): Promise<ApiResponse<ReportItem>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    // 1. Insert report header
    const repPayload = {
      user_id: userId,
      title: input.title,
      report_type: input.reportType || 'lab',
      report_date: input.reportDate || new Date().toISOString().split('T')[0],
      status: 'verified',
      file_url: input.fileUrl || null,
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

    // 2. Insert test results if provided
    if (reportId && input.tests && input.tests.length > 0) {
      const resultsPayload = input.tests.map((t) => ({
        report_id: reportId,
        test_name: t.testName,
        category: t.category || 'Hormones',
        value: t.value,
        unit: t.unit || null,
        reference_range: t.referenceRange || null,
        status: t.status || 'Normal',
      }));

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
        status: 'Completed',
        tags: ['Lab'],
      },
      error: null,
      status: 201,
    };
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
