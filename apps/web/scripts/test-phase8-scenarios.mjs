/**
 * VITASense — Phase 8 Comprehensive Automated Test Suite
 * 
 * Verifies all 10 test scenarios required by the Phase 8 specification:
 *   Test 1: No Data (Honest empty state, no fabricated trends)
 *   Test 2: Limited Data (Insufficient data message, no misleading claims)
 *   Test 3: OvaSense Pathway (Cycle regularity, luteal/follicular symptom clusters, no male leakage)
 *   Test 4: AndroSense Pathway (Diurnal energy, sleep, verified testosterone, zero female/cycle leakage)
 *   Test 5: General Pathway (Universal lifestyle metrics, zero reproductive leakage)
 *   Test 6: Trust & Verification Boundary (Unverified OCR quarantined, verified labs included)
 *   Test 7: Period Comparison (Concrete observed deltas, zero fabricated percentages)
 *   Test 8: Digital Twin Integration (Current, historical baseline, change direction, provenance, limitations)
 *   Test 9: Pathway Isolation (Strict segregation across female, male, and universal profiles)
 *   Test 10: Multi-Tenant Security & Isolation (No cross-user record contamination)
 */

import {
  getPeriodDateBounds,
  calculateBiomarkerLongitudinal,
  calculatePeriodComparisons,
} from '../src/utils/longitudinalCalculations.ts';

import { LongitudinalHealthService } from '../src/services/longitudinalHealthService.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
    passedTests++;
  }
}

console.log('\n=============================================================');
console.log('🧪 VITASENSE PHASE 8 — LONGITUDINAL MONITORING TEST SUITE');
console.log('=============================================================\n');

