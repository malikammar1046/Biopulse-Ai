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
  accentBg: string;
  accentColor: string;
  badgeBg: string;
  description: string;
  permitted: string[];
  restricted: string[];
}

export const CareCircleNetworkSection: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NetworkNodeId>('doctor');

  const nodes: Record<NetworkNodeId, NodeData> = {
    doctor: {
      id: 'doctor',
      title: 'Dr. Ahmed',
      subtitle: 'Attending Clinician • Ob/Gyn',
      role: 'Clinical Care & Review',
      icon: <Stethoscope className="w-5 h-5 text-[#0284C7]" />,
      accentBg: 'bg-sky-50',
      accentColor: 'text-[#0284C7]',
      badgeBg: 'bg-sky-50 text-[#0284C7] border-sky-200',
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
      icon: <Users className="w-5 h-5 text-[#E11D48]" />,
      accentBg: 'bg-rose-50',
      accentColor: 'text-[#E11D48]',
      badgeBg: 'bg-rose-50 text-[#E11D48] border-rose-200',
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
      icon: <UserCheck className="w-5 h-5 text-[#7C3AED]" />,
      accentBg: 'bg-purple-50',
      accentColor: 'text-[#7C3AED]',
      badgeBg: 'bg-purple-50 text-[#7C3AED] border-purple-200',
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
      title: 'BioPulse AI Engine',
      subtitle: 'Longitudinal Intelligence',
      role: 'Private Analysis & Synthesis',
      icon: <Cpu className="w-5 h-5 text-[#059669]" />,
      accentBg: 'bg-emerald-50',
      accentColor: 'text-[#059669]',
      badgeBg: 'bg-emerald-50 text-[#059669] border-emerald-200',
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
    <section id="care-circle-network" className="py-20 sm:py-28 bg-[#F8FAFC] text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
            <Network className="w-4 h-4 text-[#0891B2]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Interactive Permission Graph
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display">
            The Care Circle{' '}
            <span className="text-[#0891B2]">
              Network.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal max-w-2xl mx-auto">
            Click any node in your health circle to inspect exactly what information they are permitted to see and what is strictly shielded.
          </p>
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
                  type="button"
                  onClick={() => setSelectedNode(key)}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-white border-2 border-[#0891B2] shadow-md scale-[1.01]'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl ${node.accentBg} border border-slate-200 flex items-center justify-center shrink-0`}>
                      {node.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-[#162A45] font-display">
                          {node.title}
                        </h4>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block font-sans">
                        {node.subtitle}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-[#0891B2] font-semibold shrink-0">
                    {isSelected ? 'Inspecting →' : 'View'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Node Inspection HUD */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xl text-left space-y-6"
              >
                {/* Node Inspection Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl ${active.accentBg} border border-slate-200 flex items-center justify-center shrink-0`}>
                      {active.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-[#162A45] font-display">
                          {active.title}
                        </h3>
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${active.badgeBg} font-bold uppercase`}>
                          {active.role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-sans mt-0.5 block">
                        {active.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Active Consent Link</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  {active.description}
                </p>

                {/* Permissions Breakdown Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Permitted Categories */}
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-800 uppercase tracking-wider">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Explicitly Permitted</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {active.permitted.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Strictly Shielded Categories */}
                  <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-200/70 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#E11D48] uppercase tracking-wider">
                      <X className="w-4 h-4 text-[#E11D48]" />
                      <span>Strictly Shielded</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {active.restricted.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0 mt-1.5" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
};
