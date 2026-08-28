export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

export interface OnboardingState {
  isCompleted: boolean;
  currentStepIndex: number;
}
