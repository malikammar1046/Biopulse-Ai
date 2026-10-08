import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/i18n/locales');

function updateNamespace(ns, newEnKeys, newUrKeys) {
  const enFile = path.join(localesDir, 'en', `${ns}.json`);
  const urFile = path.join(localesDir, 'ur', `${ns}.json`);

  const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  const urData = JSON.parse(fs.readFileSync(urFile, 'utf8'));

  for (const [k, v] of Object.entries(newEnKeys)) {
    enData[k] = v;
    urData[k] = newUrKeys[k];
  }

  fs.writeFileSync(enFile, JSON.stringify(enData, null, 2) + '\n', 'utf8');
  fs.writeFileSync(urFile, JSON.stringify(urData, null, 2) + '\n', 'utf8');
  console.log(`[${ns}] Added ${Object.keys(newEnKeys).length} keys. Total: ${Object.keys(enData).length}`);
}

// 1. Dashboard module keys
updateNamespace('dashboard', {
  openCycleTracking: "Open Cycle Tracking",
  logNewPeriod: "Log New Period",
  periodCycle: "Period Cycle",
  currentCycleInfo: "Current cycle information",
  noCycleHistory: "No cycle history yet",
  noCycleHistoryDesc: "Log your period dates to track your menstrual rhythm, fertile windows, and ovulation estimates.",
  addCycleData: "Add Cycle Data",
  cycleTrackingSynced: "Cycle Tracking",
  
  viewMealPlan: "View Meal Plan",
  logMeal: "Log a Meal",
  todaysNutrition: "Today's Nutrition",
  nutritionSubtitle: "Macronutrients & insulin-conscious fueling",
  noFoodLogsToday: "No meals logged today",
  noFoodLogsDesc: "Track your meals to monitor carbohydrates, protein, and dietary balance.",
  logFirstMeal: "Log Your First Meal",
  nutritionSynced: "Pakistani Nutrition Hub",
  caloriesLabel: "Calories",
  carbsLabel: "Carbs",
  proteinLabel: "Protein",
  fatLabel: "Fats",

  dailyActivity: "Daily Movement",
  movementSubtitle: "Gentle physical activity & metabolic stimulus",
  logWorkout: "Log Movement",
  noMovementLogs: "No activity logged today",
  noMovementDesc: "Record your walking, strength exercises, or gentle movement.",
  addMovement: "Log Activity",

  hydrationTracker: "Daily Hydration",
  hydrationSubtitle: "Water intake & metabolic cellular support",
  logWater: "Log Water",
  glassesTarget: "Target: 8-10 glasses",
  glassesCount: "glasses logged",

  supplementsRx: "Medications & Regimen",
  medicationsSubtitle: "Hormone regulators, inositol, metformin & supplements",
  manageMeds: "Manage Medications",
  noMedsScheduled: "No active medications scheduled",
  noMedsDesc: "Add your supplements or prescriptions to keep adherence consistent.",
  addMedicationCTA: "Add Regimen Item",

  careCircleSupport: "Care Circle & Specialists",
  careCircleSubtitle: "Secure partner, family, and physician sharing",
  inviteMember: "Invite Member",
  manageCircle: "Manage Circle",
  noCircleMembers: "No circle members connected",
  noCircleDesc: "Share your health trends securely with trusted family or healthcare providers.",

  symptomLogging: "Today's Symptoms",
  symptomsSubtitle: "Daily physical, skin, and mood signals",
  logSymptomsCTA: "Log Symptoms",
  noSymptomsToday: "No symptoms logged today",
  noSymptomsDesc: "Record how you feel today to help your AI companion recognize cyclic trends.",

  nextBestActionTitle: "Recommended Next Step",
  nextBestActionSubtitle: "Clinical guidance based on your current health patterns",
  priorityStep: "Priority Step",
  startScreeningTitle: "Complete Your Health Screening",
  startScreeningDesc: "Establish your baseline health profile to unlock personalized insights.",
  verificationNeeded: "Verification Needed",
  refineScreening: "Refine Screening",
  screeningComplete: "Screening Complete",

  vitalityAdamLog: "Vitality & ADAM Intake",
  vitalitySubtitle: "Male hormonal signals and fatigue markers",
  updateVitalityLog: "Update Vitality Log",
  positiveIndicators: "Positive Indicators",
  vitalityNormal: "Energy and stamina within expected baseline",
  vitalityBorderline: "Mild indicators of energy or libido shift"
}, {
  openCycleTracking: "سائیکل ٹریکنگ کھولیں",
  logNewPeriod: "نیا دورانیہ درج کریں",
  periodCycle: "ماہواری کا دورانیہ",
  currentCycleInfo: "موجودہ سائیکل کی تفصیلات",
  noCycleHistory: "سائیکل کا کوئی ریکارڈ نہیں",
  noCycleHistoryDesc: "اپنے ایام کی تاریخیں درج کریں تاکہ بیضہ دانی اور زرخیز ایام کے معمولات کا تعین ہو سکے۔",
  addCycleData: "سائیکل کا ڈیٹا درج کریں",
  cycleTrackingSynced: "سائیکل ٹریکنگ",

  viewMealPlan: "کھانے کا منصوبہ دیکھیں",
  logMeal: "کھانا لاگ کریں",
  todaysNutrition: "آج کی غذائیت",
  nutritionSubtitle: "غذائی اجزاء اور انسولین دوست خوراک",
  noFoodLogsToday: "آج کا کوئی کھانا درج نہیں",
  noFoodLogsDesc: "کاربوہائیڈریٹس، پروٹین اور متوازن غذا کی جانچ کے لیے کھانے درج کریں۔",
  logFirstMeal: "پہلا کھانا درج کریں",
  nutritionSynced: "پاکستانی نیوٹریشن ہب",
  caloriesLabel: "کیلوریز",
  carbsLabel: "نشاستہ (Carbs)",
  proteinLabel: "پروٹین",
  fatLabel: "روغنیات (Fats)",

  dailyActivity: "روزمرہ سرگرمی",
  movementSubtitle: "ہلکی ورزش اور میٹابولک توازن",
  logWorkout: "ورزش لاگ کریں",
  noMovementLogs: "آج کی کوئی ورزش درج نہیں",
  noMovementDesc: "چہل قدمی، جسمانی ورزش یا اسٹریچنگ کا اندراج کریں۔",
  addMovement: "ورزش درج کریں",

  hydrationTracker: "پانی پینے کا ریکارڈ",
  hydrationSubtitle: "سیلولر صحت اور ہائیڈریشن سپورٹ",
  logWater: "پانی لاگ کریں",
  glassesTarget: "ہدف: 8 سے 10 گلاس",
  glassesCount: "گلاس پیے گئے",

  supplementsRx: "ادویات اور سپلیمنٹس",
  medicationsSubtitle: "ہارمونل بیلنس، اینوسیٹول اور تجویز کردہ ادویات",
  manageMeds: "ادویات کا انتظام کریں",
  noMedsScheduled: "کوئی دوا درج نہیں",
  noMedsDesc: "یاد دہانی اور معمول کے لیے اپنی روزانہ کی ادویات شامل کریں۔",
  addMedicationCTA: "دوا شامل کریں",

  careCircleSupport: "کیئر سرکل اور فیملی سپورٹ",
  careCircleSubtitle: "شریط حیات، فیملی اور معالج کے ساتھ محفوظ اشتراک",
  inviteMember: "ممبر کو مدعو کریں",
  manageCircle: "سرکل کا انتظام",
  noCircleMembers: "کوئی ممبر شامل نہیں",
  noCircleDesc: "اپنی رپورٹس اور پیش رفت کو فیملی یا ڈاکٹر کے ساتھ باحفاظت شیئر کریں۔",

  symptomLogging: "آج کی علامات",
  symptomsSubtitle: "جسمانی، جلدی اور موڈ کے اثرات",
  logSymptomsCTA: "علامات لاگ کریں",
  noSymptomsToday: "آج کوئی علامت درج نہیں",
  noSymptomsDesc: "آج کی جسمانی کیفیات درج کریں تاکہ AI آپ کے سائیکل کے پیٹرن سمجھ سکے۔",

  nextBestActionTitle: "تجویز کردہ اگلا اقدام",
  nextBestActionSubtitle: "آپ کی موجودہ علامات اور رپورٹس کی بنیاد پر طبی رہنمائی",
  priorityStep: "اہم ترین مرحلہ",
  startScreeningTitle: "اپنی ہیلتھ اسکریننگ مکمل کریں",
  startScreeningDesc: "ذاتی رپورٹس حاصل کرنے کے لیے بنیادی اسکریننگ مکمل کریں۔",
  verificationNeeded: "تصدیق درکار ہے",
  refineScreening: "اسکریننگ کو بہتر بنائیں",
  screeningComplete: "اسکریننگ مکمل",

  vitalityAdamLog: "مردانہ توانائی اور ADAM لاگ",
  vitalitySubtitle: "ٹیسٹوسٹیرون اور توانائی کے اشاریے",
  updateVitalityLog: "توانائی لاگ اپ ڈیٹ کریں",
  positiveIndicators: "مثبت اشاریے",
  vitalityNormal: "توانائی اور اسٹیمنا معمول کے مطابق ہیں",
  vitalityBorderline: "توانائی میں معمولی کمی کے اشارے"
});

