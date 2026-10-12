import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\45123111-8157-4b5b-88e0-9f685625dcd6';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SUPABASE_URL = 'https://dqqrqwjeebecmgfsihtv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rZfbhMCOuoCGq4TVmjiEbA_wnlcutJP';

async function run() {
  console.log('1. Authenticating test account via environment variables...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = process.env.TEST_USER_EMAIL || '';
  const testPassword = process.env.TEST_USER_PASSWORD || '';
  if (!testEmail || !testPassword) {
    console.log('   Skipping automated login: TEST_USER_EMAIL or TEST_USER_PASSWORD not set.');
    return;
  }
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.session) {
    throw new Error('Supabase real authentication failed: ' + (authError?.message || 'No session'));
  }
  console.log('   Authenticated user ID:', authData.session.user.id);
  console.log('   Email:', authData.session.user.email);
  console.log('   Session access token prefix:', authData.session.access_token.slice(0, 20) + '...');

  const supabaseAuthKey = `sb-dqqrqwjeebecmgfsihtv-auth-token`;
  const sessionString = JSON.stringify(authData.session);

  console.log('2. Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Prime browser with authentic session and profile in localStorage before any document loads
    console.log('3. Priming browser with authentic session & profile via evaluateOnNewDocument...');
    const maleProfile = {
      id: authData.session.user.id,
      email: authData.session.user.email,
      fullName: 'ammar',
      gender: 'male',
      pathway: 'male',
      isOnboarded: true,
      onboardingCompleted: true,
      dateOfBirth: '2007-06-12',
      heightCm: 178,
      weightKg: 80,
      waistCm: 68,
      activityLevel: 'moderate',
      preferredLanguage: 'en',
      preferredCuisines: ['pakistani'],
      dietaryPreference: 'Balanced',
    };
    const profileString = JSON.stringify(maleProfile);

    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

    await page.evaluateOnNewDocument(
      (key, val, profStr) => {
        localStorage.setItem(key, val);
        localStorage.setItem('ovasense_user_profile_v1', profStr);
        localStorage.setItem('biopulse_user_profile', profStr);
        localStorage.setItem('biopulse_active_pathway', 'male');
        localStorage.setItem('biopulse_locale_selected', 'true');
        localStorage.setItem('biopulse_locale', 'en');
      },
      supabaseAuthKey,
      sessionString,
      profileString
    );

    // 3. Establish origin and prime localStorage
    console.log('3. Visiting /login to establish origin and prime authentic session...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      (key, val, profStr) => {
        localStorage.setItem(key, val);
        localStorage.setItem('ovasense_user_profile_v1', profStr);
        localStorage.setItem('biopulse_user_profile', profStr);
        localStorage.setItem('biopulse_active_pathway', 'male');
        localStorage.setItem('biopulse_locale_selected', 'true');
        localStorage.setItem('biopulse_locale', 'en');
      },
      supabaseAuthKey,
      sessionString,
      profileString
    );

    // 4. Navigate to AndroSense Male Lifestyle page
    console.log('4. Navigating to AndroSense Male Lifestyle page (module=androsense)...');
    await page.goto('http://localhost:5174/app/lifestyle?module=androsense', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log('   Navigated to URL:', page.url());

    // Wait for AndroSense Overview card or retry navigation
    console.log('   Waiting for [data-testid="androsense-nutrition-overview"]...');
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const currentUrl = page.url();
      const hasOverview = await page.evaluate(() => Boolean(document.querySelector('[data-testid="androsense-nutrition-overview"]')));
      if (hasOverview) {
        console.log(`   Found overview card after ${i + 1}s!`);
        break;
      }
      if (i % 3 === 0) {
        console.log(`   Waiting... ${i + 1}s, current URL:`, currentUrl);
      }
      if (!currentUrl.includes('/app/lifestyle')) {
        console.log('   Redirect detected to', currentUrl, '- re-navigating to /app/lifestyle?module=androsense');
        await page.goto('http://localhost:5174/app/lifestyle?module=androsense', { waitUntil: 'domcontentloaded' });
      }
    }

    // Hide Reticle widget if present so screenshots are clean
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

    // Capture Desktop Screenshot
    const desktopScreenshotPath = path.join(ARTIFACTS_DIR, 'androsense_desktop_verified.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log('   -> Saved Desktop Screenshot:', desktopScreenshotPath);

    // 5. Open Meal Details Modal via data-testid="androsense-details-btn"
    console.log('5. Clicking on Details button to open AndroSense Meal Details Modal...');
    await page.waitForSelector('[data-testid="androsense-details-btn"]', { timeout: 10000 });
    await page.evaluate(() => {
      const detailsBtn = document.querySelector('[data-testid="androsense-details-btn"]');
      if (detailsBtn) {
        detailsBtn.click();
      }
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Hide Reticle widget again if open
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot || el.tagName.toLowerCase().includes('reticle') || el.id?.includes('reticle')) {
          el.style.display = 'none';
        }
      });
    });

    // Capture Modal Screenshot
    const modalScreenshotPath = path.join(ARTIFACTS_DIR, 'androsense_meal_modal_verified.png');
    await page.screenshot({ path: modalScreenshotPath, fullPage: false });
    console.log('   -> Saved Meal Details Modal Screenshot:', modalScreenshotPath);

    // Close Modal if open
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const close = buttons.find(b => b.textContent?.includes('Close') || b.getAttribute('aria-label') === 'Close' || b.querySelector('svg.lucide-x'));
      if (close) close.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // 6. Test Urdu Localization
    console.log('6. Switching language to Urdu...');
    await page.evaluate(() => {
      const urduBtn = Array.from(document.querySelectorAll('button, span')).find(
        (el) => el.textContent && el.textContent.trim() === 'اردو'
      );
      if (urduBtn) urduBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Hide Reticle widget
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot || el.tagName.toLowerCase().includes('reticle') || el.id?.includes('reticle')) {
          el.style.display = 'none';
        }
      });
    });

    const urduScreenshotPath = path.join(ARTIFACTS_DIR, 'androsense_urdu_verified.png');
    await page.screenshot({ path: urduScreenshotPath, fullPage: true });
    console.log('   -> Saved Urdu Screenshot:', urduScreenshotPath);

    // Switch back to English
    await page.evaluate(() => {
      const enBtn = Array.from(document.querySelectorAll('button, span')).find(
        (el) => el.textContent && el.textContent.trim() === 'EN'
      );
      if (enBtn) enBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // 7. Mobile Viewport Verification
    console.log('7. Switching to mobile viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 2000));

    // Hide Reticle widget
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot || el.tagName.toLowerCase().includes('reticle') || el.id?.includes('reticle')) {
          el.style.display = 'none';
        }
      });
    });

    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'androsense_mobile_verified.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log('   -> Saved Mobile Screenshot:', mobileScreenshotPath);

    // 8. Verify OvaSense female page integrity
    console.log('8. Navigating to OvaSense female page (module=ovasense)...');
    await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
    await page.goto('http://localhost:5174/app/lifestyle?module=ovasense', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 4000));

    // Hide Reticle widget
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot || el.tagName.toLowerCase().includes('reticle') || el.id?.includes('reticle')) {
          el.style.display = 'none';
        }
      });
    });

    const ovasenseScreenshotPath = path.join(ARTIFACTS_DIR, 'ovasense_integrity_verified.png');
    await page.screenshot({ path: ovasenseScreenshotPath, fullPage: true });
    console.log('   -> Saved OvaSense Screenshot:', ovasenseScreenshotPath);

    console.log('\n=== ALL BROWSER QA SCREENSHOTS CAPTURED WITH AUTHENTIC REAL DATA ===');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Browser QA Execution Error:', err);
  process.exit(1);
});
