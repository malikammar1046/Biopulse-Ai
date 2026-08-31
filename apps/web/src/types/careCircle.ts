// Types for Care Circle & Clinical Sharing

export type CareCircleRole = 'doctor' | 'family' | 'trusted_person';

export type CareCircleStatus = 'pending' | 'active' | 'revoked';

export type CareCirclePreset = 'private' | 'support' | 'doctor' | 'custom';

export type CareCirclePermissionKey =
  | 'profile'
  | 'cycle'
  | 'symptoms'
  | 'reports'
  | 'diet'
  | 'fitness'
  | 'medications'
  | 'appointments'
  | 'wellness'
  | 'weekly_summary'
  | 'chat_summary';

export type CareCirclePermissionsMap = Record<CareCirclePermissionKey, boolean>;

export interface PermissionDefinition {
  key: CareCirclePermissionKey;
  label: string;
  category: 'core' | 'clinical' | 'lifestyle' | 'intelligence';
  description: string;
  iconName: string;
  isSensitive?: boolean;
}

export const CARE_CIRCLE_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'profile',
    label: 'Basic Profile',
    category: 'core',
    description: 'Basic health baseline, age, and registered emergency contacts.',
    iconName: 'User',
  },
  {
    key: 'cycle',
    label: 'Cycle & Ovulation Rhythm',
    category: 'core',
    description: 'Cycle phases, period dates, duration, and rhythm trends.',
    iconName: 'Calendar',
  },
  {
    key: 'symptoms',
    label: 'Logged Symptoms',
    category: 'core',
    description: 'Daily symptom logs, pelvic discomfort, cramps, and severity trends.',
    iconName: 'Activity',
  },
  {
    key: 'reports',
    label: 'Lab & Ultrasound Reports',
    category: 'clinical',
    description: 'Uploaded blood panels, pelvic ultrasound results, and verified biomarkers.',
    iconName: 'FileText',
    isSensitive: true,
  },
  {
    key: 'medications',
    label: 'Medication Reminders',
    category: 'clinical',
    description: 'Prescribed medication schedule and daily adherence checks.',
    iconName: 'Pill',
  },
  {
    key: 'appointments',
    label: 'Appointments & Test Reminders',
    category: 'clinical',
    description: 'Upcoming doctor consultations, blood tests, and imaging dates.',
    iconName: 'Clock',
  },
  {
    key: 'wellness',
    label: 'Daily Wellness & Sleep',
    category: 'lifestyle',
    description: 'Sleep duration, daily water hydration, and overall well-being score.',
    iconName: 'Heart',
  },
  {
    key: 'diet',
    label: 'Nutrition & Meal Tracking',
    category: 'lifestyle',
    description: 'Logged meals, hormonal-support nutrition, and daily calories.',
    iconName: 'Utensils',
  },
  {
    key: 'fitness',
    label: 'Movement & Fitness Activity',
    category: 'lifestyle',
    description: 'Recorded workouts, walking minutes, and gentle activity tracking.',
    iconName: 'Dumbbell',
  },
  {
    key: 'weekly_summary',
    label: 'Weekly Health Overview',
    category: 'intelligence',
    description: 'Automatically synthesized longitudinal executive weekly brief.',
    iconName: 'Sparkles',
  },
  {
    key: 'chat_summary',
    label: 'Health Topics Summary (AI Chat)',
    category: 'intelligence',
    description: 'High-level discussion topic synthesis. Raw private chats are never exposed.',
    iconName: 'MessageSquare',
    isSensitive: true,
  },
];

export const PRESET_PERMISSIONS: Record<CareCirclePreset, CareCirclePermissionsMap> = {
  private: {
    profile: false,
    cycle: false,
    symptoms: false,
    reports: false,
    diet: false,
    fitness: false,
    medications: false,
    appointments: false,
    wellness: false,
    weekly_summary: false,
    chat_summary: false,
  },
  support: {
    profile: true,
    cycle: true,
    symptoms: true,
    reports: false,
    diet: false,
    fitness: false,
    medications: true,
    appointments: true,
    wellness: true,
    weekly_summary: true,
    chat_summary: false,
  },
  doctor: {
    profile: true,
    cycle: true,
    symptoms: true,
    reports: true,
    diet: true,
    fitness: true,
    medications: true,
    appointments: true,
    wellness: true,
    weekly_summary: true,
    chat_summary: true,
  },
  custom: {
    profile: true,
    cycle: true,
    symptoms: true,
    reports: false,
    diet: false,
    fitness: false,
    medications: false,
    appointments: false,
    wellness: false,
    weekly_summary: false,
    chat_summary: false,
  },
};

export interface CareCircleMember {
  id: string;
  patientId: string;
  email: string;
  name: string;
  role: CareCircleRole;
  relationship: string;
  clinicOrganization?: string;
  status: CareCircleStatus;
  inviteToken: string;
  lastViewedAt?: string;
  permissions: CareCirclePermissionsMap;
  createdAt: string;
  updatedAt: string;
}

export interface CareCircleInvitation {
  id: string;
  patientId: string;
  inviteEmail: string;
  memberName: string;
  role: CareCircleRole;
  relationship: string;
  clinicOrganization?: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  initialPermissions?: CareCirclePermissionsMap;
}

export interface CareCircleInviteInput {
  role: CareCircleRole;
  name: string;
  email: string;
  relationship: string;
  clinicOrganization?: string;
  preset: CareCirclePreset;
  permissions: CareCirclePermissionsMap;
}

export interface WeeklyTimelineDay {
  dayName: string; // 'Monday', 'Tuesday', ...
  date: string;
  mealsLogged: boolean;
  exerciseLogged: boolean;
  exerciseTitle?: string;
  symptoms: Array<{
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  hydrationLiters: number;
  medsCompleted: number;
  medsTotal: number;
}

export interface WeeklyHealthSummaryData {
  id?: string;
  patientId: string;
  weekStart: string;
  weekEnd: string;
  cycleDay: number;
  phaseName: string;
  symptomsCount: number;
  symptomBreakdown: Array<{ name: string; count: number }>;
  mealsLoggedDays: number;
  exerciseLoggedDays: number;
  medicationsCompleted: number;
  medicationsScheduled: number;
  newReportsCount: number;
  nextAppointmentDate?: string;
  nextAppointmentTitle?: string;
  timelineDays: WeeklyTimelineDay[];
  chatTopicsSummary?: string[];
  disclaimer: string;
  createdAt?: string;
}

export interface CareProviderViewData {
  isValid: boolean;
  member: {
    id: string;
    name: string;
    email: string;
    role: CareCircleRole;
    relationship: string;
    clinicOrganization?: string;
    status: CareCircleStatus;
    permissions: CareCirclePermissionsMap;
  } | null;
  patient: {
    name: string;
    age?: number;
    bloodType?: string;
    conditions?: string[];
  } | null;
  summary: WeeklyHealthSummaryData | null;
  reports?: Array<{
    id: string;
    title: string;
    reportType: string;
    reportDate: string;
    fileName: string;
    status: string;
    results: Array<{
      testName: string;
      resultValue: string;
      unit: string;
      referenceRange: string;
      status: string;
    }>;
  }>;
  cycleInfo?: {
    currentCycleDay: number;
    phaseName: string;
    cycleLength: number;
    periodDuration: number;
    lastPeriodDate: string;
  };
  symptoms?: Array<{
    id: string;
    symptomType: string;
    category: string;
    severity: string;
    occurredAt: string;
  }>;
  reminders?: Array<{
    id: string;
    title: string;
    category: string;
    time: string;
    completed: boolean;
  }>;
}
