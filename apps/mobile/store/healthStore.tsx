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
  measurementService,
  appointmentService,
  careCircleService,
  reportService,
  nutritionService,
  notificationService,
  MobileNotificationItem,
  ProgressiveAssessment,
  formatShapFactorForPatient,
  formatAssessmentDate,
  resolveRiskBand,
  getFeatureIconName,
  CycleRecord,
  SymptomRecord,
  LogCycleInput,
  LogSymptomInput,
  FitnessLog,
  DoseLogEntity,
  MetricObservation,
  calculateAuthoritativeBmi,
  getBmiCategory,
  longitudinalService,
  MetricTrendSummary,
  TimeRangeOption,
} from '../services';


// ============================================================================
// TYPES
// ============================================================================

export type HealthPathway = 'female' | 'female_pcos' | 'male' | 'male_hypogonadism';

export interface ScreeningFactor {
  id: string;
  featureKey?: string;
  name: string;
  humanLabel?: string;
  patientLabel?: string;
  patientValue?: string;
  impactScore?: number;
  impactPercent: number;
  explanationSharePercent?: number;
  relativeInfluence?: number;
  direction: 'increases_risk' | 'decreases_risk' | 'neutral';
  explanation: string;
  patientExplanation?: string;
  iconName: string;
}

export interface ScreeningAssessmentState {
  assessmentId?: string;
  patientId?: string;
  module?: string;
  probability?: number;
  probabilityPercent: number;
  threshold?: number;
  riskBand: 'Lower Risk' | 'Intermediate Risk' | 'Higher Risk' | string;
  riskCategory: 'lower' | 'intermediate' | 'higher' | 'insufficient_data';
  tier: number;
  tierStatus: string;
  lastAssessedDate: string;
  createdAt?: string;
  topFactors: ScreeningFactor[];
  allFactors: ScreeningFactor[];
  isNonDiagnostic: boolean;
  disclaimer?: string;
  modelName?: string;
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
  dose?: string;
  unit?: string;
  scheduledTime: string;
  scheduledTimes?: string[];
  frequency?: string;
  startDate?: string;
  endDate?: string | null;
  instructions: string;
  notes?: string;
  status: 'pending' | 'taken' | 'skipped' | 'snoozed';
  isActive?: boolean;
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
  appointmentType?: 'consultation' | 'follow_up' | 'lab_review' | 'routine_check' | 'other';
  reason?: string;
  patientNotes?: string;
  durationMinutes?: number;
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
  accessLevel: 'Full Access' | 'View Only' | 'Clinical Summary Only' | string;
  photoUrl?: string;
  email?: string;
  verified?: boolean;
  permissions?: Record<string, boolean>;
  status?: 'pending' | 'active' | 'revoked';
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

export interface PendingOcrReport {
  id?: string;
  title: string;
  fileName?: string;
  fileUri?: string;
  mimeType?: string;
  results: {
    id?: string;
    testName: string;
    category?: string;
    value: string;
    unit: string;
    referenceRange: string;
    status?: string;
    confidence?: number;
    requiresReview?: boolean;
  }[];
  rawSnippet?: string;
  requiresReview?: boolean;
  disclaimer?: string;
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

  // Screening & Longitudinal
  screening: ScreeningAssessmentState;
  assessmentHistory: ProgressiveAssessment[];
  updateScreeningAssessment: (assessment: Partial<ScreeningAssessmentState>) => void;
  refreshAssessment: () => Promise<void>;
  loadAssessmentHistory: (pathwayOverride?: HealthPathway) => Promise<ProgressiveAssessment[]>;
  deleteAssessmentRecord: (assessmentId: string) => Promise<boolean>;
  getLongitudinalTrend: (metricKey: string, timeRange?: TimeRangeOption) => Promise<MetricTrendSummary | null>;

  // Cycle (Female)
  cycle: CycleTrackingState;
  cycleHistory: CycleRecord[];
  isLoadingCycle: boolean;
  cycleError: string | null;
  loadCycleData: () => Promise<void>;
  updateCycle: (partial: Partial<CycleTrackingState>) => void;
  logPeriodStart: (dateString: string, flow?: 'Light' | 'Moderate' | 'Heavy') => void;
  logCycleEntry: (input: LogCycleInput) => Promise<boolean>;
  deleteCycleEntry: (recordId: string) => Promise<boolean>;

  // Symptoms
  symptoms: SymptomCheckInState;
  symptomHistory: SymptomRecord[];
  isLoadingSymptoms: boolean;
  symptomError: string | null;
  loadSymptoms: () => Promise<void>;
  toggleSymptom: (symptomId: string) => void;
  setSymptomIntensity: (intensity: 'Mild' | 'Moderate' | 'Severe') => void;
  addCustomSymptom: (name: string, category?: 'physical' | 'menstrual' | 'other') => void;
  saveSymptomCheckIn: (notesOrInput?: string | { notes?: string; intensity?: 'Mild' | 'Moderate' | 'Severe'; cycleDay?: number; date?: string; symptomIds?: string[] }) => Promise<boolean>;
  deleteSymptomLog: (recordId: string) => Promise<boolean>;

  // Nutrition
  nutrition: NutritionState;
  isLoadingNutrition: boolean;
  nutritionError: string | null;
  loadNutritionData: (date?: string) => Promise<void>;
  addMeal: (meal: Omit<MealItem, 'id'>) => Promise<boolean>;
  deleteMeal: (id: string) => Promise<boolean>;
  removeMeal: (id: string) => Promise<boolean>;
  setCuisineFilter: (filter: 'South Asian' | 'Vegetarian' | 'Low-cost') => void;

  // Water
  water: WaterState;
  isLoadingWater: boolean;
  waterError: string | null;
  loadWaterData: () => Promise<void>;
  addWaterMl: (amountMl: number) => Promise<boolean>;
  deleteWaterLog: (id: string) => Promise<boolean>;
  resetWater: () => Promise<boolean>;

  // Movement
  movement: MovementState;
  movementLogs: FitnessLog[];
  isLoadingMovement: boolean;
  movementError: string | null;
  loadMovementData: () => Promise<void>;
  logActivity: (minutes: number, steps?: number, activityName?: string, activityType?: string) => Promise<boolean>;
  deleteActivityLog: (id: string) => Promise<boolean>;

  // Medications
  medications: MedicationItem[];
  medicationHistory: DoseLogEntity[];
  isLoadingMedications: boolean;
  medicationError: string | null;
  loadMedications: () => Promise<void>;
  loadMedicationHistory: () => Promise<void>;
  markMedicationStatus: (id: string, status: 'pending' | 'taken' | 'skipped' | 'snoozed', notes?: string) => Promise<boolean>;
  addMedication: (med: Omit<MedicationItem, 'id'>) => Promise<boolean>;
  deleteMedication: (id: string) => Promise<boolean>;

  // Measurements & Metric Observations
  measurementObservations: MetricObservation[];
  isLoadingMeasurements: boolean;
  measurementError: string | null;
  loadMeasurementObservations: (metricKey?: string) => Promise<void>;
  logMeasurement: (input: { weightKg?: number; heightCm?: number; waistCm?: number; observedAt?: string }) => Promise<boolean>;

  // Appointments & Specialists
  appointments: AppointmentItem[];
  specialists: SpecialistDoctor[];
  isLoadingAppointments: boolean;
  appointmentError: string | null;
  loadAppointments: () => Promise<void>;
  bookAppointment: (appointment: Omit<AppointmentItem, 'id' | 'status'>) => Promise<boolean> | void;
  rescheduleAppointment: (id: string, date: string, time: string) => Promise<boolean> | void;
  cancelAppointment: (id: string) => Promise<boolean> | void;

