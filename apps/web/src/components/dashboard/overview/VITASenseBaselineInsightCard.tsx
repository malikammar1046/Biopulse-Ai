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
    <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0288D1] block">
              BIOPulse AI Platform • Health Overview
            </span>
            <span className="text-[11px] text-[#64748B]">
              Baseline Wellness, Habits & Preventive Monitoring
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Profile</span>
        </div>
      </div>

      {/* Center Priorities Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Lifestyle Pace
            </span>
            <span className="text-emerald-600 font-bold">Active</span>
          </div>
          <span className="text-base font-bold text-[#0F172A] block capitalize">
            {gh?.stressLevel || 'Moderate'} Pace
          </span>
          <p className="text-[11px] text-[#64748B] leading-tight">
            Balanced nutrition, movement routines, and rest hours.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <Activity className="w-3.5 h-3.5 text-[#0288D1]" />
              Priorities Logged
            </span>
            <span className="text-[#0288D1] font-bold">Configured</span>
          </div>
          <span className="text-sm font-bold text-[#0F172A] block truncate">
            {gh?.primaryFocus?.[0] || 'Daily Energy & Sleep'}
          </span>
          <p className="text-[11px] text-[#64748B] leading-tight">
            Tailored tracking for your daily routines and personal habits.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Medical Hub
            </span>
            <span className="text-emerald-600 font-bold">Ready</span>
          </div>
          <span className="text-sm font-bold text-[#0F172A] block">
            Reports & Consultations
          </span>
          <p className="text-[11px] text-[#64748B] leading-tight">
            All blood tests, scans, and doctor briefs organized in one place.
          </p>
        </div>
      </div>

      {/* Bottom Action & Safety Line */}
      <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
          <strong className="text-[#0F172A]">Continuous Monitoring:</strong> BIOPulse AI tracks your baseline metrics, diet, and movement to provide proactive health insights and doctor-ready summaries.
        </p>

        <button
          type="button"
          onClick={() =>
            onOpenChat(
              'What lifestyle and nutrition tips do you recommend based on my current baseline logs?'
            )
          }
          className="px-5 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-sans text-xs font-bold transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Ask BIOPulse AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default VITASenseBaselineInsightCard;
