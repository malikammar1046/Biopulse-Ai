/**
 * Dev-only Diagnostic Logging for Screening Probability Tracing.
 *
 * Implements structured [PROBABILITY_TRACE] logging to guarantee visibility into
 * assessment sources, input hashes, and model parameters during login, refresh,
 * and page transitions.
 */

export interface ProbabilityTracePayload {
  userId?: string;
  pathway?: 'female' | 'male' | string;
  displaySource?: 'active_assessment' | 'ml_assessment' | 'ACTIVE' | 'ML' | 'NONE';
  dashboardSource?: 'ACTIVE' | 'ML' | 'NONE';
  assessmentId?: string | null;
  module?: string;
  probability?: number | null;
  probabilityPercent?: number | null;
  assessmentLevel?: string;
  createdAt?: string | null;
  modelName?: string;
  modelVersion?: string;
  inputHash?: string;
  cycleRecordsCount?: number;
  symptomRecordsCount?: number;
  foodLogsCount?: number;
  fitnessLogsCount?: number;
}

const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as any)?.env?.DEV);

export function logProbabilityTrace(tag: string, payload: ProbabilityTracePayload): void {
  if (!isDev) return;

  const shortId = payload.userId ? `${payload.userId.slice(0, 8)}...` : 'anonymous';
  const lines: string[] = [
    `[PROBABILITY_TRACE] ${tag}`,
    `  user=${shortId}`,
    payload.pathway ? `  pathway=${payload.pathway}` : '',
    payload.displaySource ? `  display_source=${payload.displaySource}` : '',
    payload.dashboardSource ? `  dashboard_source=${payload.dashboardSource}` : '',
    payload.assessmentId ? `  assessment_id=${payload.assessmentId}` : '',
    payload.module ? `  module=${payload.module}` : '',
    payload.probability !== undefined && payload.probability !== null ? `  probability=${payload.probability}` : '',
    payload.probabilityPercent !== undefined && payload.probabilityPercent !== null ? `  probability_percent=${payload.probabilityPercent}` : '',
    payload.assessmentLevel ? `  assessment_level=${payload.assessmentLevel}` : '',
    payload.createdAt ? `  created_at=${payload.createdAt}` : '',
    payload.modelName || payload.modelVersion ? `  model=${payload.modelName || ''} (${payload.modelVersion || ''})` : '',
    payload.inputHash ? `  input_hash=${payload.inputHash}` : '',
    payload.cycleRecordsCount !== undefined ? `  cycleRecords=${payload.cycleRecordsCount}` : '',
    payload.symptomRecordsCount !== undefined ? `  symptomRecords=${payload.symptomRecordsCount}` : '',
    payload.foodLogsCount !== undefined ? `  foodLogs=${payload.foodLogsCount}` : '',
    payload.fitnessLogsCount !== undefined ? `  fitnessLogs=${payload.fitnessLogsCount}` : '',
  ].filter(Boolean);

  console.info(lines.join('\n'));
}

export function logDashboardRenderTrace(params: {
  pathway: 'female' | 'male';
  userId?: string;
  dashboardSource: 'ACTIVE' | 'NONE';
  displayedProbability: number | null;
  assessmentId?: string | null;
  module?: string;
  inputHash?: string;
}): void {
  if (!isDev) return;

  const shortId = params.userId ? `${params.userId.slice(0, 8)}...` : 'anonymous';
  console.info(
    `[PROBABILITY_TRACE] Dashboard Render\n` +
    `  dashboard_source=${params.dashboardSource}\n` +
    `  displayed_probability=${params.displayedProbability !== null ? params.displayedProbability : 'null'}\n` +
    `  user=${shortId}\n` +
    `  pathway=${params.pathway}\n` +
    `  module=${params.module || (params.pathway === 'male' ? 'male_hypogonadism' : 'female_pcos')}\n` +
    `  assessment_id=${params.assessmentId || 'none'}\n` +
    `  input_hash=${params.inputHash || 'none'}`
  );
}
