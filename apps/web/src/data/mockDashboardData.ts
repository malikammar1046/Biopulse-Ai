import type {
  HealthSnapshotMetrics,
  TodayReminder,
  NutritionData,
  FitnessData,
  MedicalReportItem,
  CareCircleContact,
  HealthPatternPoint,
  DigitalTwinInsight,
} from '../types/dashboard';
import type { UserProfile } from '../types/onboarding';

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr_ayesha_khan',
  fullName: 'Ayesha Khan',
  email: 'ayesha.khan@example.com',
  phone: '+92 300 1234567',
  dateOfBirth: '1998-05-14',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isOnboarded: true,
  emergencyContacts: [
    {
      name: 'Zubair Khan',
      relationship: 'Brother / Emergency Contact',
      phone: '+92 321 7654321',
      isPrimary: true,
    },
  ],
  medical: {
    bloodType: 'B+',
    allergies: ['Penicillin'],
    medications: [
      {
        id: 'med_1',
        name: 'Metformin Hydrochloride',
        dosage: '500mg',
        frequency: 'Twice daily with meals',
        timeOfDay: '8:00 AM & 8:00 PM',
        takenToday: true,
      },
      {
        id: 'med_2',
        name: 'Myo-Inositol & D-Chiro Inositol (40:1)',
        dosage: '2,000mg',
        frequency: 'Daily morning',
        timeOfDay: '9:00 AM',
        takenToday: true,
      },
    ],
    conditions: ['Polycystic Ovary Syndrome (PCOS)', 'Mild Insulin Resistance'],
    surgeries: ['None'],
    familyHistory: ['Type 2 Diabetes (Maternal)', 'PCOS (Sister)'],
  },
  womensHealth: {
    cycleLength: 28,
    lastPeriodDate: '2025-05-06',
    periodRegularity: 'mostly_regular',
    periodDuration: 5,
    commonSymptoms: ['Pelvic cramps', 'Bloating', 'Jawline acne flare'],
    currentCycleDay: 14,
    currentPhase: 'follicular',
  },
  lifestyle: {
    dietaryPreference: 'Non-Vegetarian / Halal',
    dailyWaterGlasses: 8,
    activityLevel: 'moderate',
    exercisePreferences: ['Walking', 'Strength Training'],
    sleepHours: 7.5,
    workLifestyle: 'Desk / Hybrid Tech',
  },
  goals: {
    selectedGoals: [
      'Track cycle & predict ovulation',
      'Improve nutrition with hormone-friendly meals',
      'Prepare summaries for doctor appointments',
    ],
    supportPreference: 'structured_weekly',
  },
};

export const DEFAULT_SNAPSHOT_METRICS: HealthSnapshotMetrics = {
  cycleDay: 14,
  totalCycleDays: 28,
  phaseName: 'Follicular Phase',
  nextPeriodDays: 14,
  nextPeriodDate: 'June 3, 2025',
  symptomsCountToday: 3,
  symptomsList: [
    { name: 'Mild Cramps', severity: 'mild' },
    { name: 'Bloating', severity: 'mild' },
    { name: 'Clear Skin Today', severity: 'mild' },
  ],
  wellnessScore: 78,
  wellnessScoreChange: 8,
};

export const DEFAULT_TODAY_REMINDERS: TodayReminder[] = [
  {
    id: 'rem_1',
    title: 'Take Metformin 500mg',
    time: '8:00 AM',
    category: 'medication',
    completed: true,
  },
  {
    id: 'rem_2',
    title: 'Hydration Goal (2.4L)',
    time: 'All Day',
    category: 'hydration',
    completed: false,
  },
  {
    id: 'rem_3',
    title: 'Evening Walk 30 min',
    time: '6:30 PM',
    category: 'fitness',
    completed: false,
  },
  {
    id: 'rem_4',
    title: 'Cycle / Pad Routine Check',
    time: '10:00 PM',
    category: 'cycle',
    completed: false,
  },
];

