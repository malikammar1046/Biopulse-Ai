import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Activity, Calendar, FileText, Pill, Utensils, Dumbbell, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const CareCircleProblemSection: React.FC = () => {
  const [isUnified, setIsUnified] = useState(false);

  const fragments = [
    { label: 'Menstrual Cycle Logs', icon: <Calendar className="w-4 h-4 text-[#E11D48]" />, note: 'Isolated period tracker app' },
    { label: 'Daily Symptom Trends', icon: <Activity className="w-4 h-4 text-[#0891B2]" />, note: 'Notes app & loose memory' },
    { label: 'Nutrition & Meals', icon: <Utensils className="w-4 h-4 text-[#059669]" />, note: 'Diet tracker slips' },
    { label: 'Fitness & Movement', icon: <Dumbbell className="w-4 h-4 text-[#0284C7]" />, note: 'Smartwatch history' },
    { label: 'Medication & Supplements', icon: <Pill className="w-4 h-4 text-[#D97706]" />, note: 'Prescription bottles & alarms' },
    { label: 'Lab Reports & Bloodwork', icon: <FileText className="w-4 h-4 text-[#7C3AED]" />, note: 'Paper slips in folders' },
    { label: 'Upcoming Appointments', icon: <Calendar className="w-4 h-4 text-[#E11D48]" />, note: 'Calendar app alerts' },
    { label: 'AI Health Conversations', icon: <MessageSquare className="w-4 h-4 text-[#0891B2]" />, note: 'Private symptom queries' },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#F8FAFC] text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            <Layers className="w-4 h-4 text-[#0891B2]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0891B2]">
              The Fragmentation Challenge
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display">
            Health information is everywhere.{' '}
            <span className="text-[#0891B2]">
              Support is usually disconnected.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal max-w-2xl mx-auto">
            When health data lives in eight separate places, explaining your symptoms to doctors and loved ones becomes exhausting. BioPulse AI introduces an intelligent central layer to organize what matters.
          </p>

          {/* Interactive State Toggle */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-slate-200/70 border border-slate-300/80">
              <button
                type="button"
                onClick={() => setIsUnified(false)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  !isUnified
                    ? 'bg-white text-[#162A45] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fragmented Reality
              </button>
              <button
                type="button"
                onClick={() => setIsUnified(true)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isUnified
                    ? 'bg-[#0891B2] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Unified Care Circle Layer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Stage */}
        <div className="relative min-h-[460px] rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-10 shadow-sm flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!isUnified ? (
              /* FRAGMENTED STATE */
              <motion.div
                key="fragmented"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative"
              >
                {fragments.map((frag, idx) => (
                  <motion.div
                    key={frag.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-slate-300 hover:bg-white transition-all text-left shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                        {frag.icon}
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-[#E11D48] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                        Disconnected
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#162A45] font-display">
                        {frag.label}
                      </h4>
                      <p className="text-xs text-slate-500 font-sans mt-1">
                        {frag.note}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* UNIFIED CARE CIRCLE LAYER */
              <motion.div
                key="unified"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col items-center text-center space-y-8 py-4"
              >
                {/* Central Orchestrator Orb */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00C4DF] to-[#0284C7] p-1 shadow-lg shadow-cyan-900/15 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-[#0891B2]">
                      <ShieldCheck className="w-8 h-8 text-[#0891B2]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-w-xl">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#162A45] font-display">
                    One unified health intelligence layer.
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 font-sans">
                    All your tracked signals flow into your secure personal hub — structured, timestamped, and ready for you to share selectively.
                  </p>
                </div>

                {/* 3 Unified Gateways */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
                  <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#0284C7] text-xs font-bold uppercase tracking-wider font-display">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Doctor Brief View</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Longitudinal reports, medication adherence, cycle summaries, and physician discussion prep.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#E11D48] text-xs font-bold uppercase tracking-wider font-display">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Family &amp; Routine View</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Selected medication reminders, appointment alerts, and general wellness check-ins.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#7C3AED] text-xs font-bold uppercase tracking-wider font-display">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Private Shield</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Raw intimate AI chats and unshared sensitive markers remain 100% encrypted and private.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
};
