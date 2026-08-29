export const DEFAULT_ALLERGY_OPTIONS = [
  'Penicillin',
  'Sulfa Drugs',
  'Latex',
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Dairy / Lactose',
  'Pollen',
  'None',
];

export const DEFAULT_CONDITION_OPTIONS = [
  'PCOS / PCOM',
  'Insulin Resistance',
  'Hypothyroidism / Hashimoto’s',
  'Hypertension',
  'Asthma',
  'Endometriosis',
  'Iron Deficiency Anemia',
  'None',
];

export const DEFAULT_FAMILY_HISTORY_OPTIONS = [
  'PCOS (Polycystic Ovary Syndrome)',
  'Type 2 Diabetes',
  'Cardiovascular Disease',
  'Thyroid Disorders',
  'Early Menopause',
  'None',
];

export const DEFAULT_SYMPTOM_OPTIONS = [
  { id: 'pelvic_cramps', label: 'Pelvic Cramps', icon: 'Sparkles', desc: 'Lower abdominal tenderness' },
  { id: 'cystic_acne', label: 'Cystic Acne', icon: 'Flame', desc: 'Jawline/chin flare-ups' },
  { id: 'hirsutism', label: 'Excess Hair Growth', icon: 'Activity', desc: 'Facial or body hair' },
  { id: 'fatigue', label: 'Diurnal Fatigue', icon: 'Moon', desc: 'Low morning/afternoon energy' },
  { id: 'bloating', label: 'Digestive Bloating', icon: 'Droplets', desc: 'Water retention & fullness' },
  { id: 'mood_shifts', label: 'Mood Shifts', icon: 'Heart', desc: 'Cycle-linked irritability/anxiety' },
  { id: 'sleep_changes', label: 'Sleep Changes', icon: 'Clock', desc: 'Difficulty falling/staying asleep' },
  { id: 'brain_fog', label: 'Brain Fog', icon: 'Brain', desc: 'Focus & memory dips' },
];

export const DIETARY_PREFERENCE_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy/eggs' },
  { id: 'vegan', label: 'Vegan', desc: '100% Plant-based nutrition' },
  { id: 'non_veg_halal', label: 'Non-Vegetarian / Halal', desc: 'Poultry, meat, fish, and plants' },
  { id: 'pescatarian', label: 'Pescatarian', desc: 'Fish & plant-forward' },
  { id: 'low_gi', label: 'Low Glycemic Index (PCOS)', desc: 'Focus on blood sugar stability' },
  { id: 'gluten_free', label: 'Gluten-Free', desc: 'No wheat/barley/rye' },
  { id: 'dairy_free', label: 'Dairy-Free', desc: 'Plant milk and non-dairy foods' },
];

export const EXERCISE_PREFERENCE_OPTIONS = [
  { id: 'walking', label: 'Brisk Walking', icon: 'Footprints', desc: 'Low-impact zone 2 movement' },
  { id: 'strength', label: 'Strength Training', icon: 'Dumbbell', desc: 'Resistance for glucose uptake' },
  { id: 'pilates_yoga', label: 'Pilates & Yoga', icon: 'Smile', desc: 'Core tone & nervous system calm' },
  { id: 'hiit', label: 'HIIT / Cardio', icon: 'Zap', desc: 'High-intensity intervals' },
  { id: 'swimming', label: 'Swimming', icon: 'Waves', desc: 'Full-body joint-friendly cardio' },
];

export const HEALTH_GOAL_OPTIONS = [
  {
    id: 'track_cycle',
    title: 'Track Cycle & Predict Ovulation',
    desc: 'Uncover patterns in cycle lengths, fertile windows, and delayed phases.',
    icon: 'Calendar',
  },
  {
    id: 'manage_symptoms',
    title: 'Understand & Manage Symptoms',
    desc: 'Correlate acne, cramps, fatigue, and mood with hormone trajectories.',
    icon: 'Activity',
  },
  {
    id: 'improve_nutrition',
    title: 'Improve Hormone-Friendly Nutrition',
    desc: 'Receive culturally tailored meal guidance to stabilize insulin and energy.',
    icon: 'Utensils',
  },
  {
    id: 'build_fitness',
    title: 'Build Consistent Movement Habits',
    desc: 'Cortisol-conscious workouts aligned with your cycle phases.',
    icon: 'Dumbbell',
  },
  {
    id: 'organize_reports',
    title: 'Organize Ultrasound & Lab Reports',
    desc: 'Instant OCR extraction for ovarian volume, AMH, LH/FSH, and blood panels.',
    icon: 'FileText',
  },
  {
    id: 'doctor_prep',
    title: 'Prepare Summaries for Doctor Visits',
    desc: 'Generate structured longitudinal reports ready for your gynecologist.',
    icon: 'Stethoscope',
  },
  {
    id: 'digital_twin_ai',
    title: 'Explore Health Insights with OvaSense AI',
    desc: 'Ask contextual questions to your personal Digital Twin companion 24/7.',
    icon: 'Bot',
  },
];
