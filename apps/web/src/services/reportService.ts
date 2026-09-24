import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  MedicalReport,
  MedicalReportInput,
  ReportResultInput,
  ReportType,
  ReportStatus,
} from '../types/report';

export interface DatabaseReportRow {
  id: string;
  user_id: string;
  title: string;
  report_type: string;
  report_date: string;
  file_path: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  report_results?: DatabaseResultRow[];
}

export interface DatabaseResultRow {
  id: string;
  report_id: string;
  test_name: string;
  result_value: string;
  result_numeric: number | null;
  unit: string;
  reference_range: string;
  reference_low: number | null;
  reference_high: number | null;
  status: string;
  ocr_confidence: number;
  user_verified: boolean;
  explanation: string;
  created_at: string;
}

const STORAGE_REPORTS_KEY_PREFIX = 'ovasense_medical_reports_';

export function mapDbRowToMedicalReport(
  row: DatabaseReportRow,
  results: DatabaseResultRow[] = []
): MedicalReport {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    reportType: (row.report_type as ReportType) || 'other',
    reportDate: row.report_date,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: row.file_size || undefined,
    mimeType: row.mime_type,
    status: (row.status as ReportStatus) || 'needs_verification',
    results: (results || []).map((r) => ({
      id: r.id,
      reportId: r.report_id,
      testName: r.test_name,
      resultValue: r.result_value,
      resultNumeric: r.result_numeric,
      unit: r.unit,
      referenceRange: r.reference_range,
      referenceLow: r.reference_low,
      referenceHigh: r.reference_high,
      status: (r.status as any) || 'within_range',
      ocrConfidence: r.ocr_confidence ?? 0.95,
      userVerified: Boolean(r.user_verified),
      verificationState: r.user_verified ? 'user_confirmed' : 'extracted',
      explanation: r.explanation || '',
      createdAt: r.created_at,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ReportService {
  private getStorageKey(userId: string): string {
    return `${STORAGE_REPORTS_KEY_PREFIX}${userId}`;
  }

  private getLocalCache(userId: string): MedicalReport[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalCache(userId: string, reports: MedicalReport[]): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(reports));
    } catch {
      // ignore
    }
  }

  /**
   * Uploads report file to Supabase Storage bucket 'medical-reports'.
   * Falls back to a local object URL if storage is unconfigured.
   */
  async uploadReportFile(
    userId: string,
    file: File
  ): Promise<{ filePath: string | null; error?: string }> {
    if (!isSupabaseConfigured() || !userId) {
      const fallbackUrl = URL.createObjectURL(file);
      return { filePath: fallbackUrl };
    }

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${userId}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('medical-reports')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('Supabase storage upload notice (using fallback object URL):', error.message);
        return { filePath: URL.createObjectURL(file) };
      }

      return { filePath: data.path };
    } catch (err: any) {
      console.warn('Storage upload error (using fallback):', err);
      return { filePath: URL.createObjectURL(file) };
    }
  }

  /**
   * Fetches all medical reports and nested results for the user.
   */
  async fetchMedicalReports(
    userId: string
  ): Promise<{ reports: MedicalReport[]; error?: string }> {
    if (!userId) {
      return { reports: [], error: 'User ID is required to fetch reports.' };
    }

    if (!isSupabaseConfigured()) {
      const cached = this.getLocalCache(userId);
      return { reports: cached };
    }

    try {
      // 1. Fetch parent reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('user_id', userId)
        .order('report_date', { ascending: false });

      if (reportsError) {
        console.warn(
          'Supabase fetch medical_reports notice (using local cache):',
          reportsError.message
        );
        const cached = this.getLocalCache(userId);
        return { reports: cached };
      }

      if (!reportsData || reportsData.length === 0) {
        this.setLocalCache(userId, []);
        return { reports: [] };
      }

      const reportIds = reportsData.map((r) => r.id);

      // 2. Fetch nested results
      const { data: resultsData, error: resultsError } = await supabase
        .from('report_results')
        .select('*')
        .in('report_id', reportIds);

      if (resultsError) {
        console.warn('Supabase fetch report_results notice:', resultsError.message);
      }

      // Group results by report_id
      const resultsByReportId: Record<string, DatabaseResultRow[]> = {};
      for (const res of resultsData || []) {
        if (!resultsByReportId[res.report_id]) {
          resultsByReportId[res.report_id] = [];
        }
        resultsByReportId[res.report_id].push(res);
      }

      const fullReports = reportsData.map((r) =>
        mapDbRowToMedicalReport(r, resultsByReportId[r.id] || [])
      );

      this.setLocalCache(userId, fullReports);
      return { reports: fullReports };
    } catch (err: any) {
      console.warn('Network error fetching medical reports:', err);
      const cached = this.getLocalCache(userId);
      return { reports: cached };
    }
  }

  /**
   * Creates a new medical report and saves test results.
   * If any results are unverified, parent status defaults to 'needs_verification'.
   */
  async createMedicalReport(
    userId: string,
    input: MedicalReportInput
  ): Promise<{ report: MedicalReport | null; error?: string }> {
    if (!userId) {
      return { record: null, error: 'User must be signed in to save reports.' } as any;
    }

    const reportId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const hasResults = (input.results || []).length > 0;
    const allResultsVerified =
      hasResults && input.results!.every((r) => Boolean(r.userVerified));
    const computedStatus: ReportStatus =
      input.status || (allResultsVerified ? 'verified' : 'needs_verification');

    const fullReport: MedicalReport = {
      id: reportId,
      userId,
      title: input.title,
      reportType: input.reportType,
      reportDate: input.reportDate,
      filePath: input.filePath,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      status: computedStatus,
      results: (input.results || []).map((r) => ({
        id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        reportId,
        testName: r.testName,
        resultValue: r.resultValue,
        resultNumeric: r.resultNumeric ?? null,
        unit: r.unit,
        referenceRange: r.referenceRange || '',
        referenceLow: r.referenceLow ?? null,
        referenceHigh: r.referenceHigh ?? null,
        status: r.status,
        ocrConfidence: r.ocrConfidence ?? 0.95,
        userVerified: Boolean(r.userVerified),
        verificationState: r.userVerified ? 'user_confirmed' : 'extracted',
        explanation: r.explanation || '',
        timelineConnection: r.timelineConnection || '',
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const existing = this.getLocalCache(userId);
      const updated = [fullReport, ...existing].sort(
        (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );
      this.setLocalCache(userId, updated);
      return { report: fullReport };
    }

    try {
      // 1. Insert parent report
      const { data: repData, error: repError } = await supabase
        .from('medical_reports')
        .insert({
          user_id: userId,
          title: input.title,
          report_type: input.reportType,
          report_date: input.reportDate,
          file_path: input.filePath,
          file_name: input.fileName,
          file_size: input.fileSize,
          mime_type: input.mimeType,
          status: computedStatus,
        })
        .select()
        .single();

      if (repError) {
        console.warn(
          'Supabase insert medical_reports notice (using local fallback):',
          repError.message
        );
        const existing = this.getLocalCache(userId);
        const updated = [fullReport, ...existing].sort(
          (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
        );
        this.setLocalCache(userId, updated);
        return { report: fullReport };
      }

      // 2. Insert child results
      const resultsPayload = (input.results || []).map((r) => ({
        report_id: repData.id,
        test_name: r.testName,
        result_value: r.resultValue,
        result_numeric: r.resultNumeric ?? null,
        unit: r.unit,
        reference_range: r.referenceRange || '',
        reference_low: r.referenceLow ?? null,
        reference_high: r.referenceHigh ?? null,
        status: r.status,
        ocr_confidence: r.ocrConfidence ?? 0.95,
        user_verified: Boolean(r.userVerified),
        explanation: r.explanation || '',
      }));

      let insertedResults: DatabaseResultRow[] = [];
      if (resultsPayload.length > 0) {
        const { data: resData, error: resError } = await supabase
          .from('report_results')
          .insert(resultsPayload)
          .select();

        if (!resError && resData) {
          insertedResults = resData;
        }
      }

      const savedReport = mapDbRowToMedicalReport(repData, insertedResults);
      const existing = this.getLocalCache(userId);
      const updated = [savedReport, ...existing.filter((r) => r.id !== savedReport.id)].sort(
        (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );
      this.setLocalCache(userId, updated);

      return { report: savedReport };
    } catch (err: any) {
      console.warn('Network error saving medical report (using local fallback):', err);
      const existing = this.getLocalCache(userId);
      const updated = [fullReport, ...existing].sort(
        (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );
      this.setLocalCache(userId, updated);
      return { report: fullReport };
    }
  }

  /**
   * Deletes a report and cascaded results.
   */
  async deleteMedicalReport(
    userId: string,
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!id || !userId) {
      return { success: false, error: 'Report ID and User ID are required.' };
    }

    if (!isSupabaseConfigured()) {
      const existing = this.getLocalCache(userId);
      const filtered = existing.filter((r) => r.id !== id);
      this.setLocalCache(userId, filtered);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('medical_reports')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase delete medical_reports notice (using cache):', error.message);
      }

      const existing = this.getLocalCache(userId);
      const filtered = existing.filter((r) => r.id !== id);
      this.setLocalCache(userId, filtered);

      return { success: true };
    } catch (err: any) {
      console.warn('Network error deleting medical report:', err);
      const existing = this.getLocalCache(userId);
      const filtered = existing.filter((r) => r.id !== id);
      this.setLocalCache(userId, filtered);
      return { success: true };
    }
  }

  /**
   * Updates an individual test result and optionally confirms user verification.
   * If all results in the parent report are verified, automatically updates parent status to 'verified'.
   */
  async updateReportResult(
    userId: string,
    reportId: string,
    resultId: string,
    updates: Partial<ReportResultInput>,
    markVerified: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    if (!reportId || !resultId) {
      return { success: false, error: 'Report ID and Result ID are required.' };
    }

    try {
      const payload: Record<string, any> = {};
      if (updates.testName !== undefined) payload.test_name = updates.testName;
      if (updates.resultValue !== undefined) payload.result_value = updates.resultValue;
      if (updates.resultNumeric !== undefined) payload.result_numeric = updates.resultNumeric;
      if (updates.unit !== undefined) payload.unit = updates.unit;
      if (updates.referenceRange !== undefined) payload.reference_range = updates.referenceRange;
      if (updates.status !== undefined) payload.status = updates.status;
      if (markVerified) payload.user_verified = true;

      if (isSupabaseConfigured() && Object.keys(payload).length > 0) {
        await supabase
          .from('report_results')
          .update(payload)
          .eq('id', resultId);
      }

      // Update local cache and check parent report completeness
      const existing = this.getLocalCache(userId);
      let parentReportAllVerified = false;
      const updated = existing.map((rep) => {
        if (rep.id === reportId) {
          const updatedResults = rep.results.map((r) => {
            if (r.id === resultId) {
              const isNowVerified = markVerified ? true : (updates.userVerified !== undefined ? Boolean(updates.userVerified) : r.userVerified);
              return {
                ...r,
                testName: updates.testName ?? r.testName,
                resultValue: updates.resultValue ?? r.resultValue,
                resultNumeric: updates.resultNumeric !== undefined ? updates.resultNumeric : r.resultNumeric,
                unit: updates.unit ?? r.unit,
                referenceRange: updates.referenceRange ?? r.referenceRange,
                status: updates.status ?? r.status,
                userVerified: isNowVerified,
                verificationState: isNowVerified ? ('user_confirmed' as const) : ('extracted' as const),
              };
            }
            return r;
          });
          parentReportAllVerified = updatedResults.length > 0 && updatedResults.every((r) => r.userVerified);
          return {
            ...rep,
            status: parentReportAllVerified ? ('verified' as ReportStatus) : rep.status,
            results: updatedResults,
          };
        }
        return rep;
      });

      this.setLocalCache(userId, updated);

      // If all results are verified, elevate parent report in Supabase as well
      if (isSupabaseConfigured() && parentReportAllVerified) {
        await supabase
          .from('medical_reports')
          .update({ status: 'verified' })
          .eq('id', reportId);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Error updating report result:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Confirms user verification for an individual extracted biomarker result.
   */
  async verifyReportResult(
    userId: string,
    reportId: string,
    resultId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateReportResult(userId, reportId, resultId, {}, true);
  }
}

export const reportService = new ReportService();
