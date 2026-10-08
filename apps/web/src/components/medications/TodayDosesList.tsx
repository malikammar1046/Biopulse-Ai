import React from 'react';
import { motion } from 'framer-motion';
import { MedicalCross, CheckCircle, Clock, XCircle, RefreshCcw01, Plus } from '@untitledui/icons';
import type { ScheduledDoseItem } from '../../types/medication';

interface TodayDosesListProps {
  doses: ScheduledDoseItem[];
  onMarkTaken: (dose: ScheduledDoseItem) => void;
  onMarkSkipped: (dose: ScheduledDoseItem) => void;
  onResetDose: (dose: ScheduledDoseItem) => void;
  onOpenAddModal: () => void;
  isMale?: boolean;
}

export const TodayDosesList: React.FC<TodayDosesListProps> = ({
  doses,
  onMarkTaken,
  onMarkSkipped,
  onResetDose,
  onOpenAddModal,
  isMale,
}) => {
  const accentColor = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';

  return (
    <div className="space-y-4 text-left select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock className={`w-5 h-5 ${accentColor}`} aria-hidden="true" />
          <h2 className="text-lg font-bold font-display text-[#0F172A]">
            Today's Scheduled Doses ({doses.length})
          </h2>
        </div>

        <span className="text-xs font-mono text-[#64748B]">
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
                className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden ${
                  isTaken
                    ? 'bg-[#F0FDF4] border-[#A7F3D0]'
                    : isSkipped
                    ? 'bg-[#FEF2F2] border-[#FECACA]'
                    : isMale
                    ? 'bg-white border-[#BAE6FD] hover:border-[#0288D1]'
                    : 'bg-white border-[#EAECF0] hover:border-[rgba(244,63,125,0.3)]'
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
                        : isMale
                        ? 'bg-[#F0F9FF] text-[#0288D1]'
                        : 'bg-[#FDE6EF] text-[#DC326C]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{dose.timeDisplay}</span>
                  </span>

                  <span className="text-[11px] font-mono text-[#64748B] capitalize">
                    {dose.frequency.replace('_', ' ')}
                  </span>
                </div>

                {/* Main Medicine Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MedicalCross
                      className={`w-4 h-4 shrink-0 ${
                        isTaken ? 'text-[#15803D]' : isSkipped ? 'text-[#B91C1C]' : accentColor
                      }`}
                      aria-hidden="true"
                    />
                    <h3 className="text-base font-bold font-display text-[#0F172A]">
                      {dose.medicationName}
                    </h3>
                  </div>

                  <p className={`text-xs font-mono font-bold ${isMale ? 'text-[#0369A1]' : 'text-[#DC326C]'}`}>
                    Dose: {dose.dose} {dose.unit}
                  </p>

                  {dose.notes && (
                    <p className="text-[11px] text-[#475569] leading-tight pt-1">
                      💡 {dose.notes}
                    </p>
                  )}
                </div>

                {/* Status Indicator & Action Buttons */}
                <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-between gap-2">
                  {isTaken && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#15803D]">
                        <CheckCircle className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                        <span>Taken {dose.takenAtDisplay ? `at ${dose.takenAtDisplay}` : 'today'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onResetDose(dose)}
                        className="text-[11px] font-mono text-[#64748B] hover:text-[#0F172A] underline flex items-center gap-1 cursor-pointer"
                        title="Change dose status"
                        aria-label="Change dose status"
                      >
                        <RefreshCcw01 className="w-3 h-3" aria-hidden="true" />
                        <span>Undo</span>
                      </button>
                    </div>
                  )}

                  {isSkipped && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#B91C1C]">
                        <XCircle className="w-4 h-4 text-[#B91C1C]" aria-hidden="true" />
                        <span>Skipped today</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onResetDose(dose)}
                        className="text-[11px] font-mono text-[#64748B] hover:text-[#0F172A] underline flex items-center gap-1 cursor-pointer"
                        title="Change dose status"
                        aria-label="Change dose status"
                      >
                        <RefreshCcw01 className="w-3 h-3" aria-hidden="true" />
                        <span>Undo</span>
                      </button>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => onMarkTaken(dose)}
                        className={`flex-1 h-10 rounded-xl text-white text-xs font-semibold font-sans shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Take now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onMarkSkipped(dose)}
                        className="h-10 px-3.5 rounded-xl border border-[#EAECF0] hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-semibold transition-all cursor-pointer"
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
        <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#EAECF0] text-center space-y-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
            isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'
          }`}>
            <MedicalCross className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold font-display text-[#0F172A]">
              Nothing added yet.
            </h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              Add your medicines so BioPulse AI can help you keep track of your daily schedule.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className={`h-10 px-4 rounded-xl text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add medicine</span>
          </button>
        </div>
      )}
    </div>
  );
};
