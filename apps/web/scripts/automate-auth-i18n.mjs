import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enAuthPath = path.resolve(__dirname, '../src/i18n/locales/en/auth.json');
const urAuthPath = path.resolve(__dirname, '../src/i18n/locales/ur/auth.json');

const enAuth = JSON.parse(fs.readFileSync(enAuthPath, 'utf8'));
const urAuth = JSON.parse(fs.readFileSync(urAuthPath, 'utf8'));

const newAuthKeysEn = {
  smallStepsTag: "Small Steps\nHealthier Tomorrows",
  betterInsights: "Better Insights",
  brighterTomorrows: "Brighter Tomorrows",
  signingIn: "Signing in...",
  signUpButton: "Sign Up",
  agreeTerms: "By logging in, you agree to our",
  agreeTermsRegister: "By creating an account, you agree to our",
  termsOfService: "Terms of Service",
  and: "and",
  privacyPolicy: "Privacy Policy",
  forgotPasswordNotice: "Password recovery is enabled. Please enter your email above and contact support if you need immediate assistance.",
  googleCancelled: "Google sign-in was cancelled. You can sign in using email & password or try Google again.",
  googleFailed: "Google sign-in could not be completed. Please try again or use your password.",
  startJourneyHeadline: "Start Your\nHealth Journey\nToday",
  registerSubtitleLong: "Join BioPulse AI and take a step towards better reproductive and hormonal health.",
  personalizedInsights: "Personalized insights",
  aiPoweredScreening: "AI-powered screening",
  trackProgress: "Track progress over time",
  healthierYouSupport: "Support for a healthier you",
  sameCareTag: "Same\nCare\nDifferent\nJourneys",
  informedTodayTag: "Informed Today • Healthier Tomorrow",
  creatingAccount: "Creating Account...",
  dobNotice: "Date of birth and basic details will be collected during onboarding.",
  quoteHealthierTomorrow: "“A healthier tomorrow starts with you.”",
  verifyEmailTitle: "Verify your email",
  verifyEmailSent: "We sent a verification link to",
  verifyEmailInstructions: "Please click the link to activate your BioPulse AI account and begin your assessment.",
  returnToLogin: "Return to Login",
  orSignUpWith: "or sign up with"
};

const newAuthKeysUr = {
  smallStepsTag: "چھوٹے قدم\nصحت مند کل",
  betterInsights: "بہتر بصیرت",
  brighterTomorrows: "روشن کل",
  signingIn: "سائن ان ہو رہا ہے...",
  signUpButton: "اکاؤنٹ بنائیں",
  agreeTerms: "لاگ ان کر کے، آپ ہماری",
  agreeTermsRegister: "اکاؤنٹ بنا کر، آپ ہماری",
  termsOfService: "خدمات کی شرائط",
  and: "اور",
  privacyPolicy: "رازداری کی پالیسی",
  forgotPasswordNotice: "پاس ورڈ کی بحالی فعال ہے۔ براہ کرم اوپر اپنا ای میل درج کریں یا مدد کے لیے سپورٹ سے رابطہ کریں۔",
  googleCancelled: "گوگل سائن ان منسوخ کر دیا گیا تھا۔ آپ ای میل اور پاس ورڈ استعمال کر کے لاگ ان کر سکتے ہیں۔",
  googleFailed: "گوگل سائن ان مکمل نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں یا اپنا پاس ورڈ استعمال کریں۔",
  startJourneyHeadline: "اپنی صحت کا سفر\nآج ہی شروع کریں",
  registerSubtitleLong: "بایوپلس سے جڑیں اور اپنی ہارمونل و تولیدی صحت کو بہتر بنانے کی جانب قدم بڑھائیں۔",
  personalizedInsights: "ذاتی نوعیت کا مستند تجزیہ",
  aiPoweredScreening: "شواہد پر مبنی AI اسکریننگ",
  trackProgress: "وقت کے ساتھ اپنی صحت کا ریکارڈ",
  healthierYouSupport: "ایک صحت مند اور پرسکون زندگی",
  sameCareTag: "یکساں\nنگہداشت\nانفرادی\nسفر",
  informedTodayTag: "آج آگاہی • کل تندرستی",
  creatingAccount: "اکاؤنٹ بنایا جا رہا ہے...",
  dobNotice: "تاریخ پیدائش اور بنیادی تفصیلات آن بورڈنگ کے دوران حاصل کی جائیں گی۔",
  quoteHealthierTomorrow: "“ایک صحت مند کل کی شروعات آپ سے ہوتی ہے۔”",
  verifyEmailTitle: "اپنے ای میل کی تصدیق کریں",
  verifyEmailSent: "ہم نے تصدیقی لنک بھیجا ہے:",
  verifyEmailInstructions: "براہ کرم بایوپلس اکاؤنٹ فعال کرنے اور اپنی اسکریننگ شروع کرنے کے لیے اس لنک پر کلک کریں۔",
  returnToLogin: "لاگ ان پر واپس جائیں",
  orSignUpWith: "یا بذریعہ اکاؤنٹ بنائیں"
};

for (const [k, v] of Object.entries(newAuthKeysEn)) {
  enAuth[k] = v;
  urAuth[k] = newAuthKeysUr[k];
}

fs.writeFileSync(enAuthPath, JSON.stringify(enAuth, null, 2) + '\n', 'utf8');
fs.writeFileSync(urAuthPath, JSON.stringify(urAuth, null, 2) + '\n', 'utf8');
console.log(`Updated auth.json with ${Object.keys(newAuthKeysEn).length} new keys. Total keys: ${Object.keys(enAuth).length}`);
