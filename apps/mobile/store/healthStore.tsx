import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

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
  riskCategory: 'lower' | 'intermediate' | 'higher';
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
  maritalStatus: 'Single' | 'Married' | 'Prefer not to say';
  pregnancyStatus: 'Not Pregnant' | 'Currently Pregnant' | 'Trying to Conceive' | 'Prefer not to say';
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  profilePhotoUrl?: string;
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
  updateScreeningAssessment: (assessment: Partial<ScreeningAssessmentState>) => void;

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
}

const HealthContext = createContext<RealtimeHealthStoreValue | undefined>(undefined);

// ============================================================================
// INITIAL VALUES
// ============================================================================

const INITIAL_PROFILE: UserProfileState = {
  fullName: 'Ayesha Khan',
  email: 'ayesha.khan@example.com',
  dateOfBirth: '2002-03-15',
  age: 24,
  heightCm: 162,
  weightKg: 58,
  waistCm: 76,
  maritalStatus: 'Single',
  pregnancyStatus: 'Not Pregnant',
  emergencyContactName: 'Ali Khan',
  emergencyContactPhone: '+92 300 1234567',
  emergencyContactRelationship: 'Brother',
};

const INITIAL_SCREENING_FEMALE: ScreeningAssessmentState = {
  probabilityPercent: 72,
  riskBand: 'Higher Risk',
  riskCategory: 'higher',
  tier: 1,
  tierStatus: 'Tier 1 Complete',
  lastAssessedDate: '15 Apr 2026',
  topFactors: [
    {
      id: 'f1',
      name: 'Excess hair growth',
      impactPercent: 28,
      direction: 'increases_risk',
      explanation: 'More hair growth on face or body is strongly associated with elevated androgen levels.',
      iconName: 'cut-outline',
    },
    {
      id: 'f2',
      name: 'Irregular menstrual cycle',
      impactPercent: 22,
      direction: 'increases_risk',
      explanation: 'Unpredictable or delayed cycle intervals indicate ovulatory disruption.',
      iconName: 'calendar-outline',
    },
    {
      id: 'f3',
      name: 'Pimples / Acne',
      impactPercent: 18,
      direction: 'increases_risk',
      explanation: 'Persistent breakout pattern reflects androgenic stimulation of sebaceous glands.',
      iconName: 'sparkles-outline',
    },
  ],
  allFactors: [
    {
      id: 'f1',
      name: 'Excess hair growth',
      impactPercent: 28,
      direction: 'increases_risk',
      explanation: 'More hair growth on face or body is strongly associated with elevated androgen levels.',
      iconName: 'cut-outline',
    },
    {
      id: 'f2',
      name: 'Irregular menstrual cycle',
      impactPercent: 22,
      direction: 'increases_risk',
      explanation: 'Unpredictable or delayed cycle intervals indicate ovulatory disruption.',
      iconName: 'calendar-outline',
    },
    {
      id: 'f3',
      name: 'Pimples / Acne',
      impactPercent: 18,
      direction: 'increases_risk',
      explanation: 'Persistent breakout pattern reflects androgenic stimulation of sebaceous glands.',
      iconName: 'sparkles-outline',
    },
    {
      id: 'f4',
      name: 'Weight gain difficulty',
      impactPercent: 15,
      direction: 'increases_risk',
      explanation: 'Difficulty losing weight points to potential peripheral insulin resistance.',
      iconName: 'scale-outline',
    },
    {
      id: 'f5',
      name: 'Healthy Sleep Schedule',
      impactPercent: 8,
      direction: 'decreases_risk',
      explanation: '7+ hours of quality sleep promotes regular nocturnal endocrine rhythm.',
      iconName: 'moon-outline',
    },
  ],
  isNonDiagnostic: true,
};

const INITIAL_CYCLE: CycleTrackingState = {
  currentCycleDay: 14,
  cycleLength: 29,
  periodDuration: 5,
  lastPeriodStartDate: '2026-09-18',
  nextPeriodDaysRemaining: 15,
  nextPeriodExpectedDate: '2026-10-17',
  fertileWindowStart: '2026-09-28',
  fertileWindowEnd: '2026-10-03',
  phase: 'Follicular Phase',
  regularity: 'irregular',
  flow: 'Moderate',
  missedPeriodsPerYear: '1-2',
  notes: 'Mild cramps on Day 2, energy lower than usual.',
};

