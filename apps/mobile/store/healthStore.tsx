import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useAuth } from '../features/authentication';
import {
  fetchUserProfileFromDb,
  updateUserProfileInDb,
  fetchVerifiedDoctorsFromBackend,
  fetchCycleRecordsFromDb,
  fetchTodayWaterLogsFromDb,
  fetchMedicationsFromDb,
  fetchAppointmentsFromDb,
  fetchCareCircleFromDb,
  fetchMedicalReportsFromDb,
} from '../services/userService';
import {
  profileService,
  trackingService,
  assessmentService,
  medicationService,
  appointmentService,
  careCircleService,
  reportService,
  nutritionService,
  notificationService,
  ProgressiveAssessment,
} from '../services';


// ============================================================================
// TYPES
// ============================================================================

export type HealthPathway = 'female' | 'female_pcos' | 'male' | 'male_hypogonadism';

export interface ScreeningFactor {
  id: string;
  name: string;
  impactPercent: number;
  direction: 'increases_risk' | 'decreases_risk' | 'neutral';
  explanation: string;
  iconName: string;
}

export interface ScreeningAssessmentState {
  probabilityPercent: number;
  riskBand: 'Lower Risk' | 'Intermediate Risk' | 'Higher Risk';
  riskCategory: 'lower' | 'intermediate' | 'higher' | 'insufficient_data';
  tier: number;
  tierStatus: string;
  lastAssessedDate: string;
  topFactors: ScreeningFactor[];
  allFactors: ScreeningFactor[];
  isNonDiagnostic: boolean;
}

export interface CycleTrackingState {
  currentCycleDay: number;
  cycleLength: number;
  periodDuration: number;
  lastPeriodStartDate: string;
  nextPeriodDaysRemaining: number;
  nextPeriodExpectedDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  phase: 'Menstrual Phase' | 'Follicular Phase' | 'Ovulation Window' | 'Luteal Phase';
  regularity: 'regular' | 'irregular' | 'not_sure';
  flow: 'Light' | 'Moderate' | 'Heavy';
  missedPeriodsPerYear: '0' | '1-2' | '3+';
  notes: string;
}

export interface SymptomLogEntry {
  id: string;
  name: string;
  category: 'physical' | 'menstrual' | 'other';
  selected: boolean;
  intensity?: 'Mild' | 'Moderate' | 'Severe';
}

export interface SymptomCheckInState {
  loggedToday: boolean;
  lastUpdatedTime: string;
  symptoms: SymptomLogEntry[];
  intensity: 'Mild' | 'Moderate' | 'Severe';
  notes: string;
}

export interface MealItem {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories: number;
  proteinGrams: number;
  time: string;
  imageUrl?: string;
}

export interface NutritionState {
  caloriesConsumed: number;
  calorieTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatsConsumed: number;
  fatsTarget: number;
  meals: MealItem[];
  cuisineFilter: 'South Asian' | 'Vegetarian' | 'Low-cost';
}

export interface WaterLogEntry {
  id: string;
  time: string;
  amountMl: number;
}

export interface WaterState {
  consumedLiters: number;
  targetLiters: number;
  logs: WaterLogEntry[];
}

export interface MovementState {
  todayActivityMinutes: number;
  targetMinutes: number;
  todaySteps: number;
  weeklyMinutes: { day: string; minutes: number }[];
  currentGoalText: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  scheduledTime: string;
  instructions: string;
  status: 'pending' | 'taken' | 'skipped' | 'snoozed';
  pathway: 'female' | 'male' | 'all';
}

export interface AppointmentItem {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorPhoto?: string;
  specialty: string;
  clinicOrHospital: string;
  date: string;
  time: string;
  location: string;
  visitType: 'In-person' | 'Online Consultation';
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

export interface SpecialistDoctor {
  id: string;
  name: string;
  specialty: string;
  pathway: 'female' | 'male';
  hospital: string;
  experienceYears: number;
  patientsCount: number;
  rating: number;
  photoUrl?: string;
  areasOfExpertise: string[];
  about: string;
  isAvailableToday: boolean;
}

export interface CareCircleMember {
  id: string;
  name: string;
  role: 'Doctor' | 'Family Member' | 'Trusted Contact';
  relationship?: string;
  accessLevel: 'Full Access' | 'View Only' | 'Clinical Summary Only';
  photoUrl?: string;
  email?: string;
  verified?: boolean;
}

export interface ReportItem {
  id: string;
  title: string;
  date: string;
  type: 'Screening' | 'Lab' | 'Clinical Summary';
  status: 'Completed' | 'Uploaded' | 'Generated';
  tags?: string[];
  pdfUrl?: string;
}

export interface ClinicalLabRow {
  id: string;
  testName: string;
  category: 'Hormones' | 'Metabolic' | 'Other';
  value: string;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'High' | 'Low';
}

export interface UserProfileState {
  fullName: string;
  email: string;
  dateOfBirth: string;
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm?: number;
  gender?: string;
  pathway?: HealthPathway | null;
  isOnboarded?: boolean;
  bloodType?: string;
  maritalStatus: 'Single' | 'Married' | 'Prefer not to say';
  pregnancyStatus: 'Not Pregnant' | 'Currently Pregnant' | 'Trying to Conceive' | 'Prefer not to say';
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  profilePhotoUrl?: string;
  cycleLength?: string;
  periodDuration?: number;
  lastPeriodDate?: string;
  periodRegularity?: string;
  commonSymptoms?: string[];
  sleepHours?: number;
  fastFoodIntake?: string;
  regularExercise?: boolean;
  activityLevel?: string;
}

export interface NotificationSettingsState {
  medicationDue: boolean;
  periodPredicted: boolean;
  labUploadProcessed: boolean;
  appointmentTomorrow: boolean;
  screeningFollowUp: boolean;
  newRecommendation: boolean;
  appUpdates: boolean;
  marketingUpdates: boolean;
}

// ============================================================================
// CONTEXT VALUE INTERFACE
// ============================================================================

export interface RealtimeHealthStoreValue {
  // Pathway
  pathway: HealthPathway;
  isFemale: boolean;
  switchPathway: (p: HealthPathway) => void;

