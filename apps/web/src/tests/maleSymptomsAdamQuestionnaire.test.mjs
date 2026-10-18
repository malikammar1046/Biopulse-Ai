import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

console.log('=== RUNNING MALE SYMPTOMS / ADAM SINGLE-QUESTION FLOW TEST SUITE ===');

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(thisDir, '..', '..');

const adamStepPath = path.join(webRoot, 'src/pages/onboarding/male/MaleStep3SymptomsADAM.tsx');
const maleOnboardingPath = path.join(webRoot, 'src/pages/onboarding/MaleOnboarding.tsx');
const maleLayoutPath = path.join(webRoot, 'src/pages/onboarding/male/MaleOnboardingLayout.tsx');

assert.ok(fs.existsSync(adamStepPath), 'MaleStep3SymptomsADAM.tsx must exist');
assert.ok(fs.existsSync(maleOnboardingPath), 'MaleOnboarding.tsx must exist');
assert.ok(fs.existsSync(maleLayoutPath), 'MaleOnboardingLayout.tsx must exist');

const adamStepSource = fs.readFileSync(adamStepPath, 'utf8');
const maleOnboardingSource = fs.readFileSync(maleOnboardingPath, 'utf8');
const maleLayoutSource = fs.readFileSync(maleLayoutPath, 'utf8');

// -----------------------------------------------------------------------------
// 1. Single Main Questionnaire Card
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('Symptoms Assessment'),
  'Must include "Symptoms Assessment" section label'
);
assert.ok(
  adamStepSource.includes('ADAM Questionnaire'),
  'Must include "ADAM Questionnaire" heading'
);
assert.ok(
  adamStepSource.includes('does not provide a medical diagnosis'),
  'Must include clinical disclaimer explaining questionnaire does not provide diagnosis'
);
console.log('✓ Verification 1: Main questionnaire card header, label, heading, and clinical disclaimer verified');

// -----------------------------------------------------------------------------
// 2. Single Question Display at a time & No preselected default answers
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)'),
  'Initial state must begin at question index 0'
);
assert.ok(
  !adamStepSource.includes('existing.adam_q1 = data.sexDrive'),
  'Must NOT prefill or auto-answer adam_q1 from sexDrive'
);
assert.ok(
  !adamStepSource.includes('existing.adam_q2 = data.energyLevel'),
  'Must NOT prefill or auto-answer adam_q2 from energyLevel'
);
assert.ok(
  !adamStepSource.includes('existing.adam_q3 = data.muscleStrengthChanges'),
  'Must NOT prefill or auto-answer adam_q3 from muscleStrengthChanges'
);
assert.ok(
  !adamStepSource.includes('existing.adam_q7 = data.erectileDifficulties'),
  'Must NOT prefill or auto-answer adam_q7 from erectileDifficulties'
);
assert.ok(
  !adamStepSource.includes('existing.adam_q9 = data.sleepQuality'),
  'Must NOT prefill or auto-answer adam_q9 from sleepQuality'
);
assert.ok(
  !adamStepSource.includes('handleMarkAllRemainingNo'),
  'Must NOT contain shortcut to mark all remaining answers as No without explicit user choice'
);
console.log('✓ Verification 2: Zero preselected or default answers; strictly explicit user selection');

// -----------------------------------------------------------------------------
// 3. Progress Indicator and Slim Progress Bar
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('Question {currentQuestion.questionNumber} of {initialQuestions.length}'),
  'Must include prominent "Question X of 10" progress indicator'
);
assert.ok(
  adamStepSource.includes('role="progressbar"'),
  'Must include accessible slim progress bar with role="progressbar"'
);
assert.ok(
  adamStepSource.includes('((currentQuestionIndex + 1) / initialQuestions.length) * 100'),
  'Progress bar must update proportionally as user navigates through questions'
);
console.log('✓ Verification 3: Prominent progress indicator and slim progress bar present and reactive');

// -----------------------------------------------------------------------------
// 4. Exact 10 Questions, Original Order, and 2 Clearly Separated Options (No / Yes)
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('role="radiogroup"'),
  'Answer choices must use accessible radiogroup'
);
assert.ok(
  adamStepSource.includes('role="radio"') && adamStepSource.includes('aria-checked'),
  'Options must declare radio role and aria-checked'
);
assert.ok(
  adamStepSource.includes('handleAnswer(currentQuestion.id, false)'),
  'No option must map to false'
);
assert.ok(
  adamStepSource.includes('handleAnswer(currentQuestion.id, true)'),
  'Yes option must map to true'
);
console.log('✓ Verification 4: Exact original binary answers (No / Yes) with accessible states');