const INITIAL_SYMPTOMS: SymptomCheckInState = {
  loggedToday: true,
  lastUpdatedTime: 'Today, 8:30 AM',
  intensity: 'Moderate',
  notes: 'Mild bloating after lunch, mood is balanced.',
  symptoms: [
    { id: 'acne', name: 'Acne', category: 'physical', selected: true, intensity: 'Moderate' },
    { id: 'hair_growth', name: 'Hair growth', category: 'physical', selected: true, intensity: 'Moderate' },
    { id: 'hair_loss', name: 'Hair loss', category: 'physical', selected: true, intensity: 'Mild' },
    { id: 'bloating', name: 'Bloating', category: 'other', selected: true, intensity: 'Mild' },
    { id: 'mood', name: 'Mood swings', category: 'other', selected: false },
    { id: 'cramps', name: 'Cramps', category: 'menstrual', selected: false },
    { id: 'fatigue', name: 'Fatigue', category: 'other', selected: true, intensity: 'Moderate' },
    { id: 'skin_darkening', name: 'Skin darkening', category: 'physical', selected: false },
    { id: 'irregular_periods', name: 'Irregular periods', category: 'menstrual', selected: true, intensity: 'Moderate' },
  ],
};

const INITIAL_MEALS: MealItem[] = [
  {
    id: 'm1',
    name: 'Breakfast Bowl',
    mealType: 'breakfast',
    description: 'Greek yogurt with blueberries, chia seeds, and granola',
    calories: 340,
    proteinGrams: 22,
    time: '8:00 AM',
  },
  {
    id: 'm2',
    name: 'Grilled Chicken & Rice',
    mealType: 'lunch',
    description: 'Spiced chicken breast, brown rice, and cucumber salad',
    calories: 540,
    proteinGrams: 36,
    time: '12:30 PM',
  },
  {
    id: 'm3',
    name: 'Steamed Fish & Greens',
    mealType: 'dinner',
    description: 'Fresh grilled fish fillet with stir-fried leafy greens',
    calories: 440,
    proteinGrams: 30,
    time: '7:45 PM',
  },
];

const INITIAL_WATER_LOGS: WaterLogEntry[] = [
  { id: 'w1', time: '8:30 AM', amountMl: 250 },
  { id: 'w2', time: '11:10 AM', amountMl: 500 },
  { id: 'w3', time: '2:00 PM', amountMl: 350 },
  { id: 'w4', time: '4:15 PM', amountMl: 500 },
];

const INITIAL_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med1',
    name: 'Metformin',
    dosage: '500 mg',
    scheduledTime: '8:00 PM',
    instructions: 'Take with food',
    status: 'pending',
    pathway: 'female',
  },
  {
    id: 'med2',
    name: 'Vitamin D3',
    dosage: '1000 IU',
    scheduledTime: '9:00 AM',
    instructions: 'After breakfast',
    status: 'taken',
    pathway: 'all',
  },
  {
    id: 'med3',
    name: 'Inositol Supplement',
    dosage: '2000 mg',
    scheduledTime: '1:00 PM',
    instructions: 'With lunch',
    status: 'taken',
    pathway: 'female',
  },
  {
    id: 'med4',
    name: 'Testosterone Gel 1%',
    dosage: '50 mg',
    scheduledTime: '8:00 AM',
    instructions: 'Apply to shoulders after shower',
    status: 'pending',
    pathway: 'male',
  },
];

