import React, { useState } from 'react';
import { Lock, ShieldCheck, Stethoscope, Users, UserCheck, SlidersHorizontal } from 'lucide-react';
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
    { key: 'fitness', label: 'Fitness & Movement Logs', category: 'Lifestyle', defaultDoctor: true, defaultFamily: false, defaultPartner: true },
    { key: 'reports', label: 'Biomarker Lab Reports', category: 'Clinical', defaultDoctor: true, defaultFamily: false, defaultPartner: false },
    { key: 'appointments', label: 'Upcoming Appointments & Prep', category: 'Coordination', defaultDoctor: true, defaultFamily: true, defaultPartner: true },
    { key: 'medication', label: 'Medication & Routine Alarms', category: 'Routine', defaultDoctor: true, defaultFamily: true, defaultPartner: false },
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
      icon: <Stethoscope className="w-5 h-5 text-[#0284C7]" />,
      badge: 'CLINICIAN VIEW',
      summarySnippet: 'Receives structured weekly clinical brief, biomarker report summaries, and prepared visit queries.',
    },
    family: {
      name: 'Aisha (Sister)',
      role: 'Family Member • Daily Support',
      icon: <Users className="w-5 h-5 text-[#E11D48]" />,
      badge: 'FAMILY VIEW',
      summarySnippet: 'Kept in sync on shared medication alarms and appointment logistics without access to sensitive clinical data.',
    },
    partner: {
      name: 'Care Partner',
      role: 'Designated Support Person',
      icon: <UserCheck className="w-5 h-5 text-[#7C3AED]" />,
      badge: 'CARE PARTNER VIEW',
      summarySnippet: 'Receives routine adherence insights, lifestyle updates, and visit prep reminders with your consent.',
    },
  };

  return (
    <section id="care-circle-permissions" className="py-20 sm:py-28 bg-white text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
            <SlidersHorizontal className="w-4 h-4 text-[#0891B2]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Granular Permission Control
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display">
            One patient.{' '}
            <span className="text-[#0891B2]">
              Three clear permission views.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Your gynecologist doesn't need to read private symptom chats. Your sister doesn't need to inspect sensitive ultrasound markers. BioPulse AI lets you toggle exact categories on and off at any second.
          </p>
        </div>

        {/* ── Interactive Permission Switcher Console ── */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-slate-50/80 border border-slate-200/90 p-6 sm:p-10 shadow-sm">
          {/* Persona Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 sm:mb-10 pb-6 border-b border-slate-200/80">
            {(['doctor', 'family', 'partner'] as const).map((persona) => {
              const active = activePersona === persona;
              const cfg = personaConfig[persona];
              return (
                <button
                  key={persona}
                  type="button"
                  onClick={() => setActivePersona(persona)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                    active
                      ? 'bg-white border-2 border-[#0891B2] shadow-sm text-[#162A45]'
                      : 'bg-white/60 border-slate-200/80 hover:bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/70 shrink-0">
                    {cfg.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#162A45] font-display">
                        {cfg.name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {cfg.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Persona Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 mb-8 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#0891B2] bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                  {personaConfig[activePersona].badge}
                </span>
                <span className="text-xs text-slate-500 font-sans">• Permission Configurator</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-sans">
                {personaConfig[activePersona].summarySnippet}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-bold shrink-0 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
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
                      ? 'bg-rose-50/40 border-rose-200/80 shadow-2xs'
                      : isAllowed
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-white/60 border-slate-200/70 opacity-75'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                        {rule.category}
                      </span>
                      {rule.isPrivateAi && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-mono font-bold text-[#E11D48]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private Shield</span>
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-[#162A45] block">
                      {rule.label}
                    </span>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(rule.key)}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAllowed ? 'bg-[#0891B2]' : 'bg-slate-300'
                    }`}
                    aria-label={`Toggle ${rule.label}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center text-[9px] font-bold ${
                        isAllowed ? 'translate-x-6 text-[#0891B2]' : 'translate-x-0 text-slate-400'
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
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0891B2] shrink-0" />
              <span>
                Doctors and family do <strong>NOT</strong> receive unrestricted access by default.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#0891B2] font-semibold">
              Revocable at any second with 1 click
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};
