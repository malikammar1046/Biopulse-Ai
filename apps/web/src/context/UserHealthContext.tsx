import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { UserProfile } from '../types/onboarding';
import type {
  HealthSnapshotMetrics,
  TodayReminder,
  NutritionData,
  FitnessData,
  MedicalReportItem,
  CareCircleContact,
  DigitalTwinInsight,
} from '../types/dashboard';
import {
  DEFAULT_MEDICAL_REPORTS,
  DEFAULT_CARE_CIRCLE,
  deriveRemindersFromProfile,
  deriveNutritionFromProfile,
  deriveFitnessFromProfile,
  deriveInsightFromProfile,
} from '../data/mockDashboardData';
import { calculateCycleMetrics } from '../utils/profileCompletion';
import { useAuth } from './AuthContext';

interface UserHealthContextType {
  userProfile: UserProfile;
  snapshotMetrics: HealthSnapshotMetrics;
  reminders: TodayReminder[];
  nutrition: NutritionData;
  fitness: FitnessData;
  reports: MedicalReportItem[];
  careCircle: CareCircleContact[];
  digitalTwinInsight: DigitalTwinInsight;
  isAiChatOpen: boolean;
  activeAiPrompt?: string;
  toggleAiChat: () => void;
  openAiChatWithPrompt: (prompt?: string) => void;
  closeAiChat: () => void;
  toggleReminder: (reminderId: string) => void;
  addReminder: (title: string, time: string, category: TodayReminder['category']) => void;
  registerUser: (data: { fullName: string; email: string; dateOfBirth?: string }) => void;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  resetToDefaultProfile: () => void;
  clearUserData: () => void;
}

const REMINDERS_KEY = 'ovasense_user_reminders_v1';

const UserHealthContext = createContext<UserHealthContextType | undefined>(undefined);

