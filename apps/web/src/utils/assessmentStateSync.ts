import type { ProgressiveAssessment } from '../types/intelligence';

export interface AssessmentSyncState {
  activeAssessment: ProgressiveAssessment | null;
  assessmentHistory: ProgressiveAssessment[];
  latestSequenceId: number;
  activeProgressionId: string | null;
}

export interface TransitionResult {
  accepted: boolean;
  reason: 'applied' | 'stale_sequence' | 'downgrade_rejected' | 'empty_overwrite_rejected';
  nextState: AssessmentSyncState;
}

export const TIER_RANKS: Record<string, number> = {
  tier_1: 1,
  tier_1_3: 2,
  tier_1_2: 3,
  tier_1_2_3: 4,
};

export function getAssessmentRank(assessment: ProgressiveAssessment | null | undefined): number {
  if (!assessment || assessment.has_assessment === false) return 0;
  return TIER_RANKS[assessment.assessment_level || ''] || 1;
}

export function normalizeAssessment(
  raw: any,
  fallbackUserId?: string
): ProgressiveAssessment | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id || raw.assessment_id;
  if (!id && raw.has_assessment === false) return null;

  const probability =
    raw.probability !== undefined && raw.probability !== null
      ? Number(raw.probability)
      : raw.pcos_probability !== undefined && raw.pcos_probability !== null
      ? Number(raw.pcos_probability)
      : 0;

  const probabilityPercent =
    raw.probability_percent !== undefined && raw.probability_percent !== null
      ? Number(raw.probability_percent)
      : probability * 100;

  const normalized: ProgressiveAssessment = {
    ...raw,
    id: id || `asm_${Date.now()}`,
    patient_id: raw.patient_id || raw.user_id || fallbackUserId,
    assessment_level: raw.assessment_level || 'tier_1',
    has_assessment: raw.has_assessment !== false,
    probability,
    probability_percent: probabilityPercent,
    created_at: raw.created_at || new Date().toISOString(),
  };
  return normalized;
}

/**
 * Deduplicates assessment history records strictly by assessment ID,
 * keeping the most recent copy and preserving descending chronological order.
 */