// 2. Screening keys
updateNamespace('screening', {
  viewFullAssessmentCTA: "View Full Assessment",
  startReassessmentCTA: "Start Reassessment",
  noFemaleScreeningTitle: "No PCOS screening result yet",
  noMaleScreeningTitle: "No male hormonal screening result yet",
  screeningEmptyDesc: "Complete your clinical questionnaire to calculate your baseline statistical risk.",
  startScreeningCTA: "Start Screening",
  recently: "Recently",
  nextRecommended: "Next recommended",
  in3Months: "In 3 months",
  synced: "Synced"
}, {
  viewFullAssessmentCTA: "مکمل تشخیصی رپورٹ دیکھیں",
  startReassessmentCTA: "دوبارہ اسکریننگ شروع کریں",
  noFemaleScreeningTitle: "ابھی PCOS اسکریننگ کا کوئی نتیجہ نہیں",
  noMaleScreeningTitle: "ابھی مردانہ ہارمونل اسکریننگ کا کوئی نتیجہ نہیں",
  screeningEmptyDesc: "بنیادی امکانات جانچنے کے لیے اپنا تشخیصی سوالنامہ مکمل کریں۔",
  startScreeningCTA: "اسکریننگ شروع کریں",
  recently: "حال ہی میں",
  nextRecommended: "اگلی تجویز",
  in3Months: "3 ماہ بعد",
  synced: "ہم آہنگ (Synced)"
});

