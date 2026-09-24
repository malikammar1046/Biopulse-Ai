import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileCheck, BrainCircuit, HeartPulse, ArrowRight, UserCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const LongitudinalSection: React.FC = () => {
  const [activePersona, setActivePersona] = useState<'women' | 'men' | 'everyone'>('women');

  const personas = {
    women: {
      label: "Women's Pathway",
      accent: '#E11D48',
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
      accent: '#0284C7',
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
      accent: '#059669',
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
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] border-t border-slate-200/80 overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-100/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <span>Longitudinal Health</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            Health is a continuous journey,{' '}
            <span className="text-[#0891B2]">
              not a one-time test.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            BIOPulse AI is built around a continuous health intelligence cycle: capture your signals, understand what influenced them, monitor changes over time, and reassess as new data emerges.
          </p>

          {/* Unified continuous loop indicator */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono font-bold text-[#162A45]">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">Assess</span>
            <span className="text-[#0891B2] font-bold">→</span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">Understand</span>
            <span className="text-[#0891B2] font-bold">→</span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">Track</span>
            <span className="text-[#0891B2] font-bold">→</span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">Reassess</span>
          </div>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex justify-center mb-10">
          <div className="p-1.5 bg-slate-100 border border-slate-200/80 rounded-full shadow-2xs flex flex-wrap gap-1 sm:gap-2">
            <button
              onClick={() => setActivePersona('women')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePersona === 'women'
                  ? 'bg-[#E11D48] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Women (PCOS Track)
            </button>
            <button
              onClick={() => setActivePersona('men')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePersona === 'men'
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Men (Hypogonadism Track)
            </button>
            <button
              onClick={() => setActivePersona('everyone')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePersona === 'everyone'
                  ? 'bg-[#0891B2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
            <div className="text-center max-w-xl mx-auto text-xs sm:text-sm font-medium mb-4" style={{ color: current.accent }}>
              {current.summary}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {current.steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all text-left"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-slate-50"
                          style={{ color: current.accent, borderColor: `${current.accent}30` }}
                        >
                          {step.stage}
                        </span>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center border bg-slate-50"
                          style={{ color: current.accent, borderColor: `${current.accent}30` }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <h3 className="text-base font-bold font-display text-[#162A45]">
                        {step.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[#162A45]">{step.metric}</span>
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: current.accent }} />
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
