import React from 'react';
import { Eye, UserCheck, ShieldAlert, Lock } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const AboutResponsibleAISection: React.FC = () => {
  const principles = [
    {
      title: 'We Explain',
      desc: 'Machine learning outputs are paired with SHAP-based feature importance so users understand which indicators drove the pattern.',
      icon: Eye,
      accent: '#0891B2',
      bg: 'bg-cyan-50',
    },
    {
      title: 'We Verify',
      desc: 'OCR-extracted medical metrics require explicit user review before any calculation, preventing corrupted records.',
      icon: UserCheck,
      accent: '#7C3AED',
      bg: 'bg-purple-50',
    },
    {
      title: 'We Respect Boundaries',
      desc: 'BioPulse AI is an educational screening and decision support system, not a diagnostic medical device. It never replaces clinical consultations.',
      icon: ShieldAlert,
      accent: '#E11D48',
      bg: 'bg-rose-50',
    },
    {
      title: 'We Protect Privacy',
      desc: 'Your reproductive data is stored with end-to-end security principles. Zero data broker selling, zero third-party tracking.',
      icon: Lock,
      accent: '#059669',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#FAFCFF] text-[#162A45] overflow-hidden border-t border-slate-200/80">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-100/30 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2]">
            <Lock className="w-3.5 h-3.5" />
            <span>Ethical Standards</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            AI should explain,{' '}
            <span className="text-[#0891B2]">
              not pretend to know everything.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Healthcare artificial intelligence requires humility, transparency, and strict ethical discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 text-left"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${p.bg}`}
                >
                  <Icon className="w-5 h-5" style={{ color: p.accent }} />
                </div>
                <h3 className="text-lg font-bold font-display text-[#162A45]">{p.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutResponsibleAISection;

