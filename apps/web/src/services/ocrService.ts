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
}

/**
 * Standard Lab Templates for simulated intelligent document parsing
 * (used during development / client parsing when backend OCR is not active).
 */
const TEMPLATE_EXTRACTIONS: Record<ReportType, ReportResultInput[]> = {
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
      userVerified: true,
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
      userVerified: true,
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
      userVerified: true,
      explanation: 'Stimulates egg follicles in your ovaries to mature.',
      timelineConnection: 'Evaluated together with LH on Day 2–3 of your cycle.',
    },
    {
      testName: 'DHEA-S',
      resultValue: '310.0',
      resultNumeric: 310.0,
      unit: 'μg/dL',
      referenceRange: '65 – 380 μg/dL',
      referenceLow: 65,
      referenceHigh: 380,
      status: 'within_range',
      ocrConfidence: 0.89,
      userVerified: true,
      explanation: 'Adrenal hormone linked to energy and natural stress response.',
      timelineConnection: 'Connects to your daily stress and vitality check-ins.',
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
      userVerified: true,
      explanation: 'Master regulatory hormone for thyroid energy output.',
      timelineConnection: 'Directly influences daily energy and cycle regularity.',
    },
    {
      testName: 'Free T4',
      resultValue: '1.28',
      resultNumeric: 1.28,
      unit: 'ng/dL',
      referenceRange: '0.82 – 1.77 ng/dL',
      referenceLow: 0.82,
      referenceHigh: 1.77,
      status: 'within_range',
      ocrConfidence: 0.95,
      userVerified: true,
      explanation: 'Active circulating thyroid hormone helping cells produce energy.',
      timelineConnection: 'Supports baseline metabolism across cycle phases.',
    },
  ],

  glucose_sugar: [
    {
      testName: 'Fasting Blood Sugar (Glucose)',
      resultValue: '92',
      resultNumeric: 92,
      unit: 'mg/dL',
      referenceRange: '70 – 99 mg/dL',
      referenceLow: 70,
      referenceHigh: 99,
      status: 'within_range',
      ocrConfidence: 0.97,
      userVerified: true,
      explanation: 'Resting bloodstream sugar after an 8–10 hour overnight fast.',
      timelineConnection: 'Connects with your food and hydration logs.',
    },
    {
      testName: 'HbA1c',
      resultValue: '5.4',
      resultNumeric: 5.4,
      unit: '%',
      referenceRange: '4.0 – 5.6 %',
      referenceLow: 4.0,
      referenceHigh: 5.6,
      status: 'within_range',
      ocrConfidence: 0.96,
      userVerified: true,
      explanation: 'Average 3-month blood sugar picture.',
      timelineConnection: 'A long-term milestone in your health timeline.',
    },
    {
      testName: 'Fasting Insulin',
      resultValue: '14.2',
      resultNumeric: 14.2,
      unit: 'μIU/mL',
      referenceRange: '2.6 – 24.9 μIU/mL',
      referenceLow: 2.6,
      referenceHigh: 24.9,
      status: 'within_range',
      ocrConfidence: 0.88,
      userVerified: true,
      explanation: 'Hormone helping glucose enter cells for energy.',
      timelineConnection: 'Connects to your daily energy levels.',
    },
  ],

  lipid_cholesterol: [
    {
      testName: 'Total Cholesterol',
      resultValue: '185',
      resultNumeric: 185,
      unit: 'mg/dL',
      referenceRange: '< 200 mg/dL',
      referenceLow: 100,
      referenceHigh: 200,
      status: 'within_range',
      ocrConfidence: 0.95,
      userVerified: true,
      explanation: 'Total circulating fats and cholesterol particles.',
      timelineConnection: 'Part of metabolic and heart wellness monitoring.',
    },
    {
      testName: 'HDL (Good Cholesterol)',
      resultValue: '58',
      resultNumeric: 58,
      unit: 'mg/dL',
      referenceRange: '> 50 mg/dL',
      referenceLow: 50,
      referenceHigh: 100,
      status: 'within_range',
      ocrConfidence: 0.94,
      userVerified: true,
      explanation: 'Protective lipid carrier helping clear excess fats from blood vessels.',
      timelineConnection: 'Supported by regular movement and heart-healthy meals.',
    },
    {
      testName: 'Triglycerides',
      resultValue: '112',
      resultNumeric: 112,
      unit: 'mg/dL',
      referenceRange: '< 150 mg/dL',
      referenceLow: 50,
      referenceHigh: 150,
      status: 'within_range',
      ocrConfidence: 0.91,
      userVerified: true,
      explanation: 'Stored fat energy in the bloodstream.',
      timelineConnection: 'Reflects how your body stores energy from meals.',
    },
  ],

  vitamin_test: [
    {
      testName: 'Vitamin D (25-Hydroxy)',
      resultValue: '34.5',
      resultNumeric: 34.5,
      unit: 'ng/mL',
      referenceRange: '30 – 100 ng/mL',
      referenceLow: 30,
      referenceHigh: 100,
      status: 'within_range',
      ocrConfidence: 0.97,
      userVerified: true,
      explanation: 'Essential nutrient and hormone precursor for immune & ovarian health.',
      timelineConnection: 'Supports balanced mood and daily vitality.',
    },
    {
      testName: 'Vitamin B12',
      resultValue: '480',
      resultNumeric: 480,
      unit: 'pg/mL',
      referenceRange: '200 – 900 pg/mL',
      referenceLow: 200,
      referenceHigh: 900,
      status: 'within_range',
      ocrConfidence: 0.93,
      userVerified: true,
      explanation: 'Supports red blood cell creation and nerve wellness.',
      timelineConnection: 'Important for steady energy.',
    },
  ],

  ultrasound: [
    {
      testName: 'Right Ovary Antral Follicles',
      resultValue: '14',
      resultNumeric: 14,
      unit: 'follicles',
      referenceRange: '5 – 12 follicles',
      referenceLow: 5,
      referenceHigh: 12,
      status: 'outside_range',
      ocrConfidence: 0.92,
      userVerified: true,
      explanation: 'Number of small developing egg sacs seen on ultrasound scan.',
      timelineConnection: 'Provides visual confirmation of ovarian activity.',
    },
    {
      testName: 'Left Ovary Antral Follicles',
      resultValue: '12',
      resultNumeric: 12,
      unit: 'follicles',
      referenceRange: '5 – 12 follicles',
      referenceLow: 5,
      referenceHigh: 12,
      status: 'within_range',
      ocrConfidence: 0.91,
      userVerified: true,
      explanation: 'Number of small developing egg sacs seen on left ovary.',
      timelineConnection: 'Tracks alongside right ovary follicle counts.',
    },
    {
      testName: 'Endometrial Thickness',
      resultValue: '7.8',
      resultNumeric: 7.8,
      unit: 'mm',
      referenceRange: '4 – 14 mm',
      referenceLow: 4,
      referenceHigh: 14,
      status: 'within_range',
      ocrConfidence: 0.95,
      userVerified: true,
      explanation: 'Thickness of the natural uterine lining.',
      timelineConnection: 'Correlates with your period duration and flow intensity.',
    },
  ],

  blood_test: [
    {
      testName: 'Hemoglobin',
      resultValue: '13.2',
      resultNumeric: 13.2,
      unit: 'g/dL',
      referenceRange: '12.0 – 16.0 g/dL',
      referenceLow: 12.0,
      referenceHigh: 16.0,
      status: 'within_range',
      ocrConfidence: 0.98,
      userVerified: true,
      explanation: 'Oxygen-carrying protein in red blood cells.',
      timelineConnection: 'Crucial for understanding fatigue and period flow.',
    },
    {
      testName: 'Platelet Count',
      resultValue: '265',
      resultNumeric: 265,
      unit: 'x10^3/μL',
      referenceRange: '150 – 450 x10^3/μL',
      referenceLow: 150,
      referenceHigh: 450,
      status: 'within_range',
      ocrConfidence: 0.96,
      userVerified: true,
      explanation: 'Blood cells that assist normal clotting.',
      timelineConnection: 'Standard blood health marker.',
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
      userVerified: true,
      explanation: 'General recorded health observation from your uploaded report.',
      timelineConnection: 'Stored in your health records.',
    },
  ],
};

