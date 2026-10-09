import React from 'react';
import { MessageChatCircle, Calendar, Activity, LineChartUp01, Download01 } from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

interface TimelineHeaderProps {
  totalEvents: number;
  filteredEventsCount: number;
  onOpenAiInsights?: () => void;
  onExportPdf?: () => void;
  isFemale?: boolean;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  totalEvents,
  filteredEventsCount,
  onOpenAiInsights,
  onExportPdf,
  isFemale: isFemaleProp,
}) => {
  const { userProfile, cycleStats } = useUserHealth();
  const isFemale =
    isFemaleProp !== undefined
      ? isFemaleProp
      : resolvePathway(userProfile?.gender, userProfile?.pathway) === 'female';

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
    <div className="rounded-2xl bg-white border border-[#EAECF0] p-5 sm:p-6 shadow-xs select-none text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Metadata Badges */}
        <div className="space-y-2.5 max-w-2xl">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
              isFemale
                ? 'bg-[#FDE6EF] border border-[#F43F7D]/30 text-[#BE185D]'
                : 'bg-[#F0F9FF] border border-[#BAE6FD] text-[#0288D1]'
            }`}
          >
            <LineChartUp01 className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
            <span>Unified Longitudinal Journey</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-semibold text-[#344054]">
              <Calendar className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
              <span>Day {currentCycleDay} • {currentPhase}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-semibold text-[#344054]">
              <Activity className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
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
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[#EAECF0] text-[#111318] hover:bg-[#F9FAFB] text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <Download01 className={`w-4 h-4 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
              <div className="text-left">
                <span className="block font-bold leading-tight">Download Journey</span>
                <span className="block text-[10px] text-[#64748B] font-normal leading-tight">Doctor-ready PDF</span>
              </div>
            </button>
          )}

          {onOpenAiInsights && (
            <button
              type="button"
              onClick={onOpenAiInsights}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                isFemale
                  ? 'bg-[#F43F7D] hover:bg-[#E11D48]'
                  : 'bg-[#0288D1] hover:bg-[#0277BD]'
              }`}
            >
              <MessageChatCircle className="w-4 h-4 text-white" aria-hidden="true" />
              <span>Ask AI Patterns</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
