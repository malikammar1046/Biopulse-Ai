import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { UserProfile } from '../types/onboarding';
import type {
  HealthSnapshotMetrics,
  TodayReminder,
  NutritionData,
  FitnessData,
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
import type {
  MedicalReport,
  MedicalReportInput,
  ReportSummaryStats,
} from '../types/report';
import {
  DEFAULT_CARE_CIRCLE,
  deriveRemindersFromProfile,
  deriveNutritionFromProfile,
  deriveFitnessFromProfile,
  deriveInsightFromProfile,
} from '../data/mockDashboardData';
import { calculateCycleMetrics } from '../utils/profileCompletion';
import { calculateCycleStats } from '../utils/cycleCalculations';
import { calculateSymptomStats } from '../utils/symptomCalculations';
import { calculateReportSummaryStats } from '../utils/reportCalculations';
import { cycleService } from '../services/cycleService';
import { symptomService } from '../services/symptomService';
import { reportService } from '../services/reportService';
import { careCircleService } from '../services/careCircleService';
import { dietService } from '../services/dietService';
import type {
  CareCircleMember,
  CareCircleInvitation,
  CareCircleInviteInput,
  CareCirclePermissionsMap,
  WeeklyHealthSummaryData,
} from '../types/careCircle';
import type {
  FoodLogEntry,
  FoodLogInput,
  WaterLogEntry,
  DailyNutritionTargets,
  DailyMealPlan,
} from '../types/diet';
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
  reports: MedicalReport[];
  reportStats: ReportSummaryStats;
  reportsLoading: boolean;
  uploadReport: (input: MedicalReportInput) => Promise<{ success: boolean; error?: string }>;
  deleteReport: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshReports: () => Promise<void>;
  reminders: TodayReminder[];
  nutrition: NutritionData;
  foodLogs: FoodLogEntry[];
  waterLog: WaterLogEntry;
  dailyNutritionTargets: DailyNutritionTargets;
  dailyMealPlan: DailyMealPlan;
  dietLoading: boolean;
  logFoodItem: (input: FoodLogInput) => Promise<{ success: boolean; entry?: FoodLogEntry; error?: string }>;
  deleteFoodLogItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  incrementWater: () => Promise<void>;
  decrementWater: () => Promise<void>;
  refreshDietData: () => Promise<void>;
  fitness: FitnessData;
  careCircle: CareCircleContact[];
  careCircleMembers: CareCircleMember[];
  careCircleInvitations: CareCircleInvitation[];
  careCircleLoading: boolean;
  addCareMember: (input: CareCircleInviteInput) => Promise<{ success: boolean; inviteLink?: string; error?: string }>;
  updateMemberPermissions: (memberId: string, perms: CareCirclePermissionsMap) => Promise<{ success: boolean; error?: string }>;
  revokeMemberAccess: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  deleteCareMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  refreshCareCircle: () => Promise<void>;
  weeklySummary: WeeklyHealthSummaryData;
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

  // Medical Reports State
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState<boolean>(true);

  // Fetch Medical Reports from Supabase / Service on User ID change
  const refreshReports = useCallback(async () => {
    if (!userProfile?.id) {
      setReports([]);
      setReportsLoading(false);
      return;
    }
    setReportsLoading(true);
    try {
      const { reports: fetched } = await reportService.fetchMedicalReports(userProfile.id);
      setReports(fetched || []);
    } catch (err) {
      console.warn('Error refreshing reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    refreshCycleRecords();
    refreshSymptomRecords();
    refreshReports();
  }, [refreshCycleRecords, refreshSymptomRecords, refreshReports]);

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

  const reportStats: ReportSummaryStats = useMemo(() => {
    return calculateReportSummaryStats(reports);
  }, [reports]);

  // Upload and create a new medical report
  const uploadReport = useCallback(
    async (input: MedicalReportInput): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to save reports.' };
      }
      try {
        const { report, error } = await reportService.createMedicalReport(userProfile.id, input);
        if (error || !report) {
          return { success: false, error: error || 'Failed to save report.' };
        }

        setReports((prev) => {
          const next = [report, ...prev.filter((r) => r.id !== report.id)];
          return next.sort(
            (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
          );
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error saving report.' };
      }
    },
    [userProfile?.id]
  );

  // Delete a medical report
  const deleteReport = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete a report.' };
      }
      try {
        const { success, error } = await reportService.deleteMedicalReport(userProfile.id, id);
        if (!success) {
          return { success: false, error: error || 'Failed to delete report.' };
        }

        setReports((prev) => prev.filter((r) => r.id !== id));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unexpected error deleting report.' };
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

  // --- Diet & Nutrition Live State & Handlers ---
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [waterLog, setWaterLog] = useState<WaterLogEntry>({
    userId: userProfile?.id || 'default',
    date: new Date().toISOString().split('T')[0],
    glasses: 5,
    targetGlasses: userProfile?.lifestyle?.dailyWaterGlasses || 8,
    updatedAt: new Date().toISOString(),
  });
  const [dietLoading, setDietLoading] = useState<boolean>(true);

  // Dynamic calculated targets
  const dailyNutritionTargets: DailyNutritionTargets = useMemo(() => {
    return dietService.calculateNutritionTargets(userProfile);
  }, [userProfile]);

  // Dynamic planned meals with allergy & cycle awareness
  const dailyMealPlan: DailyMealPlan = useMemo(() => {
    const recentSyms = symptomRecords.map((s) => s.symptomType);
    const activePhase = cycleStats.hasData && cycleStats.estimatedPhase
      ? cycleStats.estimatedPhase.name
      : undefined;
    return dietService.generateDailyMealPlan(userProfile, activePhase, recentSyms);
  }, [userProfile, cycleStats, symptomRecords]);

  const refreshDietData = useCallback(async (silent = false) => {
    if (!userProfile?.id) {
      setDietLoading(false);
      return;
    }
    if (!silent) {
      setDietLoading(true);
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const [foodRes, waterRes] = await Promise.all([
        dietService.fetchFoodLogs(userProfile.id, today),
        dietService.fetchWaterLog(userProfile.id, today),
      ]);
      setFoodLogs(foodRes.logs || []);
      setWaterLog(waterRes.entry);
    } catch (err) {
      console.warn('Error refreshing diet data:', err);
    } finally {
      if (!silent) {
        setDietLoading(false);
      }
    }
  }, [userProfile?.id]);

  useEffect(() => {
    refreshDietData(false);

    let dietTimer: any = null;
    const handleDietUpdate = () => {
      clearTimeout(dietTimer);
      dietTimer = setTimeout(() => {
        refreshDietData(true);
      }, 150);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ovasense_diet_updated', handleDietUpdate);
    }

    return () => {
      clearTimeout(dietTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ovasense_diet_updated', handleDietUpdate);
      }
    };
  }, [refreshDietData]);

  const logFoodItem = useCallback(
    async (input: FoodLogInput): Promise<{ success: boolean; entry?: FoodLogEntry; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to log food.' };
      }
      try {
        const res = await dietService.logFood(userProfile.id, input);
        if (res.success && res.entry) {
          setFoodLogs((prev) => [...prev, res.entry!]);
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to log food.' };
      }
    },
    [userProfile?.id]
  );

  const deleteFoodLogItem = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete food log.' };
      }
      try {
        const res = await dietService.deleteFoodLog(userProfile.id, id);
        if (res.success) {
          setFoodLogs((prev) => prev.filter((l) => l.id !== id));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to delete food log.' };
      }
    },
    [userProfile?.id]
  );

  const incrementWater = useCallback(async () => {
    if (!userProfile?.id) return;
    const nextGlasses = Math.min(24, waterLog.glasses + 1);
    const target = userProfile.lifestyle?.dailyWaterGlasses || 8;
    setWaterLog((prev) => ({ ...prev, glasses: nextGlasses }));
    await dietService.updateWaterGlasses(userProfile.id, nextGlasses, target, waterLog.date);
  }, [userProfile?.id, userProfile?.lifestyle?.dailyWaterGlasses, waterLog.glasses, waterLog.date]);

  const decrementWater = useCallback(async () => {
    if (!userProfile?.id) return;
    const nextGlasses = Math.max(0, waterLog.glasses - 1);
    const target = userProfile.lifestyle?.dailyWaterGlasses || 8;
    setWaterLog((prev) => ({ ...prev, glasses: nextGlasses }));
    await dietService.updateWaterGlasses(userProfile.id, nextGlasses, target, waterLog.date);
  }, [userProfile?.id, userProfile?.lifestyle?.dailyWaterGlasses, waterLog.glasses, waterLog.date]);

  // Care Circle State & Live Management
  const [careCircleMembers, setCareCircleMembers] = useState<CareCircleMember[]>([]);
  const [careCircleInvitations, setCareCircleInvitations] = useState<CareCircleInvitation[]>([]);
  const [careCircleLoading, setCareCircleLoading] = useState<boolean>(true);

  const refreshCareCircle = useCallback(async (silent = false) => {
    if (!userProfile?.id) {
      setCareCircleMembers([]);
      setCareCircleInvitations([]);
      setCareCircleLoading(false);
      return;
    }
    if (!silent) {
      setCareCircleLoading(true);
    }
    try {
      const { members, invitations } = await careCircleService.fetchCareCircleMembers(userProfile.id);
      setCareCircleMembers(members || []);
      setCareCircleInvitations(invitations || []);
    } catch (err) {
      console.warn('Error refreshing care circle:', err);
    } finally {
      if (!silent) {
        setCareCircleLoading(false);
      }
    }
  }, [userProfile?.id]);

  useEffect(() => {
    // Initial fetch on profile load
    refreshCareCircle(false);

    let debounceTimer: any = null;
    const handleUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refreshCareCircle(true); // Silent update without spinner
      }, 150);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleUpdate);
      window.addEventListener('ovasense_care_circle_updated', handleUpdate);
    }

    return () => {
      clearTimeout(debounceTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleUpdate);
        window.removeEventListener('ovasense_care_circle_updated', handleUpdate);
      }
    };
  }, [refreshCareCircle]);

  // Add Care Member
  const addCareMember = useCallback(
    async (input: CareCircleInviteInput): Promise<{ success: boolean; inviteLink?: string; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to invite care members.' };
      }
      try {
        const res = await careCircleService.addCareCircleMember(userProfile.id, input);
        if (res.error) {
          return { success: false, error: res.error };
        }
        if (res.member) {
          setCareCircleMembers((prev) => [res.member!, ...prev]);
        }
        if (res.invitation) {
          setCareCircleInvitations((prev) => [res.invitation!, ...prev]);
        }
        return { success: true, inviteLink: res.inviteLink };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to add care member.' };
      }
    },
    [userProfile?.id]
  );

  // Update Member Permissions
  const updateMemberPermissions = useCallback(
    async (memberId: string, perms: CareCirclePermissionsMap): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to modify permissions.' };
      }
      try {
        const res = await careCircleService.updateMemberPermissions(userProfile.id, memberId, perms);
        if (res.success) {
          setCareCircleMembers((prev) =>
            prev.map((m) => (m.id === memberId ? { ...m, permissions: { ...perms } } : m))
          );
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to update permissions.' };
      }
    },
    [userProfile?.id]
  );

  // Revoke Member Access
  const revokeMemberAccess = useCallback(
    async (memberId: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to revoke access.' };
      }
      try {
        const res = await careCircleService.revokeMemberAccess(userProfile.id, memberId);
        if (res.success) {
          setCareCircleMembers((prev) =>
            prev.map((m) => (m.id === memberId ? { ...m, status: 'revoked' as const } : m))
          );
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to revoke access.' };
      }
    },
    [userProfile?.id]
  );

  // Delete Member
  const deleteCareMember = useCallback(
    async (memberId: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete care member.' };
      }
      try {
        const res = await careCircleService.deleteMember(userProfile.id, memberId);
        if (res.success) {
          setCareCircleMembers((prev) => prev.filter((m) => m.id !== memberId));
          setCareCircleInvitations((prev) => prev.filter((i) => i.id !== memberId));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to delete care member.' };
      }
    },
    [userProfile?.id]
  );

  // Backward compatible CareCircleContact list dynamically derived from careCircleMembers
  const careCircle: CareCircleContact[] = useMemo(() => {
    const active = careCircleMembers.filter((m) => m.status === 'active');
    if (active.length === 0) {
      return DEFAULT_CARE_CIRCLE;
    }
    return active.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role === 'doctor' ? 'doctor' : m.role === 'family' ? 'family' : 'caregiver',
      specialty: m.relationship || m.clinicOrganization || (m.role === 'doctor' ? 'Healthcare Professional' : 'Trusted Contact'),
      accessLevel: m.permissions.reports && m.permissions.cycle && m.permissions.symptoms ? 'full' : 'limited',
      nextAppointment: m.role === 'doctor' ? 'September 8, 2026' : undefined,
      permissions: {
        symptoms: m.permissions.symptoms,
        reports: m.permissions.reports,
        medications: m.permissions.medications,
        dietFitness: m.permissions.diet || m.permissions.fitness,
        privateNotes: false,
      },
    }));
  }, [careCircleMembers]);

  // Derived longitudinal Weekly Health Summary
  const weeklySummary: WeeklyHealthSummaryData = useMemo(() => {
    return careCircleService.generateWeeklyHealthSummary(
      userProfile?.id || 'default',
      cycleRecords,
      symptomRecords,
      reports,
      userProfile,
      reminders
    );
  }, [userProfile, cycleRecords, symptomRecords, reports, reminders]);

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

  // Dynamically derive nutrition snapshot object for Dashboard and widgets from LIVE food logs & water
  const nutrition: NutritionData = useMemo(() => {
    const totalCalories = foodLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
    const totalProtein = foodLogs.reduce((sum, l) => sum + (l.proteinG || 0), 0);
    const totalCarbs = foodLogs.reduce((sum, l) => sum + (l.carbsG || 0), 0);
    const totalFat = foodLogs.reduce((sum, l) => sum + (l.fatG || 0), 0);

    const loggedMeals = foodLogs.map((l) => ({
      type: (l.mealType === 'morning_snack' || l.mealType === 'afternoon_snack' ? 'snack' : l.mealType) as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      name: l.foodName,
      calories: l.calories,
      tags: [l.serving, `${l.proteinG}g Protein`],
    }));

    const suggested = [
      {
        name: dailyMealPlan.meals.lunch.title,
        desc: dailyMealPlan.meals.lunch.whyItWorks,
        calories: dailyMealPlan.meals.lunch.calories,
        benefits: 'High fiber and protein for steady metabolic energy',
        culturalTag: 'Pakistani Nutrition',
      },
      {
        name: dailyMealPlan.meals.dinner.title,
        desc: dailyMealPlan.meals.dinner.whyItWorks,
        calories: dailyMealPlan.meals.dinner.calories,
        benefits: 'Lean protein and restorative evening minerals',
        culturalTag: 'Traditional Balanced',
      },
    ];

    return {
      caloriesLogged: totalCalories,
      caloriesTarget: dailyNutritionTargets.calories,
      proteinGrams: Math.round(totalProtein),
      proteinTarget: dailyNutritionTargets.proteinG,
      carbsGrams: Math.round(totalCarbs),
      carbsTarget: dailyNutritionTargets.carbsG,
      fatGrams: Math.round(totalFat),
      fatTarget: dailyNutritionTargets.fatG,
      waterIntakeLiters: Math.round(waterLog.glasses * 0.25 * 10) / 10,
      waterTargetLiters: Math.round(dailyNutritionTargets.waterGlasses * 0.25 * 10) / 10,
      meals: loggedMeals.length > 0 ? loggedMeals : deriveNutritionFromProfile(userProfile).meals,
      suggestedMeals: suggested,
    };
  }, [foodLogs, dailyNutritionTargets, dailyMealPlan, waterLog.glasses, userProfile]);

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
        foodLogs,
        waterLog,
        dailyNutritionTargets,
        dailyMealPlan,
        dietLoading,
        logFoodItem,
        deleteFoodLogItem,
        incrementWater,
        decrementWater,
        refreshDietData,
        fitness,
        reports,
        reportStats,
        reportsLoading,
        uploadReport,
        deleteReport,
        refreshReports,
        careCircle,
        careCircleMembers,
        careCircleInvitations,
        careCircleLoading,
        addCareMember,
        updateMemberPermissions,
        revokeMemberAccess,
        deleteCareMember,
        refreshCareCircle,
        weeklySummary,
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