  // Profile & BMI
  profile: UserProfileState;
  bmi: number;
  bmiCategory: string;
  profileCompletionPercent: number;
  updateProfile: (partial: Partial<UserProfileState>) => void;
  updateProfileMetrics: (weightKg: number, heightCm: number) => void;

  // Screening
  screening: ScreeningAssessmentState;
  assessmentHistory: ProgressiveAssessment[];
  updateScreeningAssessment: (assessment: Partial<ScreeningAssessmentState>) => void;
  refreshAssessment: () => Promise<void>;

  // Cycle (Female)
  cycle: CycleTrackingState;
  updateCycle: (partial: Partial<CycleTrackingState>) => void;
  logPeriodStart: (dateString: string, flow?: 'Light' | 'Moderate' | 'Heavy') => void;

  // Symptoms
  symptoms: SymptomCheckInState;
  toggleSymptom: (symptomId: string) => void;
  setSymptomIntensity: (intensity: 'Mild' | 'Moderate' | 'Severe') => void;
  saveSymptomCheckIn: (notes: string) => void;

  // Nutrition
  nutrition: NutritionState;
  addMeal: (meal: Omit<MealItem, 'id'>) => void;
  deleteMeal: (id: string) => void;
  removeMeal: (id: string) => void;
  setCuisineFilter: (filter: 'South Asian' | 'Vegetarian' | 'Low-cost') => void;

  // Water
  water: WaterState;
  addWaterMl: (amountMl: number) => void;
  deleteWaterLog: (id: string) => void;
  resetWater: () => void;

  // Movement
  movement: MovementState;
  logActivity: (minutes: number, steps?: number) => void;

  // Medications
  medications: MedicationItem[];
  markMedicationStatus: (id: string, status: 'pending' | 'taken' | 'skipped' | 'snoozed') => void;
  addMedication: (med: Omit<MedicationItem, 'id'>) => void;

  // Appointments & Specialists
  appointments: AppointmentItem[];
  specialists: SpecialistDoctor[];
  bookAppointment: (appointment: Omit<AppointmentItem, 'id' | 'status'>) => void;
  rescheduleAppointment: (id: string, date: string, time: string) => void;
  cancelAppointment: (id: string) => void;

  // Care Circle
  careCircle: CareCircleMember[];
  addCareCircleMember: (member: CareCircleMember) => void;
  removeCareCircleMember: (id: string) => void;
  addToCareCircle: (member: Omit<CareCircleMember, 'id'>) => void;
  removeFromCareCircle: (id: string) => void;

  // Reports & Labs
  reports: ReportItem[];
  verifiedLabs: ClinicalLabRow[];
  updateVerifiedLab: (id: string, value: string) => void;
  confirmVerifiedLabs: (labs: ClinicalLabRow[]) => void;

  // Notifications
  notifications: NotificationSettingsState;
  updateNotificationSetting: (key: keyof NotificationSettingsState, value: boolean) => void;

