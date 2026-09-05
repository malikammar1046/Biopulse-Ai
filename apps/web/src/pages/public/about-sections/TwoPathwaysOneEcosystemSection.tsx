import React from 'react';
import { Heart, Activity, UserCheck, GitBranch, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const TwoPathwaysOneEcosystemSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Radial Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Dual-Pathway Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Two specialized health pathways.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              One unified platform.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            VITASense is not a single-disease tracker. It is an intelligent reproductive-health screening ecosystem that adapts to the health pathway being explored while sharing a single ethical, explainable foundation.
          </p>
        </div>

        {/* 3 Pathway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Card 1: Women's Health (PCOS) */}
          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between hover:border-[#FB7185]/40 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FB7185]/20 text-[#FB7185] flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#FDA4AF] tracking-wider block">
                  Women's Health
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  PCOS Screening Pathway
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed">
                Evaluates menstrual regularity, androgenic symptoms (adult acne, hirsutism score), metabolic parameters, and structured pelvic report text to identify patterns associated with Polycystic Ovary Syndrome.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-[#FDA4AF] font-mono">
              Cycle Intervals • LH/FSH • Androgen Score
            </div>
          </div>

          {/* Card 2: Men's Health (Male Hypogonadism) */}
          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between hover:border-[#60A5FA]/40 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#60A5FA] tracking-wider block">
                  Men's Health
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  Male Hypogonadism Pathway
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed">
                Evaluates morning serum testosterone rhythms, pituitary gonadotropins (LH/FSH), vitality scores, libido patterns, and sleep fragmentation to observe signs of low testosterone and endocrine disruption.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-[#60A5FA] font-mono">
              Morning Testosterone • LH/FSH • Vitality Score
            </div>
          </div>

          {/* Card 3: General / Baseline Users */}
          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between hover:border-[#34D399]/40 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#047857]/20 text-[#34D399] flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#34D399] tracking-wider block">
                  General Users
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  Baseline & Monitoring Journey
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed">
                For individuals who do not currently suspect a disease but want to establish a reproductive health baseline, organize health records, track lifestyle metrics, and observe changes over time.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-[#34D399] font-mono">
              Baseline Intake • Annual Labs • Habit Logs
            </div>
          </div>
        </div>

        {/* Shared Foundation Note */}
        <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-[#B4A6C7]">
          <ShieldCheck className="w-5 h-5 text-[#FDA4AF] shrink-0" />
          <p className="leading-relaxed">
            <strong>Shared Platform Core:</strong> All pathways operate on the same 4-Tier information model, OCR report verification, explainable AI, and privacy safeguards. VITASense never diagnoses or prescribes treatment; it structures your information for collaborative clinical discussions.
          </p>
        </div>
      </Container>
    </section>
  );
};
