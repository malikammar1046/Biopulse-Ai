import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Activity, HeartHandshake } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface MechanismStep {
  id: string;
  stepNumber: number;
  label: string;
  focusOrgan: string;
  color: string;
  description: string;
}

const MECHANISM_STEPS: MechanismStep[] = [
  {
    id: 'ovary-signaling',
    stepNumber: 1,
    label: 'Ovarian Signal Alteration',
    focusOrgan: 'The Ovary',
    color: '#FB7185',
    description:
      'Altered pituitary LH pulses stimulate continuous baseline estrogen production without the regular cyclic trigger for ovulation.',
  },
  {
    id: 'anovulatory-pattern',
    stepNumber: 2,
    label: 'Anovulatory Phase',
    focusOrgan: 'Follicular Axis',
    color: '#C084FC',
    description:
      'Because ovulation does not occur regularly, no corpus luteum forms to produce balancing luteal progesterone.',
  },
  {
    id: 'menstrual-irregularity',
    stepNumber: 3,
    label: 'Prolonged Cycle Gaps',
    focusOrgan: 'Menstrual Rhythm',
    color: '#E879F9',
    description:
      'Without progesterone withdrawal, intervals between bleeds extend to 45, 90, or more days (oligomenorrhea or amenorrhea).',
  },
  {
    id: 'endometrial-lining',
    stepNumber: 4,
    label: 'Uterine Lining Proliferation',
    focusOrgan: 'Endometrium',
    color: '#FDA4AF',
    description:
      'Continuous exposure to unopposed estrogen causes the endometrial lining to progressively thicken over time rather than shedding completely.',
  },
];

export const LongTermAwarenessSection: React.FC = () => {
  const [activeStepId, setActiveStepId] = useState<string>(MECHANISM_STEPS[3].id);
  const activeStep =
    MECHANISM_STEPS.find((s) => s.id === activeStepId) || MECHANISM_STEPS[3];

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10 select-none">
      {/* Volumetric Glows */}
      <div className="absolute top-1/3 left-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 05 — Long-Term Biological Context
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            When signals remain{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              unaddressed.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            Understanding why cycle regularity matters for uterine and endometrial health—grounded
            in physiological evidence without fear.
          </p>

          {/* Explicit Medical Clarity Box */}
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/40 text-left flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
            <div className="text-xs text-[#EDE4F7] leading-relaxed">
              <strong className="text-white block font-display text-sm mb-1">
                Medical Clarification & Safety:
              </strong>
              <strong>PMOS itself is NOT cancer.</strong> However, prolonged irregular or absent
              periods can mean the uterine lining (endometrium) experiences continuous estrogen
              stimulation without the balancing effect of progesterone, which can be associated
              with increased long-term risk of endometrial hyperplasia.
            </div>
          </div>
        </div>

        {/* ── Visual Step Transition Mechanism ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left / Physiological Transition Steps */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDE4F7] block">
              Physiological Chain of Influence:
            </span>

            <div className="space-y-3">
              {MECHANISM_STEPS.map((step) => {
                const isCurrent = step.id === activeStepId;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-start justify-between gap-4 ${
                      isCurrent
                        ? 'bg-[#1C0D2E] border-[#FB7185] shadow-xl shadow-purple-950/40 scale-[1.02]'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                          isCurrent
                            ? 'bg-gradient-to-tr from-[#8E3EAF] to-[#FB7185] text-white shadow-md'
                            : 'bg-white/10 text-[#B4A6C7]'
                        }`}
                      >
                        0{step.stepNumber}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-display">
                            {step.label}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
                            {step.focusOrgan}
                          </span>
                        </div>
                        <p className="text-xs text-[#B4A6C7] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      {isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] block animate-pulse" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Individual Factor Note */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1 text-xs text-[#A797BD]">
              <div className="flex items-center gap-2 text-white font-semibold">
                <HeartHandshake className="w-4 h-4 text-[#FB7185]" />
                <span>Personalized Biological Variability</span>
              </div>
              <p className="leading-relaxed">
                Risk depends on individual factors and cycle frequency. Not everyone with PMOS
                develops these complications. Regular clinical evaluations provide tailored
                protection.
              </p>
            </div>
          </div>

          {/* Right / Endometrial Cross-Section Graphic */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-square rounded-[32px] overflow-hidden bg-gradient-to-b from-[#180A26] via-[#12071F] to-[#0A0313] border border-white/15 shadow-2xl p-6 flex flex-col justify-between">
              {/* Radial Glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(232, 112, 132, 0.25) 0%, rgba(110, 45, 139, 0.15) 50%, transparent 80%)',
                }}
              />

              {/* Header Label */}
              <div className="relative z-10 flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                <span className="text-[#EDE4F7] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#FB7185]" />
                  Uterine & Endometrial Architecture
                </span>
                <span className="text-[10px] text-[#A797BD]">Non-Tumor Biological Focus</span>
              </div>

              {/* Central Endometrial Simulation Visual */}
              <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center py-4">
                {/* SVG Uterine Endometrial Cross Section */}
                <div className="relative w-64 h-56 flex items-center justify-center">
                  <svg viewBox="0 0 240 200" className="w-full h-full">
                    {/* Outer Myometrial Muscular Wall */}
                    <path
                      d="M 40 40 C 40 10, 200 10, 200 40 C 200 110, 160 160, 120 185 C 80 160, 40 110, 40 40 Z"
                      fill="#3B1252"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2"
                    />

                    {/* Inner Endometrial Cavity (Unopposed Estrogen Thickening Layer) */}
                    <motion.path
                      d="M 65 50 C 70 30, 170 30, 175 50 C 175 105, 145 145, 120 165 C 95 145, 65 105, 65 50 Z"
                      fill={activeStep.id === 'endometrial-lining' ? '#FB7185' : '#8E3EAF'}
                      opacity={activeStep.id === 'endometrial-lining' ? 0.85 : 0.45}
                      animate={{
                        scale: activeStep.id === 'endometrial-lining' ? [1, 1.04, 1] : 1,
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Central Cavity Lumen */}
                    <path
                      d="M 90 60 C 95 48, 145 48, 150 60 C 150 95, 132 125, 120 140 C 108 125, 90 95, 90 60 Z"
                      fill="#10071A"
                    />

                    {/* Vascular Capillary Lines on Endometrium */}
                    <g stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round">
                      <path d="M 85 70 Q 105 80 115 100" />
                      <path d="M 155 70 Q 135 80 125 100" />
                      <path d="M 100 110 Q 120 120 120 135" />
                    </g>
                  </svg>

                  {/* Dynamic Hotspot Label on Endometrium */}
                  <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#10071A]/90 border border-[#FB7185]/60 text-[10px] font-mono text-center shadow-lg">
                    <span className="text-[#FB7185] font-bold block">Endometrial Stripe</span>
                    <span className="text-[9px] text-[#EDE4F7]">Hormone Responsive</span>
                  </div>
                </div>
              </div>

              {/* Bottom Clarification */}
              <div className="relative z-10 pt-3 border-t border-white/10 text-[11px] text-[#CDBDD8] font-sans flex items-center justify-between">
                <span>Active Step: {activeStep.label}</span>
                <span className="text-[#FB7185] font-semibold">Progesterone Balance Protects</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
