import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Play, InfoCircle, ActivityHeart } from '@untitledui/icons';
import type { SuggestedMovementRoutine } from '../../types/fitness';

interface SuggestedRoutinesSectionProps {
  phaseName: string;
  routines: SuggestedMovementRoutine[];
  onQuickComplete: (routine: SuggestedMovementRoutine) => void;
  onOpenRoutineDetail?: (routine: SuggestedMovementRoutine) => void;
  isMale?: boolean;
}

export const SuggestedRoutinesSection: React.FC<SuggestedRoutinesSectionProps> = ({
  phaseName,
  routines,
  onQuickComplete,
  isMale,
}) => {
  const accentColor = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';

  return (
    <div className="space-y-4 text-left select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ActivityHeart className={`w-5 h-5 shrink-0 ${accentColor}`} aria-hidden="true" />
          <h2 className={`text-lg font-bold font-display ${isMale ? 'text-[#01579B]' : 'text-[#0F172A]'}`}>
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
            className={`p-6 rounded-2xl bg-white border transition-all flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden ${
              routine.isCompletedToday
                ? 'border-[#A7F3D0] bg-[#F0FDF4]'
                : isMale
                ? 'border-[#BAE6FD] hover:border-[#0288D1]'
                : 'border-[#EAECF0] hover:border-[rgba(244,63,125,0.3)]'
            }`}
          >
            {/* Top Status Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold ${
                  isMale ? 'bg-[#E0F2FE] text-[#01579B]' : 'bg-[#FDE6EF] text-[#DC326C]'
                }`}>
                  {routine.intensity}
                </span>

                <span className={`text-xs font-mono font-bold flex items-center gap-1 ${
                  isMale ? 'text-[#0288D1]' : 'text-[#DC326C]'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {routine.durationMinutes} mins
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold font-display text-[#0F172A]">
                  {routine.title}
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-snug">
                  {routine.focus}
                </p>
              </div>
            </div>

            {/* Why this phase explanation */}
            <div className={`p-3.5 rounded-xl border text-xs text-[#64748B] space-y-1.5 ${
              isMale ? 'bg-[#F8FAFC] border-[#BAE6FD]/80' : 'bg-[#F8FAFC] border-[#EAECF0]'
            }`}>
              <span className={`text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                isMale ? 'text-[#01579B]' : 'text-[#DC326C]'
              }`}>
                <InfoCircle className={`w-3 h-3 ${accentColor}`} aria-hidden="true" />
                <span>Why this works for your rhythm</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                {routine.whyThisPhase}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[#EAECF0] flex items-center justify-between gap-2">
              {routine.isCompletedToday ? (
                <div className="w-full h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold font-sans flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                  <span>✓ Completed Today</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onQuickComplete(routine)}
                  className={`w-full h-10 rounded-xl text-white text-xs font-semibold font-sans shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
                  }`}
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
