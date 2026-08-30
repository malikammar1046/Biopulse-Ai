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
import type {
  CycleRecord,
  CycleRecordInput,
  CycleSummaryStats,
} from '../types/cycle';
import type {
  SymptomRecord,
  SymptomRecordInput,
  SymptomSummaryStats,
} from '../types/symptom';
import {
  DEFAULT_MEDICAL_REPORTS,
  DEFAULT_CARE_CIRCLE,
  deriveRemindersFromProfile,
  deriveNutritionFromProfile,
  deriveFitnessFromProfile,
  deriveInsightFromProfile,
} from '../data/mockDashboardData';
import { calculateCycleMetrics } from '../utils/profileCompletion';
import { calculateCycleStats } from '../utils/cycleCalculations';
import { calculateSymptomStats } from '../utils/symptomCalculations';
import { cycleService } from '../services/cycleService';
import { symptomService } from '../services/symptomService';
import { useAuth } from './AuthContext';

interface UserHealthContextType {
  userProfile: UserProfile;
  snapshotMetrics: HealthSnapshotMetrics;
  cycleRecords: CycleRecord[];
  cycleStats: CycleSummaryStats;
  cycleLoading: boolean;
  logPeriod: (input: CycleRecordInput) => Promise<{ success: boolean; error?: string }>;
  updatePeriod: (id: string, input: Partial<CycleRecordInput>) => Promise<{ success: boolean; error?: string }>;
  deletePeriod: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshCycleRecords: () => Promise<void>;
  symptomRecords: SymptomRecord[];
  symptomStats: SymptomSummaryStats;
  symptomsLoading: boolean;
  logSymptom: (input: SymptomRecordInput) => Promise<{ success: boolean; error?: string }>;
  updateSymptom: (id: string, input: Partial<SymptomRecordInput>) => Promise<{ success: boolean; error?: string }>;
  deleteSymptom: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshSymptomRecords: () => Promise<void>;
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

  // Cycle Records State
  const [cycleRecords, setCycleRecords] = useState<CycleRecord[]>([]);
  const [cycleLoading, setCycleLoading] = useState<boolean>(true);

  // Fetch Cycle Records from Supabase / Service on User ID change
  const refreshCycleRecords = useCallback(async () => {
    if (!userProfile?.id) {
      setCycleRecords([]);
      setCycleLoading(false);
      return;
    }
    setCycleLoading(true);
    try {
      const { records } = await cycleService.fetchCycleRecords(userProfile.id);
      setCycleRecords(records || []);
    } catch (err) {
      console.warn('Error refreshing cycle records:', err);
    } finally {
      setCycleLoading(false);
    }
  }, [userProfile?.id]);

  // Symptom Records State
  const [symptomRecords, setSymptomRecords] = useState<SymptomRecord[]>([]);
  const [symptomsLoading, setSymptomsLoading] = useState<boolean>(true);