const SPECIALISTS_LIST: SpecialistDoctor[] = [
  {
    id: 'doc1',
    name: 'Dr. Sara Khan',
    specialty: 'Gynecologist',
    pathway: 'female',
    hospital: 'Aga Khan University Hospital',
    experienceYears: 12,
    patientsCount: 1200,
    rating: 4.8,
    areasOfExpertise: ['PCOS Management', 'Menstrual Disorders', 'Hormonal Imbalance', 'Fertility Planning'],
    about: 'Dr. Sara Khan is a senior consultant gynecologist with over 12 years of specialized clinical experience in women\'s hormonal health, PCOS management, and reproductive medicine.',
    isAvailableToday: true,
  },
  {
    id: 'doc2',
    name: 'Dr. Ayesha Malik',
    specialty: 'Endocrinologist',
    pathway: 'female',
    hospital: 'Shaukat Khanum Hospital',
    experienceYears: 14,
    patientsCount: 1850,
    rating: 4.9,
    areasOfExpertise: ['Endocrine Disorders', 'Insulin Resistance', 'Thyroid Health', 'Metabolic Syndrome'],
    about: 'Consultant endocrinologist specializing in complex reproductive endocrine disorders and metabolic syndrome in young women.',
    isAvailableToday: true,
  },
  {
    id: 'doc3',
    name: 'Dr. Ahmed Raza',
    specialty: 'Urologist & Andrologist',
    pathway: 'male',
    hospital: 'Mayo Hospital, Lahore',
    experienceYears: 10,
    patientsCount: 950,
    rating: 4.7,
    areasOfExpertise: ['Hypogonadism (LOH)', 'Male Fertility', 'Hormonal Disorders', 'Erectile Dysfunction'],
    about: 'Dr. Ahmed Raza is a consultant urologist and male fertility specialist with deep expertise in testosterone replacement therapy and late-onset hypogonadism.',
    isAvailableToday: true,
  },
  {
    id: 'doc4',
    name: 'Dr. Farhan Ali',
    specialty: 'Endocrinologist',
    pathway: 'male',
    hospital: 'National Hospital',
    experienceYears: 16,
    patientsCount: 2200,
    rating: 4.8,
    areasOfExpertise: ['Male Endocrine Disorders', 'Hypopituitarism', 'Testosterone Optimization', 'Cardiometabolic Health'],
    about: 'Senior endocrinologist dedicated to male vitality, morning testosterone pulsatility monitoring, and metabolic syndrome recovery.',
    isAvailableToday: true,
  },
  {
    id: 'doc5',
    name: 'Dr. Sana Tariq',
    specialty: 'Clinical Nutritionist',
    pathway: 'female',
    hospital: 'Evercare Hospital',
    experienceYears: 8,
    patientsCount: 800,
    rating: 4.8,
    areasOfExpertise: ['PCOS Dietetics', 'Low-Glycemic Meal Design', 'Micronutrient Replenishment'],
    about: 'Registered clinical dietitian providing culturally tailored South Asian meal plans for insulin-resistant PCOS.',
    isAvailableToday: true,
  },
  {
    id: 'doc6',
    name: 'Dr. Bilal Hussain',
    specialty: 'Endocrinologist',
    pathway: 'male',
    hospital: 'Shifa International Hospital',
    experienceYears: 11,
    patientsCount: 1100,
    rating: 4.7,
    areasOfExpertise: ['Andrology', 'Thyroid & Adrenal Axis', 'Metabolic Health'],
    about: 'Specialist in endocrine axis recovery, body composition optimization, and hypogonadal screening.',
    isAvailableToday: false,
  },
];

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt1',
    doctorId: 'doc1',
    doctorName: 'Dr. Sara Khan',
    specialty: 'Gynecologist',
    clinicOrHospital: 'Aga Khan University Hospital',
    date: 'Tue, 10 Oct 2026',
    time: '11:00 AM',
    location: 'Main Campus, Lahore',
    visitType: 'In-person',
    status: 'Upcoming',
  },
  {
    id: 'apt2',
    doctorId: 'doc3',
    doctorName: 'Dr. Ahmed Raza',
    specialty: 'Urologist',
    clinicOrHospital: 'Mayo Hospital, Lahore',
    date: 'Mon, 9 Oct 2026',
    time: '10:30 AM',
    location: 'Mayo Hospital, Lahore',
    visitType: 'In-person',
    status: 'Upcoming',
  },
];

