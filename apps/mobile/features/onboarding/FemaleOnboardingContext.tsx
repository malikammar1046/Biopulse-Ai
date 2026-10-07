import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { ProgressiveAssessment } from '../../services/assessmentService';
import { useAuth } from '../authentication';
import {
  saveOnboardingStepData,
  completeOnboardingInDb,
  fetchOnboardingDraft,
} from '../../services/userService';

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
  saveAndCompleteOnboarding: (finalSummary?: Record<string, any>) => Promise<boolean>;
}

const FemaleOnboardingContext = createContext<FemaleOnboardingContextValue | undefined>(undefined);

export const FemaleOnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

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

  // Hydrate draft state from DB / persistent storage on mount or account switch
  useEffect(() => {
    let isCurrent = true;
    if (!user?.id) return;

    fetchOnboardingDraft(user.id, user.accessToken)
      .then((draft) => {
        if (!isCurrent || !draft) return;

        // Restore basic info
        if (draft.dateOfBirth || draft.heightCm || draft.weightKg) {
          setBasicInfo((prev) => ({
            ...prev,
            dateOfBirth: draft.dateOfBirth || prev.dateOfBirth,
            age: draft.age || prev.age,
            heightCm: draft.heightCm || prev.heightCm,
            weightKg: draft.weightKg || prev.weightKg,
            bmi: draft.bmi || prev.bmi,
            maritalStatus: draft.maritalStatus === 'Married' ? 'married' : prev.maritalStatus,
            pregnancyStatus: draft.pregnancyStatus === 'Currently Pregnant' ? 'currently_pregnant' : prev.pregnancyStatus,
          }));
        }

        // Restore cycle health
        if (draft.cycleLength || draft.lastPeriodDate || draft.periodDuration) {
          setCycleHealth((prev) => ({
            ...prev,
            cycleLength: Number(draft.cycleLength) || prev.cycleLength,
            lastPeriodDate: draft.lastPeriodDate || prev.lastPeriodDate,
            periodDuration: Number(draft.periodDuration) || prev.periodDuration,
            regularity: draft.periodRegularity === 'mostly_regular' ? 'regular' : (draft.periodRegularity || prev.regularity),
          }));
        }

        // Restore symptoms
        if (Array.isArray(draft.commonSymptoms) && draft.commonSymptoms.length > 0) {
          setSymptoms(draft.commonSymptoms);
        }

        // Restore lifestyle
        if (draft.sleepHours || draft.fastFoodIntake) {
          setLifestyle((prev) => ({
            ...prev,
            sleepHours: Number(draft.sleepHours) || prev.sleepHours,
            fastFoodIntake: draft.fastFoodIntake || prev.fastFoodIntake,
          }));
        }
      })
      .catch((err) => {
        console.warn('[BioPulse FemaleOnboarding] Draft restoration error:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.id, user?.accessToken]);

  const updateBasicInfo = useCallback((partial: Partial<FemaleBasicInfoState>) => {
    setBasicInfo((prev) => {
      const next = { ...prev, ...partial };
      if (user?.id) {
        saveOnboardingStepData(user.id, user.accessToken || '', {
          dateOfBirth: next.dateOfBirth,
          heightCm: next.heightCm,
          weightKg: next.weightKg,
          waistCm: (partial as any).waistCm,
          maritalStatus: next.maritalStatus === 'married' ? 'Married' : 'Single',
          pregnancyStatus: next.pregnancyStatus === 'currently_pregnant' ? 'Currently Pregnant' : 'Not Pregnant',
        }).catch((e) => console.warn('[FemaleOnboarding] save error:', e));
      }
      return next;
    });
  }, [user?.id, user?.accessToken]);

  const updateCycleHealth = useCallback((partial: Partial<FemaleCycleHealthState>) => {
    setCycleHealth((prev) => {
      const next = { ...prev, ...partial };
      if (user?.id) {
        saveOnboardingStepData(user.id, user.accessToken || '', {
          cycleLength: String(next.cycleLength),
          periodDuration: next.periodDuration,
          lastPeriodDate: next.lastPeriodDate,
          periodRegularity: next.regularity,
        }).catch((e) => console.warn('[FemaleOnboarding] save error:', e));
      }
      return next;
    });
  }, [user?.id, user?.accessToken]);

  const updateSymptoms = useCallback((newSymptoms: string[]) => {
    setSymptoms(newSymptoms);
    if (user?.id) {
      saveOnboardingStepData(user.id, user.accessToken || '', {
        commonSymptoms: newSymptoms,
      }).catch((e) => console.warn('[FemaleOnboarding] save error:', e));
    }
  }, [user?.id, user?.accessToken]);

  const updateLifestyle = useCallback((partial: Partial<FemaleLifestyleState>) => {
    setLifestyle((prev) => {
      const next = { ...prev, ...partial };
      if (user?.id) {
        saveOnboardingStepData(user.id, user.accessToken || '', {
          sleepHours: next.sleepHours,
          fastFoodIntake: next.fastFoodIntake,
          regularExercise: next.exerciseFrequency !== 'none',
        }).catch((e) => console.warn('[FemaleOnboarding] save error:', e));
      }
      return next;
    });
  }, [user?.id, user?.accessToken]);

  const saveAndCompleteOnboarding = useCallback(
    async (finalSummary?: Record<string, any>): Promise<boolean> => {
      if (!user?.id) return true;
      return completeOnboardingInDb(user.id, user.accessToken || '', {
        pathway: 'female_pcos',
        gender: 'female',
        ...finalSummary,
      });
    },
    [user?.id, user?.accessToken]
  );

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
        saveAndCompleteOnboarding,
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

