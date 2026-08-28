import { BrainCircuit, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const MLAssessmentSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <Badge variant="primary" showDot size="md">
              Phase 05 — Research ML Assessment
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
              05 — Analyze the pattern
            </h2>

            <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans">
              A defined, research-based machine learning model evaluates your structured biomarker features
              against Rotterdam diagnostic criteria patterns. Rather than giving a black-box diagnosis,
              it generates a nuanced pattern assessment score.
            </p>

            <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] space-y-2">
              <div className="flex items-center gap-2 text-[#6E2D8B] font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Non-Diagnostic Safety Design</span>
              </div>
              <p className="text-xs text-[#584B68] leading-relaxed">
                The algorithm identifies multivariate risk patterns to assist informed clinical discussions,
                never issuing automated prescriptive decisions.
              </p>
            </div>
          </div>

          {/* Right Architecture Pipeline Card */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7DFEF] shadow-xl space-y-5 max-w-md mx-auto">
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-[#1C1326]">Machine Learning Model</h3>
                    <span className="text-[10px] text-[#8D7E9E] font-mono">Ensemble Random Forest & XGBoost</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-[10px] font-bold">
                  Ensemble
                </span>
              </div>

              {/* 4-Stage Flow */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between">
                  <span className="text-[#584B68]">1. Structured Profile Inputs</span>
                  <span className="text-[#047857] font-bold font-sans">✓ Complete</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between">
                  <span className="text-[#584B68]">2. Feature Selection & Normalization</span>
                  <span className="text-[#6E2D8B] font-bold font-sans">18 Features</span>
                </div>
                <div className="p-3 rounded-xl bg-[#EDE4F7] border border-[#D8B4FE]/60 flex items-center justify-between text-[#6E2D8B]">
                  <span className="font-bold">3. Cross-Validated Assessment</span>
                  <span className="font-bold font-sans">Calculated</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between">
                  <span className="text-[#584B68]">4. Assessment Pattern Score</span>
                  <span className="text-[#1C1326] font-bold font-sans">Multivariate Output</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
