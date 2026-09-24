/**
 * apps/web/scripts/test-out-of-order-assessments.mjs
 *
 * Frontend regression test exercising the ACTUAL production state sequencing helper:
 * apps/web/src/utils/assessmentStateSync.ts
 *
 * Validates:
 * 1. Request sequence ownership: stale responses (seqId < latest) are strictly rejected.
 * 2. Stale empty GET cannot overwrite an active Tier 1 or Tier 2 mutation.
 * 3. Stale Tier 1 GET cannot downgrade an active Tier 2 mutation.
 * 4. Legitimate explicit resets bypass monotonicity guards and downgrade/reset cleanly.
 * 5. Deduplication strictly operates on assessment ID (newest preserved).
 * 6. Mutation responses are applied immediately with authoritative normalization.
 */

import assert from 'node:assert';
import {
  applyMutationResult,
  applyFetchActiveResult,
  applyExplicitReset,
  deduplicateHistory,
  normalizeAssessment,
  getAssessmentRank,
} from '../src/utils/assessmentStateSync.ts';

const AUTH_USER_UUID = '550e8400-e29b-41d4-a716-446655440000';

console.log('🧪 Starting Production Assessment State Sequencing Regression Tests...\n');

// -----------------------------------------------------------------------------
// Test 1: Stale GET A (Empty) Resolving AFTER Tier 1 Mutation Returns
// -----------------------------------------------------------------------------
{
  console.log('Test 1: Slower in-flight GET (empty) resolving AFTER Tier 1 mutation returns');

  let state = {
    activeAssessment: null,
    assessmentHistory: [],
    latestSequenceId: 0,
    activeProgressionId: null,
  };

  // Step 1: Initial page load triggers GET Request A (seqId = 1)
  const reqA_seqId = 1;
  state.latestSequenceId = reqA_seqId;

  // Step 2: User immediately submits Tier 1 questionnaire -> Mutation B (seqId = 2)
  const mutationB_seqId = 2;
  const tier1Payload = {
    id: 'asm_tier1_101',
    patient_id: AUTH_USER_UUID,
    module: 'female_pcos',
    assessment_level: 'tier_1',
    probability: 0.725,
    risk_category: 'elevated',
    has_assessment: true,
    created_at: new Date('2026-09-19T10:00:00Z').toISOString(),
  };

  const mutationResult = applyMutationResult(state, mutationB_seqId, tier1Payload, AUTH_USER_UUID);
  assert.strictEqual(mutationResult.accepted, true, 'Mutation must be accepted');
  assert.strictEqual(mutationResult.reason, 'applied');
  state = mutationResult.nextState;

  // Verify Tier 1 is now authoritative immediately
  assert.strictEqual(state.activeAssessment?.id, 'asm_tier1_101');
  assert.strictEqual(state.activeAssessment?.assessment_level, 'tier_1');
  assert.strictEqual(state.latestSequenceId, 2);

  // Step 3: Slower GET Request A now finally resolves with { has_assessment: false }
  const staleGetResult = applyFetchActiveResult(state, reqA_seqId, { has_assessment: false }, []);

  // Assert: Stale GET must be rejected by sequence ownership
  assert.strictEqual(staleGetResult.accepted, false, 'Stale GET sequence must be rejected');
  assert.strictEqual(staleGetResult.reason, 'stale_sequence');
  // State remains Tier 1!
  assert.strictEqual(staleGetResult.nextState.activeAssessment?.id, 'asm_tier1_101');
  assert.strictEqual(staleGetResult.nextState.activeAssessment?.assessment_level, 'tier_1');

  console.log('  ✅ PASSED: Stale GET A rejected; Tier 1 active state preserved.\n');
}