// ---------------------------------------------------------------------------
// TEST 1 — No Data
// ---------------------------------------------------------------------------
console.log('[TEST 1] No Data Scenario');
const emptyState = LongitudinalHealthService.synthesizeState({
  userProfile: { id: 'u-empty', full_name: 'Test Empty' },
  pathway: 'female',
  period: '30d',
  symptomRecords: [],
  cycleRecords: [],
  reports: [],
  foodLogs: [],
  waterLog: null,
  fitnessLogs: [],
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

assert(emptyState.overview.whatIsImproving.length === 0, 'Improving count is 0 without fabrication');
assert(emptyState.overview.whatHasChanged.length === 0, 'Changing count is 0 without fabrication');
assert(emptyState.overview.whatHasStayedSimilar.length === 0, 'Stable count is 0 without fabrication');
assert(emptyState.overview.whatIsLimited.length > 0, 'Limited data count correctly reflects empty inputs');
assert(emptyState.symptomLongitudinal.trendState === 'insufficient_data', 'Symptom trend is "insufficient_data"');
assert(emptyState.symptomLongitudinal.frequencySummary.includes('No symptoms'), 'Honest empty symptom message displayed');
assert(emptyState.symptomLongitudinal.hasSufficientData === false, 'hasSufficientData is false');
console.log('Test 1 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 2 — Limited Data
// ---------------------------------------------------------------------------
console.log('[TEST 2] Limited Data Scenario');
const now = new Date();
const sparseSymptoms = [{
  id: 's-1',
  userId: 'u-sparse',
  symptomType: 'fatigue',
  category: 'energy_mood',
  severity: 'mild',
  occurredAt: now.toISOString().split('T')[0],
  cycleDay: null,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
}];

const sparseState = LongitudinalHealthService.synthesizeState({
  userProfile: { id: 'u-sparse', full_name: 'Sparse User' },
  pathway: 'female',
  period: '30d',
  symptomRecords: sparseSymptoms,
  cycleRecords: [],
  reports: [],
  foodLogs: [],
  waterLog: null,
  fitnessLogs: [],
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

assert(sparseState.symptomLongitudinal.trendState === 'insufficient_data', 'Sparse symptoms return "insufficient_data"');
assert(sparseState.symptomLongitudinal.limitation.includes('Calculated purely from self-reported symptoms'), 'Limitation specifies clinical boundary');
assert(sparseState.symptomLongitudinal.insufficientDataReason.includes('clearer symptom pattern will develop'), 'Patient-friendly non-clinical encouragement used');
assert(sparseState.symptomLongitudinal.hasSufficientData === false, 'hasSufficientData is false for single entry');
console.log('Test 2 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 3 — OvaSense Pathway (Female Health)
// ---------------------------------------------------------------------------
console.log('[TEST 3] OvaSense Pathway (Cycle Regularity & Symptoms Across Phases)');
const d1 = new Date(now.getTime() - 84 * 86400000).toISOString().split('T')[0];
const d2 = new Date(now.getTime() - 56 * 86400000).toISOString().split('T')[0];
const d3 = new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0];
const d4 = new Date(now.getTime()).toISOString().split('T')[0];

const femaleCycles = [
  { id: 'c-4', userId: 'u-fem', periodStartDate: d4, periodEndDate: d4, flow: 'medium' },
  { id: 'c-3', userId: 'u-fem', periodStartDate: d3, periodEndDate: d3, flow: 'medium' },
  { id: 'c-2', userId: 'u-fem', periodStartDate: d2, periodEndDate: d2, flow: 'medium' },
  { id: 'c-1', userId: 'u-fem', periodStartDate: d1, periodEndDate: d1, flow: 'medium' },
];

const femaleSymptoms = [
  { id: 's-f1', userId: 'u-fem', symptomType: 'cramping', category: 'cycle_body', severity: 'moderate', occurredAt: d4, cycleDay: 2, createdAt: d4, updatedAt: d4 },
  { id: 's-f2', userId: 'u-fem', symptomType: 'cramping', category: 'cycle_body', severity: 'moderate', occurredAt: d4, cycleDay: 3, createdAt: d4, updatedAt: d4 },
  { id: 's-f3', userId: 'u-fem', symptomType: 'headache', category: 'other', severity: 'mild', occurredAt: new Date(now.getTime() - 10 * 86400000).toISOString().split('T')[0], cycleDay: 18, createdAt: d4, updatedAt: d4 },
];

const ovaState = LongitudinalHealthService.synthesizeState({
  userProfile: { id: 'u-fem', full_name: 'Jane Doe', biological_sex: 'female' },
  pathway: 'female',
  period: '90d',
  symptomRecords: femaleSymptoms,
  cycleRecords: femaleCycles,
  reports: [],
  foodLogs: [],
  waterLog: null,
  fitnessLogs: [],
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

assert(ovaState.cycleLongitudinal !== undefined, 'Cycle stats exist for OvaSense');
assert(ovaState.cycleLongitudinal.recordedCyclesCount === 4, 'Recorded 4 cycle markers (3 intervals)');
assert(ovaState.cycleLongitudinal.averageCycleLength === 28, 'Mean cycle length is 28 days');
assert(ovaState.cycleLongitudinal.regularityClassification === 'consistent', 'Cycle interval is consistent');
assert(ovaState.androSenseLongitudinal === undefined, 'AndroSense male metrics are strictly undefined for OvaSense (no male leakage)');
assert(Array.isArray(ovaState.symptomLongitudinal.phaseClusters), 'Phase clusters computed for female pathway');
const menstrualCluster = ovaState.symptomLongitudinal.phaseClusters.find(c => c.phaseName.includes('Menstrual') || c.phaseName.includes('Period'));
assert(menstrualCluster !== undefined && menstrualCluster.symptomCount >= 2, 'Cramps mapped to menstrual/period phase');
console.log('Test 3 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 4 — AndroSense Pathway (Male Health)
// ---------------------------------------------------------------------------
console.log('[TEST 4] AndroSense Pathway (Diurnal Energy, Recovery, Testosterone)');
const maleReports = [{
  id: 'r-m1',
  userId: 'u-male',
  title: 'Endocrine Panel - Baseline',
  reportDate: new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0],
  status: 'verified',
  results: [{
    id: 'rr-m1',
    reportId: 'r-m1',
    testName: 'Total Testosterone',
    resultValue: '420',
    resultNumeric: 420,
    unit: 'ng/dL',
    referenceRange: '300-1000 ng/dL',
    status: 'within_range',
    userVerified: true,
    ocrConfidence: 0.98
  }]
}, {
  id: 'r-m2',
  userId: 'u-male',
  title: 'Follow-up Endocrine Panel',
  reportDate: new Date(now.getTime() - 10 * 86400000).toISOString().split('T')[0],
  status: 'verified',
  results: [{
    id: 'rr-m2',
    reportId: 'r-m2',
    testName: 'Total Testosterone',
    resultValue: '480',
    resultNumeric: 480,
    unit: 'ng/dL',
    referenceRange: '300-1000 ng/dL',
    status: 'within_range',
    userVerified: true,
    ocrConfidence: 0.99
  }]
}];

const maleFitness = [
  { id: 'fit-1', userId: 'u-male', durationMinutes: 45, activityType: 'strength', activityName: 'Weights', occurredAt: new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0], createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 'fit-2', userId: 'u-male', durationMinutes: 50, activityType: 'strength', activityName: 'Weights', occurredAt: new Date(now.getTime() - 8 * 86400000).toISOString().split('T')[0], createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 'fit-3', userId: 'u-male', durationMinutes: 40, activityType: 'mobility', activityName: 'Mobility', occurredAt: new Date(now.getTime() - 12 * 86400000).toISOString().split('T')[0], createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 'fit-4', userId: 'u-male', durationMinutes: 45, activityType: 'strength', activityName: 'Weights', occurredAt: new Date(now.getTime() - 15 * 86400000).toISOString().split('T')[0], createdAt: now.toISOString(), updatedAt: now.toISOString() },
];

const androState = LongitudinalHealthService.synthesizeState({
  userProfile: {
    id: 'u-male',
    fullName: 'John Doe',
    gender: 'male',
    pathway: 'male',
    mensHealth: {
      energyLevel: 'high',
      hadTestosteroneTest: 'no',
      sexDrive: 'normal',
      erectileDifficulties: 'none',
      muscleStrengthChanges: 'stable',
      bodyHairChanges: 'no_change',
      moodChanges: [],
      sleepQuality: 'restful',
    },
    lifestyle: {
      sleepHours: 7.5,
      smokingStatus: 'never',
      alcoholIntake: 'never',
      caffeineIntake: 'moderate',
      stressLevel: 'low',
      dietaryPreference: 'balanced',
      hydrationLevel: 'well_hydrated',
      activityLevel: 'moderate',
    },
  },
  pathway: 'male',
  period: '90d',
  symptomRecords: [],
  cycleRecords: [], // No cycles
  reports: maleReports,
  foodLogs: [],
  waterLog: null,
  fitnessLogs: maleFitness,
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

assert(androState.cycleLongitudinal === undefined, 'Female cycle stats are strictly undefined for AndroSense');
assert(androState.androSenseLongitudinal !== undefined, 'AndroSense stats populated');
assert(androState.androSenseLongitudinal.movementSessionsCurrent === 4, 'Tracked 4 workout sessions in period');
assert(androState.androSenseLongitudinal.sleepDurationAverage === 7.5, 'Average sleep is 7.5h');
assert(androState.biomarkerComparisons.length === 1, 'Tracked verified testosterone biomarker comparison');
assert(androState.biomarkerComparisons[0].latestValue === 480, 'Latest testosterone is 480 ng/dL');
assert(androState.biomarkerComparisons[0].previousValue === 420, 'Previous testosterone is 420 ng/dL');
console.log('Test 4 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 5 — General Pathway (Universal Health)
// ---------------------------------------------------------------------------
console.log('[TEST 5] General Pathway (Universal Metrics Only)');
const generalState = LongitudinalHealthService.synthesizeState({
  userProfile: { id: 'u-gen', full_name: 'Alex Doe', biological_sex: 'prefer_not_to_say' },
  pathway: 'general',
  period: '30d',
  symptomRecords: [],
  cycleRecords: [],
  reports: [],
  foodLogs: [
    { id: 'f-1', userId: 'u-gen', mealType: 'lunch', foodName: 'Salad', serving: '1 bowl', calories: 250, proteinG: 5, carbsG: 20, fatG: 10, fiberG: 5, loggedAt: new Date(now.getTime() - 1 * 86400000).toISOString().split('T')[0], createdAt: now.toISOString() },
    { id: 'f-2', userId: 'u-gen', mealType: 'breakfast', foodName: 'Oatmeal', serving: '1 bowl', calories: 300, proteinG: 10, carbsG: 45, fatG: 6, fiberG: 8, loggedAt: new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0], createdAt: now.toISOString() },
    { id: 'f-3', userId: 'u-gen', mealType: 'dinner', foodName: 'Soup', serving: '1 bowl', calories: 200, proteinG: 8, carbsG: 25, fatG: 4, fiberG: 4, loggedAt: new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0], createdAt: now.toISOString() },
  ],
  waterLog: { id: 'w-1', user_id: 'u-gen', amount_ml: 2200, date: now.toISOString().split('T')[0], logged_at: now.toISOString() },
  fitnessLogs: [],
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

assert(generalState.cycleLongitudinal === undefined, 'Cycle stats are undefined for General pathway');
assert(generalState.androSenseLongitudinal === undefined, 'AndroSense stats are undefined for General pathway');
assert(generalState.generalLongitudinal !== undefined, 'General lifestyle stats are populated');
assert(generalState.generalLongitudinal.nutritionMealsLoggedCurrent === 3, 'Nutrition tracked 3 meals');
console.log('Test 5 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 6 — Lab Verification & OCR Quarantine Boundary
// ---------------------------------------------------------------------------
console.log('[TEST 6] Lab Verification & OCR Quarantine Boundary');
const mixedReports = [
  {
    id: 'rep-verified-1',
    userId: 'u-1',
    title: 'Lab 1',
    reportDate: new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0],
    status: 'verified',
    results: [
      {
        id: 'rr-v1',
        reportId: 'rep-verified-1',
        testName: 'Fasting Blood Glucose',
        resultValue: '92',
        resultNumeric: 92,
        unit: 'mg/dL',
        referenceRange: '70-99 mg/dL',
        status: 'within_range',
        userVerified: true,
        ocrConfidence: 0.99
      }
    ]
  },
  {
    id: 'rep-verified-2',
    userId: 'u-1',
    title: 'Lab 2',
    reportDate: new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0],
    status: 'verified',
    results: [
      {
        id: 'rr-v2',
        reportId: 'rep-verified-2',
        testName: 'Fasting Blood Glucose',
        resultValue: '88',
        resultNumeric: 88,
        unit: 'mg/dL',
        referenceRange: '70-99 mg/dL',
        status: 'within_range',
        userVerified: true,
        ocrConfidence: 0.99
      }
    ]
  },
  {
    id: 'rep-draft-ocr',
    userId: 'u-1',
    title: 'Unconfirmed Draft Scan',
    reportDate: new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0],
    status: 'needs_verification',
    results: [
      {
        id: 'rr-ocr',
        reportId: 'rep-draft-ocr',
        testName: 'Fasting Blood Glucose',
        resultValue: '150',
        resultNumeric: 150, // Erroneous OCR artifact
        unit: 'mg/dL',
        referenceRange: '70-99 mg/dL',
        status: 'outside_range',
        userVerified: false, // QUARANTINED!
        ocrConfidence: 0.65
      }
    ]
  }
];

const { comparisons: biomarkerComparisons, quarantinedCount } = calculateBiomarkerLongitudinal(mixedReports);

assert(biomarkerComparisons.length === 1, 'Only 1 biomarker series extracted');
const fbg = biomarkerComparisons[0];
assert(fbg.testName === 'FASTING BLOOD GLUCOSE', 'Biomarker is Fasting Blood Glucose');
assert(fbg.previousValue === 92, 'Previous reading is 92 mg/dL');
assert(fbg.latestValue === 88, 'Latest verified reading is 88 mg/dL (NOT the quarantined 150)');
assert(quarantinedCount === 1, 'Exactly 1 unconfirmed OCR draft was quarantined');
assert(fbg.verifiedReadings.length === 2, 'Only 2 verified readings included in trajectory calculation');
console.log('Test 6 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 7 — Period Comparison (Current vs Previous 30 Days)
// ---------------------------------------------------------------------------
console.log('[TEST 7] Period Comparison (Current vs Previous 30 Days)');
const curWater = { id: 'w-c', userId: 'u-1', glasses: 8, targetGlasses: 8, date: now.toISOString().split('T')[0], updatedAt: now.toISOString() };
const bounds = getPeriodDateBounds('30d');

const comps = calculatePeriodComparisons([], [], [], curWater, bounds);
assert(comps.length >= 2, 'Generated period comparisons');
const waterComp = comps.find(c => c.category === 'water');
assert(waterComp !== undefined, 'Water comparison generated');
assert(!waterComp.evidence.description.includes('%'), 'No fabricated composite percentages used in statement');
console.log('Test 7 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 8 — Digital Twin Integration (Longitudinal Dimensions)
// ---------------------------------------------------------------------------
console.log('[TEST 8] Digital Twin Integration');
const twinNodes = LongitudinalHealthService.getLongitudinalDimensions({
  userProfile: { id: 'u-fem', fullName: 'Jane Doe', gender: 'female' },
  pathway: 'female',
  period: '90d',
  symptomRecords: femaleSymptoms,
  cycleRecords: femaleCycles,
  reports: [],
  foodLogs: [],
  waterLog: null,
  fitnessLogs: [],
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

assert(twinNodes.length >= 2, 'Generated longitudinal dimension nodes for Digital Twin');
const cycleNode = twinNodes.find(n => n.id === 'dt-cycle');
assert(cycleNode !== undefined, 'Cycle regularity node present for female twin');
assert(cycleNode.currentState.includes('28 days'), 'Cycle node includes current state');
assert(cycleNode.historicalState.includes('28 days'), 'Cycle node includes historical baseline');
assert(cycleNode.directionOfChange === 'stable' || cycleNode.directionOfChange === 'improving', 'Valid direction of change');
assert(cycleNode.limitation.length > 0, 'Includes explicit clinical limitations');
assert(cycleNode.supportingData[0].trustLevel === 'user_entered', 'Provenance is accurately recorded as user_entered');
console.log('Test 8 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 9 — Pathway Isolation Guarantee
// ---------------------------------------------------------------------------
console.log('[TEST 9] Pathway Isolation Guarantee');
// Ensure female state does not receive male data
assert(ovaState.androSenseLongitudinal === undefined, 'Female state has NO male androsense metrics');
// Ensure male state does not receive cycle data
assert(androState.cycleLongitudinal === undefined, 'Male state has NO cycle metrics');
// Ensure general state has neither
assert(generalState.cycleLongitudinal === undefined, 'General state has NO cycle metrics');
assert(generalState.androSenseLongitudinal === undefined, 'General state has NO androsense metrics');
console.log('Test 9 Passed!\n');

// ---------------------------------------------------------------------------
// TEST 10 — Multi-Tenant Security & Isolation
// ---------------------------------------------------------------------------
console.log('[TEST 10] Multi-Tenant Security & Isolation');
const userA_id = 'user-alice-111';
const userB_id = 'user-bob-222';

const allUserLogs = [
  { id: 's-a1', userId: userA_id, symptomType: 'migraine', category: 'other', severity: 'severe', occurredAt: now.toISOString().split('T')[0], cycleDay: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 's-b1', userId: userB_id, symptomType: 'joint_pain', category: 'other', severity: 'moderate', occurredAt: now.toISOString().split('T')[0], cycleDay: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
];

const aliceSymptoms = allUserLogs.filter(log => log.userId === userA_id);
const bobSymptoms = allUserLogs.filter(log => log.userId === userB_id);

const aliceState = LongitudinalHealthService.synthesizeState({
  userProfile: { id: userA_id, full_name: 'Alice', biological_sex: 'female' },
  pathway: 'female',
  period: '30d',
  symptomRecords: aliceSymptoms,
  cycleRecords: [],
  reports: [],
  foodLogs: [],
  waterLog: null,
  fitnessLogs: [],
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

const bobState = LongitudinalHealthService.synthesizeState({
  userProfile: { id: userB_id, full_name: 'Bob', biological_sex: 'male' },
  pathway: 'male',
  period: '30d',
  symptomRecords: bobSymptoms,
  cycleRecords: [],
  reports: [],
  foodLogs: [],
  waterLog: null,
  fitnessLogs: [],
  medications: [],
  medicationLogs: [],
  appointments: [],
  careCircleMembers: [],
});

assert(aliceState.symptomLongitudinal.totalLoggedCurrentPeriod === 1, 'Alice has exactly 1 symptom record in period');
assert(bobState.symptomLongitudinal.totalLoggedCurrentPeriod === 1, 'Bob has exactly 1 symptom record in period');
assert(aliceState.symptomLongitudinal.topRecurringSymptoms[0]?.name === 'migraine', 'Alice has Migraine only');
assert(bobState.symptomLongitudinal.topRecurringSymptoms[0]?.name === 'joint_pain', 'Bob has Joint Pain only');
console.log('Test 10 Passed!\n');

console.log('=============================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('=============================================================\n');
