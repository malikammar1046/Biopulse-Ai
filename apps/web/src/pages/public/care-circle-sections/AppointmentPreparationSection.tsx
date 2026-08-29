import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, FileText, Bell, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const AppointmentPreparationSection: React.FC = () => {
  const steps = [
    {
      day: '7 Days Before',
      title: 'Appointment Detected',
      desc: 'OVASense notes your upcoming clinical visit and begins grouping your recent 30-day symptom and lifestyle trends.',
      badge: 'Timeline Initiated',
      icon: <Calendar className="w-4 h-4 text-[#FB7185]" />,
    },
    {
      day: '3 Days Before',
      title: 'Review Recent Reports',
      desc: 'Organize biomarker lab results and documents recommended by your clinician so everything is digitized and accessible.',
      badge: 'Biomarker Check',
      icon: <FileText className="w-4 h-4 text-[#C084FC]" />,
    },
    {
      day: '2 Days Before',
      title: 'Prepare Selected Health Summary',
      desc: 'Confirm your custom permissions and review the organized symptom and adherence summary you wish to share.',
      badge: 'Permission Review',
      icon: <ShieldCheck className="w-4 h-4 text-[#E879F9]" />,
    },
    {
      day: '1 Day Before',
      title: 'Appointment Reminder & Checklist',
      desc: 'Receive logistical reminders and your personalized checklist of questions discussed during the week.',
      badge: 'Readiness Alert',
      icon: <Bell className="w-4 h-4 text-[#FBBF24]" />,
    },
    {
      day: 'Appointment Day',
      title: 'Your Weekly Brief is Ready',
      desc: 'One structured summary for productive, high-efficiency dialogue with your healthcare provider.',
      badge: 'Brief Active',
      icon: <Sparkles className="w-4 h-4 text-[#34D399]" />,
    },
    {
      day: 'Post-Appointment',
      title: 'Update Your Care Plan',
      desc: 'Log clinician-recommended lifestyle adjustments, updated medication timings, or next follow-up dates.',
      badge: 'Plan Continuity',
      icon: <RefreshCw className="w-4 h-4 text-[#38BDF8]" />,
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#10071A] text-white relative overflow-hidden border-t border-white/10">
      {/* Background Soft Glow */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[#8E3EAF]/15 rounded-full blur-[180px] pointer-events-none -z-10" />

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
            <Clock className="w-4 h-4 text-[#FB7185]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
              Appointment Preparation Flow
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            Before the appointment.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Preparation in sync.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
          >
            Never walk into a consultation unprepared. OVASense guides your timeline step-by-step to maximize every minute with your doctor.
          </motion.p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="p-6 sm:p-7 rounded-3xl bg-[#180A25]/85 border border-white/12 flex flex-col justify-between backdrop-blur-xl shadow-xl shadow-purple-950/40 hover:border-white/25 transition-all text-left group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#FB7185] bg-[#FB7185]/15 px-3 py-1 rounded-full border border-[#FB7185]/30">
                    {step.day}
                  </span>
                  <div className="p-2 rounded-xl bg-white/10 border border-white/15 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed font-sans mt-2">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#E879F9]">
                <span>{step.badge}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Clinical Preparation Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-12 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-3xl mx-auto text-xs text-[#B4A6C7] text-center"
        >
          <span>
            💡 <strong>Proactive Collaboration:</strong> OVASense helps you organize tests and records recommended by your clinician — ensuring your consultations are grounded in longitudinal clarity.
          </span>
        </motion.div>
      </Container>
    </section>
  );
};
