import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ActivityHeart,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ShieldTick,
} from '@untitledui/icons';
import type { MensHealthProfile } from '../../../types/onboarding';
import { getInitialADAMQuestions } from '../../../services/adaptiveProfileService';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';

interface MaleStep3Props {
  data: MensHealthProfile;
  onChange: (profile: MensHealthProfile) => void;
  onComplete?: () => void;
  onBackToHealthProfile?: () => void;
}

export const MaleStep3SymptomsADAM: React.FC<MaleStep3Props> = ({
  data,
  onChange,
  onComplete,
  onBackToHealthProfile,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Canonical list of 10 ADAM questions
  const initialQuestions = useMemo(() => getInitialADAMQuestions().questions, []);

  // Hydrate responses strictly from explicit user answers — NEVER fabricate or prefill defaults
  const responses: Record<string, boolean | null> = useMemo(() => {
    return { ...(data.adamResponses || {}) };
  }, [data.adamResponses]);

  const answeredCount = initialQuestions.filter(
    (q) => responses[q.id] !== undefined && responses[q.id] !== null
  ).length;
  const yesCount = initialQuestions.filter((q) => responses[q.id] === true).length;
  const allAnswered = answeredCount === initialQuestions.length;

  const currentQuestion = initialQuestions[currentQuestionIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;
  const isCurrentAnswered = currentResponse !== undefined && currentResponse !== null;

  const handleAnswer = (questionId: string, answer: boolean) => {
    // Avoid redundant state update if same value is already selected
    if (responses[questionId] === answer) return;

    const updatedResponses = {
      ...responses,
      [questionId]: answer,
    };

    // Calculate updated positive responses
    const updatedYesCount = Object.values(updatedResponses).filter((v) => v === true).length;

    // Synchronize canonical clinical fields
    const isQ1Yes = updatedResponses.adam_q1 === true;
    const isQ2Yes = updatedResponses.adam_q2 === true;
    const isQ3Yes = updatedResponses.adam_q3 === true;
    const isQ5Yes = updatedResponses.adam_q5 === true;
    const isQ6Yes = updatedResponses.adam_q6 === true;
    const isQ7Yes = updatedResponses.adam_q7 === true;
    const isQ9Yes = updatedResponses.adam_q9 === true;

    const moodChanges: string[] = [];
    if (isQ5Yes) moodChanges.push('Decreased enjoyment of life');
    if (isQ6Yes) moodChanges.push('Sad or irritable mood');

    onChange({
      ...data,
      adamResponses: updatedResponses,
      adamScore: updatedYesCount,
      sexDrive: isQ1Yes ? 'reduced' : 'normal',
      energyLevel: isQ2Yes ? 'low' : 'moderate',
      muscleStrengthChanges: isQ3Yes ? 'reduced' : 'stable',
      erectileDifficulties: isQ7Yes ? 'occasional' : 'none',
      sleepQuality: isQ9Yes ? 'frequently_waking' : 'restful',
      moodChanges,
    });
  };

  const handleNextQuestion = () => {
    if (!isCurrentAnswered) return;
    if (currentQuestionIndex < initialQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleCompleteQuestionnaire = () => {
    if (!allAnswered) return;
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 text-left">
      {/* Return to Health Profile Link (if provided) */}
      {onBackToHealthProfile && (
        <button
          type="button"
          onClick={onBackToHealthProfile}
          className="inline-flex items-center gap-1.5 text-xs font-semibold font-sans text-[#55718F] hover:text-[#073B72] transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Return to Health Profile (Step 2)</span>
        </button>
      )}

      {/* ════════════════════════════════════════════════════════════
          MAIN QUESTIONNAIRE CARD (Single Unified Card Container)
         ════════════════════════════════════════════════════════════ */}
      <div className="bg-[#FAFCFF] sm:bg-white rounded-2xl sm:rounded-3xl border border-[#D7EAF2] shadow-xs sm:shadow-sm p-5 sm:p-7 lg:p-8 space-y-6">
        {/* ── Top Header: Section Label & Why Trigger ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#DDEFFD] flex items-center justify-center shrink-0 shadow-2xs">
              <ActivityHeart className="w-4 h-4 text-[#0868B9]" aria-hidden="true" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold font-sans text-[#0868B9] uppercase tracking-wider block">
              Symptoms Assessment
            </span>
          </div>

          <OnboardingWhyTrigger
            onClick={() => setShowWhyModal(true)}
            label="About ADAM"
            accentColor="blue"
          />
        </div>

        {/* ── Heading & Context Description ── */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl lg:text-[1.65rem] font-bold font-display text-[#073B72] tracking-tight leading-tight">
            ADAM Questionnaire
          </h2>
          <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
            These clinical screening questions help assess symptoms associated with low testosterone and male vitality. This questionnaire provides initial symptom screening and does not provide a medical diagnosis.
          </p>
        </div>

        {/* ── Progress Indicators: Question X of 10 & Slim Progress Bar ── */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs sm:text-sm font-sans">
            <span className="font-bold font-mono text-[#073B72]">
              Question {currentQuestion.questionNumber} of {initialQuestions.length}
            </span>
            <span className="font-medium text-[#55718F]">
              {answeredCount} of {initialQuestions.length} answered
              {yesCount > 0 && ` • ${yesCount} positive indicator${yesCount > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Slim progress bar */}
          <div
            className="w-full h-1.5 sm:h-2 bg-[#E2EEF5] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={currentQuestionIndex + 1}
            aria-valuemin={1}
            aria-valuemax={initialQuestions.length}
            aria-label={`Question ${currentQuestionIndex + 1} of ${initialQuestions.length}`}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#0288D1] to-[#0868B9] rounded-full"
              initial={false}
              animate={{ width: `${((currentQuestionIndex + 1) / initialQuestions.length) * 100}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </div>

          {/* Interactive Question Step Tracks (click answered questions to review) */}
          <div className="flex items-center gap-1.5 pt-0.5" aria-hidden="true">
            {initialQuestions.map((q, idx) => {
              const isAnswered = responses[q.id] !== undefined && responses[q.id] !== null;
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    if (isAnswered || idx < currentQuestionIndex) {
                      setCurrentQuestionIndex(idx);
                    }
                  }}
                  disabled={!isAnswered && idx > currentQuestionIndex}
                  title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#0868B9] ring-2 ring-[#0868B9]/30'
                      : isAnswered
                      ? 'bg-[#BAE6FD] hover:bg-[#7DD3FC] cursor-pointer'
                      : 'bg-[#E2EEF5] cursor-not-allowed'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* ── Current Question Display with Framer Motion Animation ── */}
        <div className="min-h-[160px] flex flex-col justify-center py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-[13px] font-mono font-bold text-[#0868B9] bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#BAE6FD]">
                  Question {currentQuestion.questionNumber}
                </span>
                {currentQuestion.isCriticalQuestion && (
                  <span className="text-[10px] sm:text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold uppercase tracking-wide">
                    Primary Clinical Indicator
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl lg:text-[1.3rem] font-semibold font-display text-[#073B72] leading-snug">
                {currentQuestion.prompt}
              </h3>

              {/* Two clearly separated answer options */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2"
                role="radiogroup"
                aria-label={currentQuestion.prompt}
              >
                {/* Option: No (false) */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={currentResponse === false}
                  onClick={() => handleAnswer(currentQuestion.id, false)}
                  className={`group min-h-[62px] sm:min-h-[70px] p-4 sm:p-4.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#073B72] focus-visible:ring-offset-2 ${
                    currentResponse === false
                      ? 'bg-[#F0F8FF] border-[#073B72] text-[#073B72] shadow-sm ring-2 ring-[#073B72]/15'
                      : 'bg-white border-[#D7EAF2] text-[#486581] hover:border-[#073B72]/40 hover:bg-[#F8FDFF]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        currentResponse === false
                          ? 'border-[#073B72] bg-[#073B72] text-white shadow-2xs'
                          : 'border-[#CBD5E1] bg-white group-hover:border-[#073B72]/50'
                      }`}
                    >
                      {currentResponse === false && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <span className="text-[16px] sm:text-[17px] font-bold font-sans block leading-tight">
                        No
                      </span>
                      <span className="text-[11px] sm:text-[12px] font-sans text-[#8FA3B8] group-hover:text-[#55718F]">
                        Symptom absent
                      </span>
                    </div>
                  </div>
                </button>

                {/* Option: Yes (true) */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={currentResponse === true}
                  onClick={() => handleAnswer(currentQuestion.id, true)}
                  className={`group min-h-[62px] sm:min-h-[70px] p-4 sm:p-4.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0868B9] focus-visible:ring-offset-2 ${
                    currentResponse === true
                      ? 'bg-[#F0F8FF] border-[#0868B9] text-[#073B72] shadow-sm ring-2 ring-[#0868B9]/20'
                      : 'bg-white border-[#D7EAF2] text-[#486581] hover:border-[#0868B9]/40 hover:bg-[#F8FDFF]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        currentResponse === true
                          ? 'border-[#0868B9] bg-[#0868B9] text-white shadow-2xs'
                          : 'border-[#CBD5E1] bg-white group-hover:border-[#0868B9]/50'
                      }`}
                    >
                      {currentResponse === true && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <span className="text-[16px] sm:text-[17px] font-bold font-sans block leading-tight">
                        Yes
                      </span>
                      <span className="text-[11px] sm:text-[12px] font-sans text-[#8FA3B8] group-hover:text-[#55718F]">
                        Symptom present
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom Navigation Area: Back & Next / Complete Questionnaire ── */}
        <div className="pt-5 border-t border-[#E8F1F5] flex items-center justify-between gap-3">
          {/* Back Button (Disabled on Question 1) */}
          <button
            type="button"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            aria-label="Previous question"
            className={`min-h-[46px] sm:min-h-[50px] px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-[14px] font-semibold font-sans uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              currentQuestionIndex === 0
                ? 'opacity-35 cursor-not-allowed bg-[#F5FBFD] border border-[#E2EEF5] text-[#8FA3B8]'
                : 'bg-[#F5FBFD] hover:bg-[#E8F4F8] border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>

          {/* Next / Complete Questionnaire Button */}
          <div className="flex items-center">
            <AnimatePresence mode="wait">
              {isCurrentAnswered ? (
                currentQuestionIndex === initialQuestions.length - 1 ? (
                  <motion.button
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    type="button"
                    onClick={handleCompleteQuestionnaire}
                    disabled={!allAnswered}
                    className="min-h-[46px] sm:min-h-[50px] px-6 sm:px-9 py-2.5 sm:py-3 rounded-full font-sans font-semibold text-xs sm:text-[14px] uppercase tracking-wider text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-md shadow-sky-500/25 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
                    <span>Complete Questionnaire</span>
                  </motion.button>
                ) : (
                  <motion.button
                    key="next"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    type="button"
                    onClick={handleNextQuestion}
                    className="min-h-[46px] sm:min-h-[50px] px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-sans font-semibold text-xs sm:text-[14px] uppercase tracking-wider text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
                  </motion.button>
                )
              ) : (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs sm:text-[13px] font-sans font-medium text-[#8FA3B8] italic py-2 px-3"
                >
                  Select an answer to proceed
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="The ADAM Questionnaire"
        icon={ShieldTick}
        accentColor="blue"
      >
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#F0F8FF] border border-[#BAE6FD]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#0868B9] block mb-1">
            Clinical Screening Tool
          </span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            The Androgen Deficiency in the Aging Male (ADAM) questionnaire is a clinically established 10-item screening tool designed to identify subjective symptoms of hormonal and vitality decline.
          </p>
        </div>

        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#073B72] block">
            Clinical Context:
          </span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            In clinical medicine (Morley et al., 2000), a positive screening is noted if question 1 (libido) or question 7 (erections) is positive, or if any 3 other questions are positive.
          </p>
          <p className="text-[12px] sm:text-[13px] text-[#0868B9] font-medium leading-relaxed border-t border-[#D7EAF2] pt-2">
            ADAM is an epidemiological screening aid, not a definitive diagnosis. Diagnosis requires physician evaluation and morning serum testosterone tests.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};

export default MaleStep3SymptomsADAM;
