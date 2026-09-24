import React from 'react';
import { Eye, UserCheck, ShieldCheck, HeartHandshake, AlertCircle, Ban, Lock } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const HowItWorksResponsibleAISection: React.FC = () => {
  const principles = [
    {
      title: 'Explainability',
      desc: 'The platform aims to explain what information influenced an assessment using transparent feature attribution, never black-box scores.',
      icon: Eye,
      accent: '#8E3EAF',
    },
    {
      title: 'Limitations',
      desc: 'Screening is not diagnosis. BIOPulse AI evaluates statistical pattern alignment rather than providing definitive clinical labels.',
      icon: AlertCircle,
      accent: '#E87084',
    },
    {
      title: 'Human Oversight',
      desc: 'Healthcare professionals remain fully responsible for clinical diagnosis, diagnostic confirmation, and therapeutic decisions.',
      icon: HeartHandshake,
      accent: '#3B82F6',
    },
    {
      title: 'Data Verification',
      desc: 'Users verify all OCR-extracted laboratory values against original paperwork before data enters their analytical record.',
      icon: UserCheck,
      accent: '#A21CAF',
    },
    {
      title: 'No Treatment Prescription',
      desc: 'The platform never prescribes pharmaceuticals, medical treatments, or diagnostic investigations. All tools are strictly supportive.',
      icon: Ban,
      accent: '#F59E0B',
    },
    {
      title: 'Privacy & Control',
      desc: 'Health records are encrypted and private. Information is only shared through the user’s explicit, permission-based consent.',
      icon: Lock,
      accent: '#047857',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ethical Governance</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Responsible AI designed for{' '}
            <span className="bg-gradient-to-r from-[#FDA4AF] via-[#FB7185] to-[#C084FC] bg-clip-text text-transparent">
              clinical humility.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            BIOPulse AI applies six core governance principles across both health pathways and baseline monitoring to safeguard patient safety and user agency.
          </p>
        </div>

        {/* 6 Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-md space-y-3 hover:border-white/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: p.accent }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visible Safety Statement */}
        <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-[#FFF0F2]/10 border border-[#FDA4AF]/30 flex items-start gap-4 text-xs sm:text-sm text-[#EDE4F7] shadow-xl">
          <AlertCircle className="w-6 h-6 text-[#FDA4AF] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#FDA4AF] uppercase tracking-wider block font-mono text-xs">
              Safety & Regulatory Statement
            </span>
            <p className="leading-relaxed">
              "This platform is for screening and educational purposes only. It does not diagnose, prescribe treatment, or replace a healthcare professional."
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
