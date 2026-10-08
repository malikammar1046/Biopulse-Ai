import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enCommonPath = path.resolve(__dirname, '../src/i18n/locales/en/common.json');
const urCommonPath = path.resolve(__dirname, '../src/i18n/locales/ur/common.json');
const enPublicPath = path.resolve(__dirname, '../src/i18n/locales/en/public.json');
const urPublicPath = path.resolve(__dirname, '../src/i18n/locales/ur/public.json');

const enCommon = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));
const urCommon = JSON.parse(fs.readFileSync(urCommonPath, 'utf8'));
const enPublic = JSON.parse(fs.readFileSync(enPublicPath, 'utf8'));
const urPublic = JSON.parse(fs.readFileSync(urPublicPath, 'utf8'));

// Add micro-trust tokens to common
enCommon.privateSecure = "Private & Secure";
urCommon.privateSecure = "مکمل محفوظ اور پرائیویٹ";

enCommon.clinicallyInformed = "Clinically Informed";
urCommon.clinicallyInformed = "طبی شواہد سے ہم آہنگ";

enCommon.builtForPakistan = "Built for Pakistan";
urCommon.builtForPakistan = "پاکستانی صحت کے تقاضوں کے مطابق";

fs.writeFileSync(enCommonPath, JSON.stringify(enCommon, null, 2), 'utf8');
fs.writeFileSync(urCommonPath, JSON.stringify(urCommon, null, 2), 'utf8');

// 1. TwoHealthPathwaysSection.tsx
const twoPathwaysFile = path.resolve(__dirname, '../src/pages/public/home-sections/TwoHealthPathwaysSection.tsx');
let twoPathwaysCode = fs.readFileSync(twoPathwaysFile, 'utf8');

if (!twoPathwaysCode.includes("useTranslation")) {
  twoPathwaysCode = twoPathwaysCode.replace(
    "import React from 'react';",
    "import React from 'react';\nimport { useTranslation } from 'react-i18next';"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "export const TwoHealthPathwaysSection: React.FC = () => {",
    "export const TwoHealthPathwaysSection: React.FC = () => {\n  const { t } = useTranslation(['public', 'common']);"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "TWO DEDICATED PATHWAYS",
    "{t('public:twoPathways.eyebrow')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span className=\"text-[#0F254B]\">Different Journeys.</span>{' '}\n            <span className=\"text-[#00838F]\">A Healthier Tomorrow.</span>",
    "{t('public:twoPathways.title')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "Specialized, evidence-based screening for women and men — powered by AI, designed for you.",
    "{t('public:twoPathways.subtitle')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span>For Women</span>",
    "<span>{t('public:twoPathways.forWomen')}</span>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "Understand your risk for PCOS with a simple, non-diagnostic assessment based on symptoms, cycle information, lifestyle, and metabolic indicators.",
    "{t('public:twoPathways.femaleDesc')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "Menstrual &amp; hormonal health",
    "{t('public:twoPathways.femaleBullet1')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "Symptom &amp; lifestyle assessment",
    "{t('public:twoPathways.femaleBullet2')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    ">Personalized insights<",
    ">{t('public:twoPathways.femaleBullet3')}<"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span>Understand PCOS</span>",
    "<span>{t('public:twoPathways.understandPcos')}</span>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<div className=\"text-[11px] font-bold text-slate-800\">Your Health</div>\n                    <div className=\"text-[10px] font-medium text-slate-500\">Your Power</div>",
    "<div className=\"text-[11px] font-bold text-slate-800\">{t('public:twoPathways.femaleBadgeTitle')}</div>\n                    <div className=\"text-[10px] font-medium text-slate-500\">{t('public:twoPathways.femaleBadgeSubtitle')}</div>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span>For Men</span>",
    "<span>{t('public:twoPathways.forMen')}</span>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "Explore your risk for hypogonadism with a simple, non-diagnostic assessment based on symptoms, health profile, and relevant hormonal and metabolic indicators.",
    "{t('public:twoPathways.maleDesc')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "Symptoms &amp; energy levels",
    "{t('public:twoPathways.maleBullet1')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "Hormonal &amp; metabolic health",
    "{t('public:twoPathways.maleBullet2')}"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    ">Personalized insights<",
    ">{t('public:twoPathways.maleBullet3')}<"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span>Understand Hypogonadism</span>",
    "<span>{t('public:twoPathways.understandHypogonadism')}</span>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<div className=\"text-[11px] font-bold text-slate-800\">Optimized Today</div>\n                    <div className=\"text-[10px] font-medium text-slate-500\">for a Stronger You</div>",
    "<div className=\"text-[11px] font-bold text-slate-800\">{t('public:twoPathways.maleBadgeTitle')}</div>\n                    <div className=\"text-[10px] font-medium text-slate-500\">{t('public:twoPathways.maleBadgeSubtitle')}</div>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span>Private &amp; Secure</span>",
    "<span>{t('common:privateSecure')}</span>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span>Clinically Informed</span>",
    "<span>{t('common:clinicallyInformed')}</span>"
  );
  twoPathwaysCode = twoPathwaysCode.replace(
    "<span>Built for Pakistan</span>",
    "<span>{t('common:builtForPakistan')}</span>"
  );

  fs.writeFileSync(twoPathwaysFile, twoPathwaysCode, 'utf8');
  console.log('✅ TwoHealthPathwaysSection updated.');
}

