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
  ReportResultInput,
  ReportSummaryStats,
} from '../types/report';
import {
  DEFAULT_CARE_CIRCLE,
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
import { fitnessService } from '../services/fitnessService';
import { medicationService } from '../services/medicationService';
import { appointmentService } from '../services/appointmentService';
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
import type {
  FitnessLogEntry,
  FitnessLogInput,
  SuggestedMovementRoutine,
  WeeklyFitnessStats,
} from '../types/fitness';
import type {
  MedicationItem,
  MedicationInput,
  MedicationLogEntry,
  MedicationLogInput,
  TodayMedicationProgress,
  WeeklyAdherenceStats,
} from '../types/medication';
import type {
  AppointmentItem,
  AppointmentInput,
  AppointmentStatus,
  ConsultationQuestion,
  HealthSummarySnapshot,
  ConsultationBrief,
} from '../types/appointment';
import type { IntelligenceAssessment, ProgressiveAssessment } from '../types/intelligence';
import {
  fetchBackendAssessment,
  clearAssessmentCache,
  clearAllLocalAssessments,
  fetchActiveAssessment,
  fetchAssessmentHistory,
  submitTier1Assessment,
  submitTier2Assessment,
  submitMaleTier1Assessment,
  submitMaleTier2Assessment,
  uploadUltrasoundAssessment,
  clearTier2Assessment,
  fetchPatientClinicalState,
} from '../services/intelligenceService';

import { useAuth } from './AuthContext';
import type { AdaptiveHealthProfile, ADAMQuestionnaireState } from '../types/adaptiveScreening';
import { adaptiveProfileService } from '../services/adaptiveProfileService';
import { resolvePathway } from '../types/onboarding';
import {
  applyMutationResult,
  applyFetchActiveResult,
  applyExplicitReset,
  logAssessmentFlow,
  deduplicateHistory,
  type AssessmentSyncState,
} from '../utils/assessmentStateSync';

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
  fitnessLogs: FitnessLogEntry[];
  fitnessLoading: boolean;
  todayFitnessMinutes: number;
  todayFitnessActivities: FitnessLogEntry[];
  weeklyFitnessStats: WeeklyFitnessStats;
  suggestedFitnessRoutines: SuggestedMovementRoutine[];
  logFitnessActivity: (input: FitnessLogInput) => Promise<{ success: boolean; entry?: FitnessLogEntry; error?: string }>;
  updateFitnessActivity: (id: string, input: Partial<FitnessLogInput>) => Promise<{ success: boolean; entry?: FitnessLogEntry; error?: string }>;
  deleteFitnessActivity: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshFitnessData: () => Promise<void>;
  medications: MedicationItem[];
  medicationLogs: MedicationLogEntry[];
  medicationsLoading: boolean;
  todayMedicationProgress: TodayMedicationProgress;
  weeklyMedicationStats: WeeklyAdherenceStats;
  addMedication: (input: MedicationInput) => Promise<{ success: boolean; medication?: MedicationItem; error?: string }>;
  updateMedication: (id: string, input: Partial<MedicationInput>) => Promise<{ success: boolean; medication?: MedicationItem; error?: string }>;
  deleteMedication: (id: string) => Promise<{ success: boolean; error?: string }>;
  logMedicationDose: (input: MedicationLogInput) => Promise<{ success: boolean; log?: MedicationLogEntry; error?: string }>;
  deleteMedicationDose: (medicationId: string, scheduledFor: string, scheduledTime: string) => Promise<{ success: boolean }>;
  refreshMedications: () => Promise<void>;
  appointments: AppointmentItem[];
  upcomingAppointment: AppointmentItem | null;
  appointmentsLoading: boolean;
  bookAppointment: (input: AppointmentInput) => Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }>;
  updateAppointment: (id: string, input: Partial<AppointmentInput> & { status?: AppointmentStatus; providerNotes?: string }) => Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }>;
  cancelAppointment: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  completeAppointment: (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  deleteAppointment: (id: string) => Promise<{ success: boolean; error?: string }>;
  addDoctorQuestion: (appointmentId: string, question: string) => Promise<{ success: boolean; question?: ConsultationQuestion; error?: string }>;
  toggleDoctorQuestion: (appointmentId: string, questionId: string) => Promise<{ success: boolean }>;
  deleteDoctorQuestion: (appointmentId: string, questionId: string) => Promise<{ success: boolean }>;
  getPreConsultationSnapshot: () => HealthSummarySnapshot;
  getConsultationBrief: (appointment: AppointmentItem) => ConsultationBrief;
  refreshAppointments: () => Promise<void>;
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
  activeAssessment: ProgressiveAssessment | null;
  assessmentHistory: ProgressiveAssessment[];
  assessmentLoading: boolean;
  assessmentNotification: { message: string; type: 'success' | 'error' } | null;
  triggerAssessmentNotification: (message: string, type?: 'success' | 'error') => void;
  dismissAssessmentNotification: () => void;
  refreshActiveAssessment: (options?: { isExplicitReset?: boolean; force?: boolean }) => Promise<void>;
  submitTier1: (inputs?: Record<string, any>) => Promise<ProgressiveAssessment | null>;
  submitTier2: (inputs: Record<string, any>) => Promise<ProgressiveAssessment | null>;
  submitMaleTier1: (inputs?: Record<string, any>) => Promise<ProgressiveAssessment | null>;
  submitMaleTier2: (inputs: Record<string, any>) => Promise<ProgressiveAssessment | null>;
  clearTier2: (module?: string) => Promise<ProgressiveAssessment | null>;
  fetchClinicalState: (module?: string) => Promise<{ user_id: string; module: string; tier_1_inputs: Record<string, any>; tier_2_inputs: Record<string, any>; ultrasound_inputs: Record<string, any> } | null>;
  submitUltrasound: (imageFile: File, reportId?: string) => Promise<ProgressiveAssessment | null>;
  mlAssessment: IntelligenceAssessment | null;
  mlAssessmentLoading: boolean;
  mlAssessmentError: boolean;
  refreshMlAssessment: (force?: boolean) => Promise<void>;
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
  adaptiveProfile: AdaptiveHealthProfile;
  verifyReportBiomarker: (reportId: string, resultId: string) => Promise<void>;
  updateReportBiomarker: (
    reportId: string,
    resultId: string,
    updates: Partial<ReportResultInput>,
    markVerified?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  saveADAMResponses: (adamState: ADAMQuestionnaireState) => Promise<void>;
}

const REMINDERS_KEY = 'ovasense_user_reminders_v1';

const UserHealthContext = createContext<UserHealthContextType | undefined>(undefined);

export const UserHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user: authUser,
    loading: authLoading,
    userProfile,
    saveOnboardingProfile,
    updateUserProfile: authUpdateProfile,
    resetToDefaultProfile,
    logout,
  } = useAuth();

  const authoritativeUserId = authUser?.id || userProfile?.id;

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

  // Phase 4: Adaptive Health Profile Engine
  const activePathway = useMemo(() => {
    return resolvePathway(userProfile.gender, userProfile.pathway);
  }, [userProfile.gender, userProfile.pathway]);

  const adaptiveProfile: AdaptiveHealthProfile = useMemo(() => {
    return adaptiveProfileService.generateAdaptiveProfile(
      activePathway,
      userProfile,
      cycleRecords,
      symptomRecords,
      reports
    );
  }, [activePathway, userProfile, cycleRecords, symptomRecords, reports]);

  const verifyReportBiomarker = useCallback(
    async (reportId: string, resultId: string) => {
      if (!userProfile?.id) return;
      await reportService.verifyReportResult(userProfile.id, reportId, resultId);
      await refreshReports();
    },
    [userProfile?.id, refreshReports]
  );

  const updateReportBiomarker = useCallback(
    async (
      reportId: string,
      resultId: string,
      updates: Partial<ReportResultInput>,
      markVerified?: boolean
    ) => {
      if (!userProfile?.id) return { success: false, error: 'User must be signed in.' };
      const res = await reportService.updateReportResult(
        userProfile.id,
        reportId,
        resultId,
        updates,
        markVerified
      );
      await refreshReports();
      return res;
    },
    [userProfile?.id, refreshReports]
  );

  const saveADAMResponses = useCallback(
    async (adamState: ADAMQuestionnaireState) => {
      if (!userProfile) return;
      const q1 = adamState.questions.find((q) => q.questionNumber === 1)?.response;
      const q2 = adamState.questions.find((q) => q.questionNumber === 2)?.response;
      const q7 = adamState.questions.find((q) => q.questionNumber === 7)?.response;
      const q9 = adamState.questions.find((q) => q.questionNumber === 9)?.response;

      const updatedMens = {
        ...userProfile.mensHealth,
        sexDrive: q1 === true ? 'reduced' : userProfile.mensHealth?.sexDrive || 'normal',
        energyLevel: q2 === true ? 'low' : userProfile.mensHealth?.energyLevel || 'moderate',
        erectileDifficulties: q7 === true ? 'occasional' : userProfile.mensHealth?.erectileDifficulties || 'none',
        sleepQuality: q9 === true ? 'frequently_waking' : userProfile.mensHealth?.sleepQuality || 'restful',
      };

      await authUpdateProfile({
        mensHealth: updatedMens as any,
      });
      try {
        window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
      } catch {
        // ignore
      }
    },
    [userProfile, authUpdateProfile]
  );

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

  // --- Fitness & Movement Live State & Handlers ---
  const [fitnessLogs, setFitnessLogs] = useState<FitnessLogEntry[]>([]);
  const [fitnessLoading, setFitnessLoading] = useState<boolean>(true);

  const refreshFitnessData = useCallback(async (silent = false) => {
    if (!userProfile?.id) {
      setFitnessLoading(false);
      return;
    }
    if (!silent) {
      setFitnessLoading(true);
    }
    try {
      const res = await fitnessService.fetchFitnessLogs(userProfile.id);
      setFitnessLogs(res.logs || []);
    } catch (err) {
      console.warn('Error refreshing fitness data:', err);
    } finally {
      if (!silent) {
        setFitnessLoading(false);
      }
    }
  }, [userProfile?.id]);

  useEffect(() => {
    refreshFitnessData(false);

    let fitnessTimer: any = null;
    const handleFitnessUpdate = () => {
      clearTimeout(fitnessTimer);
      fitnessTimer = setTimeout(() => {
        refreshFitnessData(true);
      }, 150);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ovasense_fitness_updated', handleFitnessUpdate);
    }

    return () => {
      clearTimeout(fitnessTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ovasense_fitness_updated', handleFitnessUpdate);
      }
    };
  }, [refreshFitnessData]);

  const logFitnessActivity = useCallback(
    async (input: FitnessLogInput): Promise<{ success: boolean; entry?: FitnessLogEntry; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to log activity.' };
      }
      try {
        const res = await fitnessService.createFitnessLog(userProfile.id, input);
        if (res.success && res.entry) {
          setFitnessLogs((prev) => [res.entry!, ...prev]);
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to log fitness activity.' };
      }
    },
    [userProfile?.id]
  );

  const updateFitnessActivity = useCallback(
    async (id: string, input: Partial<FitnessLogInput>): Promise<{ success: boolean; entry?: FitnessLogEntry; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to update activity.' };
      }
      try {
        const res = await fitnessService.updateFitnessLog(userProfile.id, id, input);
        if (res.success && res.entry) {
          setFitnessLogs((prev) => prev.map((l) => (l.id === id ? res.entry! : l)));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to update activity.' };
      }
    },
    [userProfile?.id]
  );

  const deleteFitnessActivity = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete activity.' };
      }
      try {
        const res = await fitnessService.deleteFitnessLog(userProfile.id, id);
        if (res.success) {
          setFitnessLogs((prev) => prev.filter((l) => l.id !== id));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to delete activity.' };
      }
    },
    [userProfile?.id]
  );

  // Derived Today & Weekly Fitness Statistics
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayFitnessActivities = useMemo(() => {
    return fitnessLogs.filter((l) => l.occurredAt === todayStr);
  }, [fitnessLogs, todayStr]);

  const todayFitnessMinutes = useMemo(() => {
    return todayFitnessActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  }, [todayFitnessActivities]);

  const weeklyFitnessStats = useMemo(() => {
    return fitnessService.calculateWeeklyStats(fitnessLogs, 150);
  }, [fitnessLogs]);

  const suggestedFitnessRoutines = useMemo(() => {
    const activePhaseName = cycleStats.hasData && cycleStats.estimatedPhase
      ? cycleStats.estimatedPhase.name
      : userProfile.womensHealth?.currentPhase || 'Follicular Phase';
    return fitnessService.generateSuggestedRoutines(userProfile, activePhaseName, todayFitnessActivities);
  }, [userProfile, cycleStats, todayFitnessActivities]);

  // --- Medications & Adherence Live State & Handlers ---
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLogEntry[]>([]);
  const [medicationsLoading, setMedicationsLoading] = useState<boolean>(true);

  const refreshMedications = useCallback(async (silent = false) => {
    if (!userProfile?.id) {
      setMedicationsLoading(false);
      return;
    }
    if (!silent) {
      setMedicationsLoading(true);
    }
    try {
      const [medsRes, logsRes] = await Promise.all([
        medicationService.fetchMedications(userProfile.id),
        medicationService.fetchMedicationLogs(userProfile.id),
      ]);
      setMedications(medsRes.medications || []);
      setMedicationLogs(logsRes.logs || []);
    } catch (err) {
      console.warn('Error refreshing medications:', err);
    } finally {
      if (!silent) {
        setMedicationsLoading(false);
      }
    }
  }, [userProfile?.id]);

  useEffect(() => {
    refreshMedications(false);

    let medTimer: any = null;
    const handleMedUpdate = () => {
      clearTimeout(medTimer);
      medTimer = setTimeout(() => {
        refreshMedications(true);
      }, 150);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ovasense_medications_updated', handleMedUpdate);
    }

    return () => {
      clearTimeout(medTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ovasense_medications_updated', handleMedUpdate);
      }
    };
  }, [refreshMedications]);

  const addMedication = useCallback(
    async (input: MedicationInput): Promise<{ success: boolean; medication?: MedicationItem; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to add medicine.' };
      }
      try {
        const res = await medicationService.createMedication(userProfile.id, input);
        if (res.success && res.medication) {
          setMedications((prev) => [res.medication!, ...prev]);
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to add medicine.' };
      }
    },
    [userProfile?.id]
  );

  const updateMedication = useCallback(
    async (id: string, input: Partial<MedicationInput>): Promise<{ success: boolean; medication?: MedicationItem; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to update medicine.' };
      }
      try {
        const res = await medicationService.updateMedication(userProfile.id, id, input);
        if (res.success && res.medication) {
          setMedications((prev) => prev.map((m) => (m.id === id ? res.medication! : m)));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to update medicine.' };
      }
    },
    [userProfile?.id]
  );

  const deleteMedication = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete medicine.' };
      }
      try {
        const res = await medicationService.deleteMedication(userProfile.id, id);
        if (res.success) {
          setMedications((prev) => prev.filter((m) => m.id !== id));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to delete medicine.' };
      }
    },
    [userProfile?.id]
  );

  const logMedicationDose = useCallback(
    async (input: MedicationLogInput): Promise<{ success: boolean; log?: MedicationLogEntry; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to log dose.' };
      }
      try {
        const res = await medicationService.logMedicationDose(userProfile.id, input);
        if (res.success && res.log) {
          setMedicationLogs((prev) => {
            const idx = prev.findIndex(
              (l) =>
                l.medicationId === input.medicationId &&
                l.scheduledFor === input.scheduledFor &&
                l.scheduledTime === input.scheduledTime
            );
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = res.log!;
              return updated;
            }
            return [res.log!, ...prev];
          });
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to log dose.' };
      }
    },
    [userProfile?.id]
  );

  const deleteMedicationDose = useCallback(
    async (medicationId: string, scheduledFor: string, scheduledTime: string): Promise<{ success: boolean }> => {
      if (!userProfile?.id) return { success: false };
      try {
        const res = await medicationService.deleteMedicationDoseLog(
          userProfile.id,
          medicationId,
          scheduledFor,
          scheduledTime
        );
        if (res.success) {
          setMedicationLogs((prev) =>
            prev.filter(
              (l) =>
                !(
                  l.medicationId === medicationId &&
                  l.scheduledFor === scheduledFor &&
                  l.scheduledTime === scheduledTime
                )
            )
          );
        }
        return res;
      } catch {
        return { success: false };
      }
    },
    [userProfile?.id]
  );

  // Derived Today & Weekly Medication Progress & Adherence
  const todayMedicationProgress: TodayMedicationProgress = useMemo(() => {
    return medicationService.generateTodayProgress(medications, medicationLogs);
  }, [medications, medicationLogs]);

  const weeklyMedicationStats: WeeklyAdherenceStats = useMemo(() => {
    return medicationService.calculateWeeklyAdherence(medications, medicationLogs, 7);
  }, [medications, medicationLogs]);

  // --- Appointments & Consultations Live State & Handlers ---
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(true);

  const refreshAppointments = useCallback(async (silent = false) => {
    if (!userProfile?.id) {
      setAppointmentsLoading(false);
      return;
    }
    if (!silent) {
      setAppointmentsLoading(true);
    }
    try {
      const res = await appointmentService.fetchAppointments(userProfile.id);
      setAppointments(res.appointments || []);
    } catch (err) {
      console.warn('Error refreshing appointments:', err);
    } finally {
      if (!silent) {
        setAppointmentsLoading(false);
      }
    }
  }, [userProfile?.id]);

  useEffect(() => {
    refreshAppointments(false);

    let apptTimer: any = null;
    const handleApptUpdate = () => {
      clearTimeout(apptTimer);
      apptTimer = setTimeout(() => {
        refreshAppointments(true);
      }, 150);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ovasense_appointments_updated', handleApptUpdate);
    }

    return () => {
      clearTimeout(apptTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ovasense_appointments_updated', handleApptUpdate);
      }
    };
  }, [refreshAppointments]);

  const bookAppointment = useCallback(
    async (input: AppointmentInput): Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to book appointment.' };
      }
      try {
        const res = await appointmentService.createAppointment(userProfile.id, input);
        if (res.success && res.appointment) {
          setAppointments((prev) => [res.appointment!, ...prev]);
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to book appointment.' };
      }
    },
    [userProfile?.id]
  );

  const updateAppointment = useCallback(
    async (
      id: string,
      input: Partial<AppointmentInput> & { status?: AppointmentStatus; providerNotes?: string }
    ): Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to update appointment.' };
      }
      try {
        const res = await appointmentService.updateAppointment(userProfile.id, id, input);
        if (res.success && res.appointment) {
          setAppointments((prev) => prev.map((a) => (a.id === id ? res.appointment! : a)));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to update appointment.' };
      }
    },
    [userProfile?.id]
  );

  const cancelAppointment = useCallback(
    async (id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to cancel appointment.' };
      }
      try {
        const res = await appointmentService.cancelAppointment(userProfile.id, id, reason);
        if (res.success && res.appointment) {
          setAppointments((prev) => prev.map((a) => (a.id === id ? res.appointment! : a)));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to cancel appointment.' };
      }
    },
    [userProfile?.id]
  );

  const completeAppointment = useCallback(
    async (id: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to complete appointment.' };
      }
      try {
        const res = await appointmentService.completeAppointment(userProfile.id, id, notes);
        if (res.success && res.appointment) {
          setAppointments((prev) => prev.map((a) => (a.id === id ? res.appointment! : a)));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to complete appointment.' };
      }
    },
    [userProfile?.id]
  );

  const deleteAppointment = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!userProfile?.id) {
        return { success: false, error: 'User must be signed in to delete appointment.' };
      }
      try {
        const res = await appointmentService.deleteAppointment(userProfile.id, id);
        if (res.success) {
          setAppointments((prev) => prev.filter((a) => a.id !== id));
        }
        return res;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to delete appointment.' };
      }
    },
    [userProfile?.id]
  );

  const addDoctorQuestion = useCallback(
    async (appointmentId: string, question: string): Promise<{ success: boolean; question?: ConsultationQuestion; error?: string }> => {
      if (!userProfile?.id) return { success: false, error: 'Not signed in' };
      const res = await appointmentService.addConsultationQuestion(userProfile.id, appointmentId, question);
      if (res.success) {
        await refreshAppointments(true);
      }
      return res;
    },
    [userProfile?.id, refreshAppointments]
  );

  const toggleDoctorQuestion = useCallback(
    async (appointmentId: string, questionId: string): Promise<{ success: boolean }> => {
      if (!userProfile?.id) return { success: false };
      const res = await appointmentService.toggleQuestionDiscussed(userProfile.id, appointmentId, questionId);
      if (res.success) {
        await refreshAppointments(true);
      }
      return res;
    },
    [userProfile?.id, refreshAppointments]
  );

  const deleteDoctorQuestion = useCallback(
    async (appointmentId: string, questionId: string): Promise<{ success: boolean }> => {
      if (!userProfile?.id) return { success: false };
      const res = await appointmentService.deleteConsultationQuestion(userProfile.id, appointmentId, questionId);
      if (res.success) {
        await refreshAppointments(true);
      }
      return res;
    },
    [userProfile?.id, refreshAppointments]
  );

  // Derived Upcoming Appointment
  const upcomingAppointment: AppointmentItem | null = useMemo(() => {
    const scheduled = appointments.filter((a) => a.status === 'scheduled');
    if (scheduled.length === 0) return null;
    return scheduled[0];
  }, [appointments]);

  // Generate Pre-Consultation Snapshot from real live data
  const getPreConsultationSnapshot = useCallback((): HealthSummarySnapshot => {
    return appointmentService.generatePreConsultationSnapshot(
      userProfile,
      cycleStats,
      cycleRecords,
      symptomRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs
    );
  }, [
    userProfile,
    cycleStats,
    cycleRecords,
    symptomRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    medicationLogs,
  ]);

  const getConsultationBrief = useCallback(
    (appointment: AppointmentItem): ConsultationBrief => {
      const snapshot = getPreConsultationSnapshot();
      return appointmentService.generateConsultationBrief(appointment, userProfile, snapshot);
    },
    [getPreConsultationSnapshot, userProfile]
  );

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
      nextAppointment: m.role === 'doctor' && upcomingAppointment ? upcomingAppointment.scheduledDate : undefined,
      permissions: {
        symptoms: m.permissions.symptoms,
        reports: m.permissions.reports,
        medications: m.permissions.medications,
        dietFitness: m.permissions.diet || m.permissions.fitness,
        privateNotes: false,
      },
    }));
  }, [careCircleMembers, upcomingAppointment]);

  // Floating AI Assistant State
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [activeAiPrompt, setActiveAiPrompt] = useState<string | undefined>(undefined);

  // Custom user reminders list stored locally
  const [customReminders, setCustomReminders] = useState<TodayReminder[]>(() => {
    try {
      const raw = localStorage.getItem(REMINDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Dynamically synthesize all today reminders from live Medications, Hydration, Fitness, and Custom list
  const reminders: TodayReminder[] = useMemo(() => {
    const list: TodayReminder[] = [];

    // 1. Live Medication Doses
    todayMedicationProgress.doses.forEach((dose) => {
      list.push({
        id: `rem_med_${dose.medicationId}_${dose.scheduledTime}`,
        title: `${dose.medicationName} ${dose.dose}${dose.unit}`,
        time: dose.timeDisplay,
        category: 'medication',
        completed: dose.status === 'taken',
      });
    });

    // 2. Hydration Target
    const waterTargetGlasses = userProfile.lifestyle?.dailyWaterGlasses || 8;
    list.push({
      id: 'rem_hydration_daily',
      title: `Hydration: ${waterLog.glasses} / ${waterTargetGlasses} glasses`,
      time: 'Daily Goal',
      category: 'hydration',
      completed: waterLog.glasses >= waterTargetGlasses,
    });

    // 3. Movement Target
    list.push({
      id: 'rem_fitness_daily',
      title: todayFitnessMinutes >= 20 ? '✓ Daily Movement Completed' : '20 min Gentle Movement',
      time: 'Afternoon',
      category: 'fitness',
      completed: todayFitnessMinutes >= 20,
    });

    // 4. Upcoming Appointment Reminder
    if (upcomingAppointment) {
      list.push({
        id: `rem_appt_${upcomingAppointment.id}`,
        title: `Appointment: ${upcomingAppointment.providerName} (${upcomingAppointment.scheduledTime})`,
        time: upcomingAppointment.scheduledDate,
        category: 'appointment',
        completed: false,
      });
    }

    // 5. Custom Reminders
    customReminders.forEach((r) => {
      list.push(r);
    });

    return list;
  }, [todayMedicationProgress.doses, waterLog.glasses, userProfile.lifestyle?.dailyWaterGlasses, todayFitnessMinutes, upcomingAppointment, customReminders]);

  const toggleReminder = useCallback(
    async (id: string) => {
      const today = new Date().toISOString().split('T')[0];

      if (id.startsWith('rem_med_')) {
        const parts = id.replace('rem_med_', '').split('_');
        const medicationId = parts[0];
        const scheduledTime = parts[1] || '08:00';
        const dose = todayMedicationProgress.doses.find(
          (d) => d.medicationId === medicationId && d.scheduledTime === scheduledTime
        );

        if (dose?.status === 'taken') {
          await deleteMedicationDose(medicationId, today, scheduledTime);
        } else {
          await logMedicationDose({
            medicationId,
            scheduledFor: today,
            scheduledTime,
            status: 'taken',
            takenAt: new Date().toISOString(),
          });
        }
        return;
      }

      if (id === 'rem_hydration_daily') {
        await incrementWater();
        return;
      }

      setCustomReminders((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r));
        try {
          localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [todayMedicationProgress.doses, deleteMedicationDose, logMedicationDose, incrementWater]
  );

  const addReminder = useCallback(
    (title: string, time: string, category: TodayReminder['category']) => {
      const newRem: TodayReminder = {
        id: `rem_cust_${Date.now()}`,
        title,
        time,
        category,
        completed: false,
      };
      setCustomReminders((prev) => {
        const updated = [newRem, ...prev];
        try {
          localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  // Derived longitudinal Weekly Health Summary
  const weeklySummary: WeeklyHealthSummaryData = useMemo(() => {
    return careCircleService.generateWeeklyHealthSummary(
      userProfile?.id || 'default',
      cycleRecords,
      symptomRecords,
      reports,
      userProfile,
      reminders,
      upcomingAppointment
    );
  }, [userProfile, cycleRecords, symptomRecords, reports, reminders, upcomingAppointment]);

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

    const suggested: {
      name: string;
      desc: string;
      calories: number;
      benefits: string;
      culturalTag: string;
    }[] = [];

    if (dailyMealPlan?.meals?.lunch) {
      suggested.push({
        name: dailyMealPlan.meals.lunch.title,
        desc: dailyMealPlan.meals.lunch.whyItWorks,
        calories: dailyMealPlan.meals.lunch.calories,
        benefits: 'High fiber and protein for steady metabolic energy',
        culturalTag: 'Pakistani Nutrition',
      });
    }

    if (dailyMealPlan?.meals?.dinner) {
      suggested.push({
        name: dailyMealPlan.meals.dinner.title,
        desc: dailyMealPlan.meals.dinner.whyItWorks,
        calories: dailyMealPlan.meals.dinner.calories,
        benefits: 'Lean protein and restorative evening minerals',
        culturalTag: 'Traditional Balanced',
      });
    }

    // Fallback if lunch or dinner was excluded by active allergy constraints
    if (suggested.length === 0 && dailyMealPlan?.meals) {
      const anyMeal = Object.values(dailyMealPlan.meals).find((m) => m && m.title);
      if (anyMeal) {
        suggested.push({
          name: anyMeal.title,
          desc: anyMeal.whyItWorks,
          calories: anyMeal.calories,
          benefits: 'Nutrient-rich meal aligned with your active dietary profile',
          culturalTag: 'Nutritious Choice',
        });
      }
    }

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
      meals: loggedMeals,
      suggestedMeals: suggested,
    };
  }, [foodLogs, dailyNutritionTargets, dailyMealPlan, waterLog.glasses]);

  // Dynamically derive fitness snapshot object for Dashboard from LIVE fitness logs & suggestions
  const fitness: FitnessData = useMemo(() => {
    const todayWalkingMins = todayFitnessActivities
      .filter((a) => a.activityType === 'walking')
      .reduce((sum, a) => sum + a.durationMinutes, 0);

    const todayStrengthMins = todayFitnessActivities
      .filter((a) => a.activityType === 'strength')
      .reduce((sum, a) => sum + a.durationMinutes, 0);

    const topSuggestion = suggestedFitnessRoutines[0] || {
      title: 'Gentle Sunshine Walk',
      durationMinutes: 20,
      intensity: 'Gentle',
      focus: 'Blood Sugar Balance',
      whyThisPhase: 'Gentle movement supports steady glucose and mood.',
    };

    return {
      workoutsThisWeek: weeklyFitnessStats.totalActivitiesCount,
      weeklyGoal: 5,
      activeMinutesToday: todayFitnessMinutes,
      walkingMinutes: todayWalkingMins,
      strengthMinutes: todayStrengthMins,
      caloriesBurned: Math.round(todayFitnessMinutes * 4.5),
      suggestedMovement: {
        title: topSuggestion.title,
        duration: `${topSuggestion.durationMinutes} min`,
        intensity: (topSuggestion.intensity.toLowerCase() === 'moderate'
          ? 'moderate'
          : topSuggestion.intensity.toLowerCase() === 'restorative'
          ? 'restorative'
          : 'low') as 'low' | 'moderate' | 'restorative',
        reason: topSuggestion.whyThisPhase,
        phaseAlignment: cycleStats.hasData && cycleStats.estimatedPhase
          ? cycleStats.estimatedPhase.name
          : cycleMetrics.phaseName,
      },
    };
  }, [todayFitnessActivities, weeklyFitnessStats.totalActivitiesCount, todayFitnessMinutes, suggestedFitnessRoutines, cycleStats, cycleMetrics.phaseName]);

  // Dynamically derive Digital Twin insight
  const digitalTwinInsight: DigitalTwinInsight = useMemo(() => {
    const activePhaseName = cycleStats.hasData && cycleStats.estimatedPhase
      ? cycleStats.estimatedPhase.name
      : cycleMetrics.phaseName;
    return deriveInsightFromProfile(userProfile, activePhaseName);
  }, [userProfile, cycleStats, cycleMetrics.phaseName]);

  // ML Intelligence Assessment State
  const [mlAssessment, setMlAssessment] = useState<IntelligenceAssessment | null>(null);
  const [mlAssessmentLoading, setMlAssessmentLoading] = useState<boolean>(false);
  const [mlAssessmentError, setMlAssessmentError] = useState<boolean>(false);

  // PCOS-ML Progressive Assessment State & Sequence Refs
  const [activeAssessment, setActiveAssessment] = useState<ProgressiveAssessment | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<ProgressiveAssessment[]>([]);
  const [assessmentLoading, setAssessmentLoading] = useState<boolean>(true);
  const latestSequenceIdRef = React.useRef<number>(0);
  const activeProgressionIdRef = React.useRef<string | null>(null);

  const refreshActiveAssessment = useCallback(
    async (options?: { isExplicitReset?: boolean; force?: boolean }) => {
      if (authLoading) {
        setAssessmentLoading(true);
        return;
      }
      if (!authoritativeUserId) {
        setActiveAssessment(null);
        setMlAssessment(null);
        setAssessmentHistory([]);
        setAssessmentLoading(false);
        return;
      }

      const seqId = ++latestSequenceIdRef.current;
      setAssessmentLoading(true);
      const isMale = resolvePathway(userProfile?.gender, userProfile?.pathway) === 'male';
      const targetModule = isMale ? 'male_hypogonadism' : 'female_pcos';

      logAssessmentFlow({
        userId: authoritativeUserId,
        seqId,
        op: 'fetchActiveAssessment',
        level: activeAssessment?.assessment_level,
        hasAssessment: Boolean(activeAssessment),
      });

      try {
        const [active, history] = await Promise.all([
          fetchActiveAssessment(options?.force ?? true, targetModule, authoritativeUserId),
          fetchAssessmentHistory(targetModule),
        ]);

        const currentState: AssessmentSyncState = {
          activeAssessment,
          assessmentHistory,
          latestSequenceId: latestSequenceIdRef.current,
          activeProgressionId: activeProgressionIdRef.current,
        };

        const result = applyFetchActiveResult(
          currentState,
          seqId,
          active,
          history,
          {
            isExplicitReset: options?.isExplicitReset,
            authoritativeUserId,
          }
        );

        logAssessmentFlow({
          userId: authoritativeUserId,
          seqId,
          op: result.accepted ? 'setActiveAssessment' : `fetchActiveAssessment:${result.reason}`,
          assessmentId: result.nextState.activeAssessment?.id,
          level: result.nextState.activeAssessment?.assessment_level,
          hasAssessment: Boolean(result.nextState.activeAssessment),
        });

        if (result.accepted) {
          setActiveAssessment(result.nextState.activeAssessment);
          setMlAssessment(result.nextState.activeAssessment as unknown as IntelligenceAssessment);
          setAssessmentHistory(result.nextState.assessmentHistory);
          activeProgressionIdRef.current = result.nextState.activeProgressionId;
        } else {
          setAssessmentHistory(result.nextState.assessmentHistory);
        }
      } catch (err) {
        if (seqId === latestSequenceIdRef.current) {
          console.warn('[Assessment Context] Error fetching progressive assessment:', err);
        }
      } finally {
        if (seqId === latestSequenceIdRef.current) {
          setAssessmentLoading(false);
        }
      }
    },
    [authLoading, authoritativeUserId, userProfile?.gender, userProfile?.pathway, activeAssessment, assessmentHistory]
  );

  // Synchronize active progressive assessment when user authentication is ready
  useEffect(() => {
    if (authLoading) {
      setAssessmentLoading(true);
      return;
    }

    if (!authoritativeUserId) {
      setActiveAssessment(null);
      setMlAssessment(null);
      setAssessmentHistory([]);
      clearAssessmentCache();
      setAssessmentLoading(false);
      return;
    }

    refreshActiveAssessment();
  }, [authLoading, authoritativeUserId]);

  // Enforce zero cross-user assessment contamination when user switches or logs out
  useEffect(() => {
    if (!authoritativeUserId) {
      setActiveAssessment(null);
      setMlAssessment(null);
      setAssessmentHistory([]);
      clearAssessmentCache();
    }
  }, [authoritativeUserId]);

  // Transient in-memory assessment notification state (never persisted to DB, storage, or URL)
  const [assessmentNotification, setAssessmentNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const triggerAssessmentNotification = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setAssessmentNotification({ message, type });
    },
    []
  );

  const dismissAssessmentNotification = useCallback(() => {
    setAssessmentNotification(null);
  }, []);

  const submitMaleTier1 = useCallback(
    async (inputs: Record<string, any> = {}): Promise<ProgressiveAssessment | null> => {
      const mutationSeq = ++latestSequenceIdRef.current;
      setAssessmentLoading(true);
      logAssessmentFlow({
        userId: authoritativeUserId,
        seqId: mutationSeq,
        op: 'runTier1Assessment',
      });
      try {
        const res = await submitMaleTier1Assessment(inputs, authoritativeUserId);
        if (res) {
          const currentState: AssessmentSyncState = {
            activeAssessment,
            assessmentHistory,
            latestSequenceId: latestSequenceIdRef.current,
            activeProgressionId: activeProgressionIdRef.current,
          };
          const transition = applyMutationResult(currentState, mutationSeq, res, authoritativeUserId);
          if (transition.accepted) {
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setActiveAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setActiveAssessment(transition.nextState.activeAssessment);
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setMlAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setMlAssessment(transition.nextState.activeAssessment as unknown as IntelligenceAssessment);
            setAssessmentHistory(transition.nextState.assessmentHistory);
            activeProgressionIdRef.current = transition.nextState.activeProgressionId;
          }

          // Background sync for assessment history only (does not overwrite activeAssessment)
          fetchAssessmentHistory('male_hypogonadism')
            .then((history) => {
              setAssessmentHistory((prev) => deduplicateHistory(history, transition.nextState.activeAssessment || prev[0]));
            })
            .catch(() => {});

          triggerAssessmentNotification(
            'Updated Result: Your initial hypogonadism screening assessment has been generated.',
            'success'
          );
          try {
            window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
          } catch {
            // ignore
          }
        }
        return res;
      } finally {
        if (mutationSeq === latestSequenceIdRef.current) {
          setAssessmentLoading(false);
        }
      }
    },
    [authoritativeUserId, activeAssessment, assessmentHistory, triggerAssessmentNotification]
  );

  const submitMaleTier2 = useCallback(
    async (inputs: Record<string, any>): Promise<ProgressiveAssessment | null> => {
      const mutationSeq = ++latestSequenceIdRef.current;
      setAssessmentLoading(true);
      logAssessmentFlow({
        userId: authoritativeUserId,
        seqId: mutationSeq,
        op: 'runTier2Assessment',
      });
      try {
        const res = await submitMaleTier2Assessment(inputs, authoritativeUserId);
        if (res) {
          const currentState: AssessmentSyncState = {
            activeAssessment,
            assessmentHistory,
            latestSequenceId: latestSequenceIdRef.current,
            activeProgressionId: activeProgressionIdRef.current,
          };
          const transition = applyMutationResult(currentState, mutationSeq, res, authoritativeUserId);
          if (transition.accepted) {
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setActiveAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setActiveAssessment(transition.nextState.activeAssessment);
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setMlAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setMlAssessment(transition.nextState.activeAssessment as unknown as IntelligenceAssessment);
            setAssessmentHistory(transition.nextState.assessmentHistory);
            activeProgressionIdRef.current = transition.nextState.activeProgressionId;
          }

          fetchAssessmentHistory('male_hypogonadism')
            .then((history) => {
              setAssessmentHistory((prev) => deduplicateHistory(history, transition.nextState.activeAssessment || prev[0]));
            })
            .catch(() => {});

          triggerAssessmentNotification(
            'Updated Result: Your hypogonadism screening assessment has been updated with clinical evidence.',
            'success'
          );
          try {
            window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
          } catch {
            // ignore
          }
        }
        return res;
      } finally {
        if (mutationSeq === latestSequenceIdRef.current) {
          setAssessmentLoading(false);
        }
      }
    },
    [authoritativeUserId, activeAssessment, assessmentHistory, triggerAssessmentNotification]
  );

  const submitTier1 = useCallback(
    async (inputs: Record<string, any> = {}): Promise<ProgressiveAssessment | null> => {
      if (resolvePathway(userProfile?.gender, userProfile?.pathway) === 'male') {
        return submitMaleTier1(inputs);
      }
      const mutationSeq = ++latestSequenceIdRef.current;
      setAssessmentLoading(true);
      logAssessmentFlow({
        userId: authoritativeUserId,
        seqId: mutationSeq,
        op: 'runTier1Assessment',
      });
      try {
        const res = await submitTier1Assessment(inputs, authoritativeUserId);
        if (res) {
          const currentState: AssessmentSyncState = {
            activeAssessment,
            assessmentHistory,
            latestSequenceId: latestSequenceIdRef.current,
            activeProgressionId: activeProgressionIdRef.current,
          };
          const transition = applyMutationResult(currentState, mutationSeq, res, authoritativeUserId);
          if (transition.accepted) {
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setActiveAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setActiveAssessment(transition.nextState.activeAssessment);
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setMlAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setMlAssessment(transition.nextState.activeAssessment as unknown as IntelligenceAssessment);
            setAssessmentHistory(transition.nextState.assessmentHistory);
            activeProgressionIdRef.current = transition.nextState.activeProgressionId;
          }

          // Background sync for assessment history only (does not overwrite activeAssessment)
          fetchAssessmentHistory('female_pcos')
            .then((history) => {
              setAssessmentHistory((prev) => deduplicateHistory(history, transition.nextState.activeAssessment || prev[0]));
            })
            .catch(() => {});

          triggerAssessmentNotification(
            'Updated Result: Your initial screening assessment has been generated.',
            'success'
          );
          try {
            window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
          } catch {
            // ignore
          }
        }
        return res;
      } finally {
        if (mutationSeq === latestSequenceIdRef.current) {
          setAssessmentLoading(false);
        }
      }
    },
    [userProfile?.gender, userProfile?.pathway, authoritativeUserId, submitMaleTier1, activeAssessment, assessmentHistory, triggerAssessmentNotification]
  );

  const submitTier2 = useCallback(
    async (inputs: Record<string, any>): Promise<ProgressiveAssessment | null> => {
      if (resolvePathway(userProfile?.gender, userProfile?.pathway) === 'male') {
        return submitMaleTier2(inputs);
      }

      const mutationSeq = ++latestSequenceIdRef.current;
      setAssessmentLoading(true);
      logAssessmentFlow({
        userId: authoritativeUserId,
        seqId: mutationSeq,
        op: 'runTier2Assessment',
      });
      try {
        const res = await submitTier2Assessment(inputs, authoritativeUserId);
        if (res) {
          const currentState: AssessmentSyncState = {
            activeAssessment,
            assessmentHistory,
            latestSequenceId: latestSequenceIdRef.current,
            activeProgressionId: activeProgressionIdRef.current,
          };
          const transition = applyMutationResult(currentState, mutationSeq, res, authoritativeUserId);
          if (transition.accepted) {
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setActiveAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setActiveAssessment(transition.nextState.activeAssessment);
            logAssessmentFlow({
              userId: authoritativeUserId,
              seqId: mutationSeq,
              op: 'setMlAssessment',
              assessmentId: transition.nextState.activeAssessment?.id,
              level: transition.nextState.activeAssessment?.assessment_level,
              hasAssessment: true,
            });
            setMlAssessment(transition.nextState.activeAssessment as unknown as IntelligenceAssessment);
            setAssessmentHistory(transition.nextState.assessmentHistory);
            activeProgressionIdRef.current = transition.nextState.activeProgressionId;
          }

          fetchAssessmentHistory('female_pcos')
            .then((history) => {
              setAssessmentHistory((prev) => deduplicateHistory(history, transition.nextState.activeAssessment || prev[0]));
            })
            .catch(() => {});

          triggerAssessmentNotification(
            'Updated Result: Your assessment has been updated using additional clinical evidence.',
            'success'
          );
          try {
            window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
          } catch {
            // ignore
          }
        }
        return res;
      } finally {
        if (mutationSeq === latestSequenceIdRef.current) {
          setAssessmentLoading(false);
        }
      }
    },
    [userProfile?.gender, userProfile?.pathway, authoritativeUserId, submitMaleTier2, activeAssessment, assessmentHistory, triggerAssessmentNotification]
  );

  const submitUltrasound = useCallback(
    async (imageFile: File, reportId?: string): Promise<ProgressiveAssessment | null> => {
      const mutationSeq = ++latestSequenceIdRef.current;
      setAssessmentLoading(true);
      logAssessmentFlow({
        userId: authoritativeUserId,
        seqId: mutationSeq,
        op: 'runUltrasoundAssessment',
      });
      try {
        const res = await uploadUltrasoundAssessment(imageFile, reportId, authoritativeUserId);
        if (res) {
          const currentState: AssessmentSyncState = {
            activeAssessment,
            assessmentHistory,
            latestSequenceId: latestSequenceIdRef.current,
            activeProgressionId: activeProgressionIdRef.current,
          };
          if (res.is_active) {
            const transition = applyMutationResult(currentState, mutationSeq, res, authoritativeUserId);
            if (transition.accepted) {
              logAssessmentFlow({
                userId: authoritativeUserId,
                seqId: mutationSeq,
                op: 'setActiveAssessment',
                assessmentId: transition.nextState.activeAssessment?.id,
                level: transition.nextState.activeAssessment?.assessment_level,
                hasAssessment: true,
              });
              setActiveAssessment(transition.nextState.activeAssessment);
              logAssessmentFlow({
                userId: authoritativeUserId,
                seqId: mutationSeq,
                op: 'setMlAssessment',
                assessmentId: transition.nextState.activeAssessment?.id,
                level: transition.nextState.activeAssessment?.assessment_level,
                hasAssessment: true,
              });
              setMlAssessment(transition.nextState.activeAssessment as unknown as IntelligenceAssessment);
              setAssessmentHistory(transition.nextState.assessmentHistory);
              activeProgressionIdRef.current = transition.nextState.activeProgressionId;
            }
          }

          fetchAssessmentHistory('female_pcos')
            .then((history) => {
              setAssessmentHistory(deduplicateHistory(history, res));
            })
            .catch(() => {});

          if (res.is_active && (res.assessment_level === 'tier_1_2' || res.assessment_level === 'tier_1_2_3')) {
            triggerAssessmentNotification(
              'Updated Result: Your assessment has been updated using additional clinical evidence.',
              'success'
            );
          }
          try {
            window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
          } catch {
            // ignore
          }
        }
        return res;
      } finally {
        if (mutationSeq === latestSequenceIdRef.current) {
          setAssessmentLoading(false);
        }
      }
    },
    [authoritativeUserId, activeAssessment, assessmentHistory, triggerAssessmentNotification]
  );

  const clearTier2 = useCallback(
    async (module?: string): Promise<ProgressiveAssessment | null> => {
      const pathway = resolvePathway(userProfile?.gender, userProfile?.pathway);
      const mod = module || (pathway === 'male' ? 'male_hypogonadism' : 'female_pcos');
      const resetSeq = ++latestSequenceIdRef.current;
      setAssessmentLoading(true);
      try {
        const res = await clearTier2Assessment(mod, authoritativeUserId);
        if (res) {
          const currentState: AssessmentSyncState = {
            activeAssessment,
            assessmentHistory,
            latestSequenceId: latestSequenceIdRef.current,
            activeProgressionId: activeProgressionIdRef.current,
          };
          const transition = applyExplicitReset(currentState, resetSeq, res, authoritativeUserId);
          logAssessmentFlow({
            userId: authoritativeUserId,
            seqId: resetSeq,
            op: 'setActiveAssessment',
            assessmentId: transition.nextState.activeAssessment?.id,
            level: transition.nextState.activeAssessment?.assessment_level,
            hasAssessment: Boolean(transition.nextState.activeAssessment),
          });
          setActiveAssessment(transition.nextState.activeAssessment);
          logAssessmentFlow({
            userId: authoritativeUserId,
            seqId: resetSeq,
            op: 'setMlAssessment',
            assessmentId: transition.nextState.activeAssessment?.id,
            level: transition.nextState.activeAssessment?.assessment_level,
            hasAssessment: Boolean(transition.nextState.activeAssessment),
          });
          setMlAssessment(transition.nextState.activeAssessment as unknown as IntelligenceAssessment);
          setAssessmentHistory(transition.nextState.assessmentHistory);
          activeProgressionIdRef.current = transition.nextState.activeProgressionId;

          triggerAssessmentNotification(
            'Tier 2 clinical data has been cleared. Assessment reverted to Tier 1 screening.',
            'success'
          );
          try {
            window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
          } catch {
            // ignore
          }
        }
        return res;
      } finally {
        if (resetSeq === latestSequenceIdRef.current) {
          setAssessmentLoading(false);
        }
      }
    },
    [userProfile?.gender, userProfile?.pathway, authoritativeUserId, activeAssessment, assessmentHistory, triggerAssessmentNotification]
  );

  const fetchClinicalState = useCallback(
    async (module?: string) => {
      const pathway = resolvePathway(userProfile?.gender, userProfile?.pathway);
      const mod = module || (pathway === 'male' ? 'male_hypogonadism' : 'female_pcos');
      return await fetchPatientClinicalState(mod);
    },
    [userProfile]
  );

  const refreshMlAssessment = useCallback(
    async (force = false) => {
      if (!authoritativeUserId) return;
      setMlAssessmentLoading(true);
      setMlAssessmentError(false);
      try {
        const clientPayload = {
          userProfile,
          cycleRecords,
          symptomRecords,
          foodLogs,
          fitnessLogs,
        };
        const result = await fetchBackendAssessment(force, clientPayload);
        if (result) {
          setMlAssessment(result);
        } else {
          setMlAssessmentError(true);
        }
      } catch (err) {
        console.warn('[OvaSense ML Context] Assessment error:', err);
        setMlAssessmentError(true);
      } finally {
        setMlAssessmentLoading(false);
      }
    },
    [authoritativeUserId, userProfile, cycleRecords, symptomRecords, foodLogs, fitnessLogs]
  );

  // Automatically trigger assessment on profile load or when health factors change
  useEffect(() => {
    if (authoritativeUserId) {
      refreshMlAssessment(false);
    }
  }, [refreshMlAssessment, authoritativeUserId]);

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
      const res = await saveOnboardingProfile(data);
      if (res.success) {
        // Bridge onboarding intake medications into structured public.medications table
        const targetUserId = userProfile?.id || data.id;
        if (targetUserId && data.medical?.medications && Array.isArray(data.medical.medications)) {
          try {
            for (const med of (data.medical.medications as any[])) {
              const medName = typeof med === 'string' ? (med as string).trim() : (med && typeof med === 'object' && 'name' in med ? String((med as any).name).trim() : '');
              if (medName) {
                const dose = typeof med === 'object' && (med as any).dosage ? String((med as any).dosage).trim() : '';
                const frequency = typeof med === 'object' && (med as any).frequency ? String((med as any).frequency).trim() : 'daily';
                const validFrequencies = ['once_daily', 'twice_daily', 'three_times_daily', 'every_other_day', 'as_needed'];
                const freqCandidate = frequency.toLowerCase().replace(/[-\s]+/g, '_');
                const safeFreq = validFrequencies.includes(freqCandidate) ? (freqCandidate as any) : 'once_daily';
                await medicationService.createMedication(targetUserId, {
                  name: medName,
                  dose: dose || 'Standard',
                  unit: 'mg',
                  frequency: safeFreq,
                  scheduledTimes: ['08:00'],
                  isActive: true,
                });
              }
            }
          } catch (bridgeErr) {
            console.warn('Could not bridge onboarding medications to public.medications:', bridgeErr);
          }
        }
        // Force refresh assessment upon completing onboarding with new data
        try {
          await refreshMlAssessment(true);
        } catch {
          // ignore
        }
        try {
          window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
        } catch {
          // ignore
        }
      }
      return res;
    },
    [saveOnboardingProfile, refreshMlAssessment, userProfile?.id]
  );

  /**
   * Deep updates user profile fields and updates Supabase.
   */
  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
      const res = await authUpdateProfile(data);
      if (res.success) {
        try {
          await refreshMlAssessment(true);
        } catch (err) {
          console.warn('[UserHealthContext] Assessment refresh after profile update error:', err);
        }
        try {
          window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
        } catch {
          // ignore environment without window
        }
      }
      return res;
    },
    [authUpdateProfile, refreshMlAssessment]
  );

  const clearUserData = useCallback(() => {
    clearAssessmentCache();
    clearAllLocalAssessments();
    setActiveAssessment(null);
    setMlAssessment(null);
    setAssessmentHistory([]);
    logout();
  }, [logout]);

  const toggleAiChat = () => setIsAiChatOpen((prev) => !prev);
  const openAiChatWithPrompt = (prompt?: string) => {
    setActiveAiPrompt(prompt);
    setIsAiChatOpen(true);
  };
  const closeAiChat = () => setIsAiChatOpen(false);

  const effectiveAssessmentLoading = authLoading || assessmentLoading;

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
        fitnessLogs,
        fitnessLoading,
        todayFitnessMinutes,
        todayFitnessActivities,
        weeklyFitnessStats,
        suggestedFitnessRoutines,
        logFitnessActivity,
        updateFitnessActivity,
        deleteFitnessActivity,
        refreshFitnessData,
        medications,
        medicationLogs,
        medicationsLoading,
        todayMedicationProgress,
        weeklyMedicationStats,
        addMedication,
        updateMedication,
        deleteMedication,
        logMedicationDose,
        deleteMedicationDose,
        refreshMedications,
        appointments,
        upcomingAppointment,
        appointmentsLoading,
        bookAppointment,
        updateAppointment,
        cancelAppointment,
        completeAppointment,
        deleteAppointment,
        addDoctorQuestion,
        toggleDoctorQuestion,
        deleteDoctorQuestion,
        getPreConsultationSnapshot,
        getConsultationBrief,
        refreshAppointments,
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
        activeAssessment,
        assessmentHistory,
        assessmentLoading: effectiveAssessmentLoading,
        assessmentNotification,
        triggerAssessmentNotification,
        dismissAssessmentNotification,
        refreshActiveAssessment,
        submitTier1,
        submitTier2,
        submitMaleTier1,
        submitMaleTier2,
        clearTier2,
        fetchClinicalState,
        submitUltrasound,
        mlAssessment,
        mlAssessmentLoading,
        mlAssessmentError,
        refreshMlAssessment,
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
        adaptiveProfile,
        verifyReportBiomarker,
        updateReportBiomarker,
        saveADAMResponses,
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
