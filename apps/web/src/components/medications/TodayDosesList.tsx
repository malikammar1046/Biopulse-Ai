import React from 'react';
import { motion } from 'framer-motion';
import { Pill, CheckCircle2, Clock, XCircle, RotateCcw, Plus } from 'lucide-react';
import type { ScheduledDoseItem } from '../../types/medication';

interface TodayDosesListProps {
  doses: ScheduledDoseItem[];
  onMarkTaken: (dose: ScheduledDoseItem) => void;
  onMarkSkipped: (dose: ScheduledDoseItem) => void;
  onResetDose: (dose: ScheduledDoseItem) => void;
  onOpenAddModal: () => void;
}

export const TodayDosesList: React.FC<TodayDosesListProps> = ({
  doses,
  onMarkTaken,
  onMarkSkipped,
  onResetDose,
  onOpenAddModal,
}) => {
  return (
    <div className="space-y-4 text-left select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Clock className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold font-display text-[#1C1326]">
            Today's Scheduled Doses ({doses.length})
          </h2>
        </div>

        <span className="text-xs font-mono text-[#8D7E9E]">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {doses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doses.map((dose, idx) => {
            const isTaken = dose.status === 'taken';
            const isSkipped = dose.status === 'skipped';
            const isPending = dose.status === 'pending';

            return (
              <motion.div
                key={`${dose.medicationId}_${dose.scheduledTime}_${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-5 sm:p-6 rounded-[28px] border transition-all flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden ${
                  isTaken
                    ? 'bg-[#F0FDF4] border-[#A7F3D0]'
                    : isSkipped
                    ? 'bg-[#FEF2F2] border-[#FECACA]'
                    : 'bg-white border-[#E7DFEF] hover:border-[#D8B4FE]'
                }`}
              >
                {/* Top Row: Time Badge & Frequency */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      isTaken
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : isSkipped
                        ? 'bg-[#FEE2E2] text-[#B91C1C]'
                        : 'bg-[#EDE4F7] text-[#6E2D8B]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dose.timeDisplay}</span>
                  </span>

                  <span className="text-[11px] font-mono text-[#8D7E9E] capitalize">
                    {dose.frequency.replace('_', ' ')}
                  </span>
                </div>

                {/* Main Medicine Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Pill
                      className={`w-4 h-4 shrink-0 ${
                        isTaken ? 'text-[#15803D]' : isSkipped ? 'text-[#B91C1C]' : 'text-[#8E3EAF]'
                      }`}
                    />
                    <h3 className="text-base font-bold font-display text-[#1C1326]">
                      {dose.medicationName}
                    </h3>
                  </div>

                  <p className="text-xs font-mono font-bold text-[#6E2D8B]">
                    Dose: {dose.dose} {dose.unit}
                  </p>

                  {dose.notes && (
                    <p className="text-[11px] text-[#584B68] leading-tight pt-1">
                      💡 {dose.notes}
                    </p>
                  )}
                </div>

                {/* Status Indicator & Action Buttons */}
                <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                  {isTaken && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#15803D]">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                        <span>Taken {dose.takenAtDisplay ? `at ${dose.takenAtDisplay}` : 'today'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onResetDose(dose)}
                        className="text-[11px] font-mono text-[#8D7E9E] hover:text-[#1C1326] underline flex items-center gap-1 cursor-pointer"
                        title="Change dose status"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    </div>
                  )}

                  {isSkipped && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#B91C1C]">
                        <XCircle className="w-4 h-4 text-[#B91C1C]" />
                        <span>Skipped today</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onResetDose(dose)}
                        className="text-[11px] font-mono text-[#8D7E9E] hover:text-[#1C1326] underline flex items-center gap-1 cursor-pointer"
                        title="Change dose status"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => onMarkTaken(dose)}
                        className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 text-white text-xs font-bold font-sans shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Take now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onMarkSkipped(dose)}
                        className="px-3.5 py-2.5 rounded-2xl border border-[#E7DFEF] hover:bg-[#FFF1F2] text-[#E11D48] text-xs font-bold transition-all cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 rounded-[28px] bg-[#F8F5FA] border border-dashed border-[#D8B4FE] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center mx-auto">
            <Pill className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold font-display text-[#1C1326]">
              Nothing added yet.
            </h4>
            <p className="text-xs text-[#584B68] leading-relaxed">
              Add your medicines so OvaSense can help you keep track of your daily schedule.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white text-xs font-bold shadow-sm hover:brightness-110 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add medicine</span>
          </button>
        </div>
      )}
    </div>
  );
};
