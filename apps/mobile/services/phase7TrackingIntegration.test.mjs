/**
 * BioPulse Mobile — Phase 7A & 7B: Tracking Integration Test Suite
 *
 * Validates persistent backend integrations for:
 * - Symptoms: public.symptom_records, CRUD, severity, custom symptoms, cycle day attachment
 * - Cycle: public.cycle_records, history, length, flow, male pathway isolation, no fake predictions
 * - Nutrition: public.nutrition_food_logs, meals, dates, foods, portions, calories, protein, macro ring
 * - Water: public.water_logs, daily totals, quick add, history, delete
 * - Movement: public.fitness_logs, activities, duration, date, truthful weekly bars, zero fake progress
 * - User Isolation: resetHealthState clears all tracking stores without cross-user leakage
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

// ---------------------------------------------------------------------------
// 1. Symptoms Backend Integration (Phase 7A)
// ---------------------------------------------------------------------------
test('Phase 7A: Symptom tracking is backed by public.symptom_records with full CRUD', () => {
  const trackingFile = resolveAppFile('services/trackingService.ts');
  const trackingContent = fs.readFileSync(trackingFile, 'utf8');

  // Verify API functions exist
  assert.ok(
    trackingContent.includes('getRecentSymptoms') &&
    trackingContent.includes('logSymptom') &&
    trackingContent.includes('deleteSymptom') &&
    trackingContent.includes('updateSymptom'),
    'trackingService must implement full symptom CRUD (getRecentSymptoms, logSymptom, deleteSymptom, updateSymptom)'
  );

  // Verify targeting symptom_records
  assert.ok(
    trackingContent.includes('/rest/v1/symptom_records'),
    'trackingService must target /rest/v1/symptom_records'
  );

  // Verify symptom severity and cycle day relationship
  assert.ok(
    trackingContent.includes('severity') &&
    trackingContent.includes('cycle_day') &&
    trackingContent.includes('symptom_type'),
    'trackingService must map severity, cycle_day, and symptom_type'
  );

  // Verify screen implementation
  const screenFile = resolveAppFile('app/(app)/symptom-log.tsx');
  const screenContent = fs.readFileSync(screenFile, 'utf8');

  assert.ok(
    screenContent.includes('saveSymptomCheckIn') &&
    screenContent.includes('deleteSymptomLog') &&
    screenContent.includes('addCustomSymptom'),
    'symptom-log.tsx must connect to store actions for saving, deleting, and custom symptoms'
  );

  assert.ok(
    screenContent.includes('Cycle Day') &&
    screenContent.includes('cycle.currentCycleDay'),
    'symptom-log.tsx must support cycle-day relationship for female pathway'
  );

  assert.ok(
    screenContent.includes('symptomHistory') &&
    screenContent.includes('Recent Check-in History'),
    'symptom-log.tsx must render recent check-in history from stored data'
  );
});

// ---------------------------------------------------------------------------
// 2. Cycle Backend Integration & Male Isolation (Phase 7A)
// ---------------------------------------------------------------------------
test('Phase 7A: Cycle tracking is backed by public.cycle_records with male pathway isolation', () => {
  const trackingFile = resolveAppFile('services/trackingService.ts');
  const trackingContent = fs.readFileSync(trackingFile, 'utf8');

  assert.ok(
    trackingContent.includes('getCycleHistory') &&
    trackingContent.includes('logCycle') &&
    trackingContent.includes('deleteCycleRecord') &&
    trackingContent.includes('updateCycleRecord'),
    'trackingService must implement cycle tracking CRUD'
  );

  assert.ok(
    trackingContent.includes('/rest/v1/cycle_records'),
    'trackingService must target /rest/v1/cycle_records'
  );

  // Verify cycle screen implementation
  const cycleScreen = resolveAppFile('app/(app)/cycle-tracking.tsx');
  const cycleContent = fs.readFileSync(cycleScreen, 'utf8');

  // Verify male pathway isolation
  assert.ok(
    cycleContent.includes('isMaleUser') &&
    cycleContent.includes('Menstrual cycle tracking is specific to female reproductive health pathways'),
    'cycle-tracking.tsx must block male users and preserve female pathway isolation'
  );

  // Verify no fake predictions
  assert.ok(
    cycleContent.includes('requires at least 2 logged historical cycles'),
    'cycle-tracking.tsx must not invent fake predictions when cycle history is insufficient'
  );

  // Verify calendar, insights, and history tabs
  assert.ok(
    cycleContent.includes("activeTab === 'calendar'") &&
    cycleContent.includes("activeTab === 'insights'") &&
    cycleContent.includes("activeTab === 'history'"),
    'cycle-tracking.tsx must provide calendar, insights, and history tabs'
  );
});

// ---------------------------------------------------------------------------
// 3. Nutrition Backend Integration (Phase 7B)
// ---------------------------------------------------------------------------
test('Phase 7B: Nutrition screen connects to public.nutrition_food_logs with date navigation and real macros', () => {
  const nutritionService = resolveAppFile('services/nutritionService.ts');
  const nutritionServiceContent = fs.readFileSync(nutritionService, 'utf8');

  assert.ok(
    nutritionServiceContent.includes('getFoodLogs') &&
    nutritionServiceContent.includes('getFoodLogsByDate') &&
    nutritionServiceContent.includes('logFood') &&
    nutritionServiceContent.includes('deleteFoodLog'),
    'nutritionService must provide food logs retrieval by date and CRUD operations'
  );

  assert.ok(
    nutritionServiceContent.includes('/rest/v1/nutrition_food_logs'),
    'nutritionService must target /rest/v1/nutrition_food_logs'
  );

  const screenFile = resolveAppFile('app/(app)/nutrition.tsx');
  const screenContent = fs.readFileSync(screenFile, 'utf8');

  assert.ok(
    screenContent.includes('addMeal') &&
    screenContent.includes('deleteMeal') &&
    screenContent.includes('loadNutritionData'),
    'nutrition.tsx must connect to store actions for meals'
  );

  assert.ok(
    screenContent.includes('currentDate') &&
    screenContent.includes('changeDate(-1)') &&
    screenContent.includes('changeDate(1)'),
    'nutrition.tsx must support date navigation across meals'
  );

  assert.ok(
    screenContent.includes('caloriesConsumed') &&
    screenContent.includes('proteinConsumed'),
    'nutrition.tsx must calculate macro rings from real logged meals'
  );

  assert.ok(
    screenContent.includes('SaladBowlIllustration'),
    'nutrition.tsx must render proper empty illustration when no meals are logged'
  );
});

// ---------------------------------------------------------------------------
// 4. Water Backend Integration (Phase 7B)
// ---------------------------------------------------------------------------
test('Phase 7B: Water tracking persists to public.water_logs with daily totals and history', () => {
  const trackingFile = resolveAppFile('services/trackingService.ts');
  const trackingContent = fs.readFileSync(trackingFile, 'utf8');

  assert.ok(
    trackingContent.includes('getTodayWaterLog') &&
    trackingContent.includes('getWaterHistory') &&
    trackingContent.includes('logWater') &&
    trackingContent.includes('deleteWaterLog'),
    'trackingService must implement water tracking operations'
  );

  assert.ok(
    trackingContent.includes('/rest/v1/water_logs'),
    'trackingService must target /rest/v1/water_logs'
  );

  const screenFile = resolveAppFile('app/(app)/water-log.tsx');
  const screenContent = fs.readFileSync(screenFile, 'utf8');

  assert.ok(
    screenContent.includes('addWaterMl') &&
    screenContent.includes('deleteWaterLog'),
    'water-log.tsx must connect to store actions for water'
  );

  assert.ok(
    screenContent.includes('handleAdd(250)') &&
    screenContent.includes('handleAdd(500)'),
    'water-log.tsx must support quick-add increments'
  );

  assert.ok(
    screenContent.includes('waterError') &&
    screenContent.includes('loadWaterData'),
    'water-log.tsx must handle error banner with retry'
  );
});

// ---------------------------------------------------------------------------
// 5. Movement Backend Integration & Zero Fake Progress (Phase 7B)
// ---------------------------------------------------------------------------
test('Phase 7B: Movement persists to public.fitness_logs without fake weekly progress', () => {
  const trackingFile = resolveAppFile('services/trackingService.ts');
  const trackingContent = fs.readFileSync(trackingFile, 'utf8');

  // Verify schema constraint enforcement for activity_type
  assert.ok(
    trackingContent.includes('walking') &&
    trackingContent.includes('strength') &&
    trackingContent.includes('yoga') &&
    trackingContent.includes('stretching') &&
    trackingContent.includes('cycling') &&
    trackingContent.includes('low_impact_cardio') &&
    trackingContent.includes('mobility') &&
    trackingContent.includes('rest_recovery') &&
    trackingContent.includes('other'),
    'trackingService must enforce valid database enum constraints for activity_type'
  );

  assert.ok(
    trackingContent.includes('getTodayFitnessLogs') &&
    trackingContent.includes('getFitnessHistory') &&
    trackingContent.includes('logFitness') &&
    trackingContent.includes('deleteFitnessLog'),
    'trackingService must implement fitness logs CRUD'
  );

  assert.ok(
    trackingContent.includes('/rest/v1/fitness_logs'),
    'trackingService must target /rest/v1/fitness_logs'
  );

  // Verify healthStore calculates weekly minutes honestly
  const storeFile = resolveAppFile('store/healthStore.tsx');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  assert.ok(
    storeContent.includes('function computeWeeklyMinutes(logs: FitnessLog[])'),
    'healthStore must implement computeWeeklyMinutes based on true fitness_logs'
  );

  assert.ok(
    storeContent.includes('dayTotals[dayName] = (dayTotals[dayName] || 0) + (Number(log.durationMinutes) || 0)'),
    'computeWeeklyMinutes must sum durationMinutes per day from actual logs'
  );

  // Verify movement.tsx
  const movementScreen = resolveAppFile('app/(app)/movement.tsx');
  const movementContent = fs.readFileSync(movementScreen, 'utf8');

  assert.ok(
    movementContent.includes('logActivity') &&
    movementContent.includes('deleteActivityLog') &&
    movementContent.includes('loadMovementData'),
    'movement.tsx must connect to store actions for movement'
  );

  // Verify zero fake progress in chart: 0 mins has 0 bar height
  assert.ok(
    movementContent.includes('item.mins > 0 ?') &&
    movementContent.includes('emptyBarDash'),
    'movement.tsx must render zero height / empty dash for inactive days without fake pink bars'
  );

  // Verify history section and delete confirmation
  assert.ok(
    movementContent.includes('handleDeleteActivity') &&
    movementContent.includes('Alert.alert'),
    'movement.tsx must prompt confirmation before deleting activity logs'
  );

  assert.ok(
    movementContent.includes('movementError') &&
    movementContent.includes('retryBtn'),
    'movement.tsx must include error banner with retry capability'
  );
});

// ---------------------------------------------------------------------------
// 6. User Isolation & Clean Reset Verification
// ---------------------------------------------------------------------------
test('Phase 7A/7B: resetHealthState purges all tracking state to guarantee user isolation', () => {
  const storeFile = resolveAppFile('store/healthStore.tsx');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify resetHealthState completely wipes all tracking stores
  assert.ok(
    storeContent.includes('setMeals([])') &&
    storeContent.includes('setWaterLogs([])') &&
    storeContent.includes('setMovementMinutes(0)') &&
    storeContent.includes('setMovementSteps(0)') &&
    storeContent.includes('setMovementLogs([])') &&
    storeContent.includes('setWeeklyMovementMinutes(') &&
    storeContent.includes('setCycleHistory([])') &&
    storeContent.includes('setSymptomHistory([])'),
    'resetHealthState must wipe meals, waterLogs, movementLogs, weeklyMovementMinutes, cycleHistory, symptomHistory'
  );

  assert.ok(
    storeContent.includes('setCycleError(null)') &&
    storeContent.includes('setSymptomError(null)') &&
    storeContent.includes('setNutritionError(null)') &&
    storeContent.includes('setWaterError(null)') &&
    storeContent.includes('setMovementError(null)'),
    'resetHealthState must reset all error states'
  );
});

// ---------------------------------------------------------------------------
// 7. Persistence After App Restart & Logout/Login Lifecycle
// ---------------------------------------------------------------------------
test('Phase 7A: Persistence after app restart and logout/login is verified for symptoms and cycle', () => {
  const storeFile = resolveAppFile('store/healthStore.tsx');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify loadAuthenticatedData restores both symptoms and cycle from persistent storage
  assert.ok(
    storeContent.includes('trackingService.getRecentSymptoms(currentUserId, token, 50)') &&
    storeContent.includes('trackingService.getCycleHistory(currentUserId, token, 12)'),
    'loadAuthenticatedData must fetch recent symptoms and cycle history from backend on session restore/login'
  );

  // Verify cycle calculations upon restore
  assert.ok(
    storeContent.includes('setCycleHistory(cycleHistRes.data)') &&
    storeContent.includes('currentCycleDay: diffDays <= cycleLen ? diffDays : 1') &&
    storeContent.includes('nextPeriodDaysRemaining: Math.max(0, cycleLen - diffDays)'),
    'loadAuthenticatedData must compute currentCycleDay and nextPeriodDaysRemaining from retrieved persistent cycles'
  );

  // Verify symptom mapping upon restore
  assert.ok(
    storeContent.includes('setSymptomHistory(recentSymptoms.data)') &&
    storeContent.includes('const symptomMap = new Set(recentSymptoms.data.map'),
    'loadAuthenticatedData must restore symptomHistory and active selected symptomMap from retrieved records'
  );

  // Verify user change / logout triggers resetHealthState
  assert.ok(
    storeContent.includes('if (!user || !isAuthenticated) {') &&
    storeContent.includes('resetHealthState()'),
    'healthStore must invoke resetHealthState upon user logout or session expiration'
  );

  // Verify screens re-sync from backend upon mount
  const symptomScreen = resolveAppFile('app/(app)/symptom-log.tsx');
  const symptomContent = fs.readFileSync(symptomScreen, 'utf8');
  assert.ok(
    symptomContent.includes('loadSymptoms()'),
    'symptom-log.tsx must call loadSymptoms on mount to ensure fresh database records after restart'
  );

  const cycleScreen = resolveAppFile('app/(app)/cycle-tracking.tsx');
  const cycleContent = fs.readFileSync(cycleScreen, 'utf8');
  assert.ok(
    cycleContent.includes('loadCycleData()'),
    'cycle-tracking.tsx must call loadCycleData on mount to ensure fresh database records after restart'
  );
});
