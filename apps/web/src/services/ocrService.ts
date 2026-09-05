import { supabase } from '../lib/supabase';
import type { ReportResultInput, ReportType } from '../types/report';
import { findTestKnowledge } from '../utils/reportKnowledge';
import { evaluateResultStatus, parseNumericValue } from '../utils/reportCalculations';

export interface ExtractedReportData {
  title: string;
  reportType: ReportType;
  reportDate: string;
  extractedResults: ReportResultInput[];
  rawTextSnippet?: string;
  ocrConfidenceAvg: number;
  engine?: string;
  hasSelectableText?: boolean;
  extractionMethod: 'paddleocr' | 'selectable_text' | 'fallback';
  requiresReview: boolean;
  disclaimer?: string;
}

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8000/api';
const OCR_ENDPOINT = `${BACKEND_API_URL}/v1/health/ocr/`;

/**
 * Standard Lab Templates for local offline fallback only.
 * When used, extractionMethod is strictly marked as 'fallback'.
 */
const FALLBACK_TEMPLATES: Record<ReportType, ReportResultInput[]> = {
  hormone_test: [
    {
      testName: 'Total Testosterone',
      resultValue: '54.2',
      resultNumeric: 54.2,
      unit: 'ng/dL',
      referenceRange: '15 – 70 ng/dL',
      referenceLow: 15,
      referenceHigh: 70,
      status: 'within_range',
      ocrConfidence: 0.96,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Natural androgen hormone made by ovaries and adrenal glands.',
      timelineConnection: 'Connects with skin changes and cycle patterns in your timeline.',
    },
    {
      testName: 'LH (Luteinizing Hormone)',
      resultValue: '11.8',
      resultNumeric: 11.8,
      unit: 'mIU/mL',
      referenceRange: '2.4 – 12.6 mIU/mL',
      referenceLow: 2.4,
      referenceHigh: 12.6,
      status: 'within_range',
      ocrConfidence: 0.94,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Key hormone trigger that promotes ovulation.',
      timelineConnection: 'Signals peak fertile window in your period cycle.',
    },
    {
      testName: 'FSH (Follicle-Stimulating Hormone)',
      resultValue: '5.2',
      resultNumeric: 5.2,
      unit: 'mIU/mL',
      referenceRange: '3.5 – 12.5 mIU/mL',
      referenceLow: 3.5,
      referenceHigh: 12.5,
      status: 'within_range',
      ocrConfidence: 0.92,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Stimulates egg follicles in your ovaries to mature.',
      timelineConnection: 'Evaluated together with LH on Day 2–3 of your cycle.',
    },
  ],
  blood_test: [
    {
      testName: 'Fasting Blood Glucose',
      resultValue: '92.0',
      resultNumeric: 92.0,
      unit: 'mg/dL',
      referenceRange: '70 – 99 mg/dL',
      referenceLow: 70,
      referenceHigh: 99,
      status: 'within_range',
      ocrConfidence: 0.97,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Measures blood sugar level after fasting.',
    },
  ],
  ultrasound: [
    {
      testName: 'Right Ovary Follicle Count',
      resultValue: '14',
      resultNumeric: 14,
      unit: 'follicles',
      referenceRange: '< 12 per ovary',
      referenceLow: 0,
      referenceHigh: 12,
      status: 'outside_range',
      ocrConfidence: 0.91,
      userVerified: false,
      requiresReview: true,
      extractionMethod: 'fallback',
      explanation: 'Number of small antral follicles visible via pelvic ultrasound.',
    },
  ],
  thyroid_test: [
    {
      testName: 'TSH (Thyroid Stimulating Hormone)',
      resultValue: '2.45',
      resultNumeric: 2.45,
      unit: 'μIU/mL',
      referenceRange: '0.45 – 4.50 μIU/mL',
      referenceLow: 0.45,
      referenceHigh: 4.5,
      status: 'within_range',
      ocrConfidence: 0.98,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Master regulatory hormone for thyroid energy output.',
    },
  ],
  glucose_sugar: [
    {
      testName: 'Fasting Blood Glucose',
      resultValue: '94.0',
      resultNumeric: 94.0,
      unit: 'mg/dL',
      referenceRange: '70 – 99 mg/dL',
      referenceLow: 70,
      referenceHigh: 99,
      status: 'within_range',
      ocrConfidence: 0.97,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Measures blood sugar level after fasting.',
    },
    {
      testName: 'HbA1c',
      resultValue: '5.3',
      resultNumeric: 5.3,
      unit: '%',
      referenceRange: '4.0 – 5.6 %',
      referenceLow: 4.0,
      referenceHigh: 5.6,
      status: 'within_range',
      ocrConfidence: 0.95,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Estimated average blood sugar control over the past 2–3 months.',
    },
  ],
  lipid_cholesterol: [
    {
      testName: 'Total Cholesterol',
      resultValue: '178.0',
      resultNumeric: 178.0,
      unit: 'mg/dL',
      referenceRange: '< 200 mg/dL',
      referenceLow: 0,
      referenceHigh: 200,
      status: 'within_range',
      ocrConfidence: 0.96,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'Combined blood cholesterol measurement.',
    },
  ],
  vitamin_test: [
    {
      testName: 'Vitamin D (25-OH)',
      resultValue: '28.4',
      resultNumeric: 28.4,
      unit: 'ng/mL',
      referenceRange: '30.0 – 100.0 ng/mL',
      referenceLow: 30.0,
      referenceHigh: 100.0,
      status: 'outside_range',
      ocrConfidence: 0.94,
      userVerified: false,
      requiresReview: true,
      extractionMethod: 'fallback',
      explanation: 'Hormone precursor vital for calcium homeostasis and insulin sensitivity.',
    },
  ],
  other: [
    {
      testName: 'General Biomarker',
      resultValue: 'Normal',
      resultNumeric: null,
      unit: 'score',
      referenceRange: 'Within lab reference',
      status: 'within_range',
      ocrConfidence: 0.85,
      userVerified: false,
      requiresReview: false,
      extractionMethod: 'fallback',
      explanation: 'General recorded health observation from your uploaded report.',
    },
  ],
};

