import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const servicesDir = __dirname;

test('Step 2 Service Layer: Architecture and Required Services Presence', () => {
  const expectedServices = [
    'api.ts',
    'authService.ts',
    'profileService.ts',
    'trackingService.ts',
    'assessmentService.ts',
    'medicationService.ts',
    'appointmentService.ts',
    'careCircleService.ts',
    'reportService.ts',
    'ocrService.ts',
    'nutritionService.ts',
    'companionService.ts',
    'notificationService.ts',
    'index.ts',
  ];

  for (const file of expectedServices) {
    const filePath = path.join(servicesDir, file);
    assert.ok(fs.existsSync(filePath), `Service file must exist: ${file}`);
  }
});

test('Step 2 Service Layer: Central Index Exports All Required Services', () => {
  const indexPath = path.join(servicesDir, 'index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  const requiredExports = [
    'api',
    'authService',
    'profileService',
    'trackingService',
    'assessmentService',
    'medicationService',
    'appointmentService',
    'careCircleService',
    'reportService',
    'ocrService',
    'nutritionService',
    'companionService',
    'notificationService',
  ];

  for (const exp of requiredExports) {
    assert.ok(
      indexContent.includes(`export * from './${exp}'`),
      `index.ts must export ${exp}`
    );
  }
});

test('Step 2 Legacy Isolation: Strictly prohibits legacy food_logs and pcos_assessments_legacy', () => {
  const nutritionPath = path.join(servicesDir, 'nutritionService.ts');
  const nutritionContent = fs.readFileSync(nutritionPath, 'utf-8');

  // Must use nutrition_food_logs
  assert.ok(
    nutritionContent.includes('nutrition_food_logs'),
    'nutritionService must target nutrition_food_logs table'
  );
  // Must NOT use standalone legacy 'food_logs'
  const legacyFoodLogsMatch = nutritionContent.match(/\.from\(['"]food_logs['"]\)/);
  assert.strictEqual(
    legacyFoodLogsMatch,
    null,
    'nutritionService must NEVER target legacy food_logs'
  );

  // Assessment service must use authoritative screening_assessments
  const assessmentPath = path.join(servicesDir, 'assessmentService.ts');
  const assessmentContent = fs.readFileSync(assessmentPath, 'utf-8');
  assert.ok(
    assessmentContent.includes('screening_assessments'),
    'assessmentService must use screening_assessments'
  );
  const legacyAssessmentMatch = assessmentContent.match(/\.from\(['"]pcos_assessments_legacy['"]\)/);
  assert.strictEqual(
    legacyAssessmentMatch,
    null,
    'assessmentService must NEVER target legacy pcos_assessments_legacy'
  );
});

test('Step 2 Django API Integrations: Verified endpoints and contracts', () => {
  // Appointment service -> Django doctor directory
  const appointmentContent = fs.readFileSync(path.join(servicesDir, 'appointmentService.ts'), 'utf-8');
  assert.ok(
    appointmentContent.includes('/v1/doctors/'),
    'appointmentService must connect to Django /v1/doctors/'
  );

  // Nutrition service -> Django nutrition endpoints
  const nutritionContent = fs.readFileSync(path.join(servicesDir, 'nutritionService.ts'), 'utf-8');
  assert.ok(
    nutritionContent.includes('/v1/health/nutrition/'),
    'nutritionService must connect to Django /v1/health/nutrition/'
  );
  assert.ok(
    nutritionContent.includes('swap-meal'),
    'nutritionService must connect to swap-meal endpoint'
  );
  assert.ok(
    nutritionContent.includes('regenerate-day'),
    'nutritionService must connect to regenerate-day endpoint'
  );

  // OCR service -> Django OCR endpoint
  const ocrContent = fs.readFileSync(path.join(servicesDir, 'ocrService.ts'), 'utf-8');
  assert.ok(
    ocrContent.includes('/api/v1/health/ocr/'),
    'ocrService must connect to Django /api/v1/health/ocr/'
  );

  // Companion service -> Django companion chat endpoint
  const companionContent = fs.readFileSync(path.join(servicesDir, 'companionService.ts'), 'utf-8');
  assert.ok(
    companionContent.includes('/api/v1/intelligence/companion/chat/'),
    'companionService must connect to Django /api/v1/intelligence/companion/chat/'
  );
  assert.ok(
    companionContent.includes('/api/v1/intelligence/companion/health/'),
    'companionService must connect to Django /api/v1/intelligence/companion/health/'
  );
});

test('Step 2 Security & User Ownership: Services scope queries to authenticated session token', () => {
  const secureServices = [
    'profileService.ts',
    'trackingService.ts',
    'medicationService.ts',
    'careCircleService.ts',
    'notificationService.ts',
  ];

  for (const svc of secureServices) {
    const content = fs.readFileSync(path.join(servicesDir, svc), 'utf-8');
    assert.ok(
      content.includes('getSupabaseHeaders(token)'),
      `${svc} must authenticate requests using getSupabaseHeaders(token)`
    );
    assert.ok(
      content.includes('userId'),
      `${svc} must scope operations to authenticated userId`
    );
  }
});

test('Step 2 Error Normalization: Predictable errors and HTTP codes in api.ts', () => {
  const apiContent = fs.readFileSync(path.join(servicesDir, 'api.ts'), 'utf-8');
  assert.ok(apiContent.includes('BioPulseApiError'), 'api.ts must define BioPulseApiError');
  assert.ok(apiContent.includes('ApiResponse<T>'), 'api.ts must define generic ApiResponse<T>');
  assert.ok(apiContent.includes('normalizeResponse'), 'api.ts must define normalizeResponse');
  assert.ok(apiContent.includes('safeRequest'), 'api.ts must define safeRequest');
  assert.ok(apiContent.includes('401'), 'api.ts must handle 401');
  assert.ok(apiContent.includes('403'), 'api.ts must handle 403');
  assert.ok(apiContent.includes('404'), 'api.ts must handle 404');
  assert.ok(apiContent.includes('422'), 'api.ts must handle 422');
  assert.ok(apiContent.includes('500'), 'api.ts must handle 500');
});

test('Step 2 Preserved Assessment Architecture: Multi-tier screening, SHAP, and thresholds', () => {
  const assessmentContent = fs.readFileSync(path.join(servicesDir, 'assessmentService.ts'), 'utf-8');
  assert.ok(
    assessmentContent.includes('submitFemaleTier1Assessment'),
    'assessmentService must preserve submitFemaleTier1Assessment'
  );
  assert.ok(
    assessmentContent.includes('submitMaleTier1Assessment'),
    'assessmentService must preserve submitMaleTier1Assessment'
  );
  assert.ok(
    assessmentContent.includes('resolveRiskBand'),
    'assessmentService must preserve resolveRiskBand'
  );
  assert.ok(
    assessmentContent.includes('ShapFactor'),
    'assessmentService must preserve ShapFactor'
  );
  assert.ok(
    assessmentContent.includes('threshold'),
    'assessmentService must preserve risk threshold calibration'
  );
  assert.ok(
    assessmentContent.includes('screening_assessments'),
    'assessmentService must query screening_assessments'
  );
});

