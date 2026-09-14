import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Heart, Activity, Compass } from 'lucide-react';
import type { UserProfile } from '../../types/onboarding';
import { resolvePathway } from '../../types/onboarding';

interface Step7Props {
  profile: UserProfile;
  onEnterApp: () => void;
  isSubmitting?: boolean;
  saveError?: string;
}

export const Step7ProfileComplete: React.FC<Step7Props> = ({
  profile,
  onEnterApp,
  isSubmitting = false,
  saveError,
}) => {
  const pathway = resolvePathway(profile.gender, profile.pathway);

  // Pathway-specific configuration
  const config = {
    female: {
      brandName: 'BioPulse AI',
      headline: 'Your BioPulse AI profile is ready.',
      narrative: '“Let’s understand your health, one pattern at a time.”',
      ctaText: 'ENTER BIOPULSE AI',
      accentGradient: 'from-[#6E2D8B] via-[#8E3EAF] to-[#E87084]',
      glowGradient: 'from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185]',
      icon: Heart,
      iconColor: 'text-[#FDA4AF]',
      focusList: [
        'Health overview & PCOS screening',
        'Menstrual cycle rhythm & symptoms',
        'Lab reports & nutrition tracking',
        'Explainable AI insights & longitudinal monitoring',
      ],
      checks: [
        {
          label: 'Personal & Biometrics',
          val: `${profile.fullName || 'User'} • ${profile.heightCm ? `${profile.heightCm} cm` : 'Height set'} / ${profile.weightKg ? `${profile.weightKg} kg` : 'Weight set'}`,
        },
        {
          label: 'Medical Baseline',
          val:
            (profile.medical?.conditions?.length || 0) + (profile.medical?.allergies?.length || 0) === 0
              ? 'No active conditions / allergies reported'
              : `${profile.medical?.conditions?.length || 0} conditions • ${profile.medical?.allergies?.length || 0} allergies`,
        },
        {
          label: 'Reproductive & Period Profile',
          val: `${typeof profile.womensHealth?.cycleLength === 'number' ? `${profile.womensHealth.cycleLength}-day cycle` : 'Cycle recorded'} • ${profile.womensHealth?.periodRegularity ? profile.womensHealth.periodRegularity.replace(/_/g, ' ') : 'Tracked'}`,
        },
        {
          label: 'BioPulse AI Screening Status',
          val: 'Profile Ready • Non-diagnostic ML analysis enabled',
        },
      ],
    },
    male: {
      brandName: 'BioPulse AI',
      headline: 'Your BioPulse AI profile is ready.',
      narrative: '“Let’s track and understand your hormonal and metabolic vitality.”',
      ctaText: 'ENTER BIOPULSE AI',
      accentGradient: 'from-[#0369A1] via-[#0284C7] to-[#38BDF8]',
      glowGradient: 'from-[#0369A1] via-[#0284C7] to-[#38BDF8]',
      icon: Activity,
      iconColor: 'text-[#38BDF8]',
      focusList: [
        'Health overview & male health screening',
        'Hormone vitality, stamina & symptoms',
        'Lab reports & nutrition tracking',
        'Explainable AI insights & longitudinal monitoring',
      ],
      checks: [
        {
          label: 'Personal & Biometrics',
          val: `${profile.fullName || 'User'} • ${profile.heightCm ? `${profile.heightCm} cm` : 'Height set'} / ${profile.weightKg ? `${profile.weightKg} kg` : 'Weight set'}`,
        },
        {
          label: 'Medical Baseline',
          val:
            (profile.medical?.conditions?.length || 0) + (profile.medical?.allergies?.length || 0) === 0
              ? 'No active conditions / allergies reported'
              : `${profile.medical?.conditions?.length || 0} conditions • ${profile.medical?.allergies?.length || 0} allergies`,
        },
        {
          label: 'Hormone & Stamina Profile',
          val: `${profile.mensHealth?.energyLevel ? `${profile.mensHealth.energyLevel} energy` : 'Energy recorded'} • ${profile.mensHealth?.sleepQuality ? profile.mensHealth.sleepQuality.replace(/_/g, ' ') : 'Sleep tracked'}`,
        },
        {
          label: 'BioPulse AI Screening Status',
          val: 'Profile Ready • Non-diagnostic hormone screening enabled',
        },
      ],
    },
    general: {
      brandName: 'BioPulse AI',
      headline: 'Your BioPulse AI profile is ready.',
      narrative: '“Your unified baseline health companion.”',
      ctaText: 'ENTER BIOPULSE AI',
      accentGradient: 'from-[#5B21B6] via-[#7C3AED] to-[#A78BFA]',
      glowGradient: 'from-[#5B21B6] via-[#7C3AED] to-[#A78BFA]',
      icon: Compass,
      iconColor: 'text-[#A78BFA]',
      focusList: [
        'Baseline health overview & tracking',
        'Lab reports & medical history',
        'Movement, activity & nutrition',
        'Explainable AI insights & monitoring',
      ],
      checks: [
        {
          label: 'Personal & Biometrics',
          val: `${profile.fullName || 'User'} • ${profile.heightCm ? `${profile.heightCm} cm` : 'Height set'} / ${profile.weightKg ? `${profile.weightKg} kg` : 'Weight set'}`,
        },
        {
          label: 'Medical Baseline',
          val:
            (profile.medical?.conditions?.length || 0) + (profile.medical?.allergies?.length || 0) === 0
              ? 'No active conditions / allergies reported'
              : `${profile.medical?.conditions?.length || 0} conditions • ${profile.medical?.allergies?.length || 0} allergies`,
        },
        {
          label: 'Daily Baseline Priorities',
          val: `${profile.generalHealth?.primaryFocus?.length || 2} priorities configured • ${profile.generalHealth?.stressLevel || 'moderate'} stress pace`,
        },
        {
          label: 'BioPulse AI Platform Status',
          val: 'Profile Ready • Baseline health tracking active',
        },
      ],
    },
  }[pathway];

  const Icon = config.icon;

  return (
    <div className="text-center py-4 space-y-8 select-none">
      {/* ── Glowing Luminous Central Biological Orb ── */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
        {/* Deep ambient blur orbs */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${config.glowGradient} blur-2xl opacity-60 animate-pulse`} />

        {/* Central Luminous Vessel */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr ${config.accentGradient} border-2 border-white/40 shadow-2xl flex items-center justify-center`}
        >
          <Icon className="w-10 h-10 text-white" />
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
          {config.headline.split('ready.')[0]}
          <span className={`bg-gradient-to-r ${config.accentGradient} bg-clip-text text-transparent`}>
            ready.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base sm:text-lg text-[#EDE4F7] font-serif italic"
        >
          {config.narrative}
        </motion.p>
      </div>

      {/* ── Error Banner if Save Failed ── */}
      {saveError && (
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#E87084]/20 border border-[#E87084]/50 text-xs text-[#FDA4AF] text-left">
          {saveError}
        </div>
      )}

      {/* ── What You Can Explore Overview ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-md mx-auto p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-2"
      >
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#CDBDD8] block">
          You can now explore:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#EDE4F7]">
          {config.focusList.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shrink-0" />
              <span className="leading-tight">{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

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
          {config.checks.map((item, idx) => (
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
          disabled={isSubmitting}
          className={`w-full py-4 px-8 rounded-2xl font-sans font-bold text-base text-white bg-gradient-to-r ${config.accentGradient} hover:brightness-110 shadow-2xl shadow-purple-950/60 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Saving Health Profile...</span>
            </>
          ) : (
            <>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#A797BD] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Non-Diagnostic Longitudinal Health Intelligence • BioPulse AI</span>
        </div>
      </motion.div>
    </div>
  );
};
