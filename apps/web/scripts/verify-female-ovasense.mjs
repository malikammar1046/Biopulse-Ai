import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\45123111-8157-4b5b-88e0-9f685625dcd6';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUPABASE_URL = 'https://dqqrqwjeebecmgfsihtv.supabase.co';
const SUPABASE_ANON = 'sb_publishable_rZfbhMCOuoCGq4TVmjiEbA_wnlcutJP';

async function main() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  const testEmail = process.env.TEST_FEMALE_EMAIL || process.env.TEST_USER_EMAIL || '';
  const testPassword = process.env.TEST_FEMALE_PASSWORD || process.env.TEST_USER_PASSWORD || '';
  if (!testEmail || !testPassword) {
    console.log('Test credentials not provided via TEST_FEMALE_EMAIL/TEST_USER_EMAIL, skipping capture');
    return;
  }
  const { data } = await sb.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (!data?.session) {
    console.log('Female test account not available, skipping female capture');
    return;
  }
  const session = data.session;

  const femaleProfile = {
    id: session.user.id,
    email: session.user.email,
    fullName: 'Aisha Khan',
    gender: 'female',
    pathway: 'female',
    isOnboarded: true,
    onboardingCompleted: true,
    preferredLanguage: 'en',
    lifestyle: { activityLevel: 'moderate', sleepHours: 7.5 },
  };

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      (sess, prof) => {
        localStorage.setItem('sb-dqqrqwjeebecmgfsihtv-auth-token', JSON.stringify(sess));
        localStorage.setItem('ovasense_user_profile_v1', JSON.stringify(prof));
        localStorage.setItem('biopulse_user_profile', JSON.stringify(prof));
        localStorage.setItem('biopulse_active_pathway', 'female');
        localStorage.setItem('biopulse_locale_selected', 'true');
        localStorage.setItem('biopulse_locale', 'en');
      },
      session,
      femaleProfile
    );

    await page.goto('http://localhost:5174/app/lifestyle', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 6000));

    // Hide Reticle
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot || el.tagName.toLowerCase().includes('reticle') || el.id?.includes('reticle')) {
          el.style.display = 'none';
        }
        if (el.textContent?.includes('Reticle') && window.getComputedStyle(el).position === 'fixed') {
          el.style.display = 'none';
        }
      });
    });

    const outPath = path.join(ARTIFACTS_DIR, 'ovasense_female_intact_verified.png');
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Saved Female OvaSense Screenshot:', outPath);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
