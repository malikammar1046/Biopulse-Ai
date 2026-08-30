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
  'PCOS (Polycystic Ovary Syndrome)',
  'Difficulty responding to insulin (Insulin Resistance)',
  'Thyroid Conditions (Hypothyroidism)',
  'High Blood Pressure',
  'Asthma',
  'Endometriosis',
  'Low Iron / Anemia',
  'None',
];

export const DEFAULT_FAMILY_HISTORY_OPTIONS = [
  'PCOS (Polycystic Ovary Syndrome)',
  'Type 2 Diabetes',
  'Heart Conditions',
  'Thyroid Conditions',
  'Early Menopause',
  'None',
];

export const DEFAULT_SYMPTOM_OPTIONS = [
  { id: 'pelvic_cramps', label: 'Pelvic Cramps', icon: 'Sparkles', desc: 'Lower stomach or period cramps' },
  { id: 'cystic_acne', label: 'Acne & Breakouts', icon: 'Flame', desc: 'Jawline, chin, or facial flare-ups' },
  { id: 'hirsutism', label: 'Unwanted Hair Growth', icon: 'Activity', desc: 'Darker facial or body hair' },
  { id: 'fatigue', label: 'Daily Fatigue', icon: 'Moon', desc: 'Feeling tired or low on energy during the day' },
  { id: 'bloating', label: 'Bloating & Fullness', icon: 'Droplets', desc: 'Water retention or stomach fullness' },
  { id: 'mood_shifts', label: 'Mood Changes', icon: 'Heart', desc: 'Irritability or feeling down around cycle days' },
  { id: 'sleep_changes', label: 'Sleep Changes', icon: 'Clock', desc: 'Difficulty falling or staying asleep' },
  { id: 'brain_fog', label: 'Brain Fog', icon: 'Brain', desc: 'Temporary dips in memory or focus' },
];

export const DIETARY_PREFERENCE_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant foods with dairy or eggs' },
  { id: 'vegan', label: 'Vegan', desc: '100% Plant-based eating' },
  { id: 'non_veg_halal', label: 'Non-Vegetarian / Halal', desc: 'Chicken, meat, fish, and vegetables' },
  { id: 'pescatarian', label: 'Pescatarian', desc: 'Fish, seafood, and vegetables' },
  { id: 'low_gi', label: 'Hormone-Friendly (Low Glycemic)', desc: 'Foods that keep blood sugar steady' },
  { id: 'gluten_free', label: 'Gluten-Free', desc: 'No wheat, barley, or rye' },
  { id: 'dairy_free', label: 'Dairy-Free', desc: 'Plant-based milks and non-dairy foods' },
];

export const EXERCISE_PREFERENCE_OPTIONS = [
  { id: 'walking', label: 'Brisk Walking', icon: 'Footprints', desc: 'Low-impact daily walking for steady energy' },
  { id: 'strength', label: 'Strength Training', icon: 'Dumbbell', desc: 'Gentle weights or home resistance exercises' },
  { id: 'pilates_yoga', label: 'Pilates & Yoga', icon: 'Smile', desc: 'Gentle stretching, core, and relaxation' },
  { id: 'hiit', label: 'Cardio / Aerobics', icon: 'Zap', desc: 'Cardio, dancing, or jogging' },
  { id: 'swimming', label: 'Swimming', icon: 'Waves', desc: 'Full-body movement that is gentle on joints' },
];

export const HEALTH_GOAL_OPTIONS = [
  {
    id: 'track_cycle',
    title: 'Track Period Cycle & Ovulation',
    desc: 'Understand your cycle rhythm, period length, and estimated fertile window.',
    icon: 'Calendar',
  },
  {
    id: 'manage_symptoms',
    title: 'Understand & Log Symptoms',
    desc: 'Connect acne, cramps, fatigue, and mood with different days in your cycle.',
    icon: 'Activity',
  },
  {
    id: 'improve_nutrition',
    title: 'Enjoy Hormone-Friendly Meals',
    desc: 'Get practical Pakistani food ideas to keep blood sugar and energy steady.',
    icon: 'Utensils',
  },
  {
    id: 'build_fitness',
    title: 'Build Gentle Movement Habits',
    desc: 'Low-stress movement routines matched to how you feel each day.',
    icon: 'Dumbbell',
  },
  {
    id: 'organize_reports',
    title: 'Organize Lab & Ultrasound Reports',
    desc: 'Keep all blood test results, ultrasound scans, and doctor notes in one private place.',
    icon: 'FileText',
  },
  {
    id: 'doctor_prep',
    title: 'Prepare for Doctor Visits',
    desc: 'Generate a clean 1-page summary to share with your gynecologist or physician.',
    icon: 'Stethoscope',
  },
  {
    id: 'digital_twin_ai',
    title: 'Get AI Health Insights',
    desc: 'Ask questions in plain English and discover patterns from your logs anytime.',
    icon: 'Bot',
  },
];
