export type ReportProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LabReportDocument {
  id: string;
  uploadedAt: string;
  reportType: string;
  status: ReportProcessingStatus;
  extractedFieldsCount?: number;
}
