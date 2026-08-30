/**
 * ==============================================================================
 * OvaSense Symptom & Pattern Tracking TypeScript Definitions
 * ==============================================================================
 */

export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

export type SymptomCategory = 'cycle_body' | 'skin_hair' | 'energy_mood' | 'sleep' | 'other';

export interface SymptomDefinition {
  id: string;
  name: string;
  category: SymptomCategory;
  categoryLabel: string;
  iconName: string;
  description: string;
  color: string;
}

export interface SymptomRecord {
  id: string;
  userId: string;
  symptomType: string;
  category: SymptomCategory;
  severity: SymptomSeverity;
  occurredAt: string; // ISO Date YYYY-MM-DD
  cycleDay: number | null; // Calculated cycle day when logged, or null if no active cycle
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomRecordInput {
  symptomType: string;
  category: SymptomCategory;
  severity: SymptomSeverity;
  occurredAt: string;
  cycleDay?: number | null;
  notes?: string;
}

export interface SymptomPatternObservation {
  id: string;
  title: string;
  description: string;
  type: 'frequency' | 'timing' | 'severity' | 'insight';
  symptomName: string;
  occurrenceCount: number;
  cycleTimingInfo?: string;
}

export interface SymptomSummaryStats {
  totalLoggedCount: number;
  loggedTodayCount: number;
  topSymptoms: { name: string; count: number; category: SymptomCategory }[];
  patternObservations: SymptomPatternObservation[];
  hasEnoughDataForPatterns: boolean;
}

/**
 * Standard Symptom Taxonomy across 5 main patient-friendly categories.
 */
export const SYMPTOM_CATALOG: SymptomDefinition[] = [
  // 1. Cycle & Body
  {
    id: 'cramps',
    name: 'Cramps',
    category: 'cycle_body',
    categoryLabel: 'Cycle & Body',
    iconName: 'Sparkles',
    description: 'Lower abdominal cramping or pelvic discomfort',
    color: '#FB7185',
  },
  {
    id: 'pelvic_discomfort',
    name: 'Pelvic Discomfort',
    category: 'cycle_body',
    categoryLabel: 'Cycle & Body',
    iconName: 'Activity',
    description: 'Aching, heaviness, or fullness in lower pelvis',
    color: '#FB7185',
  },
  {
    id: 'bloating',
    name: 'Bloating',
    category: 'cycle_body',
    categoryLabel: 'Cycle & Body',
    iconName: 'Droplets',
    description: 'Water retention or stomach fullness',
    color: '#FB7185',
  },
  {
    id: 'headache',
    name: 'Headache',
    category: 'cycle_body',
    categoryLabel: 'Cycle & Body',
    iconName: 'Flame',
    description: 'Tension, sinus, or cycle-linked headache',
    color: '#FB7185',
  },

  // 2. Skin & Hair
  {
    id: 'acne',
    name: 'Acne / Skin Changes',
    category: 'skin_hair',
    categoryLabel: 'Skin & Hair',
    iconName: 'SunMedium',
    description: 'Jawline, chin, or body breakouts',
    color: '#A21CAF',
  },
  {
    id: 'hair_thinning',
    name: 'Hair Thinning',
    category: 'skin_hair',
    categoryLabel: 'Skin & Hair',
    iconName: 'Scissors',
    description: 'Hair shedding or thinning along crown/parting',
    color: '#A21CAF',
  },
  {
    id: 'unwanted_hair',
    name: 'Increased Facial / Body Hair',
    category: 'skin_hair',
    categoryLabel: 'Skin & Hair',
    iconName: 'Layers',
    description: 'Darker or coarser hair growth on chin, upper lip, or abdomen',
    color: '#A21CAF',
  },

  // 3. Energy & Mood
  {
    id: 'fatigue',
    name: 'Fatigue',
    category: 'energy_mood',
    categoryLabel: 'Energy & Mood',
    iconName: 'Moon',
    description: 'Tiredness or low stamina during the day',
    color: '#8E3EAF',
  },
  {
    id: 'low_energy',
    name: 'Low Energy',
    category: 'energy_mood',
    categoryLabel: 'Energy & Mood',
    iconName: 'BatteryLow',
    description: 'Afternoon energy slump or feeling drained',
    color: '#8E3EAF',
  },
  {
    id: 'mood_changes',
    name: 'Mood Changes',
    category: 'energy_mood',
    categoryLabel: 'Energy & Mood',
    iconName: 'Heart',
    description: 'Irritability, emotional sensitivity, or feeling anxious',
    color: '#8E3EAF',
  },
  {
    id: 'stress',
    name: 'Stress',
    category: 'energy_mood',
    categoryLabel: 'Energy & Mood',
    iconName: 'CloudRain',
    description: 'Mental tension or elevated physical stress',
    color: '#8E3EAF',
  },

  // 4. Sleep
  {
    id: 'difficulty_sleeping',
    name: 'Difficulty Sleeping',
    category: 'sleep',
    categoryLabel: 'Sleep',
    iconName: 'Clock',
    description: 'Taking a long time to fall asleep or tossing/turning',
    color: '#6E2D8B',
  },
  {
    id: 'poor_sleep_quality',
    name: 'Poor Sleep Quality',
    category: 'sleep',
    categoryLabel: 'Sleep',
    iconName: 'BedDouble',
    description: 'Waking up frequently or not feeling rested in morning',
    color: '#6E2D8B',
  },

  // 5. Other
  {
    id: 'other',
    name: 'Other Symptom',
    category: 'other',
    categoryLabel: 'Other',
    iconName: 'HelpCircle',
    description: 'Any other body sensation you wish to remember',
    color: '#584B68',
  },
];

export const CATEGORY_METADATA: Record<SymptomCategory, { label: string; color: string; badgeClass: string }> = {
  cycle_body: {
    label: 'Cycle & Body',
    color: '#FB7185',
    badgeClass: 'bg-[#FDF2F8] text-[#FB7185] border-[#FDA4AF]/40',
  },
  skin_hair: {
    label: 'Skin & Hair',
    color: '#A21CAF',
    badgeClass: 'bg-[#FAF5FF] text-[#A21CAF] border-[#D8B4FE]/40',
  },
  energy_mood: {
    label: 'Energy & Mood',
    color: '#8E3EAF',
    badgeClass: 'bg-[#EDE4F7] text-[#8E3EAF] border-[#D8B4FE]/50',
  },
  sleep: {
    label: 'Sleep',
    color: '#6E2D8B',
    badgeClass: 'bg-[#F8F5FA] text-[#6E2D8B] border-[#E7DFEF]',
  },
  other: {
    label: 'Other',
    color: '#584B68',
    badgeClass: 'bg-[#F8F5FA] text-[#584B68] border-[#E7DFEF]',
  },
};
