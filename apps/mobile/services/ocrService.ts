/**
 * BioPulse Mobile — OCR Service
 *
 * Connects mobile document upload to Django PaddleOCR backend:
 * Mobile upload -> Django /api/v1/health/ocr/ -> OCR response -> Verification
 *
 * Safety Invariant:
 * OCR output is raw, speculative, and unverified. It must never be treated
 * as trusted clinical data without explicit user review and confirmation.
 */

import { BACKEND_API_URL, ApiResponse } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type LabCategory =
  | 'Hormones'
  | 'Metabolic'
  | 'Nutritional'
  | 'CBC'
  | 'Liver & Renal'
  | 'Thyroid'
  | 'Lipids'
  | 'Other';

export interface ExtractedLabResult {
  test_name: string;
  category: LabCategory | string;
  value: string;
  result_value?: string;
  result_numeric?: number | null;
  unit: string;
  reference_range: string;
  reference_low?: number | null;
  reference_high?: number | null;
  confidence: number;
  requires_review: boolean;
  status: 'within_range' | 'outside_range' | 'needs_review' | 'insufficient_info' | string;
  source_text?: string;
  explanation?: string;
  page_number?: number;
}

export interface OcrDocumentMeta {
  filename: string;
  total_pages: number;
  has_selectable_text: boolean;
  avg_confidence: number;
  engine: string;
}

export interface OcrExtractionResponse {
  success: boolean;
  document: OcrDocumentMeta;
  results: ExtractedLabResult[];
  raw_text_snippet: string;
  requires_review: boolean;
  disclaimer: string;
}

// ============================================================================
// HELPER: Categorize Test Names for Review Accordion
// ============================================================================

export function categorizeTestName(name: string): LabCategory {
  const n = name.toLowerCase();
  if (
    n.includes('lh') ||
    n.includes('fsh') ||
    n.includes('amh') ||
    n.includes('prolactin') ||
    n.includes('progesterone') ||
    n.includes('testosterone') ||
    n.includes('estradiol') ||
    n.includes('shbg') ||
    n.includes('dhea') ||
    n.includes('hormone')
  ) {
    return 'Hormones';
  }

  if (
    n.includes('glucose') ||
    n.includes('fbs') ||
    n.includes('rbs') ||
    n.includes('hba1c') ||
    n.includes('insulin') ||
    n.includes('cholesterol') ||
    n.includes('triglyceride') ||
    n.includes('lipid') ||
    n.includes('hdl') ||
    n.includes('ldl')
  ) {
    return 'Metabolic';
  }

  if (
    n.includes('vitamin d') ||
    n.includes('vit d') ||
    n.includes('ferritin') ||
    n.includes('iron') ||
    n.includes('b12') ||
    n.includes('folate')
  ) {
    return 'Nutritional';
  }

  if (
    n.includes('hemoglobin') ||
    n.includes('hb') ||
    n.includes('rbc') ||
    n.includes('wbc') ||
    n.includes('platelet') ||
    n.includes('hematocrit') ||
    n.includes('cbc')
  ) {
    return 'CBC';
  }

  if (
    n.includes('alt') ||
    n.includes('ast') ||
    n.includes('alp') ||
    n.includes('creatinine') ||
    n.includes('urea') ||
    n.includes('bilirubin')
  ) {
    return 'Liver & Renal';
  }

  if (n.includes('tsh') || n.includes('ft3') || n.includes('ft4') || n.includes('thyroid')) {
    return 'Thyroid';
  }

  return 'Other';
}

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ============================================================================
// OCR SERVICE CLASS
// ============================================================================

export class OcrService {
  /**
   * Upload a photo or PDF to Django OCR endpoint (/api/v1/health/ocr/)
   */
  static async uploadDocument(
    token: string,
    fileUri: string,
    fileName = 'lab_report.jpg',
    mimeType = 'image/jpeg',
    fileSizeBytes?: number
  ): Promise<ApiResponse<OcrExtractionResponse>> {
    if (!token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    if (!fileUri) {
      return { data: null, error: 'No document file was provided.', status: 400 };
    }

    // Validate extension
    const ext = fileName.includes('.')
      ? '.' + fileName.split('.').pop()?.toLowerCase()
      : '.jpg';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        data: null,
        error: `Unsupported file format '${ext}'. Supported formats: PDF, PNG, JPG, JPEG, WebP.`,
        status: 400,
      };
    }

    // Validate size limit if known
    if (fileSizeBytes && fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      return {
        data: null,
        error: 'File size exceeds the 10 MB maximum limit.',
        status: 400,
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      const url = `${BACKEND_API_URL}/v1/health/ocr/`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!res.ok) {
        let errText = `HTTP Error ${res.status}`;
        try {
          const errJson = await res.json();
          errText = errJson.error || errJson.detail || errText;
        } catch {
          // ignore json parse error
        }
        return { data: null, error: errText, status: res.status };
      }

      const json = await res.json();
      if (!json.success || !Array.isArray(json.results)) {
        return {
          data: null,
          error: 'The OCR engine was unable to extract structured test data from this document.',
          status: 422,
        };
      }

      // Normalize results with categories and safe defaults
      const normalizedResults: ExtractedLabResult[] = json.results.map((r: any) => {
        const testName = r.test_name || 'Laboratory Test';
        const valStr = r.result_value !== undefined ? String(r.result_value) : String(r.value || '');
        const numVal = r.result_numeric !== undefined ? r.result_numeric : parseFloat(valStr) || null;

        return {
          test_name: testName,
          category: r.category || categorizeTestName(testName),
          value: valStr,
          result_value: valStr,
          result_numeric: numVal,
          unit: r.unit || '',
          reference_range: r.reference_range || '',
          reference_low: r.reference_low ?? null,
          reference_high: r.reference_high ?? null,
          confidence: typeof r.confidence === 'number' ? r.confidence : 0.95,
          requires_review: Boolean(r.requires_review ?? true),
          status: r.status || 'within_range',
          source_text: r.source_text || '',
          explanation: r.explanation || '',
          page_number: r.page_number || 1,
        };
      });

      const responsePayload: OcrExtractionResponse = {
        success: true,
        document: {
          filename: json.document?.filename || fileName,
          total_pages: json.document?.total_pages || 1,
          has_selectable_text: Boolean(json.document?.has_selectable_text),
          avg_confidence: json.document?.avg_confidence ?? 0.95,
          engine: json.document?.engine || 'PaddleOCR PP-OCRv4 (ONNX)',
        },
        results: normalizedResults,
        raw_text_snippet: json.raw_text_snippet || '',
        requires_review: Boolean(json.requires_review ?? true),
        disclaimer:
          json.disclaimer ||
          'Extracted values are preliminary OCR observations. Human review and physician consultation are required.',
      };

      return { data: responsePayload, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to connect to OCR service.',
        status: 0,
      };
    }
  }
}

export const ocrService = OcrService;
