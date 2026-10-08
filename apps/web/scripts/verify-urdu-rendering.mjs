import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\820ba3af-8aa2-4cf7-ab8a-f5128cebb57e';

function createMockSession() {
  return {
    access_token: 'mock-access-token-authenticated',
    refresh_token: 'mock-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 999999,
    expires_in: 999999,
    token_type: 'bearer',
    user: {
      id: 'usr_ayesha_khan',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'ayesha.khan@example.com',
      email_confirmed_at: '2026-01-01T00:00:00.000Z',
      phone: '+92 300 1234567',
      user_metadata: {
        full_name: 'Ayesha Khan',
        gender: 'female',
        pathway: 'female',
        preferred_language: 'ur'
      },
      app_metadata: {
        provider: 'email'
      },
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    }
  };
}

const DEFAULT_FEMALE_PROFILE = {
  id: 'usr_ayesha_khan',
  fullName: 'Ayesha Khan',
  email: 'ayesha.khan@example.com',
  phone: '+92 300 1234567',
  dateOfBirth: '1998-05-14',
  gender: 'female',
  pathway: 'female',
  isOnboarded: true,
  preferredLanguage: 'ur',
  medical: {
    bloodType: 'B+',
    allergies: ['Penicillin'],
    medications: []
  }
};

const URDU_REGEX = /[\u0600-\u06FF]/;
const CLINICAL_ACRONYMS = ['PCOS', 'BMI', 'LH', 'FSH', 'HbA1c'];

