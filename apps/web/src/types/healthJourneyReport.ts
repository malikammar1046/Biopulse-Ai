// Types for Clinical Health Journey PDF Export System

export type HealthJourneyReportDateRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

export interface HealthJourneyReportSections {
  overview: boolean;
  cycle: boolean;
  symptoms: boolean;
  reports: boolean;
  medications: boolean;
  nutrition: boolean;
  fitness: boolean;
  patterns: boolean;
  trajectory: boolean;
  appointments: boolean;
  doctorQuestions: boolean;
  patientNotes: boolean;
}

export interface HealthJourneyReportOptions {
  dateRange: HealthJourneyReportDateRange;
  sections: HealthJourneyReportSections;
  patientCustomNote?: string;
  patientQuestionsNotes?: string;
  includeDisclaimer: boolean;
}

export type HealthJourneyExportStage =
  | 'idle'
  | 'collecting'
  | 'analyzing'
  | 'building'
  | 'finalizing'
  | 'ready'
  | 'error';

export interface HealthJourneyExportProgressState {
  stage: HealthJourneyExportStage;
  message: string;
  progressPercent: number;
  error?: string;
  pdfBlob?: Blob;
  pdfBlobUrl?: string;
  pdfFileName?: string;
}

export interface SectionDataAvailability {
  cycle: { hasData: boolean; count: number; description: string };
  symptoms: { hasData: boolean; count: number; description: string };
  reports: { hasData: boolean; count: number; description: string };
  medications: { hasData: boolean; count: number; description: string };
  nutrition: { hasData: boolean; count: number; description: string };
  fitness: { hasData: boolean; count: number; description: string };
  patterns: { hasData: boolean; count: number; description: string };
  appointments: { hasData: boolean; count: number; description: string };
  doctorQuestions: { hasData: boolean; count: number; description: string };
}