  // Care Circle
  careCircle: CareCircleMember[];
  isLoadingCareCircle: boolean;
  careCircleError: string | null;
  loadCareCircle: () => Promise<void>;
  addCareCircleMember: (member: CareCircleMember) => Promise<boolean> | void;
  removeCareCircleMember: (id: string) => Promise<boolean> | void;
  addToCareCircle: (member: Omit<CareCircleMember, 'id'>) => Promise<boolean> | void;
  removeFromCareCircle: (id: string) => Promise<boolean> | void;
  updateCareCirclePermissions: (memberId: string, permissionsOrAccessLevel: any) => Promise<boolean>;

  // Reports & Labs
  reports: ReportItem[];
  isLoadingReports: boolean;
  reportError: string | null;
  loadReports: () => Promise<void>;
  verifiedLabs: ClinicalLabRow[];
  loadVerifiedLabs: () => Promise<void>;
  pendingOcrReport: PendingOcrReport | null;
  setPendingOcrReport: (report: PendingOcrReport | null) => void;
  updateVerifiedLab: (id: string, value: string) => void;
  confirmVerifiedLabs: (labs: ClinicalLabRow[], reportId?: string) => Promise<void>;
  saveReport: (input: any) => Promise<ReportItem | null>;
  deleteReport: (reportId: string) => Promise<boolean>;

