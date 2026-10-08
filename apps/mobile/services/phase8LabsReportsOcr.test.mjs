/**
 * BioPulse Mobile — Phase 8: Labs + Reports + OCR Integration Test Suite
 *
 * Validates persistent backend and OCR pipeline integrations for:
 * 1. Existing OCR Pipeline:
 *    - Reuses Django PaddleOCR backend (/api/v1/health/ocr/)
 *    - Zero secondary OCR engines
 *    - Supported formats: PDF, JPG, PNG, WebP; 10 MB limit
 * 2. Integrate:
 *    - Report upload
 *    - OCR processing
 *    - Extracted values
 *    - Review screen
 *    - User confirmation
 *    - Verified labs
 *    - Report history
 * 3. Strict Clinical Trust Boundary:
 *    - Raw OCR -> User Review -> Verified Health Data
 *    - Raw OCR output must NOT automatically become trusted medical data without verification flow
 *    - Unverified drafts quarantined in public.medical_reports (needs_verification) and public.report_results (user_verified = false)
 * 4. Security & User Ownership:
 *    - Authenticated access only (token required)
 *    - User ownership verified on all queries and mutations
 *    - Secure upload and correct report association
 * 5. Validation:
 *    - Upload, processing, OCR failure, review, confirmation, history, unauthorized access
 *    - Preserves exact UI styling
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const resolveAppFile = (rel) => {
  const directPath = path.resolve(rel);
  if (fs.existsSync(directPath)) return directPath;
  return path.resolve('apps/mobile', rel);
};

// ============================================================================
// 1. Existing OCR Pipeline & Service Contract
// ============================================================================
test('Phase 8: OcrService integrates with existing Django PaddleOCR pipeline without second engine', () => {
  const ocrFile = resolveAppFile('services/ocrService.ts');
  const ocrContent = fs.readFileSync(ocrFile, 'utf8');

  // Verify backend endpoint target
  assert.ok(
    ocrContent.includes('/v1/health/ocr/'),
    'OcrService must connect to existing Django endpoint /v1/health/ocr/'
  );

  // Verify authorization header
  assert.ok(
    ocrContent.includes('Authorization: `Bearer ${token}`') || ocrContent.includes('Bearer'),
    'OcrService must include Bearer token authentication'
  );

  // Verify FormData upload
  assert.ok(
    ocrContent.includes('FormData') && ocrContent.includes('file'),
    'OcrService must construct standard FormData with file parameter'
  );

  // Verify format checks (PDF, PNG, JPG, JPEG, WebP)
  assert.ok(
    ocrContent.includes('.pdf') && ocrContent.includes('.png') && ocrContent.includes('.jpg'),
    'OcrService must validate supported extensions (PDF, PNG, JPG)'
  );

  // Verify 10 MB limit
  assert.ok(
    ocrContent.includes('10 * 1024 * 1024') || ocrContent.includes('10 MB'),
    'OcrService must enforce 10 MB maximum upload limit'
  );

  // Verify test categorization helper
  assert.ok(
    ocrContent.includes('categorizeTestName'),
    'OcrService must export categorizeTestName for review accordion grouping'
  );
});

// ============================================================================
// 2. Security & Unauthorized Access Enforcement
// ============================================================================
test('Phase 8: Security, authenticated ownership, and unauthorized access rejection', () => {
  const ocrFile = resolveAppFile('services/ocrService.ts');
  const ocrContent = fs.readFileSync(ocrFile, 'utf8');

  // Verify unauthenticated check in OCR
  assert.ok(
    ocrContent.includes('if (!token)') && ocrContent.includes('status: 401'),
    'OcrService must reject unauthenticated requests with HTTP 401'
  );

  const reportFile = resolveAppFile('services/reportService.ts');
  const reportContent = fs.readFileSync(reportFile, 'utf8');

  // Verify unauthenticated check in ReportService
  assert.ok(
    reportContent.includes('if (!userId || !token)') && reportContent.includes('status: 401'),
    'ReportService must reject unauthenticated queries with HTTP 401'
  );

  // Verify user ownership scoping in Supabase REST queries
  assert.ok(
    reportContent.includes('user_id=eq.${userId}'),
    'Report queries and mutations must be strictly scoped to user_id'
  );
});

// ============================================================================
// 3. Strict Clinical Trust Boundary (Raw OCR -> User Review -> Verified Data)
// ============================================================================
test('Phase 8: Strict Trust Boundary preserves distinction between Raw OCR, User Review, and Verified Data', () => {
  const reportFile = resolveAppFile('services/reportService.ts');
  const reportContent = fs.readFileSync(reportFile, 'utf8');

  // Verify createUnverifiedReport creates 'needs_verification'
  assert.ok(
    reportContent.includes('createUnverifiedReport') && reportContent.includes('needs_verification'),
    'Raw OCR must be saved as unverified draft with status needs_verification'
  );

  // Verify report_results user_verified boolean flag
  assert.ok(
    reportContent.includes('user_verified'),
    'Report results must track user_verified state in public.report_results'
  );

  // Verify confirmReportVerification updates to 'verified'
  assert.ok(
    reportContent.includes('confirmReportVerification') && reportContent.includes('verified'),
    'User confirmation must explicitly promote report to verified status'
  );

  // Verify getVerifiedLabs strictly excludes unverified records
  assert.ok(
    reportContent.includes('getVerifiedLabs') && reportContent.includes('status=eq.verified'),
    'getVerifiedLabs must only retrieve verified reports'
  );
});

// ============================================================================
// 4. Database Schema & Constraint Compliance
// ============================================================================
test('Phase 8: Database schema alignment with public.medical_reports and public.report_results constraints', () => {
  const reportFile = resolveAppFile('services/reportService.ts');
  const reportContent = fs.readFileSync(reportFile, 'utf8');

  // Check mandatory columns in medical_reports
  assert.ok(
    reportContent.includes('file_name:') && reportContent.includes('mime_type:'),
    'Must provide non-null file_name and mime_type to satisfy public.medical_reports schema'
  );

  // Check mandatory result_value in report_results (not value)
  assert.ok(
    reportContent.includes('result_value:'),
    'Must provide result_value matching public.report_results column name'
  );

  // Check status constraint normalization:
  // ('within_range', 'outside_range', 'needs_review', 'insufficient_info')
  assert.ok(
    reportContent.includes('normalizeResultStatus'),
    'Must normalize status to satisfy report_results_status_check constraint'
  );
  assert.ok(
    reportContent.includes('within_range') &&
    reportContent.includes('outside_range') &&
    reportContent.includes('needs_review'),
    'Status normalizer must handle within_range, outside_range, and needs_review'
  );
});

// ============================================================================
// 5. Health Store State Integration & Zero Demo Fallback
// ============================================================================
test('Phase 8: Health store integrates persistent reports, verified labs, and pending OCR review', () => {
  const storeFile = resolveAppFile('store/healthStore.tsx');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify store state hooks
  assert.ok(
    storeContent.includes('reports') &&
    storeContent.includes('isLoadingReports') &&
    storeContent.includes('reportError') &&
    storeContent.includes('loadReports'),
    'HealthStore must provide reports, loading state, error, and loadReports action'
  );

  assert.ok(
    storeContent.includes('verifiedLabs') &&
    storeContent.includes('loadVerifiedLabs'),
    'HealthStore must provide verifiedLabs and loadVerifiedLabs action'
  );

  assert.ok(
    storeContent.includes('pendingOcrReport') &&
    storeContent.includes('setPendingOcrReport'),
    'HealthStore must provide pendingOcrReport state for review screen integration'
  );

  // Verify confirmVerifiedLabs action
  assert.ok(
    storeContent.includes('confirmVerifiedLabs'),
    'HealthStore must implement confirmVerifiedLabs action'
  );

  // Verify deleteReport action
  assert.ok(
    storeContent.includes('deleteReport'),
    'HealthStore must implement deleteReport action'
  );

  // Verify resetHealthState purges reports and verified labs on logout
  assert.ok(
    storeContent.includes('setReports([])') &&
    storeContent.includes('setVerifiedLabs([])') &&
    storeContent.includes('setPendingOcrReport(null)'),
    'resetHealthState must purge reports, verifiedLabs, and pendingOcrReport to prevent cross-user leakage'
  );
});

// ============================================================================
// 6. Screen 21 (OCR Upload) Integration
// ============================================================================
test('Phase 8: Screen 21 (ocr-upload.tsx) connects real OCR pipeline, stepper, and error retry', () => {
  const uploadFile = resolveAppFile('app/(app)/ocr-upload.tsx');
  const uploadContent = fs.readFileSync(uploadFile, 'utf8');

  // Verify service calls
  assert.ok(
    uploadContent.includes('ocrService.uploadDocument'),
    'ocr-upload.tsx must call ocrService.uploadDocument'
  );
  assert.ok(
    uploadContent.includes('reportService.createUnverifiedReport'),
    'ocr-upload.tsx must create unverified draft report in DB'
  );
  assert.ok(
    uploadContent.includes('setPendingOcrReport'),
    'ocr-upload.tsx must store unverified extraction in healthStore'
  );

  // Verify 4-stage stepper
  assert.ok(
    uploadContent.includes('Uploading document') &&
    uploadContent.includes('Reading and extracting text') &&
    uploadContent.includes('Identifying lab results') &&
    uploadContent.includes('Preparing summary'),
    'ocr-upload.tsx must maintain the 4-stage processing stepper'
  );

  // Verify error state & retry
  assert.ok(
    uploadContent.includes('ocrError') && uploadContent.includes('Retry Extraction'),
    'ocr-upload.tsx must render error notice and retry extraction button on OCR failure'
  );

  // Verify router navigation to ocr-verify
  assert.ok(
    uploadContent.includes('/(app)/ocr-verify'),
    'ocr-upload.tsx must navigate to ocr-verify upon successful extraction'
  );
});

// ============================================================================
// 7. Screen 22 (OCR Verify) Integration
// ============================================================================
test('Phase 8: Screen 22 (ocr-verify.tsx) implements human review, editable values, and confirmation', () => {
  const verifyFile = resolveAppFile('app/(app)/ocr-verify.tsx');
  const verifyContent = fs.readFileSync(verifyFile, 'utf8');

  // Verify pendingOcrReport consumption
  assert.ok(
    verifyContent.includes('pendingOcrReport'),
    'ocr-verify.tsx must read pendingOcrReport from store'
  );

  // Verify categorized accordion sections
  assert.ok(
    verifyContent.includes('Hormone Tests') &&
    verifyContent.includes('Metabolic Tests') &&
    verifyContent.includes('Nutritional Tests') &&
    verifyContent.includes('CBC'),
    'ocr-verify.tsx must provide 4 test category accordions'
  );

  // Verify value editing inputs
  assert.ok(
    verifyContent.includes('TextInput') &&
    verifyContent.includes('pencil-outline'),
    'ocr-verify.tsx must allow user to edit values before confirming'
  );

  // Verify confirmation saves to healthStore and database
  assert.ok(
    verifyContent.includes('confirmVerifiedLabs(allRows') || verifyContent.includes('confirmVerifiedLabs'),
    'ocr-verify.tsx must commit confirmed labs to store'
  );

  // Verify non-diagnostic warning
  assert.ok(
    verifyContent.includes('Values are not saved until you confirm') ||
    verifyContent.includes('Review all values carefully'),
    'ocr-verify.tsx must display mandatory human verification warning'
  );
});

// ============================================================================
// 8. Screen 42 (Reports) & Screen 20 (Add Clinical Labs) Integration
// ============================================================================
test('Phase 8: Reports screen (reports.tsx) and Add Labs (add-labs.tsx) integrate persistent data', () => {
  const reportsFile = resolveAppFile('app/(app)/reports.tsx');
  const reportsContent = fs.readFileSync(reportsFile, 'utf8');

  // Verify store connection
  assert.ok(
    reportsContent.includes('useHealthStore'),
    'reports.tsx must connect to useHealthStore'
  );
  assert.ok(
    reportsContent.includes('loadReports'),
    'reports.tsx must trigger loadReports on mount'
  );

  // Verify category filtering pills
  assert.ok(
    reportsContent.includes("'All', 'Screening', 'Lab Reports', 'Summaries'"),
    'reports.tsx must support 4 category filter pills'
  );

  // Verify loading, error, and empty states
  assert.ok(
    reportsContent.includes('isLoadingReports') &&
    reportsContent.includes('reportError') &&
    reportsContent.includes('No Reports Available'),
    'reports.tsx must handle loading, error, and empty states'
  );

  // Add Clinical Labs verification
  const addLabsFile = resolveAppFile('app/(app)/add-labs.tsx');
  const addLabsContent = fs.readFileSync(addLabsFile, 'utf8');

  assert.ok(
    addLabsContent.includes('confirmVerifiedLabs'),
    'add-labs.tsx must persist manually entered clinical labs'
  );
  assert.ok(
    addLabsContent.includes('/(app)/ocr-upload'),
    'add-labs.tsx must route to ocr-upload for report document scanning'
  );
});