export const DEFAULT_NUTRITION_DATA: NutritionData = {
  caloriesLogged: 1450,
  caloriesTarget: 1800,
  proteinGrams: 76,
  proteinTarget: 100,
  carbsGrams: 160,
  carbsTarget: 250,
  fatGrams: 40,
  fatTarget: 60,
  waterIntakeLiters: 1.8,
  waterTargetLiters: 2.4,
  meals: [
    {
      type: 'breakfast',
      name: '2 Eggs with Spinach, Multigrain Roti & Cardamom Chai',
      calories: 380,
      tags: ['High Protein', 'Low Glycemic'],
    },
    {
      type: 'lunch',
      name: 'Brown Rice with Yellow Moong Daal & Grilled Chicken Breast',
      calories: 580,
      tags: ['Balanced Fiber', 'Steady Energy'],
    },
    {
      type: 'dinner',
      name: 'Steamed Mixed Greens with Spiced Chickpeas (Chana Salad)',
      calories: 490,
      tags: ['Micronutrient Rich', 'Low Carb'],
    },
  ],
  suggestedMeals: [
    {
      name: 'Palak Paneer with Whole Wheat Roti',
      desc: 'Iron-rich spinach combined with paneer provides calcium and steady glucose release.',
      calories: 420,
      benefits: 'Supports follicular growth and prevents post-meal insulin spikes.',
      culturalTag: 'Traditional & PCOS-Friendly',
    },
    {
      name: 'Spiced Lentil Soup (Daal) with Flaxseed',
      desc: 'High in prebiotic fiber and omega-3s to support liver estrogen clearance.',
      calories: 320,
      benefits: 'Anti-inflammatory fiber blend for gut microbiome health.',
      culturalTag: 'Hormone Balancer',
    },
  ],
};

export const DEFAULT_FITNESS_DATA: FitnessData = {
  workoutsThisWeek: 3,
  weeklyGoal: 5,
  activeMinutesToday: 42,
  walkingMinutes: 25,
  strengthMinutes: 17,
  caloriesBurned: 240,
  suggestedMovement: {
    title: 'Low-Impact Strength & Mobility',
    duration: '25 min',
    intensity: 'moderate',
    reason: 'Follicular phase estrogen is rising, making it an ideal time for muscle engagement without elevated cortisol.',
    phaseAlignment: 'Follicular Phase Optimized',
  },
};

export const DEFAULT_MEDICAL_REPORTS: MedicalReportItem[] = [
  {
    id: 'rep_1',
    title: 'Hormone Panel (LH, FSH, Testosterone, DHEAS)',
    date: 'May 18, 2025',
    type: 'hormone_panel',
    status: 'reviewed',
    summary: 'LH/FSH ratio of 2.1:1. Moderate androgen elevation consistent with baseline profile.',
    keyBiomarker: 'LH:FSH 2.1 • Testosterone 58 ng/dL',
  },
  {
    id: 'rep_2',
    title: 'Pelvic Ultrasound (Bilateral Morphology Scan)',
    date: 'May 10, 2025',
    type: 'ultrasound',
    status: 'uploaded',
    summary: 'Ovarian volume 11.4 cm³ (L) and 12.1 cm³ (R). 20+ peripheral antral follicles per ovary.',
    keyBiomarker: 'Left Vol 11.4 cm³ • AFC 22',
  },
  {
    id: 'rep_3',
    title: 'Fasting Insulin & Glucose (HOMA-IR Panel)',
    date: 'May 5, 2025',
    type: 'glucose',
    status: 'reviewed',
    summary: 'HOMA-IR score of 2.4 indicates mild insulin sensitivity reduction.',
    keyBiomarker: 'HOMA-IR 2.4 • HbA1c 5.3%',
  },
];

export const DEFAULT_CARE_CIRCLE: CareCircleContact[] = [
  {
    id: 'cc_doc_1',
    name: 'Dr. Sara Malik',
    role: 'doctor',
    specialty: 'Reproductive Endocrinologist & Gynecologist',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    accessLevel: 'full',
    nextAppointment: 'May 28, 2025 at 11:00 AM',
    permissions: {
      symptoms: true,
      reports: true,
      medications: true,
      dietFitness: true,
      privateNotes: false,
    },
  },
  {
    id: 'cc_fam_1',
    name: 'Fatima Khan (Mom)',
    role: 'family',
    accessLevel: 'limited',
    permissions: {
      symptoms: true,
      reports: false,
      medications: true,
      dietFitness: true,
      privateNotes: false,
    },
  },
];

