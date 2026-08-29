import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle2, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const StartWithStorySection: React.FC = () => {
  return (
    <section id="journey-start" className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#EDE4F7] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <Badge variant="primary" showDot size="md">
              Phase 01 — Baseline Intake
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
              01 — Start with your health story
            </h2>

            <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans">
              Begin by establishing your private baseline profile. Log menstrual cycle history,
              symptom severity, family endocrine context, and daily lifestyle habits in an intuitive,
              stigma-free interface.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Cycle Duration & Flow History', desc: 'Log start dates, phase duration, and regularity patterns.' },
                { title: 'Standardized Symptom Logging', desc: 'Grade acne, hirsutism, hair thinning, and fatigue on a 1–5 clinical scale.' },
                { title: 'Lifestyle & Metabolic Baseline', desc: 'Capture dietary habits, physical activity routine, and sleep duration.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E7DFEF] shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-[#1C1326]">{item.title}</h4>
                    <p className="text-xs text-[#584B68] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Floating UI Cards Simulation */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[420px]">
            {/* Ambient Back Glow */}
            <div className="w-80 h-80 rounded-full bg-gradient-brand opacity-15 blur-3xl absolute" />

            {/* Central Health Profile Card */}
            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-xl space-y-4 max-w-md w-full relative z-10"
            >
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                    <UserCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-[#1C1326]">Health Baseline Record</h3>
                    <span className="text-[10px] text-[#8D7E9E] font-mono">ID: OVA-LOG-2026</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
                  Active Intake
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">
                  <span className="text-[10px] text-[#8D7E9E] block">Cycle Length</span>
                  <span className="text-sm font-bold text-[#1C1326]">42 Days</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">
                  <span className="text-[10px] text-[#8D7E9E] block">Acne Severity</span>
                  <span className="text-sm font-bold text-[#6E2D8B]">Grade 3 (Moderate)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">
                  <span className="text-[10px] text-[#8D7E9E] block">Sleep Rhythm</span>
                  <span className="text-sm font-bold text-[#1C1326]">6.2 hrs / Night</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">
                  <span className="text-[10px] text-[#8D7E9E] block">Hirsutism Score</span>
                  <span className="text-sm font-bold text-[#6E2D8B]">Ferriman 6</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
