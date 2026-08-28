import React from 'react';
import { Eye, UserCheck, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const HowItWorksResponsibleAISection: React.FC = () => {
  const principles = [
    {
      title: 'Explain',
      desc: 'Every pattern assessment is delivered with mathematical SHAP factor explanations so you see which biomarkers contributed.',
      icon: Eye,
      accent: '#8E3EAF',
    },
    {
      title: 'Verify',
      desc: 'Extracted OCR medical numbers must be confirmed by you before they are saved to your record.',
      icon: UserCheck,
      accent: '#A21CAF',
    },
    {
      title: 'Protect',
      desc: 'Sensitive health records are encrypted and protected with strict privacy-by-design principles.',
      icon: ShieldCheck,
      accent: '#047857',
    },
    {
      title: 'Support',
      desc: 'PMOSense facilitates informed dialogue with your gynecologist or endocrinologist rather than replacing clinical care.',
      icon: HeartHandshake,
      accent: '#E87084',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ethical Health Governance</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Technology should support understanding —{' '}
            <span className="bg-gradient-to-r from-[#FDA4AF] via-[#FB7185] to-[#C084FC] bg-clip-text text-transparent">
              not replace care.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            Our responsible artificial intelligence commitment ensures patient empowerment, clinical humility, and data integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

        {/* Subtle Non-Diagnostic Disclaimer Box */}
        <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-[#B4A6C7]">
          <AlertCircle className="w-5 h-5 text-[#FDA4AF] shrink-0" />
          <p>
            <strong>Medical Disclaimer:</strong> PMOSense is an AI-assisted health-information and longitudinal monitoring platform.
            It does not diagnose conditions, prescribe medications, or replace professional medical advice from a qualified doctor.
          </p>
        </div>
      </Container>
    </section>
  );
};