const INITIAL_CARE_CIRCLE: CareCircleMember[] = [
  {
    id: 'cc1',
    name: 'Dr. Sara Khan',
    role: 'Doctor',
    relationship: 'Gynecologist',
    accessLevel: 'Full Access',
  },
  {
    id: 'cc2',
    name: 'Fatima Khan',
    role: 'Family Member',
    relationship: 'Sister',
    accessLevel: 'View Only',
  },
  {
    id: 'cc3',
    name: 'Ali Khan',
    role: 'Trusted Contact',
    relationship: 'Brother / Emergency Contact',
    accessLevel: 'View Only',
  },
];

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep1',
    title: 'PCOS Screening Report',
    date: '22 Sep 2026',
    type: 'Screening',
    status: 'Completed',
    tags: ['Tier 1', 'Risk Assessment'],
  },
  {
    id: 'rep2',
    title: 'Hormone Panel Lab Report',
    date: '12 Sep 2026',
    type: 'Lab',
    status: 'Uploaded',
    tags: ['FSH', 'LH', 'TSH', 'Prolactin', 'Vitamin D'],
  },
  {
    id: 'rep3',
    title: 'Comprehensive Clinical Summary',
    date: '22 Sep 2026',
    type: 'Clinical Summary',
    status: 'Generated',
    tags: ['Physician Ready', 'Exported PDF'],
  },
];

const INITIAL_VERIFIED_LABS: ClinicalLabRow[] = [
  { id: 'lab1', testName: 'FSH (Follicle Stimulating Hormone)', category: 'Hormones', value: '6.2', unit: 'mIU/mL', referenceRange: '3.5 - 12.5', status: 'Normal' },
  { id: 'lab2', testName: 'LH (Luteinizing Hormone)', category: 'Hormones', value: '12.4', unit: 'mIU/mL', referenceRange: '2.4 - 12.6', status: 'Normal' },
  { id: 'lab3', testName: 'TSH (Thyroid Stimulating Hormone)', category: 'Hormones', value: '2.1', unit: 'μIU/mL', referenceRange: '0.4 - 4.0', status: 'Normal' },
  { id: 'lab4', testName: 'Prolactin', category: 'Hormones', value: '18.7', unit: 'ng/mL', referenceRange: '4.8 - 23.3', status: 'Normal' },
  { id: 'lab5', testName: 'HbA1c (Glycated Hemoglobin)', category: 'Metabolic', value: '5.6', unit: '%', referenceRange: '4.0 - 5.6', status: 'Normal' },
  { id: 'lab6', testName: 'Vitamin D (25-OH)', category: 'Other', value: '18', unit: 'ng/mL', referenceRange: '30 - 100', status: 'Low' },
];

