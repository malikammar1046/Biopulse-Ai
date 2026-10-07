/**
 * BioPulse Mobile — OCR Service
 *
 * Connects mobile document upload to Django PaddleOCR backend:
 * Mobile upload -> Django /api/v1/health/ocr/ -> OCR response -> Verification
 */

import { BACKEND_API_URL, ApiResponse } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedLabResult {
  test_name: string;
  category: 'Hormones' | 'Metabolic' | 'Lipids' | 'Other' | string;
  value: string;
  unit: string;
  reference_range: string;
  confidence: number;
  requires_review: boolean;
  status: 'Normal' | 'High' | 'Low' | string;
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
    mimeType = 'image/jpeg'
  ): Promise<ApiResponse<OcrExtractionResponse>> {
    if (!token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
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
      return { data: json as OcrExtractionResponse, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to connect to OCR service.',
        status: 0,
      };
    }
  }
}
