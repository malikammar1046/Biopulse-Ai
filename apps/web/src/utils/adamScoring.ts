/**
 * apps/web/src/utils/adamScoring.ts
 *
 * Canonical evaluation of the Saint Louis University ADAM Questionnaire
 * (Androgen Deficiency in the Aging Male, Morley et al., 2000).
 *
 * Clinical Scoring Criteria:
 * A clinical screen is POSITIVE if:
 * 1. Question 1 (decrease in libido / sex drive) is answered YES, OR
 * 2. Question 7 (decreased erection strength) is answered YES, OR
 * 3. Any 3 or more other questions are answered YES.
 *
 * Otherwise, the clinical screen is NEGATIVE.
 *
 * Conceptually Independent:
 * ADAM = symptom-based clinical screener.
 * ML probability = statistical estimate trained against low morning serum testosterone.
 * They complement each other and must never be mathematically combined or averaged.
 */

export interface AdamEvaluation {
  isPositive: boolean;
  totalAnswered: number;
  yesCount: number;
  hasCriticalYes: boolean;
  otherYesCount: number;
  statusText: 'Positive' | 'Negative' | 'Not Completed';
}

export function evaluateAdamResponses(
  adamResponses?: Record<string, boolean | null | undefined> | null
): AdamEvaluation {
  if (!adamResponses || typeof adamResponses !== 'object') {
    return {
      isPositive: false,
      totalAnswered: 0,
      yesCount: 0,
      hasCriticalYes: false,
      otherYesCount: 0,
      statusText: 'Not Completed',
    };
  }

  const answered = Object.entries(adamResponses).filter(
    ([_, val]) => val !== null && val !== undefined
  );
  const totalAnswered = answered.length;
  if (totalAnswered === 0) {
    return {
      isPositive: false,
      totalAnswered: 0,
      yesCount: 0,
      hasCriticalYes: false,
      otherYesCount: 0,
      statusText: 'Not Completed',
    };
  }

  const isQ1Yes = adamResponses['adam_q1'] === true;
  const isQ7Yes = adamResponses['adam_q7'] === true;
  const hasCriticalYes = isQ1Yes || isQ7Yes;

  let otherYesCount = 0;
  let yesCount = 0;

  for (const [key, val] of Object.entries(adamResponses)) {
    if (val === true) {
      yesCount++;
      if (key !== 'adam_q1' && key !== 'adam_q7') {
        otherYesCount++;
      }
    }
  }

  const isPositive = hasCriticalYes || otherYesCount >= 3;

  return {
    isPositive,
    totalAnswered,
    yesCount,
    hasCriticalYes,
    otherYesCount,
    statusText: isPositive ? 'Positive' : 'Negative',
  };
}
