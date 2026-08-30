/**
 * ==============================================================================
 * OvaSense Global Patient-Friendly Terminology Guide
 * Single Source of Truth for UX Writing & Health Content
 * ==============================================================================
 * 
 * CORE PRINCIPLE:
 * "Explain health like a knowledgeable person talking to a patient, not like a medical textbook."
 * 
 * RULE:
 * 1. Prefer simple, familiar words.
 * 2. Keep medical accuracy (simple explanation first, followed optionally by clinical term).
 * 3. Keep buttons clear and actionable.
 * 4. Maintain a premium, trustworthy, and supportive tone.
 */

export interface TermDefinition {
  clinicalTerm: string;
  patientFriendlyTerm: string;
  simpleExplanation: string;
  exampleUsage: string;
}

export const OVASENSE_TERMINOLOGY_GUIDE: Record<string, TermDefinition> = {
  // Cycle & Reproductive Rhythms
  menstrual_cycle: {
    clinicalTerm: 'Menstrual Cycle',
    patientFriendlyTerm: 'Your Cycle (or Period Cycle)',
    simpleExplanation: 'The monthly pattern your body goes through as hormones rise and fall.',
    exampleUsage: 'Track your cycle length and rhythm.',
  },
  menstruation: {
    clinicalTerm: 'Menstruation',
    patientFriendlyTerm: 'Your Period',
    simpleExplanation: 'The days when your uterine lining sheds and bleeding occurs.',
    exampleUsage: 'Period: Days 1 to 5.',
  },
  follicular_phase: {
    clinicalTerm: 'Follicular Phase',
    patientFriendlyTerm: 'Follicular Phase (when an egg develops)',
    simpleExplanation: 'The part of your cycle before ovulation when estrogen rises and an egg matures.',
    exampleUsage: 'You are in your follicular phase (when an egg develops).',
  },
  ovulation: {
    clinicalTerm: 'Ovulation',
    patientFriendlyTerm: 'Ovulation (when an egg is released)',
    simpleExplanation: 'The estimated peak fertile window when an ovary releases a mature egg.',
    exampleUsage: 'Estimated ovulation window (when an egg is released).',
  },
  luteal_phase: {
    clinicalTerm: 'Luteal Phase',
    patientFriendlyTerm: 'Luteal Phase (the days after an egg is released)',
    simpleExplanation: 'The second half of your cycle when progesterone rises to support your body.',
    exampleUsage: 'Luteal phase (the days after ovulation).',
  },
  antral_follicles: {
    clinicalTerm: 'Antral Follicles',
    patientFriendlyTerm: 'Developing Egg Follicles',
    simpleExplanation: 'Small fluid-filled sacs in your ovaries where eggs grow.',
    exampleUsage: 'Your scan shows several developing egg follicles.',
  },

  // Hormones & Metabolism
  endocrine: {
    clinicalTerm: 'Endocrine System',
    patientFriendlyTerm: 'Hormone System',
    simpleExplanation: 'The glands and messengers that balance your mood, energy, and cycle.',
    exampleUsage: 'Hormone balance support.',
  },
  metabolic_health: {
    clinicalTerm: 'Metabolic Health',
    patientFriendlyTerm: 'How your body handles sugar, energy, and weight',
    simpleExplanation: 'How efficiently your cells convert food into steady daily energy.',
    exampleUsage: 'Support how your body handles energy and sugar.',
  },
  insulin_resistance: {
    clinicalTerm: 'Insulin Resistance',
    patientFriendlyTerm: 'Difficulty responding to insulin',
    simpleExplanation: 'When your cells need more insulin than usual to process blood sugar efficiently.',
    exampleUsage: 'Your body may be having difficulty responding to insulin.',
  },
  hyperandrogenism: {
    clinicalTerm: 'Hyperandrogenism',
    patientFriendlyTerm: 'Higher-than-usual levels of certain hormones (androgens)',
    simpleExplanation: 'When hormones like testosterone are elevated, which can cause acne or unwanted hair growth.',
    exampleUsage: 'Higher-than-usual androgen levels (may cause acne or hair changes).',
  },
  hirsutism: {
    clinicalTerm: 'Hirsutism',
    patientFriendlyTerm: 'Excess or unwanted hair growth',
    simpleExplanation: 'Darker or coarser hair growth on the face, chest, or abdomen due to hormone signals.',
    exampleUsage: 'Log unwanted or excess hair growth.',
  },
  alopecia: {
    clinicalTerm: 'Androgenic Alopecia',
    patientFriendlyTerm: 'Hair thinning at the scalp',
    simpleExplanation: 'Gradual thinning of hair along the parting or crown.',
    exampleUsage: 'Log hair thinning.',
  },

  // AI & Technology
  explainable_ai: {
    clinicalTerm: 'Explainable AI (XAI / SHAP)',
    patientFriendlyTerm: 'AI That Explains',
    simpleExplanation: 'Transparent machine learning that clearly explains which of your entries influenced each insight.',
    exampleUsage: 'AI That Explains: Why did the model highlight this pattern?',
  },
  longitudinal_monitoring: {
    clinicalTerm: 'Longitudinal Monitoring',
    patientFriendlyTerm: 'Tracking your health over time',
    simpleExplanation: 'Comparing your cycle, symptoms, and lab results over months to see real progress.',
    exampleUsage: 'Tracking your health changes over time.',
  },
  diagnostic_prediction: {
    clinicalTerm: 'Diagnostic Prediction / AI Diagnosis',
    patientFriendlyTerm: 'AI Health Insights & Pattern Assessment',
    simpleExplanation: 'Informational analysis of health patterns (never a replacement for a doctor).',
    exampleUsage: 'Your AI Health Insights.',
  },
};

/**
 * Helper to get a patient-friendly label with optional explanation.
 */
export function getFriendlyTerm(key: keyof typeof OVASENSE_TERMINOLOGY_GUIDE): string {
  const item = OVASENSE_TERMINOLOGY_GUIDE[key];
  return item ? item.patientFriendlyTerm : key;
}

/**
 * Helper to get a full explanation string.
 */
export function getFriendlyExplanation(key: keyof typeof OVASENSE_TERMINOLOGY_GUIDE): string {
  const item = OVASENSE_TERMINOLOGY_GUIDE[key];
  return item ? `${item.patientFriendlyTerm} — ${item.simpleExplanation}` : '';
}
