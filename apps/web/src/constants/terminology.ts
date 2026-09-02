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

  // Medical Reports & Lab Testing
  reference_interval: {
    clinicalTerm: 'Reference Interval',
    patientFriendlyTerm: 'Typical range shown by this lab',
    simpleExplanation: 'The standard range of numbers printed by the testing laboratory for comparison.',
    exampleUsage: 'Within the typical range shown by this lab.',
  },
  specimen: {
    clinicalTerm: 'Specimen',
    patientFriendlyTerm: 'Sample',
    simpleExplanation: 'The blood or swab sample provided to the testing laboratory.',
    exampleUsage: 'Blood sample collected on August 24.',
  },
  analyte: {
    clinicalTerm: 'Analyte',
    patientFriendlyTerm: 'Test',
    simpleExplanation: 'The specific substance or biomarker measured in your body.',
    exampleUsage: '12 tests recorded in this report.',
  },
  flagged_result: {
    clinicalTerm: 'Flagged / Abnormal Result',
    patientFriendlyTerm: 'Needs a closer look',
    simpleExplanation: 'A value that is outside the standard reference range printed by this laboratory.',
    exampleUsage: '1 number needs a closer look.',
  },
  interpretation: {
    clinicalTerm: 'Clinical Interpretation',
    patientFriendlyTerm: 'What this means',
    simpleExplanation: 'An explanation of what the laboratory numbers represent in everyday words.',
    exampleUsage: 'What this test means.',
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

  // Fitness & Movement
  physical_activity_adherence: {
    clinicalTerm: 'Physical Activity Adherence',
    patientFriendlyTerm: 'Your Movement This Week',
    simpleExplanation: 'Gentle and steady activity tracking that honors your energy and cycle.',
    exampleUsage: 'Your movement this week: 145 minutes completed.',
  },
  cardiorespiratory_exercise: {
    clinicalTerm: 'Cardiorespiratory Exercise',
    patientFriendlyTerm: 'Cardio / Aerobic Movement',
    simpleExplanation: 'Activities like brisk walking or cycling that gently raise your heart rate.',
    exampleUsage: '20-minute low-impact cardio.',
  },
  low_intensity_movement: {
    clinicalTerm: 'Low-Intensity Physical Activity',
    patientFriendlyTerm: 'Gentle Movement',
    simpleExplanation: 'Low-stress movement like walking, stretching, or yoga that supports blood flow without raising cortisol.',
    exampleUsage: 'Suggested for today: 20 minutes of gentle movement.',
  },
  recovery_protocol: {
    clinicalTerm: 'Recovery Protocol',
    patientFriendlyTerm: 'Rest & Recovery Movement',
    simpleExplanation: 'Restorative stretching or mindful resting to let muscles and adrenal pathways recover.',
    exampleUsage: 'Rest and recovery movement today.',
  },

  // Medications & Adherence
  medication_adherence: {
    clinicalTerm: 'Medication Adherence Rate',
    patientFriendlyTerm: 'How regularly you took your medicine',
    simpleExplanation: 'A friendly percentage showing how consistently you took your scheduled doses this week.',
    exampleUsage: 'How regularly you took your medicine: 86% this week.',
  },
  dosage: {
    clinicalTerm: 'Dosage / Posology',
    patientFriendlyTerm: 'Dose',
    simpleExplanation: 'The exact strength and amount of medicine to take (e.g. 500 mg).',
    exampleUsage: 'Dose: 500 mg.',
  },
  regimen: {
    clinicalTerm: 'Therapeutic Regimen',
    patientFriendlyTerm: 'Medicine Schedule',
    simpleExplanation: 'Your personalized timetable of daily supplements and prescribed medicines.',
    exampleUsage: 'Your daily medicine schedule.',
  },
  non_adherent: {
    clinicalTerm: 'Non-Adherent / Missed Dose',
    patientFriendlyTerm: 'Not taken / Skipped',
    simpleExplanation: 'When a scheduled dose was missed or skipped.',
    exampleUsage: 'Status: Skipped for today.',
  },
  pharmacological_therapy: {
    clinicalTerm: 'Pharmacological Therapy',
    patientFriendlyTerm: 'Medicine & Supplements',
    simpleExplanation: 'Supplements or prescribed medicines you take to support your PCOS balance.',
    exampleUsage: 'Your medicines and daily supplements.',
  },

  // Appointments & Consultations
  clinical_consultation: {
    clinicalTerm: 'Clinical Consultation',
    patientFriendlyTerm: 'Doctor Visit / Consultation',
    simpleExplanation: 'A scheduled discussion with your healthcare professional to review your health and symptoms.',
    exampleUsage: 'Upcoming doctor visit with Dr. Sarah Malik.',
  },
  pre_consultation_prep: {
    clinicalTerm: 'Pre-Consultation Clinical Synthesis',
    patientFriendlyTerm: 'Prepare for Your Visit',
    simpleExplanation: 'A patient summary of your cycle, symptoms, reports, and questions to help you have an informed talk with your doctor.',
    exampleUsage: 'Prepare for your visit: Review your health summary and questions.',
  },
  consultation_brief: {
    clinicalTerm: 'Clinical Consultation Brief',
    patientFriendlyTerm: 'Your Health Summary for Doctor',
    simpleExplanation: 'A 1-page overview summarizing your logged metrics for discussion during your appointment.',
    exampleUsage: 'View your health summary brief for your doctor.',
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
