import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  BarChart3,
  Leaf,
  Check,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { ROUTES } from '../../../constants/routes';

export const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation('public');
  return (
    <section className="relative py-20 sm:py-28 bg-[#FAFCFF] text-[#162A45] border-t border-slate-200/70 overflow-hidden select-none">
      {/* ── Soft Ambient Glows ── */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none -z-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(207, 250, 254, 0.7) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full pointer-events-none -z-0 opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(254, 205, 211, 0.6) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <Container size="xl" className="relative z-10">
        {/* ── Header ── */}
        <div className="max-w-3xl mx-auto text-center space-y-3.5 mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-xs font-semibold text-[#00838F] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#00838F]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em]">
              {t('howItWorks.eyebrow')}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold font-display tracking-tight leading-[1.15]">
            <span className="text-[#0F254B]">From Answers to a</span>{' '}
            <span className="text-[#00838F]">Healthier You</span>
          </h2>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-sans">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* ── 3 Cards with Continuous Connecting Wave ── */}
        <div className="relative max-w-6xl mx-auto">
          {/* Continuous Connecting Wave Line Across Cards (Desktop) */}
          <svg
            className="hidden lg:block absolute -top-4 left-8 right-8 w-[calc(100%-4rem)] h-12 pointer-events-none z-20"
            viewBox="0 0 1000 60"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 50,30 C 200,5 350,55 500,30 C 650,5 800,55 950,30"
              stroke="url(#how-it-works-wave-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="how-it-works-wave-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F472B6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#0891B2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 sm:gap-8 items-stretch">
            {/* ══════════════════════════════════════════════
                CARD 1: SHARE YOUR HEALTH INFORMATION
               ══════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="relative pt-4 flex"
            >
              {/* Top Step Number Badge 01 */}
              <div className="absolute top-0 left-6 z-30 w-8 h-8 rounded-full bg-[#E11D48] text-white font-mono font-bold text-xs flex items-center justify-center shadow-md shadow-pink-600/30">
                01
              </div>

              <div className="w-full rounded-[30px] bg-gradient-to-br from-[#FFF0F5]/80 via-white to-[#FFF5F8] border border-pink-100 p-6 sm:p-7 shadow-[0_10px_30px_rgba(244,114,182,0.08)] flex flex-col justify-between space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left Text */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F254B] leading-snug">
                      {t('howItWorks.step1Title')}
                    </h3>

                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                      Start with a few simple questions about your symptoms, lifestyle and health history.
                    </p>
                  </div>

                  {/* Right Illustration: Stylized Clipboard */}
                  <div className="sm:col-span-5 relative flex items-center justify-center min-h-[170px]">
                    {/* Pink Leaf Backdrop */}
                    <div className="absolute -right-2 top-2 w-16 h-24 opacity-60 pointer-events-none">
                      <svg viewBox="0 0 100 150" fill="none" className="w-full h-full text-pink-300">
                        <path d="M50 150 C 30 100, 20 50, 80 10 C 60 40, 70 80, 50 150 Z" fill="#FBCFE8" />
                        <path d="M50 150 C 80 120, 90 70, 70 40" stroke="#F472B6" strokeWidth="2" />
                      </svg>
                    </div>

                    {/* Clipboard Card */}
                    <div className="relative z-10 w-32 bg-white rounded-2xl p-3 shadow-md shadow-pink-900/10 border border-pink-100 space-y-2">
                      {/* Top Clip Heart */}
                      <div className="flex justify-center -mt-5">
                        <div className="w-9 h-6 bg-slate-100 border border-slate-200 rounded-t-lg flex items-center justify-center shadow-2xs">
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-50 border border-pink-200 flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 fill-[#E11D48] text-[#E11D48]" />
                          </div>
                        </div>
                      </div>

                      {/* 3 Checked Items */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <div className="h-2 w-14 bg-slate-200 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <div className="h-2 w-18 bg-slate-200 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <div className="h-2 w-12 bg-slate-200 rounded-full" />
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
                    <span>Your story matters</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* ══════════════════════════════════════════════
                CARD 2: UNDERSTAND YOUR SCREENING RESULT
               ══════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="relative pt-4 flex"
            >
              {/* Top Step Number Badge 02 */}
              <div className="absolute top-0 left-6 z-30 w-8 h-8 rounded-full bg-[#0284C7] text-white font-mono font-bold text-xs flex items-center justify-center shadow-md shadow-sky-600/30">
                02
              </div>

              <div className="w-full rounded-[30px] bg-gradient-to-br from-[#F0F9FF]/80 via-white to-[#F0FAFA] border border-sky-100 p-6 sm:p-7 shadow-[0_10px_30px_rgba(56,189,248,0.08)] flex flex-col justify-between space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left Text */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shadow-2xs">
                      <BarChart3 className="w-4 h-4" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F254B] leading-snug">
                      Understand Your Screening Result
                    </h3>

                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                      Get a clear, easy-to-understand risk assessment with key factors that influence your result.
                    </p>
                  </div>

                  {/* Right Illustration: Assessment Gauge Card */}
                  <div className="sm:col-span-5 relative flex items-center justify-center min-h-[170px]">
                    {/* Cyan Backdrop Circle */}
                    <div className="absolute w-28 h-28 rounded-full bg-cyan-100/70 -top-1 -right-1 blur-xs" />

                    {/* Assessment Card */}
                    <div className="relative z-10 w-32 bg-white rounded-2xl p-3 shadow-md shadow-cyan-900/10 border border-cyan-100 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-800 text-center">
                        Your Risk Assessment
                      </div>

                      {/* Semi-circular Radial Meter */}
                      <div className="relative flex flex-col items-center justify-center py-0.5">
                        <svg className="w-18 h-10" viewBox="0 0 100 55">
                          <path
                            d="M10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10 50 A 40 40 0 0 1 45 12"
                            fill="none"
                            stroke="#0284C7"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="text-center -mt-4">
                          <span className="text-xs font-extrabold text-slate-900 block leading-tight">28%</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Lower Risk</span>
                        </div>
                      </div>

                      {/* Key Contributing Factors */}
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="text-[8px] font-bold text-slate-600">Key Contributing Factors</div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                          <div className="h-1.5 w-12 bg-slate-200 rounded-full" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <div className="h-1.5 w-16 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-sky-100/70">
                  <Link
                    to={ROUTES.HOW_IT_WORKS}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] group"
                  >
                    <span>See how it works</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* ══════════════════════════════════════════════
                CARD 3: KNOW YOUR NEXT STEP
               ══════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="relative pt-4 flex"
            >
              {/* Top Step Number Badge 03 */}
              <div className="absolute top-0 left-6 z-30 w-8 h-8 rounded-full bg-[#059669] text-white font-mono font-bold text-xs flex items-center justify-center shadow-md shadow-emerald-600/30">
                03
              </div>

              <div className="w-full rounded-[30px] bg-gradient-to-br from-[#F0FDF4]/80 via-white to-[#F0FDF9] border border-emerald-100 p-6 sm:p-7 shadow-[0_10px_30px_rgba(16,185,129,0.08)] flex flex-col justify-between space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left Text */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#059669] flex items-center justify-center shadow-2xs">
                      <Leaf className="w-4 h-4" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F254B] leading-snug">
                      Know Your Next Step
                    </h3>

                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                      Receive personalized guidance, recommended tests (if needed) and practical next steps.
                    </p>
                  </div>

                  {/* Right Illustration: Directional Signpost */}
                  <div className="sm:col-span-5 relative flex items-center justify-center min-h-[170px]">
                    {/* Green Foliage Backdrop */}
                    <div className="absolute -left-1 bottom-1 w-16 h-24 opacity-60 pointer-events-none">
                      <svg viewBox="0 0 100 150" fill="none" className="w-full h-full text-emerald-400">
                        <path d="M50 150 C 30 100, 10 70, 40 30 C 50 60, 40 100, 50 150 Z" fill="#A7F3D0" />
                        <path d="M50 150 C 70 110, 80 80, 60 50" stroke="#059669" strokeWidth="2" />
                      </svg>
                    </div>

                    {/* Signpost Elements */}
                    <div className="relative z-10 flex flex-col items-center py-2">
                      {/* Vertical Post Pole */}
                      <div className="absolute top-0 bottom-0 w-2.5 bg-slate-700 rounded-full shadow-xs" />

                      {/* Direction 1: Insights */}
                      <div className="relative z-10 mb-2 mr-4 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-[10px] font-bold text-slate-700 tracking-tight">
                        Insights
                      </div>

                      {/* Direction 2: Guidance */}
                      <div className="relative z-10 mb-2 ml-4 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-[10px] font-bold text-slate-700 tracking-tight">
                        Guidance
                      </div>

                      {/* Direction 3: A Healthier You */}
                      <div className="relative z-10 px-3.5 py-1.5 rounded-full bg-[#008CA5] shadow-md shadow-cyan-900/20 text-[10px] font-extrabold text-white tracking-tight">
                        A Healthier You
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-100/70">
                  <Link
                    to={ROUTES.HOW_IT_WORKS}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] hover:text-[#047857] group"
                  >
                    <span>Take charge of your health</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Center Primary Action Button ── */}
        <div className="text-center pt-12 sm:pt-14">
          <Link to={ROUTES.HOW_IT_WORKS}>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white text-sm sm:text-base bg-[#008CA5] hover:bg-[#007A90] shadow-md shadow-cyan-900/20 transition-all cursor-pointer"
            >
              <span>See the Full Process</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* ── Bottom Micro Tagline (Left) & Cursive Note (Right) ── */}
        <div className="mt-8 pt-4 flex items-center justify-between relative">
          <div className="hidden lg:block text-[10px] xl:text-[11px] font-mono font-bold tracking-[0.22em] text-slate-400 uppercase select-none">
            SCIENCE &nbsp;+&nbsp; INSIGHTS &nbsp;+&nbsp; A HEALTHIER YOU
          </div>

          <div className="hidden lg:block absolute bottom-0 right-2 xl:right-4 select-none pointer-events-none rotate-[-6deg]">
            <span
              className="text-2xl xl:text-3xl font-bold text-[#00A8B5] block leading-tight text-right drop-shadow-xs"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Small Steps
              <br />
              Brighter Tomorrows
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HowItWorksSection;
