import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPublicPath = path.resolve(__dirname, '../src/i18n/locales/en/public.json');
const urPublicPath = path.resolve(__dirname, '../src/i18n/locales/ur/public.json');
const enAuthPath = path.resolve(__dirname, '../src/i18n/locales/en/auth.json');
const urAuthPath = path.resolve(__dirname, '../src/i18n/locales/ur/auth.json');

const enPublic = JSON.parse(fs.readFileSync(enPublicPath, 'utf8'));
const urPublic = JSON.parse(fs.readFileSync(urPublicPath, 'utf8'));
const enAuth = JSON.parse(fs.readFileSync(enAuthPath, 'utf8'));
const urAuth = JSON.parse(fs.readFileSync(urAuthPath, 'utf8'));

// Enhance hero section keys
enPublic.hero.quote = "Small steps today, a healthier tomorrow.";
urPublic.hero.quote = "آج کے چھوٹے اقدامات، کل کی صحت مند زندگی۔";

enPublic.hero.healthierHer = "Healthier Her";
urPublic.hero.healthierHer = "خواتین کی صحت";

enPublic.hero.strongerHim = "Stronger Him";
urPublic.hero.strongerHim = "مردانہ توانائی";

enPublic.hero.pathwaysCount = "2";
urPublic.hero.pathwaysCount = "2";

enPublic.hero.pathwaysLabel = "Health Pathways";
urPublic.hero.pathwaysLabel = "طبی پاتھ ویز";

enPublic.hero.explainableTitle = "Explainable AI";
urPublic.hero.explainableTitle = "وضاحتی AI";

enPublic.hero.explainableDesc = "Clear factor attribution";
urPublic.hero.explainableDesc = "واضح اور شفاف عوامل";

enPublic.hero.costAwareTitle = "Cost-Aware";
urPublic.hero.costAwareTitle = "کفایت شعار اسکریننگ";

enPublic.hero.costAwareDesc = "Progressive next steps";
urPublic.hero.costAwareDesc = "مرحلہ وار اگلے اقدامات";

enPublic.hero.pakistaniLabel = "Pakistani";
urPublic.hero.pakistaniLabel = "پاکستانی رہنمائی";

enPublic.hero.pakistaniDesc = "Nutrition & guidance";
urPublic.hero.pakistaniDesc = "غذائی اور طرزِ زندگی کے منصوبے";

// Enhance twoPathways
enPublic.twoPathways.forWomen = "For Women";
urPublic.twoPathways.forWomen = "خواتین کے لیے";

enPublic.twoPathways.forMen = "For Men";
urPublic.twoPathways.forMen = "مرد حضرات کے لیے";

enPublic.twoPathways.femaleBullet1 = "Menstrual & hormonal health";
urPublic.twoPathways.femaleBullet1 = "ماہواری اور ہارمونل توازن";

enPublic.twoPathways.femaleBullet2 = "Symptom & lifestyle assessment";
urPublic.twoPathways.femaleBullet2 = "علامات اور طرزِ زندگی کا جائزہ";

enPublic.twoPathways.femaleBullet3 = "Personalized insights";
urPublic.twoPathways.femaleBullet3 = "ذاتی نوعیت کے مفید نتائج";

enPublic.twoPathways.maleBullet1 = "Symptoms & energy levels";
urPublic.twoPathways.maleBullet1 = "علامات اور توانائی کی کیفیت";

enPublic.twoPathways.maleBullet2 = "Hormonal & metabolic health";
urPublic.twoPathways.maleBullet2 = "ہارمونل اور میٹابولک صحت";

enPublic.twoPathways.maleBullet3 = "Personalized insights";
urPublic.twoPathways.maleBullet3 = "ذاتی نوعیت کے مفید نتائج";

enPublic.twoPathways.understandPcos = "Understand PCOS";
urPublic.twoPathways.understandPcos = "PCOS کو سمجھیں";

enPublic.twoPathways.understandHypogonadism = "Understand Hypogonadism";
urPublic.twoPathways.understandHypogonadism = "ہائپوگوناڈزم کو سمجھیں";

