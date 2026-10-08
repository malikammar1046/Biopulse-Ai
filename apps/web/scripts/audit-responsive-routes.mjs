import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ARTIFACTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\820ba3af-8aa2-4cf7-ab8a-f5128cebb57e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUPABASE_URL = 'https://dqqrqwjeebecmgfsihtv.supabase.co';
const SUPABASE_ANON = 'sb_publishable_rZfbhMCOuoCGq4TVmjiEbA_wnlcutJP';

const TEST_VIEWPORTS = [
  { width: 320, height: 568, name: 'iPhone SE (320px)' },
  { width: 360, height: 800, name: 'Galaxy S20 (360px)' },
  { width: 390, height: 844, name: 'iPhone 14 (390px)' },
  { width: 430, height: 932, name: 'iPhone 14 Pro Max (430px)' },
  { width: 768, height: 1024, name: 'iPad Mini (768px)' },
  { width: 1024, height: 768, name: 'iPad Pro / Laptop (1024px)' },
  { width: 1440, height: 900, name: 'Desktop Monitor (1440px)' },
];

const SCREENSHOT_VIEWPORTS = [
  { width: 390, height: 844, suffix: 'mobile_390' },
  { width: 768, height: 1024, suffix: 'tablet_768' },
  { width: 1440, height: 900, suffix: 'desktop_1440' },
];

const PUBLIC_ROUTES = [
  '/',
  '/conditions',
  '/understand-pcos',
  '/understand-male-hypogonadism',
  '/care-circle',
  '/trust-privacy',
  '/about',
  '/how-it-works',
  '/features',
  '/doctors',
  '/contact',
  '/app-download',
  '/login',
  '/register',
  '/care-provider-portal',
];

const ONBOARDING_ROUTES = [
  '/onboarding',
  '/onboarding/female',
  '/onboarding/male',
  '/onboarding/general',
];

const AUTH_APP_ROUTES = [
  '/app/ovasense',
  '/app/androsense',
  '/app/vitasense',
  '/app/cycle',
  '/app/hub',
  '/app/chat',
  '/app/symptoms',
  '/app/lifestyle',
  '/app/fitness',
  '/app/reports',
  '/app/medications',
  '/app/care-circle',
  '/app/appointments',
  '/app/timeline',
  '/app/progress',
  '/app/assessment',
  '/app/settings',
];

const REPRESENTATIVE_SCREENSHOT_ROUTES = [
  { route: '/', name: 'home' },
  { route: '/login', name: 'login' },
  { route: '/understand-pcos', name: 'understand_pcos' },
  { route: '/app/ovasense', name: 'female_dashboard', auth: 'female' },
  { route: '/app/androsense', name: 'male_dashboard', auth: 'male' },
  { route: '/app/lifestyle', name: 'lifestyle_nutrition', auth: 'female' },
  { route: '/app/progress', name: 'longitudinal_health', auth: 'female' },
  { route: '/app/assessment', name: 'screening', auth: 'female' },
  { route: '/app/reports', name: 'reports', auth: 'female' },
  { route: '/app/appointments', name: 'appointments', auth: 'female' },
  { route: '/app/chat', name: 'ai_companion', auth: 'female' },
  { route: '/app/settings', name: 'settings', auth: 'female' },
];