// -----------------------------------------------------------------------------
// Test 2: Stale Tier 1 GET Resolving AFTER Tier 2 Mutation Returns
// -----------------------------------------------------------------------------
{
  console.log('Test 2: Slower Tier 1 GET resolving AFTER Tier 2 mutation returns');

  let state = {
    activeAssessment: {
      id: 'asm_tier1_201',
      patient_id: AUTH_USER_UUID,
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: 0.65,
      risk_category: 'moderate',
      has_assessment: true,
      created_at: new Date('2026-09-19T10:00:00Z').toISOString(),
    },
    assessmentHistory: [],
    latestSequenceId: 2,
    activeProgressionId: 'prog_asm_tier1_201',
  };

  // Step 1: Background refresh fires GET Request C (seqId = 3)
  const reqC_seqId = 3;
  state.latestSequenceId = reqC_seqId;

  // Step 2: User adds hormone labs -> Tier 2 Mutation D completes (seqId = 4)
  const mutationD_seqId = 4;
  const tier2Payload = {
    id: 'asm_tier2_202',
    patient_id: AUTH_USER_UUID,
    module: 'female_pcos',
    assessment_level: 'tier_1_2',
    probability: 0.88,
    risk_category: 'high',
    has_assessment: true,
    created_at: new Date('2026-09-19T10:05:00Z').toISOString(),
  };

  const mutationResult = applyMutationResult(state, mutationD_seqId, tier2Payload, AUTH_USER_UUID);
  assert.strictEqual(mutationResult.accepted, true);
  state = mutationResult.nextState;

  assert.strictEqual(state.activeAssessment?.id, 'asm_tier2_202');
  assert.strictEqual(state.activeAssessment?.assessment_level, 'tier_1_2');
  assert.strictEqual(state.latestSequenceId, 4);

  // Step 3: Slower GET Request C returns late with Tier 1 assessment (seqId = 3)
  const staleTier1Result = applyFetchActiveResult(state, reqC_seqId, {
    id: 'asm_tier1_201',
    assessment_level: 'tier_1',
    probability: 0.65,
    has_assessment: true,
  });

  // Assert: Rejected by sequence ownership
  assert.strictEqual(staleTier1Result.accepted, false);
  assert.strictEqual(staleTier1Result.reason, 'stale_sequence');
  assert.strictEqual(staleTier1Result.nextState.activeAssessment?.id, 'asm_tier2_202');
  assert.strictEqual(staleTier1Result.nextState.activeAssessment?.assessment_level, 'tier_1_2');

  console.log('  ✅ PASSED: Stale Tier 1 GET rejected; Tier 2 active state preserved.\n');
}

// -----------------------------------------------------------------------------
// Test 3: Scoped Downgrade Guard within Same Progression (Fresh SeqId)
// -----------------------------------------------------------------------------
{
  console.log('Test 3: Scoped downgrade guard prevents downgrade from Tier 2 to Tier 1 in same progression');

  let state = {
    activeAssessment: {
      id: 'asm_tier2_301',
      patient_id: AUTH_USER_UUID,
      module: 'female_pcos',
      assessment_level: 'tier_1_2',
      probability: 0.85,
      has_assessment: true,
    },
    assessmentHistory: [],
    latestSequenceId: 5,
    activeProgressionId: 'prog_asm_tier1_300',
  };

  // A concurrent fetch returns with seqId = 5 but carrying an older tier_1 payload
  const downgradeAttempt = applyFetchActiveResult(state, 5, {
    id: 'asm_tier1_300',
    assessment_level: 'tier_1',
    probability: 0.60,
    has_assessment: true,
  });

  assert.strictEqual(downgradeAttempt.accepted, false);
  assert.strictEqual(downgradeAttempt.reason, 'downgrade_rejected');
  assert.strictEqual(downgradeAttempt.nextState.activeAssessment?.id, 'asm_tier2_301');
  assert.strictEqual(downgradeAttempt.nextState.activeAssessment?.assessment_level, 'tier_1_2');

  console.log('  ✅ PASSED: Scoped downgrade rejected; active Tier 2 preserved.\n');
}