export const DEFAULT_DIGITAL_TWIN_INSIGHT: DigitalTwinInsight = {
  headline: 'Your health picture is becoming clearer.',
  summary:
    'You’ve logged 6 out of 7 days this week with steady movement consistency. Your sleep was slightly lower on Tuesday, which correlated with mild jawline acne.',
  highlights: [
    'Follicular phase energy is peaking—ideal for creative focus and strength training.',
    'Hydration is on track at 1.8L today.',
    'Ultrasound and hormone panel ready for your upcoming consultation with Dr. Sara Malik.',
  ],
  detectedPatterns: [
    'Pattern detected: Higher activity days show improved morning resting pulse.',
    'Pattern detected: Dairy intake correlated with temporary bloating on Day 11.',
  ],
  suggestedChatPrompt: 'What meals should I focus on during the upcoming ovulation window?',
};

export const MOCK_HEALTH_PATTERNS_7D: HealthPatternPoint[] = [
  { date: 'May 14', dayLabel: 'Wed', cyclePhase: 'follicular', symptomScore: 2, activityMinutes: 35, sleepHours: 7.8, nutritionAdherence: 90 },
  { date: 'May 15', dayLabel: 'Thu', cyclePhase: 'follicular', symptomScore: 1, activityMinutes: 45, sleepHours: 8.0, nutritionAdherence: 85 },
  { date: 'May 16', dayLabel: 'Fri', cyclePhase: 'follicular', symptomScore: 3, activityMinutes: 20, sleepHours: 6.5, nutritionAdherence: 75 },
  { date: 'May 17', dayLabel: 'Sat', cyclePhase: 'follicular', symptomScore: 2, activityMinutes: 50, sleepHours: 8.2, nutritionAdherence: 95 },
  { date: 'May 18', dayLabel: 'Sun', cyclePhase: 'follicular', symptomScore: 1, activityMinutes: 40, sleepHours: 7.5, nutritionAdherence: 80 },
  { date: 'May 19', dayLabel: 'Mon', cyclePhase: 'follicular', symptomScore: 2, activityMinutes: 30, sleepHours: 7.2, nutritionAdherence: 85 },
  { date: 'May 20', dayLabel: 'Today', cyclePhase: 'follicular', symptomScore: 2, activityMinutes: 42, sleepHours: 7.4, nutritionAdherence: 90 },
];

export const MOCK_HEALTH_PATTERNS_30D: HealthPatternPoint[] = [
  { date: 'Apr 21', dayLabel: 'Day 1', cyclePhase: 'period', symptomScore: 7, activityMinutes: 15, sleepHours: 6.8, nutritionAdherence: 70 },
  { date: 'Apr 26', dayLabel: 'Day 6', cyclePhase: 'follicular', symptomScore: 3, activityMinutes: 35, sleepHours: 7.5, nutritionAdherence: 80 },
  { date: 'May 01', dayLabel: 'Day 11', cyclePhase: 'follicular', symptomScore: 2, activityMinutes: 45, sleepHours: 8.0, nutritionAdherence: 85 },
  { date: 'May 04', dayLabel: 'Day 14', cyclePhase: 'ovulation', symptomScore: 2, activityMinutes: 50, sleepHours: 7.8, nutritionAdherence: 90 },
  { date: 'May 09', dayLabel: 'Day 19', cyclePhase: 'luteal', symptomScore: 4, activityMinutes: 30, sleepHours: 7.1, nutritionAdherence: 80 },
  { date: 'May 15', dayLabel: 'Day 25', cyclePhase: 'luteal', symptomScore: 6, activityMinutes: 25, sleepHours: 6.9, nutritionAdherence: 75 },
  { date: 'May 20', dayLabel: 'Today', cyclePhase: 'follicular', symptomScore: 2, activityMinutes: 42, sleepHours: 7.4, nutritionAdherence: 90 },
];

export const MOCK_HEALTH_PATTERNS_3M: HealthPatternPoint[] = [
  { date: 'March', dayLabel: 'Mar', cyclePhase: 'period', symptomScore: 5, activityMinutes: 30, sleepHours: 7.1, nutritionAdherence: 75 },
  { date: 'April', dayLabel: 'Apr', cyclePhase: 'follicular', symptomScore: 4, activityMinutes: 38, sleepHours: 7.4, nutritionAdherence: 82 },
  { date: 'May', dayLabel: 'May', cyclePhase: 'follicular', symptomScore: 2, activityMinutes: 44, sleepHours: 7.6, nutritionAdherence: 88 },
];

