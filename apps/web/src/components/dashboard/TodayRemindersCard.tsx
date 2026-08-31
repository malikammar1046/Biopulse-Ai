import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, Pill, Droplets, Footprints, Calendar, Plus } from 'lucide-react';
import type { TodayReminder } from '../../types/dashboard';
import { ROUTES } from '../../constants/routes';

interface RemindersCardProps {
  reminders: TodayReminder[];
  onToggle: (id: string) => void;
  onAddReminder?: () => void;
}

export const TodayRemindersCard: React.FC<RemindersCardProps> = ({
  reminders,
  onToggle,
  onAddReminder,
}) => {
  const getCategoryIcon = (cat: TodayReminder['category']) => {
    switch (cat) {
      case 'medication':
        return <Pill className="w-3.5 h-3.5 text-[#FB7185]" />;
      case 'hydration':
        return <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />;
      case 'fitness':
        return <Footprints className="w-3.5 h-3.5 text-[#34D399]" />;
      case 'cycle':
      default:
        return <Calendar className="w-3.5 h-3.5 text-[#8E3EAF]" />;
    }
  };

  const completedCount = reminders.filter((r) => r.completed).length;

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Clock className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            Today’s Reminders
          </h3>
        </div>

        <span className="text-xs font-mono font-bold text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
          {completedCount} / {reminders.length} Done
        </span>
      </div>

      {/* Interactive Reminders Checklist */}
      <div className="space-y-2.5 flex-1">
        {reminders.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center space-y-2">
            <p className="text-xs font-semibold text-[#584B68]">
              No active health reminders scheduled for today.
            </p>
            <button
              type="button"
              onClick={onAddReminder}
              className="text-xs text-[#6E2D8B] font-bold hover:underline"
            >
              + Add first reminder
            </button>
          </div>
        ) : (
          reminders.map((rem) => {
            const isDone = rem.completed;
            return (
              <div
                key={rem.id}
                onClick={() => onToggle(rem.id)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-[#F8F5FA] border-[#E7DFEF] opacity-65'
                    : 'bg-white hover:bg-[#FDF2F8]/40 border-[#E7DFEF] hover:border-[#FB7185]/40 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-[#F2ECF7] shrink-0">
                    {getCategoryIcon(rem.category)}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-bold block truncate ${
                        isDone ? 'line-through text-[#8D7E9E]' : 'text-[#1C1326]'
                      }`}
                    >
                      {rem.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#8D7E9E]">
                      {rem.time}
                    </span>
                  </div>
                </div>

                {/* Checkbox Trigger */}
                <button
                  type="button"
                  className="shrink-0 p-1 text-[#8E3EAF] hover:scale-110 transition-transform cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[#34D399] fill-[#ECFDF5]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#D8B4FE]" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Add/View Action */}
      <div className="pt-3 border-t border-[#F0EAF5] flex items-center justify-between">
        <Link
          to={ROUTES.APP.MEDICATIONS}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors"
        >
          <span>Manage Medicines →</span>
        </Link>

        <button
          type="button"
          onClick={onAddReminder}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#8D7E9E] hover:text-[#1C1326] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Custom</span>
        </button>
      </div>
    </div>
  );
};