// 3. Cycle keys
updateNamespace('cycle', {
  cycleStoryTitle: "Your cycle story starts here.",
  cycleStoryDesc: "Log your first period to begin understanding your patterns, biological phases, and longitudinal rhythms.",
  logFirstPeriodCTA: "Log Your First Period",
  cycleEncryptedNotice: "Your cycle records are privately encrypted with Row Level Security (RLS).",
  responsibleBoundaryTitle: "Responsible Health & Non-Diagnostic Framing",
  responsibleBoundaryDesc: "BioPulse AI cycle projections, estimated phases, and fertile windows are calculated from your self-reported dates and historical rhythm. They are informational estimations and do not constitute diagnostic ovulation detection or medical birth control.",
  refreshCycleTitle: "Refresh cycle records",
  loadingRecords: "Loading your cycle records...",
  cycleIntelligenceTag: "Cycle Intelligence"
}, {
  cycleStoryTitle: "آپ کے سائیکل کا سفر یہاں سے شروع ہوتا ہے۔",
  cycleStoryDesc: "اپنے ہارمونل معمولات، بیضہ دانی اور مراحل کو سمجھنے کے لیے پہلی تاریخ درج کریں۔",
  logFirstPeriodCTA: "پہلا سائیکل درج کریں",
  cycleEncryptedNotice: "آپ کا ڈیٹا جدید انکرپشن اور Row Level Security (RLS) کے تحت مکمل محفوظ ہے۔",
  responsibleBoundaryTitle: "طبی حدود اور غیر تشخیصی وضاحت",
  responsibleBoundaryDesc: "بایوپلس اے آئی کے سائیکل تخمینے، بیضہ دانی اور زرخیز ایام کے اشارے آپ کی فراہم کردہ تاریخوں پر مبنی تعلیمی معلومات ہیں اور یہ مانع حمل یا حتمی تشخیصی متبادل نہیں ہیں۔",
  refreshCycleTitle: "سائیکل کا ریکارڈ ریفریش کریں",
  loadingRecords: "سائیکل کا ریکارڈ لوڈ ہو رہا ہے...",
  cycleIntelligenceTag: "سائیکل تجزیہ"
});

