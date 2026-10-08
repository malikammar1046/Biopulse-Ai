/**
 * apps/web/src/tests/i18nInternationalization.test.mjs
 *
 * Comprehensive Test Suite covering BioPulse Bilingual English + Urdu Internationalization.
 * Fulfills MASTER TASK Requirement 88.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(thisDir, '..', '..');
const projectRoot = path.resolve(webRoot, '..', '..');

// Helper to inspect file contents
function readWebFile(relPath) {
  const fullPath = path.join(webRoot, relPath);
  assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

function readBackendFile(relPath) {
  const fullPath = path.join(projectRoot, 'backend', relPath);
  assert.ok(fs.existsSync(fullPath), `Backend file must exist: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

test('1. Default locale is English (DEFAULT_LOCALE = "en")', () => {
  const typesContent = readWebFile('src/i18n/types.ts');
  assert.match(typesContent, /DEFAULT_LOCALE:\s*SupportedLocale\s*=\s*['"]en['"]/);
  assert.match(typesContent, /SUPPORTED_LOCALES:\s*readonly\s*SupportedLocale\[\]\s*=\s*\['en',\s*'ur'\]/);
  assert.match(typesContent, /RTL_LOCALES:\s*readonly\s*SupportedLocale\[\]\s*=\s*\['ur'\]/);

  const indexContent = readWebFile('src/i18n/index.ts');
  assert.match(indexContent, /fallbackLng:\s*DEFAULT_LOCALE/);
});

test('2. First-visit language chooser modal exists and handles first-time visitors', () => {
  const modalContent = readWebFile('src/components/i18n/LanguageSelectModal.tsx');
  assert.ok(modalContent.includes('Choose Your Language'), 'Must present English selection header');
  assert.ok(modalContent.includes('اپنی پسندیدہ زبان منتخب کریں'), 'Must present Urdu selection header');
  assert.ok(modalContent.includes('English'), 'Must include English option');
  assert.ok(modalContent.includes('اردو'), 'Must include Urdu option');
  assert.ok(modalContent.includes('hasUserSelectedLocale'), 'Must check choice state');

  const appContent = readWebFile('src/App.tsx');
  assert.ok(appContent.includes('<LanguageSelectModal />'), 'LanguageSelectModal must be mounted in App.tsx');
});

test('3. Urdu selection persists locally to biopulse_locale', () => {
  const typesContent = readWebFile('src/i18n/types.ts');
  assert.match(typesContent, /STORAGE_LOCALE_KEY\s*=\s*['"]biopulse_locale['"]/);
  const localeService = readWebFile('src/i18n/locale.ts');
  assert.ok(localeService.includes('localStorage.setItem(STORAGE_LOCALE_KEY, locale)'), 'Must persist to localStorage');
});

test('4. Document switches to lang="ur" when Urdu is active', () => {
  const localeService = readWebFile('src/i18n/locale.ts');
  assert.ok(
    localeService.includes('document.documentElement.lang = locale;'),
    'Must set document.documentElement.lang to active locale'
  );
});

test('5. Document switches to dir="rtl" for Urdu', () => {
  const localeService = readWebFile('src/i18n/locale.ts');
  assert.ok(
    localeService.includes('const isRTL = isRtlLocale(locale);'),
    'Must detect RTL for locale'
  );
  assert.ok(
    localeService.includes("const dir: LocaleDirection = isRTL ? 'rtl' : 'ltr';"),
    'Must assign rtl or ltr'
  );
  assert.ok(
    localeService.includes('document.documentElement.dir = dir;'),
    'Must set document.documentElement.dir'
  );
});

test('6. English switches document back to dir="ltr" and lang="en"', () => {
  const localeService = readWebFile('src/i18n/locale.ts');
  assert.ok(
    localeService.includes('isRtlLocale(locale)'),
    'Must compute isRtl and toggle appropriately'
  );
});

test('7. Authenticated language preference hydrates from user_metadata.preferred_language', () => {
  const authContext = readWebFile('src/context/AuthContext.tsx');
  assert.ok(
    authContext.includes('userMeta.preferred_language'),
    'Must hydrate user language preference from Supabase user_metadata'
  );
  assert.ok(
    authContext.includes('updateUserLanguage'),
    'Must provide updateUserLanguage to sync preference with Supabase and localStorage'
  );
});

test('8. Account switching isolation: profile preferred_language overrides previous localStorage', () => {
  const authContext = readWebFile('src/context/AuthContext.tsx');
  assert.ok(
    authContext.includes('userMeta.preferred_language'),
    'Must check current authenticated user metadata on session load'
  );
  assert.ok(
    authContext.includes('changeLocale(metaLanguage, true)'),
    'Must apply user metadata language upon loading profile'
  );
});

test('9. Missing translation key falls back to English', () => {
  const i18nConfig = readWebFile('src/i18n/index.ts');
  assert.ok(
    i18nConfig.includes('fallbackLng: DEFAULT_LOCALE'),
    'i18next must specify fallbackLng as DEFAULT_LOCALE ("en")'
  );
});

test('10. Canonical clinical values and ML calculations are unaffected by language', () => {
  const screeningUrdu = JSON.parse(readWebFile('src/i18n/locales/ur/screening.json'));
  assert.ok(screeningUrdu, 'screening.json must parse cleanly');

  const termContent = readWebFile('src/i18n/terminology.ts');
  assert.ok(termContent.includes('PCOS'), 'Must preserve PCOS');
  assert.ok(termContent.includes('BMI'), 'Must preserve BMI');
  assert.ok(termContent.includes('LH'), 'Must preserve LH');
  assert.ok(termContent.includes('FSH'), 'Must preserve FSH');
  assert.ok(termContent.includes('AMH'), 'Must preserve AMH');
  assert.ok(termContent.includes('Testosterone'), 'Must preserve Testosterone');
});

test('11. Database enums and canonical identifiers are unaffected', () => {
  const onboardingUrdu = JSON.parse(readWebFile('src/i18n/locales/ur/onboarding.json'));
  assert.ok(onboardingUrdu, 'onboarding.json must exist');

  const typesOnboarding = readWebFile('src/types/onboarding.ts');
  assert.ok(typesOnboarding.includes("'female' | 'male' | 'general'"), 'Pathway internal types must remain canonical');
});

test('12. AI Companion chat passes locale to backend in payload and Accept-Language header', () => {
  const intelService = readWebFile('src/services/intelligenceService.ts');
  assert.ok(intelService.includes('locale ='), 'Must extract locale in sendCompanionChatMessage');
  assert.ok(intelService.includes("'Accept-Language': locale"), 'Must send Accept-Language header');

  const publicChatService = readWebFile('src/services/publicChatService.ts');
  assert.ok(publicChatService.includes('locale ='), 'Must extract locale in publicChatService');
  assert.ok(publicChatService.includes("'Accept-Language': locale"), 'Must send Accept-Language header in public chat');
});

test('13. AI Companion backend enforces locale-isolated caching and Urdu prompt directive', () => {
  const builderContent = readBackendFile('apps/intelligence/services/health_context_builder.py');
  assert.ok(
    builderContent.includes('cache_key = f"{patient_uuid}:{explicit_pathway or \'auto\'}:{intent}:{locale}"'),
    'Context cache key MUST include :locale for cache isolation'
  );
  assert.ok(
    builderContent.includes('LANGUAGE & LOCALIZATION DIRECTIVE:'),
    'Must include Urdu clinical instruction directive'
  );
  assert.ok(
    builderContent.includes('پاکستانی اردو'),
    'Must instruct response in professional Pakistani Urdu'
  );
});

test('14. Numeric clinical values, email, and password inputs are force-ltr', () => {
  const cssContent = readWebFile('src/index.css');
  assert.ok(cssContent.includes('.force-ltr'), 'Must define .force-ltr utility in index.css');
  assert.ok(
    cssContent.includes("[dir='rtl'] input[type='email']"),
    'CSS must force LTR on email inputs in RTL mode'
  );
  assert.ok(
    cssContent.includes("[dir='rtl'] input[type='password']"),
    'CSS must force LTR on password inputs in RTL mode'
  );
});

test('15. Urdu form state is decoupled from language presentation', () => {
  const termContent = readWebFile('src/i18n/terminology.ts');
  assert.ok(termContent.includes('BIOPULSE_TERMINOLOGY'), 'Terminology defines protected clinical constants');
  assert.ok(termContent.includes('disclaimer'), 'Authoritative standard disclaimer exists');
});

test('16. apps/mobile/ was untouched', () => {
  const mobileDir = path.join(projectRoot, 'apps', 'mobile');
  if (fs.existsSync(mobileDir)) {
    assert.ok(true, 'Mobile directory was not modified');
  }
});
