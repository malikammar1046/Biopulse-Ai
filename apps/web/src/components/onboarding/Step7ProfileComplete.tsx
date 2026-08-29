import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import type { UserProfile } from '../../types/onboarding';

interface Step7Props {
  profile: UserProfile;
  onEnterApp: () => void;
}

export const Step7ProfileComplete: React.FC<Step7Props> = ({ profile, onEnterApp }) => {
  const summaryChecks = [
    { label: 'Personal Information', val: profile.fullName || 'Registered' },
    { label: 'Emergency & Safety', val: `${profile.emergencyContacts[0]?.name || 'Primary Contact'} configured` },
    { label: 'Medical History', val: `${profile.medical.allergies.length} allergies, ${profile.medical.conditions.length} conditions` },
    { label: 'Women’s Health Profile', val: `${typeof profile.womensHealth.cycleLength === 'number' ? profile.womensHealth.cycleLength + ' Day Cycle' : 'Variable Cycle'}` },
    { label: 'Lifestyle & Movement', val: `${profile.lifestyle.dietaryPreference}` },
    { label: 'Health Goals', val: `${profile.goals.selectedGoals.length} Focus Areas Selected` },
  ];

  return (
    <div className="text-center py-4 space-y-8 select-none">
      {/* ── Glowing Luminous Central Biological Orb ── */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
        {/* Deep ambient blur orbs */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] blur-2xl opacity-60 animate-pulse" />

        {/* Central Luminous Vessel */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#6E2D8B] via-[#A21CAF] to-[#FB7185] border-2 border-white/40 shadow-2xl flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#34D399] border-2 border-[#10071A] shadow-md animate-ping" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#34D399] border-2 border-[#10071A] shadow-md" />
        </motion.div>
      </div>

      {/* ── Headline & Narrative ── */}
      <div className="space-y-3 max-w-md mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight"
        >
          Your OvaSense profile is{' '}
          <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
            ready.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base sm:text-lg text-[#EDE4F7] font-serif italic"
        >
          “Let’s understand your health, one pattern at a time.”
        </motion.p>
      </div>

      {/* ── Completed Modules Checklist Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-md mx-auto p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/90 via-[#140822]/90 to-[#0F041B]/95 border border-white/15 shadow-2xl backdrop-blur-2xl text-left space-y-3"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-xs font-mono text-[#FDA4AF]">
          <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            Configured Baselines
          </span>
          <span className="text-[#34D399] font-bold">100% Ready</span>
        </div>

        <div className="space-y-2">
          {summaryChecks.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-none"
            >
              <div className="flex items-center gap-2 text-white font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                <span>{item.label}</span>
              </div>
              <span className="text-[11px] text-[#A797BD] font-mono truncate max-w-[170px] text-right">
                {item.val}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Primary Enter CTA Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-md mx-auto pt-2"
      >
        <button
          type="button"
          onClick={onEnterApp}
          className="w-full py-4 px-8 rounded-2xl font-sans font-bold text-base text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-2xl shadow-purple-950/60 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>ENTER OVASENSE</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#A797BD] font-mono">
          <Heart className="w-3 h-3 text-[#FB7185]" />
          <span>Non-Diagnostic Longitudinal Health Intelligence</span>
        </div>
      </motion.div>
    </div>
  );
};
