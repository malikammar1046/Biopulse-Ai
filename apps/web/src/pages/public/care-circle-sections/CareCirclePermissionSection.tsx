import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Stethoscope, Users, UserCheck, Sliders } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface PermissionRule {
  key: string;
  label: string;
  category: string;
  defaultDoctor: boolean;
  defaultFamily: boolean;
  defaultPartner: boolean;
  isPrivateAi?: boolean;
}

export const CareCirclePermissionSection: React.FC = () => {
  const [activePersona, setActivePersona] = useState<'doctor' | 'family' | 'partner'>('doctor');

  // Permission matrix state
  const [permissions, setPermissions] = useState<Record<string, Record<'doctor' | 'family' | 'partner', boolean>>>({
    weeklySummary: { doctor: true, family: true, partner: true },
    nutrition: { doctor: true, family: false, partner: false },
    fitness: { doctor: true, family: false, partner: true },
    reports: { doctor: true, family: false, partner: false },
    appointments: { doctor: true, family: true, partner: true },
    medication: { doctor: true, family: true, partner: false },
    cycleInfo: { doctor: false, family: false, partner: false },
    privateAi: { doctor: false, family: false, partner: false },
  });

  const rules: PermissionRule[] = [
    { key: 'weeklySummary', label: 'Weekly Health Summary', category: 'Summary', defaultDoctor: true, defaultFamily: true, defaultPartner: true },
    { key: 'nutrition', label: 'Nutrition & Meal Patterns', category: 'Lifestyle', defaultDoctor: true, defaultFamily: false, defaultPartner: false },
    { key: 'fitness', label: 'Fitness & Physical Activity', category: 'Lifestyle', defaultDoctor: true, defaultFamily: false, defaultPartner: true },
    { key: 'reports', label: 'Biomarker Lab Reports', category: 'Clinical', defaultDoctor: true, defaultFamily: false, defaultPartner: false },
    { key: 'appointments', label: 'Upcoming Appointments & Prep', category: 'Coordination', defaultDoctor: true, defaultFamily: true, defaultPartner: true },
    { key: 'medication', label: 'Medication & Supplement Alarms', category: 'Routine', defaultDoctor: true, defaultFamily: true, defaultPartner: false },
    { key: 'cycleInfo', label: 'Detailed Menstrual Cycle Logs', category: 'Intimate', defaultDoctor: false, defaultFamily: false, defaultPartner: false },
    { key: 'privateAi', label: 'Private AI Conversations', category: 'Private Shield', defaultDoctor: false, defaultFamily: false, defaultPartner: false, isPrivateAi: true },
  ];

  const handleToggle = (key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [activePersona]: !prev[key][activePersona],
      },
    }));
  };

  const personaConfig = {
    doctor: {
      name: 'Dr. Ahmed',
      role: 'Attending Clinician • Ob/Gyn',
      icon: <Stethoscope className="w-5 h-5 text-[#C084FC]" />,
      badge: 'CLINICIAN VIEW',
      summarySnippet: 'Receives structured weekly clinical brief, biomarker report summaries, and prepared visit queries.',
    },
    family: {
      name: 'Aisha (Sister)',
      role: 'Family Support Network',
      icon: <Users className="w-5 h-5 text-[#E879F9]" />,
      badge: 'FAMILY VIEW',
      summarySnippet: 'Receives selected appointment alerts and daily routine check-ins without seeing private clinical data.',
    },
    partner: {
      name: 'Care Partner',
      role: 'Routine & Wellness Supporter',
      icon: <UserCheck className="w-5 h-5 text-[#FB7185]" />,
      badge: 'PARTNER VIEW',
      summarySnippet: 'Shares fitness milestones and scheduled reminders while intimate logs remain completely hidden.',
    },
  };

  return (
    <section id="care-circle-permissions" className="py-24 sm:py-32 bg-[#10071A] text-white relative overflow-hidden border-t border-white/10">
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[#8E3EAF]/15 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#FB7185]/15 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Sliders className="w-4 h-4 text-[#FB7185]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
              Granular Permission Control
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            One patient.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Different views.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
          >
            You decide what they can see. Access is never all-or-nothing, and never permanent unless you want it to be.
          </motion.p>
        </div>

        {/* ── Interactive Permission Switcher Console ── */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-[#180A25]/90 border border-white/15 p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-purple-950/50">
          {/* Persona Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 sm:mb-10 pb-6 border-b border-white/10">
            {(['doctor', 'family', 'partner'] as const).map((persona) => {
              const active = activePersona === persona;
              const cfg = personaConfig[persona];
              return (
                <button
                  key={persona}
                  onClick={() => setActivePersona(persona)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                    active
                      ? 'bg-gradient-to-r from-[#8E3EAF]/40 to-[#A21CAF]/30 border-[#FB7185] shadow-lg shadow-purple-950/40'
                      : 'bg-[#10071A]/70 border-white/10 hover:border-white/20 text-[#B4A6C7]'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 shrink-0">
                    {cfg.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white font-display">
                        {cfg.name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    </div>
                    <span className="text-[11px] text-[#B4A6C7] block">
                      {cfg.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Persona Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#E879F9] bg-[#E879F9]/10 px-2.5 py-0.5 rounded-full border border-[#E879F9]/20">
                  {personaConfig[activePersona].badge}
                </span>
                <span className="text-xs text-[#B4A6C7]">• Permission Configurator</span>
              </div>
              <p className="text-xs sm:text-sm text-[#EDE4F7] font-sans">
                {personaConfig[activePersona].summarySnippet}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#34D399] font-mono shrink-0">
              <ShieldCheck className="w-4 h-4" />
              <span>Permission Active</span>
            </div>
          </div>

          {/* Granular Rules Toggles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {rules.map((rule) => {
              const isAllowed = permissions[rule.key]?.[activePersona] ?? false;
              return (
                <div
                  key={rule.key}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    rule.isPrivateAi
                      ? 'bg-[#10071A] border-[#FB7185]/30 shadow-inner'
                      : isAllowed
                      ? 'bg-[#10071A]/80 border-white/15 hover:border-white/30'
                      : 'bg-[#10071A]/40 border-white/5 opacity-80'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8D7E9E] uppercase tracking-wider">
                        {rule.category}
                      </span>
                      {rule.isPrivateAi && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/30 text-[9px] font-mono text-[#FB7185]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private Shield</span>
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-white block">
                      {rule.label}
                    </span>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggle(rule.key)}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAllowed ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185]' : 'bg-white/15'
                    }`}
                    aria-label={`Toggle ${rule.label}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                        isAllowed ? 'translate-x-7 text-[#8E3EAF]' : 'translate-x-0 text-[#8D7E9E]'
                      }`}
                    >
                      {isAllowed ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Security Note */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B4A6C7]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#FB7185] shrink-0" />
              <span>
                Doctors and family do <strong>NOT</strong> receive unrestricted access by default.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#E879F9]">
              Revocable at any second with 1 tap
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};
