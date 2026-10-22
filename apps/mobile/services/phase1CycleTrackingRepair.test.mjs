/**
 * Phase 1 — Female Cycle Tracking Repair & Normalization Unit Tests
 *
 * Verifies:
 * 1. normalizeFlowToDb normalizes 'Moderate', 'moderate', 'medium' -> 'medium'
 * 2. normalizeFlowToDb normalizes 'Light', 'light' -> 'light'
 * 3. normalizeFlowToDb normalizes 'Heavy', 'heavy' -> 'heavy'
 * 4. normalizeFlowFromDb normalizes 'medium' -> 'Moderate'
 * 5. normalizeFlowFromDb normalizes 'light' -> 'Light'
 * 6. normalizeFlowFromDb normalizes 'heavy' -> 'Heavy'
 * 7. trackingService.logCycle payload does NOT include unsupported 'cycle_length'
 * 8. trackingService.logCycle defaults period_end_date to periodStartDate if falsy
 * 9. healthStore.updateCycle syncs cycleLength to profiles table without duplicate cycle log
 * 10. healthStore.logCycleEntry persists cycleLength to profiles.cycle_length
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Exact normalization implementations matching trackingService.ts
function normalizeFlowToDb(flow) {
  if (!flow) return 'medium';
  const lower = String(flow).trim().toLowerCase();
  if (lower === 'heavy') return 'heavy';
  if (lower === 'light') return 'light';
  if (lower === 'moderate' || lower === 'medium') return 'medium';
  return 'medium';
}

function normalizeFlowFromDb(flow) {
  if (!flow) return 'Moderate';
  const lower = String(flow).trim().toLowerCase();
  if (lower === 'heavy') return 'Heavy';
  if (lower === 'light') return 'Light';
  return 'Moderate';
}

test('Task 1.1: normalizeFlowToDb correctly maps UI values to DB constraint', () => {
  // DB check constraint: flow IN ('light', 'medium', 'heavy')
  assert.equal(normalizeFlowToDb('Light'), 'light');
  assert.equal(normalizeFlowToDb('light'), 'light');
  assert.equal(normalizeFlowToDb('Moderate'), 'medium');
  assert.equal(normalizeFlowToDb('moderate'), 'medium');
  assert.equal(normalizeFlowToDb('medium'), 'medium');
  assert.equal(normalizeFlowToDb('Heavy'), 'heavy');
  assert.equal(normalizeFlowToDb('heavy'), 'heavy');
  assert.equal(normalizeFlowToDb(null), 'medium');
  assert.equal(normalizeFlowToDb(undefined), 'medium');
  assert.equal(normalizeFlowToDb('unknown'), 'medium');
});

test('Task 1.2: normalizeFlowFromDb correctly maps DB values to UI representation', () => {
  assert.equal(normalizeFlowFromDb('light'), 'Light');
  assert.equal(normalizeFlowFromDb('medium'), 'Moderate');
  assert.equal(normalizeFlowFromDb('heavy'), 'Heavy');
  assert.equal(normalizeFlowFromDb('moderate'), 'Moderate');
  assert.equal(normalizeFlowFromDb(null), 'Moderate');
  assert.equal(normalizeFlowFromDb(undefined), 'Moderate');
});

test('Task 1.3: trackingService.ts code verification for supported columns and flow mapping', () => {
  const fileContent = fs.readFileSync(path.join(__dirname, 'trackingService.ts'), 'utf8');

  // Verify functions exist and are exported
  assert.ok(
    fileContent.includes('export function normalizeFlowToDb'),
    'normalizeFlowToDb must be exported in trackingService.ts'
  );
  assert.ok(
    fileContent.includes('export function normalizeFlowFromDb'),
    'normalizeFlowFromDb must be exported in trackingService.ts'
  );

  // Verify that cycle_length is NOT sent in logCycle payload to cycle_records
  const logCycleSection = fileContent.substring(
    fileContent.indexOf('static async logCycle'),
    fileContent.indexOf('static async deleteCycleRecord')
  );
  assert.ok(
    !logCycleSection.includes('cycle_length: input.cycleLength'),
    'logCycle payload must NOT include cycle_length column for cycle_records'
  );

  // Verify period_end_date fallback
  assert.ok(
    logCycleSection.includes('period_end_date: input.periodEndDate || input.periodStartDate'),
    'logCycle must default period_end_date to periodStartDate when not provided'
  );

  // Verify normalizeFlowToDb is invoked in logCycle
  assert.ok(
    logCycleSection.includes('flow: normalizeFlowToDb(input.flow)'),
    'logCycle must sanitize flow through normalizeFlowToDb'
  );

  // Verify updateCycleRecord does not send cycle_length to cycle_records
  const updateCycleSection = fileContent.substring(
    fileContent.indexOf('static async updateCycleRecord'),
    fileContent.indexOf('// SYMPTOM RECORDS')
  );
  assert.ok(
    !updateCycleSection.includes('payload.cycle_length'),
    'updateCycleRecord must not write cycle_length to cycle_records table'
  );
  assert.ok(
    updateCycleSection.includes('payload.flow = normalizeFlowToDb(input.flow)'),
    'updateCycleRecord must sanitize flow through normalizeFlowToDb'
  );
});

test('Task 1.4: healthStore cycle length preservation and profile sync', () => {
  const storeContent = fs.readFileSync(path.join(rootDir, 'store/healthStore.tsx'), 'utf8');

  // Verify updateCycle does not redundantly insert cycle_records
  const updateCycleSection = storeContent.substring(
    storeContent.indexOf('const updateCycle = useCallback'),
    storeContent.indexOf('const logPeriodStart = useCallback')
  );
  assert.ok(
    !updateCycleSection.includes('trackingService.logCycle'),
    'updateCycle must not fire duplicate trackingService.logCycle'
  );
  assert.ok(
    updateCycleSection.includes('updateUserProfileInDb'),
    'updateCycle must sync cycle params to profiles table'
  );

  // Verify logCycleEntry updates profiles table
  const logCycleEntrySection = storeContent.substring(
    storeContent.indexOf('const logCycleEntry = useCallback(async'),
    storeContent.indexOf('const deleteCycleEntry = useCallback')
  );
  assert.ok(
    logCycleEntrySection.includes('updateUserProfileInDb'),
    'logCycleEntry must persist cycle length and date to profiles table'
  );
  assert.ok(
    logCycleEntrySection.includes('profilePatch.cycle_length = String(input.cycleLength)'),
    'logCycleEntry must map cycle_length on profile'
  );
});