enPublic.twoPathways.femaleBadgeTitle = "Your Health";
urPublic.twoPathways.femaleBadgeTitle = "آپ کی صحت";

enPublic.twoPathways.femaleBadgeSubtitle = "Your Power";
urPublic.twoPathways.femaleBadgeSubtitle = "آپ کا اختیار";

enPublic.twoPathways.maleBadgeTitle = "Daily Energy";
urPublic.twoPathways.maleBadgeTitle = "روزمرہ توانائی";

enPublic.twoPathways.maleBadgeSubtitle = "Better Focus";
urPublic.twoPathways.maleBadgeSubtitle = "بہتر کارکردگی";

// Enhance footer
enPublic.footer = {
  description: "BioPulse AI is an AI-assisted reproductive-endocrine screening platform providing evidence-based guidance for PCOS (female) and Hypogonadism (male).",
  evidenceBased: "Evidence Based",
  dualPathway: "Dual Pathway",
  nonDiagnostic: "Non-Diagnostic",
  tagline: "Different journeys. Same brighter goal.",
  platformHeader: "Platform",
  home: "Home",
  aboutUs: "About Us",
  howItWorks: "How Screening Works",
  supportedConditions: "Supported Conditions",
  careCircle: "Care Circle Ecosystem",
  doctorsDirectory: "Doctors Directory",
  resources: "Resources & Capabilities",
  downloadApp: "Download Mobile App (APK)",
  contactSupport: "Contact Support",
  screeningHeader: "Screening & Guidance",
  understandPcos: "Understand PCOS (Female)",
  understandHypogonadism: "Understand Hypogonadism (Male)",
  clinicalResources: "Clinical Resources & Meal Plans",
  costAwareProgression: "Cost-Aware Progression",
  doctorSharing: "Doctor & Family Sharing",
  privacySecurity: "Privacy & Data Security",
  stayUpdatedHeader: "Stay Updated",
  stayUpdatedDesc: "Get reproductive-endocrine screening updates directly to your inbox.",
  emailPlaceholder: "Your email address",
  subscribe: "Subscribe",
  subscribedSuccess: "Subscribed successfully!",
  signature: "Knowledge. Care. Brighter Tomorrows.",
  medicalNoticeLabel: "Medical Notice:",
  medicalNoticeText: "BioPulse AI is an AI-assisted screening and decision-support tool. It is NOT a diagnostic system or doctor replacement. Consult healthcare professionals for formal clinical diagnoses.",
  copyright: "© 2026 BioPulse AI. All rights reserved.",
  privacyPolicy: "Privacy Policy",
  termsOfService: "Terms of Service"
};

urPublic.footer = {
  description: "بایوپلس ایک جدید AI اسکریننگ پلیٹ فارم ہے جو خواتین میں PCOS اور مرد حضرات میں ہائپوگوناڈزم کے لیے شواہد پر مبنی رہنمائی فراہم کرتا ہے۔",
  evidenceBased: "طبی شواہد پر مبنی",
  dualPathway: "دوہرا پاتھ وے",
  nonDiagnostic: "غیر تشخیصی اسکریننگ",
  tagline: "مختلف راستے، صحت مند مستقبل کا ایک ہی ہدف۔",
  platformHeader: "پلیٹ فارم",
  home: "ہوم",
  aboutUs: "ہمارے بارے میں",
  howItWorks: "اسکریننگ کیسے کام کرتی ہے",
  supportedConditions: "شامل طبی کیفیات",
  careCircle: "نگہداشت کا حلقہ (Care Circle)",
  doctorsDirectory: "مستند ڈاکٹرز ڈائریکٹری",
  resources: "طبی وسائل اور صلاحیتیں",
  downloadApp: "موبائل ایپ ڈاؤن لوڈ کریں (APK)",
  contactSupport: "معاونت سے رابطہ",
  screeningHeader: "اسکریننگ اور رہنمائی",
  understandPcos: "PCOS کو سمجھیں (خواتین)",
  understandHypogonadism: "ہائپوگوناڈزم کو سمجھیں (مرد حضرات)",
  clinicalResources: "غذائی منصوبے اور طبی رہنمائی",
  costAwareProgression: "مرحلہ وار اور کفایت شعار جانچ",
  doctorSharing: "ڈاکٹر اور فیملی کے ساتھ شیئرنگ",
  privacySecurity: "پرائیویسی اور ڈیٹا کا تحفظ",
  stayUpdatedHeader: "باخبر رہیں",
  stayUpdatedDesc: "ہارمونل اور ریپروڈکٹیو صحت کی تازہ ترین معلومات اپنے ان باکس میں حاصل کریں۔",
  emailPlaceholder: "اپنا ای میل درج کریں",
  subscribe: "سبسکرائب کریں",
  subscribedSuccess: "آپ کامیابی سے شامل ہو گئے ہیں!",
  signature: "علم، نگہداشت اور روشن مستقبل۔",
  medicalNoticeLabel: "طبی تنبیہ:",
  medicalNoticeText: "بایوپلس ایک اسکریننگ اور فیصلہ سازی کا معاون ٹول ہے۔ یہ کوئی حتمی تشخیصی نظام یا ڈاکٹر کا متبادل نہیں ہے۔ مستند طبی تشخیص کے لیے ہمیشہ ڈاکٹر سے رجوع کریں۔",
  copyright: "© 2026 بایوپلس (BioPulse AI)۔ جملہ حقوق محفوظ ہیں۔",
  privacyPolicy: "پرائیویسی پالیسی",
  termsOfService: "شرائط و ضوابط"
};

