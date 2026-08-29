import React, { createContext, useContext, useState, useEffect } from 'react';
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
  DEFAULT_USER_PROFILE,
  DEFAULT_SNAPSHOT_METRICS,
  DEFAULT_TODAY_REMINDERS,
  DEFAULT_NUTRITION_DATA,
  DEFAULT_FITNESS_DATA,
  DEFAULT_MEDICAL_REPORTS,
  DEFAULT_CARE_CIRCLE,
  DEFAULT_DIGITAL_TWIN_INSIGHT,
} from '../data/mockDashboardData';

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
  completeOnboarding: (data: Partial<UserProfile>) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  resetToDefaultProfile: () => void;
}

const STORAGE_KEY = 'ovasense_user_profile_v1';
const REMINDERS_KEY = 'ovasense_user_reminders_v1';

const UserHealthContext = createContext<UserHealthContextType | undefined>(undefined);

export const UserHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_USER_PROFILE;
  });

  const [reminders, setReminders] = useState<TodayReminder[]>(() => {
    try {
      const saved = localStorage.getItem(REMINDERS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_TODAY_REMINDERS;
  });

  const [snapshotMetrics, setSnapshotMetrics] = useState<HealthSnapshotMetrics>(DEFAULT_SNAPSHOT_METRICS);
  const [nutrition] = useState<NutritionData>(DEFAULT_NUTRITION_DATA);
  const [fitness] = useState<FitnessData>(DEFAULT_FITNESS_DATA);
  const [reports] = useState<MedicalReportItem[]>(DEFAULT_MEDICAL_REPORTS);
  const [careCircle] = useState<CareCircleContact[]>(DEFAULT_CARE_CIRCLE);
  const [digitalTwinInsight] = useState<DigitalTwinInsight>(DEFAULT_DIGITAL_TWIN_INSIGHT);

  // Floating AI Assistant State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [activeAiPrompt, setActiveAiPrompt] = useState<string | undefined>(undefined);

  // Persist Profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    } catch {
      // ignore
    }
  }, [userProfile]);

  // Persist Reminders changes
  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    } catch {
      // ignore
    }
  }, [reminders]);

  // Synchronize snapshot metrics if userProfile changes
  useEffect(() => {
    if (userProfile.womensHealth) {
      setSnapshotMetrics((prev) => ({
        ...prev,
        cycleDay: userProfile.womensHealth.currentCycleDay || 14,
        totalCycleDays: typeof userProfile.womensHealth.cycleLength === 'number' ? userProfile.womensHealth.cycleLength : 28,
        phaseName: userProfile.womensHealth.currentPhase
          ? `${userProfile.womensHealth.currentPhase.charAt(0).toUpperCase() + userProfile.womensHealth.currentPhase.slice(1)} Phase`
          : 'Follicular Phase',
      }));
    }
  }, [userProfile]);

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const addReminder = (title: string, time: string, category: TodayReminder['category']) => {
    const newRem: TodayReminder = {
      id: `rem_${Date.now()}`,
      title,
      time,
      category,
      completed: false,
    };
    setReminders((prev) => [newRem, ...prev]);
  };

  const completeOnboarding = (data: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated: UserProfile = {
        ...prev,
        ...data,
        isOnboarded: true,
      };
      return updated;
    });
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...data }));
  };

  const resetToDefaultProfile = () => {
    setUserProfile(DEFAULT_USER_PROFILE);
    setReminders(DEFAULT_TODAY_REMINDERS);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMINDERS_KEY);
  };

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
        completeOnboarding,
        updateUserProfile,
        resetToDefaultProfile,
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
