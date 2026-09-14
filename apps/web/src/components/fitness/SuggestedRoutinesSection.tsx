import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, CheckCircle2, Play, Info } from 'lucide-react';
import type { SuggestedMovementRoutine } from '../../types/fitness';

interface SuggestedRoutinesSectionProps {
  phaseName: string;
  routines: SuggestedMovementRoutine[];
  onQuickComplete: (routine: SuggestedMovementRoutine) => void;
  onOpenRoutineDetail?: (routine: SuggestedMovementRoutine) => void;
}

export const SuggestedRoutinesSection: React.FC<SuggestedRoutinesSectionProps> = ({
  phaseName,
  routines,
  onQuickComplete,
}) => {
  return (
    <div className="space-y-4 text-left select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold font-display text-[#01579B]">
            Suggested for Today ({phaseName})
          </h2>
        </div>

        <span className="text-xs font-mono text-[#64748B]">
          Low-Stress Movement
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {routines.map((routine, idx) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-6 rounded-[28px] bg-white border transition-all flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden ${
              routine.isCompletedToday
                ? 'border-[#A7F3D0] bg-[#F0FDF4]'
                : 'border-[#BAE6FD] hover:border-[#0288D1]'
            }`}
          >
            {/* Top Status Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-[#E0F2FE] text-[#01579B]">
                  {routine.intensity}
                </span>

                <span className="text-xs font-mono font-bold text-[#0288D1] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {routine.durationMinutes} mins
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold font-display text-[#0F172A]">
                  {routine.title}
                </h3>
                <p className="text-xs text-[#475569] mt-1 leading-snug">
                  {routine.focus}
                </p>
              </div>
            </div>

            {/* Why this phase explanation */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-xs text-[#475569] space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#01579B] flex items-center gap-1">
                <Info className="w-3 h-3 text-[#0288D1]" />
                <span>Why this works for your rhythm</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                {routine.whyThisPhase}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
              {routine.isCompletedToday ? (
                <div className="w-full py-2.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold font-sans flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>✓ Completed Today</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onQuickComplete(routine)}
                  className="w-full py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start / Log Movement</span>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
