import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Stethoscope, Users, UserCheck, Cpu, Check, X, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

type NetworkNodeId = 'doctor' | 'family' | 'partner' | 'ai';

interface NodeData {
  id: NetworkNodeId;
  title: string;
  subtitle: string;
  role: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  glowColor: string;
  permitted: string[];
  restricted: string[];
  description: string;
}

export const CareCircleNetworkSection: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NetworkNodeId>('doctor');

  const nodes: Record<NetworkNodeId, NodeData> = {
    doctor: {
      id: 'doctor',
      title: 'Dr. Ahmed',
      subtitle: 'Attending Clinician • Ob/Gyn',
      role: 'Clinical Care & Review',
      icon: <Stethoscope className="w-6 h-6 text-[#C084FC]" />,
      color: 'from-[#8E3EAF] to-[#A21CAF]',
      borderColor: 'border-[#8E3EAF]',
      glowColor: 'shadow-[0_0_30px_rgba(142,62,175,0.4)]',
      description:
        'Receives high-density structured weekly summaries, biomarker lab report digitization, and consultation prep questions without accessing private chats.',
      permitted: [
        'Weekly Health Brief (7-day synthesis)',
        'Biomarker lab report digitizations & fast trends',
        'Nutrition & meal adherence summaries',
        'Fitness & cardio consistency logs',
        'Prepared consultation discussion checklist',
      ],
      restricted: [
        'Raw private AI conversation transcripts',
        'Unshared intimate personal diary entries',
        'Third-party family notifications',
      ],
    },
    family: {
      id: 'family',
      title: 'Aisha (Sister)',
      subtitle: 'Family Support Network',
      role: 'Routine & Emotional Support',
      icon: <Users className="w-6 h-6 text-[#E879F9]" />,
      color: 'from-[#E879F9] to-[#A21CAF]',
      borderColor: 'border-[#E879F9]',
      glowColor: 'shadow-[0_0_30px_rgba(232,121,249,0.4)]',
      description:
        'Kept in the loop for shared medication alarms and appointment logistics without access to sensitive clinical biomarkers or doctor notes.',
      permitted: [
        'Daily medication & supplement alarms',
        'Upcoming appointment dates & logistics',
        'Weekly wellness streaks (hydration, steps)',
        'Shared routine encouragement alerts',
      ],
      restricted: [
        'Medical lab reports & PDF uploads',
        'Detailed ovulation & clinical cycle metrics',
        'Private AI health conversation transcripts',
      ],
    },
    partner: {
      id: 'partner',
      title: 'Care Partner',
      subtitle: 'Designated Health Partner',
      role: 'Wellness Collaboration',
      icon: <UserCheck className="w-6 h-6 text-[#FB7185]" />,
      color: 'from-[#FB7185] to-[#E87084]',
      borderColor: 'border-[#FB7185]',
      glowColor: 'shadow-[0_0_30px_rgba(251,113,133,0.4)]',
      description:
        'Participates in healthy meal planning, fitness routines, and logistical reminders with custom permissions governed exclusively by you.',
      permitted: [
        'Shared nutrition meal plans',
        'Fitness & workout schedule milestones',
        'Appointment transport & calendar updates',
      ],
      restricted: [
        'Detailed medical records and lab PDFs',
        'Raw private symptom chat history',
        'Physician discussion notes',
      ],
    },
    ai: {
      id: 'ai',
      title: 'VITASense AI Engine',
      subtitle: 'Longitudinal Intelligence',
      role: 'Private Analysis & Synthesis',
      icon: <Cpu className="w-6 h-6 text-[#38BDF8]" />,
      color: 'from-[#38BDF8] to-[#0284C7]',
      borderColor: 'border-[#38BDF8]',
      glowColor: 'shadow-[0_0_30px_rgba(56,189,248,0.4)]',
      description:
        'Processes your multimodal health signals locally and cryptographically inside your private vault — identifying longitudinal patterns without selling or broadcasting your data.',
      permitted: [
        'Multimodal signal aggregation (symptoms, labs, cycle)',
        'SHAP feature attribution & pattern synthesis',
        'Weekly brief compilation (upon your approval)',
      ],
      restricted: [
        'Unapproved data sharing or external leaks',
        'Third-party advertising or commercial brokers',
        'Automated diagnosis claims',
      ],
    },
  };

  const active = nodes[selectedNode];

  return (
    <section id="care-circle-network" className="py-24 sm:py-32 bg-[#10071A] text-white relative overflow-hidden border-t border-white/10">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[190px] pointer-events-none -z-10" />

      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Network className="w-4 h-4 text-[#FB7185]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
              Interactive Permission Graph
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            The Care Circle{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Network.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
          >
            Click any node in your health circle to inspect exactly what information they are permitted to see and what is strictly shielded.
          </motion.p>
        </div>

        {/* ── Interactive Network Grid & Inspection HUD ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Node Selector Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {(Object.keys(nodes) as NetworkNodeId[]).map((key) => {
              const node = nodes[key];
              const isSelected = selectedNode === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedNode(key)}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? `bg-[#180A25] ${node.borderColor} ${node.glowColor} scale-[1.02]`
                      : 'bg-[#10071A]/70 border-white/10 hover:border-white/25 hover:bg-[#180A25]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${node.color} text-white shadow-md`}>
                      {node.icon}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white font-display">
                        {node.title}
                      </h4>
                      <span className="text-xs text-[#B4A6C7] font-sans">
                        {node.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                        isSelected
                          ? 'bg-white/15 text-white border-white/20'
                          : 'bg-white/5 text-[#8D7E9E] border-white/5'
                      }`}
                    >
                      {isSelected ? 'INSPECTING' : 'VIEW'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inspection Glass HUD */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.45 }}
                className="rounded-3xl bg-[#180A25]/95 border border-white/15 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-purple-950/60 text-left space-y-6 relative overflow-hidden"
              >
                {/* Top Subtle Aura */}
                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${active.color} opacity-15 rounded-full blur-2xl pointer-events-none`} />

                {/* HUD Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${active.color} text-white shadow-lg`}>
                      {active.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white font-display">
                        {active.title}
                      </h3>
                      <span className="text-xs text-[#B4A6C7] font-mono">
                        Role: {active.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-xs font-mono text-[#34D399]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Permission Enforced</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#EDE4F7] font-sans leading-relaxed">
                  {active.description}
                </p>

                {/* Permitted vs Restricted 2-Column Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* PERMITTED */}
                  <div className="p-4 rounded-2xl bg-[#10071A] border border-[#10B981]/30 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#34D399] uppercase tracking-wider font-mono">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Permitted Visibility</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#F6F2FA] font-sans">
                      {active.permitted.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#34D399] font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* RESTRICTED */}
                  <div className="p-4 rounded-2xl bg-[#10071A] border border-[#F43F5E]/30 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#FB7185] uppercase tracking-wider font-mono">
                      <X className="w-4 h-4 stroke-[3]" />
                      <span>Strictly Restricted</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#B4A6C7] font-sans">
                      {active.restricted.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#FB7185] font-bold">✕</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Control Note */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8D7E9E]">
                  <span>Controlled from your personal mobile device</span>
                  <span className="font-mono text-[#E879F9]">Access status: Active</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
};
