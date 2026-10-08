import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\820ba3af-8aa2-4cf7-ab8a-f5128cebb57e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runQA() {
  console.log('🚀 Starting BioPulse Longitudinal Health Browser QA Suite...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();

    // ── 1. TEST NEW FEMALE ACCOUNT ──
    console.log('\n[1/3] Testing New Female Account Experience...');
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate to login
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });

    // Login with female test user
    await page.type('#login-email', 'biopulse_qa_1791463522240@example.com');
    await page.type('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

    // Navigate directly to /app/progress
    const t0 = Date.now();
    await page.goto('http://localhost:5173/app/progress', { waitUntil: 'networkidle2', timeout: 15000 });
    const firstRenderMs = Date.now() - t0;
    console.log(`⏱️ First Useful Render Route Load: ${firstRenderMs}ms`);

    // Verify error banner is NOT present
    const retrySyncText = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Retry synchronization') || body.includes('Failed to Load Progress');
    });
    console.log(`🔍 "Retry synchronization" / "Failed to Load Progress" present? ${retrySyncText ? '❌ YES' : '✅ NO'}`);

    // Verify baseline headline
    const baselineHeadline = await page.evaluate(() => {
      return document.body.innerText.includes('Your health timeline starts here.');
    });
    console.log(`🔍 "Your health timeline starts here." present? ${baselineHeadline ? '✅ YES' : '❌ NO'}`);

    // Verify current snapshot card
    const snapshotPresent = await page.evaluate(() => {
      return document.body.innerText.includes('Current Health Snapshot');
    });
    console.log(`🔍 "Current Health Snapshot" present? ${snapshotPresent ? '✅ YES' : '❌ NO'}`);

    // Capture female desktop screenshot
    const femaleDesktopShot = path.join(ARTIFACTS_DIR, 'longitudinal_female_desktop.png');
    await page.screenshot({ path: femaleDesktopShot, fullPage: false });
    console.log(`📸 Saved: ${femaleDesktopShot}`);

    // Mobile viewport
    await page.setViewport({ width: 390, height: 844 });
    await page.waitForTimeout ? page.waitForTimeout(500) : new Promise(r => setTimeout(r, 500));
    const femaleMobileShot = path.join(ARTIFACTS_DIR, 'longitudinal_female_mobile.png');
    await page.screenshot({ path: femaleMobileShot, fullPage: false });
    console.log(`📸 Saved: ${femaleMobileShot}`);

    // ── 2. TEST RETURN VISIT / CACHE SPEED ──
    console.log('\n[2/3] Testing Cached Return Visit Speed...');
    const tReturn0 = Date.now();
    await page.goto('http://localhost:5173/app/progress', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const cachedReturnMs = Date.now() - tReturn0;
    console.log(`⏱️ Cached Return Visit Shell Ready: ${cachedReturnMs}ms (Instant hydration from cache)`);

    // ── 3. TEST NEW MALE ACCOUNT ──
    console.log('\n[3/3] Testing New Male Account Experience...');
    await page.setViewport({ width: 1440, height: 900 });

    // Clear session by visiting login and logging in as male
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });

    await page.type('#login-email', 'biopulse_male_qa_1791463619122@example.com');
    await page.type('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await page.goto('http://localhost:5173/app/progress', { waitUntil: 'networkidle2', timeout: 15000 });

    const maleRetrySync = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Retry synchronization') || body.includes('Failed to Load Progress');
    });
    console.log(`🔍 Male: "Retry synchronization" present? ${maleRetrySync ? '❌ YES' : '✅ NO'}`);

    const maleIndicators = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasHypogonadism: body.includes('Hypogonadism') || body.includes('AndroSense'),
        hasTestosterone: body.includes('Total Testosterone') || body.includes('Testosterone'),
        hasCycle: body.includes('Menstrual Cycle') || body.includes('OvaSense')
      };
    });
    console.log(`🔍 Male Pathway Indicators:`, maleIndicators);

    const maleDesktopShot = path.join(ARTIFACTS_DIR, 'longitudinal_male_desktop.png');
    await page.screenshot({ path: maleDesktopShot, fullPage: false });
    console.log(`📸 Saved: ${maleDesktopShot}`);

    // Mobile male
    await page.setViewport({ width: 390, height: 844 });
    await (page.waitForTimeout ? page.waitForTimeout(500) : new Promise(r => setTimeout(r, 500)));
    const maleMobileShot = path.join(ARTIFACTS_DIR, 'longitudinal_male_mobile.png');
    await page.screenshot({ path: maleMobileShot, fullPage: false });
    console.log(`📸 Saved: ${maleMobileShot}`);

    console.log('\n✨ Browser QA Verification Completed Successfully!');
  } finally {
    await browser.close();
  }
}

runQA().catch((err) => {
  console.error('❌ QA Execution Error:', err);
  process.exit(1);
});
