/**
 * ==============================================================================
 * OvaSense Medical Reports & Scanner TypeScript Definitions
 * ==============================================================================
 */

export type ReportType =
  | 'blood_test'
  | 'hormone_test'
  | 'ultrasound'
  | 'thyroid_test'
  | 'glucose_sugar'
  | 'lipid_cholesterol'
  | 'vitamin_test'
  | 'other';

export type ReportResultStatus =
  | 'within_range'
  | 'outside_range'
  | 'needs_review'
  | 'insufficient_info';

export type ReportStatus = 'processing' | 'needs_verification' | 'verified';

export type VerificationState = 'extracted' | 'user_confirmed';

export interface ReportResult {
  id: string;
  reportId: string;
  testName: string;
  resultValue: string;
  resultNumeric?: number | null;
  unit: string;
  referenceRange: string;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  status: ReportResultStatus;
  ocrConfidence: number; // 0.00 to 1.00
  userVerified: boolean;
  verificationState?: VerificationState;
  explanation?: string;
  timelineConnection?: string;
  timelineCorrelation?: string;
  createdAt?: string;
}

export interface ReportResultInput {
  testName: string;
  resultValue: string;
  resultNumeric?: number | null;
  unit: string;
  referenceRange: string;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  status: ReportResultStatus;
  ocrConfidence?: number;
  userVerified?: boolean;
  verificationState?: VerificationState;
  explanation?: string;
  timelineConnection?: string;
  timelineCorrelation?: string;
  sourceText?: string;
  extractionMethod?: string;
  pageNumber?: number;
  requiresReview?: boolean;
}

export interface MedicalReport {
  id: string;
  userId: string;
  title: string;
  reportType: ReportType;
  reportDate: string; // ISO YYYY-MM-DD
  filePath?: string | null;
  fileName: string;
  fileSize?: number;
  mimeType: string;
  status: ReportStatus;
  results: ReportResult[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicalReportInput {
  title: string;
  reportType: ReportType;
  reportDate: string;
  filePath?: string | null;
  fileName: string;
  fileSize?: number;
  mimeType: string;
  status?: ReportStatus;
  results: ReportResultInput[];
}

export interface ReportCategoryMeta {
  id: ReportType;
  label: string;
  iconName: string;
  color: string;
  badgeClass: string;
}

export interface BiomarkerTrendPoint {
  date: string;
  reportId: string;
  reportTitle: string;
  resultValue: string;
  numericValue: number;
  unit: string;
  status: ReportResultStatus;
  referenceRange: string;
}

export interface ReportSummaryStats {
  totalReportsCount: number;
  needsReviewCount: number;
  latestReportDate: string | null;
  recognizedTestsCount: number;
  categoryCounts: Record<ReportType, number>;
}

export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  {
    id: 'hormone_test',
    label: 'Hormone Test',
    iconName: 'Sparkles',
    color: '#8E3EAF',
    badgeClass: 'bg-[#EDE4F7] text-[#6E2D8B] border-[#D8B4FE]/50',
  },
  {
    id: 'blood_test',
    label: 'Blood Test',
    iconName: 'Droplet',
    color: '#FB7185',
    badgeClass: 'bg-[#FDF2F8] text-[#FB7185] border-[#FDA4AF]/40',
  },
  {
    id: 'ultrasound',
    label: 'Ultrasound',
    iconName: 'Scan',
    color: '#A21CAF',
    badgeClass: 'bg-[#FAF5FF] text-[#A21CAF] border-[#D8B4FE]/40',
  },
  {
    id: 'thyroid_test',
    label: 'Thyroid Test',
    iconName: 'Activity',
    color: '#047857',
    badgeClass: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]/60',
  },
  {
    id: 'glucose_sugar',
    label: 'Glucose / Sugar Test',
    iconName: 'Zap',
    color: '#D97706',
    badgeClass: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]/60',
  },
  {
    id: 'lipid_cholesterol',
    label: 'Lipid / Cholesterol Test',
    iconName: 'Heart',
    color: '#E11D48',
    badgeClass: 'bg-[#FFF1F2] text-[#E11D48] border-[#FDA4AF]/60',
  },
  {
    id: 'vitamin_test',
    label: 'Vitamin Test',
    iconName: 'SunMedium',
    color: '#0284C7',
    badgeClass: 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]/60',
  },
  {
    id: 'other',
    label: 'Other Report',
    iconName: 'FileText',
    color: '#584B68',
    badgeClass: 'bg-[#F8F5FA] text-[#584B68] border-[#E7DFEF]',
  },
];