// Enhance auth section keys
enAuth.welcomeBackTag = "WELCOME BACK";
urAuth.welcomeBackTag = "خوش آمدید";

enAuth.loginBrandTitle = "Login to BioPulse AI";
urAuth.loginBrandTitle = "بایوپلس (BioPulse AI) میں لاگ ان کریں";

enAuth.loginBrandSubtitle = "Continue your journey towards better reproductive and hormonal health.";
urAuth.loginBrandSubtitle = "اپنی ہارمونل اور تولیدی صحت کے سفر کو جاری رکھیں۔";

enAuth.trustSignal1 = "Your data stays private";
urAuth.trustSignal1 = "آپ کا ڈیٹا مکمل محفوظ اور پرائیویٹ ہے";

enAuth.trustSignal2 = "Trusted by clinicians";
urAuth.trustSignal2 = "ماہر اطباء کا بااعتماد پلیٹ فارم";

enAuth.trustSignal3 = "Evidence-based & AI";
urAuth.trustSignal3 = "شواہد پر مبنی مستند AI نظام";

enAuth.registerBrandTitle = "Create Your Account";
urAuth.registerBrandTitle = "اپنا بایوپلس اکاؤنٹ بنائیں";

enAuth.registerBrandSubtitle = "Join BioPulse AI in just a few steps.";
urAuth.registerBrandSubtitle = "صرف چند آسان مراحل میں بایوپلس سے جڑیں۔";

enAuth.registerFeature1 = "Evidence-grounded screening";
urAuth.registerFeature1 = "شواہد پر مبنی مستند اسکریننگ";

enAuth.registerFeature2 = "Personalized Pakistani nutrition";
urAuth.registerFeature2 = "ذاتی نوعیت کی پاکستانی غذائی رہنمائی";

enAuth.registerFeature3 = "Doctor & Care Circle sharing";
urAuth.registerFeature3 = "ڈاکٹر اور فیملی کے ساتھ محفوظ شیئرنگ";

enAuth.registerFeature4 = "Support for a healthier you";
urAuth.registerFeature4 = "ایک صحت مند اور پرسکون زندگی کی طرف قدم";

enAuth.googleLoading = "Connecting to Google...";
urAuth.googleLoading = "گوگل سے رابطہ کیا جا رہا ہے...";

fs.writeFileSync(enPublicPath, JSON.stringify(enPublic, null, 2), 'utf8');
fs.writeFileSync(urPublicPath, JSON.stringify(urPublic, null, 2), 'utf8');
fs.writeFileSync(enAuthPath, JSON.stringify(enAuth, null, 2), 'utf8');
fs.writeFileSync(urAuthPath, JSON.stringify(urAuth, null, 2), 'utf8');

console.log('✅ Updated public.json and auth.json successfully with full parity.');
