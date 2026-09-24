import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Plus, Calendar, Edit01, Trash01, ActivityHeart } from '@untitledui/icons';
import type { FitnessLogEntry } from '../../types/fitness';

interface RecentActivitiesListProps {
  logs: FitnessLogEntry[];
  onOpenLogModal: () => void;
  onEditActivity: (entry: FitnessLogEntry) => void;
  onDeleteActivity: (id: string) => void;
  isMale?: boolean;
}

const ACTIVITY_EMOJIS: Record<string, string> = {
  walking: '🚶‍♀️',
  strength: '🏋️‍♀️',
  yoga: '🧘‍♀️',
  stretching: '🤸‍♀️',
  cycling: '🚴‍♀️',
  low_impact_cardio: '🏃‍♀️',
  mobility: '✨',
  rest_recovery: '🌙',
  other: '⭐',
};

const ENERGY_LABELS: Record<string, { label: string; emoji: string }> = {
  low_energy: { label: 'Low Energy', emoji: '🥱' },
  okay: { label: 'Okay', emoji: '😐' },
  good: { label: 'Good Energy', emoji: '😊' },
  great: { label: 'Great Energy', emoji: '⚡' },
};

export const RecentActivitiesList: React.FC<RecentActivitiesListProps> = ({
  logs,
  onOpenLogModal,
  onEditActivity,
  onDeleteActivity,
  isMale,
}) => {
  const accentColor = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';

  return (
    <div className={`p-6 sm:p-8 rounded-2xl bg-white shadow-xs select-none text-left space-y-4 border ${
      isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CheckCircle className={`w-5 h-5 shrink-0 ${accentColor}`} aria-hidden="true" />
          <h3 className={`text-base font-bold font-display ${isMale ? 'text-[#01579B]' : 'text-[#0F172A]'}`}>
            Logged Activities ({logs.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenLogModal}
          className={`text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
            isMale ? 'text-[#0288D1] hover:text-[#01579B]' : 'text-[#DC326C] hover:text-[#B82558]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>+ Add Activity</span>
        </button>
      </div>

      {logs.length > 0 ? (
        <div className={`divide-y divide-[#EAECF0] border rounded-xl overflow-hidden bg-white ${
          isMale ? 'border-[#BAE6FD]/80' : 'border-[#EAECF0]'
        }`}>
          {logs.map((log) => {
            const emoji = ACTIVITY_EMOJIS[log.activityType] || '⭐';
            const energy = log.energyLevel ? ENERGY_LABELS[log.energyLevel] : undefined;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isMale ? 'hover:bg-[#F0F9FF]' : 'hover:bg-[#FDE6EF]/20'
                }`}
              >
                {/* Left info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{emoji}</span>
                    <span className="text-xs font-bold text-[#0F172A]">
                      {log.activityName}
                    </span>
                    <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md ${
                      isMale ? 'bg-[#E0F2FE] text-[#01579B]' : 'bg-[#FDE6EF] text-[#DC326C]'
                    }`}>
                      {log.activityType.replace('_', ' ')}
                    </span>
                    {energy && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#475569] border ${
                        isMale ? 'border-[#BAE6FD]/80' : 'border-[#EAECF0]'
                      }`}>
                        {energy.emoji} {energy.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#64748B] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className={`w-3 h-3 ${accentColor}`} aria-hidden="true" />
                      <span>{log.occurredAt}</span>
                    </span>
                    {log.notes && <span>• Note: {log.notes}</span>}
                  </div>
                </div>

                {/* Right duration & actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl ${
                    isMale ? 'text-[#01579B] bg-[#E0F2FE]' : 'text-[#DC326C] bg-[#FDE6EF]'
                  }`}>
                    {log.durationMinutes} min
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditActivity(log)}
                      className={`p-1.5 rounded-lg text-[#64748B] transition-colors cursor-pointer ${
                        isMale ? 'hover:text-[#01579B] hover:bg-[#E0F2FE]' : 'hover:text-[#F43F7D] hover:bg-[#FDE6EF]'
                      }`}
                      title="Edit activity"
                      aria-label="Edit activity"
                    >
                      <Edit01 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteActivity(log.id)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                      title="Delete activity"
                      aria-label="Delete activity"
                    >
                      <Trash01 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className={`p-8 rounded-2xl bg-[#F8FAFC] border border-dashed text-center space-y-3 ${
          isMale ? 'border-[#BAE6FD]' : 'border-[#EAECF0]'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
            isMale ? 'bg-[#E0F2FE] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'
          }`}>
            <ActivityHeart className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className={`text-sm font-bold font-display ${isMale ? 'text-[#01579B]' : 'text-[#0F172A]'}`}>
              Your movement journey starts here.
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Log your first activity and BioPulse AI will start building your weekly picture.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenLogModal}
            className={`h-10 px-4 rounded-xl text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log Activity</span>
          </button>
        </div>
      )}
    </div>
  );
};