const INITIAL_NOTIFICATIONS: NotificationSettingsState = {
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
// PROVIDER COMPONENT
// ============================================================================

export const RealtimeHealthStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pathway, setPathway] = useState<HealthPathway>('female');
  const [profile, setProfile] = useState<UserProfileState>(INITIAL_PROFILE);
  const [screening, setScreening] = useState<ScreeningAssessmentState>(INITIAL_SCREENING_FEMALE);
  const [cycle, setCycle] = useState<CycleTrackingState>(INITIAL_CYCLE);
  const [symptoms, setSymptoms] = useState<SymptomCheckInState>(INITIAL_SYMPTOMS);
  const [meals, setMeals] = useState<MealItem[]>(INITIAL_MEALS);
  const [cuisineFilter, setCuisineFilter] = useState<'South Asian' | 'Vegetarian' | 'Low-cost'>('South Asian');
  const [waterLogs, setWaterLogs] = useState<WaterLogEntry[]>(INITIAL_WATER_LOGS);
  const [movementMinutes, setMovementMinutes] = useState<number>(45);
  const [movementSteps, setMovementSteps] = useState<number>(7842);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>(INITIAL_CARE_CIRCLE);
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [verifiedLabs, setVerifiedLabs] = useState<ClinicalLabRow[]>(INITIAL_VERIFIED_LABS);
  const [notifications, setNotifications] = useState<NotificationSettingsState>(INITIAL_NOTIFICATIONS);

  const isFemale = pathway === 'female' || pathway === 'female_pcos';

  // 1. BMI Calculation
  const bmi = useMemo(() => {
    if (!profile.heightCm || !profile.weightKg) return 22.1;
    const hM = profile.heightCm / 100;
    return parseFloat((profile.weightKg / (hM * hM)).toFixed(1));
  }, [profile.heightCm, profile.weightKg]);

  const bmiCategory = useMemo(() => {
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
      if (val !== undefined && val !== null && String(val).trim().length > 0) completed++;
    };
    check(profile.fullName);
    check(profile.email);
    check(profile.dateOfBirth);
    check(profile.heightCm);
    check(profile.weightKg);
    check(profile.waistCm);
    check(profile.emergencyContactName);
    check(profile.emergencyContactPhone);
    check(screening.probabilityPercent);
    check(cycle.regularity);
    check(symptoms.loggedToday);
    check(medications.length);
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
        { day: 'Mon', minutes: 35 },
        { day: 'Tue', minutes: 50 },
        { day: 'Wed', minutes: 30 },
        { day: 'Thu', minutes: 55 },
        { day: 'Fri', minutes: 40 },
        { day: 'Sat', minutes: 25 },
        { day: 'Sun', minutes: movementMinutes },
      ],
      currentGoalText: '60 min/day',
    };
  }, [movementMinutes, movementSteps]);

  // 6. Specialist filtering by pathway
  const specialists = useMemo(() => {
    const targetPathway = isFemale ? 'female' : 'male';
    return SPECIALISTS_LIST.filter((s) => s.pathway === targetPathway);
  }, [isFemale]);

  // ---------------------------------------------------------------------------
  // ACTIONS / MUTATORS
  // ---------------------------------------------------------------------------

  const switchPathway = useCallback((p: HealthPathway) => {
    setPathway(p);
    const isNowFemale = p === 'female' || p === 'female_pcos';
    if (!isNowFemale) {
      setProfile((prev) => ({
        ...prev,
        fullName: prev.fullName === 'Ayesha Khan' ? 'Ahmed Raza' : prev.fullName,
        age: prev.age === 24 ? 32 : prev.age,
        weightKg: 82,
        heightCm: 178,
        waistCm: 90,
      }));
      setScreening({
        probabilityPercent: 26,
        riskBand: 'Intermediate Risk',
        riskCategory: 'intermediate',
        tier: 1,
        tierStatus: 'Tier 1 Complete',
        lastAssessedDate: '10 Apr 2026',
        topFactors: [
          { id: 'm1', name: 'Reduced morning energy', impactPercent: 24, direction: 'increases_risk', explanation: 'Suboptimal early vitality correlates with reduced nocturnal testosterone pulsatility.', iconName: 'flash-outline' },
          { id: 'm2', name: 'Decreased muscle recovery', impactPercent: 18, direction: 'increases_risk', explanation: 'Prolonged soreness and fatigue post-resistance exercise.', iconName: 'barbell-outline' },
          { id: 'm3', name: 'Waist circumference index', impactPercent: 15, direction: 'increases_risk', explanation: 'Visceral adiposity increases peripheral aromatization of testosterone to estradiol.', iconName: 'body-outline' },
        ],
        allFactors: [],
        isNonDiagnostic: true,
      });
    } else {
      setProfile((prev) => ({
        ...prev,
        fullName: prev.fullName === 'Ahmed Raza' ? 'Ayesha Khan' : prev.fullName,
        age: 24,
        weightKg: 58,
        heightCm: 162,
        waistCm: 76,
      }));
      setScreening(INITIAL_SCREENING_FEMALE);
    }
  }, []);

  const updateProfile = useCallback((partial: Partial<UserProfileState>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateScreeningAssessment = useCallback((assessment: Partial<ScreeningAssessmentState>) => {
    setScreening((prev) => ({ ...prev, ...assessment }));
  }, []);

  const updateCycle = useCallback((partial: Partial<CycleTrackingState>) => {
    setCycle((prev) => ({ ...prev, ...partial }));
  }, []);

  const logPeriodStart = useCallback((dateString: string, flow: 'Light' | 'Moderate' | 'Heavy' = 'Moderate') => {
    setCycle((prev) => ({
      ...prev,
      lastPeriodStartDate: dateString,
      currentCycleDay: 1,
      phase: 'Menstrual Phase',
      flow,
      nextPeriodDaysRemaining: prev.cycleLength,
    }));
  }, []);

  const toggleSymptom = useCallback((symptomId: string) => {
    setSymptoms((prev) => ({
      ...prev,
      loggedToday: true,
      lastUpdatedTime: 'Just now',
      symptoms: prev.symptoms.map((s) => (s.id === symptomId ? { ...s, selected: !s.selected } : s)),
    }));
  }, []);

  const setSymptomIntensity = useCallback((intensity: 'Mild' | 'Moderate' | 'Severe') => {
    setSymptoms((prev) => ({
      ...prev,
      intensity,
      lastUpdatedTime: 'Just now',
    }));
  }, []);

  const saveSymptomCheckIn = useCallback((notes: string) => {
    setSymptoms((prev) => ({
      ...prev,
      loggedToday: true,
      lastUpdatedTime: 'Just now',
      notes,
    }));
  }, []);

  const addMeal = useCallback((meal: Omit<MealItem, 'id'>) => {
    const newMeal: MealItem = {
      ...meal,
      id: `meal_${Date.now()}`,
    };
    setMeals((prev) => [...prev, newMeal]);
  }, []);

  const deleteMeal = useCallback((id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

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
    setWaterLogs((prev) => [...prev, newEntry]);
  }, []);

  const deleteWaterLog = useCallback((id: string) => {
    setWaterLogs((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const resetWater = useCallback(() => {
    setWaterLogs([]);
  }, []);

  const removeMeal = deleteMeal;

  const updateProfileMetrics = useCallback((weightKg: number, heightCm: number) => {
    updateProfile({ weightKg, heightCm });
  }, [updateProfile]);

  const logActivity = useCallback((minutes: number, steps?: number) => {
    setMovementMinutes((prev) => prev + minutes);
    if (steps) {
      setMovementSteps((prev) => prev + steps);
    }
  }, []);

  const markMedicationStatus = useCallback((id: string, status: 'pending' | 'taken' | 'skipped' | 'snoozed') => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, status } : med))
    );
  }, []);

  const addMedication = useCallback((med: Omit<MedicationItem, 'id'>) => {
    const newMed: MedicationItem = {
      ...med,
      id: `med_${Date.now()}`,
    };
    setMedications((prev) => [...prev, newMed]);
  }, []);

  const bookAppointment = useCallback((appointment: Omit<AppointmentItem, 'id' | 'status'>) => {
    const newApt: AppointmentItem = {
      ...appointment,
      id: `apt_${Date.now()}`,
      status: 'Upcoming',
    };
    setAppointments((prev) => [newApt, ...prev]);
  }, []);

  const rescheduleAppointment = useCallback((id: string, date: string, time: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date, time } : a))
    );
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
    );
  }, []);

  const addCareCircleMember = useCallback((member: CareCircleMember) => {
    setCareCircle((prev) => [...prev, member]);
  }, []);

  const removeCareCircleMember = useCallback((id: string) => {
    setCareCircle((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addToCareCircle = useCallback((member: Omit<CareCircleMember, 'id'>) => {
    const newMember: CareCircleMember = {
      ...member,
      id: `care_${Date.now()}`,
    };
    setCareCircle((prev) => [...prev, newMember]);
  }, []);

  const removeFromCareCircle = removeCareCircleMember;

  const updateVerifiedLab = useCallback((id: string, value: string) => {
    setVerifiedLabs((prev) =>
      prev.map((lab) => (lab.id === id ? { ...lab, value } : lab))
    );
  }, []);

  const confirmVerifiedLabs = useCallback((labs: ClinicalLabRow[]) => {
    setVerifiedLabs(labs);
    // Add to reports
    const newReport: ReportItem = {
      id: `rep_${Date.now()}`,
      title: 'Verified Lab Report (OCR Extracted)',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'Lab',
      status: 'Completed',
      tags: labs.map((l) => l.testName.split(' ')[0]),
    };
    setReports((prev) => [newReport, ...prev]);
  }, []);

  const updateNotificationSetting = useCallback((key: keyof NotificationSettingsState, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  }, []);

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
    updateScreeningAssessment,
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
