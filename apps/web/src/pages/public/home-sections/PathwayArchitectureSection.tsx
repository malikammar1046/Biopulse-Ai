import React from 'react';
import {
  Layers,
  Heart,
  Activity,
  FileText,
  BrainCircuit,
  Sliders,
  HeartPulse,
  History,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ScanLine
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const PathwayArchitectureSection: React.FC = () => {
  const sharedFeatures = [
    { icon: FileText, title: 'Health Profile', desc: 'Secure demographic & endocrine record' },
    { icon: ScanLine, title: 'Medical Report OCR', desc: 'Human-in-the-loop laboratory digitizer' },
    { icon: BrainCircuit, title: 'Explainable AI', desc: 'Transparent factor attribution (SHAP)' },
    { icon: Sliders, title: 'Information Prioritization', desc: 'Value vs. estimated cost guidance' },
    { icon: HeartPulse, title: 'Lifestyle Support', desc: 'Pragmatic, culture-aware daily habits' },
    { icon: History, title: 'Longitudinal Timeline', desc: 'Multi-month trend trajectory monitoring' },
    { icon: GraduationCap, title: 'Accessible Education', desc: 'Plain-language health literacy' },
  ];

  return (
    <section
      id="pathway-architecture"
      className="py-24 sm:py-32 bg-gradient-to-b from-[#12071F] via-[#180A26] to-[#10071A] text-white border-t border-white/10 relative overflow-hidden select-none"
      aria-labelledby="architecture-title"
    >
      {/* Ambient Volumetric Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[170px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Platform Architecture
            </span>
          </div>

          <h2
            id="architecture-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight"
          >
            Two Distinct Pathways.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#38BDF8] bg-clip-text text-transparent">
              One Shared Platform.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed font-sans">
            VITASense AI was intentionally designed as a unified health system. Specialized screening
            models run atop a shared foundation of explainability, privacy, and continuous tracking.
          </p>
        </div>

        {/* Visual Dual Pathway Tree Hierarchy Diagram */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-[36px] bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-12">
          {/* Root Node: VITASense AI */}
          <div className="flex flex-col items-center">
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#8E3EAF] via-[#6E2D8B] to-[#0284C7] border border-white/30 shadow-2xl flex items-center gap-3 text-white">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
              <div className="text-left">
                <span className="text-xs font-mono uppercase font-bold tracking-widest text-purple-200 block">
                  Core Ecosystem
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight">
                  VITASense AI
                </h3>
              </div>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-white/40 to-white/20 my-1" />

            {/* Horizontal Branching Bar */}
            <div className="relative w-full max-w-lg h-0.5 bg-gradient-to-r from-[#FB7185]/60 via-white/30 to-[#38BDF8]/60 flex items-center justify-between">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] -translate-y-1/2 shadow-[0_0_8px_#FB7185]" />
              <div className="w-2 h-2 rounded-full bg-white/40 -translate-y-1/2" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] -translate-y-1/2 shadow-[0_0_8px_#38BDF8]" />
            </div>

            {/* Two Branch Drops */}
            <div className="w-full max-w-lg flex items-center justify-between">
              <div className="w-0.5 h-8 bg-[#FB7185]/50 ml-1" />
              <div className="w-0.5 h-8 bg-[#38BDF8]/50 mr-1" />
            </div>

            {/* Pathway Endpoints Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {/* Left Branch: Women's Health → PCOS */}
              <div className="p-6 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-left space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2.5 text-[#FB7185]">
                  <Heart className="w-5 h-5 fill-current" />
                  <span className="text-xs font-mono uppercase font-bold tracking-wider">
                    Pathway A
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white font-display">Women's Health</h4>
                <div className="inline-block px-3 py-1 rounded-full bg-[#FB7185]/20 border border-[#FB7185]/40 text-xs font-bold text-white">
                  PCOS Risk Assessment & Follicular Dynamics
                </div>
                <p className="text-xs text-[#CDBDD8] leading-relaxed">
                  Menstrual rhythm tracking, Rotterdam criteria evaluation, hyperandrogenism markers, and pelvic ultrasound OCR.
                </p>
              </div>

              {/* Right Branch: Men's Health → Male Hypogonadism */}
              <div className="p-6 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-left space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2.5 text-[#38BDF8]">
                  <Activity className="w-5 h-5" />
                  <span className="text-xs font-mono uppercase font-bold tracking-wider">
                    Pathway B
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white font-display">Men's Health</h4>
                <div className="inline-block px-3 py-1 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-xs font-bold text-white">
                  Male Hypogonadism & Testosterone Signaling
                </div>
                <p className="text-xs text-[#CDBDD8] leading-relaxed">
                  Hypothalamic-pituitary-testicular (HPT) axis evaluation, morning testosterone timing, and symptom tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Shared Platform Infrastructure Foundation */}
          <div className="pt-8 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase font-bold text-[#A797BD] tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              <span>Shared Platform Infrastructure (Both Pathways & Baseline)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-left">
              {sharedFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1 hover:border-white/25 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-[#C084FC]">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold text-white font-display">{feat.title}</span>
                    </div>
                    <p className="text-[11px] text-[#A797BD] leading-tight font-sans">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
