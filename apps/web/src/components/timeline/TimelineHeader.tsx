import React from 'react';
import { MessageChatCircle, Calendar, Activity, LineChartUp01, Download01 } from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';

interface TimelineHeaderProps {
  totalEvents: number;
  filteredEventsCount: number;
  onOpenAiInsights?: () => void;
  onExportPdf?: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  totalEvents,
  filteredEventsCount,
  onOpenAiInsights,
  onExportPdf,
}) => {
  const { userProfile, cycleStats } = useUserHealth();
  const userName = userProfile.fullName?.split(' ')[0] || 'Ayesha';

  const currentCycleDay = cycleStats?.currentCycleDay || userProfile.womensHealth?.currentCycleDay || 14;
  const currentPhase =
    cycleStats?.estimatedPhase?.displayName ||
    cycleStats?.estimatedPhase?.name ||
    (userProfile.womensHealth?.currentPhase
      ? userProfile.womensHealth.currentPhase.charAt(0).toUpperCase() +
        userProfile.womensHealth.currentPhase.slice(1) +
        ' Phase'
      : 'Follicular Phase');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#01579B] p-6 sm:p-7 text-white border border-[#0288D1] shadow-md select-none">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Title & Longitudinal Explainer */}
        <div className="space-y-3 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-mono text-white">
            <LineChartUp01 className="w-3.5 h-3.5 text-[#29B6F6]" aria-hidden="true" />
            <span>Unified Longitudinal Health Journey</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {userName}’s Health Timeline
          </h1>

          <p className="text-xs sm:text-sm text-[#E0F2FE] leading-relaxed">
            BIOPulse AI synthesizes your physiological rhythms, reported symptoms, nutrition, movement, lab biomarkers, and clinical consultations into one connected longitudinal story.
          </p>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 text-xs font-semibold text-white border border-white/20">
              <Calendar className="w-3.5 h-3.5 text-[#29B6F6]" aria-hidden="true" />
              <span>Day {currentCycleDay} • {currentPhase}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 text-xs font-semibold text-white border border-white/20">
              <Activity className="w-3.5 h-3.5 text-[#29B6F6]" aria-hidden="true" />
              <span>
                {filteredEventsCount} of {totalEvents} events shown
              </span>
            </div>
          </div>
        </div>

        {/* Right CTA Actions: Download Health Journey PDF & AI Explainer */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white text-[#01579B] hover:bg-[#F0F9FF] text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Download01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
              <div className="text-left">
                <span className="block font-bold leading-tight">Download Health Journey</span>
                <span className="block text-[10px] text-[#64748B] font-normal leading-tight">Doctor-ready summary</span>
              </div>
            </button>
          )}

          {onOpenAiInsights && (
            <button
              type="button"
              onClick={onOpenAiInsights}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#29B6F6] hover:bg-[#4FC3F7] text-[#0F172A] text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer"
            >
              <MessageChatCircle className="w-4 h-4 text-[#0F172A]" aria-hidden="true" />
              <span>Ask AI Patterns</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