  // Cross-user isolation reset
  resetHealthState: () => void;
}

const HealthContext = createContext<RealtimeHealthStoreValue | undefined>(undefined);

// ============================================================================
// CLEAN AUTHENTICATED USER INITIAL DEFAULTS (NO HARDCODED DEMO DATA)
// ============================================================================

const EMPTY_PROFILE: UserProfileState = {
  fullName: '',
  email: '',
  dateOfBirth: '',
  age: 0,
  heightCm: 0,
  weightKg: 0,
  waistCm: 0,
  maritalStatus: 'Prefer not to say',
  pregnancyStatus: 'Prefer not to say',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  isOnboarded: false,
  pathway: null,
  gender: '',
};

const EMPTY_SCREENING: ScreeningAssessmentState = {
  probabilityPercent: 0,
  riskBand: 'Lower Risk',
  riskCategory: 'lower',
  tier: 1,
  tierStatus: 'Not Assessed',
  lastAssessedDate: 'Not yet assessed',
  topFactors: [],
  allFactors: [],
  isNonDiagnostic: true,
};

const EMPTY_CYCLE: CycleTrackingState = {
  currentCycleDay: 0,
  cycleLength: 28,
  periodDuration: 5,
  lastPeriodStartDate: '',
  nextPeriodDaysRemaining: 0,
  nextPeriodExpectedDate: '',
  fertileWindowStart: '',
  fertileWindowEnd: '',
  phase: 'Menstrual Phase',
  regularity: 'regular',
  flow: 'Moderate',
  missedPeriodsPerYear: '0',
  notes: '',
};

const DEFAULT_SYMPTOM_LIST: SymptomLogEntry[] = [
  { id: 'acne', name: 'Acne', category: 'physical', selected: false },
  { id: 'hair_growth', name: 'Excess hair growth', category: 'physical', selected: false },
  { id: 'hair_loss', name: 'Hair thinning / loss', category: 'physical', selected: false },
  { id: 'bloating', name: 'Bloating', category: 'other', selected: false },
  { id: 'mood', name: 'Mood swings', category: 'other', selected: false },
  { id: 'cramps', name: 'Pelvic cramps', category: 'menstrual', selected: false },
  { id: 'fatigue', name: 'Fatigue / low stamina', category: 'other', selected: false },
  { id: 'skin_darkening', name: 'Skin darkening (Acanthosis)', category: 'physical', selected: false },
  { id: 'irregular_periods', name: 'Irregular cycles', category: 'menstrual', selected: false },
];

const EMPTY_SYMPTOMS: SymptomCheckInState = {
  loggedToday: false,
  lastUpdatedTime: 'Not logged today',
  intensity: 'Mild',
  notes: '',
  symptoms: DEFAULT_SYMPTOM_LIST,
};

const EMPTY_WATER: WaterState = {
  consumedLiters: 0,
  targetLiters: 2.5,
  logs: [],
};

const EMPTY_MOVEMENT: MovementState = {
  todayActivityMinutes: 0,
  targetMinutes: 60,
  todaySteps: 0,
  weeklyMinutes: [
    { day: 'Mon', minutes: 0 },
    { day: 'Tue', minutes: 0 },
    { day: 'Wed', minutes: 0 },
    { day: 'Thu', minutes: 0 },
    { day: 'Fri', minutes: 0 },
    { day: 'Sat', minutes: 0 },
    { day: 'Sun', minutes: 0 },
  ],
  currentGoalText: 'Daily activity goal',
};

const EMPTY_NUTRITION: NutritionState = {
  caloriesConsumed: 0,
  calorieTarget: 1800,
  proteinConsumed: 0,
  proteinTarget: 90,
  carbsConsumed: 0,
  carbsTarget: 180,
  fatsConsumed: 0,
  fatsTarget: 55,
  meals: [],
  cuisineFilter: 'South Asian',
};

const DEFAULT_NOTIFICATIONS: NotificationSettingsState = {
  medicationDue: true,
  periodPredicted: true,
  labUploadProcessed: true,
  appointmentTomorrow: true,
  screeningFollowUp: true,
  newRecommendation: true,
  appUpdates: false,
  marketingUpdates: false,
};

// ============================================================================
// PROVIDER COMPONENT — SCOPED TO AUTHENTICATED USER
// ============================================================================

export const RealtimeHealthStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [pathway, setPathway] = useState<HealthPathway>('female');
  const [profile, setProfile] = useState<UserProfileState>(EMPTY_PROFILE);
  const [screening, setScreening] = useState<ScreeningAssessmentState>(EMPTY_SCREENING);
  const [assessmentHistory, setAssessmentHistory] = useState<ProgressiveAssessment[]>([]);
  const [cycle, setCycle] = useState<CycleTrackingState>(EMPTY_CYCLE);
  const [symptoms, setSymptoms] = useState<SymptomCheckInState>(EMPTY_SYMPTOMS);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [cuisineFilter, setCuisineFilter] = useState<'South Asian' | 'Vegetarian' | 'Low-cost'>('South Asian');
  const [waterLogs, setWaterLogs] = useState<WaterLogEntry[]>([]);
  const [movementMinutes, setMovementMinutes] = useState<number>(0);
  const [movementSteps, setMovementSteps] = useState<number>(0);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDoctor[]>([]);
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [verifiedLabs, setVerifiedLabs] = useState<ClinicalLabRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettingsState>(DEFAULT_NOTIFICATIONS);

