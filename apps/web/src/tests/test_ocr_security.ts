import { ocrService, DEMO_SAMPLE_TEMPLATES } from '../services/ocrService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runTests() {
  console.log('--- Testing OCR Safety & Zero Synthetic Data Invariant ---');

  // 1. Verify that DEMO_SAMPLE_TEMPLATES is an isolated constant
  assert(DEMO_SAMPLE_TEMPLATES !== undefined, 'DEMO_SAMPLE_TEMPLATES exists for isolated fixtures');
  assert(Array.isArray(DEMO_SAMPLE_TEMPLATES.hormone_test), 'hormone_test fixture template exists');

  // 2. Create a dummy file
  const dummyFile = new File(['%PDF-1.4 dummy content'], 'lab_report.pdf', { type: 'application/pdf' });

  // 3. Test unauthenticated call: must throw Error, NEVER return synthetic data
  let failedAsExpected = false;
  try {
    // This will fail because supabase session is null or fetch is mocked/fails
    await ocrService.extractReportData(dummyFile, 'hormone_test');
  } catch (err: any) {
    failedAsExpected = true;
    assert(
      typeof err?.message === 'string' && err.message.length > 0,
      `Failed with clear message: "${err.message}"`
    );
  }

  assert(
    failedAsExpected,
    'CRITICAL: extractReportData threw an error on failure instead of silently returning mock numbers'
  );

  console.log('--- OCR Safety Regression Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error(err);
  throw err;
});
