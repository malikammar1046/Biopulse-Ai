import React from 'react';
import { RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const ReassessmentSection: React.FC = () => {
  const tiers = [
    {
      stage: 'Initial Intake',
      tier: 'Tier 1 Information',
      desc: 'Symptoms, history, and biometric observations establish your first baseline screening assessment.',
      badge: 'T1 Baseline',
      color: 'bg-white/10 border-white/15 text-white',
    },
    {
      stage: 'Routine Labs Added',
      tier: 'Tier 2 Integration',
      desc: 'Verified fasting glucose, HbA1c, or lipid markers update the metabolic context.',
      badge: '+ T2 Metabolic',
      color: 'bg-[#6E2D8B]/50 border-[#8E3EAF]/40 text-[#EDE4F7]',
    },
    {
      stage: 'Targeted Hormones',
      tier: 'Tier 3 Hormone Profile',
      desc: 'Verified endocrine assays (e.g. morning testosterone or LH/FSH) trigger a calibrated reassessment.',
      badge: '+ T3 Endocrine',
      color: 'bg-[#8E3EAF] border-[#A21CAF] text-white',
    },
    {
      stage: 'Clinical Summary',
      tier: 'Tier 4 Structured Clinical',
      desc: 'Verified radiologist or clinical report entries synthesize into a consolidated physician discussion brief.',
      badge: '+ T4 Clinical',
      color: 'bg-[#047857] border-[#10B981] text-white',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#180A25] via-[#241038] to-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Phase 08 — Dynamic Reassessment Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            As new information arrives,{' '}
            <span className="bg-gradient-to-r from-[#FDA4AF] via-[#FB7185] to-[#C084FC] bg-clip-text text-transparent">
              your assessment updates.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            Traditional health apps force you to restart from scratch. BIOPulse AI is built around continuous Bayesian-inspired reassessment: as you verify new laboratory panels, the screening context updates dynamically while preserving your historical record.
          </p>
        </div>

        {/* Dynamic Integration Pipeline Flow */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 ${t.color}`}
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/20 inline-block">
                  {t.badge}
                </span>
                <h4 className="text-base font-bold font-display">{t.stage}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{t.desc}</p>
              </div>

              {idx < tiers.length - 1 && (
                <div className="hidden md:flex items-center justify-end text-[#FDA4AF]">
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reassessment Safeguard Callout */}
        <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs text-[#B4A6C7]">
          <ShieldAlert className="w-5 h-5 text-[#FDA4AF] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Clinical Humility Notice:</strong> Progressive reassessment refines algorithmic pattern sensitivity with each added data tier. However, higher tiers do not guarantee definitive clinical correctness, nor do they replace in-person examination by a licensed medical doctor.
          </p>
        </div>
      </Container>
    </section>
  );
};