  const resetHealthState = useCallback(() => {
    setProfile(EMPTY_PROFILE);
    setScreening(EMPTY_SCREENING);
    setAssessmentHistory([]);
    setCycle(EMPTY_CYCLE);
    setSymptoms(EMPTY_SYMPTOMS);
    setMeals([]);
    setWaterLogs([]);
    setMovementMinutes(0);
    setMovementSteps(0);
    setMedications([]);
    setAppointments([]);
    setSpecialists([]);
    setCareCircle([]);
    setReports([]);
    setVerifiedLabs([]);
  }, []);

  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Synchronize store when authenticated user changes or logs out
  useEffect(() => {
    let isCurrent = true;

    if (!user || !isAuthenticated) {
      // User is logged out — reset all states immediately to guarantee zero cross-user leakage
      lastLoadedUserIdRef.current = null;
      resetHealthState();
      return;
    }

    const currentUserId = user.id;

    // Detect user switch: purge User A state before loading User B
    if (lastLoadedUserIdRef.current && lastLoadedUserIdRef.current !== currentUserId) {
      resetHealthState();
    }
    lastLoadedUserIdRef.current = currentUserId;

    // Set pathway from authenticated profile
    const initialPathway = (user.pathway as HealthPathway) || 'female';
    setPathway(initialPathway);

    // Seed profile baseline immediately with verified auth claims
    setProfile({
      ...EMPTY_PROFILE,
      fullName: user.fullName || '',
      email: user.email || '',
    });

    const token = user.accessToken;

    async function loadAuthenticatedData() {
      // 1. Fetch verified doctors from Django (public / authenticated)
      fetchVerifiedDoctorsFromBackend(initialPathway).then((docs) => {
        if (isCurrent && docs && docs.length > 0) {
          setSpecialists(docs);
        }
      });

      if (!token) return;

      try {
        // 2. Fetch user-owned private records in parallel
        const [
          dbProfile,
          assessmentData,
          assessmentHistoryData,
          cycleData,
          waterData,
          medsList,
          aptsList,
          circleList,
          reportsList,
          notifPrefs,
          recentSymptoms,
          fitnessLogs,
          foodLogsRes,
        ] = await Promise.all([
          fetchUserProfileFromDb(currentUserId, token),
          assessmentService.fetchActiveScreeningAssessment(currentUserId),
          assessmentService.fetchAssessmentHistory(currentUserId, initialPathway),
          fetchCycleRecordsFromDb(currentUserId, token),
          fetchTodayWaterLogsFromDb(currentUserId, token),
          fetchMedicationsFromDb(currentUserId, token),
          fetchAppointmentsFromDb(currentUserId, token),
          fetchCareCircleFromDb(currentUserId, token),
          fetchMedicalReportsFromDb(currentUserId, token),
          notificationService.getPreferences(token, currentUserId),
          trackingService.getRecentSymptoms(currentUserId, token, 15),
          trackingService.getTodayFitnessLogs(currentUserId, token),
          nutritionService.getFoodLogs(currentUserId, token),
        ]);

        if (!isCurrent) return;

        if (dbProfile) {
          if (dbProfile.pathway && dbProfile.pathway !== pathway) {
            setPathway(dbProfile.pathway as HealthPathway);
          }
          setProfile((prev) => ({
            ...prev,
            ...dbProfile,
            fullName: dbProfile.fullName || prev.fullName,
            email: dbProfile.email || prev.email,
          }));
        }

        if (assessmentData) {
          setScreening((prev) => ({
            ...prev,
            probabilityPercent: assessmentData.probability_percent || Math.round((assessmentData.probability || 0) * 100),
            riskBand: (assessmentData.risk_label || (assessmentData.risk_category === 'higher' ? 'Higher Risk' : assessmentData.risk_category === 'intermediate' ? 'Intermediate Risk' : 'Lower Risk')) as any,
            riskCategory: (assessmentData.risk_category || 'lower') as any,
            tier: assessmentData.assessment_level === 'tier_1_2_3' ? 3 : assessmentData.assessment_level === 'tier_1_2' ? 2 : 1,
            tierStatus: assessmentData.assessment_level ? `Tier ${assessmentData.assessment_level === 'tier_1_2_3' ? 3 : assessmentData.assessment_level === 'tier_1_2' ? 2 : 1} Complete` : 'Tier 1 Complete',
            lastAssessedDate: 'Recent Assessment',
            isNonDiagnostic: true,
            topFactors: (assessmentData.explanations || []).map((exp: any, idx: number) => ({
              id: `factor_${idx}`,
              name: exp.feature_name || exp.feature_key,
              impactPercent: exp.explanation_share_percent || Math.round(Math.abs(exp.impact_score || 0) * 100),
              direction: (exp.direction === 'increases_risk' || exp.direction === 'positive' || exp.direction === 'higher' ? 'increases_risk' : 'decreases_risk') as any,
              explanation: exp.description || exp.patient_explanation || '',
              iconName: 'pulse',
            })),
            allFactors: (assessmentData.explanations || []).map((exp: any, idx: number) => ({
              id: `factor_${idx}`,
              name: exp.feature_name || exp.feature_key,
              impactPercent: exp.explanation_share_percent || Math.round(Math.abs(exp.impact_score || 0) * 100),
              direction: (exp.direction === 'increases_risk' || exp.direction === 'positive' || exp.direction === 'higher' ? 'increases_risk' : 'decreases_risk') as any,
              explanation: exp.description || exp.patient_explanation || '',
              iconName: 'pulse',
            })),
          }));
        }

        if (assessmentHistoryData && assessmentHistoryData.length > 0) {
          setAssessmentHistory(assessmentHistoryData);
        }

        if (cycleData) {
          setCycle((prev) => ({ ...prev, ...cycleData }));
        }

        if (waterData) {
          setWaterLogs(waterData.logs || []);
        }

        if (medsList && medsList.length > 0) {
          setMedications(medsList);
        }

        if (aptsList && aptsList.length > 0) {
          setAppointments(aptsList);
        }

        if (circleList && circleList.length > 0) {
          setCareCircle(circleList);
        }

        if (reportsList && reportsList.length > 0) {
          setReports(reportsList);
        }

        if (notifPrefs?.data) {
          setNotifications(notifPrefs.data);
        }

        if (recentSymptoms?.data && recentSymptoms.data.length > 0) {
          const symptomMap = new Set(recentSymptoms.data.map((s: any) => s.symptomType));
          const latestOccurred = recentSymptoms.data[0]?.occurredAt;
          setSymptoms((prev) => ({
            ...prev,
            loggedToday: true,
            lastUpdatedTime: latestOccurred ? new Date(latestOccurred).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            symptoms: prev.symptoms.map((s) => ({
              ...s,
              selected: symptomMap.has(s.id),
            })),
          }));
        }

        if (fitnessLogs?.data && fitnessLogs.data.length > 0) {
          const totalMins = fitnessLogs.data.reduce((acc: number, curr: any) => acc + (Number(curr.durationMinutes) || 0), 0);
          setMovementMinutes(totalMins);
        }

        if (foodLogsRes?.data && foodLogsRes.data.length > 0) {
          const parsedMeals: MealItem[] = foodLogsRes.data.map((f: any) => ({
            id: f.id,
            name: f.foodName,
            mealType: (f.mealType?.toLowerCase() || 'lunch') as any,
            description: f.portionDescription || f.foodName,
            calories: f.calories,
            proteinGrams: f.proteinG,
            time: f.loggedAt ? new Date(f.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
          }));
          setMeals(parsedMeals);
        }
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error syncing authenticated health data:', err);
      }
    }

    loadAuthenticatedData();

    return () => {
      isCurrent = false;
    };
  }, [user?.id, user?.accessToken, isAuthenticated]);


  const isFemale = pathway === 'female' || pathway === 'female_pcos';

  // 1. BMI Calculation
  const bmi = useMemo(() => {
    if (!profile.heightCm || !profile.weightKg) return 0;
    const hM = profile.heightCm / 100;
    return parseFloat((profile.weightKg / (hM * hM)).toFixed(1));
  }, [profile.heightCm, profile.weightKg]);

  const bmiCategory = useMemo(() => {
    if (bmi <= 0) return 'Not recorded';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }, [bmi]);

  // 2. Profile Completeness Calculation
  const profileCompletionPercent = useMemo(() => {
    let fields = 0;
    let completed = 0;
    const check = (val: any) => {
      fields++;
      if (val !== undefined && val !== null && String(val).trim().length > 0 && String(val) !== '0') completed++;
    };
    check(profile.fullName);
    check(profile.email);
    check(profile.dateOfBirth);
    check(profile.heightCm);
    check(profile.weightKg);
    check(profile.waistCm);
    check(profile.emergencyContactName);
    check(profile.emergencyContactPhone);
    check(screening.probabilityPercent > 0 ? screening.probabilityPercent : null);
    check(cycle.currentCycleDay > 0 ? cycle.currentCycleDay : null);
    check(symptoms.loggedToday ? true : null);
    check(medications.length > 0 ? true : null);
    return Math.round((completed / fields) * 100);
  }, [profile, screening, cycle, symptoms, medications]);

  // 3. Nutrition Totals
  const nutrition: NutritionState = useMemo(() => {
    const caloriesConsumed = meals.reduce((sum, m) => sum + m.calories, 0);
    const proteinConsumed = meals.reduce((sum, m) => sum + m.proteinGrams, 0);
    const carbsConsumed = Math.round(caloriesConsumed * 0.45 / 4);
    const fatsConsumed = Math.round(caloriesConsumed * 0.28 / 9);

    return {
      caloriesConsumed,
      calorieTarget: isFemale ? 1800 : 2200,
      proteinConsumed,
      proteinTarget: isFemale ? 90 : 120,
      carbsConsumed,
      carbsTarget: isFemale ? 180 : 220,
      fatsConsumed,
      fatsTarget: isFemale ? 55 : 70,
      meals,
      cuisineFilter,
    };
  }, [meals, isFemale, cuisineFilter]);

  // 4. Water Totals
  const water: WaterState = useMemo(() => {
    const totalMl = waterLogs.reduce((sum, item) => sum + item.amountMl, 0);
    const consumedLiters = parseFloat((totalMl / 1000).toFixed(1));
    return {
      consumedLiters,
      targetLiters: isFemale ? 2.5 : 3.0,
      logs: waterLogs,
    };
  }, [waterLogs, isFemale]);

  // 5. Movement Totals
  const movement: MovementState = useMemo(() => {
    return {
      todayActivityMinutes: movementMinutes,
      targetMinutes: 60,
      todaySteps: movementSteps,
      weeklyMinutes: [
        { day: 'Mon', minutes: 0 },
        { day: 'Tue', minutes: 0 },
        { day: 'Wed', minutes: 0 },
        { day: 'Thu', minutes: 0 },
        { day: 'Fri', minutes: 0 },
        { day: 'Sat', minutes: 0 },
        { day: 'Sun', minutes: movementMinutes },
      ],
      currentGoalText: '60 min/day',
    };
  }, [movementMinutes, movementSteps]);

  // ---------------------------------------------------------------------------
  // ACTIONS / MUTATORS (STRICTLY BOUND TO USER)
  // ---------------------------------------------------------------------------

  const switchPathway = useCallback((p: HealthPathway) => {
    setPathway(p);
    const token = user?.accessToken;
    if (token && user?.id) {
      assessmentService.fetchActiveScreeningAssessment(user.id).then((assessmentData) => {
        if (assessmentData) {
          setScreening((prev) => ({
            ...prev,
            probabilityPercent: assessmentData.probability_percent || Math.round((assessmentData.probability || 0) * 100),
            riskBand: (assessmentData.risk_label || (assessmentData.risk_category === 'higher' ? 'Higher Risk' : assessmentData.risk_category === 'intermediate' ? 'Intermediate Risk' : 'Lower Risk')) as any,
            riskCategory: (assessmentData.risk_category || 'lower') as any,
            tier: assessmentData.assessment_level === 'tier_1_2_3' ? 3 : assessmentData.assessment_level === 'tier_1_2' ? 2 : 1,
            tierStatus: assessmentData.assessment_level ? `Tier ${assessmentData.assessment_level === 'tier_1_2_3' ? 3 : assessmentData.assessment_level === 'tier_1_2' ? 2 : 1} Complete` : 'Tier 1 Complete',
            lastAssessedDate: 'Recent Assessment',
            isNonDiagnostic: true,
          }));
        }
      });
      fetchVerifiedDoctorsFromBackend(p).then((docs) => {
        if (docs && docs.length > 0) {
          setSpecialists(docs);
        }
      });
    }
  }, [user?.accessToken, user?.id]);

  const updateProfile = useCallback((partial: Partial<UserProfileState>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...partial };
      if (user?.id && user?.accessToken) {
        updateUserProfileInDb(user.id, user.accessToken, partial).catch((err) => {
          console.warn('[BioPulse HealthStore] Error updating profile in DB:', err);
        });
      }
      return updated;
    });
  }, [user?.id, user?.accessToken]);

  const updateScreeningAssessment = useCallback((assessment: Partial<ScreeningAssessmentState>) => {
    setScreening((prev) => ({ ...prev, ...assessment }));
  }, []);

  const refreshAssessment = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [activeRes, histRes] = await Promise.all([
        assessmentService.fetchActiveScreeningAssessment(user.id),
        assessmentService.fetchAssessmentHistory(user.id, pathway),
      ]);
      if (activeRes) {
        setScreening((prev) => ({
          ...prev,
          probabilityPercent: activeRes.probability_percent || Math.round((activeRes.probability || 0) * 100),
          riskBand: (activeRes.risk_label || (activeRes.risk_category === 'higher' ? 'Higher Risk' : activeRes.risk_category === 'intermediate' ? 'Intermediate Risk' : 'Lower Risk')) as any,
          riskCategory: (activeRes.risk_category || 'lower') as any,
          tier: activeRes.assessment_level === 'tier_1_2_3' ? 3 : activeRes.assessment_level === 'tier_1_2' ? 2 : 1,
          tierStatus: activeRes.assessment_level ? `Tier ${activeRes.assessment_level === 'tier_1_2_3' ? 3 : activeRes.assessment_level === 'tier_1_2' ? 2 : 1} Complete` : 'Tier 1 Complete',
          lastAssessedDate: 'Recent Assessment',
          isNonDiagnostic: true,
          topFactors: (activeRes.explanations || []).map((exp: any, idx: number) => ({
            id: `factor_${idx}`,
            name: exp.feature_name || exp.feature_key,
            impactPercent: exp.explanation_share_percent || Math.round(Math.abs(exp.impact_score || 0) * 100),
            direction: (exp.direction === 'increases_risk' || exp.direction === 'positive' || exp.direction === 'higher' ? 'increases_risk' : 'decreases_risk') as any,
            explanation: exp.description || exp.patient_explanation || '',
            iconName: 'pulse',
          })),
          allFactors: (activeRes.explanations || []).map((exp: any, idx: number) => ({
            id: `factor_${idx}`,
            name: exp.feature_name || exp.feature_key,
            impactPercent: exp.explanation_share_percent || Math.round(Math.abs(exp.impact_score || 0) * 100),
            direction: (exp.direction === 'increases_risk' || exp.direction === 'positive' || exp.direction === 'higher' ? 'increases_risk' : 'decreases_risk') as any,
            explanation: exp.description || exp.patient_explanation || '',
            iconName: 'pulse',
          })),
        }));
      }
      if (histRes && histRes.length > 0) {
        setAssessmentHistory(histRes);
      }
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error refreshing assessment:', err);
    }
  }, [user?.id, pathway]);

  const updateCycle = useCallback((partial: Partial<CycleTrackingState>) => {
    setCycle((prev) => {
      const updated = { ...prev, ...partial };
      if (user?.id && user?.accessToken) {
        trackingService.logCycle(user.id, user.accessToken, {
          periodStartDate: updated.lastPeriodStartDate || new Date().toISOString().split('T')[0],
          cycleLength: updated.cycleLength,
          flow: updated.flow?.toLowerCase(),
          notes: updated.notes,
        }).catch((err) => {
          console.warn('[BioPulse HealthStore] Error syncing cycle update to DB:', err);
        });
      }
      return updated;
    });
  }, [user?.id, user?.accessToken]);

  const logPeriodStart = useCallback((dateString: string, flow: 'Light' | 'Moderate' | 'Heavy' = 'Moderate') => {
    setCycle((prev) => ({
      ...prev,
      lastPeriodStartDate: dateString,
      currentCycleDay: 1,
      phase: 'Menstrual Phase',
      flow,
      nextPeriodDaysRemaining: prev.cycleLength,
    }));
    if (user?.id && user?.accessToken) {
      trackingService.logCycle(user.id, user.accessToken, {
        periodStartDate: dateString,
        flow: flow.toLowerCase(),
        cycleLength: cycle.cycleLength || 28,
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error logging period in DB:', err);
      });
      updateUserProfileInDb(user.id, user.accessToken, {
        lastPeriodDate: dateString,
      }).catch(() => {});
    }
  }, [user?.id, user?.accessToken, cycle.cycleLength]);

  const toggleSymptom = useCallback((symptomId: string) => {
    setSymptoms((prev) => {
      const updatedList = prev.symptoms.map((s) => (s.id === symptomId ? { ...s, selected: !s.selected } : s));
      const target = updatedList.find((s) => s.id === symptomId);
      if (target?.selected && user?.id && user?.accessToken) {
        trackingService.logSymptom(user.id, user.accessToken, {
          symptomType: symptomId,
          severity: prev.intensity.toLowerCase(),
        }).catch((err) => {
          console.warn('[BioPulse HealthStore] Error persisting symptom check-in:', err);
        });
      }
      return {
        ...prev,
        loggedToday: true,
        lastUpdatedTime: 'Just now',
        symptoms: updatedList,
      };
    });
  }, [user?.id, user?.accessToken]);

  const setSymptomIntensity = useCallback((intensity: 'Mild' | 'Moderate' | 'Severe') => {
    setSymptoms((prev) => ({
      ...prev,
      intensity,
      lastUpdatedTime: 'Just now',
    }));
  }, []);

  const saveSymptomCheckIn = useCallback((notes: string) => {
    setSymptoms((prev) => {
      const selectedSymptoms = prev.symptoms.filter((s) => s.selected);
      if (user?.id && user?.accessToken && selectedSymptoms.length > 0) {
        Promise.all(
          selectedSymptoms.map((s) =>
            trackingService.logSymptom(user.id, user.accessToken!, {
              symptomType: s.id,
              severity: prev.intensity.toLowerCase(),
              notes,
            })
          )
        ).catch((err) => {
          console.warn('[BioPulse HealthStore] Error saving symptom check-in:', err);
        });
        updateUserProfileInDb(user.id, user.accessToken, {
          common_symptoms: selectedSymptoms.map((s) => s.id),
        }).catch(() => {});
      }
      return {
        ...prev,
        loggedToday: true,
        lastUpdatedTime: 'Just now',
        notes,
      };
    });
  }, [user?.id, user?.accessToken]);

  const addMeal = useCallback((meal: Omit<MealItem, 'id'>) => {
    const tempId = `meal_${Date.now()}`;
    const newMeal: MealItem = {
      ...meal,
      id: tempId,
    };
    setMeals((prev) => [...prev, newMeal]);
    if (user?.id && user?.accessToken) {
      nutritionService.logFood(user.id, user.accessToken, {
        mealType: meal.mealType,
        foodName: meal.name,
        portionDescription: meal.description,
        calories: meal.calories,
        proteinG: meal.proteinGrams,
        carbsG: Math.round(meal.calories * 0.45 / 4),
        fatG: Math.round(meal.calories * 0.28 / 9),
      }).then((res) => {
        if (res.data?.id) {
          setMeals((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: res.data!.id } : m))
          );
        }
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error persisting food log in DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const deleteMeal = useCallback((id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    if (user?.accessToken) {
      nutritionService.deleteFoodLog(id, user.accessToken).catch((err) => {
        console.warn('[BioPulse HealthStore] Error deleting food log in DB:', err);
      });
    }
  }, [user?.accessToken]);

  const setCuisineFilterAction = useCallback((filter: 'South Asian' | 'Vegetarian' | 'Low-cost') => {
    setCuisineFilter(filter);
  }, []);

  const addWaterMl = useCallback((amountMl: number) => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry: WaterLogEntry = {
      id: `water_${Date.now()}`,
      time: timeFormatted,
      amountMl,
    };
    setWaterLogs((prev) => {
      const nextLogs = [...prev, newEntry];
      if (user?.id && user?.accessToken) {
        const totalMl = nextLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
        const glasses = Math.round(totalMl / 250);
        trackingService.logWater(user.id, user.accessToken, glasses, isFemale ? 10 : 12).catch((err) => {
          console.warn('[BioPulse HealthStore] Error persisting water log to DB:', err);
        });
      }
      return nextLogs;
    });
  }, [user?.id, user?.accessToken, isFemale]);

  const deleteWaterLog = useCallback((id: string) => {
    setWaterLogs((prev) => {
      const nextLogs = prev.filter((w) => w.id !== id);
      if (user?.id && user?.accessToken) {
        const uid = user.id;
        const token = user.accessToken;
        trackingService.deleteWaterLog(id, token).catch(() => {
          const totalMl = nextLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
          const glasses = Math.round(totalMl / 250);
          trackingService.logWater(uid, token, glasses, isFemale ? 10 : 12).catch((err) => {
            console.warn('[BioPulse HealthStore] Error updating water log in DB:', err);
          });
        });
      }
      return nextLogs;
    });
  }, [user?.id, user?.accessToken, isFemale]);

  const resetWater = useCallback(() => {
    setWaterLogs([]);
    if (user?.id && user?.accessToken) {
      trackingService.logWater(user.id, user.accessToken, 0, isFemale ? 10 : 12).catch((err) => {
        console.warn('[BioPulse HealthStore] Error resetting water log in DB:', err);
      });
    }
  }, [user?.id, user?.accessToken, isFemale]);

  const removeMeal = deleteMeal;

  const updateProfileMetrics = useCallback((weightKg: number, heightCm: number) => {
    updateProfile({ weightKg, heightCm });
  }, [updateProfile]);

  const logActivity = useCallback((minutes: number, steps?: number) => {
    setMovementMinutes((prev) => prev + minutes);
    if (steps) {
      setMovementSteps((prev) => prev + steps);
    }
    if (user?.id && user?.accessToken) {
      trackingService.logActivity(user.id, user.accessToken, {
        activityType: 'general',
        activityName: 'Activity',
        durationMinutes: minutes,
        notes: steps ? `${steps} steps` : undefined,
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error persisting activity log to DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const markMedicationStatus = useCallback((id: string, status: 'pending' | 'taken' | 'skipped' | 'snoozed') => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, status } : med))
    );
    if (user?.id && user?.accessToken && (status === 'taken' || status === 'skipped')) {
      medicationService.logDose(user.id, user.accessToken, {
        medicationId: id,
        status,
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error logging dose to DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const addMedication = useCallback((med: Omit<MedicationItem, 'id'>) => {
    const tempId = `med_${Date.now()}`;
    const newMed: MedicationItem = {
      ...med,
      id: tempId,
    };
    setMedications((prev) => [...prev, newMed]);
    if (user?.id && user?.accessToken) {
      medicationService.addMedication(user.id, user.accessToken, {
        name: med.name,
        dose: med.dosage,
        scheduledTimes: [med.scheduledTime],
        instructions: med.instructions,
        pathway: med.pathway,
      }).then((res) => {
        if (res.data?.id) {
          setMedications((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: res.data!.id } : m))
          );
        }
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error adding medication to DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const bookAppointment = useCallback((appointment: Omit<AppointmentItem, 'id' | 'status'>) => {
    const tempId = `apt_${Date.now()}`;
    const newApt: AppointmentItem = {
      ...appointment,
      id: tempId,
      status: 'Upcoming',
    };
    setAppointments((prev) => [newApt, ...prev]);
    if (user?.id && user?.accessToken) {
      appointmentService.bookAppointment(user.id, user.accessToken, {
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        specialty: appointment.specialty,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        visitType: appointment.visitType,
      }).then((res) => {
        if (res.data?.id) {
          setAppointments((prev) =>
            prev.map((a) => (a.id === tempId ? { ...a, id: res.data!.id } : a))
          );
        }
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error creating appointment in DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const rescheduleAppointment = useCallback((id: string, date: string, time: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date, time } : a))
    );
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
    );
    if (user?.accessToken) {
      appointmentService.cancelAppointment(id, user.accessToken).catch((err) => {
        console.warn('[BioPulse HealthStore] Error cancelling appointment in DB:', err);
      });
    }
  }, [user?.accessToken]);

  const addCareCircleMember = useCallback((member: CareCircleMember) => {
    setCareCircle((prev) => [...prev, member]);
    if (user?.id && user?.accessToken) {
      careCircleService.inviteMember(user.id, user.accessToken, {
        name: member.name,
        email: member.email || `${member.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        role: member.role,
        relationship: member.relationship,
        accessLevel: member.accessLevel,
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error adding Care Circle member to DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const removeCareCircleMember = useCallback((id: string) => {
    setCareCircle((prev) => prev.filter((m) => m.id !== id));
    if (user?.accessToken) {
      careCircleService.revokeMember(id, user.accessToken).catch((err) => {
        console.warn('[BioPulse HealthStore] Error revoking Care Circle member in DB:', err);
      });
    }
  }, [user?.accessToken]);

  const addToCareCircle = useCallback((member: Omit<CareCircleMember, 'id'>) => {
    const tempId = `care_${Date.now()}`;
    const newMember: CareCircleMember = {
      ...member,
      id: tempId,
    };
    setCareCircle((prev) => [...prev, newMember]);
    if (user?.id && user?.accessToken) {
      careCircleService.inviteMember(user.id, user.accessToken, {
        name: member.name,
        email: member.email || `${member.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        role: member.role,
        relationship: member.relationship,
        accessLevel: member.accessLevel,
      }).then((res) => {
        if (res.data?.id) {
          setCareCircle((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: res.data!.id } : m))
          );
        }
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error adding Care Circle member to DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const removeFromCareCircle = removeCareCircleMember;

  const updateVerifiedLab = useCallback((id: string, value: string) => {
    setVerifiedLabs((prev) =>
      prev.map((lab) => (lab.id === id ? { ...lab, value } : lab))
    );
  }, []);

  const confirmVerifiedLabs = useCallback((labs: ClinicalLabRow[]) => {
    setVerifiedLabs(labs);
    const tempId = `rep_${Date.now()}`;
    const newReport: ReportItem = {
      id: tempId,
      title: 'Verified Lab Report (OCR Extracted)',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'Lab',
      status: 'Completed',
      tags: labs.map((l) => l.testName.split(' ')[0]),
    };
    setReports((prev) => [newReport, ...prev]);
    if (user?.id && user?.accessToken) {
      reportService.saveVerifiedReport(user.id, user.accessToken, {
        title: 'Verified Lab Report (OCR Extracted)',
        reportType: 'lab',
        reportDate: new Date().toISOString().split('T')[0],
        tests: labs.map((l) => ({
          testName: l.testName,
          category: l.category,
          value: l.value,
          unit: l.unit,
          referenceRange: l.referenceRange,
          status: l.status,
        })),
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error persisting verified report in DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

  const updateNotificationSetting = useCallback((key: keyof NotificationSettingsState, value: boolean) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: value };
      if (user?.id && user?.accessToken) {
        notificationService.updatePreferences(user.accessToken, user.id, { [key]: value }).catch((err) => {
          console.warn('[BioPulse HealthStore] Error saving notification preferences in DB:', err);
        });
      }
      return updated;
    });
  }, [user?.id, user?.accessToken]);


  const contextValue: RealtimeHealthStoreValue = {
    pathway,
    isFemale,
    switchPathway,
    profile,
    bmi,
    bmiCategory,
    profileCompletionPercent,
    updateProfile,
    updateProfileMetrics,
    screening,
    assessmentHistory,
    updateScreeningAssessment,
    refreshAssessment,
    cycle,
    updateCycle,
    logPeriodStart,
    symptoms,
    toggleSymptom,
    setSymptomIntensity,
    saveSymptomCheckIn,
    nutrition,
    addMeal,
    deleteMeal,
    removeMeal,
    setCuisineFilter: setCuisineFilterAction,
    water,
    addWaterMl,
    deleteWaterLog,
    resetWater,
    movement,
    logActivity,
    medications,
    markMedicationStatus,
    addMedication,
    appointments,
    specialists,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    careCircle,
    addCareCircleMember,
    removeCareCircleMember,
    addToCareCircle,
    removeFromCareCircle,
    reports,
    verifiedLabs,
    updateVerifiedLab,
    confirmVerifiedLabs,
    notifications,
    updateNotificationSetting,
    resetHealthState,
  };

  return (
    <HealthContext.Provider value={contextValue}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealthStore = (): RealtimeHealthStoreValue => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealthStore must be used within a RealtimeHealthStoreProvider');
  }
  return context;
};