export function deduplicateHistory(
  history: ProgressiveAssessment[],
  incoming?: ProgressiveAssessment | null
): ProgressiveAssessment[] {
  const map = new Map<string, ProgressiveAssessment>();
  if (incoming && (incoming.id || (incoming as any).assessment_id)) {
    const key = String(incoming.id || (incoming as any).assessment_id);
    map.set(key, incoming);
  }
  for (const item of history) {
    if (!item) continue;
    const key = String(item.id || (item as any).assessment_id || '');
    if (key && !map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Development-only structured logger for assessment state operations.
 * Omits all clinical biomarkers and inputs.
 */
export function logAssessmentFlow(params: {
  op: string;
  seqId?: number;
  userId?: string;
  assessmentId?: string | null;
  level?: string | null;
  hasAssessment?: boolean;
}): void {
  const isDev = typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development';
  let isViteDev = false;
  try {
    isViteDev = Boolean((import.meta as any)?.env?.DEV);
  } catch {
    // ignore
  }

  if (isDev || isViteDev) {
    const timestamp = new Date().toISOString();
    console.log(
      `[ASSESSMENT_FLOW] timestamp=${timestamp} userId=${params.userId || 'anonymous'} seqId=${
        params.seqId ?? '-'
      } op=${params.op} assessmentId=${params.assessmentId || 'none'} level=${
        params.level || 'none'
      } has_assessment=${params.hasAssessment ?? 'unknown'}`
    );
  }
}

/**
 * Transitions state upon a successful tier mutation response.
 * Immediately applies authoritative normalized assessment and increments sequence ID.
 */
export function applyMutationResult(
  currentState: AssessmentSyncState,
  mutationSeqId: number,
  rawAssessment: any,
  authoritativeUserId?: string
): TransitionResult {
  const normalized = normalizeAssessment(rawAssessment, authoritativeUserId);
  const nextSeq = Math.max(currentState.latestSequenceId, mutationSeqId);

  if (!normalized) {
    return {
      accepted: false,
      reason: 'empty_overwrite_rejected',
      nextState: { ...currentState, latestSequenceId: nextSeq },
    };
  }

  const nextHistory = deduplicateHistory(currentState.assessmentHistory, normalized);
  const nextProgressionId = currentState.activeProgressionId || `prog_${normalized.id}`;

  return {
    accepted: true,
    reason: 'applied',
    nextState: {
      activeAssessment: normalized,
      assessmentHistory: nextHistory,
      latestSequenceId: nextSeq,
      activeProgressionId: nextProgressionId,
    },
  };
}

/**
 * Transitions state upon a GET active assessment response.
 * Primary protection: Stale sequence IDs are strictly discarded.
 * Scoped protection: Incoming empty or lower-tier results cannot downgrade
 * an active progression unless explicitly flagged as a restart/reset.
 */
export function applyFetchActiveResult(
  currentState: AssessmentSyncState,
  requestSeqId: number,
  rawAssessment: any,
  history: ProgressiveAssessment[] = [],
  options?: { isExplicitReset?: boolean; authoritativeUserId?: string }
): TransitionResult {
  // 1. Primary Protection: Sequence ID Check
  if (requestSeqId < currentState.latestSequenceId) {
    return {
      accepted: false,
      reason: 'stale_sequence',
      nextState: currentState,
    };
  }

  const isExplicitReset = Boolean(options?.isExplicitReset);
  const normalized = normalizeAssessment(rawAssessment, options?.authoritativeUserId);

  // 2. Handling Empty / No Assessment Responses
  if (!normalized || rawAssessment?.has_assessment === false) {
    // If active assessment already exists and this is not an explicit reset, do not wipe state
    if (!isExplicitReset && currentState.activeAssessment && currentState.activeAssessment.has_assessment !== false) {
      return {
        accepted: false,
        reason: 'empty_overwrite_rejected',
        nextState: {
          ...currentState,
          assessmentHistory: deduplicateHistory(history, currentState.activeAssessment),
          latestSequenceId: Math.max(currentState.latestSequenceId, requestSeqId),
        },
      };
    }

    return {
      accepted: true,
      reason: 'applied',
      nextState: {
        activeAssessment: null,
        assessmentHistory: deduplicateHistory(history),
        latestSequenceId: Math.max(currentState.latestSequenceId, requestSeqId),
        activeProgressionId: isExplicitReset ? null : currentState.activeProgressionId,
      },
    };
  }

  // 3. Scoped Monotonicity Guard within Same Active Progression
  if (!isExplicitReset && currentState.activeAssessment) {
    const currentRank = getAssessmentRank(currentState.activeAssessment);
    const incomingRank = getAssessmentRank(normalized);

    // If incoming rank is lower than current in the same progression, ignore downgrade
    if (incomingRank < currentRank) {
      return {
        accepted: false,
        reason: 'downgrade_rejected',
        nextState: {
          ...currentState,
          assessmentHistory: deduplicateHistory(history, currentState.activeAssessment),
          latestSequenceId: Math.max(currentState.latestSequenceId, requestSeqId),
        },
      };
    }
  }

  // 4. Authoritative Update Applied
  const nextHistory = deduplicateHistory(history, normalized);
  return {
    accepted: true,
    reason: 'applied',
    nextState: {
      activeAssessment: normalized,
      assessmentHistory: nextHistory,
      latestSequenceId: Math.max(currentState.latestSequenceId, requestSeqId),
      activeProgressionId: currentState.activeProgressionId || `prog_${normalized.id}`,
    },
  };
}

/**
 * Handles explicit screening reset or clearing (e.g., clearTier2 or reassessment restart).
 * Explicit resets bypass the scoped downgrade guard and start a new sequence version.
 */
export function applyExplicitReset(
  currentState: AssessmentSyncState,
  resetSeqId: number,
  revertedAssessment?: any,
  authoritativeUserId?: string
): TransitionResult {
  const nextSeq = Math.max(currentState.latestSequenceId + 1, resetSeqId);
  const normalized = revertedAssessment ? normalizeAssessment(revertedAssessment, authoritativeUserId) : null;
  const nextHistory = normalized
    ? deduplicateHistory(currentState.assessmentHistory, normalized)
    : currentState.assessmentHistory;

  return {
    accepted: true,
    reason: 'applied',
    nextState: {
      activeAssessment: normalized,
      assessmentHistory: nextHistory,
      latestSequenceId: nextSeq,
      activeProgressionId: normalized ? `prog_${normalized.id}` : null,
    },
  };
}
