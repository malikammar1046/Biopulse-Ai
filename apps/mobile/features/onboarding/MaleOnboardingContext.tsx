import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { ProgressiveAssessment } from '../../services/assessmentService';
import { useAuth } from '../authentication';
import {
  saveOnboardingStepData,
  completeOnboardingInDb,
  fetchOnboardingDraft,
} from '../../services/userService';

export interface MaleBasicInfoState {
  age: number;
  heightCm: number;
  weightKg: number;
  bmi: number;
  waistCm: number;
}

export interface AdamQuestionnaireState {
  answers: Record<number, boolean>; // Question 1 to 10 (true = Yes, false = No)
  currentQuestion: number; // 1-indexed (1 to 10)
}

export type MaleActivityLevel = 'sedentary' | 'lightly_active' | 'active' | 'very_active';
export type MaleWeightContext = 'stable' | 'recent_gain' | 'trying_to_lose';
export type MaleMetabolicResponse = 'no' | 'yes' | 'not_sure';
export type MaleSleepRange = 'less_6' | '6_8' | 'more_8';

export interface MaleLifestyleState {
  exerciseFrequency: 'none' | '1-2_days' | '3+_days';
  fastFoodIntake: 'never' | 'occasionally' | 'frequently';
  sleepHours: number;
  stressLevel: 'low' | 'moderate' | 'high';
  notes: string;
  activityLevel: MaleActivityLevel;
  weightContext: MaleWeightContext;
  diabetes: MaleMetabolicResponse;
  highCholesterol: MaleMetabolicResponse;
  highBloodPressure: MaleMetabolicResponse;
  sleepRange: MaleSleepRange;
}

export interface MaleOnboardingState {
  basicInfo: MaleBasicInfoState;
  adam: AdamQuestionnaireState;
  lifestyle: MaleLifestyleState;
  activeAssessment: ProgressiveAssessment | null;
}

export const ADAM_QUESTIONS: { id: number; question: string; description: string }[] = [
  { id: 1, question: 'Do you have a decrease in libido (sex drive)?', description: 'A reduced interest in sexual activity can be a sign of lower testosterone levels in some men.' },
  { id: 2, question: 'Do you have a lack of energy?', description: 'Persistent fatigue or reduced stamina throughout the day' },
  { id: 3, question: 'Do you have a decrease in strength and/or endurance?', description: 'Noticeable reduction in physical performance or muscle capacity' },
  { id: 4, question: 'Have you lost height?', description: 'May indicate osteoporotic changes related to hormone decline' },
  { id: 5, question: 'Have you noticed a decreased enjoyment of life?', description: 'General diminished vitality or enthusiasm' },
  { id: 6, question: 'Are you sad and/or grumpy?', description: 'Mood fluctuations or irritable disposition' },
  { id: 7, question: 'Are your erections less strong?', description: 'Primary indicator of erectile quality and vascular/hormonal balance' },
  { id: 8, question: 'Have you noticed a deterioration in your ability to play sports?', description: 'Reduced athletic capacity or slower recovery times' },
  { id: 9, question: 'Are you falling asleep after dinner?', description: 'Post-prandial somnolence or circadian energy drops' },
  { id: 10, question: 'Has there been a recent deterioration in your work performance?', description: 'Cognitive focus or occupational stamina reduction' },
];

const DEFAULT_BASIC_INFO: MaleBasicInfoState = {
  age: 32,
  heightCm: 178,
  weightKg: 76,
  bmi: 24.0,
  waistCm: 86,
};

const DEFAULT_ADAM: AdamQuestionnaireState = {
  answers: {},
  currentQuestion: 1,
};

const DEFAULT_LIFESTYLE: MaleLifestyleState = {
  exerciseFrequency: '1-2_days',
  fastFoodIntake: 'occasionally',
  sleepHours: 7,
  stressLevel: 'moderate',
  notes: '',
  activityLevel: 'lightly_active',
  weightContext: 'stable',
  diabetes: 'no',
  highCholesterol: 'no',
  highBloodPressure: 'no',
  sleepRange: '6_8',
};

