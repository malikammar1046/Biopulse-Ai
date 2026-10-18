import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const SUPABASE_URL = 'https://dqqrqwjeebecmgfsihtv.supabase.co';
const SUPABASE_ANON = 'sb_publishable_rZfbhMCOuoCGq4TVmjiEbA_wnlcutJP';

async function main() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  const testEmail = process.env.TEST_FEMALE_EMAIL || process.env.TEST_USER_EMAIL || '';
  const testPassword = process.env.TEST_FEMALE_PASSWORD || process.env.TEST_USER_PASSWORD || '';
  if (!testEmail || !testPassword) {
    console.log('Test credentials not provided via TEST_FEMALE_EMAIL/TEST_USER_EMAIL, exiting');
    return;
  }
  const { data } = await sb.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (!data?.session) {
    console.log('Authentication failed, exiting');
    return;
  }
  const session = data.session;

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  const profile = {
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

  await page.evaluate((sess, prof) => {
    localStorage.setItem('sb-dqqrqwjeebecmgfsihtv-auth-token', JSON.stringify(sess));
    localStorage.setItem('ovasense_user_profile_v1', JSON.stringify(prof));
    localStorage.setItem('biopulse_user_profile', JSON.stringify(prof));
  }, session, profile);

  await page.goto(`${BASE_URL}/app/lifestyle`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));

  const currentUrl = page.url();
  console.log('Current URL after navigation:', currentUrl);

  const title = await page.title();
  console.log('Page title:', title);

  const bodySnippet = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Body snippet:\n', bodySnippet);

  await browser.close();
}

main().catch(console.error);
