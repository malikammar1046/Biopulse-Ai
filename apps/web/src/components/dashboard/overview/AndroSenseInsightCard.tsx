import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Sparkles, ArrowRight, ShieldCheck, Sun, Dumbbell, Heart, Layers } from 'lucide-react';
import { useUserHealth } from '../../../context/UserHealthContext';
import { ROUTES } from '../../../constants/routes';

interface AndroSenseInsightCardProps {
  onOpenChat: (prompt?: string) => void;
}

export const AndroSenseInsightCard: React.FC<AndroSenseInsightCardProps> = ({ onOpenChat }) => {
  const navigate = useNavigate();
  const { userProfile, adaptiveProfile } = useUserHealth();
  const mh = userProfile.mensHealth;

  const energyText = mh?.energyLevel
    ? mh.energyLevel === 'high'
      ? 'Optimal Daily Alertness'
      : mh.energyLevel === 'moderate'
      ? 'Steady Baseline Stamina'
      : mh.energyLevel === 'low'
      ? 'Reported Afternoon Slumps'
      : 'Reported Low Daily Energy'
    : 'Steady Baseline Stamina';

  const testStatus = mh?.hadTestosteroneTest === 'yes' && mh.testosteroneValue
    ? `${mh.testosteroneValue} ${mh.testosteroneUnit || 'ng/dL'} (${mh.testDrawTime === 'morning_fasting' ? 'Morning Fasting' : 'Test Logged'})`
    : 'No prior blood draw logged';

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[#0B1728] via-[#0D1E36] to-[#08101E] text-white shadow-xl flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden border border-white/10">
      {/* Volumetric background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0284C7]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0284C7]/20 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#38BDF8] block">
              AndroSense AI • Screening Insight
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              Male Hormonal Vitality & Hypogonadism Screening Context
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#94A3B8]">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span>Profile: {adaptiveProfile.overallCompletenessPercentage}% complete</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#94A3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Non-Diagnostic</span>
          </div>
        </div>
      </div>

      {/* Center Intelligence Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* Metric 1: Energy & Recovery */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <Sun className="w-3.5 h-3.5 text-[#FBBF24]" />
              Energy Pattern
            </span>
            <span className="text-[#38BDF8] font-bold">Active</span>
          </div>
          <span className="text-base font-bold text-white block">
            {energyText}
          </span>
          <p className="text-[11px] text-[#94A3B8] leading-tight">
            Correlated with your sleep hours and regular activity habits.
          </p>
        </div>

        {/* Metric 2: Intimacy & Stamina Rhythms */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <Heart className="w-3.5 h-3.5 text-[#F43F5E]" />
              Sex Drive & Rhythms
            </span>
            <span className="text-[#38BDF8] font-bold">
              {mh?.sexDrive ? mh.sexDrive.replace(/_/g, ' ') : 'Normal'}
            </span>
          </div>
          <span className="text-base font-bold text-white block capitalize">
            {mh?.sexDrive ? `${mh.sexDrive.replace(/_/g, ' ')} drive` : 'Normal rhythms'}
          </span>
          <p className="text-[11px] text-[#94A3B8] leading-tight">
            Morning testosterone peaks naturally support daily drive and recovery.
          </p>
        </div>

        {/* Metric 3: Lab Context */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[10px]">
              <Dumbbell className="w-3.5 h-3.5 text-[#34D399]" />
              Testosterone Context
            </span>
            <span className="text-[#34D399] font-bold">Recorded</span>
          </div>
          <span className="text-sm font-bold text-white block truncate">
            {testStatus}
          </span>
          <p className="text-[11px] text-[#94A3B8] leading-tight">
            Morning fasting blood tests provide the most reliable clinical baseline.
          </p>
        </div>
      </div>

      {/* Bottom Action & Safety Line */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
          <strong className="text-white">Clinical Notice:</strong> AndroSense AI tracks your progressive screening profile across 4 progressive tiers to support informed discussions with your healthcare provider.
        </p>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.ASSESSMENT)}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#38BDF8]" />
            <span>4-Tier Screening Profile</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onOpenChat(
                'Can you explain what factors influence male testosterone, energy slumps, and what questions I should ask my doctor?'
              )
            }
            className="px-5 py-2.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-sans text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-sky-950/50"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Ask AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroSenseInsightCard;