async function authenticateSupabase(email, password) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Failed to authenticate ${email}: ${error?.message}`);
  }
  return data.session;
}

async function injectAuth(page, session, pathway = 'female') {
  await page.evaluate((sess, pway) => {
    localStorage.setItem('sb-dqqrqwjeebecmgfsihtv-auth-token', JSON.stringify(sess));
    const mockProfile = {
      id: sess.user.id,
      email: sess.user.email,
      fullName: pway === 'female' ? 'Sarah Jenkins' : 'Marcus Vance',
      pathway: pway,
      gender: pway,
      isOnboarded: true,
      onboardingCompleted: true,
      lifestyle: {
        sleepHours: 7.5,
        activityLevel: 'moderate',
        stressLevel: 'medium',
      },
      assessmentSummary: {
        lastAssessmentDate: new Date().toISOString(),
        tier: 'tier_1',
      },
    };
    localStorage.setItem('ovasense_user_profile_v1', JSON.stringify(mockProfile));
  }, session, pathway);
}

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const doc = document.documentElement;
    const scrollWidth = doc.scrollWidth;
    const clientWidth = doc.clientWidth;
    const overflows = scrollWidth > clientWidth + 1;

    let offendingElements = [];
    if (overflows) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const cls = (el.className || '').toString();
        if (cls.includes('reticle')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.right > clientWidth + 2) {
          offendingElements.push({
            tag: el.tagName,
            id: el.id,
            className: cls.slice(0, 100),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            clientWidth,
          });
        }
      }
    }

    return {
      scrollWidth,
      clientWidth,
      overflows,
      offendingCount: offendingElements.length,
      sampleOffenders: offendingElements.slice(0, 4),
    };
  });
}

async function safeNavigate(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 600));
}

async function main() {
  console.log('🚀 Launching Full 36-Route Responsive & Adaptive Audit...');

  console.log('🔑 Authenticating QA users with Supabase...');
  const femaleSession = await authenticateSupabase('qa.test.female@biopulse.health', 'TestPassword123!');
  const maleSession = await authenticateSupabase('qa.test.male@biopulse.health', 'TestPassword123!');
  console.log('✅ Authenticated both female and male sessions successfully.');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  const overflowIssues = [];
  const auditedRoutes = new Set();

  // 1. Audit Public Routes
  console.log('\n--- AUDITING PUBLIC ROUTES ---');
  for (const route of PUBLIC_ROUTES) {
    auditedRoutes.add(route);
    console.log(`\n📄 Public Route: ${route}`);
    for (const vp of TEST_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      try {
        await safeNavigate(page, `http://localhost:5173${route}`);
        const metrics = await checkOverflow(page);
        if (metrics.overflows) {
          console.log(`  ❌ [${vp.name}] OVERFLOW: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`);
          overflowIssues.push({ route, vp: vp.name, metrics });
        } else {
          console.log(`  ✅ [${vp.name}] OK (${metrics.scrollWidth} == ${metrics.clientWidth})`);
        }
      } catch (e) {
        console.error(`  ⚠️ [${vp.name}] Error: ${e.message}`);
      }
    }
  }

  // 2. Audit Onboarding Routes
  console.log('\n--- AUDITING ONBOARDING ROUTES ---');
  for (const route of ONBOARDING_ROUTES) {
    auditedRoutes.add(route);
    console.log(`\n📄 Onboarding Route: ${route}`);
    for (const vp of TEST_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      try {
        await safeNavigate(page, `http://localhost:5173${route}`);
        const metrics = await checkOverflow(page);
        if (metrics.overflows) {
          console.log(`  ❌ [${vp.name}] OVERFLOW: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`);
          overflowIssues.push({ route, vp: vp.name, metrics });
        } else {
          console.log(`  ✅ [${vp.name}] OK (${metrics.scrollWidth} == ${metrics.clientWidth})`);
        }
      } catch (e) {
        console.error(`  ⚠️ [${vp.name}] Error: ${e.message}`);
      }
    }
  }

  // 3. Audit Authenticated App Routes (Female Pathway)
  console.log('\n--- AUDITING AUTHENTICATED APP ROUTES (FEMALE) ---');
  await safeNavigate(page, 'http://localhost:5173/login');
  await injectAuth(page, femaleSession, 'female');

  for (const route of AUTH_APP_ROUTES) {
    auditedRoutes.add(route);
    console.log(`\n📄 Auth Route (Female): ${route}`);
    for (const vp of TEST_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      try {
        await safeNavigate(page, `http://localhost:5173${route}`);
        const metrics = await checkOverflow(page);
        if (metrics.overflows) {
          console.log(`  ❌ [${vp.name}] OVERFLOW: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`);
          overflowIssues.push({ route, vp: vp.name, metrics });
        } else {
          console.log(`  ✅ [${vp.name}] OK (${metrics.scrollWidth} == ${metrics.clientWidth})`);
        }
      } catch (e) {
        console.error(`  ⚠️ [${vp.name}] Error: ${e.message}`);
      }
    }
  }

  // 4. Audit Authenticated App Routes (Male Pathway specifically for /app/androsense, /app/hub, etc.)
  console.log('\n--- AUDITING AUTHENTICATED APP ROUTES (MALE) ---');
  await injectAuth(page, maleSession, 'male');
  for (const route of ['/app/androsense', '/app/hub', '/app/lifestyle', '/app/progress']) {
    console.log(`\n📄 Auth Route (Male): ${route}`);
    for (const vp of [TEST_VIEWPORTS[0], TEST_VIEWPORTS[2], TEST_VIEWPORTS[4], TEST_VIEWPORTS[6]]) {
      await page.setViewport({ width: vp.width, height: vp.height });
      try {
        await safeNavigate(page, `http://localhost:5173${route}`);
        const metrics = await checkOverflow(page);
        if (metrics.overflows) {
          console.log(`  ❌ [${vp.name}] OVERFLOW: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`);
          overflowIssues.push({ route: `${route} (male)`, vp: vp.name, metrics });
        } else {
          console.log(`  ✅ [${vp.name}] OK (${metrics.scrollWidth} == ${metrics.clientWidth})`);
        }
      } catch (e) {
        console.error(`  ⚠️ [${vp.name}] Error: ${e.message}`);
      }
    }
  }

  // 5. Capture Representative Screenshots across Mobile, Tablet, Desktop
  console.log('\n--- CAPTURING REPRESENTATIVE SCREENSHOTS ---');
  const capturedScreenshots = [];

  for (const item of REPRESENTATIVE_SCREENSHOT_ROUTES) {
    console.log(`\n📸 Capturing Screenshots for: ${item.name} (${item.route})`);
    for (const vp of SCREENSHOT_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      if (item.auth) {
        const sess = item.auth === 'male' ? maleSession : femaleSession;
        await injectAuth(page, sess, item.auth);
      } else {
        await page.evaluate(() => {
          localStorage.removeItem('sb-dqqrqwjeebecmgfsihtv-auth-token');
          localStorage.removeItem('ovasense_user_profile_v1');
        });
      }

      try {
        await safeNavigate(page, `http://localhost:5173${item.route}`);
        const filename = `${item.name}_${vp.suffix}.png`;
        const filePath = path.join(ARTIFACTS_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`  📷 Saved screenshot: ${filename}`);
        capturedScreenshots.push({ name: item.name, route: item.route, viewport: vp.suffix, file: filePath });
      } catch (e) {
        console.error(`  ⚠️ Failed to capture screenshot ${item.name} (${vp.suffix}): ${e.message}`);
      }
    }
  }

  await browser.close();

  const report = {
    totalAuditedRoutes: auditedRoutes.size,
    auditedRoutesList: Array.from(auditedRoutes),
    testedViewports: TEST_VIEWPORTS.map((v) => v.name),
    overflowIssuesCount: overflowIssues.length,
    overflowIssues,
    capturedScreenshots,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'comprehensive_responsive_audit.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n==================================================');
  console.log(`🎉 AUDIT COMPLETE!`);
  console.log(`Total Routes Audited: ${auditedRoutes.size}`);
  console.log(`Overflow Issues Found: ${overflowIssues.length}`);
  console.log(`Screenshots Captured: ${capturedScreenshots.length}`);
  console.log('==================================================\n');
}

main().catch(console.error);
