import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Activity, Pill, Utensils, Dumbbell, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const WeeklyDoctorBriefSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#F8FAFC] text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── LEFT COLUMN: Narrative & Context ── */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
              <FileText className="w-4 h-4 text-[#0891B2]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Clinician Synthesis
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display">
              Give your doctor the{' '}
              <span className="text-[#0891B2]">
                bigger picture.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal">
              Instead of reconstructing your symptoms from memory during a rushed 15-minute consultation, BioPulse AI organizes the information you've chosen to share into a crisp, physician-friendly brief.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Zero Memory Burden', desc: 'No scrambling for lost symptom dates, lab results, or forgotten medication slips.' },
                { title: 'Prepared Questions', desc: 'Synthesizes questions and topics you reviewed in BioPulse AI during the week.' },
                { title: 'Patient Permission Guard', desc: 'Only includes categories explicitly toggled ON by you.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#162A45] font-display">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN: High-Fidelity Weekly Health Brief Mockup ── */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xl overflow-hidden text-left"
            >
              {/* Top Accent Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#0284C7] to-[#0D9488]" />

              {/* Brief Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0891B2] bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                      WEEKLY HEALTH BRIEF
                    </span>
                    <span className="text-xs font-mono text-slate-400">Ref: BPS-BRF-882</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#162A45] font-display mt-1">
                    Sarah M. • Longitudinal Snapshot
                  </h3>
                  <span className="text-xs text-slate-500 font-sans">
                    Window: Last 7 Days (Structured Clinical Digest)
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Prepared For</span>
                  <span className="text-xs font-bold text-[#0284C7]">Dr. Ahmed (Ob/Gyn)</span>
                </div>
              </div>

              {/* 7 Core Metric Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-slate-100">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#E11D48] font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cycle</span>
                  </div>
                  <span className="text-base font-extrabold text-[#162A45] font-display block">Day 14</span>
                  <span className="text-[10px] text-slate-500 block">Follicular Phase</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#059669] font-semibold">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Nutrition</span>
                  </div>
                  <span className="text-base font-extrabold text-[#162A45] font-display block">5 / 7 Days</span>
                  <span className="text-[10px] text-slate-500 block">Balanced Glycemic</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#0284C7] font-semibold">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Movement</span>
                  </div>
                  <span className="text-base font-extrabold text-[#162A45] font-display block">3 Sessions</span>
                  <span className="text-[10px] text-slate-500 block">Low-impact Cardio</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#D97706] font-semibold">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Routine</span>
                  </div>
                  <span className="text-base font-extrabold text-[#162A45] font-display block">6 / 7 Logs</span>
                  <span className="text-[10px] text-slate-500 block">86% Adherence</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#7C3AED] font-semibold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Symptoms</span>
                  </div>
                  <span className="text-base font-extrabold text-[#162A45] font-display block">4 Entries</span>
                  <span className="text-[10px] text-slate-500 block">Mild fatigue logged</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#0891B2] font-semibold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Reports</span>
                  </div>
                  <span className="text-base font-extrabold text-[#162A45] font-display block">1 Digitized</span>
                  <span className="text-[10px] text-slate-500 block">Fasting Insulin</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 col-span-2 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#0284C7] font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Upcoming Visit</span>
                  </div>
                  <span className="text-base font-extrabold text-[#162A45] font-display block">Sept 4, 10:30 AM</span>
                  <span className="text-[10px] text-slate-500 block">Follow-up with Dr. Ahmed</span>
                </div>
              </div>

              {/* Topics Discussed With BioPulse AI */}
              <div className="py-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0891B2]" />
                  <h4 className="text-xs font-bold text-[#162A45] font-display uppercase tracking-wider">
                    Topics Prepared for Clinical Consultation
                  </h4>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-sans">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] shrink-0 mt-1.5" />
                    <span>Observations on mid-cycle fatigue &amp; evening energy patterns.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0 mt-1.5" />
                    <span>Questions regarding recent fasting insulin trend compared to last quarter.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0 mt-1.5" />
                    <span>Maintaining consistent movement during cycle luteal phase.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] shrink-0 mt-1.5" />
                    <span>Prepared 3 specific questions for upcoming appointment.</span>
                  </div>
                </div>
              </div>

              {/* Clinical Notice */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed font-sans">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Clinical Notice:</strong> Health summaries structure patient-reported observations and verified lab values. They are decision-support aids and not diagnostic verdicts. All medical treatments remain the sole prerogative of the licensed physician.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
