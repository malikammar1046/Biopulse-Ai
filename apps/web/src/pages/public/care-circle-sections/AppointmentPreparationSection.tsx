import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, FileText, Bell, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const AppointmentPreparationSection: React.FC = () => {
  const steps = [
    {
      day: '7 Days Before',
      title: 'Appointment Detected',
      desc: 'BioPulse AI notes your upcoming clinical visit and begins grouping your recent 30-day symptom and lifestyle trends.',
      badge: 'Timeline Initiated',
      icon: <Calendar className="w-4 h-4 text-[#0891B2]" />,
    },
    {
      day: '3 Days Before',
      title: 'Review Recent Reports',
      desc: 'Organize biomarker lab results and documents recommended by your clinician so everything is digitized and accessible.',
      badge: 'Biomarker Check',
      icon: <FileText className="w-4 h-4 text-[#0284C7]" />,
    },
    {
      day: '2 Days Before',
      title: 'Prepare Health Summary',
      desc: 'Confirm your custom permissions and review the organized symptom and adherence summary you wish to share.',
      badge: 'Permission Review',
      icon: <ShieldCheck className="w-4 h-4 text-[#059669]" />,
    },
    {
      day: '1 Day Before',
      title: 'Checklist & Reminders',
      desc: 'Receive logistical reminders and your personalized checklist of questions discussed during the week.',
      badge: 'Readiness Alert',
      icon: <Bell className="w-4 h-4 text-[#D97706]" />,
    },
    {
      day: 'Appointment Day',
      title: 'Weekly Brief is Ready',
      desc: 'One structured summary for productive, high-efficiency dialogue with your healthcare provider.',
      badge: 'Brief Active',
      icon: <Sparkles className="w-4 h-4 text-[#0891B2]" />,
    },
    {
      day: 'Post-Appointment',
      title: 'Update Your Care Plan',
      desc: 'Log clinician-recommended lifestyle adjustments, updated medication timings, or next follow-up dates.',
      badge: 'Plan Continuity',
      icon: <RefreshCw className="w-4 h-4 text-[#7C3AED]" />,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
            <Clock className="w-4 h-4 text-[#0891B2]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Appointment Preparation Flow
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display">
            Before the appointment.{' '}
            <span className="text-[#0891B2]">
              Preparation in sync.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal max-w-2xl mx-auto">
            Never walk into a consultation unprepared. BioPulse AI guides your timeline step-by-step to maximize every minute with your doctor.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              whileHover={{ y: -4 }}
              className="p-6 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs hover:shadow-md hover:bg-white transition-all text-left group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0891B2] bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200/70">
                    {step.day}
                  </span>
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    {step.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#162A45] font-display">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans mt-2">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono text-[#0891B2] font-semibold">
                <span>{step.badge}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Clinical Preparation Note */}
        <div className="mt-12 p-4.5 rounded-2xl bg-slate-50 border border-slate-200 max-w-3xl mx-auto text-xs text-slate-600 text-center font-sans">
          <span>
            💡 <strong>Proactive Collaboration:</strong> BioPulse AI helps you organize tests and records recommended by your clinician — ensuring consultations are grounded in longitudinal clarity.
          </span>
        </div>
      </Container>
    </section>
  );
};
