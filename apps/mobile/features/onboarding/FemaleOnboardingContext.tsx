import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ProgressiveAssessment } from '../../services/assessmentService';

export type CycleRegularity = 'regular' | 'irregular' | 'not_sure';
export type MissedPeriodsRange = '0' | '1-2' | '3+';
export type FlowIntensity = 'light' | 'moderate' | 'heavy';

export interface FemaleCycleHealthState {
  regularity: CycleRegularity;
  cycleLength: number; // default: 28 days
  lastPeriodDate: string; // ISO format: 'YYYY-MM-DD'
  periodDuration: number; // default: 5 days
  missedPeriodsYear: MissedPeriodsRange;
  flowPattern: FlowIntensity;
  additionalNotes: string; // max 200 chars
}

export interface FemaleBasicInfoState {
  dateOfBirth: string;
  age: number;
  heightCm: number;
  weightKg: number;
  bmi: number;
  maritalStatus: 'single' | 'married' | 'prefer_not_to_say';
  marriageYears?: number;
  pregnancyStatus: 'not_pregnant' | 'currently_pregnant' | 'trying_to_conceive' | 'prefer_not_to_say';
}

export interface FemaleLifestyleState {
  sleepHours: number;
  fastFoodIntake: 'never' | 'occasionally' | 'frequently';
  exerciseFrequency: 'none' | '1-2_days' | '3+_days';
  stressLevel: 'low' | 'moderate' | 'high';
}

export interface FemaleOnboardingState {
  basicInfo: FemaleBasicInfoState;
  cycleHealth: FemaleCycleHealthState;
  symptoms: string[];
  lifestyle: FemaleLifestyleState;
  activeAssessment: ProgressiveAssessment | null;
}

const DEFAULT_CYCLE_HEALTH: FemaleCycleHealthState = {
  regularity: 'regular',
  cycleLength: 28,
  lastPeriodDate: '2026-09-12',
  periodDuration: 5,
  missedPeriodsYear: '0',
  flowPattern: 'moderate',
  additionalNotes: '',
};

const DEFAULT_BASIC_INFO: FemaleBasicInfoState = {
  dateOfBirth: '2002-03-15',
  age: 24,
  heightCm: 162,
  weightKg: 58,
  bmi: 22.1,
  maritalStatus: 'single',
  pregnancyStatus: 'not_pregnant',
};

const DEFAULT_LIFESTYLE: FemaleLifestyleState = {
  sleepHours: 7,
  fastFoodIntake: 'occasionally',
  exerciseFrequency: '1-2_days',
  stressLevel: 'moderate',
};

interface FemaleOnboardingContextValue {
  basicInfo: FemaleBasicInfoState;
  updateBasicInfo: (partial: Partial<FemaleBasicInfoState>) => void;
  cycleHealth: FemaleCycleHealthState;
  updateCycleHealth: (partial: Partial<FemaleCycleHealthState>) => void;
  symptoms: string[];
  updateSymptoms: (symptoms: string[]) => void;
  lifestyle: FemaleLifestyleState;
  updateLifestyle: (partial: Partial<FemaleLifestyleState>) => void;
  activeAssessment: ProgressiveAssessment | null;
  setActiveAssessment: (assessment: ProgressiveAssessment | null) => void;
  isLoadingAssessment: boolean;
  setIsLoadingAssessment: (loading: boolean) => void;
  assessmentError: string | null;
  setAssessmentError: (error: string | null) => void;
  resetOnboarding: () => void;
  lastActiveScreeningRoute: string;
  setLastActiveScreeningRoute: (route: string) => void;
}

const FemaleOnboardingContext = createContext<FemaleOnboardingContextValue | undefined>(undefined);

export const FemaleOnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [basicInfo, setBasicInfo] = useState<FemaleBasicInfoState>(DEFAULT_BASIC_INFO);
  const [cycleHealth, setCycleHealth] = useState<FemaleCycleHealthState>(DEFAULT_CYCLE_HEALTH);
  const [symptoms, setSymptoms] = useState<string[]>([
    'hirsutism',
    'weight_gain',
    'pimples_acne',
    'irregular_periods',
  ]);
  const [lifestyle, setLifestyle] = useState<FemaleLifestyleState>(DEFAULT_LIFESTYLE);
  const [activeAssessment, setActiveAssessment] = useState<ProgressiveAssessment | null>(null);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState<boolean>(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [lastActiveScreeningRoute, setLastActiveScreeningRoute] = useState<string>('/female-symptoms');

  const updateBasicInfo = useCallback((partial: Partial<FemaleBasicInfoState>) => {
    setBasicInfo((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateCycleHealth = useCallback((partial: Partial<FemaleCycleHealthState>) => {
    setCycleHealth((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateSymptoms = useCallback((newSymptoms: string[]) => {
    setSymptoms(newSymptoms);
  }, []);

  const updateLifestyle = useCallback((partial: Partial<FemaleLifestyleState>) => {
    setLifestyle((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setBasicInfo(DEFAULT_BASIC_INFO);
    setCycleHealth(DEFAULT_CYCLE_HEALTH);
    setSymptoms(['hirsutism', 'weight_gain', 'pimples_acne', 'irregular_periods']);
    setLifestyle(DEFAULT_LIFESTYLE);
    setActiveAssessment(null);
    setIsLoadingAssessment(false);
    setAssessmentError(null);
    setLastActiveScreeningRoute('/female-basic-info');
  }, []);

  return (
    <FemaleOnboardingContext.Provider
      value={{
        basicInfo,
        updateBasicInfo,
        cycleHealth,
        updateCycleHealth,
        symptoms,
        updateSymptoms,
        lifestyle,
        updateLifestyle,
        activeAssessment,
        setActiveAssessment,
        isLoadingAssessment,
        setIsLoadingAssessment,
        assessmentError,
        setAssessmentError,
        resetOnboarding,
        lastActiveScreeningRoute,
        setLastActiveScreeningRoute,
      }}
    >
      {children}
    </FemaleOnboardingContext.Provider>
  );
};

export function useFemaleOnboarding(): FemaleOnboardingContextValue {
  const context = useContext(FemaleOnboardingContext);
  if (!context) {
    throw new Error('useFemaleOnboarding must be used within a FemaleOnboardingProvider');
  }
  return context;
}
