import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  Search,
  Sliders,
  UtensilsCrossed,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../../../components/ui/Container';
import { ROUTES } from '../../../constants/routes';

export const WhatBioPulseAIDoesSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Unified Intake',
      subtitle: 'Symptoms, Labs & Imaging',
      desc: 'Bring fragmented symptoms, blood biomarker reports, and pelvic ultrasound scans into a single, cohesive health context.',
      icon: Search,
      accent: '#E11D48',
      bg: 'bg-rose-50',
      border: 'border-pink-200',
    },
    {
      num: '02',
      title: 'Dedicated Screening',
      subtitle: 'PCOS & Male Hypogonadism',
      desc: 'Screen for endocrine risk using specialized models tailored strictly to your physiological pathway without generic guesswork.',
      icon: Activity,
      accent: '#0891B2',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
    },
    {
      num: '03',
      title: 'Transparent Attribution',
      subtitle: 'Explainable AI (XAI)',
      desc: 'See exactly which symptoms and lab markers contributed to your risk score through clear visual factor attribution.',
      icon: BrainCircuit,
      accent: '#7C3AED',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
    {
      num: '04',
      title: 'Cost-Aware Guidance',
      subtitle: 'Value of Information',
      desc: 'Understand which next clinical test offers the highest information gain relative to test burden and cost before scheduling appointments.',
      icon: Sliders,
      accent: '#D97706',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      num: '05',
      title: 'Pakistani Nutrition',
      subtitle: 'Culturally Tailored Plans',
      desc: 'Receive 7-day culturally aligned meal guidance designed for endocrine and metabolic stability using accessible local ingredients.',
      icon: UtensilsCrossed,
      accent: '#059669',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      num: '06',
      title: 'Doctor Preparation',
      subtitle: 'Structured Consult Briefs',
      desc: 'Export organized symptom chronologies and lab summaries to prepare for collaborative consultations with your healthcare provider.',
      icon: ShieldCheck,
      accent: '#0284C7',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
    },
  ];

  return (
    <section
      id="what-biopulse-does"
      className="py-24 sm:py-32 bg-gradient-to-b from-transparent via-white/50 to-transparent text-[#162A45] overflow-hidden border-t border-slate-200/80 select-none relative"
      aria-labelledby="solution-title"
    >
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-pink-100/35 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-cyan-100/35 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Clinical Intelligence</span>
          </div>

          <h2
            id="solution-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
          >
            What BioPulse AI{' '}
            <span className="text-[#0891B2]">
              Does For You
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            Reproductive and endocrine health data is typically fragmented across paper lab reports, symptom logs, and separate clinics. BioPulse AI unites these signals into explainable screening and decision support.
          </p>
        </div>

        {/* 6 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      Step {step.num}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${step.bg} border ${step.border}`}
                    >
                      <Icon className="w-5 h-5" style={{ color: step.accent }} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-display text-[#162A45] group-hover:text-[#0891B2] transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: step.accent }}>
                      {step.subtitle}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Non-Diagnostic</span>
                  <span className="font-semibold text-[#0891B2] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Details →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Link to How It Works */}
        <div className="mt-12 text-center">
          <Link
            to={ROUTES.HOW_IT_WORKS}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0891B2] hover:text-[#0E7490] transition-colors group"
          >
            <span>Explore the complete 7-step user journey in How It Works</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default WhatBioPulseAIDoesSection;