  // Notifications
  notifications: NotificationSettingsState;
  updateNotificationSetting: (key: keyof NotificationSettingsState, value: boolean) => void;
  notificationList: MobileNotificationItem[];
  isLoadingNotifications: boolean;
  notificationError: string | null;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;

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

function computeWeeklyMinutes(logs: FitnessLog[]): { day: string; minutes: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const dayTotals: Record<string, number> = {
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
  };

  logs.forEach((log) => {
    if (!log.occurredAt) return;
    const logDate = new Date(log.occurredAt + 'T00:00:00');
    const diffDays = Math.floor((logDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      const dayName = days[diffDays];
      dayTotals[dayName] = (dayTotals[dayName] || 0) + (Number(log.durationMinutes) || 0);
    }
  });

  return days.map((day) => ({ day, minutes: dayTotals[day] || 0 }));
}

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
  const [cycleHistory, setCycleHistory] = useState<CycleRecord[]>([]);
  const [isLoadingCycle, setIsLoadingCycle] = useState<boolean>(false);
  const [cycleError, setCycleError] = useState<string | null>(null);

  const [symptoms, setSymptoms] = useState<SymptomCheckInState>(EMPTY_SYMPTOMS);
  const [symptomHistory, setSymptomHistory] = useState<SymptomRecord[]>([]);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState<boolean>(false);
  const [symptomError, setSymptomError] = useState<string | null>(null);

  const [meals, setMeals] = useState<MealItem[]>([]);
  const [cuisineFilter, setCuisineFilter] = useState<'South Asian' | 'Vegetarian' | 'Low-cost'>('South Asian');
  const [isLoadingNutrition, setIsLoadingNutrition] = useState<boolean>(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  const [waterLogs, setWaterLogs] = useState<WaterLogEntry[]>([]);
  const [isLoadingWater, setIsLoadingWater] = useState<boolean>(false);
  const [waterError, setWaterError] = useState<string | null>(null);

  const [movementMinutes, setMovementMinutes] = useState<number>(0);
  const [movementSteps, setMovementSteps] = useState<number>(0);
  const [movementLogs, setMovementLogs] = useState<FitnessLog[]>([]);
  const [weeklyMovementMinutes, setWeeklyMovementMinutes] = useState<{ day: string; minutes: number }[]>([
    { day: 'Mon', minutes: 0 },
    { day: 'Tue', minutes: 0 },
    { day: 'Wed', minutes: 0 },
    { day: 'Thu', minutes: 0 },
    { day: 'Fri', minutes: 0 },
    { day: 'Sat', minutes: 0 },
    { day: 'Sun', minutes: 0 },
  ]);
  const [isLoadingMovement, setIsLoadingMovement] = useState<boolean>(false);
  const [movementError, setMovementError] = useState<string | null>(null);

  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [medicationHistory, setMedicationHistory] = useState<DoseLogEntity[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState<boolean>(false);
  const [medicationError, setMedicationError] = useState<string | null>(null);

  const [measurementObservations, setMeasurementObservations] = useState<MetricObservation[]>([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState<boolean>(false);
  const [measurementError, setMeasurementError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDoctor[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);

  const [careCircle, setCareCircle] = useState<CareCircleMember[]>([]);
  const [isLoadingCareCircle, setIsLoadingCareCircle] = useState<boolean>(false);
  const [careCircleError, setCareCircleError] = useState<string | null>(null);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [pendingOcrReport, setPendingOcrReport] = useState<PendingOcrReport | null>(null);
  const [verifiedLabs, setVerifiedLabs] = useState<ClinicalLabRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettingsState>(DEFAULT_NOTIFICATIONS);
  const [notificationList, setNotificationList] = useState<MobileNotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const resetHealthState = useCallback(() => {
    setProfile(EMPTY_PROFILE);
    setScreening(EMPTY_SCREENING);
    setAssessmentHistory([]);
    setCycle(EMPTY_CYCLE);
    setCycleHistory([]);
    setIsLoadingCycle(false);
    setCycleError(null);

    setSymptoms(EMPTY_SYMPTOMS);
    setSymptomHistory([]);
    setIsLoadingSymptoms(false);
    setSymptomError(null);

    setMeals([]);
    setIsLoadingNutrition(false);
    setNutritionError(null);

    setWaterLogs([]);
    setIsLoadingWater(false);
    setWaterError(null);

    setMovementMinutes(0);
    setMovementSteps(0);
    setMovementLogs([]);
    setWeeklyMovementMinutes([
      { day: 'Mon', minutes: 0 },
      { day: 'Tue', minutes: 0 },
      { day: 'Wed', minutes: 0 },
      { day: 'Thu', minutes: 0 },
      { day: 'Fri', minutes: 0 },
      { day: 'Sat', minutes: 0 },
      { day: 'Sun', minutes: 0 },
    ]);
    setIsLoadingMovement(false);
    setMovementError(null);

    setMedications([]);
    setMedicationHistory([]);
    setIsLoadingMedications(false);
    setMedicationError(null);

    setMeasurementObservations([]);
    setIsLoadingMeasurements(false);
    setMeasurementError(null);

    setAppointments([]);
    setSpecialists([]);
    setIsLoadingAppointments(false);
    setAppointmentError(null);

    setCareCircle([]);
    setIsLoadingCareCircle(false);
    setCareCircleError(null);

    setReports([]);
    setIsLoadingReports(false);
    setReportError(null);
    setPendingOcrReport(null);
    setVerifiedLabs([]);
    setNotificationList([]);
    setIsLoadingNotifications(false);
    setNotificationError(null);
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
          verifiedLabsRes,
          notifPrefs,
          notifListRes,
          recentSymptoms,
          fitnessLogs,
          foodLogsRes,
          cycleHistRes,
          fitnessHistory,
          medHistoryRes,
          measurementsRes,
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
          reportService.getVerifiedLabs(currentUserId, token),
          notificationService.getPreferences(token, currentUserId),
          notificationService.getNotifications(token, currentUserId, initialPathway),
          trackingService.getRecentSymptoms(currentUserId, token, 50),
          trackingService.getTodayFitnessLogs(currentUserId, token),
          nutritionService.getFoodLogs(currentUserId, token),
          trackingService.getCycleHistory(currentUserId, token, 12),
          trackingService.getFitnessHistory(currentUserId, token, 60),
          medicationService.getMedicationHistory(currentUserId, token, 50),
          measurementService.getObservations(currentUserId, token, undefined, 50),
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
          const rawExps =
            Array.isArray(assessmentData.explanations) && assessmentData.explanations.length > 0
              ? assessmentData.explanations
              : assessmentData.shap_explanation?.factors || [];
          const normalizedFactors: ScreeningFactor[] = rawExps.map((exp: any, idx: number) => {
            const pf = formatShapFactorForPatient(exp, idx);
            return {
              id: pf.feature_key || `factor_${idx}`,
              featureKey: pf.feature_key,
              name: pf.feature_name,
              humanLabel: pf.human_label,
              patientLabel: pf.patient_label,
              patientValue: pf.patient_value,
              impactScore: pf.impact_score,
              impactPercent: pf.explanation_share_percent || Math.round(Math.abs(pf.impact_score || 0) * 100) || 10,
              explanationSharePercent: pf.explanation_share_percent,
              relativeInfluence: pf.relative_influence,
              direction: pf.direction as any,
              explanation: pf.patient_explanation || pf.description || '',
              patientExplanation: pf.patient_explanation,
              iconName: pf.iconName || getFeatureIconName(pf.feature_key),
            };
          });

          const probVal = Number(assessmentData.probability ?? 0);
          const probPct = assessmentData.probability_percent ?? Math.round(probVal * 100);
          const riskCat = (assessmentData.risk_category || 'lower') as any;
          const band = resolveRiskBand(probVal, riskCat, assessmentData.threshold);

          setScreening((prev) => ({
            ...prev,
            assessmentId: assessmentData.id || assessmentData.assessment_id,
            patientId: assessmentData.patient_id || currentUserId,
            module: assessmentData.module || initialPathway,
            probability: probVal,
            probabilityPercent: probPct,
            threshold: assessmentData.threshold,
            riskBand: (assessmentData.risk_label || (band.label === 'Higher Likelihood' ? 'Higher Risk' : band.label === 'Intermediate Likelihood' ? 'Intermediate Risk' : 'Lower Risk')) as any,
            riskCategory: riskCat,
            tier: assessmentData.assessment_level === 'tier_1_2_3' ? 3 : assessmentData.assessment_level === 'tier_1_2' ? 2 : 1,
            tierStatus: assessmentData.assessment_level ? `Tier ${assessmentData.assessment_level === 'tier_1_2_3' ? 3 : assessmentData.assessment_level === 'tier_1_2' ? 2 : 1} Complete` : 'Tier 1 Complete',
            lastAssessedDate: formatAssessmentDate(assessmentData.created_at) || 'Recent Assessment',
            createdAt: assessmentData.created_at,
            disclaimer: assessmentData.disclaimer || 'This is not a medical diagnosis. Results are an AI-based risk assessment. Please consult a healthcare professional for a confirmed diagnosis.',
            modelName: assessmentData.model_name,
            isNonDiagnostic: true,
            topFactors: normalizedFactors.slice(0, 3),
            allFactors: normalizedFactors,
          }));
        }

        if (assessmentHistoryData && assessmentHistoryData.length > 0) {
          setAssessmentHistory(assessmentHistoryData);
        }

        if (cycleHistRes?.data && cycleHistRes.data.length > 0) {
          setCycleHistory(cycleHistRes.data);
          const latestCycle = cycleHistRes.data[0];
          const startMs = new Date(latestCycle.periodStartDate).getTime();
          const todayMs = new Date().setHours(0, 0, 0, 0);
          const diffDays = Math.max(1, Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
          const cycleLen = latestCycle.cycleLength || 28;
          setCycle((prev) => ({
            ...prev,
            lastPeriodStartDate: latestCycle.periodStartDate,
            flow: latestCycle.flow || 'Moderate',
            cycleLength: cycleLen,
            currentCycleDay: diffDays <= cycleLen ? diffDays : 1,
            nextPeriodDaysRemaining: Math.max(0, cycleLen - diffDays),
            notes: latestCycle.notes || prev.notes,
          }));
        } else if (cycleData) {
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

        if (verifiedLabsRes?.data && verifiedLabsRes.data.length > 0) {
          setVerifiedLabs(verifiedLabsRes.data);
        }

        if (notifPrefs?.data) {
          setNotifications(notifPrefs.data);
        }

        if (notifListRes?.data && notifListRes.data.length > 0) {
          setNotificationList(notifListRes.data);
        }

        if (recentSymptoms?.data && recentSymptoms.data.length > 0) {
          setSymptomHistory(recentSymptoms.data);
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
          let totalSteps = 0;
          fitnessLogs.data.forEach((curr: any) => {
            if (curr.notes) {
              const match = String(curr.notes).match(/(\d+)\s*steps/i);
              if (match) totalSteps += parseInt(match[1], 10);
            }
          });
          if (totalSteps > 0) setMovementSteps(totalSteps);
        }

        if (fitnessHistory?.data && fitnessHistory.data.length > 0) {
          setMovementLogs(fitnessHistory.data);
          setWeeklyMovementMinutes(computeWeeklyMinutes(fitnessHistory.data));
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

        if (medHistoryRes?.data && medHistoryRes.data.length > 0) {
          setMedicationHistory(medHistoryRes.data);
        }

        if (measurementsRes?.data && measurementsRes.data.length > 0) {
          setMeasurementObservations(measurementsRes.data);
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
      assessmentService.fetchAssessmentHistory(user.id, p).then((hist) => {
        setAssessmentHistory(hist || []);
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
        assessmentService.fetchActiveScreeningAssessment(user.id, pathway),
        assessmentService.fetchAssessmentHistory(user.id, pathway),
      ]);
      if (activeRes) {
        const rawExps =
          Array.isArray(activeRes.explanations) && activeRes.explanations.length > 0
            ? activeRes.explanations
            : activeRes.shap_explanation?.factors || [];
        const normalizedFactors: ScreeningFactor[] = rawExps.map((exp: any, idx: number) => {
          const pf = formatShapFactorForPatient(exp, idx);
          return {
            id: pf.feature_key || `factor_${idx}`,
            featureKey: pf.feature_key,
            name: pf.feature_name,
            humanLabel: pf.human_label,
            patientLabel: pf.patient_label,
            patientValue: pf.patient_value,
            impactScore: pf.impact_score,
            impactPercent: pf.explanation_share_percent || Math.round(Math.abs(pf.impact_score || 0) * 100) || 10,
            explanationSharePercent: pf.explanation_share_percent,
            relativeInfluence: pf.relative_influence,
            direction: pf.direction as any,
            explanation: pf.patient_explanation || pf.description || '',
            patientExplanation: pf.patient_explanation,
            iconName: pf.iconName || getFeatureIconName(pf.feature_key),
          };
        });

        const probVal = Number(activeRes.probability ?? 0);
        const probPct = activeRes.probability_percent ?? Math.round(probVal * 100);
        const riskCat = (activeRes.risk_category || 'lower') as any;
        const band = resolveRiskBand(probVal, riskCat, activeRes.threshold);

        setScreening((prev) => ({
          ...prev,
          assessmentId: activeRes.id || activeRes.assessment_id,
          patientId: activeRes.patient_id || user.id,
          module: activeRes.module || pathway,
          probability: probVal,
          probabilityPercent: probPct,
          threshold: activeRes.threshold,
          riskBand: (activeRes.risk_label || (band.label === 'Higher Likelihood' ? 'Higher Risk' : band.label === 'Intermediate Likelihood' ? 'Intermediate Risk' : 'Lower Risk')) as any,
          riskCategory: riskCat,
          tier: activeRes.assessment_level === 'tier_1_2_3' ? 3 : activeRes.assessment_level === 'tier_1_2' ? 2 : 1,
          tierStatus: activeRes.assessment_level ? `Tier ${activeRes.assessment_level === 'tier_1_2_3' ? 3 : activeRes.assessment_level === 'tier_1_2' ? 2 : 1} Complete` : 'Tier 1 Complete',
          lastAssessedDate: formatAssessmentDate(activeRes.created_at) || 'Recent Assessment',
          createdAt: activeRes.created_at,
          disclaimer: activeRes.disclaimer || 'This is not a medical diagnosis. Results are an AI-based risk assessment. Please consult a healthcare professional for a confirmed diagnosis.',
          modelName: activeRes.model_name,
          isNonDiagnostic: true,
          topFactors: normalizedFactors.slice(0, 3),
          allFactors: normalizedFactors,
        }));
      }
      if (histRes) {
        setAssessmentHistory(histRes);
      } else {
        setAssessmentHistory([]);
      }
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error refreshing assessment:', err);
    }
  }, [user?.id, pathway]);

  const loadAssessmentHistory = useCallback(async (pathwayOverride?: HealthPathway): Promise<ProgressiveAssessment[]> => {
    if (!user?.id) return [];
    const targetPathway = pathwayOverride || pathway;
    try {
      const histRes = await assessmentService.fetchAssessmentHistory(user.id, targetPathway);
      const historyList = histRes || [];
      setAssessmentHistory(historyList);
      return historyList;
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error loading assessment history:', err);
      return [];
    }
  }, [user?.id, pathway]);

  const deleteAssessmentRecord = useCallback(async (assessmentId: string): Promise<boolean> => {
    if (!user?.id || !user?.accessToken) return false;
    try {
      const res = await longitudinalService.deleteAssessment(assessmentId, user.id, user.accessToken);
      if (res.data) {
        setAssessmentHistory((prev) => prev.filter((a) => (a.id || a.assessment_id) !== assessmentId));
        if (screening.assessmentId === assessmentId) {
          refreshAssessment();
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error deleting assessment record:', err);
      return false;
    }
  }, [user?.id, user?.accessToken, screening.assessmentId, refreshAssessment]);

  const getLongitudinalTrend = useCallback(async (
    metricKey: string,
    timeRange?: TimeRangeOption
  ): Promise<MetricTrendSummary | null> => {
    if (!user?.id || !user?.accessToken) return null;
    try {
      const res = await longitudinalService.getMetricTrend(
        metricKey,
        user.id,
        user.accessToken,
        pathway,
        timeRange || '3M'
      );
      return res.data || null;
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error getting longitudinal trend:', err);
      return null;
    }
  }, [user?.id, user?.accessToken, pathway]);

  const loadCycleData = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingCycle(true);
    setCycleError(null);
    try {
      const res = await trackingService.getCycleHistory(user.id, user.accessToken, 12);
      if (res.error) {
        setCycleError(res.error);
      } else {
        const hist = res.data || [];
        setCycleHistory(hist);
        if (hist.length > 0) {
          const latest = hist[0];
          const startMs = new Date(latest.periodStartDate).getTime();
          const todayMs = new Date().setHours(0, 0, 0, 0);
          const diffDays = Math.max(1, Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
          const cycleLen = latest.cycleLength || 28;
          const phase = diffDays <= 5 ? 'Menstrual Phase' : diffDays <= 14 ? 'Follicular Phase' : diffDays <= 17 ? 'Ovulation Window' : 'Luteal Phase';
          const daysRem = Math.max(0, cycleLen - diffDays);

          setCycle((prev) => ({
            ...prev,
            lastPeriodStartDate: latest.periodStartDate,
            flow: latest.flow || 'Moderate',
            cycleLength: cycleLen,
            currentCycleDay: diffDays <= cycleLen ? diffDays : cycleLen,
            phase,
            nextPeriodDaysRemaining: daysRem,
            notes: latest.notes || prev.notes,
          }));
        }
      }
    } catch (err: any) {
      setCycleError(err?.message || 'Failed to load cycle data');
    } finally {
      setIsLoadingCycle(false);
    }
  }, [user?.id, user?.accessToken]);

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
      }).then((res) => {
        if (res.data) {
          setCycleHistory((prev) => [res.data!, ...prev.filter((c) => c.id !== res.data!.id)]);
        }
      }).catch((err) => {
        console.warn('[BioPulse HealthStore] Error logging period in DB:', err);
      });
      updateUserProfileInDb(user.id, user.accessToken, {
        lastPeriodDate: dateString,
      }).catch(() => {});
    }
  }, [user?.id, user?.accessToken, cycle.cycleLength]);

  const logCycleEntry = useCallback(async (input: LogCycleInput): Promise<boolean> => {
    if (!user?.id || !user?.accessToken) {
      setCycleError('User not authenticated');
      return false;
    }
    setIsLoadingCycle(true);
    setCycleError(null);
    try {
      const res = await trackingService.logCycle(user.id, user.accessToken, input);
      if (res.error) {
        setCycleError(res.error);
        return false;
      }
      if (res.data) {
        setCycleHistory((prev) => [res.data!, ...prev.filter((c) => c.id !== res.data!.id)]);
        const startMs = new Date(res.data.periodStartDate).getTime();
        const todayMs = new Date().setHours(0, 0, 0, 0);
        const diffDays = Math.max(1, Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
        const cycleLen = res.data.cycleLength || 28;

        setCycle((prev) => ({
          ...prev,
          lastPeriodStartDate: res.data!.periodStartDate,
          flow: res.data!.flow || 'Moderate',
          cycleLength: cycleLen,
          currentCycleDay: diffDays <= cycleLen ? diffDays : 1,
          nextPeriodDaysRemaining: Math.max(0, cycleLen - diffDays),
          notes: res.data!.notes || prev.notes,
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      setCycleError(err?.message || 'Failed to save cycle entry');
      return false;
    } finally {
      setIsLoadingCycle(false);
    }
  }, [user?.id, user?.accessToken]);

  const deleteCycleEntry = useCallback(async (recordId: string): Promise<boolean> => {
    if (!user?.accessToken) return false;
    try {
      const res = await trackingService.deleteCycleRecord(recordId, user.accessToken);
      if (res.data) {
        setCycleHistory((prev) => prev.filter((c) => c.id !== recordId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user?.accessToken]);

  const loadSymptoms = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingSymptoms(true);
    setSymptomError(null);
    try {
      const res = await trackingService.getRecentSymptoms(user.id, user.accessToken, 50);
      if (res.error) {
        setSymptomError(res.error);
      } else {
        const hist = res.data || [];
        setSymptomHistory(hist);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLogs = hist.filter((h) => h.occurredAt === todayStr);
        if (todayLogs.length > 0) {
          const selectedTypes = new Set(todayLogs.map((h) => h.symptomType));
          const latestOccurred = todayLogs[0]?.occurredAt;
          setSymptoms((prev) => ({
            ...prev,
            loggedToday: true,
            lastUpdatedTime: latestOccurred ? 'Today' : prev.lastUpdatedTime,
            symptoms: prev.symptoms.map((s) => ({
              ...s,
              selected: selectedTypes.has(s.id),
            })),
          }));
        }
      }
    } catch (err: any) {
      setSymptomError(err?.message || 'Failed to load symptoms');
    } finally {
      setIsLoadingSymptoms(false);
    }
  }, [user?.id, user?.accessToken]);

  const toggleSymptom = useCallback((symptomId: string) => {
    setSymptoms((prev) => {
      const updatedList = prev.symptoms.map((s) => (s.id === symptomId ? { ...s, selected: !s.selected } : s));
      const target = updatedList.find((s) => s.id === symptomId);
      if (target?.selected && user?.id && user?.accessToken) {
        trackingService.logSymptom(user.id, user.accessToken, {
          symptomType: symptomId,
          severity: prev.intensity.toLowerCase(),
          cycleDay: isFemale && cycle.currentCycleDay > 0 ? cycle.currentCycleDay : undefined,
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
  }, [user?.id, user?.accessToken, isFemale, cycle.currentCycleDay]);

  const setSymptomIntensity = useCallback((intensity: 'Mild' | 'Moderate' | 'Severe') => {
    setSymptoms((prev) => ({
      ...prev,
      intensity,
      lastUpdatedTime: 'Just now',
    }));
  }, []);

  const addCustomSymptom = useCallback((name: string, category: 'physical' | 'menstrual' | 'other' = 'other') => {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '_');
    setSymptoms((prev) => {
      if (prev.symptoms.some((s) => s.id === slug)) return prev;
      const newSymptom: SymptomLogEntry = {
        id: slug,
        name: name.trim(),
        category,
        selected: true,
      };
      return {
        ...prev,
        symptoms: [...prev.symptoms, newSymptom],
      };
    });
  }, []);

  const saveSymptomCheckIn = useCallback(async (
    notesOrInput?: string | { notes?: string; intensity?: 'Mild' | 'Moderate' | 'Severe'; cycleDay?: number; date?: string; symptomIds?: string[] }
  ): Promise<boolean> => {
    if (!user?.id || !user?.accessToken) {
      setSymptomError('User not authenticated');
      return false;
    }

    const noteText = typeof notesOrInput === 'string' ? notesOrInput : notesOrInput?.notes || symptoms.notes || '';
    const chosenIntensity = typeof notesOrInput === 'object' && notesOrInput?.intensity ? notesOrInput.intensity : symptoms.intensity;
    const chosenCycleDay = typeof notesOrInput === 'object' && notesOrInput?.cycleDay !== undefined ? notesOrInput.cycleDay : (isFemale && cycle.currentCycleDay > 0 ? cycle.currentCycleDay : undefined);
    const chosenDate = typeof notesOrInput === 'object' && notesOrInput?.date ? notesOrInput.date : new Date().toISOString().split('T')[0];

    const targetSymptomIds = typeof notesOrInput === 'object' && notesOrInput?.symptomIds
      ? notesOrInput.symptomIds
      : symptoms.symptoms.filter((s) => s.selected).map((s) => s.id);

    if (targetSymptomIds.length === 0) {
      setSymptomError('No symptoms selected');
      return false;
    }

    setIsLoadingSymptoms(true);
    setSymptomError(null);

    try {
      const createdRecords: SymptomRecord[] = [];
      for (const sId of targetSymptomIds) {
        const found = symptoms.symptoms.find((s) => s.id === sId);
        const res = await trackingService.logSymptom(user.id, user.accessToken, {
          symptomType: sId,
          category: found?.category || 'physical',
          severity: chosenIntensity.toLowerCase(),
          occurredAt: chosenDate,
          cycleDay: chosenCycleDay,
          notes: noteText || undefined,
        });
        if (res.data) {
          createdRecords.push(res.data);
        }
      }

      setSymptomHistory((prev) => [...createdRecords, ...prev]);
      setSymptoms((prev) => ({
        ...prev,
        loggedToday: true,
        lastUpdatedTime: 'Just now',
        intensity: chosenIntensity,
        notes: noteText,
      }));

      updateUserProfileInDb(user.id, user.accessToken, {
        common_symptoms: targetSymptomIds,
      }).catch(() => {});

      return true;
    } catch (err: any) {
      setSymptomError(err?.message || 'Failed to save symptoms');
      return false;
    } finally {
      setIsLoadingSymptoms(false);
    }
  }, [user?.id, user?.accessToken, symptoms, isFemale, cycle.currentCycleDay]);

  const deleteSymptomLog = useCallback(async (recordId: string): Promise<boolean> => {
    if (!user?.accessToken) return false;
    try {
      const res = await trackingService.deleteSymptom(recordId, user.accessToken);
      if (res.data) {
        setSymptomHistory((prev) => prev.filter((s) => s.id !== recordId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user?.accessToken]);

  const loadNutritionData = useCallback(async (dateStr?: string) => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingNutrition(true);
    setNutritionError(null);
    try {
      const res = await nutritionService.getFoodLogsByDate(user.id, user.accessToken, dateStr);
      if (res.error) {
        setNutritionError(res.error);
      } else if (res.data) {
        const parsedMeals: MealItem[] = res.data.map((f) => ({
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
    } catch (err: any) {
      setNutritionError(err?.message || 'Failed to load nutrition data');
    } finally {
      setIsLoadingNutrition(false);
    }
  }, [user?.id, user?.accessToken]);

  const addMeal = useCallback(async (meal: Omit<MealItem, 'id'>): Promise<boolean> => {
    const tempId = `meal_${Date.now()}`;
    const newMeal: MealItem = {
      ...meal,
      id: tempId,
    };
    setMeals((prev) => [...prev, newMeal]);
    if (!user?.id || !user?.accessToken) return true;

    try {
      const res = await nutritionService.logFood(user.id, user.accessToken, {
        mealType: meal.mealType,
        foodName: meal.name,
        portionDescription: meal.description,
        calories: meal.calories,
        proteinG: meal.proteinGrams,
        carbsG: Math.round(meal.calories * 0.45 / 4),
        fatG: Math.round(meal.calories * 0.28 / 9),
      });
      if (res.data?.id) {
        setMeals((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: res.data!.id } : m))
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[BioPulse HealthStore] Error persisting food log in DB:', err);
      return false;
    }
  }, [user?.id, user?.accessToken]);

  const deleteMeal = useCallback(async (id: string): Promise<boolean> => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    if (user?.accessToken) {
      try {
        const res = await nutritionService.deleteFoodLog(id, user.accessToken);
        return !!res.data;
      } catch {
        return false;
      }
    }
    return true;
  }, [user?.accessToken]);

  const setCuisineFilterAction = useCallback((filter: 'South Asian' | 'Vegetarian' | 'Low-cost') => {
    setCuisineFilter(filter);
  }, []);

  const loadWaterData = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingWater(true);
    setWaterError(null);
    try {
      const res = await trackingService.getTodayWaterLog(user.id, user.accessToken);
      if (res.error) {
        setWaterError(res.error);
      } else if (res.data) {
        const glasses = res.data.glasses;
        const generatedLogs: WaterLogEntry[] = Array.from({ length: glasses }, (_, i) => ({
          id: `glass_${res.data!.id}_${i}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amountMl: 250,
        }));
        setWaterLogs(generatedLogs);
      }
    } catch (err: any) {
      setWaterError(err?.message || 'Failed to load water data');
    } finally {
      setIsLoadingWater(false);
    }
  }, [user?.id, user?.accessToken]);

  const addWaterMl = useCallback(async (amountMl: number): Promise<boolean> => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry: WaterLogEntry = {
      id: `water_${Date.now()}`,
      time: timeFormatted,
      amountMl,
    };
    const nextLogs = [...waterLogs, newEntry];
    setWaterLogs(nextLogs);

    if (user?.id && user?.accessToken) {
      const totalMl = nextLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
      const glasses = Math.round(totalMl / 250);
      try {
        const res = await trackingService.logWater(user.id, user.accessToken, glasses, isFemale ? 10 : 12);
        return !res.error;
      } catch {
        return false;
      }
    }
    return true;
  }, [waterLogs, user?.id, user?.accessToken, isFemale]);

  const deleteWaterLog = useCallback(async (id: string): Promise<boolean> => {
    const nextLogs = waterLogs.filter((w) => w.id !== id);
    setWaterLogs(nextLogs);

    if (user?.id && user?.accessToken) {
      try {
        await trackingService.deleteWaterLog(id, user.accessToken);
      } catch {
        // Continue to sync daily total
      }
      const totalMl = nextLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
      const glasses = Math.round(totalMl / 250);
      try {
        await trackingService.logWater(user.id, user.accessToken, glasses, isFemale ? 10 : 12);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, [waterLogs, user?.id, user?.accessToken, isFemale]);

  const resetWater = useCallback(async (): Promise<boolean> => {
    setWaterLogs([]);
    if (user?.id && user?.accessToken) {
      try {
        await trackingService.logWater(user.id, user.accessToken, 0, isFemale ? 10 : 12);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, [user?.id, user?.accessToken, isFemale]);

  const removeMeal = deleteMeal;

  const updateProfileMetrics = useCallback((weightKg: number, heightCm: number) => {
    updateProfile({ weightKg, heightCm });
  }, [updateProfile]);

  const loadMovementData = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingMovement(true);
    setMovementError(null);
    try {
      const [todayRes, histRes] = await Promise.all([
        trackingService.getTodayFitnessLogs(user.id, user.accessToken),
        trackingService.getFitnessHistory(user.id, user.accessToken, 60),
      ]);
      if (todayRes.data) {
        const totalMins = todayRes.data.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
        setMovementMinutes(totalMins);
        let totalSteps = 0;
        todayRes.data.forEach((l) => {
          if (l.notes) {
            const match = String(l.notes).match(/(\d+)\s*steps/i);
            if (match) totalSteps += parseInt(match[1], 10);
          }
        });
        setMovementSteps(totalSteps);
      }
      if (histRes.data) {
        setMovementLogs(histRes.data);
        setWeeklyMovementMinutes(computeWeeklyMinutes(histRes.data));
      }
    } catch (err: any) {
      setMovementError(err?.message || 'Failed to load movement data');
    } finally {
      setIsLoadingMovement(false);
    }
  }, [user?.id, user?.accessToken]);

  const logActivity = useCallback(async (
    minutes: number,
    steps?: number,
    activityName: string = 'Activity',
    activityType: string = 'walking'
  ): Promise<boolean> => {
    setMovementMinutes((prev) => prev + minutes);
    if (steps) {
      setMovementSteps((prev) => prev + steps);
    }
    if (!user?.id || !user?.accessToken) return true;

    setIsLoadingMovement(true);
    setMovementError(null);
    try {
      const res = await trackingService.logActivity(user.id, user.accessToken, {
        activityType,
        activityName,
        durationMinutes: minutes,
        notes: steps ? `${steps} steps` : undefined,
      });
      if (res.data) {
        setMovementLogs((prev) => [res.data!, ...prev]);
        setWeeklyMovementMinutes((prev) => {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const todayIdx = (new Date().getDay() + 6) % 7;
          const todayName = days[todayIdx];
          return prev.map((item) =>
            item.day === todayName ? { ...item, minutes: item.minutes + minutes } : item
          );
        });
        return true;
      }
      return false;
    } catch (err: any) {
      setMovementError(err?.message || 'Failed to save activity');
      return false;
    } finally {
      setIsLoadingMovement(false);
    }
  }, [user?.id, user?.accessToken]);

  const deleteActivityLog = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.accessToken) return false;
    try {
      const res = await trackingService.deleteFitnessLog(id, user.accessToken);
      if (res.data) {
        const deleted = movementLogs.find((m) => m.id === id);
        setMovementLogs((prev) => prev.filter((m) => m.id !== id));
        if (deleted && deleted.occurredAt === new Date().toISOString().split('T')[0]) {
          setMovementMinutes((prev) => Math.max(0, prev - (deleted.durationMinutes || 0)));
          if (deleted.notes) {
            const match = String(deleted.notes).match(/(\d+)\s*steps/i);
            if (match) {
              const s = parseInt(match[1], 10);
              setMovementSteps((prev) => Math.max(0, prev - s));
            }
          }
        }
        const remaining = movementLogs.filter((m) => m.id !== id);
        setWeeklyMovementMinutes(computeWeeklyMinutes(remaining));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [movementLogs, user?.accessToken]);

  // Derived tracking state views reflecting live changes immediately
  const nutritionState: NutritionState = useMemo(() => {
    const caloriesConsumed = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const proteinConsumed = meals.reduce((acc, m) => acc + (m.proteinGrams || 0), 0);
    const carbsConsumed = meals.reduce((acc, m) => acc + (Math.round((m.calories * 0.45) / 4) || 0), 0);
    const fatsConsumed = meals.reduce((acc, m) => acc + (Math.round((m.calories * 0.28) / 9) || 0), 0);

    return {
      caloriesConsumed,
      calorieTarget: 1800,
      proteinConsumed,
      proteinTarget: 90,
      carbsConsumed,
      carbsTarget: 220,
      fatsConsumed,
      fatsTarget: 70,
      meals,
      cuisineFilter,
    };
  }, [meals, cuisineFilter]);

  const waterState: WaterState = useMemo(() => {
    const totalMl = waterLogs.reduce((acc, l) => acc + (l.amountMl || 0), 0);
    const consumedLiters = parseFloat((totalMl / 1000).toFixed(2));
    return {
      consumedLiters,
      targetLiters: isFemale ? 2.5 : 3.0,
      logs: waterLogs,
    };
  }, [waterLogs, isFemale]);

  const movementState: MovementState = useMemo(() => ({
    todayActivityMinutes: movementMinutes,
    targetMinutes: 30,
    todaySteps: movementSteps,
    weeklyMinutes: weeklyMovementMinutes,
    currentGoalText: 'Daily activity goal',
  }), [movementMinutes, movementSteps, weeklyMovementMinutes]);

  const loadMedications = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingMedications(true);
    setMedicationError(null);
    try {
      const res = await medicationService.getMedications(user.id, user.accessToken);
      if (res.error) {
        setMedicationError(res.error);
      } else if (res.data) {
        setMedications(res.data.map((m) => ({
          id: m.id,
          name: m.name,
          dose: m.dose,
          unit: m.unit,
          dosage: m.dosage,
          scheduledTime: m.scheduledTime,
          scheduledTimes: m.scheduledTimes,
          frequency: m.frequency,
          startDate: m.startDate,
          endDate: m.endDate,
          notes: m.notes,
          instructions: m.instructions,
          status: 'pending',
          isActive: m.isActive,
          pathway: 'all',
        })));
      }
    } catch (err: any) {
      setMedicationError(err?.message || 'Failed to load medications');
    } finally {
      setIsLoadingMedications(false);
    }
  }, [user?.id, user?.accessToken]);

  const loadMedicationHistory = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    try {
      const res = await medicationService.getMedicationHistory(user.id, user.accessToken, 50);
      if (res.data) {
        setMedicationHistory(res.data);
      }
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error loading medication history:', err);
    }
  }, [user?.id, user?.accessToken]);

  const markMedicationStatus = useCallback(async (
    id: string,
    status: 'pending' | 'taken' | 'skipped' | 'snoozed',
    notes?: string
  ): Promise<boolean> => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, status } : med))
    );

    const targetMed = medications.find((m) => m.id === id);

    if (user?.id && user?.accessToken) {
      try {
        const res = await medicationService.logDose(user.id, user.accessToken, {
          medicationId: id,
          status,
          scheduledTime: targetMed?.scheduledTime || '08:00',
          notes,
        });
        if (res.data) {
          const newLog: DoseLogEntity = {
            ...res.data,
            medicationName: targetMed?.name || 'Medication',
            dosage: targetMed?.dosage,
          };
          setMedicationHistory((prev) => [newLog, ...prev]);
          return true;
        }
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error logging dose to DB:', err);
      }
    }
    return true;
  }, [medications, user?.id, user?.accessToken]);

  const addMedication = useCallback(async (med: Omit<MedicationItem, 'id'>): Promise<boolean> => {
    const tempId = `med_${Date.now()}`;
    const newMed: MedicationItem = {
      ...med,
      id: tempId,
    };
    setMedications((prev) => [...prev, newMed]);

    if (!user?.id || !user?.accessToken) return true;

    try {
      const res = await medicationService.addMedication(user.id, user.accessToken, {
        name: med.name,
        dose: med.dose || med.dosage.replace(/[^\d.]/g, '') || '1',
        unit: med.unit || (med.dosage.match(/[a-zA-Z]+/)?.[0]) || 'mg',
        scheduledTimes: med.scheduledTimes || (med.scheduledTime ? [med.scheduledTime] : ['08:00']),
        frequency: med.frequency || 'once_daily',
        startDate: med.startDate || new Date().toISOString().split('T')[0],
        endDate: med.endDate || null,
        notes: med.notes || med.instructions || '',
      });

      if (res.data?.id) {
        setMedications((prev) =>
          prev.map((m) => (m.id === tempId ? {
            ...m,
            id: res.data!.id,
            dose: res.data!.dose,
            unit: res.data!.unit,
            frequency: res.data!.frequency,
            scheduledTimes: res.data!.scheduledTimes,
            startDate: res.data!.startDate,
            endDate: res.data!.endDate,
          } : m))
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[BioPulse HealthStore] Error adding medication to DB:', err);
      setMedicationError(err?.message || 'Failed to save medication');
      return false;
    }
  }, [user?.id, user?.accessToken]);

  const deleteMedication = useCallback(async (id: string): Promise<boolean> => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    if (!user?.accessToken) return true;
    try {
      const res = await medicationService.deleteMedication(id, user.accessToken);
      return !res.error;
    } catch {
      return false;
    }
  }, [user?.accessToken]);

  const loadMeasurementObservations = useCallback(async (metricKey?: string) => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingMeasurements(true);
    setMeasurementError(null);
    try {
      const res = await measurementService.getObservations(user.id, user.accessToken, metricKey, 50);
      if (res.error) {
        setMeasurementError(res.error);
      } else if (res.data) {
        setMeasurementObservations(res.data);
      }
    } catch (err: any) {
      setMeasurementError(err?.message || 'Failed to load measurement observations');
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, [user?.id, user?.accessToken]);

  const logMeasurement = useCallback(async (input: {
    weightKg?: number;
    heightCm?: number;
    waistCm?: number;
    observedAt?: string;
  }): Promise<boolean> => {
    // 1. Update in-memory profile immediately
    const nextUpdates: Partial<UserProfileState> = {};
    if (input.weightKg !== undefined && input.weightKg > 0) nextUpdates.weightKg = input.weightKg;
    if (input.heightCm !== undefined && input.heightCm > 0) nextUpdates.heightCm = input.heightCm;
    if (input.waistCm !== undefined && input.waistCm > 0) nextUpdates.waistCm = input.waistCm;
    updateProfile(nextUpdates);

    if (!user?.id || !user?.accessToken) return true;

    setIsLoadingMeasurements(true);
    setMeasurementError(null);
    try {
      const res = await measurementService.logMeasurementSet(user.id, user.accessToken, {
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        waistCm: input.waistCm,
        observedAt: input.observedAt || new Date().toISOString(),
        module: isFemale ? 'female_pcos' : 'male_hypogonadism',
      });
      if (res.data?.observations) {
        setMeasurementObservations((prev) => [...res.data!.observations, ...prev]);
        return true;
      }
      return false;
    } catch (err: any) {
      setMeasurementError(err?.message || 'Failed to persist measurements');
      return false;
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, [updateProfile, user?.id, user?.accessToken, isFemale]);

  const loadAppointments = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingAppointments(true);
    setAppointmentError(null);
    try {
      const res = await appointmentService.getAppointments(user.id, user.accessToken);
      if (res.error) {
        setAppointmentError(res.error);
      } else if (res.data) {
        setAppointments(res.data);
      }
    } catch (err: any) {
      setAppointmentError(err?.message || 'Failed to load appointments');
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [user?.id, user?.accessToken]);

  const bookAppointment = useCallback(async (appointment: Omit<AppointmentItem, 'id' | 'status'>): Promise<boolean> => {
    const tempId = `apt_${Date.now()}`;
    const newApt: AppointmentItem = {
      ...appointment,
      id: tempId,
      status: 'Upcoming',
    };
    setAppointments((prev) => [newApt, ...prev]);

    if (user?.id && user?.accessToken) {
      try {
        const res = await appointmentService.bookAppointment(user.id, user.accessToken, {
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName,
          specialty: appointment.specialty,
          date: appointment.date,
          time: appointment.time,
          location: appointment.location,
          clinicOrHospital: appointment.clinicOrHospital,
          visitType: appointment.visitType,
          appointmentType: appointment.appointmentType,
          reason: appointment.reason,
          patientNotes: appointment.patientNotes,
        });
        if (res.data?.id) {
          setAppointments((prev) =>
            prev.map((a) => (a.id === tempId ? { ...a, id: res.data!.id } : a))
          );
          return true;
        }
        return false;
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error creating appointment in DB:', err);
        return false;
      }
    }
    return true;
  }, [user?.id, user?.accessToken]);

  const rescheduleAppointment = useCallback(async (id: string, date: string, time: string): Promise<boolean> => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date, time } : a))
    );
    if (user?.id && user?.accessToken) {
      try {
        const res = await appointmentService.rescheduleAppointment(id, user.id, user.accessToken, { date, time });
        return Boolean(res.data);
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error rescheduling appointment in DB:', err);
        return false;
      }
    }
    return true;
  }, [user?.id, user?.accessToken]);

  const cancelAppointment = useCallback(async (id: string): Promise<boolean> => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
    );
    if (user?.id && user?.accessToken) {
      try {
        const res = await appointmentService.cancelAppointment(id, user.accessToken, user.id);
        return Boolean(res.data);
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error cancelling appointment in DB:', err);
        return false;
      }
    }
    return true;
  }, [user?.id, user?.accessToken]);

  const loadCareCircle = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingCareCircle(true);
    setCareCircleError(null);
    try {
      const res = await careCircleService.getMembers(user.id, user.accessToken);
      if (res.error) {
        setCareCircleError(res.error);
      } else if (res.data) {
        setCareCircle(res.data);
      }
    } catch (err: any) {
      setCareCircleError(err?.message || 'Failed to load Care Circle');
    } finally {
      setIsLoadingCareCircle(false);
    }
  }, [user?.id, user?.accessToken]);

  const addCareCircleMember = useCallback(async (member: CareCircleMember): Promise<boolean> => {
    setCareCircle((prev) => [...prev, member]);
    if (user?.id && user?.accessToken) {
      try {
        const res = await careCircleService.inviteMember(user.id, user.accessToken, {
          name: member.name,
          email: member.email || `${member.name.toLowerCase().replace(/\s+/g, '')}@care.biopulse.health`,
          role: member.role,
          relationship: member.relationship,
          accessLevel: (member.accessLevel as any) || 'Full Access',
        });
        return Boolean(res.data);
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error adding Care Circle member to DB:', err);
        return false;
      }
    }
    return true;
  }, [user?.id, user?.accessToken]);

  const removeCareCircleMember = useCallback(async (id: string): Promise<boolean> => {
    setCareCircle((prev) => prev.filter((m) => m.id !== id));
    if (user?.accessToken) {
      try {
        const res = await careCircleService.revokeMember(id, user.accessToken);
        return Boolean(res.data);
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error revoking Care Circle member in DB:', err);
        return false;
      }
    }
    return true;
  }, [user?.accessToken]);

  const addToCareCircle = useCallback(async (member: Omit<CareCircleMember, 'id'>): Promise<boolean> => {
    const tempId = `care_${Date.now()}`;
    const newMember: CareCircleMember = {
      ...member,
      id: tempId,
    };
    setCareCircle((prev) => [...prev, newMember]);
    if (user?.id && user?.accessToken) {
      try {
        const res = await careCircleService.inviteMember(user.id, user.accessToken, {
          name: member.name,
          email: member.email || `${member.name.toLowerCase().replace(/\s+/g, '')}@care.biopulse.health`,
          role: member.role,
          relationship: member.relationship,
          accessLevel: (member.accessLevel as any) || 'Full Access',
        });
        if (res.data?.id) {
          setCareCircle((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: res.data!.id } : m))
          );
          return true;
        }
        return false;
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error adding Care Circle member to DB:', err);
        return false;
      }
    }
    return true;
  }, [user?.id, user?.accessToken]);

  const removeFromCareCircle = removeCareCircleMember;

  const updateCareCirclePermissions = useCallback(async (memberId: string, permissionsOrAccessLevel: any): Promise<boolean> => {
    if (!user?.accessToken) return false;
    try {
      const res = await careCircleService.updatePermissions(memberId, user.accessToken, permissionsOrAccessLevel);
      if (res.data) {
        loadCareCircle();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error updating Care Circle permissions in DB:', err);
      return false;
    }
  }, [user?.accessToken, loadCareCircle]);

  const updateVerifiedLab = useCallback((id: string, value: string) => {
    setVerifiedLabs((prev) =>
      prev.map((lab) => (lab.id === id ? { ...lab, value } : lab))
    );
  }, []);

  const loadReports = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingReports(true);
    setReportError(null);
    try {
      const res = await reportService.getReports(user.id, user.accessToken);
      if (res.error) {
        setReportError(res.error);
      } else if (res.data) {
        setReports(res.data);
      }
    } catch (err: any) {
      setReportError(err.message || 'Failed to load reports.');
    } finally {
      setIsLoadingReports(false);
    }
  }, [user?.id, user?.accessToken]);

  const loadVerifiedLabs = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    try {
      const res = await reportService.getVerifiedLabs(user.id, user.accessToken);
      if (res.data) {
        setVerifiedLabs(res.data);
      }
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error loading verified labs:', err);
    }
  }, [user?.id, user?.accessToken]);

  const confirmVerifiedLabs = useCallback(async (labs: ClinicalLabRow[], reportId?: string) => {
    setVerifiedLabs(labs);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const tempId = reportId || `rep_${Date.now()}`;
    const newReport: ReportItem = {
      id: tempId,
      title: 'Verified Lab Report (OCR Extracted)',
      date: dateStr,
      type: 'Lab',
      status: 'Completed',
      tags: labs.map((l) => l.testName.split(' ')[0]),
    };

    setReports((prev) => {
      if (reportId && prev.some((r) => r.id === reportId)) {
        return prev.map((r) => (r.id === reportId ? { ...r, status: 'Completed' } : r));
      }
      return [newReport, ...prev.filter((r) => r.id !== tempId)];
    });
    setPendingOcrReport(null);

    if (user?.id && user?.accessToken) {
      try {
        if (reportId) {
          await reportService.confirmReportVerification(
            reportId,
            user.id,
            user.accessToken,
            labs.map((l) => ({
              testName: l.testName,
              category: l.category,
              value: l.value,
              unit: l.unit,
              referenceRange: l.referenceRange,
              status: l.status,
              userVerified: true,
            }))
          );
        } else {
          await reportService.saveVerifiedReport(user.id, user.accessToken, {
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
              userVerified: true,
            })),
          });
        }
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error confirming verified report in DB:', err);
      }
    }
  }, [user?.id, user?.accessToken]);

  const saveReport = useCallback(async (input: any): Promise<ReportItem | null> => {
    if (!user?.id || !user?.accessToken) return null;
    try {
      const res = await reportService.saveVerifiedReport(user.id, user.accessToken, input);
      if (res.data) {
        setReports((prev) => [res.data!, ...prev.filter((r) => r.id !== res.data!.id)]);
        return res.data;
      }
      return null;
    } catch (err) {
      console.warn('[BioPulse HealthStore] Error saving report:', err);
      return null;
    }
  }, [user?.id, user?.accessToken]);

  const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    if (user?.id && user?.accessToken) {
      try {
        const res = await reportService.deleteReport(reportId, user.id, user.accessToken);
        return Boolean(res.data);
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error deleting report:', err);
        return false;
      }
    }
    return true;
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

  const loadNotifications = useCallback(async () => {
    if (!user?.id || !user?.accessToken) return;
    setIsLoadingNotifications(true);
    setNotificationError(null);
    try {
      const res = await notificationService.getNotifications(
        user.accessToken,
        user.id,
        pathway === 'male' || pathway === 'male_hypogonadism' ? 'male' : 'female'
      );
      if (res.data) {
        setNotificationList(res.data);
      } else if (res.error) {
        setNotificationError(res.error);
      }
    } catch (err: any) {
      setNotificationError(err?.message || 'Failed to load notifications');
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.id, user?.accessToken, pathway]);

  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    setNotificationList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    if (user?.id && user?.accessToken) {
      try {
        const res = await notificationService.markAsRead(id, user.accessToken, user.id);
        return Boolean(res.data);
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error marking notification as read:', err);
        return false;
      }
    }
    return true;
  }, [user?.id, user?.accessToken]);

  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    setNotificationList((prev) => prev.map((item) => ({ ...item, isRead: true })));
    if (user?.id && user?.accessToken) {
      try {
        const res = await notificationService.markAllAsRead(user.accessToken, user.id);
        return Boolean(res.data);
      } catch (err) {
        console.warn('[BioPulse HealthStore] Error marking all notifications as read:', err);
        return false;
      }
    }
    return true;
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
    loadAssessmentHistory,
    deleteAssessmentRecord,
    getLongitudinalTrend,
    cycle,
    cycleHistory,
    isLoadingCycle,
    cycleError,
    loadCycleData,
    updateCycle,
    logPeriodStart,
    logCycleEntry,
    deleteCycleEntry,

    symptoms,
    symptomHistory,
    isLoadingSymptoms,
    symptomError,
    loadSymptoms,
    toggleSymptom,
    setSymptomIntensity,
    addCustomSymptom,
    saveSymptomCheckIn,
    deleteSymptomLog,

    nutrition: nutritionState,
    isLoadingNutrition,
    nutritionError,
    loadNutritionData,
    addMeal,
    deleteMeal,
    removeMeal,
    setCuisineFilter: setCuisineFilterAction,

    water: waterState,
    isLoadingWater,
    waterError,
    loadWaterData,
    addWaterMl,
    deleteWaterLog,
    resetWater,

    movement: movementState,
    movementLogs,
    isLoadingMovement,
    movementError,
    loadMovementData,
    logActivity,
    deleteActivityLog,

    medications,
    medicationHistory,
    isLoadingMedications,
    medicationError,
    loadMedications,
    loadMedicationHistory,
    markMedicationStatus,
    addMedication,
    deleteMedication,

    measurementObservations,
    isLoadingMeasurements,
    measurementError,
    loadMeasurementObservations,
    logMeasurement,

    appointments,
    specialists,
    isLoadingAppointments,
    appointmentError,
    loadAppointments,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    careCircle,
    isLoadingCareCircle,
    careCircleError,
    loadCareCircle,
    addCareCircleMember,
    removeCareCircleMember,
    addToCareCircle,
    removeFromCareCircle,
    updateCareCirclePermissions,
    reports,
    isLoadingReports,
    reportError,
    loadReports,
    verifiedLabs,
    loadVerifiedLabs,
    pendingOcrReport,
    setPendingOcrReport,
    updateVerifiedLab,
    confirmVerifiedLabs,
    saveReport,
    deleteReport,
    notifications,
    updateNotificationSetting,
    notificationList,
    isLoadingNotifications,
    notificationError,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
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
