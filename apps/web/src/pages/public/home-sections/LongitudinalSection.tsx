import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileCheck, BrainCircuit, HeartPulse, ArrowRight, UserCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const LongitudinalSection: React.FC = () => {
  const [activePersona, setActivePersona] = useState<'women' | 'men' | 'everyone'>('women');

  const personas = {
    women: {
      label: "Women's Pathway",
      summary: 'Tracking cycle regularity, androgenic signals, ultrasound markers, and metabolic rhythms over months.',
      steps: [
        {
          stage: '01. Assess',
          title: 'Initial Signal Entry',
          desc: 'Log cycle length variations, acne severity, and family history to establish an initial screening context.',
          metric: 'Cycle & Symptoms',
          icon: Calendar,
        },
        {
          stage: '02. Understand',
          title: 'Hormone Panel Integration',
          desc: 'Upload LH/FSH and ultrasound follicle counts via OCR to see transparent feature influence scores.',
          metric: 'Tier 2 & 3 Labs',
          icon: FileCheck,
        },
        {
          stage: '03. Track',
          title: 'Lifestyle & Symptom Rhythm',
          desc: 'Monitor changes in sleep, stress, and luteal phase comfort as lifestyle adjustments take effect.',
          metric: '30-Day Trend',
          icon: HeartPulse,
        },
        {
          stage: '04. Reassess',
          title: 'Doctor Summary Review',
          desc: 'Export a structured, longitudinal health trend to evaluate progress collaboratively with a gynecologist.',
          metric: 'Multi-Month Report',
          icon: BrainCircuit,
        },
      ],
    },
    men: {
      label: "Men's Pathway",
      summary: 'Monitoring morning energy, total testosterone reports, body composition, and physical vitality over time.',
      steps: [
        {
          stage: '01. Assess',
          title: 'Vitality & Symptom Audit',
          desc: 'Document fatigue patterns, libido changes, and muscle recovery markers to map initial baseline risk.',
          metric: 'Validated Signals',
          icon: Calendar,
        },
        {
          stage: '02. Understand',
          title: 'Morning Endocrine Panel',
          desc: 'Record morning total testosterone and LH values to assess HPT-axis signaling balance transparently.',
          metric: 'Morning Serum Lab',
          icon: FileCheck,
        },
        {
          stage: '03. Track',
          title: 'Sleep & Physical Recovery',
          desc: 'Track weekly sleep duration, resistance training consistency, and subjective energy trends.',
          metric: 'Recovery Log',
          icon: HeartPulse,
        },
        {
          stage: '04. Reassess',
          title: 'Endocrine Progress Check',
          desc: 'Review multi-month biomarker trajectories with an endocrinologist or urologist for informed care planning.',
          metric: 'Longitudinal View',
          icon: BrainCircuit,
        },
      ],
    },
    everyone: {
      label: 'General Health Baseline',
      summary: 'Establishing proactive biometric baselines, organizing laboratory reports, and catching subtle shifts early.',
      steps: [
        {
          stage: '01. Assess',
          title: 'Health Profile Baseline',
          desc: 'Record comprehensive lifestyle, metabolic metrics, and family reproductive health history.',
          metric: 'Baseline Profile',
          icon: UserCheck,
        },
        {
          stage: '02. Understand',
          title: 'Routine Health Panels',
          desc: 'Store routine wellness bloodwork, lipid panels, and glycemic data in one verified digital space.',
          metric: 'Routine Bloodwork',
          icon: FileCheck,
        },
        {
          stage: '03. Track',
          title: 'Signal Stability Check',
          desc: 'Observe quarterly shifts in energy, sleep quality, and physiological markers before symptoms escalate.',
          metric: 'Continuous Literacy',
          icon: HeartPulse,
        },
        {
          stage: '04. Reassess',
          title: 'Informed Preventative Care',
          desc: 'Arrive at annual wellness checkups equipped with organized records and clear, objective health context.',
          metric: 'Annual Checkup Export',
          icon: BrainCircuit,
        },
      ],
    },
  };

  const current = personas[activePersona];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#EDE4F7] text-[#1C1326] overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#D8B4FE]/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-14">
          <Badge variant="primary" showDot size="md">
            Longitudinal Health
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Health is a continuous journey,{' '}
            <span className="gradient-text-brand">
              not a one-time test.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            VITASense AI is built around a continuous health intelligence cycle: capture your signals, understand what influenced them, monitor changes over time, and reassess as new data emerges.
          </p>

          {/* Unified continuous loop indicator */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono font-bold text-[#6E2D8B]">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DFEF] shadow-sm">Assess</span>
            <span className="text-[#8E3EAF] font-bold">→</span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DFEF] shadow-sm">Understand</span>
            <span className="text-[#8E3EAF] font-bold">→</span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DFEF] shadow-sm">Track</span>
            <span className="text-[#8E3EAF] font-bold">→</span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DFEF] shadow-sm">Reassess</span>
          </div>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex justify-center mb-10">
          <div className="p-1.5 bg-white/90 border border-[#E7DFEF] rounded-2xl shadow-sm flex flex-wrap gap-1 sm:gap-2">
            <button
              onClick={() => setActivePersona('women')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePersona === 'women'
                  ? 'bg-[#8E3EAF] text-white shadow-md'
                  : 'text-[#584B68] hover:text-[#1C1326]'
              }`}
            >
              Women (PCOS Track)
            </button>
            <button
              onClick={() => setActivePersona('men')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePersona === 'men'
                  ? 'bg-[#0284C7] text-white shadow-md'
                  : 'text-[#584B68] hover:text-[#1C1326]'
              }`}
            >
              Men (Hypogonadism Track)
            </button>
            <button
              onClick={() => setActivePersona('everyone')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePersona === 'everyone'
                  ? 'bg-[#6E2D8B] text-white shadow-md'
                  : 'text-[#584B68] hover:text-[#1C1326]'
              }`}
            >
              General Baseline Track
            </button>
          </div>
        </div>

        {/* Timeline Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="text-center max-w-xl mx-auto text-xs sm:text-sm text-[#6E2D8B] font-medium mb-4">
              {current.summary}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {current.steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white border border-[#E7DFEF] shadow-lg shadow-purple-950/5 flex flex-col justify-between space-y-4 hover:border-[#8E3EAF]/50 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8E3EAF] px-2.5 py-1 rounded-full bg-[#EDE4F7]">
                          {step.stage}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-center text-[#6E2D8B]">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <h3 className="text-base font-bold font-display text-[#1C1326]">
                        {step.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F0EAF5] flex items-center justify-between text-xs text-[#8D7E9E]">
                      <span className="font-semibold text-[#6E2D8B]">{step.metric}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8E3EAF]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
};
