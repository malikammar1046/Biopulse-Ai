import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting BioPulse Web Dashboard Integrity & Real-Data Tests...\n');

// 1. Audit production dashboard files for prohibited mock fallback patterns
const filesToCheck = [
  'src/components/female/FemaleDashboardOverview.tsx',
  'src/components/male/MaleDashboardOverview.tsx',
  'src/components/dashboard/overview/DashboardGreetingRow.tsx',
  'src/components/dashboard/overview/DashboardModuleCard.tsx',
  'src/components/dashboard/overview/modules/ScreeningModuleCard.tsx',
  'src/components/dashboard/overview/modules/PeriodCycleModuleCard.tsx',
  'src/components/dashboard/overview/modules/MaleTrackingModuleCard.tsx',
  'src/components/dashboard/overview/modules/NutritionModuleCard.tsx',
  'src/components/dashboard/overview/modules/ExerciseModuleCard.tsx',
  'src/components/dashboard/overview/modules/WaterModuleCard.tsx',
  'src/components/dashboard/overview/modules/MedicationModuleCard.tsx',
  'src/components/dashboard/overview/modules/CareCircleModuleCard.tsx',
  'src/components/dashboard/overview/modules/SymptomsModuleCard.tsx',
  'src/components/dashboard/overview/modules/NextBestActionModuleCard.tsx',
  'src/components/navigation/AppDashboardHeader.tsx',
];

const prohibitedPatterns = [
  /DEFAULT_SCREENING/g,
  /mockData/g,
  /fakeData/g,
  /samplePatient/g,
  /mockDashboardData/g,
  /DEFAULT_CYCLE/g,
  /DEFAULT_NUTRITION/g,
  /DEFAULT_FITNESS/g,
];

let prohibitedCount = 0;
for (const relPath of filesToCheck) {
  const fullPath = path.join(rootDir, relPath);
  assert(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(content)) {
      console.error(`❌ VIOLATION: Prohibited pattern ${pattern} found in ${relPath}`);
      prohibitedCount++;
    }
  }
}

assert.equal(prohibitedCount, 0, 'Found prohibited mock fallback patterns in production dashboard files');
console.log('✅ TEST 1 PASSED: Zero prohibited mock data fallbacks in production dashboard files.');

// 2. Verify Male Dashboard Pathway Isolation (No Female Cycle / PCOS keywords in Male code)
const maleOverviewPath = path.join(rootDir, 'src/components/male/MaleDashboardOverview.tsx');
const maleOverviewContent = fs.readFileSync(maleOverviewPath, 'utf8');

assert(!maleOverviewContent.includes('PeriodCycleModuleCard'), 'Male overview must NOT import or render PeriodCycleModuleCard');
assert(!maleOverviewContent.includes('PCOS'), 'Male overview must NOT reference PCOS');
assert(!maleOverviewContent.includes('ovulation'), 'Male overview must NOT reference ovulation');
assert(!maleOverviewContent.includes('fertile window'), 'Male overview must NOT reference fertile window');
assert(maleOverviewContent.includes('MaleTrackingModuleCard'), 'Male overview MUST include MaleTrackingModuleCard');
assert(maleOverviewContent.includes('Hypogonadism'), 'Male overview MUST reference Hypogonadism');
console.log('✅ TEST 2 PASSED: Male pathway isolation confirmed (no female cycle or PCOS leakage).');

// 3. Verify Female Dashboard Pathway Configuration
const femaleOverviewPath = path.join(rootDir, 'src/components/female/FemaleDashboardOverview.tsx');
const femaleOverviewContent = fs.readFileSync(femaleOverviewPath, 'utf8');

assert(femaleOverviewContent.includes('PeriodCycleModuleCard'), 'Female overview MUST include PeriodCycleModuleCard');
assert(femaleOverviewContent.includes('ScreeningModuleCard'), 'Female overview MUST include ScreeningModuleCard');
assert(femaleOverviewContent.includes('pathway="female"'), 'Female overview MUST explicitly configure pathway="female"');
console.log('✅ TEST 3 PASSED: Female pathway correctly configured with PCOS & Cycle modules.');

// 4. Verify Empty State Integration Across Modules
const emptyStateModules = [
  'src/components/dashboard/overview/modules/ScreeningModuleCard.tsx',
  'src/components/dashboard/overview/modules/PeriodCycleModuleCard.tsx',
  'src/components/dashboard/overview/modules/MaleTrackingModuleCard.tsx',
  'src/components/dashboard/overview/modules/NutritionModuleCard.tsx',
  'src/components/dashboard/overview/modules/ExerciseModuleCard.tsx',
  'src/components/dashboard/overview/modules/MedicationModuleCard.tsx',
  'src/components/dashboard/overview/modules/CareCircleModuleCard.tsx',
  'src/components/dashboard/overview/modules/SymptomsModuleCard.tsx',
];

for (const modPath of emptyStateModules) {
  const fullPath = path.join(rootDir, modPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(content.includes('DashboardEmptyState'), `${modPath} MUST implement DashboardEmptyState`);
  assert(content.includes('actionLabel='), `${modPath} empty state MUST provide an actionable CTA`);
}
console.log('✅ TEST 4 PASSED: All 8 data-driven modules include actionable DashboardEmptyState.');

// 5. Verify Navigation Links to Full Features
assert(femaleOverviewContent.includes('ROUTES.APP.ASSESSMENT'), 'Female overview links to assessment');
assert(femaleOverviewContent.includes('ROUTES.APP.CYCLE'), 'Female overview links to cycle');
assert(femaleOverviewContent.includes('ROUTES.APP.DIET'), 'Female overview links to diet/nutrition');
assert(femaleOverviewContent.includes('ROUTES.APP.FITNESS'), 'Female overview links to fitness');
assert(femaleOverviewContent.includes('ROUTES.APP.MEDICATIONS'), 'Female overview links to medications');
assert(femaleOverviewContent.includes('ROUTES.APP.CARE_CIRCLE'), 'Female overview links to care circle');
assert(femaleOverviewContent.includes('ROUTES.APP.SYMPTOMS'), 'Female overview links to symptoms');

assert(maleOverviewContent.includes('ROUTES.APP.ASSESSMENT'), 'Male overview links to assessment');
assert(maleOverviewContent.includes('ROUTES.APP.DIET'), 'Male overview links to diet/nutrition');
assert(maleOverviewContent.includes('ROUTES.APP.FITNESS'), 'Male overview links to fitness');
assert(maleOverviewContent.includes('ROUTES.APP.MEDICATIONS'), 'Male overview links to medications');
assert(maleOverviewContent.includes('ROUTES.APP.CARE_CIRCLE'), 'Male overview links to care circle');
assert(maleOverviewContent.includes('ROUTES.APP.SYMPTOMS'), 'Male overview links to symptoms');
console.log('✅ TEST 5 PASSED: Full feature page navigation verified across all summary cards.');

// 6. Verify AppDashboardHeader Search Integration
const headerPath = path.join(rootDir, 'src/components/navigation/AppDashboardHeader.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');

assert(headerContent.includes('Search for symptoms, meals, workouts, or ask AI...'), 'Header contains search placeholder');
assert(headerContent.includes('quickDestinations'), 'Header provides real search destinations');
assert(headerContent.includes('openAiChatWithPrompt'), 'Header search connects to AI companion on enter');
console.log('✅ TEST 6 PASSED: Header universal search and AI integration verified.');

console.log('\n🎉 ALL DASHBOARD INTEGRITY & REAL-DATA TESTS PASSED PERFECTLY!\n');