// -----------------------------------------------------------------------------
// Test 4: Explicit Reset Bypasses Monotonicity (Clear Tier 2 / Restart)
// -----------------------------------------------------------------------------
{
  console.log('Test 4: Explicit reset allows legitimate downgrade/restart without monotonicity block');

  let state = {
    activeAssessment: {
      id: 'asm_tier2_401',
      patient_id: AUTH_USER_UUID,
      module: 'female_pcos',
      assessment_level: 'tier_1_2',
      probability: 0.85,
      has_assessment: true,
    },
    assessmentHistory: [],
    latestSequenceId: 6,
    activeProgressionId: 'prog_asm_400',
  };

  // User explicitly clicks "Clear Tier 2" -> Orchestrator recalculates Tier 1
  const revertedTier1 = {
    id: 'asm_tier1_recalculated_402',
    patient_id: AUTH_USER_UUID,
    module: 'female_pcos',
    assessment_level: 'tier_1',
    probability: 0.62,
    has_assessment: true,
  };

  const resetResult = applyExplicitReset(state, 7, revertedTier1, AUTH_USER_UUID);
  assert.strictEqual(resetResult.accepted, true, 'Explicit reset must always be accepted');
  assert.strictEqual(resetResult.reason, 'applied');
  assert.strictEqual(resetResult.nextState.activeAssessment?.id, 'asm_tier1_recalculated_402');
  assert.strictEqual(resetResult.nextState.activeAssessment?.assessment_level, 'tier_1');
  assert.strictEqual(resetResult.nextState.latestSequenceId, 7);

  console.log('  ✅ PASSED: Explicit reset successfully transitioned to Tier 1.\n');
}

// -----------------------------------------------------------------------------
// Test 5: Assessment History Deduplication by Assessment ID
// -----------------------------------------------------------------------------
{
  console.log('Test 5: History deduplication strictly uses assessment ID');

  const history = [
    { id: 'asm_001', assessment_level: 'tier_1', probability: 0.5, created_at: '2026-09-19T01:00:00Z' },
    { id: 'asm_002', assessment_level: 'tier_1_2', probability: 0.7, created_at: '2026-09-19T02:00:00Z' },
    { id: 'asm_001', assessment_level: 'tier_1', probability: 0.5, created_at: '2026-09-19T01:00:00Z' }, // Duplicate
    { assessment_id: 'asm_003', assessment_level: 'tier_1_2_3', probability: 0.9, created_at: '2026-09-19T03:00:00Z' },
  ];

  const incoming = { id: 'asm_002', assessment_level: 'tier_1_2', probability: 0.75, created_at: '2026-09-19T02:05:00Z' };

  const deduplicated = deduplicateHistory(history, incoming);

  assert.strictEqual(deduplicated.length, 3, 'Must contain exactly 3 unique records (asm_002, asm_001, asm_003)');
  const ids = deduplicated.map((item) => item.id || item.assessment_id);
  assert.deepStrictEqual(ids, ['asm_002', 'asm_001', 'asm_003']);
  // Incoming updated copy of asm_002 was prioritized
  assert.strictEqual(deduplicated[0].probability, 0.75);

  console.log('  ✅ PASSED: Assessment history deduplicated strictly by assessment ID.\n');
}

// -----------------------------------------------------------------------------
// Test 6: Normalization Authoritatively Formats Probability and Patient UUID
// -----------------------------------------------------------------------------
{
  console.log('Test 6: Normalization authoritatively formats probability and patient UUID');

  const rawBackend = {
    assessment_id: 'asm_raw_999',
    user_id: 'old_or_anon_id',
    pcos_probability: 0.4321,
    assessment_level: 'tier_1',
  };

  const normalized = normalizeAssessment(rawBackend, AUTH_USER_UUID);
  assert.ok(normalized);
  assert.strictEqual(normalized.id, 'asm_raw_999');
  assert.strictEqual(normalized.patient_id, 'old_or_anon_id'); // Preserves patient_id if present
  assert.strictEqual(normalized.probability, 0.4321);
  assert.strictEqual(normalized.probability_percent, 43.21);

  // If patient_id and user_id are absent, uses fallback Supabase UUID
  const rawWithoutUser = {
    id: 'asm_raw_888',
    probability: 0.81,
    assessment_level: 'tier_1_2',
  };
  const normalizedFallback = normalizeAssessment(rawWithoutUser, AUTH_USER_UUID);
  assert.strictEqual(normalizedFallback.patient_id, AUTH_USER_UUID);
  assert.strictEqual(normalizedFallback.probability_percent, 81.0);

  console.log('  ✅ PASSED: Normalization applied authoritative values correctly.\n');
}

console.log('🎉 ALL 6 FRONTEND OUT-OF-ORDER & SEQUENCING TESTS PASSED PERFECTLY!\n');