interface MaleOnboardingContextValue {
  basicInfo: MaleBasicInfoState;
  adam: AdamQuestionnaireState;
  lifestyle: MaleLifestyleState;
  activeAssessment: ProgressiveAssessment | null;
  isLoadingAssessment: boolean;
  assessmentError: string | null;
  lastActiveScreeningRoute: string | null;

  updateBasicInfo: (info: Partial<MaleBasicInfoState>) => void;
  setAdamAnswer: (questionId: number, answer: boolean) => void;
  setAdamCurrentQuestion: (q: number) => void;
  updateLifestyle: (lifestyle: Partial<MaleLifestyleState>) => void;
  setActiveAssessment: (assessment: ProgressiveAssessment | null) => void;
  setIsLoadingAssessment: (loading: boolean) => void;
  setAssessmentError: (error: string | null) => void;
  setLastActiveScreeningRoute: (route: string | null) => void;
  resetOnboarding: () => void;
  calculateAdamScore: () => { score: number; isPositive: boolean };
  saveAndCompleteOnboarding: (finalSummary?: Record<string, any>) => Promise<boolean>;
}

const MaleOnboardingContext = createContext<MaleOnboardingContextValue | undefined>(undefined);

export const MaleOnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [basicInfo, setBasicInfo] = useState<MaleBasicInfoState>(DEFAULT_BASIC_INFO);
  const [adam, setAdam] = useState<AdamQuestionnaireState>(DEFAULT_ADAM);
  const [lifestyle, setLifestyle] = useState<MaleLifestyleState>(DEFAULT_LIFESTYLE);
  const [activeAssessment, setActiveAssessment] = useState<ProgressiveAssessment | null>(null);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [lastActiveScreeningRoute, setLastActiveScreeningRoute] = useState<string | null>(null);

  // Restore draft state from DB / persistent storage on mount
  useEffect(() => {
    let isCurrent = true;
    if (!user?.id) return;

    fetchOnboardingDraft(user.id, user.accessToken)
      .then((draft) => {
        if (!isCurrent || !draft) return;

        if (draft.heightCm || draft.weightKg || draft.age || draft.waistCm) {
          setBasicInfo((prev) => ({
            ...prev,
            age: draft.age || prev.age,
            heightCm: draft.heightCm || prev.heightCm,
            weightKg: draft.weightKg || prev.weightKg,
            waistCm: draft.waistCm || prev.waistCm,
            bmi: draft.bmi || prev.bmi,
          }));
        }

        if (draft.adam_answers) {
          try {
            const raw = typeof draft.adam_answers === 'string' ? JSON.parse(draft.adam_answers) : draft.adam_answers;
            const converted: Record<number, boolean> = {};
            Object.entries(raw).forEach(([k, v]) => {
              const num = parseInt(k.replace('q', ''), 10);
              if (!isNaN(num)) converted[num] = Boolean(v);
            });
            setAdam((prev) => ({ ...prev, answers: converted }));
          } catch {
            // Ignore
          }
        }

        if (draft.sleepHours || draft.fastFoodIntake) {
          setLifestyle((prev) => ({
            ...prev,
            sleepHours: Number(draft.sleepHours) || prev.sleepHours,
            fastFoodIntake: draft.fastFoodIntake || prev.fastFoodIntake,
          }));
        }
      })
      .catch((err) => {
        console.warn('[BioPulse MaleOnboarding] Draft restoration error:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.id, user?.accessToken]);

  const updateBasicInfo = useCallback((info: Partial<MaleBasicInfoState>) => {
    setBasicInfo((prev) => {
      const next = { ...prev, ...info };
      if (info.heightCm !== undefined || info.weightKg !== undefined) {
        const heightM = next.heightCm / 100;
        if (heightM > 0) {
          next.bmi = parseFloat((next.weightKg / (heightM * heightM)).toFixed(1));
        }
      }
      if (user?.id) {
        saveOnboardingStepData(user.id, user.accessToken || '', {
          age: next.age,
          heightCm: next.heightCm,
          weightKg: next.weightKg,
          waistCm: next.waistCm,
          gender: 'male',
          pathway: 'male_hypogonadism',
        }).catch((e) => console.warn('[MaleOnboarding] save error:', e));
      }
      return next;
    });
  }, [user?.id, user?.accessToken]);

  const setAdamAnswer = useCallback((questionId: number, answer: boolean) => {
    setAdam((prev) => {
      const updatedAnswers = {
        ...prev.answers,
        [questionId]: answer,
      };
      if (user?.id) {
        saveOnboardingStepData(user.id, user.accessToken || '', {
          adam_answers: updatedAnswers,
        }).catch((e) => console.warn('[MaleOnboarding] save error:', e));
      }
      return {
        ...prev,
        answers: updatedAnswers,
      };
    });
  }, [user?.id, user?.accessToken]);

  const setAdamCurrentQuestion = useCallback((q: number) => {
    setAdam((prev) => ({
      ...prev,
      currentQuestion: Math.max(1, Math.min(10, q)),
    }));
  }, []);

  const updateLifestyle = useCallback((patch: Partial<MaleLifestyleState>) => {
    setLifestyle((prev) => {
      const next = { ...prev, ...patch };
      if (user?.id) {
        saveOnboardingStepData(user.id, user.accessToken || '', {
          sleepHours: next.sleepHours,
          fastFoodIntake: next.fastFoodIntake,
          regularExercise: next.exerciseFrequency !== 'none',
          activityLevel: next.activityLevel,
        }).catch((e) => console.warn('[MaleOnboarding] save error:', e));
      }
      return next;
    });
  }, [user?.id, user?.accessToken]);

  const saveAndCompleteOnboarding = useCallback(
    async (finalSummary?: Record<string, any>): Promise<boolean> => {
      if (!user?.id) return true;
      return completeOnboardingInDb(user.id, user.accessToken || '', {
        pathway: 'male_hypogonadism',
        gender: 'male',
        ...finalSummary,
      });
    },
    [user?.id, user?.accessToken]
  );

  const calculateAdamScore = useCallback(() => {
    const answers = adam.answers;
    let yesCount = 0;
    for (let i = 1; i <= 10; i++) {
      if (answers[i] === true) yesCount++;
    }

    // Standard Saint Louis University ADAM rule:
    // Positive if Q1 is Yes OR Q7 is Yes OR any 3 other questions are Yes
    const q1 = answers[1] === true;
    const q7 = answers[7] === true;
    const otherYes = yesCount - (q1 ? 1 : 0) - (q7 ? 1 : 0);
    const isPositive = q1 || q7 || otherYes >= 3;

    return { score: yesCount, isPositive };
  }, [adam.answers]);

  const resetOnboarding = useCallback(() => {
    setBasicInfo(DEFAULT_BASIC_INFO);
    setAdam(DEFAULT_ADAM);
    setLifestyle(DEFAULT_LIFESTYLE);
    setActiveAssessment(null);
    setAssessmentError(null);
    setLastActiveScreeningRoute(null);
  }, []);

  return (
    <MaleOnboardingContext.Provider
      value={{
        basicInfo,
        adam,
        lifestyle,
        activeAssessment,
        isLoadingAssessment,
        assessmentError,
        lastActiveScreeningRoute,
        updateBasicInfo,
        setAdamAnswer,
        setAdamCurrentQuestion,
        updateLifestyle,
        setActiveAssessment,
        setIsLoadingAssessment,
        setAssessmentError,
        setLastActiveScreeningRoute,
        resetOnboarding,
        calculateAdamScore,
        saveAndCompleteOnboarding,
      }}
    >
      {children}
    </MaleOnboardingContext.Provider>
  );
};

export const useMaleOnboarding = (): MaleOnboardingContextValue => {
  const context = useContext(MaleOnboardingContext);
  if (!context) {
    throw new Error('useMaleOnboarding must be used within a MaleOnboardingProvider');
  }
  return context;
};
