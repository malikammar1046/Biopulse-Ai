import React from 'react';
import { Sparkles, Plus, Activity, Moon, Droplets, Flame, Smile, HelpCircle } from 'lucide-react';
import { SYMPTOM_CATALOG, type SymptomDefinition } from '../../types/symptom';

interface TodayCheckInCardProps {
  onSelectSymptom: (symptom: SymptomDefinition) => void;
  onOpenGeneralModal: () => void;
  loggedTodayCount: number;
}

export const TodayCheckInCard: React.FC<TodayCheckInCardProps> = ({
  onSelectSymptom,
  onOpenGeneralModal,
  loggedTodayCount,
}) => {
  // Select 6 common quick-check-in symptoms
  const quickSymptoms = SYMPTOM_CATALOG.filter((s) =>
    ['cramps', 'fatigue', 'acne', 'bloating', 'mood_changes', 'headache'].includes(s.id)
  );

  const getQuickIcon = (id: string) => {
    switch (id) {
      case 'cramps':
        return <Sparkles className="w-3.5 h-3.5 text-[#0288D1]" />;
      case 'fatigue':
        return <Moon className="w-3.5 h-3.5 text-[#0288D1]" />;
      case 'acne':
        return <Activity className="w-3.5 h-3.5 text-[#0288D1]" />;
      case 'bloating':
        return <Droplets className="w-3.5 h-3.5 text-[#0288D1]" />;
      case 'mood_changes':
        return <Smile className="w-3.5 h-3.5 text-[#0288D1]" />;
      case 'headache':
      default:
        return <Flame className="w-3.5 h-3.5 text-[#0288D1]" />;
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs text-left select-none relative overflow-hidden space-y-6">
      {/* Header Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0288D1] text-xs font-mono font-bold border border-[#BAE6FD]">
            <Sparkles className="w-3.5 h-3.5 text-[#0288D1]" />
            <span>Daily Check-In</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
            How are you feeling today?
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-sans leading-relaxed">
            Track symptoms over time so you can better understand your personal patterns and clinical rhythms.
          </p>
        </div>

        {/* Status indicator */}
        <div className="shrink-0 flex items-center gap-2">
          {loggedTodayCount > 0 ? (
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {loggedTodayCount} logged today
            </span>
          ) : (
            <span className="text-xs font-mono text-[#64748B] bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-[#E2E8F0]">
              No check-in yet today
            </span>
          )}
        </div>
      </div>

      {/* Quick-Tap Symptom Grid */}
      <div className="relative z-10 space-y-2.5 pt-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] block">
          Quick Check-In (Tap to log):
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickSymptoms.map((symptom) => (
            <button
              key={symptom.id}
              type="button"
              onClick={() => onSelectSymptom(symptom)}
              className="p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#E0F2FE] border border-[#E2E8F0] hover:border-[#BAE6FD] shadow-xs transition-all duration-200 text-left flex flex-col justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-xl bg-white border border-[#E2E8F0] group-hover:border-[#BAE6FD] transition-colors">
                  {getQuickIcon(symptom.id)}
                </div>
                <span className="text-[10px] font-mono text-[#64748B] group-hover:text-[#0288D1] transition-colors">
                  + Add
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0288D1] block truncate transition-colors">
                  {symptom.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Custom Action */}
      <div className="relative z-10 pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <HelpCircle className="w-3.5 h-3.5 text-[#0288D1]" />
          <span>Experiencing something else? You can record any symptom.</span>
        </div>

        <button
          type="button"
          onClick={onOpenGeneralModal}
          className="px-5 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Log Any Symptom</span>
        </button>
      </div>
    </div>
  );
};