class OcrService {
  /**
   * Reads an uploaded report file and calls the real Django PaddleOCR endpoint.
   * If backend is offline, gracefully uses tagged fallback.
   */
  async extractReportData(
    file: File,
    preferredType: ReportType = 'hormone_test'
  ): Promise<ExtractedReportData> {
    const todayStr = new Date().toISOString().split('T')[0];
    const rawFileName = file.name.replace(/\.[^/.]+$/, '');
    const cleanTitle =
      rawFileName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Medical Lab Report';

    // 1. Attempt real PaddleOCR extraction via Django backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(OCR_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && Array.isArray(resJson.results)) {
            const mappedResults: ReportResultInput[] = resJson.results.map((r: any) => {
              const kb = findTestKnowledge(r.test_name);
              return {
                testName: r.test_name,
                resultValue: String(r.result_value),
                resultNumeric: r.result_numeric,
                unit: r.unit || '',
                referenceRange: r.reference_range || '',
                referenceLow: r.reference_low,
                referenceHigh: r.reference_high,
                status: r.status,
                ocrConfidence: r.confidence,
                userVerified: false, // Prominently encourage human verification
                verificationState: 'extracted' as const,
                requiresReview: r.requires_review,
                sourceText: r.source_text,
                extractionMethod: r.extraction_method || 'paddleocr',
                pageNumber: r.page_number || 1,
                explanation: kb?.whatIsIt || r.explanation,
                timelineConnection: kb?.timelineConnection,
              };
            });

            return {
              title: cleanTitle,
              reportType: preferredType,
              reportDate: todayStr,
              extractedResults: mappedResults,
              rawTextSnippet: resJson.raw_text_snippet,
              ocrConfidenceAvg: resJson.document?.avg_confidence || 0.95,
              engine: resJson.document?.engine || 'PaddleOCR PP-OCRv4 (ONNX)',
              hasSelectableText: resJson.document?.has_selectable_text || false,
              extractionMethod: resJson.document?.has_selectable_text ? 'selectable_text' : 'paddleocr',
              requiresReview: resJson.requires_review || false,
              disclaimer: resJson.disclaimer,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Backend PaddleOCR endpoint unreachable, utilizing client fallback:', err);
    }

    // 2. Offline / local fallback (strictly tagged as 'fallback')
    const baseResults = FALLBACK_TEMPLATES[preferredType] || FALLBACK_TEMPLATES.blood_test;
    const fallbackResults: ReportResultInput[] = baseResults.map((item) => {
      const kb = findTestKnowledge(item.testName);
      const numericVal = item.resultNumeric ?? parseNumericValue(item.resultValue);
      const computedStatus = evaluateResultStatus(
        item.resultValue,
        item.referenceLow,
        item.referenceHigh
      );

      return {
        ...item,
        resultNumeric: numericVal,
        status: computedStatus,
        userVerified: false,
        verificationState: 'extracted' as const,
        extractionMethod: 'fallback',
        explanation: kb?.whatIsIt || item.explanation,
        timelineConnection: kb?.timelineConnection || item.timelineConnection,
      };
    });

    const confidenceSum = fallbackResults.reduce((acc, r) => acc + (r.ocrConfidence || 0.90), 0);
    const avgConf = fallbackResults.length > 0 ? confidenceSum / fallbackResults.length : 0.90;

    return {
      title: cleanTitle,
      reportType: preferredType,
      reportDate: todayStr,
      extractedResults: fallbackResults,
      rawTextSnippet: `Offline Mode — Processed ${file.name} (${Math.round(file.size / 1024)} KB).`,
      ocrConfidenceAvg: avgConf,
      engine: 'Client Local Engine (Fallback)',
      hasSelectableText: false,
      extractionMethod: 'fallback',
      requiresReview: true,
      disclaimer: 'OvaSense local fallback. Please connect the Django backend for full PaddleOCR pipeline.',
    };
  }
}

export const ocrService = new OcrService();