class OcrService {
  /**
   * Reads an uploaded report file and generates structured extracted results.
   * Simulates realistic document OCR processing with confidence scoring.
   */
  async extractReportData(
    file: File,
    preferredType: ReportType = 'hormone_test'
  ): Promise<ExtractedReportData> {
    // Artificial 1.2s delay to simulate OCR text extraction
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const todayStr = new Date().toISOString().split('T')[0];
    const rawFileName = file.name.replace(/\.[^/.]+$/, '');
    const cleanTitle =
      rawFileName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Medical Lab Report';

    // Select matching template base
    const baseResults = TEMPLATE_EXTRACTIONS[preferredType] || TEMPLATE_EXTRACTIONS.blood_test;

    // Enhance every extracted item with knowledge base and range evaluation
    const extractedResults: ReportResultInput[] = baseResults.map((item) => {
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
        explanation: kb?.whatIsIt || item.explanation,
        timelineConnection: kb?.timelineConnection || item.timelineConnection,
      };
    });

    const confidenceSum = extractedResults.reduce((acc, r) => acc + (r.ocrConfidence || 0.95), 0);
    const ocrConfidenceAvg = extractedResults.length > 0 ? confidenceSum / extractedResults.length : 0.95;

    return {
      title: cleanTitle,
      reportType: preferredType,
      reportDate: todayStr,
      extractedResults,
      rawTextSnippet: `Scanned ${file.name} (${Math.round(file.size / 1024)} KB) - Extracted ${extractedResults.length} test results.`,
      ocrConfidenceAvg,
    };
  }
}

export const ocrService = new OcrService();
