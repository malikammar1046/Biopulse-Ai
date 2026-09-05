import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Activity, Calendar, FileText, Pill, Utensils, Dumbbell, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const CareCircleProblemSection: React.FC = () => {
  const [isUnified, setIsUnified] = useState(false);

  const fragments = [
    { label: 'Menstrual Cycle Logs', icon: <Calendar className="w-4 h-4 text-[#FB7185]" />, note: 'Isolated period tracker app' },
    { label: 'Daily Symptom Trends', icon: <Activity className="w-4 h-4 text-[#E879F9]" />, note: 'Notes app & loose memory' },
    { label: 'Nutrition & Meals', icon: <Utensils className="w-4 h-4 text-[#34D399]" />, note: 'Diet tracker slips' },
    { label: 'Fitness & Physical Activity', icon: <Dumbbell className="w-4 h-4 text-[#38BDF8]" />, note: 'Smartwatch history' },
    { label: 'Medication & Supplements', icon: <Pill className="w-4 h-4 text-[#FBBF24]" />, note: 'Prescription bottles & alarms' },
    { label: 'Lab Reports & Bloodwork', icon: <FileText className="w-4 h-4 text-[#C084FC]" />, note: 'Paper printouts in folders' },
    { label: 'Upcoming Appointments', icon: <Calendar className="w-4 h-4 text-[#F43F5E]" />, note: 'Calendar app alerts' },
    { label: 'AI Health Conversations', icon: <MessageSquare className="w-4 h-4 text-[#A855F7]" />, note: 'Private symptom queries' },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#180A25] text-white relative overflow-hidden border-t border-white/10">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />

      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-18">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Layers className="w-4 h-4 text-[#FB7185]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
              The Fragmentation Challenge
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            Health information is everywhere.{' '}
            <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
              Support is usually disconnected.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
          >
            When health data lives in eight different places, explaining your reality to doctors and loved ones becomes exhausting. VITASense introduces an intelligent central layer to organize what matters.
          </motion.p>

          {/* Interactive State Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="pt-4 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-[#10071A] border border-white/15 backdrop-blur-md">
              <button
                onClick={() => setIsUnified(false)}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  !isUnified
                    ? 'bg-white/15 text-white shadow-md'
                    : 'text-[#B4A6C7] hover:text-white'
                }`}
              >
                Fragmented Reality
              </button>
              <button
                onClick={() => setIsUnified(true)}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isUnified
                    ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white shadow-lg shadow-purple-950/50'
                    : 'text-[#B4A6C7] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#FB7185]" />
                <span>Unified Care Circle Layer</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Interactive Stage */}
        <div className="relative min-h-[480px] rounded-3xl bg-[#10071A]/80 border border-white/12 p-6 sm:p-10 backdrop-blur-xl flex items-center justify-center overflow-hidden shadow-2xl shadow-purple-950/40">
          <AnimatePresence mode="wait">
            {!isUnified ? (
              /* FRAGMENTED STATE */
              <motion.div
                key="fragmented"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative"
              >
                {fragments.map((frag, idx) => (
                  <motion.div
                    key={frag.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="p-5 rounded-2xl bg-[#180A25]/90 border border-white/10 space-y-3 hover:border-white/20 transition-all text-left shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                        {frag.icon}
                      </div>
                      <span className="text-[10px] font-mono text-[#F43F5E] bg-[#F43F5E]/10 px-2 py-0.5 rounded-full border border-[#F43F5E]/20">
                        Disconnected
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">
                        {frag.label}
                      </h4>
                      <p className="text-xs text-[#B4A6C7] font-sans mt-1">
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="w-full flex flex-col items-center text-center space-y-8 py-4"
              >
                {/* Central Orchestrator Orb */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8E3EAF] via-[#A21CAF] to-[#E87084] p-1 shadow-[0_0_50px_rgba(232,112,132,0.6)] animate-pulse flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#180A25] flex flex-col items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-[#FB7185]" />
                      <span className="text-[9px] font-mono font-bold text-[#E879F9]">
                        VITASENSE CORE
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-w-xl">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    One unified health intelligence layer.
                  </h3>
                  <p className="text-sm sm:text-base text-[#EDE4F7] font-sans">
                    All your tracked signals flow into your secure personal hub — structured, timestamped, and ready for you to share selectively.
                  </p>
                </div>

                {/* 3 Unified Gateways */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
                  <div className="p-5 rounded-2xl bg-[#180A25]/90 border border-[#8E3EAF]/50 space-y-2 shadow-xl">
                    <div className="flex items-center gap-2 text-[#C084FC] text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                      <span>Doctor Brief View</span>
                    </div>
                    <p className="text-xs text-[#B4A6C7]">
                      Longitudinal reports, medication adherence, cycle summaries, and physician discussion prep.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#180A25]/90 border border-[#C084FC]/50 space-y-2 shadow-xl">
                    <div className="flex items-center gap-2 text-[#E879F9] text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                      <span>Family & Routine View</span>
                    </div>
                    <p className="text-xs text-[#B4A6C7]">
                      Selected medication reminders, appointment alerts, and general wellness check-ins.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#180A25]/90 border border-[#FB7185]/50 space-y-2 shadow-xl">
                    <div className="flex items-center gap-2 text-[#FB7185] text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                      <span>Private Shield</span>
                    </div>
                    <p className="text-xs text-[#B4A6C7]">
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
