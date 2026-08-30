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
        return <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />;
      case 'fatigue':
        return <Moon className="w-3.5 h-3.5 text-[#8E3EAF]" />;
      case 'acne':
        return <Activity className="w-3.5 h-3.5 text-[#A21CAF]" />;
      case 'bloating':
        return <Droplets className="w-3.5 h-3.5 text-[#FB7185]" />;
      case 'mood_changes':
        return <Smile className="w-3.5 h-3.5 text-[#8E3EAF]" />;
      case 'headache':
      default:
        return <Flame className="w-3.5 h-3.5 text-[#FB7185]" />;
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-white via-[#FDFBFD] to-[#F8F5FA] border border-[#E7DFEF] shadow-sm text-left select-none relative overflow-hidden space-y-6">
      {/* Background Decorative Ambient Aura */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#EDE4F7]/70 via-[#FDF2F8]/40 to-transparent rounded-full blur-2xl pointer-events-none -z-0" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Daily Check-In</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
            How are you feeling today?
          </h2>
          <p className="text-xs sm:text-sm text-[#584B68] font-sans leading-relaxed">
            Track symptoms over time so you can better understand your personal patterns and cycle rhythms.
          </p>
        </div>

        {/* Status indicator */}
        <div className="shrink-0 flex items-center gap-2">
          {loggedTodayCount > 0 ? (
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]/60 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              {loggedTodayCount} logged today
            </span>
          ) : (
            <span className="text-xs font-mono text-[#8D7E9E] bg-[#F8F5FA] px-3 py-1.5 rounded-full border border-[#E7DFEF]">
              No check-in yet today
            </span>
          )}
        </div>
      </div>

      {/* Quick-Tap Symptom Grid */}
      <div className="relative z-10 space-y-2.5 pt-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D7E9E] block">
          Quick Check-In (Tap to log):
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickSymptoms.map((symptom) => (
            <button
              key={symptom.id}
              type="button"
              onClick={() => onSelectSymptom(symptom)}
              className="p-3 rounded-2xl bg-white hover:bg-[#FDF2F8]/60 border border-[#E7DFEF] hover:border-[#FB7185]/50 shadow-2xs hover:shadow-sm transition-all duration-200 text-left flex flex-col justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-xl bg-[#F8F5FA] group-hover:bg-white transition-colors">
                  {getQuickIcon(symptom.id)}
                </div>
                <span className="text-[10px] font-mono text-[#8D7E9E] group-hover:text-[#6E2D8B] transition-colors">
                  + Add
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#1C1326] group-hover:text-[#6E2D8B] block truncate transition-colors">
                  {symptom.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Custom Action */}
      <div className="relative z-10 pt-3 border-t border-[#F0EAF5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#584B68]">
          <HelpCircle className="w-3.5 h-3.5 text-[#8E3EAF]" />
          <span>Experiencing something else? You can record any symptom.</span>
        </div>

        <button
          type="button"
          onClick={onOpenGeneralModal}
          className="px-5 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md shadow-purple-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Log Any Symptom</span>
        </button>
      </div>
    </div>
  );
};