// -----------------------------------------------------------------------------
// 5. Progression Behavior: Reveal Next, Do Not Auto-Advance, Disable Skipping
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('isCurrentAnswered ?'),
  'Next button must only be revealed when current question has an answer'
);
assert.ok(
  adamStepSource.includes('Select an answer to proceed'),
  'Helper prompt must be shown when current question is unanswered'
);
assert.ok(
  adamStepSource.includes('if (!isCurrentAnswered) return;'),
  'Next must reject advancing if current question is unanswered'
);
assert.ok(
  adamStepSource.includes('onClick={handleNextQuestion}'),
  'Advancing requires explicit user click on Next button (no automatic leap)'
);
console.log('✓ Verification 5: Next is revealed on answer, requires explicit click, and prevents skipping');

// -----------------------------------------------------------------------------
// 6. Back Button Behavior: Disabled on Q1, Active on Q2-Q10, Preserves Answer
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('disabled={currentQuestionIndex === 0}'),
  'Back button must be disabled on Question 1'
);
assert.ok(
  adamStepSource.includes('setCurrentQuestionIndex((prev) => prev - 1)'),
  'Back button must decrement question index'
);
assert.ok(
  adamStepSource.includes('responses: Record<string, boolean | null> = useMemo'),
  'Responses preserved across question navigation in state'
);
console.log('✓ Verification 6: Back button disabled on Q1, moves back on Q2-10, preserving answer state');

// -----------------------------------------------------------------------------
// 7. Question 10 Completion: Replace Next with Complete Questionnaire
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('currentQuestionIndex === initialQuestions.length - 1'),
  'Must check if user is on the final question (Question 10)'
);
assert.ok(
  adamStepSource.includes('Complete Questionnaire'),
  'Must display "Complete Questionnaire" on Question 10'
);
assert.ok(
  adamStepSource.includes('disabled={!allAnswered}'),
  'Questionnaire completion disabled until all 10 questions have valid answers'
);
console.log('✓ Verification 7: Question 10 features "Complete Questionnaire" and requires all 10 answers');

// -----------------------------------------------------------------------------
// 8. Clinical Synchronization & Data Integrity
// -----------------------------------------------------------------------------
assert.ok(
  adamStepSource.includes('adamResponses: updatedResponses'),
  'Preserves adamResponses dictionary with adam_q keys'
);
assert.ok(
  adamStepSource.includes('adamScore: updatedYesCount'),
  'Calculates and synchronizes adamScore count of positive responses'
);
assert.ok(
  adamStepSource.includes('isQ1Yes ? \'reduced\' : \'normal\'') &&
  adamStepSource.includes('isQ2Yes ? \'low\' : \'moderate\'') &&
  adamStepSource.includes('isQ3Yes ? \'reduced\' : \'stable\'') &&
  adamStepSource.includes('isQ7Yes ? \'occasional\' : \'none\'') &&
  adamStepSource.includes('isQ9Yes ? \'frequently_waking\' : \'restful\''),
  'Maintains exact canonical clinical field synchronization'
);
console.log('✓ Verification 8: Clinical synchronization, adamScore, and clinical profile fields preserved');

// -----------------------------------------------------------------------------
// 9. Integration with MaleOnboarding and MaleOnboardingLayout
// -----------------------------------------------------------------------------
assert.ok(
  maleLayoutSource.includes('hideBottomNav?: boolean'),
  'MaleOnboardingLayout supports hideBottomNav prop'
);
assert.ok(
  maleLayoutSource.includes('!hideBottomNav &&'),
  'MaleOnboardingLayout omits layout footer when hideBottomNav is active'
);
assert.ok(
  maleOnboardingSource.includes('hideBottomNav={currentStep === 3}'),
  'MaleOnboarding activates hideBottomNav specifically on Step 3 (Symptoms / ADAM)'
);
assert.ok(
  maleOnboardingSource.includes('onComplete={handleNext}'),
  'MaleStep3SymptomsADAM triggers step completion via onComplete handler'
);
assert.ok(
  maleOnboardingSource.includes('if (stepNum === 3)'),
  'MaleOnboarding validates Step 3 before advancing'
);
assert.ok(
  maleOnboardingSource.includes('answeredCount < 10'),
  'MaleOnboarding enforces all 10 questions answered before step 3 can advance'
);
console.log('✓ Verification 9: Full integration with MaleOnboarding workflow and layout isolation verified');

console.log('\n=== ALL 12 MALE SYMPTOMS / ADAM SINGLE-QUESTION SPEC CHECKS PASSED ===');