/**
 * Creates a clean, unpopulated UserProfile for fresh user registrations
 */
export function createEmptyUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    heightCm: null,
    weightKg: null,
    isOnboarded: false,
    createdAt: new Date().toISOString(),
    emergencyContacts: [],
    medical: {
      bloodType: '',
      allergies: [],
      medications: [],
      conditions: [],
      surgeries: [],
      familyHistory: [],
    },
    womensHealth: {
      cycleLength: 28,
      lastPeriodDate: '',
      periodRegularity: 'mostly_regular',
      periodDuration: 5,
      commonSymptoms: [],
      currentCycleDay: 1,
      currentPhase: 'follicular',
    },
    lifestyle: {
      dietaryPreference: 'Non-Vegetarian / Halal',
      dailyWaterGlasses: 8,
      activityLevel: 'moderate',
      exercisePreferences: ['Walking'],
      sleepHours: 7.5,
    },
    goals: {
      selectedGoals: ['Track cycle & predict ovulation'],
      supportPreference: 'structured_weekly',
    },
    ...overrides,
  };
}

/**
 * Dynamically derives checkable reminders from the user's active profile
 */
export function deriveRemindersFromProfile(profile: UserProfile): TodayReminder[] {
  const list: TodayReminder[] = [];

  // 1. Medication & Supplement Reminders
  if (profile.medical?.medications && profile.medical.medications.length > 0) {
    profile.medical.medications.forEach((med, idx) => {
      list.push({
        id: `rem_med_${med.id || idx}`,
        title: `Take ${med.name} ${med.dosage ? `(${med.dosage})` : ''}`.trim(),
        time: med.timeOfDay || (idx === 0 ? '8:00 AM' : '8:00 PM'),
        category: 'medication',
        completed: Boolean(med.takenToday),
      });
    });
  }

  // 2. Hydration Reminder based on exact daily water glasses
  const waterTargetL = ((profile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1);
  list.push({
    id: 'rem_hydration_daily',
    title: `Hydration Goal (${waterTargetL}L target)`,
    time: 'All Day',
    category: 'hydration',
    completed: false,
  });

  // 3. Movement / Fitness Routine based on user's preferred exercise
  const exerciseStyle = profile.lifestyle?.exercisePreferences?.[0] || 'Movement';
  list.push({
    id: 'rem_movement_routine',
    title: `${exerciseStyle} Session (30 min)`,
    time: '6:00 PM',
    category: 'fitness',
    completed: false,
  });

  // 4. Evening Cycle & Symptom Check-in
  list.push({
    id: 'rem_cycle_checkin',
    title: 'Daily Symptom & Hormone Check-in',
    time: '9:30 PM',
    category: 'cycle',
    completed: false,
  });

  return list;
}

/**
 * Dynamically derives customized nutrition targets and suggestions matching user's dietary preference
 */
export function deriveNutritionFromProfile(profile: UserProfile): NutritionData {
  const diet = profile.lifestyle?.dietaryPreference || 'Non-Vegetarian / Halal';
  const waterTargetL = Number(((profile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1));

  let suggestedMeals = DEFAULT_NUTRITION_DATA.suggestedMeals;

  if (diet.toLowerCase().includes('vegetarian') || diet.toLowerCase().includes('vegan')) {
    suggestedMeals = [
      {
        name: 'Spiced Lentil Moong Daal with Roasted Greens',
        desc: 'Rich in plant-based folate, prebiotics, and low-GI complex carbohydrates.',
        calories: 380,
        benefits: 'Supports steady liver metabolism and post-meal glucose stabilization.',
        culturalTag: 'Plant-Based & PCOS-Friendly',
      },
      {
        name: 'Tofu & Chickpea Stir-fry with Sesame Greens',
        desc: 'Complete amino acid profile with anti-inflammatory magnesium and fiber.',
        calories: 410,
        benefits: 'Promotes muscle glucose uptake without insulin spike.',
        culturalTag: 'High Plant Protein',
      },
    ];
  } else if (diet.toLowerCase().includes('gluten')) {
    suggestedMeals = [
      {
        name: 'Quinoa Bowl with Spiced Grilled Chicken & Herbs',
        desc: '100% naturally gluten-free complex grain with lean poultry and leafy greens.',
        calories: 450,
        benefits: 'Lowers systemic inflammation and gut permeability markers.',
        culturalTag: 'Gluten-Free Anti-Inflammatory',
      },
      {
        name: 'Millet Roti with Stewed Mixed Lentils & Spinach',
        desc: 'Ancient millet grain with slow carbohydrate breakdown.',
        calories: 390,
        benefits: 'Gentle on gut microbiome and prevents blood sugar swings.',
        culturalTag: 'Gluten-Free Traditional',
      },
    ];
  }

  return {
    caloriesLogged: 1450,
    caloriesTarget: 1800,
    proteinGrams: 76,
    proteinTarget: 100,
    carbsGrams: 160,
    carbsTarget: 250,
    fatGrams: 40,
    fatTarget: 60,
    waterIntakeLiters: Math.min(waterTargetL, 1.8),
    waterTargetLiters: waterTargetL,
    meals: DEFAULT_NUTRITION_DATA.meals,
    suggestedMeals,
  };
}

/**
 * Dynamically derives fitness data matching user's activity level & preferred exercises
 */
export function deriveFitnessFromProfile(profile: UserProfile, phaseName = 'Follicular Phase'): FitnessData {
  const activityLevel = profile.lifestyle?.activityLevel || 'moderate';
  const exerciseStyle = profile.lifestyle?.exercisePreferences?.[0] || 'Strength Training';

  let weeklyGoal = 4;
  if (activityLevel === 'sedentary') weeklyGoal = 3;
  if (activityLevel === 'very_active') weeklyGoal = 5;

  return {
    workoutsThisWeek: Math.min(weeklyGoal, 3),
    weeklyGoal,
    activeMinutesToday: 40,
    walkingMinutes: 25,
    strengthMinutes: 15,
    caloriesBurned: 230,
    suggestedMovement: {
      title: `${phaseName} ${exerciseStyle}`,
      duration: '25 min',
      intensity: activityLevel === 'very_active' ? 'moderate' : 'low',
      reason: `Aligned with your ${phaseName.toLowerCase()} and preference for ${exerciseStyle.toLowerCase()} to encourage glucose uptake without elevating cortisol.`,
      phaseAlignment: `${phaseName} Optimized`,
    },
  };
}

/**
 * Derives personalized Digital Twin narrative for the dashboard
 */
export function deriveInsightFromProfile(profile: UserProfile, phaseName = 'Follicular Phase'): DigitalTwinInsight {
  const firstName = profile.fullName?.trim() ? profile.fullName.trim().split(' ')[0] : 'there';
  const hasMed = profile.medical?.medications && profile.medical.medications.length > 0;
  const medName = hasMed ? profile.medical.medications[0].name : '';
  const symptomsLogged = profile.womensHealth?.commonSymptoms || [];

  const headline = `Hello ${firstName}, your health picture is coming together.`;
  const summary = `You are currently in your ${phaseName}. Your daily baseline is set to ${profile.lifestyle?.dailyWaterGlasses || 8} glasses of water and ${profile.lifestyle?.sleepHours || 7.5} hours of sleep.${hasMed ? ` Routine tracking for ${medName} is active.` : ''}`;

  const highlights = [
    `${phaseName} baseline: Ideal for steady movement consistency and nutrient-dense meals.`,
    `Hydration target set to ${((profile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)}L per day.`,
  ];

  if (symptomsLogged.length > 0) {
    highlights.push(`Monitoring recorded patterns for: ${symptomsLogged.slice(0, 2).join(', ')}.`);
  }

  const detectedPatterns = [
    'Pattern detected: Consistent hydration correlates with steady afternoon energy.',
    `Pattern detected: ${profile.lifestyle?.dietaryPreference || 'Current nutrition'} supports stable glucose release.`,
  ];

  return {
    headline,
    summary,
    highlights,
    detectedPatterns,
    suggestedChatPrompt: `What habits are most beneficial during my ${phaseName.toLowerCase()}?`,
  };
}

