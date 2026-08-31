import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, Trash2, Edit2, Calendar, CheckCircle2 } from 'lucide-react';
import type { FitnessLogEntry } from '../../types/fitness';

interface RecentActivitiesListProps {
  logs: FitnessLogEntry[];
  onOpenLogModal: () => void;
  onEditActivity: (entry: FitnessLogEntry) => void;
  onDeleteActivity: (id: string) => void;
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
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm select-none text-left space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            Logged Activities ({logs.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenLogModal}
          className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Activity</span>
        </button>
      </div>

      {logs.length > 0 ? (
        <div className="divide-y divide-[#F5F0FA] border border-[#E7DFEF] rounded-2xl overflow-hidden bg-white">
          {logs.map((log) => {
            const emoji = ACTIVITY_EMOJIS[log.activityType] || '⭐';
            const energy = log.energyLevel ? ENERGY_LABELS[log.energyLevel] : undefined;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5FF] transition-all"
              >
                {/* Left info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{emoji}</span>
                    <span className="text-xs font-bold text-[#1C1326]">
                      {log.activityName}
                    </span>
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-[#EDE4F7] text-[#6E2D8B]">
                      {log.activityType.replace('_', ' ')}
                    </span>
                    {energy && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F8F5FA] text-[#584B68] border border-[#E7DFEF]">
                        {energy.emoji} {energy.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#8D7E9E] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#8E3EAF]" />
                      <span>{log.occurredAt}</span>
                    </span>
                    {log.notes && <span>• Note: {log.notes}</span>}
                  </div>
                </div>

                {/* Right duration & actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-[#6E2D8B] bg-[#EDE4F7]/60 px-3 py-1 rounded-xl">
                    {log.durationMinutes} min
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditActivity(log)}
                      className="p-1.5 rounded-lg text-[#8D7E9E] hover:text-[#6E2D8B] hover:bg-[#EDE4F7] transition-colors cursor-pointer"
                      title="Edit activity"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteActivity(log.id)}
                      className="p-1.5 rounded-lg text-[#8D7E9E] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                      title="Delete activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#D8B4FE] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center mx-auto">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold font-display text-[#1C1326]">
              Your movement journey starts here.
            </h4>
            <p className="text-xs text-[#584B68] leading-relaxed">
              Log your first activity and OvaSense will start building your weekly picture.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenLogModal}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white text-xs font-bold shadow-sm hover:brightness-110 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </button>
        </div>
      )}
    </div>
  );
};
