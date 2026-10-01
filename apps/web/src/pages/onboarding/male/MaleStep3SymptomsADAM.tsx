import React, { useMemo, useState } from 'react';
import {
  ActivityHeart,
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
}

export const MaleStep3SymptomsADAM: React.FC<MaleStep3Props> = ({ data, onChange }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const initialQuestions = useMemo(() => getInitialADAMQuestions().questions, []);

  // Hydrate responses from data.adamResponses or fallback to clinical fields
  const responses: Record<string, boolean | null> = useMemo(() => {
    const existing = { ...(data.adamResponses || {}) };

    // Fallback sync from existing profile fields if adamResponses was uninitialized
    if (existing.adam_q1 === undefined && data.sexDrive) {
      existing.adam_q1 = data.sexDrive === 'reduced' || data.sexDrive === 'significantly_reduced';
    }
    if (existing.adam_q2 === undefined && data.energyLevel) {
      existing.adam_q2 = data.energyLevel === 'low' || data.energyLevel === 'very_low';
    }
    if (existing.adam_q3 === undefined && data.muscleStrengthChanges) {
      existing.adam_q3 = data.muscleStrengthChanges === 'reduced' || data.muscleStrengthChanges === 'significantly_reduced';
    }
    if (existing.adam_q7 === undefined && data.erectileDifficulties) {
      existing.adam_q7 = data.erectileDifficulties === 'occasional' || data.erectileDifficulties === 'frequent';
    }
    if (existing.adam_q9 === undefined && data.sleepQuality) {
      existing.adam_q9 = data.sleepQuality === 'poor' || data.sleepQuality === 'frequently_waking';
    }

    return existing;
  }, [data]);

  const answeredCount = Object.values(responses).filter((v) => v !== null && v !== undefined).length;
  const yesCount = Object.values(responses).filter((v) => v === true).length;
  const allAnswered = answeredCount === initialQuestions.length;

  const handleAnswer = (questionId: string, answer: boolean) => {
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

  const handleMarkAllRemainingNo = () => {
    const updatedResponses = { ...responses };
    initialQuestions.forEach((q) => {
      if (updatedResponses[q.id] === undefined || updatedResponses[q.id] === null) {
        updatedResponses[q.id] = false;
      }
    });

    const updatedYesCount = Object.values(updatedResponses).filter((v) => v === true).length;

    onChange({
      ...data,
      adamResponses: updatedResponses,
      adamScore: updatedYesCount,
    });
  };

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DDEFFD] flex items-center justify-center shrink-0 shadow-2xs">
            <ActivityHeart className="w-5 h-5 text-[#0868B9]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#0868B9] uppercase tracking-wider block leading-none">
              Vitality &amp; ADAM Questionnaire
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              Tell us about your energy and symptoms
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger
          onClick={() => setShowWhyModal(true)}
          label="About ADAM"
          accentColor="blue"
        />
      </div>

      <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
        Answer the 10 validated ADAM (Androgen Deficiency in the Aging Male) questions below to calibrate your Tier 1 screening.
      </p>

      {/* ── Progress Counter & Quick Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0868B9]" />
          <span className="text-[14px] sm:text-[15px] font-bold text-[#073B72]">
            {answeredCount} of {initialQuestions.length} Questions Answered
          </span>
          {yesCount > 0 && (
            <span className="text-[13px] font-medium text-[#55718F]">
              ({yesCount} positive indicator{yesCount > 1 ? 's' : ''})
            </span>
          )}
        </div>

        {!allAnswered && (
          <button
            type="button"
            onClick={handleMarkAllRemainingNo}
            className="text-[13px] sm:text-[14px] font-semibold text-[#0868B9] hover:text-[#07589D] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <CheckCircle className="w-4 h-4 text-[#0868B9]" aria-hidden="true" />
            <span>Mark remaining as "No"</span>
          </button>
        )}
      </div>

      {/* ── Main Questions List (Full Width) ── */}
      <div className="space-y-3 sm:space-y-3.5">
          {initialQuestions.map((q) => {
            const currentResponse = responses[q.id];
            const isAnswered = currentResponse !== undefined && currentResponse !== null;

            return (
              <div
                key={q.id}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 ${
                  isAnswered
                    ? currentResponse === true
                      ? 'bg-[#F0F8FF] border-2 border-[#0868B9]/60 shadow-2xs'
                      : 'bg-white border-[#D7EAF2]'
                    : 'bg-white border-[#D7EAF2] hover:border-[#0868B9]/40 hover:bg-[#F8FDFF]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] sm:text-[13px] font-mono font-bold text-[#0868B9]">
                        Question {q.questionNumber}
                      </span>
                      {q.isCriticalQuestion && (
                        <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold uppercase">
                          Primary Clinical Indicator
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] sm:text-[16px] font-sans text-[#073B72] font-semibold leading-snug">
                      {q.prompt}
                    </p>
                  </div>

                  {/* Yes / No Toggle Controls */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleAnswer(q.id, false)}
                      className={`min-w-[84px] sm:min-w-[92px] min-h-[48px] px-5 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        currentResponse === false
                          ? 'bg-[#073B72] text-white shadow-xs'
                          : 'bg-white border-2 border-[#D7EAF2] text-[#55718F] hover:border-[#073B72]/40 hover:text-[#073B72]'
                      }`}
                    >
                      {currentResponse === false && (
                        <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      )}
                      <span>No</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAnswer(q.id, true)}
                      className={`min-w-[84px] sm:min-w-[92px] min-h-[48px] px-5 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        currentResponse === true
                          ? 'bg-[#0868B9] text-white shadow-xs'
                          : 'bg-white border-2 border-[#D7EAF2] text-[#55718F] hover:border-[#0868B9]/40 hover:text-[#0868B9]'
                      }`}
                    >
                      {currentResponse === true && (
                        <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      )}
                      <span>Yes</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
          <span className="font-bold text-[14px] sm:text-[15px] text-[#0868B9] block mb-1">Clinical Screening Tool</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            The Androgen Deficiency in the Aging Male (ADAM) questionnaire is a clinically established 10-item screening tool designed to identify subjective symptoms of hormonal and vitality decline.
          </p>
        </div>

        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#073B72] block">Clinical Context:</span>
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
