import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Activity, Pill, Utensils, Dumbbell, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const WeeklyDoctorBriefSection: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 bg-[#180A25] text-white relative overflow-hidden border-t border-white/10">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[170px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── LEFT COLUMN: Narrative & Context ── */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
            >
              <FileText className="w-4 h-4 text-[#FB7185]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
                Clinician Synthesis
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
            >
              Give your doctor the{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                bigger picture.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
            >
              Instead of reconstructing your week from memory during a rushed 15-minute consultation, VITASense organizes the information you've chosen to share into a crisp, physician-friendly brief.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="space-y-3 pt-2"
            >
              {[
                { title: 'Zero Memory Burden', desc: 'No scrambling for lost symptom dates or forgotten medication slips.' },
                { title: 'Prepared Questions', desc: 'Synthesizes questions you discussed with VITASense during the week.' },
                { title: 'Patient Permission Guard', desc: 'Only includes categories explicitly toggled ON by you.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#34D399] shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">{item.title}</h4>
                    <p className="text-xs text-[#B4A6C7] font-sans">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: High-Fidelity Weekly Health Brief Mockup ── */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-3xl bg-[#10071A]/95 border border-white/15 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-purple-950/60 overflow-hidden text-left"
            >
              {/* Top Accent Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#FB7185]" />

              {/* Brief Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FB7185] bg-[#FB7185]/15 px-2.5 py-0.5 rounded-full border border-[#FB7185]/30">
                      WEEKLY HEALTH BRIEF
                    </span>
                    <span className="text-xs font-mono text-[#8D7E9E]">Ref: OVA-BRF-882</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display mt-1">
                    Sarah M. • Longitudinal Snapshot
                  </h3>
                  <span className="text-xs text-[#B4A6C7] font-sans">
                    Window: Aug 24 — Aug 30, 2026 (7 Days)
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-right">
                  <span className="text-[10px] text-[#8D7E9E] block uppercase font-mono">Prepared For</span>
                  <span className="text-xs font-bold text-[#E879F9]">Dr. Ahmed (Ob/Gyn)</span>
                </div>
              </div>

              {/* 7 Core Metric Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-white/10">
                <div className="p-3 rounded-xl bg-[#180A25] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#FB7185]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cycle</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-display block">Day 14</span>
                  <span className="text-[10px] text-[#8D7E9E] block">Follicular Phase</span>
                </div>

                <div className="p-3 rounded-xl bg-[#180A25] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#34D399]">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Nutrition</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-display block">5 / 7 Days</span>
                  <span className="text-[10px] text-[#8D7E9E] block">Balanced Glycemic</span>
                </div>

                <div className="p-3 rounded-xl bg-[#180A25] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#38BDF8]">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Fitness</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-display block">3 Sessions</span>
                  <span className="text-[10px] text-[#8D7E9E] block">Low-impact Cardio</span>
                </div>

                <div className="p-3 rounded-xl bg-[#180A25] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#FBBF24]">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Medication</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-display block">6 / 7 Logs</span>
                  <span className="text-[10px] text-[#8D7E9E] block">86% Adherence</span>
                </div>

                <div className="p-3 rounded-xl bg-[#180A25] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#E879F9]">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Symptoms</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-display block">4 Entries</span>
                  <span className="text-[10px] text-[#8D7E9E] block">Mild fatigue, bloating</span>
                </div>

                <div className="p-3 rounded-xl bg-[#180A25] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#C084FC]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lab Reports</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-display block">1 Digitized</span>
                  <span className="text-[10px] text-[#8D7E9E] block">Fasting Insulin</span>
                </div>

                <div className="p-3 rounded-xl bg-[#180A25] border border-white/10 space-y-1 col-span-2 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#F43F5E]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Upcoming Visit</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-display block">Sept 4, 10:30 AM</span>
                  <span className="text-[10px] text-[#8D7E9E] block">Follow-up with Dr. Ahmed</span>
                </div>
              </div>

              {/* Topics Discussed With VITASense AI */}
              <div className="py-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FB7185]" />
                  <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                    Topics Discussed with VITASense AI (Patient-Prepared)
                  </h4>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-[#EDE4F7] font-sans">
                  <div className="p-2.5 rounded-xl bg-[#180A25] border border-white/10 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] shrink-0 mt-1.5" />
                    <span>Concern about recurring mid-cycle fatigue & evening sugar cravings.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#180A25] border border-white/10 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E879F9] shrink-0 mt-1.5" />
                    <span>Questions regarding recent fasting insulin trend compared to last quarter.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#180A25] border border-white/10 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shrink-0 mt-1.5" />
                    <span>Asked about maintaining consistent strength training while managing cycle fluctuations.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#180A25] border border-white/10 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0 mt-1.5" />
                    <span>Prepared 3 specific questions for upcoming appointment on Sept 4.</span>
                  </div>
                </div>
              </div>

              {/* Regulatory & Clinical Disclaimer */}
              <div className="pt-4 border-t border-white/10 flex items-start gap-2 text-[11px] text-[#B4A6C7] leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
                <p>
                  <strong>Clinical Notice:</strong> Conversation summaries reflect topics discussed with VITASense and are not clinical diagnoses. All medical decisions and prescriptions remain the sole prerogative of the licensed attending physician.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
