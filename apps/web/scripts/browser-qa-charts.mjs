import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\820ba3af-8aa2-4cf7-ab8a-f5128cebb57e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runChartsQA() {
  console.log('🚀 Running Multi-Record and Chart Visualization Browser Capture...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Login with existing female test user
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.type('#login-email', 'biopulse_qa_1791463522240@example.com');
    await page.type('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

    // Inject a multi-record longitudinal payload into sessionStorage cache
    await page.goto('http://localhost:5173/app/progress', { waitUntil: 'networkidle2', timeout: 15000 });

    await page.evaluate(() => {
      const multiRecordPayload = {
        pathway: 'female',
        module_name: 'female_pcos',
        monitoring_period: '90d',
        tracking_period_display: 'Last 90 Days',
        total_assessments_recorded: 3,
        has_single_assessment_baseline: false,
        has_no_assessments: false,
        current_summary: {
          assessment_id: 'asm_003',
          created_at: '2026-10-08T10:00:00Z',
          screening_probability_percent: 21,
          risk_category: 'low_risk',
          risk_label: 'Low Likelihood',
          tier_code: 'tier_2',
          tier_label: 'Biochemical Confirmed',
          last_assessed_display: 'Today',
          key_metrics: {
            bmi: 24.3,
            weight_kg: 62.0
          }
        },
        screening_history: [
          {
            assessment_id: 'asm_001',
            created_at: '2026-08-10T10:00:00Z',
            observed_at: '2026-08-10T10:00:00Z',
            probability_percent: 32,
            risk_category: 'moderate_risk',
            risk_label: 'Moderate Likelihood',
            tier_code: 'tier_1',
            tier_label: 'Questionnaire'
          },
          {
            assessment_id: 'asm_002',
            created_at: '2026-09-12T10:00:00Z',
            observed_at: '2026-09-12T10:00:00Z',
            probability_percent: 26,
            risk_category: 'moderate_risk',
            risk_label: 'Moderate Likelihood',
            tier_code: 'tier_2',
            tier_label: 'Biochemical'
          },
          {
            assessment_id: 'asm_003',
            created_at: '2026-10-08T10:00:00Z',
            observed_at: '2026-10-08T10:00:00Z',
            probability_percent: 21,
            risk_category: 'low_risk',
            risk_label: 'Low Likelihood',
            tier_code: 'tier_2',
            tier_label: 'Biochemical Confirmed'
          }
        ],
        metric_series: {
          bmi: {
            metric_key: 'bmi',
            label: 'Body Mass Index (BMI)',
            unit: 'kg/m²',
            is_graphable: true,
            data_points: [
              { timestamp: '2026-08-10T10:00:00Z', observed_at: '2026-08-10T10:00:00Z', value: 24.8, source: 'profile_measurement', is_verified: true },
              { timestamp: '2026-09-12T10:00:00Z', observed_at: '2026-09-12T10:00:00Z', value: 24.5, source: 'profile_measurement', is_verified: true },
              { timestamp: '2026-10-08T10:00:00Z', observed_at: '2026-10-08T10:00:00Z', value: 24.3, source: 'profile_measurement', is_verified: true }
            ]
          },
          weight_kg: {
            metric_key: 'weight_kg',
            label: 'Body Weight',
            unit: 'kg',
            is_graphable: true,
            data_points: [
              { timestamp: '2026-08-10T10:00:00Z', observed_at: '2026-08-10T10:00:00Z', value: 63.5, source: 'vitals_record', is_verified: true },
              { timestamp: '2026-09-12T10:00:00Z', observed_at: '2026-09-12T10:00:00Z', value: 62.8, source: 'vitals_record', is_verified: true },
              { timestamp: '2026-10-08T10:00:00Z', observed_at: '2026-10-08T10:00:00Z', value: 62.0, source: 'vitals_record', is_verified: true }
            ]
          }
        },
        current_vs_previous: [
          {
            factor_key: 'bmi',
            label: 'Body Mass Index',
            category: 'biometric',
            current_value: 24.3,
            previous_value: 24.5,
            unit: 'kg/m²',
            delta_display: '-0.2 kg/m²',
            direction: 'decreased',
            is_changed: true,
            explanation: 'Changed from 24.5 to 24.3 kg/m² since previous assessment.'
          }
        ],
        important_changes: [
          {
            title: 'Decreased Screening Probability',
            description: 'Screening probability decreased by 5.0% since previous assessment (from 26.0% to 21.0%).',
            type: 'screening_change',
            direction: 'decreased',
            severity: 'positive',
            significance: 'clinically_meaningful'
          }
        ],
        timeline_events: [
          {
            id: 'evt_3',
            event_type: 'screening_assessment',
            title: 'Tier 2 Confirmatory Assessment Completed',
            date: '2026-10-08T10:00:00Z',
            summary: 'Calculated 21% likelihood with biochemical evidence.'
          },
          {
            id: 'evt_2',
            event_type: 'verified_lab_report',
            title: 'Diagnostic Ultrasound and Metabolic Panel',
            date: '2026-09-12T10:00:00Z',
            summary: 'Metabolic markers within normal physiological parameters.'
          },
          {
            id: 'evt_1',
            event_type: 'screening_assessment',
            title: 'Initial Screening Questionnaire Completed',
            date: '2026-08-10T10:00:00Z',
            summary: 'Baseline 32% established.'
          }
        ]
      };

      // Find user id from localStorage or context
      const prof = JSON.parse(localStorage.getItem('ovasense_user_profile_v1') || '{}');
      const userId = prof.id || 'usr_demo';
      const cacheKey = `biopulse_longitudinal_90d_female_pcos_${userId}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: multiRecordPayload, timestamp: Date.now() }));
      window.dispatchEvent(new CustomEvent('biopulse:longitudinal-refresh'));
    });

    // Wait a brief moment for state to re-render
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(r => setTimeout(r, 1000)));

    const chartsDesktopShot = path.join(ARTIFACTS_DIR, 'longitudinal_charts_desktop.png');
    await page.screenshot({ path: chartsDesktopShot, fullPage: false });
    console.log(`📸 Saved: ${chartsDesktopShot}`);

    // Verify SVG chart elements exist in DOM
    const chartRendered = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      return svgs.length >= 2;
    });
    console.log(`🔍 SVG Clinical charts rendered? ${chartRendered ? '✅ YES' : '❌ NO'}`);

    console.log('\n✨ Chart Visualization QA Finished!');
  } finally {
    await browser.close();
  }
}

runChartsQA().catch(console.error);