// 4. Symptoms keys
updateNamespace('symptoms', {
  logSymptomCTA: "Log a Symptom",
  refreshSymptomsTitle: "Refresh symptom logs",
  todayCheckInTitle: "Daily Symptom Check-In",
  patternObservationsTitle: "Observed Symptom Patterns",
  recentHistoryTitle: "Recent Symptom History",
  noSymptomsLogged: "No symptoms logged yet"
}, {
  logSymptomCTA: "علامت درج کریں",
  refreshSymptomsTitle: "علامات کا ریکارڈ ریفریش کریں",
  todayCheckInTitle: "روزانہ کا علامتی جائزہ",
  patternObservationsTitle: "مشاہدہ شدہ علامتی پیٹرنز",
  recentHistoryTitle: "حالیہ علامات کی تاریخ",
  noSymptomsLogged: "ابھی تک کوئی علامت درج نہیں کی گئی"
});

// 5. Reports keys
updateNamespace('reports', {
  healthDocHub: "Health Document Hub",
  totalReportsCount: "Total Reports",
  needsCloserLook: "Needs a closer look",
  dragDropLabReports: "Drag & drop your lab reports here, or click to browse",
  browseFileCTA: "Browse File",
  uploadPDForImage: "Please upload a PDF document or an image (JPG, PNG).",
  fileSizeLimit: "File size exceeds the 10MB limit. Please upload a smaller document.",
  loadingReports: "Loading Your Health Reports...",
  testsLabel: "tests",
  testLabel: "test"
}, {
  healthDocHub: "طبی دستاویزات کا مرکز",
  totalReportsCount: "کل رپورٹس",
  needsCloserLook: "توجہ طلب ٹیسٹس",
  dragDropLabReports: "اپنی لیب رپورٹ یہاں ڈریگ کریں یا براؤز کرنے کے لیے کلک کریں",
  browseFileCTA: "فائل منتخب کریں",
  uploadPDForImage: "براہ کرم پی ڈی ایف یا تصویر (JPG, PNG) اپ لوڈ کریں۔",
  fileSizeLimit: "فائل کا سائز 10MB سے زیادہ ہے۔ براہ کرم چھوٹی فائل اپ لوڈ کریں۔",
  loadingReports: "آپ کی رپورٹس لوڈ کی جا رہی ہیں...",
  testsLabel: "ٹیسٹس",
  testLabel: "ٹیسٹ"
});

// 6. Appointments keys
updateNamespace('appointments', {
  upcomingVisitsTab: "Upcoming Visits",
  findSpecialistTab: "Find a Specialist",
  visitHistoryTab: "Consultation History",
  scheduleVisitCTA: "Schedule Consultation",
  noUpcomingVisits: "No upcoming appointments scheduled",
  noUpcomingDesc: "Connect with verified reproductive endocrinologists, gynecologists, or urologists.",
  prepareConsultationCTA: "Prepare for Visit",
  viewDetailsCTA: "View Details"
}, {
  upcomingVisitsTab: "آنے والی ملاقاتیں",
  findSpecialistTab: "ماہر معالج تلاش کریں",
  visitHistoryTab: "سابقہ مشاورت کی تاریخ",
  scheduleVisitCTA: "ملاقات طے کریں",
  noUpcomingVisits: "کوئی طے شدہ ملاقات موجود نہیں",
  noUpcomingDesc: "مستند ہارمونل ماہرین، ماہر امراض نسواں یا یورولوجسٹ سے رجوع کریں۔",
  prepareConsultationCTA: "ملاقات کی تیاری کریں",
  viewDetailsCTA: "تفصیلات دیکھیں"
});

console.log('All modular namespaces updated successfully!');
