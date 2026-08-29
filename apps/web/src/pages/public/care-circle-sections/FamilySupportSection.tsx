import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Shield, Bell, Calendar, Sparkles, Check, Lock, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const FamilySupportSection: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 bg-[#180A25] text-white relative overflow-hidden border-t border-white/10">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/3 w-[650px] h-[650px] bg-[#E87084]/15 rounded-full blur-[180px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── LEFT COLUMN: Animated Permission Ring & Lock Shield ── */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[460px] p-8 rounded-3xl bg-[#10071A]/90 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-purple-950/50 space-y-6 text-left"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FB7185] to-[#A21CAF] flex items-center justify-center text-white shadow-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      Aisha's Family View
                    </h3>
                    <span className="text-xs text-[#B4A6C7]">Sister & Designated Support</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[11px] font-mono text-[#34D399]">
                  <Lock className="w-3 h-3" />
                  <span>Permission Ring Active</span>
                </div>
              </div>

              {/* Permitted Feed Elements */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#180A25] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#FBBF24]/15 text-[#FBBF24]">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Morning Supplement Routine</span>
                      <span className="text-[10px] text-[#B4A6C7]">Shared reminder • 9:00 AM</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#34D399] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Done
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#180A25] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#FB7185]/15 text-[#FB7185]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Upcoming Doctor Appointment</span>
                      <span className="text-[10px] text-[#B4A6C7]">Sept 4 • Logistics shared</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#E879F9] bg-white/10 px-2 py-0.5 rounded-full">
                    Calendar Only
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#180A25] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Weekly Wellness Streak</span>
                      <span className="text-[10px] text-[#B4A6C7]">Hydration & Step goal achieved</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#34D399] flex items-center gap-1">
                    🎉 5/5
                  </span>
                </div>
              </div>

              {/* Explicit Hidden Shield Banner */}
              <div className="p-3.5 rounded-2xl bg-[#10071A] border border-[#FB7185]/30 space-y-1 text-xs text-[#B4A6C7]">
                <div className="flex items-center gap-2 text-[#FB7185] font-semibold text-[11px] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Shielded From Family View</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Lab PDF reports, private AI conversations, and granular ovulation entries are strictly hidden.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Human Story & Philosophy ── */}
          <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
            >
              <Heart className="w-4 h-4 text-[#FB7185]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
                Empathetic Connection
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
            >
              Support without{' '}
              <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
                losing independence.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
            >
              Managing hormonal health often benefits from the encouragement of those who care about you. But being supported shouldn't require surrendering your dignity or privacy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="space-y-4 pt-2"
            >
              <div className="p-4 rounded-2xl bg-[#10071A]/70 border border-white/10 space-y-1">
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  <span>Routine Encouragement</span>
                </h4>
                <p className="text-xs text-[#B4A6C7] font-sans pl-6">
                  Loved ones can see that you took your supplements or completed your morning walk without seeing clinical diagnosis notes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#10071A]/70 border border-white/10 space-y-1">
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  <span>Appointment Logistics</span>
                </h4>
                <p className="text-xs text-[#B4A6C7] font-sans pl-6">
                  Enable family members to coordinate rides or reminders without giving them access to sensitive doctor notes.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
