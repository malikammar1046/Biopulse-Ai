import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

interface StickySaveBarProps {
  hasChanges: boolean;
  hasAssessmentChanges: boolean;
  isSaving: boolean;
  isMale: boolean;
  onDiscard: () => void;
  onSave: (withReassessment?: boolean) => void;
}

export const StickySaveBar: React.FC<StickySaveBarProps> = ({
  hasChanges,
  hasAssessmentChanges,
  isSaving,
  isMale,
  onDiscard,
  onSave,
}) => {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl px-5 py-3.5 shadow-2xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left info */}
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Unsaved Changes</span>
                  {hasAssessmentChanges && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                      Assessment impact
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {hasAssessmentChanges
                    ? 'Modifications will update your source screening model inputs'
                    : 'Changes will be saved to your health profile'}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onDiscard}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>

              <button
                type="button"
                onClick={() => onSave(false)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span>Save</span>
              </button>

              {hasAssessmentChanges && (
                <button
                  type="button"
                  onClick={() => onSave(true)}
                  disabled={isSaving}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer ${
                    isMale
                      ? 'bg-[#0E9EAA] hover:bg-[#0C8B96] shadow-[#0E9EAA]/25'
                      : 'bg-gradient-to-r from-[#0E9EAA] to-[#F43F7D] hover:brightness-110 shadow-[#0E9EAA]/20'
                  } disabled:opacity-50`}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>Save & Refresh Screening</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