async function run() {
  console.log('🚀 Starting Automated Headless Chrome Verification for Urdu & RTL...');
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome executable not found at: ${CHROME_PATH}`);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  const testResults = [];

  try {
    // Prime the page origin and set localStorage
    console.log('Priming origin and configuring Urdu RTL session state...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((mockSession, femaleProfile) => {
      localStorage.setItem('biopulse_locale', 'ur');
      localStorage.setItem('biopulse_locale_selected', 'true');
      localStorage.setItem('i18nextLng', 'ur');
      localStorage.setItem('sb-dqqrqwjeebecmgfsihtv-auth-token', JSON.stringify(mockSession));
      localStorage.setItem('ovasense_user_profile_v1', JSON.stringify(femaleProfile));
    }, createMockSession(), DEFAULT_FEMALE_PROFILE);

    const routesToTest = [
      {
        path: '/',
        name: 'Landing Page',
        auth: 'unauthenticated',
        screenshot: 'urdu_verified_home.png',
        checkText: (t) => t.includes('متوازن') || t.includes('ہارمونز') || t.includes('صحت')
      },
      {
        path: '/login',
        name: 'Authentication (Login)',
        auth: 'unauthenticated',
        screenshot: 'urdu_verified_login.png',
        checkText: (t) => t.includes('خوش آمدید') || t.includes('لاگ ان')
      },
      {
        path: '/understand-pcos',
        name: 'Understand PCOS Educational Guide',
        auth: 'unauthenticated',
        screenshot: 'urdu_verified_understand_pcos.png',
        checkText: (t) => t.includes('پولی سسٹک') || t.includes('PCOS')
      },
      {
        path: '/onboarding',
        name: 'Onboarding Pathway Selector',
        auth: 'onboarding-needed',
        screenshot: 'urdu_verified_onboarding.png',
        checkText: (t) => t.includes('خواتین') || t.includes('مردانہ') || t.includes('پاتھ وے')
      },
      {
        path: '/app/settings',
        name: 'Clinical Settings Portal',
        auth: 'authenticated',
        screenshot: 'urdu_verified_settings.png',
        checkText: (t) => t.includes('معلومات') || t.includes('پروفائل') || t.includes('سیٹنگز') || t.includes('صحت') || t.includes('Settings')
      },
      {
        path: '/app/chat',
        name: 'AI Companion Chat',
        auth: 'authenticated',
        screenshot: 'urdu_verified_chat.png',
        checkText: (t) => t.includes('بائیو پلس') || t.includes('صحت') || t.includes('پیغام') || t.includes('گفتگو') || t.includes('Chat')
      }
    ];

    for (const r of routesToTest) {
      console.log(`\n--- Testing [${r.path}] (${r.name}) ---`);

      // Adjust auth state depending on route requirement
      await page.evaluate((authMode, mockSession, femaleProfile) => {
        if (authMode === 'unauthenticated') {
          localStorage.removeItem('sb-dqqrqwjeebecmgfsihtv-auth-token');
          localStorage.removeItem('ovasense_user_profile_v1');
        } else if (authMode === 'onboarding-needed') {
          localStorage.setItem('sb-dqqrqwjeebecmgfsihtv-auth-token', JSON.stringify(mockSession));
          localStorage.setItem('ovasense_user_profile_v1', JSON.stringify({
            ...femaleProfile,
            isOnboarded: false,
            pathway: undefined
          }));
        } else {
          localStorage.setItem('sb-dqqrqwjeebecmgfsihtv-auth-token', JSON.stringify(mockSession));
          localStorage.setItem('ovasense_user_profile_v1', JSON.stringify({
            ...femaleProfile,
            isOnboarded: true,
            pathway: 'female'
          }));
        }
        localStorage.setItem('biopulse_locale', 'ur');
        localStorage.setItem('biopulse_locale_selected', 'true');
        localStorage.setItem('i18nextLng', 'ur');
      }, r.auth, createMockSession(), DEFAULT_FEMALE_PROFILE);

      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });

      // Robust wait for splash screen to disappear and actual route to mount
      try {
        await page.waitForFunction(() => {
          const bodyText = document.body ? document.body.innerText : '';
          const hasSplash = bodyText.includes('Preparing your health experience');
          return !hasSplash && bodyText.trim().length > 20;
        }, { timeout: 8000 });
      } catch {
        console.log(`Note: timed out waiting for splash unmount on ${r.path}, proceeding...`);
      }
      await new Promise(res => setTimeout(res, 800));

      const pageData = await page.evaluate(() => {
        const dir = document.documentElement.dir;
        const lang = document.documentElement.lang;
        const text = document.body.innerText;
        const title = document.title;
        const font = window.getComputedStyle(document.body).fontFamily;
        return { dir, lang, font, textSnippet: text.slice(0, 300), fullText: text, title };
      });

      const hasUrdu = URDU_REGEX.test(pageData.fullText) || URDU_REGEX.test(pageData.title);
      const dirPass = pageData.dir === 'rtl';
      const langPass = pageData.lang === 'ur';
      const acronymsFound = CLINICAL_ACRONYMS.filter(acr => pageData.fullText.includes(acr) || pageData.title.includes(acr));
      const textCheckPass = r.checkText(pageData.fullText);

      const screenshotPath = path.join(ARTIFACT_DIR, r.screenshot);
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot: ${screenshotPath}`);

      testResults.push({
        route: r.path,
        name: r.name,
        dir: pageData.dir,
        lang: pageData.lang,
        dirPass,
        langPass,
        hasUrdu,
        font: pageData.font,
        acronymsFound,
        textCheckPass,
        snippet: pageData.textSnippet.replace(/\n+/g, ' '),
        screenshot: screenshotPath
      });
    }

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n======================================================');
  console.log('       URDU & RTL RENDERING VERIFICATION SUMMARY      ');
  console.log('======================================================');
  let allPassed = true;
  for (const res of testResults) {
    const passed = res.dirPass && res.langPass && res.hasUrdu && res.textCheckPass;
    if (!passed) allPassed = false;
    console.log(`Route [${res.route}] (${res.name}):`);
    console.log(`  - dir="rtl": ${res.dirPass ? '✅ PASS' : '❌ FAIL'} (${res.dir})`);
    console.log(`  - lang="ur": ${res.langPass ? '✅ PASS' : '❌ FAIL'} (${res.lang})`);
    console.log(`  - Urdu Script Rendered: ${res.hasUrdu ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  - Expected Content Match: ${res.textCheckPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  - Content Snippet: "${res.snippet}"`);
    console.log(`  - Clinical Acronyms: ${res.acronymsFound.join(', ') || 'None in view'}`);
    console.log(`  - Screenshot: ${res.screenshot}`);
    console.log('------------------------------------------------------');
  }

  console.log(`OVERALL RESULT: ${allPassed ? '✅ ALL 6 ROUTES FULLY VERIFIED IN URDU RTL' : '❌ SOME TESTS FAILED'}`);

  const reportPath = path.join(ARTIFACT_DIR, 'urdu_rendering_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), allPassed, testResults }, null, 2));
  console.log(`Detailed verification report saved to: ${reportPath}`);
}

run().catch(err => {
  console.error('Verification script crashed with error:', err);
  process.exit(1);
});
