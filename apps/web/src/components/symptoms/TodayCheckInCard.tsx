import React from 'react';
import { Plus, Activity, Moon01, Droplets01, ActivityHeart, FaceSmile, HelpCircle } from '@untitledui/icons';
import { getSymptomCatalog, type SymptomDefinition } from '../../types/symptom';

interface TodayCheckInCardProps {
  onSelectSymptom: (symptom: SymptomDefinition) => void;
  onOpenGeneralModal: () => void;
  loggedTodayCount: number;
  isMale?: boolean;
}

export const TodayCheckInCard: React.FC<TodayCheckInCardProps> = ({
  onSelectSymptom,
  onOpenGeneralModal,
  loggedTodayCount,
  isMale,
}) => {
  // Select 6 common quick-check-in symptoms (strictly pathway-isolated)
  const catalog = getSymptomCatalog(Boolean(isMale));
  const targetIds = isMale
    ? ['fatigue', 'low_energy', 'reduced_strength', 'reduced_libido', 'mood_changes', 'headache']
    : ['cramps', 'fatigue', 'acne', 'bloating', 'mood_changes', 'headache'];

  const quickSymptoms = catalog.filter((s) => targetIds.includes(s.id));

  const getQuickIcon = (id: string) => {
    const iconColor = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';
    switch (id) {
      case 'cramps':
        return <ActivityHeart className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />;
      case 'fatigue':
        return <Moon01 className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />;
      case 'low_energy':
      case 'reduced_strength':
      case 'reduced_libido':
      case 'acne':
        return <Activity className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />;
      case 'bloating':
        return <Droplets01 className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />;
      case 'mood_changes':
        return <FaceSmile className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />;
      case 'headache':
      default:
        return <ActivityHeart className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />;
    }
  };


  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EAECF0] shadow-xs text-left select-none relative overflow-hidden space-y-6">
      {/* Header Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isMale
              ? 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
              : 'bg-[#FDE6EF] text-[#DC326C] border-[rgba(244,63,125,0.2)]'
          }`}>
            <Activity className={`w-3.5 h-3.5 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`} aria-hidden="true" />
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
            <span className="text-xs font-mono text-[#64748B] bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-[#EAECF0]">
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
              className={`p-3 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] shadow-xs transition-all duration-200 text-left flex flex-col justify-between gap-2 cursor-pointer group ${
                isMale
                  ? 'hover:bg-[#E0F2FE] hover:border-[#BAE6FD]'
                  : 'hover:bg-[#FDE6EF]/40 hover:border-[rgba(244,63,125,0.3)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg bg-white border border-[#EAECF0] transition-colors ${
                  isMale ? 'group-hover:border-[#BAE6FD]' : 'group-hover:border-[rgba(244,63,125,0.3)]'
                }`}>
                  {getQuickIcon(symptom.id)}
                </div>
                <span className={`text-[10px] font-mono text-[#64748B] transition-colors ${
                  isMale ? 'group-hover:text-[#0288D1]' : 'group-hover:text-[#DC326C]'
                }`}>
                  + Add
                </span>
              </div>
              <div>
                <span className={`text-xs font-bold text-[#0F172A] block truncate transition-colors ${
                  isMale ? 'group-hover:text-[#0288D1]' : 'group-hover:text-[#DC326C]'
                }`}>
                  {symptom.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Custom Action */}
      <div className="relative z-10 pt-3 border-t border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <HelpCircle className={`w-3.5 h-3.5 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`} />
          <span>Experiencing something else? You can record any symptom.</span>
        </div>

        <button
          type="button"
          onClick={onOpenGeneralModal}
          className={`h-10 px-4 rounded-xl font-medium text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Log Any Symptom</span>
        </button>
      </div>
    </div>
  );
};
