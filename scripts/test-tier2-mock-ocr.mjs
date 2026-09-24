/**
 * Automated Unit Test for Tier 2 Mock Data and OCR Extraction Mapping
 */
import { FIELD_CONFIGS, SAMPLE_MOCK_DATA, mapOcrResultsToTier2 } from '../apps/web/src/components/adaptive/ClinicalLabsModal.tsx';

function runTests() {
  console.log('🧪 Starting Tier 2 Mock Data & OCR Extraction Tests...\n');

  // Test 1: Validate FIELD_CONFIGS count and structure
  console.log('Test 1: Validating FIELD_CONFIGS...');
  if (FIELD_CONFIGS.length !== 15) {
    throw new Error(`Expected 15 field configs, found ${FIELD_CONFIGS.length}`);
  }
  console.log('✅ Field configs count verified (15 fields).');

  // Test 2: Validate SAMPLE_MOCK_DATA completeness and ranges
  console.log('\nTest 2: Validating SAMPLE_MOCK_DATA values against medical ranges...');
  for (const cfg of FIELD_CONFIGS) {
    const raw = SAMPLE_MOCK_DATA[cfg.key];
    if (raw === undefined || raw === '') {
      throw new Error(`Missing mock value for field: ${cfg.key}`);
    }
    const num = parseFloat(raw);
    if (isNaN(num)) {
      throw new Error(`Mock value for ${cfg.key} is not a valid number: "${raw}"`);
    }
    if (num < cfg.min || num > cfg.max) {
      throw new Error(`Mock value for ${cfg.key} (${num}) is out of bounds [${cfg.min}, ${cfg.max}]`);
    }
  }
  console.log('✅ All 15 SAMPLE_MOCK_DATA values are valid and within plausible medical ranges.');

  // Test 3: Validate mapOcrResultsToTier2 with synthetic OCR items
  console.log('\nTest 3: Testing OCR result mapping to Tier 2 biomarker keys...');
  const syntheticOcrResults = [
    { testName: 'FSH (Follicle-Stimulating Hormone)', resultValue: '6.2', resultNumeric: 6.2 },
    { testName: 'LH Serum', resultValue: '8.4', resultNumeric: 8.4 },
    { testName: 'Anti-Müllerian Hormone (AMH)', resultValue: '5.1', resultNumeric: 5.1 },
    { testName: 'TSH 3rd Generation', resultValue: '2.30', resultNumeric: 2.30 },
    { testName: 'Serum Prolactin', resultValue: '19.2', resultNumeric: 19.2 },
    { testName: 'Progesterone (PRG)', resultValue: '1.05', resultNumeric: 1.05 },
    { testName: '25-OH Vitamin D', resultValue: '26.8', resultNumeric: 26.8 },
    { testName: 'Fasting Blood Glucose / RBS', resultValue: '98.0', resultNumeric: 98.0 },
    { testName: 'Hemoglobin (Hb)', resultValue: '13.4', resultNumeric: 13.4 },
    { testName: 'Total Beta HCG', resultValue: '1.5', resultNumeric: 1.5 },
    { testName: 'Resting Pulse Rate', resultValue: '72', resultNumeric: 72 },
    { testName: 'Respiratory Rate', resultValue: '15', resultNumeric: 15 },
    { testName: 'Blood Pressure Systolic', resultValue: '115', resultNumeric: 115 },
    { testName: 'Blood Pressure Diastolic', resultValue: '75', resultNumeric: 75 },
  ];

  const { mapped, count } = mapOcrResultsToTier2(syntheticOcrResults);
  console.log(`Mapped ${count} fields from synthetic report:`, mapped);

  if (count !== 14) {
    throw new Error(`Expected 14 mapped fields, got ${count}`);
  }
  if (mapped['fsh'] !== '6.2') throw new Error(`FSH mapped incorrectly: ${mapped['fsh']}`);
  if (mapped['lh'] !== '8.4') throw new Error(`LH mapped incorrectly: ${mapped['lh']}`);
  if (mapped['amh'] !== '5.1') throw new Error(`AMH mapped incorrectly: ${mapped['amh']}`);
  if (mapped['tsh'] !== '2.3') throw new Error(`TSH mapped incorrectly: ${mapped['tsh']}`);
  if (mapped['prolactin'] !== '19.2') throw new Error(`Prolactin mapped incorrectly: ${mapped['prolactin']}`);
  if (mapped['progesterone'] !== '1.05') throw new Error(`Progesterone mapped incorrectly: ${mapped['progesterone']}`);
  if (mapped['vitamin_d3'] !== '26.8') throw new Error(`Vitamin D3 mapped incorrectly: ${mapped['vitamin_d3']}`);
  if (mapped['rbs'] !== '98') throw new Error(`RBS mapped incorrectly: ${mapped['rbs']}`);
  if (mapped['hemoglobin'] !== '13.4') throw new Error(`Hemoglobin mapped incorrectly: ${mapped['hemoglobin']}`);
  if (mapped['beta_hcg_i'] !== '1.5') throw new Error(`Beta HCG mapped incorrectly: ${mapped['beta_hcg_i']}`);
  if (mapped['pulse_rate_bpm'] !== '72') throw new Error(`Pulse mapped incorrectly: ${mapped['pulse_rate_bpm']}`);
  if (mapped['respiratory_rate'] !== '15') throw new Error(`Respiratory mapped incorrectly: ${mapped['respiratory_rate']}`);
  if (mapped['bp_systolic'] !== '115') throw new Error(`Systolic mapped incorrectly: ${mapped['bp_systolic']}`);
  if (mapped['bp_diastolic'] !== '75') throw new Error(`Diastolic mapped incorrectly: ${mapped['bp_diastolic']}`);

  console.log('✅ OCR extraction test mapping passed perfectly.');

  // Test 4: Compound BP string test (e.g. "120/80")
  console.log('\nTest 4: Testing compound BP parsing (e.g. "120/80")...');
  const compoundBpResults = [
    { testName: 'Blood Pressure', resultValue: '124/82', resultNumeric: null },
  ];
  const compoundMapped = mapOcrResultsToTier2(compoundBpResults);
  if (compoundMapped.mapped['bp_systolic'] !== '124' || compoundMapped.mapped['bp_diastolic'] !== '82') {
    throw new Error(`Failed to extract compound BP: ${JSON.stringify(compoundMapped.mapped)}`);
  }
  console.log('✅ Compound BP parsing verified: 124/82 -> systolic: 124, diastolic: 82.');

  console.log('\n🎉 ALL 4 TESTS PASSED SUCCESSFULLY!');
}

runTests();
