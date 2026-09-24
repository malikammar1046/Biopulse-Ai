import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XClose, CheckCircle, ShieldTick, ClipboardCheck } from '@untitledui/icons';
import type { ADAMQuestionnaireState } from '../../types/adaptiveScreening';
import { getInitialADAMQuestions } from '../../services/adaptiveProfileService';

interface ADAMQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (state: ADAMQuestionnaireState) => void;
  initialState?: ADAMQuestionnaireState;
}

export const ADAMQuestionnaireModal: React.FC<ADAMQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialState,
}) => {
  const [state, setState] = useState<ADAMQuestionnaireState>(
    initialState || getInitialADAMQuestions()
  );

  if (!isOpen) return null;

  const handleAnswer = (questionId: string, answer: boolean) => {
    setState((prev) => {
      const updatedQuestions = prev.questions.map((q) =>
        q.id === questionId ? { ...q, response: answer } : q
      );
      const completedCount = updatedQuestions.filter((q) => q.response !== null).length;
      const yesResponsesCount = updatedQuestions.filter((q) => q.response === true).length;
      const hasCriticalYes = updatedQuestions.some(
        (q) => q.isCriticalQuestion && q.response === true
      );

      const status =
        completedCount === updatedQuestions.length
          ? 'completed'
          : completedCount > 0
          ? 'partial'
          : 'not_started';

      return {
        questions: updatedQuestions,
        completedCount,
        yesResponsesCount,
        hasCriticalYes,
        status,
      };
    });
  };

  const handleComplete = () => {
    onSave(state);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none text-left overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#10071A]/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] bg-white border border-[#BAE6FD] text-[#0F172A] shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* ── Top Header ──────────────────────────────────────────────── */}
          <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between gap-4 bg-white">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono text-[#01579B] font-bold">
                <ClipboardCheck className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                <span>Standardized Screening Instrument</span>
              </div>
              <h3 className="text-xl font-bold font-display text-[#01579B]">
                ADAM Questionnaire (Tier 1 Screening)
              </h3>
              <p className="text-xs text-[#475569]">
                The Androgen Deficiency in the Aging Male (ADAM) questionnaire captures self-reported physical and vitality symptoms.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#475569] hover:text-[#01579B] transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <XClose className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* ── Clinical Safety Notice ──────────────────────────────────── */}
          <div className="px-6 py-2.5 bg-[#F0F9FF] border-b border-[#BAE6FD] text-xs text-[#0369A1] flex items-center gap-2">
            <ShieldTick className="w-4 h-4 text-[#0284C7] shrink-0" aria-hidden="true" />
            <span>
              <strong>Clinical Guardrail:</strong> This questionnaire is a self-reported screening instrument. It does not provide or replace a medical diagnosis.
            </span>
          </div>

          {/* ── Scrollable Questions Body ───────────────────────────────── */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-[#F8FAFC]">
            {state.questions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-white border border-[#BAE6FD]/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#0288D1]">
                      Q{q.questionNumber}
                    </span>
                    {q.isCriticalQuestion && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 uppercase font-bold">
                        Primary Indicator
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-[#0F172A] leading-snug">
                    {q.prompt}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id, true)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      q.response === true
                        ? 'bg-[#0288D1] text-white shadow-xs'
                        : 'bg-[#F8FAFC] border border-[#BAE6FD]/80 text-[#475569] hover:text-[#01579B] hover:bg-[#E0F2FE]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id, false)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      q.response === false
                        ? 'bg-[#01579B] text-white shadow-xs'
                        : 'bg-[#F8FAFC] border border-[#BAE6FD]/80 text-[#475569] hover:text-[#01579B] hover:bg-[#E0F2FE]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Bottom Save Actions ─────────────────────────────────────── */}
          <div className="p-6 border-t border-[#E2E8F0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#475569] font-mono">
              Completed {state.completedCount} of {state.questions.length} questions
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E0F2FE] text-xs text-[#475569] hover:text-[#01579B] border border-[#BAE6FD] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="px-5 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                <span>Save to Tier 1 Profile</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
