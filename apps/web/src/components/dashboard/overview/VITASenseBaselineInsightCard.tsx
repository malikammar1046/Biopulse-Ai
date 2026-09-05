import React from 'react';
import { Compass, Sparkles, ArrowRight, ShieldCheck, Heart, Activity, FileText } from 'lucide-react';
import { useUserHealth } from '../../../context/UserHealthContext';

interface VITASenseBaselineInsightCardProps {
  onOpenChat: (prompt?: string) => void;
}

export const VITASenseBaselineInsightCard: React.FC<VITASenseBaselineInsightCardProps> = ({
  onOpenChat,
}) => {
  const { userProfile } = useUserHealth();
  const gh = userProfile.generalHealth;

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[#180A26] via-[#1F0E33] to-[#12071F] text-white shadow-xl flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden border border-white/10">
      {/* Volumetric background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#8B5CF6]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A78BFA] block">
              VITASense Platform • Health Overview
            </span>
            <span className="text-[11px] text-[#CDBDD8]">
              Baseline Wellness, Habits & Preventive Monitoring
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#CDBDD8] self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Encrypted Profile</span>
        </div>
      </div>

      {/* Center Priorities Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#CDBDD8]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <Heart className="w-3.5 h-3.5 text-[#FB7185]" />
              Lifestyle Pace
            </span>
            <span className="text-[#34D399] font-bold">Active</span>
          </div>
          <span className="text-base font-bold text-white block capitalize">
            {gh?.stressLevel || 'Moderate'} Pace
          </span>
          <p className="text-[11px] text-[#A797BD] leading-tight">
            Balanced nutrition, movement routines, and rest hours.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#CDBDD8]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
              Priorities Logged
            </span>
            <span className="text-[#A78BFA] font-bold">Configured</span>
          </div>
          <span className="text-sm font-bold text-white block truncate">
            {gh?.primaryFocus?.[0] || 'Daily Energy & Sleep'}
          </span>
          <p className="text-[11px] text-[#A797BD] leading-tight">
            Tailored tracking for your daily routines and personal habits.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#CDBDD8]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <FileText className="w-3.5 h-3.5 text-[#34D399]" />
              Medical Hub
            </span>
            <span className="text-[#34D399] font-bold">Ready</span>
          </div>
          <span className="text-sm font-bold text-white block">
            Reports & Consultations
          </span>
          <p className="text-[11px] text-[#A797BD] leading-tight">
            All blood tests, scans, and doctor briefs organized in one place.
          </p>
        </div>
      </div>

      {/* Bottom Action & Safety Line */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <p className="text-xs text-[#CDBDD8] max-w-xl leading-relaxed">
          <strong className="text-white">Continuous Monitoring:</strong> VITASense tracks your baseline metrics, diet, and movement to provide proactive health insights and doctor-ready summaries.
        </p>

        <button
          type="button"
          onClick={() =>
            onOpenChat(
              'What lifestyle and nutrition tips do you recommend based on my current baseline logs?'
            )
          }
          className="px-5 py-2.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs font-bold transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer shadow-md shadow-purple-950/50"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Ask VITASense AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default VITASenseBaselineInsightCard;
