import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  BrainCircuit,
  Compass,
  User,
  FlaskConical,
  FileText,
  BarChart3,
  Leaf,
  Star,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { ROUTES } from '../../../constants/routes';

export const FeaturesSection: React.FC = () => {
  return (
    <section
      id="features-section"
      className="relative py-20 sm:py-28 bg-[#FAFCFF] text-[#162A45] border-t border-slate-200/70 overflow-hidden select-none"
      aria-labelledby="features-title"
    >
      {/* ── Soft Ambient Glows ── */}
      <div
        className="absolute top-1/3 right-1/4 w-[480px] h-[480px] rounded-full pointer-events-none -z-0 opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(207, 250, 254, 0.7) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-1/4 w-[450px] h-[450px] rounded-full pointer-events-none -z-0 opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(254, 205, 211, 0.6) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <Container size="xl" className="relative z-10">
        {/* ── Header ── */}
        <div className="max-w-3xl mx-auto text-center space-y-3.5 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-xs font-semibold text-[#00838F] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00838F]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em]">
              Core Differentiators
            </span>
          </div>

          <h2
            id="features-title"
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold font-display tracking-tight leading-[1.15]"
          >
            <span className="text-[#0F254B]">Engineered for</span>{' '}
            <span className="text-[#00838F]">Clinical Transparency</span>
          </h2>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-sans">
            Non-diagnostic decision support designed around clarity, attribution, and practical next steps.
          </p>
        </div>

        {/* ── 3 Differentiator Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 sm:gap-8 items-stretch max-w-6xl mx-auto">
          {/* ══════════════════════════════════════════════
              CARD 1: PROGRESSIVE SCREENING
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-[30px] bg-gradient-to-br from-[#FFF0F5]/80 via-white to-[#FFF5F8] border border-pink-100 p-6 sm:p-7 shadow-[0_10px_30px_rgba(244,114,182,0.08)] flex flex-col justify-between space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Left Content */}
              <div className="sm:col-span-7 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shadow-2xs">
                  <Layers className="w-4 h-4" />
                </div>

                <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F254B] leading-snug">
                  Progressive Screening
                </h3>

                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                  Start simple and add health information when needed. Our tiered approach keeps it accessible, affordable, and scalable.
                </p>
              </div>

              {/* Right Illustration: Tiered Timeline */}
              <div className="sm:col-span-5 relative flex items-center justify-center min-h-[180px] pl-4 sm:pl-2">
                <div className="relative space-y-2.5 w-full">
                  {/* Vertical dashed connecting line */}
                  <div className="absolute left-[7px] top-3 bottom-3 w-0.5 border-l-2 border-dashed border-slate-300" />

                  {/* Tier 1 */}
                  <div className="relative flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#E11D48] ring-4 ring-rose-100 shrink-0 z-10" />
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-pink-100 shadow-xs flex-1">
                      <div className="w-5 h-5 rounded-lg bg-pink-50 text-[#E11D48] flex items-center justify-center shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <div className="text-left leading-tight">
                        <div className="text-[10px] font-bold text-slate-800">Tier 1</div>
                        <div className="text-[8px] font-medium text-slate-500">Basic Information</div>
                      </div>
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="relative flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#0284C7] ring-4 ring-sky-100 shrink-0 z-10" />
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-sky-100 shadow-xs flex-1">
                      <div className="w-5 h-5 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
                        <FlaskConical className="w-3 h-3" />
                      </div>
                      <div className="text-left leading-tight">
                        <div className="text-[10px] font-bold text-slate-800">Tier 2</div>
                        <div className="text-[8px] font-medium text-slate-500">Clinical &amp; Lab Values</div>
                      </div>
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="relative flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#059669] ring-4 ring-emerald-100 shrink-0 z-10" />
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-emerald-100 shadow-xs flex-1">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                        <FileText className="w-3 h-3" />
                      </div>
                      <div className="text-left leading-tight">
                        <div className="text-[10px] font-bold text-slate-800">Tier 3</div>
                        <div className="text-[8px] font-medium text-slate-500">Personalized Guidance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-pink-100/70">
              <Link
                to={ROUTES.HOW_IT_WORKS}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E11D48] hover:text-[#BE123C] group"
              >
                <span>Learn how it works</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              CARD 2: EXPLAINABLE AI
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-[30px] bg-gradient-to-br from-[#F0F9FF]/80 via-white to-[#F0FAFA] border border-sky-100 p-6 sm:p-7 shadow-[0_10px_30px_rgba(56,189,248,0.08)] flex flex-col justify-between space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Left Content */}
              <div className="sm:col-span-7 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shadow-2xs">
                  <BrainCircuit className="w-4 h-4" />
                </div>

                <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F254B] leading-snug">
                  Explainable AI
                </h3>

                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                  See the key factors that influenced your screening result. We use trusted machine learning with clear, human-readable insights.
                </p>
              </div>

              {/* Right Illustration: Top Contributing Factors */}
              <div className="sm:col-span-5 relative flex items-center justify-center min-h-[180px]">
                <div className="w-full bg-white rounded-2xl p-3 shadow-md shadow-sky-900/10 border border-sky-100 space-y-2">
                  <div className="text-[10px] font-bold text-slate-800">
                    Top Contributing Factors
                  </div>

                  {/* Factor 1: Hormonal Imbalance (32%) */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-medium text-slate-700">
                      <span>Hormonal Imbalance</span>
                      <span className="font-bold">32%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-[#0284C7] rounded-full" style={{ width: '32%' }} />
                    </div>
                  </div>

                  {/* Factor 2: BMI (24%) */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-medium text-slate-700">
                      <span>BMI</span>
                      <span className="font-bold">24%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-[#0284C7] rounded-full" style={{ width: '24%' }} />
                    </div>
                  </div>

                  {/* Factor 3: Cycle Irregularity (18%) */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-medium text-slate-700">
                      <span>Cycle Irregularity</span>
                      <span className="font-bold">18%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-[#0284C7] rounded-full" style={{ width: '18%' }} />
                    </div>
                  </div>

                  {/* Factor 4: Lifestyle Factors (12%) */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-medium text-slate-700">
                      <span>Lifestyle Factors</span>
                      <span className="font-bold">12%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-[#0284C7] rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>

                  {/* Bottom Note */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[8px] text-slate-500 leading-tight">
                    <Info className="w-3 h-3 text-[#0284C7] shrink-0" />
                    <span>These insights help you understand, not diagnose.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-sky-100/70">
              <Link
                to={ROUTES.FEATURES}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] group"
              >
                <span>See an example</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              CARD 3: PERSONALIZED GUIDANCE
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="rounded-[30px] bg-gradient-to-br from-[#F0FDF4]/80 via-white to-[#F0FDF9] border border-emerald-100 p-6 sm:p-7 shadow-[0_10px_30px_rgba(16,185,129,0.08)] flex flex-col justify-between space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Left Content */}
              <div className="sm:col-span-7 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#059669] flex items-center justify-center shadow-2xs">
                  <Compass className="w-4 h-4" />
                </div>

                <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F254B] leading-snug">
                  Personalized Guidance
                </h3>

                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                  Receive pathway-specific and locally relevant next steps, from lifestyle recommendations to testing suggestions.
                </p>
              </div>

              {/* Right Illustration: Winding Path with Milestones */}
              <div className="sm:col-span-5 relative flex items-center justify-center min-h-[180px]">
                {/* Winding Path SVG Backdrop */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                  viewBox="0 0 150 180"
                  fill="none"
                >
                  <path
                    d="M 115 20 C 60 40, 140 80, 80 110 C 30 135, 120 150, 105 170"
                    stroke="url(#guidance-path-gradient)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="guidance-path-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A7F3D0" />
                      <stop offset="50%" stopColor="#5EEAD4" />
                      <stop offset="100%" stopColor="#2DD4BF" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Milestones Stack */}
                <div className="relative z-10 space-y-2 w-full flex flex-col items-center">
                  {/* Milestone 1: Your Results */}
                  <div className="self-end mr-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-[9px] font-bold text-slate-700">
                    <BarChart3 className="w-3 h-3 text-[#0284C7]" />
                    <span>Your Results</span>
                  </div>

                  {/* Milestone 2: Recommended Tests */}
                  <div className="self-end mr-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-[9px] font-bold text-slate-700">
                    <FlaskConical className="w-3 h-3 text-teal-600" />
                    <span>Recommended Tests</span>
                  </div>

                  {/* Milestone 3: Lifestyle Guidance */}
                  <div className="self-start ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-[9px] font-bold text-slate-700">
                    <Leaf className="w-3 h-3 text-emerald-600" />
                    <span>Lifestyle Guidance</span>
                  </div>

                  {/* Milestone 4: A Healthier You */}
                  <div className="self-end mr-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008CA5] shadow-md shadow-cyan-900/20 text-[10px] font-extrabold text-white">
                    <Star className="w-3 h-3 fill-white" />
                    <span>A Healthier You</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-100/70">
              <Link
                to={ROUTES.FEATURES}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] hover:text-[#047857] group"
              >
                <span>Explore guidance</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ── Center Primary Action Button ── */}
        <div className="text-center pt-12 sm:pt-14">
          <Link to={ROUTES.FEATURES}>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white text-sm sm:text-base bg-[#008CA5] hover:bg-[#007A90] shadow-md shadow-cyan-900/20 transition-all cursor-pointer"
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* ── Bottom Micro Tagline (Left) & Cursive Note (Right) ── */}
        <div className="mt-8 pt-4 flex items-center justify-between relative">
          <div className="hidden lg:block text-[10px] xl:text-[11px] font-mono font-bold tracking-[0.22em] text-slate-400 uppercase select-none">
            SCIENCE &nbsp;+&nbsp; CLARITY &nbsp;+&nbsp; BETTER TOMORROWS
          </div>

          <div className="hidden lg:block absolute bottom-0 right-2 xl:right-4 select-none pointer-events-none rotate-[-6deg]">
            <span
              className="text-2xl xl:text-3xl font-bold text-[#00A8B5] block leading-tight text-right drop-shadow-xs"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Insights Today.
              <br />
              A Healthier Tomorrow.
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection;
