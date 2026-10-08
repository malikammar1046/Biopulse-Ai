import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enDashPath = path.resolve(__dirname, '../src/i18n/locales/en/dashboard.json');
const urDashPath = path.resolve(__dirname, '../src/i18n/locales/ur/dashboard.json');

const enDash = JSON.parse(fs.readFileSync(enDashPath, 'utf8'));
const urDash = JSON.parse(fs.readFileSync(urDashPath, 'utf8'));

const newDashKeysEn = {
  greetingMorning: "Good morning",
  greetingAfternoon: "Good afternoon",
  greetingEvening: "Good evening",
  greetingThere: "there",
  greetingSubtitle: "You're doing great! Here's your health summary for today.",
  femalePathwayBadge: "PCOS Dashboard",
  malePathwayBadge: "Male Health Dashboard",
  lastSynced: "Last synced",
  allDataUpToDate: "All data is up to date",
  week: "Week",
  cycleDay: "Cycle Day",
  noCycleData: "No cycle data recorded",
  activeHealthTracking: "Active Health Tracking",
  
  // Screening Module Card
  pcosScreeningTitle: "PCOS Screening",
  hypogonadismScreeningTitle: "Hypogonadism Screening",
  screeningSubtitleText: "Based on your latest assessment and health data",
  pcosRiskType: "PCOS Risk",
  maleRiskType: "Male Risk",
  higherLikelihood: "Higher likelihood",
  intermediateLikelihood: "Intermediate likelihood",
  lowerLikelihood: "Lower likelihood",
  higherScreeningRisk: "Higher Screening Risk",
  intermediateScreeningRisk: "Intermediate Screening Risk",
  lowerScreeningRisk: "Lower Screening Risk",
  femaleHighSummary: "Several of your current screening factors are associated with PCOS. Review detailed biomarker factors.",
  femaleIntermediateSummary: "Some of your current health patterns are associated with PCOS, but the result is not conclusive. Adding laboratory results may provide a more informed assessment.",
  femaleLowerSummary: "Your current screening pattern shows fewer features associated with PCOS.",
  maleHighSummary: "Your screening suggests elevated indicators of hypogonadism. Consider confirming with morning testosterone testing.",
  maleIntermediateSummary: "Your screening indicates borderline hormonal markers. Tracking daily vitality and adding lab values is recommended.",
  maleLowerSummary: "Your screening suggests lower indicators of hypogonadism based on self-reported inputs.",
  startTier1CTA: "Start Tier 1 Assessment",
  updateScreeningCTA: "Update Screening",
  viewFullDetailsCTA: "View Full Screening Details",
  screeningNoticeTitle: "We couldn't prepare your result",
  screeningNoticeDesc: "Your profile is saved, but the screening assessment could not be finalized. You can calculate your screening result now.",
  calculateScreeningCTA: "Calculate Screening Result",
  noAssessmentTitle: "No screening completed yet",
  noAssessmentDesc: "Complete Tier 1 screening to unlock your personalized reproductive health pattern and biomarker risk profile."
};

const newDashKeysUr = {
  greetingMorning: "صبح بخیر",
  greetingAfternoon: "دوپہر بخیر",
  greetingEvening: "شام بخیر",
  greetingThere: "محترم",
  greetingSubtitle: "آپ کی پیش رفت شاندار ہے! آج کا ہیلتھ خلاصہ ملاحظہ فرمائیں۔",
  femalePathwayBadge: "PCOS ڈیش بورڈ",
  malePathwayBadge: "مردانہ صحت ڈیش بورڈ",
  lastSynced: "آخری ہم آہنگی",
  allDataUpToDate: "تمام ڈیٹا مکمل طور پر اپ ڈیٹ ہے",
  week: "ہفتہ",
  cycleDay: "سائیکل کا دن",
  noCycleData: "سائیکل کا کوئی ریکارڈ نہیں",
  activeHealthTracking: "فعال ہیلتھ ٹریکنگ",
  
  // Screening Module Card
  pcosScreeningTitle: "PCOS اسکریننگ",
  hypogonadismScreeningTitle: "ہائپوگوناڈزم اسکریننگ",
  screeningSubtitleText: "آپ کے تازہ ترین تشخیصی ڈیٹا اور علامات پر مبنی",
  pcosRiskType: "PCOS کا امکان",
  maleRiskType: "مردانہ اسکریننگ کا امکان",
  higherLikelihood: "زیادہ امکان",
  intermediateLikelihood: "درمیانہ امکان",
  lowerLikelihood: "کم امکان",
  higherScreeningRisk: "زیادہ تشخیصی خطرہ",
  intermediateScreeningRisk: "درمیانہ تشخیصی خطرہ",
  lowerScreeningRisk: "کم تشخیصی خطرہ",
  femaleHighSummary: "آپ کے متعدد موجودہ عوامل PCOS سے مطابقت رکھتے ہیں۔ بایو مارکر کے تفصیلی عوامل دیکھیں۔",
  femaleIntermediateSummary: "آپ کی صحت کے کچھ نمونے PCOS سے مماثل ہیں لیکن حتمی نہیں۔ لیبارٹری رپورٹس شامل کرنے سے زیادہ واضح تجزیہ ممکن ہو گا۔",
  femaleLowerSummary: "آپ کے موجودہ صحت کے اعداد و شمار میں PCOS کے امکانات کم ہیں۔",
  maleHighSummary: "اسکریننگ میں ٹیسٹوسٹیرون میں کمی کے واضح اشارے ہیں۔ صبح کے وقت ٹیسٹوسٹیرون لیب ٹیسٹ کروانے پر غور کریں۔",
  maleIntermediateSummary: "آپ کے ہارمونل اشاریے درمیانی سطح پر ہیں۔ روزانہ توانائی لاگ کرنے اور لیب ٹیسٹ شامل کرنے کا مشورہ دیا جاتا ہے۔",
  maleLowerSummary: "آپ کے فراہم کردہ ڈیٹا کے مطابق ہائپوگوناڈزم کے امکانات کم ہیں۔",
  startTier1CTA: "ٹیئر 1 اسکریننگ شروع کریں",
  updateScreeningCTA: "اسکریننگ اپ ڈیٹ کریں",
  viewFullDetailsCTA: "مکمل تشخیصی تفصیلات دیکھیں",
  screeningNoticeTitle: "ہم نتیجہ تیار نہیں کر سکے",
  screeningNoticeDesc: "آپ کی معلومات محفوظ ہیں لیکن ابتدائی حساب میں دشواری پیش آئی۔ آپ اب اسکریننگ کا نتیجہ حاصل کر سکتے ہیں۔",
  calculateScreeningCTA: "اسکریننگ کا نتیجہ حاصل کریں",
  noAssessmentTitle: "ابھی کوئی اسکریننگ مکمل نہیں ہوئی",
  noAssessmentDesc: "اپنے ہارمونل اور بایو مارکر پیٹرن کو سمجھنے کے لیے ٹیئر 1 اسکریننگ مکمل کریں۔"
};

for (const [k, v] of Object.entries(newDashKeysEn)) {
  enDash[k] = v;
  urDash[k] = newDashKeysUr[k];
}

fs.writeFileSync(enDashPath, JSON.stringify(enDash, null, 2) + '\n', 'utf8');
fs.writeFileSync(urDashPath, JSON.stringify(urDash, null, 2) + '\n', 'utf8');
console.log(`Updated dashboard.json with ${Object.keys(newDashKeysEn).length} new keys. Total keys: ${Object.keys(enDash).length}`);
