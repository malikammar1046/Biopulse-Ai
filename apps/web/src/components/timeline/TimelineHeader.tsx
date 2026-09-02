import React from 'react';
import { Sparkles, Calendar, Activity, GitBranch, Download } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#1C0D2E] via-[#2A1343] to-[#12071F] p-6 sm:p-8 text-white border border-[#8E3EAF]/30 shadow-xl select-none">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-[#FB7185]/20 to-[#8E3EAF]/30 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Title & Longitudinal Explainer */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-mono text-[#D8B4FE]">
            <GitBranch className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Unified Longitudinal Health Journey</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            {userName}’s Health Timeline
          </h1>

          <p className="text-xs sm:text-sm text-[#CDBDD8] leading-relaxed">
            OvaSense brings together your cycle rhythm, daily symptoms, Pakistani nutrition, movement, lab biomarkers, and medical consultations into one connected longitudinal story.
          </p>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-white border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-[#FB7185]" />
              <span>Day {currentCycleDay} • {currentPhase}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-[#D8B4FE] border border-white/10">
              <Activity className="w-3.5 h-3.5 text-[#34D399]" />
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
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-[#1C0D2E] hover:bg-[#F8F5FA] hover:shadow-xl text-xs font-bold shadow-lg shadow-black/20 transition-all duration-200 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#6E2D8B]" />
              <div className="text-left">
                <span className="block font-bold leading-tight">Download Health Journey</span>
                <span className="block text-[10px] text-[#584B68] font-normal leading-tight">Doctor-ready summary</span>
              </div>
            </button>
          )}

          {onOpenAiInsights && (
            <button
              type="button"
              onClick={onOpenAiInsights}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-950/50 hover:shadow-purple-900/60 border border-white/15 transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#FB7185] animate-pulse" />
              <span>Ask AI Patterns</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
