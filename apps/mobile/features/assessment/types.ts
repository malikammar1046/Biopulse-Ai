export interface HealthAssessmentQuestion {
  id: string;
  category: string;
  prompt: string;
  options?: string[];
}

export interface HealthAssessmentResult {
  id: string;
  completedAt: string;
  summaryHighlights: string[];
  disclaimer: string;
}