  // Fetch Symptom Records from Supabase / Service on User ID change
  const refreshSymptomRecords = useCallback(async () => {
    if (!userProfile?.id) {
      setSymptomRecords([]);
      setSymptomsLoading(false);
      return;
    }
    setSymptomsLoading(true);
    try {
      const { records } = await symptomService.fetchSymptomRecords(userProfile.id);
      setSymptomRecords(records || []);
    } catch (err) {
      console.warn('Error refreshing symptom records:', err);
    } finally {
      setSymptomsLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    refreshCycleRecords();
    refreshSymptomRecords();
  }, [refreshCycleRecords, refreshSymptomRecords]);

  // Pure mathematical cycle statistics derived from actual records
  const cycleStats: CycleSummaryStats = useMemo(() => {
    return calculateCycleStats(cycleRecords, {
      cycleLength: userProfile.womensHealth?.cycleLength,
      periodDuration: userProfile.womensHealth?.periodDuration,
      lastPeriodDate: userProfile.womensHealth?.lastPeriodDate,
    });
  }, [cycleRecords, userProfile.womensHealth]);

  // Pure mathematical symptom statistics derived from actual records
  const symptomStats: SymptomSummaryStats = useMemo(() => {
    return calculateSymptomStats(symptomRecords);
  }, [symptomRecords]);

  // Log a new period entry
  const logPeriod = useCallback(
    async (input: CycleRecordInput): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to log a period.' };
      }
      try {
        const { record, error } = await cycleService.createCycleRecord(userProfile.id, input);
        if (error || !record) {
          return { success: false, error: error || 'Failed to save cycle record.' };
        }

        // Update local cycle records state
        setCycleRecords((prev) => {
          const next = [record, ...prev.filter((r) => r.id !== record.id)];
          return next.sort(
            (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
          );
        });

        // Sync last_period_date to user profile if this is the latest recorded period
        const latestStartDate = input.periodStartDate;
        if (!userProfile.womensHealth?.lastPeriodDate || latestStartDate >= userProfile.womensHealth.lastPeriodDate) {
          authUpdateProfile({
            womensHealth: {
              ...userProfile.womensHealth,
              lastPeriodDate: latestStartDate,
            },
          }).catch((err) => console.warn('Could not sync profile last period date:', err));
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error saving period.' };
      }
    },
    [userProfile, authUpdateProfile]
  );

  // Update an existing period entry
  const updatePeriod = useCallback(
    async (id: string, input: Partial<CycleRecordInput>): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to update a period.' };
      }
      try {
        const { record, error } = await cycleService.updateCycleRecord(userProfile.id, id, input);
        if (error || !record) {
          return { success: false, error: error || 'Failed to update cycle record.' };
        }

        setCycleRecords((prev) => {
          const next = prev.map((r) => (r.id === id ? record : r));
          return next.sort(
            (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
          );
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error updating period.' };
      }
    },
    [userProfile?.id]
  );

  // Delete a period entry
  const deletePeriod = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete a period.' };
      }
      try {
        const { success, error } = await cycleService.deleteCycleRecord(userProfile.id, id);
        if (!success) {
          return { success: false, error: error || 'Failed to delete cycle record.' };
        }

        setCycleRecords((prev) => prev.filter((r) => r.id !== id));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error deleting period.' };
      }
    },
    [userProfile?.id]
  );

  // Log a new symptom
  const logSymptom = useCallback(
    async (input: SymptomRecordInput): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to log a symptom.' };
      }
      try {
        const { record, error } = await symptomService.createSymptomRecord(userProfile.id, input);
        if (error || !record) {
          return { success: false, error: error || 'Failed to save symptom record.' };
        }

        setSymptomRecords((prev) => {
          const next = [record, ...prev.filter((r) => r.id !== record.id)];
          return next.sort(
            (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
          );
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error saving symptom.' };
      }
    },
    [userProfile?.id]
  );

  // Update an existing symptom
  const updateSymptom = useCallback(
    async (id: string, input: Partial<SymptomRecordInput>): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to update a symptom.' };
      }
      try {
        const { record, error } = await symptomService.updateSymptomRecord(userProfile.id, id, input);
        if (error || !record) {
          return { success: false, error: error || 'Failed to update symptom record.' };
        }

        setSymptomRecords((prev) => {
          const next = prev.map((r) => (r.id === id ? record : r));
          return next.sort(
            (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
          );
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error updating symptom.' };
      }
    },
    [userProfile?.id]
  );

  // Delete a symptom
  const deleteSymptom = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete a symptom.' };
      }
      try {
        const { success, error } = await symptomService.deleteSymptomRecord(userProfile.id, id);
        if (!success) {
          return { success: false, error: error || 'Failed to delete symptom record.' };
        }

        setSymptomRecords((prev) => prev.filter((r) => r.id !== id));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error deleting symptom.' };
      }
    },
    [userProfile?.id]
  );

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

  // Dynamically compute legacy cycle metrics for backwards compatibility / fallback
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

  // Dynamically derive snapshot metrics strictly from actual cycle calculations & real symptom logs
  const snapshotMetrics: HealthSnapshotMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySymptoms = symptomRecords.filter((s) => s.occurredAt === todayStr);

    const symptomsList = todaySymptoms.map((sym) => ({
      name: sym.symptomType,
      severity: sym.severity,
    }));

    // Dynamic Wellness Score based on sleep, water, and recorded symptoms
    const sleepTarget = userProfile.lifestyle?.sleepHours || 7.5;
    const waterTarget = userProfile.lifestyle?.dailyWaterGlasses || 8;
    const sleepScore = Math.min(100, (sleepTarget / 8) * 100);
    const waterScore = Math.min(100, (waterTarget / 8) * 100);
    const symptomsDeduction = Math.min(25, todaySymptoms.length * 5);
    const wellnessScore = Math.max(
      50,
      Math.min(100, Math.round(sleepScore * 0.45 + waterScore * 0.45 + 10 - symptomsDeduction))
    );

    const hasRealData = cycleStats.hasData;

    return {
      cycleDay: hasRealData ? (cycleStats.currentCycleDay || 1) : 0,
      totalCycleDays: cycleStats.totalCycleDays,
      phaseName: hasRealData
        ? (cycleStats.estimatedPhase?.name || 'Follicular Phase')
        : 'Start tracking your cycle',
      nextPeriodDays: hasRealData ? (cycleStats.nextPeriodDays || 0) : 0,
      nextPeriodDate: hasRealData ? (cycleStats.nextPeriodDate || 'Calculating...') : 'No period recorded',
      symptomsCountToday: symptomsList.length,
      symptomsList,
      wellnessScore,
      wellnessScoreChange: 6,
    };
  }, [userProfile, cycleStats, symptomRecords]);

  // Dynamically derive nutrition
  const nutrition: NutritionData = useMemo(() => {
    return deriveNutritionFromProfile(userProfile);
  }, [userProfile]);

  // Dynamically derive fitness
  const fitness: FitnessData = useMemo(() => {
    const activePhaseName = cycleStats.hasData && cycleStats.estimatedPhase
      ? cycleStats.estimatedPhase.name
      : cycleMetrics.phaseName;
    return deriveFitnessFromProfile(userProfile, activePhaseName);
  }, [userProfile, cycleStats, cycleMetrics.phaseName]);

  // Dynamically derive Digital Twin insight
  const digitalTwinInsight: DigitalTwinInsight = useMemo(() => {
    const activePhaseName = cycleStats.hasData && cycleStats.estimatedPhase
      ? cycleStats.estimatedPhase.name
      : cycleMetrics.phaseName;
    return deriveInsightFromProfile(userProfile, activePhaseName);
  }, [userProfile, cycleStats, cycleMetrics.phaseName]);

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
      // Registration handled in Register component via useAuth().register
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
        cycleRecords,
        cycleStats,
        cycleLoading,
        logPeriod,
        updatePeriod,
        deletePeriod,
        refreshCycleRecords,
        symptomRecords,
        symptomStats,
        symptomsLoading,
        logSymptom,
        updateSymptom,
        deleteSymptom,
        refreshSymptomRecords,
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
