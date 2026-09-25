import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Shield, Bell, Calendar, Sparkles, Check, Lock, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const FamilySupportSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#F8FAFC] text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── LEFT COLUMN: Animated Permission Ring & Lock Shield on White Card ── */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="relative w-full max-w-[460px] p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6 text-left"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#E11D48] shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#162A45] font-display">
                      Aisha's Family View
                    </h3>
                    <span className="text-xs text-slate-500 font-sans">Sister &amp; Designated Support</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-700 font-bold">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Permission Ring Active</span>
                </div>
              </div>

              {/* Permitted Feed Elements */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-[#D97706] border border-amber-200/60">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#162A45] block font-display">Morning Routine Check</span>
                      <span className="text-[10px] text-slate-500 font-sans">Shared reminder • 9:00 AM</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Done
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/60">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#162A45] block font-display">Upcoming Consultation</span>
                      <span className="text-[10px] text-slate-500 font-sans">Sept 4 • Logistics shared</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-[#0284C7] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full">
                    Calendar Only
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#162A45] block font-display">Weekly Wellness Streak</span>
                      <span className="text-[10px] text-slate-500 font-sans">Hydration &amp; activity achieved</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                    🎉 5/5
                  </span>
                </div>
              </div>

              {/* Explicit Hidden Shield Banner */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-[#E11D48] font-bold text-[11px] uppercase tracking-wider font-display">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Shielded From Family View</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 font-sans">
                  Lab PDF reports, private AI conversations, and granular cycle entries are strictly hidden.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Human Story & Philosophy ── */}
          <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-[#E11D48]">
              <Heart className="w-4 h-4 text-[#E11D48]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Empathetic Connection
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display">
              Support without{' '}
              <span className="text-[#0891B2]">
                losing independence.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal">
              Managing hormonal health often benefits from the encouragement of those who care about you. But being supported shouldn't require surrendering your personal dignity or privacy.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <h4 className="text-sm font-bold text-[#162A45] font-display flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Routine Encouragement</span>
                </h4>
                <p className="text-xs text-slate-600 font-sans pl-6 leading-relaxed">
                  Loved ones can see that you took your supplements or completed your morning walk without seeing clinical diagnosis notes.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <h4 className="text-sm font-bold text-[#162A45] font-display flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Appointment Logistics</span>
                </h4>
                <p className="text-xs text-slate-600 font-sans pl-6 leading-relaxed">
                  Enable family members to coordinate rides or check-in schedules without giving them access to sensitive doctor notes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
