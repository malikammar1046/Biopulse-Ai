/**
 * Authoritative BioPulse Clinical & Product Terminology Glossary.
 *
 * All translations in BioPulse must adhere strictly to this glossary
 * to ensure consistency across the application.
 *
 * Professional Pakistani Healthcare standard:
 * - Clear, dignified, patient-friendly Urdu
 * - Preserve familiar English medical acronyms & terms (PCOS, BMI, LH, FSH, Testosterone, etc.)
 * - Never use obscure, archaic, or overly literary Urdu that impairs medical clarity.
 */

export interface TerminologyEntry {
  en: string;
  ur: string;
  clinicalNote?: string;
}

export const BIOPULSE_TERMINOLOGY: Record<string, TerminologyEntry> = {
  // Brand
  brandName: { en: 'BioPulse AI', ur: 'BioPulse AI', clinicalNote: 'Brand name remains in Latin script' },

  // General Actions
  continue: { en: 'Continue', ur: 'جاری رکھیں' },
  back: { en: 'Back', ur: 'واپس' },
  save: { en: 'Save', ur: 'محفوظ کریں' },
  saveChanges: { en: 'Save Changes', ur: 'تبدیلیاں محفوظ کریں' },
  cancel: { en: 'Cancel', ur: 'منسوخ کریں' },
  retry: { en: 'Retry', ur: 'دوبارہ کوشش کریں' },
  close: { en: 'Close', ur: 'بند کریں' },
  view: { en: 'View', ur: 'دیکھیں' },
  viewReport: { en: 'View Report', ur: 'رپورٹ دیکھیں' },
  upload: { en: 'Upload', ur: 'اپ لوڈ کریں' },
  delete: { en: 'Delete', ur: 'حذف کریں' },
  confirm: { en: 'Confirm', ur: 'تصدیق کریں' },

  // Clinical & Assessment Concepts
  screening: { en: 'Screening', ur: 'اسکریننگ (Screening)' },
  assessment: { en: 'Assessment', ur: 'طبی جائزہ (Assessment)' },
  risk: { en: 'Risk', ur: 'رسک (Risk)' },
  riskPattern: { en: 'Risk Pattern', ur: 'رسک پیٹرن (Risk Pattern)' },
  probability: { en: 'Screening Likelihood', ur: 'اسکریننگ کا امکانی تناسب' },
  symptoms: { en: 'Symptoms', ur: 'علامات' },
  healthSummary: { en: 'Health Summary', ur: 'صحت کا خلاصہ' },
  labResults: { en: 'Lab Results', ur: 'لیب رزلٹس' },
  medicalReport: { en: 'Medical Report', ur: 'میڈیکل رپورٹ' },
  longitudinalHealth: { en: 'Longitudinal Health', ur: 'طویل مدتی صحت' },
  progress: { en: 'Progress', ur: 'پیش رفت' },
  baseline: { en: 'Baseline', ur: 'بنیادی کیفیت (Baseline)' },
  trend: { en: 'Trend', ur: 'رجحان (Trend)' },
  stable: { en: 'Stable', ur: 'مستحکم' },
  increased: { en: 'Increased', ur: 'اضافہ' },
  decreased: { en: 'Decreased', ur: 'کمی' },
  referenceRange: { en: 'Reference Range', ur: 'ریفرنس رینج (Reference Range)' },
  verified: { en: 'Verified', ur: 'تصدیق شدہ' },
  unverified: { en: 'Unverified', ur: 'غیر تصدیق شدہ' },
  clinicalReview: { en: 'Clinical Review', ur: 'کلینیکل جائزہ' },

  // Pathways & Conditions
  pcos: { en: 'PCOS', ur: 'پولی سسٹک اووری سنڈروم (PCOS)' },
  maleHypogonadism: { en: 'Male Hypogonadism', ur: 'میل ہائپوگوناڈزم (Male Hypogonadism)' },
  womensHealth: { en: "Women's Health", ur: 'خواتین کی صحت' },
  mensHealth: { en: "Men's Health", ur: 'مردانہ صحت' },
  generalHealth: { en: 'General Health', ur: 'عمومی صحت' },

  // Key Biomarkers & Hormones (Preserve acronyms and terms)
  testosterone: { en: 'Testosterone', ur: 'ٹیسٹوسٹیرون (Testosterone)' },
  insulinResistance: { en: 'Insulin Resistance', ur: 'انسولین ریزسٹنس (Insulin Resistance)' },
  bmi: { en: 'BMI', ur: 'باڈی ماس انڈیکس (BMI)' },
  lh: { en: 'LH', ur: 'ایل ایچ (LH)' },
  fsh: { en: 'FSH', ur: 'ایف ایس ایچ (FSH)' },
  amh: { en: 'AMH', ur: 'اے ایم ایچ (AMH)' },
  hba1c: { en: 'HbA1c', ur: 'ایچ بی اے ون سی (HbA1c)' },
  tsh: { en: 'TSH', ur: 'ٹی ایس ایچ (TSH)' },
  shbg: { en: 'SHBG', ur: 'ایس ایچ بی جی (SHBG)' },
  glucose: { en: 'Fasting Glucose', ur: 'فاسٹنگ گلوکوز' },

  // Lifestyle & Care
  lifestyle: { en: 'Lifestyle & Nutrition', ur: 'طرزِ زندگی اور غذائیت' },
  nutrition: { en: 'Nutrition', ur: 'غذائیت اور خوراک' },
  movement: { en: 'Movement & Exercise', ur: 'ورزش اور جسمانی سرگرمی' },
  recovery: { en: 'Recovery & Sleep', ur: 'بحالی اور نیند' },
  sleep: { en: 'Sleep', ur: 'نیند' },
  careCircle: { en: 'Care Circle', ur: 'کیئر سرکل (Care Circle)' },
  specialist: { en: 'Specialist', ur: 'اسپیشلسٹ ڈاکٹر' },
  doctor: { en: 'Doctor', ur: 'ڈاکٹر' },
  appointment: { en: 'Appointment', ur: 'اپائنٹمنٹ (Appointment)' },
  bookAppointment: { en: 'Book Appointment', ur: 'اپائنٹمنٹ بک کریں' },
  findSpecialist: { en: 'Find Specialist', ur: 'ماہر ڈاکٹر تلاش کریں' },
  cycle: { en: 'Menstrual Cycle', ur: 'ماہواری کا سائیکل' },
  medications: { en: 'Medications', ur: 'ادویات (Medications)' },
  reports: { en: 'Reports', ur: 'رپورٹس (Reports)' },
  settings: { en: 'Settings', ur: 'ترتیبات (Settings)' },
  profile: { en: 'Profile', ur: 'پروفائل' },
  aiCompanion: { en: 'BioPulse AI Companion', ur: 'بایوپلس اے آئی ساتھی' },

  // Non-Diagnostic Mandatory Disclaimer
  disclaimer: {
    en: 'BioPulse AI provides pattern analysis and health literacy screening. It does not replace clinical diagnosis. Consult a licensed physician for medical care.',
    ur: 'بایوپلس اے آئی پیٹرن کے تجزیے اور طبی آگاہی کے لیے اسکریننگ فراہم کرتا ہے۔ یہ حتمی طبی تشخیص کا نعم البدل نہیں۔ کسی بھی طبی علاج یا تشخیص کے لیے مستند ڈاکٹر سے رجوع کریں۔',
  },
};
