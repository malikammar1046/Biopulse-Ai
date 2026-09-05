import React from 'react';
import { ShieldCheck, Heart, Activity, Info } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const MLAssessmentSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <Badge variant="primary" showDot size="md">
            Phase 02 — Pathway-Specific Screening Intelligence
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Initial Screening Adapted to Your Pathway
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            VITASense does not force one generic screening template onto every user. The evaluated models adapt to the unique biological and clinical markers of your selected health pathway.
          </p>
        </div>

        {/* Dual Pathway Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Pathway 1: Women's Health (PCOS) */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-lg space-y-5 text-left flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-3">
                <div className="flex items-center gap-2 text-[#E87084]">
                  <Heart className="w-5 h-5 fill-current" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Women's Health</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#FFF0F2] text-[#E87084] font-bold">
                  Rotterdam Aligned
                </span>
              </div>

              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                PCOS Screening Pathway
              </h3>

              <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
                Evaluates multi-marker endocrine and physiological features under recognized consensus guidelines:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1C1326] font-sans">
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Menstrual cycle intervals & flow</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Acne & unwanted hair patterns</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Hair thinning & androgen scores</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• BMI & metabolic indicators</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• LH-to-FSH biomarker ratios</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Structured ultrasound text fields</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFF0F2] border border-[#FDA4AF]/40 flex items-start gap-2.5 text-[11px] text-[#584B68]">
              <Info className="w-4 h-4 text-[#E87084] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#1C1326]">Ultrasonography Note:</strong> VITASense parses structured text report findings (such as antral follicle count); it does not interpret raw ultrasound medical images.
              </span>
            </div>
          </div>

          {/* Pathway 2: Men's Health (Male Hypogonadism) */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-lg space-y-5 text-left flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-3">
                <div className="flex items-center gap-2 text-[#0284C7]">
                  <Activity className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Men's Health</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] font-bold">
                  Endocrine Society Aligned
                </span>
              </div>

              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Male Hypogonadism Pathway
              </h3>

              <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
                Evaluates signs of low testosterone and brain-pituitary-testicular signaling disruptions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1C1326] font-sans">
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Fatigue & physical energy levels</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Reduced spontaneous libido</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Morning & sexual erection quality</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Changes in muscle strength & hair</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• Total & Free Testosterone levels</div>
                <div className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]">• LH, FSH, SHBG & Prolactin panels</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#38BDF8]/40 flex items-start gap-2.5 text-[11px] text-[#584B68]">
              <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#1C1326]">Morning Timing Sensitivity:</strong> Testosterone naturally follows a diurnal rhythm. VITASense specifically tracks whether testing was performed in the morning (7:00 AM – 10:00 AM).
              </span>
            </div>
          </div>
        </div>

        {/* Safety & Non-Diagnostic Statement */}
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-white border border-[#E7DFEF] flex items-center justify-center gap-3 text-xs text-[#584B68] shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#047857] shrink-0" />
          <span>
            <strong className="text-[#1C1326]">Screening, Not Diagnosis:</strong> VITASense assesses multivariate patterns to help you prepare for discussions with a healthcare professional.
          </span>
        </div>
      </Container>
    </section>
  );
};