export const UserHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    userProfile,
    saveOnboardingProfile,
    updateUserProfile: authUpdateProfile,
    resetToDefaultProfile,
    logout,
  } = useAuth();

  const [reminders, setReminders] = useState<TodayReminder[]>(() => {
    try {
      const saved = localStorage.getItem(REMINDERS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return deriveRemindersFromProfile(userProfile);
  });

  const [reports] = useState<MedicalReportItem[]>(DEFAULT_MEDICAL_REPORTS);
  const [careCircle] = useState<CareCircleContact[]>(DEFAULT_CARE_CIRCLE);

  // Floating AI Assistant State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [activeAiPrompt, setActiveAiPrompt] = useState<string | undefined>(undefined);

  // Re-sync reminders whenever medications or hydration targets change in profile
  useEffect(() => {
    const freshReminders = deriveRemindersFromProfile(userProfile);
    setReminders(freshReminders);
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(freshReminders));
    } catch {
      // ignore
    }
  }, [
    userProfile.medical?.medications,
    userProfile.lifestyle?.dailyWaterGlasses,
    userProfile.lifestyle?.exercisePreferences,
  ]);

  // Persist Reminders changes
  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    } catch {
      // ignore
    }
  }, [reminders]);

  // Dynamically compute cycle metrics
  const cycleMetrics = useMemo(() => {
    return calculateCycleMetrics(
      userProfile.womensHealth?.lastPeriodDate,
      userProfile.womensHealth?.cycleLength,
      userProfile.womensHealth?.periodDuration
    );
  }, [
    userProfile.womensHealth?.lastPeriodDate,
    userProfile.womensHealth?.cycleLength,
    userProfile.womensHealth?.periodDuration,
  ]);

  // Dynamically derive snapshot metrics
  const snapshotMetrics: HealthSnapshotMetrics = useMemo(() => {
    const rawSymptoms = userProfile.womensHealth?.commonSymptoms || [];
    const symptomsList = rawSymptoms.map((sym) => ({
      name: sym,
      severity: 'mild' as const,
    }));

    // Dynamic Wellness Score based on sleep, water, and recorded symptoms
    const sleepTarget = userProfile.lifestyle?.sleepHours || 7.5;
    const waterTarget = userProfile.lifestyle?.dailyWaterGlasses || 8;
    const sleepScore = Math.min(100, (sleepTarget / 8) * 100);
    const waterScore = Math.min(100, (waterTarget / 8) * 100);
    const symptomsDeduction = Math.min(25, rawSymptoms.length * 5);
    const wellnessScore = Math.max(
      50,
      Math.min(100, Math.round(sleepScore * 0.45 + waterScore * 0.45 + 10 - symptomsDeduction))
    );

    return {
      cycleDay: cycleMetrics.cycleDay,
      totalCycleDays: cycleMetrics.totalCycleDays,
      phaseName: cycleMetrics.phaseName,
      nextPeriodDays: cycleMetrics.nextPeriodDays,
      nextPeriodDate: cycleMetrics.nextPeriodDate,
      symptomsCountToday: symptomsList.length,
      symptomsList,
      wellnessScore,
      wellnessScoreChange: 6,
    };
  }, [userProfile, cycleMetrics]);

  // Dynamically derive nutrition
  const nutrition: NutritionData = useMemo(() => {
    return deriveNutritionFromProfile(userProfile);
  }, [userProfile]);

  // Dynamically derive fitness
  const fitness: FitnessData = useMemo(() => {
    return deriveFitnessFromProfile(userProfile, cycleMetrics.phaseName);
  }, [userProfile, cycleMetrics.phaseName]);

  // Dynamically derive Digital Twin insight
  const digitalTwinInsight: DigitalTwinInsight = useMemo(() => {
    return deriveInsightFromProfile(userProfile, cycleMetrics.phaseName);
  }, [userProfile, cycleMetrics.phaseName]);

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  }, []);

  const addReminder = useCallback(
    (title: string, time: string, category: TodayReminder['category']) => {
      const newRem: TodayReminder = {
        id: `rem_${Date.now()}`,
        title,
        time,
        category,
        completed: false,
      };
      setReminders((prev) => [newRem, ...prev]);
    },
    []
  );

  const registerUser = useCallback(
    (_data: { fullName: string; email: string; dateOfBirth?: string }) => {
      // Registration is handled directly in Register component via useAuth().register
    },
    []
  );

  /**
   * Completes onboarding and persists full profile into Supabase.
   */
  const completeOnboarding = useCallback(
    async (data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
      return await saveOnboardingProfile(data);
    },
    [saveOnboardingProfile]
  );

  /**
   * Deep updates user profile fields and updates Supabase.
   */
  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
      return await authUpdateProfile(data);
    },
    [authUpdateProfile]
  );

  const clearUserData = useCallback(() => {
    logout();
  }, [logout]);

  const toggleAiChat = () => setIsAiChatOpen((prev) => !prev);
  const openAiChatWithPrompt = (prompt?: string) => {
    setActiveAiPrompt(prompt);
    setIsAiChatOpen(true);
  };
  const closeAiChat = () => setIsAiChatOpen(false);

  return (
    <UserHealthContext.Provider
      value={{
        userProfile,
        snapshotMetrics,
        reminders,
        nutrition,
        fitness,
        reports,
        careCircle,
        digitalTwinInsight,
        isAiChatOpen,
        activeAiPrompt,
        toggleAiChat,
        openAiChatWithPrompt,
        closeAiChat,
        toggleReminder,
        addReminder,
        registerUser,
        completeOnboarding,
        updateUserProfile,
        resetToDefaultProfile,
        clearUserData,
      }}
    >
      {children}
    </UserHealthContext.Provider>
  );
};

export const useUserHealth = () => {
  const context = useContext(UserHealthContext);
  if (!context) {
    throw new Error('useUserHealth must be used within a UserHealthProvider');
  }
  return context;
};
