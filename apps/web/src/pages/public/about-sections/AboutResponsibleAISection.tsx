import React from 'react';
import { Eye, UserCheck, ShieldAlert, Lock } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const AboutResponsibleAISection: React.FC = () => {
  const principles = [
    {
      title: 'We Explain',
      desc: 'Machine learning outputs are paired with SHAP-based feature importance so users understand which indicators drove the pattern.',
      icon: Eye,
      accent: '#8E3EAF',
    },
    {
      title: 'We Verify',
      desc: 'OCR-extracted medical metrics require explicit user review before any calculation, preventing corrupted records.',
      icon: UserCheck,
      accent: '#A21CAF',
    },
    {
      title: 'We Respect Boundaries',
      desc: 'PMOSense is an educational health information system, not a diagnostic medical device. It never replaces clinical consultations.',
      icon: ShieldAlert,
      accent: '#E87084',
    },
    {
      title: 'We Protect Privacy',
      desc: 'Your reproductive data is stored with end-to-end security principles. Zero data broker selling, zero third-party tracking.',
      icon: Lock,
      accent: '#047857',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Lock className="w-3.5 h-3.5" />
            <span>Ethical Standards</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            AI should explain,{' '}
            <span className="bg-gradient-to-r from-[#FDA4AF] via-[#FB7185] to-[#C084FC] bg-clip-text text-transparent">
              not pretend to know everything.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            Healthcare artificial intelligence requires humility, transparency, and strict ethical discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-md space-y-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: p.accent }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-display text-white">{p.title}</h3>
                <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