// 2. HowItWorksSection.tsx
const howItWorksFile = path.resolve(__dirname, '../src/pages/public/home-sections/HowItWorksSection.tsx');
let howItWorksCode = fs.readFileSync(howItWorksFile, 'utf8');

if (!howItWorksCode.includes("useTranslation")) {
  howItWorksCode = howItWorksCode.replace(
    "import React from 'react';",
    "import React from 'react';\nimport { useTranslation } from 'react-i18next';"
  );
  howItWorksCode = howItWorksCode.replace(
    "export const HowItWorksSection: React.FC = () => {",
    "export const HowItWorksSection: React.FC = () => {\n  const { t } = useTranslation('public');"
  );
  howItWorksCode = howItWorksCode.replace(
    "How BioPulse AI Works",
    "{t('howItWorks.eyebrow')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "<span className=\"text-[#0F254B]\">From Answers to a</span>{' '}\n            <span className=\"text-[#00838F]\">Healthier You</span>",
    "{t('howItWorks.title')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "A simple, guided process that turns your information into meaningful insights &mdash; so you can take the next step with confidence.",
    "{t('howItWorks.subtitle')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "Share Your Health Information",
    "{t('howItWorks.step1Title')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "Start by answering a few guided questions about your symptoms, cycle patterns, or energy levels.",
    "{t('howItWorks.step1Desc')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "Explainable AI-Assisted Assessment",
    "{t('howItWorks.step2Title')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "Our models evaluate patterns to provide clear, calibrated screening risk — with every factor transparently explained.",
    "{t('howItWorks.step2Desc')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "Personalized Guidance &amp; Next Steps",
    "{t('howItWorks.step3Title')}"
  );
  howItWorksCode = howItWorksCode.replace(
    "Get actionable Pakistani nutrition guidance, lifestyle recommendations, and clear guidance for your next steps.",
    "{t('howItWorks.step3Desc')}"
  );

  fs.writeFileSync(howItWorksFile, howItWorksCode, 'utf8');
  console.log('✅ HowItWorksSection updated.');
}

// 3. FeaturesSection.tsx
const featuresFile = path.resolve(__dirname, '../src/pages/public/home-sections/FeaturesSection.tsx');
let featuresCode = fs.readFileSync(featuresFile, 'utf8');

if (!featuresCode.includes("useTranslation")) {
  featuresCode = featuresCode.replace(
    "import React from 'react';",
    "import React from 'react';\nimport { useTranslation } from 'react-i18next';"
  );
  featuresCode = featuresCode.replace(
    "export const FeaturesSection: React.FC = () => {",
    "export const FeaturesSection: React.FC = () => {\n  const { t } = useTranslation('public');"
  );
  featuresCode = featuresCode.replace(
    "Core Differentiators",
    "{t('features.eyebrow')}"
  );
  featuresCode = featuresCode.replace(
    "<span className=\"text-[#0F254B]\">Engineered for</span>{' '}\n            <span className=\"text-[#00838F]\">Clinical Transparency</span>",
    "{t('features.title')}"
  );
  featuresCode = featuresCode.replace(
    "Non-diagnostic decision support designed around clarity, attribution, and practical next steps.",
    "{t('features.subtitle')}"
  );
  featuresCode = featuresCode.replace(
    "Progressive Screening",
    "{t('features.card1Title')}"
  );
  featuresCode = featuresCode.replace(
    "Start simple and add health information when needed. Our tiered approach keeps it accessible, affordable, and scalable.",
    "{t('features.card1Desc')}"
  );
  featuresCode = featuresCode.replace(
    "Explainable Machine Learning",
    "{t('features.card2Title')}"
  );
  featuresCode = featuresCode.replace(
    "No black boxes. See exactly which symptoms, markers, or lifestyle factors contributed to your screening result.",
    "{t('features.card2Desc')}"
  );
  featuresCode = featuresCode.replace(
    "Pakistani Nutrition &amp; Lifestyle",
    "{t('features.card3Title')}"
  );
  featuresCode = featuresCode.replace(
    "Culturally grounded recommendations that fit your everyday routine, diet, and lifestyle in Pakistan.",
    "{t('features.card3Desc')}"
  );

  fs.writeFileSync(featuresFile, featuresCode, 'utf8');
  console.log('✅ FeaturesSection updated.');
}

