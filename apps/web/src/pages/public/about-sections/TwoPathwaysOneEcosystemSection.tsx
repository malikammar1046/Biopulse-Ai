import React from 'react';
import { Heart, Activity, GitBranch, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const TwoPathwaysOneEcosystemSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#FAFCFF] text-[#162A45] overflow-hidden border-t border-slate-200/80">
      {/* Radial Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-100/30 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2]">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Dedicated Pathways</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            Two Specialized Health Pathways.{' '}
            <span className="text-[#0891B2]">
              One Unified System.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            BioPulse AI is built around targeted reproductive-endocrine clinical depth. Rather than generic wellness surveys, we provide two specialized, explainable pathways.
          </p>
        </div>

        {/* 2 Dedicated Pathway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Card 1: Women's Health (PCOS) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-pink-200/80 shadow-md space-y-5 flex flex-col justify-between hover:shadow-xl transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#E11D48] tracking-wider block">
                  Female Pathway
                </span>
                <h3 className="text-2xl font-bold font-display text-[#162A45]">
                  PCOS Screening Pathway
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Evaluates menstrual regularity, hyperandrogenic symptoms (facial acne, hirsutism score), insulin and metabolic parameters, and pelvic ultrasound imaging (PCOM) to identify polycystic ovary patterns.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-[#E11D48] font-mono">
              Cycle Regularity • LH/FSH • Androgen Markers • Ultrasound PCOM
            </div>
          </div>

          {/* Card 2: Men's Health (Male Hypogonadism) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-sky-200/80 shadow-md space-y-5 flex flex-col justify-between hover:shadow-xl transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#0284C7] tracking-wider block">
                  Male Pathway
                </span>
                <h3 className="text-2xl font-bold font-display text-[#162A45]">
                  Male Hypogonadism Pathway
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Evaluates morning serum total testosterone draw timing (8 AM – 10 AM), pituitary gonadotropins (LH/FSH), validated ADAM vitality scores, and circadian sleep patterns for signs of endocrine disruption.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-[#0284C7] font-mono">
              Morning Testosterone • ADAM Score • Pituitary LH/FSH • Vitality
            </div>
          </div>
        </div>

        {/* Shared Foundation Note */}
        <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="leading-relaxed">
            <strong>Shared Platform Core:</strong> Both pathways utilize OCR report extraction, explainable AI factor attribution, cost-aware prioritization, and localized Pakistani nutrition. BioPulse AI is non-diagnostic and designed for collaborative physician discussion.
          </p>
        </div>
      </Container>
    </section>
  );
};

export default TwoPathwaysOneEcosystemSection;
