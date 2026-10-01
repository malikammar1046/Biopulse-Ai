/**
 * apps/web/src/tests/healthSummaryPdf.test.mjs
 *
 * Automated verification test suite for BioPulse AI Personal Health Summary PDF Download.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(thisDir, '..', '..');
const projectRoot = path.resolve(webRoot, '..', '..');

test('1. healthSummaryPdfService.ts satisfies architecture & security invariants', () => {
  const servicePath = path.join(webRoot, 'src', 'services', 'healthSummaryPdfService.ts');
  assert.ok(fs.existsSync(servicePath), 'healthSummaryPdfService.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf8');

  // Verify endpoint path
  assert.ok(
    content.includes('/v1/health/summary/pdf/'),
    'Must target /v1/health/summary/pdf/ endpoint'
  );

  // Verify authentication header usage
  assert.ok(
    content.includes('supabase.auth.getSession()') && content.includes('Bearer ${session.access_token}'),
    'Must use authenticated Supabase session access_token in Authorization header'
  );

  // Verify Content-Disposition parsing
  assert.ok(
    content.includes('Content-Disposition') && content.includes('filename'),
    'Must parse Content-Disposition header for filename'
  );

  // Verify Blob URL creation and cleanup
  assert.ok(
    content.includes('window.URL.createObjectURL') && content.includes('revokeObjectURL'),
    'Must create object URL and revoke it after download'
  );
});

test('2. AccountTab.tsx satisfies PDF download button and UX requirements', () => {
  const accountTabPath = path.join(webRoot, 'src', 'pages', 'app', 'settings', 'tabs', 'AccountTab.tsx');
  assert.ok(fs.existsSync(accountTabPath), 'AccountTab.tsx must exist');

  const content = fs.readFileSync(accountTabPath, 'utf8');

  // Verify clearly labeled PDF download button
  assert.ok(
    content.includes('Download Health Summary (PDF)'),
    'Must include clearly labeled "Download Health Summary (PDF)"'
  );

  // Verify loading state and duplicate request prevention
  assert.ok(
    content.includes('downloadPdfLoading') && content.includes('disabled={downloadPdfLoading}'),
    'Button must be disabled while downloading to prevent duplicate requests'
  );

  assert.ok(
    content.includes('Generating PDF...'),
    'Must show loading indicator while PDF is being generated'
  );

  // Verify error state
  assert.ok(
    content.includes('downloadPdfError') && content.includes('AlertTriangle'),
    'Must display clear error message if PDF generation fails'
  );

  // Verify existing JSON export remains available
  assert.ok(
    content.includes('Download Health JSON') && content.includes('Export Health Profile (JSON)'),
    'Must keep existing JSON export available as an optional alternative'
  );

  // Verify onboarding re-take remains available
  assert.ok(
    content.includes('Re-take Clinical Onboarding') && content.includes('Launch Onboarding Flow'),
    'Must keep onboarding restart button intact'
  );
});

test('3. Backend health urls and views integrate PDF export correctly', () => {
  const urlsPath = path.join(projectRoot, 'backend', 'apps', 'health', 'urls.py');
  assert.ok(fs.existsSync(urlsPath), 'backend health urls.py must exist');
  const urlsContent = fs.readFileSync(urlsPath, 'utf8');

  assert.ok(
    urlsContent.includes('HealthSummaryPdfExportView'),
    'health urls.py must import HealthSummaryPdfExportView'
  );
  assert.ok(
    urlsContent.includes('path("summary/pdf/", HealthSummaryPdfExportView.as_view(), name="health-summary-pdf")'),
    'health urls.py must define summary/pdf/ route'
  );

  const viewsPath = path.join(projectRoot, 'backend', 'apps', 'health', 'views.py');
  const viewsContent = fs.readFileSync(viewsPath, 'utf8');

  assert.ok(
    viewsContent.includes('class HealthSummaryPdfExportView'),
    'health views.py must implement HealthSummaryPdfExportView'
  );
  assert.ok(
    viewsContent.includes('SupabaseAuthentication') && viewsContent.includes('IsAuthenticated'),
    'HealthSummaryPdfExportView must require authentication'
  );
  assert.ok(
    viewsContent.includes('generate_user_health_pdf'),
    'HealthSummaryPdfExportView must call generate_user_health_pdf'
  );
});

test('4. PDF generator implements sections A through K with correct styling', () => {
  const genPath = path.join(projectRoot, 'backend', 'apps', 'health', 'services', 'health_pdf_generator.py');
  assert.ok(fs.existsSync(genPath), 'health_pdf_generator.py must exist');

  const content = fs.readFileSync(genPath, 'utf8');

  // Verify color palette
  assert.ok(content.includes('#16B8C4'), 'Must use BioPulse Teal #16B8C4');
  assert.ok(content.includes('#073B72'), 'Must use BioPulse Navy #073B72');
  assert.ok(content.includes('#55718F'), 'Must use Secondary Text #55718F');
  assert.ok(content.includes('#F5FBFD'), 'Must use Background #F5FBFD');

  // Verify sections A through K
  assert.ok(content.includes('_build_header_section'), 'Section A: Header & Report Info');
  assert.ok(content.includes('_build_profile_section'), 'Section B: Profile & Biometrics');
  assert.ok(content.includes('_build_assessment_section'), 'Section C: Latest Screening Assessment');
  assert.ok(content.includes('_build_shap_factors_section'), 'Section D: Top Factors & SHAP Explanations');
  assert.ok(content.includes('_build_symptoms_section'), 'Section E: Symptoms History');
  assert.ok(content.includes('_build_measurements_section'), 'Section F: BMI, Weight, Measurements');
  assert.ok(content.includes('_build_labs_section'), 'Section G: Laboratory Results & Medical Reports');
  assert.ok(content.includes('_build_medications_section'), 'Section H: Medications');
  assert.ok(content.includes('_build_appointments_section'), 'Section I: Appointments');
  assert.ok(content.includes('_build_progress_summary_section'), 'Section J: Health Progress Summary');
  assert.ok(content.includes('_build_disclaimer_section'), 'Section K: Medical Disclaimer');

  // Verify mandatory Medical Disclaimer wording
  assert.ok(
    content.includes('Medical Disclaimer:') &&
    content.includes('intended for informational and health-monitoring purposes only') &&
    content.includes('are not medical diagnoses'),
    'Must include the required exact Medical Disclaimer'
  );
});