// 4. FinalCTASection.tsx
const finalCtaFile = path.resolve(__dirname, '../src/pages/public/home-sections/FinalCTASection.tsx');
let finalCtaCode = fs.readFileSync(finalCtaFile, 'utf8');

if (!finalCtaCode.includes("useTranslation")) {
  finalCtaCode = finalCtaCode.replace(
    "import React from 'react';",
    "import React from 'react';\nimport { useTranslation } from 'react-i18next';"
  );
  finalCtaCode = finalCtaCode.replace(
    "export const FinalCTASection: React.FC = () => {",
    "export const FinalCTASection: React.FC = () => {\n  const { t } = useTranslation('public');"
  );
  finalCtaCode = finalCtaCode.replace(
    "Start With{' '}\n                <span className=\"text-[#008CA5] block sm:inline\">\n                  What You Know.\n                </span>",
    "{t('finalCta.title')}"
  );
  finalCtaCode = finalCtaCode.replace(
    "BioPulse AI helps turn everyday health information into clearer insights and personalized next steps.",
    "{t('finalCta.subtitle')}"
  );
  finalCtaCode = finalCtaCode.replace(
    "<span>Start Free Screening</span>",
    "<span>{t('finalCta.button')}</span>"
  );
  finalCtaCode = finalCtaCode.replace(
    "Non-diagnostic educational health assessment. Your data is encrypted and private.",
    "{t('finalCta.disclaimer')}"
  );

  fs.writeFileSync(finalCtaFile, finalCtaCode, 'utf8');
  console.log('✅ FinalCTASection updated.');
}

// 5. Footer.tsx
const footerFile = path.resolve(__dirname, '../src/components/navigation/Footer.tsx');
let footerCode = fs.readFileSync(footerFile, 'utf8');

if (!footerCode.includes("useTranslation")) {
  footerCode = footerCode.replace(
    "import React, { useState } from 'react';",
    "import React, { useState } from 'react';\nimport { useTranslation } from 'react-i18next';"
  );
  footerCode = footerCode.replace(
    "export const Footer: React.FC = () => {",
    "export const Footer: React.FC = () => {\n  const { t } = useTranslation('public');"
  );
  footerCode = footerCode.replace(
    "BioPulse AI is an AI-assisted reproductive-endocrine screening platform providing evidence-based guidance for PCOS (female) and Hypogonadism (male).",
    "{t('footer.description')}"
  );
  footerCode = footerCode.replace(
    "<span>Evidence Based</span>",
    "<span>{t('footer.evidenceBased')}</span>"
  );
  footerCode = footerCode.replace(
    "<span>Dual Pathway</span>",
    "<span>{t('footer.dualPathway')}</span>"
  );
  footerCode = footerCode.replace(
    "<span>Non-Diagnostic</span>",
    "<span>{t('footer.nonDiagnostic')}</span>"
  );
  footerCode = footerCode.replace(
    "Different journeys. Same brighter goal.",
    "{t('footer.tagline')}"
  );
  footerCode = footerCode.replace(
    "Platform\n              </h3>",
    "{t('footer.platformHeader')}\n              </h3>"
  );
  footerCode = footerCode.replace(
    "Screening &amp; Guidance\n              </h3>",
    "{t('footer.screeningHeader')}\n              </h3>"
  );
  footerCode = footerCode.replace(
    "Stay Updated\n              </h3>",
    "{t('footer.stayUpdatedHeader')}\n              </h3>"
  );
  footerCode = footerCode.replace(
    "Get reproductive-endocrine screening updates directly to your inbox.",
    "{t('footer.stayUpdatedDesc')}"
  );
  footerCode = footerCode.replace(
    "placeholder=\"Your email address\"",
    "placeholder={t('footer.emailPlaceholder')}"
  );
  footerCode = footerCode.replace(
    ">Subscribe<",
    ">{t('footer.subscribe')}<"
  );
  footerCode = footerCode.replace(
    "<span>Subscribed successfully!</span>",
    "<span>{t('footer.subscribedSuccess')}</span>"
  );
  footerCode = footerCode.replace(
    "Knowledge. Care. Brighter Tomorrows.",
    "{t('footer.signature')}"
  );
  footerCode = footerCode.replace(
    "<strong className=\"text-slate-700 mr-1\">Medical Notice:</strong>",
    "<strong className=\"text-slate-700 mr-1\">{t('footer.medicalNoticeLabel')}</strong>"
  );
  footerCode = footerCode.replace(
    "BioPulse AI is an AI-assisted screening and decision-support tool. It is <strong>NOT</strong> a diagnostic system or doctor replacement. Consult healthcare professionals for formal clinical diagnoses.",
    "{t('footer.medicalNoticeText')}"
  );

  fs.writeFileSync(footerFile, footerCode, 'utf8');
  console.log('✅ Footer updated.');
}

console.log('🎉 Public pages localization automation finished.');
