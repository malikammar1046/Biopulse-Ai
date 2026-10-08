import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf,
  ArrowRight,
  ShieldCheck,
  FileText,
  Users,
  Calendar,
  Heart,
  BarChart3,
} from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';

export const FinalCTASection: React.FC = () => {
  const { t } = useTranslation('public');
  return (
    <section className="py-16 sm:py-24 bg-[#FAFCFF] text-[#162A45] overflow-hidden border-t border-slate-200/70 select-none">
      {/* ── Soft Ambient Backing Glows ── */}
      <div
        className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none -z-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(207, 250, 254, 0.8) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none -z-0 opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(254, 205, 211, 0.7) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <Container size="xl" className="relative z-10">
        <div className="rounded-[36px] sm:rounded-[44px] bg-gradient-to-br from-white via-white to-[#F6FBFE] border border-slate-200/80 shadow-[0_20px_60px_rgba(2,132,199,0.07)] relative overflow-hidden">
          {/* ── Soft Flowing Bottom-Right Cyan Wave ── */}
          <svg
            className="absolute bottom-0 right-0 w-full lg:w-[68%] h-28 sm:h-36 pointer-events-none -z-0 opacity-80"
            viewBox="0 0 800 150"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 110 C 220 50, 420 140, 620 80 C 710 50, 760 70, 800 60 L 800 150 L 0 150 Z"
              fill="url(#bottom-cyan-wave-gradient)"
            />
            <defs>
              <linearGradient id="bottom-cyan-wave-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E0F7FA" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#E0F7FA" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>

          {/* ── Botanical Leaf Silhouette Accent in Center Background ── */}
          <div className="hidden lg:block absolute top-1/3 left-[42%] w-48 h-48 pointer-events-none opacity-40 -z-0">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-cyan-200">
              <path
                d="M100 180 C 80 120, 60 70, 110 30 C 130 70, 120 130, 100 180 Z"
                fill="#CFFAFE"
                fillOpacity="0.6"
              />
              <path
                d="M100 180 C 130 140, 160 100, 150 60 C 130 80, 115 130, 100 180 Z"
                fill="#E0F2FE"
                fillOpacity="0.6"
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center relative z-10">
            {/* ══════════════════════════════════════════════
                LEFT CONTENT COLUMN
               ══════════════════════════════════════════════ */}
            <div className="lg:col-span-7 p-7 sm:p-10 lg:p-14 space-y-7 text-left">
              {/* Top Eyebrow Pill: Begin Your Journey */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-xs font-semibold text-[#00838F] shadow-2xs">
                <Leaf className="w-3.5 h-3.5 text-[#00838F]" />
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.05em]">
                  Begin Your Journey
                </span>
              </div>

              {/* Main Headline */}
              <h2 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold font-display tracking-tight text-[#0F254B] leading-[1.08]">
                Start With{' '}
                <span className="text-[#008CA5] block sm:inline">
                  What You Know.
                </span>
              </h2>

              {/* Subheadline */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-sans max-w-lg">
                {t('finalCta.subtitle')}
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link to={ROUTES.REGISTER}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm sm:text-base bg-[#008CA5] hover:bg-[#007A90] shadow-md shadow-cyan-900/15 transition-all cursor-pointer"
                  >
                    <span>Start Your Screening</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <Link to={ROUTES.ABOUT}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-[#008CA5] hover:text-[#007A90] bg-white hover:bg-cyan-50/40 border-[1.5px] border-[#008CA5] transition-all cursor-pointer shadow-xs text-sm sm:text-base"
                  >
                    <span>Learn More About BioPulse AI</span>
                  </button>
                </Link>
              </div>

              {/* Micro-Trust Strip: Private & Secure | Non-Diagnostic | Built for Pakistan */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100">
                {/* Item 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                      Private &amp; Secure
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
                      Your data stays yours
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                      Non-Diagnostic
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
                      Insights, not diagnoses
                    </div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0 shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                      Built for Pakistan
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
                      Locally relevant care
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Tagline: Small steps today • A healthier tomorrow */}
              <div className="pt-2 flex items-center gap-3 text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.22em] text-slate-400 uppercase">
                <div className="w-6 h-0.5 bg-slate-300" aria-hidden="true" />
                <span>SMALL STEPS TODAY &bull; A HEALTHIER TOMORROW</span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════
                RIGHT VISUAL COLUMN: MODEL IN HALO, FLOATING CARD,
                AND CURSIVE SCRIPT ACCENTS
               ══════════════════════════════════════════════ */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] p-6 lg:p-8">
              {/* Top-Right Cursive Handwriting: Your Health / Your Tomorrow ♡ */}
              <div className="absolute top-4 sm:top-6 right-4 sm:right-8 rotate-[-6deg] select-none z-20 pointer-events-none text-left">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#008CA5] leading-tight block"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Your Health
                  <br />
                  Your Tomorrow
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 sm:w-6 sm:h-6 inline-block text-[#008CA5] ml-2 -mt-1 -rotate-6"
                    aria-hidden="true"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </span>
                {/* Curved underline */}
                <svg
                  viewBox="0 0 160 20"
                  fill="none"
                  className="w-32 sm:w-40 h-3 text-[#008CA5] mt-0.5"
                  aria-hidden="true"
                >
                  <path d="M5 12 Q 80 2, 155 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Model Portrait with Halo Portal */}
              <div className="relative w-64 sm:w-72 lg:w-80 aspect-square rounded-full p-2 bg-gradient-to-tr from-[#CFFAFE] via-white to-[#BAE6FD] shadow-xl shadow-cyan-900/10 flex items-center justify-center overflow-hidden z-10">
                <div className="w-full h-full rounded-full overflow-hidden border-[6px] sm:border-[8px] border-white shadow-inner bg-pink-50">
                  <img
                    src="/assets/images/female-pathway.jpg"
                    alt="Start With What You Know - BioPulse AI"
                    className="w-full h-full object-cover object-top scale-110"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Floating Feature Card (Right of Model) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="absolute right-2 sm:right-4 bottom-14 sm:bottom-16 z-20 w-52 sm:w-60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl shadow-cyan-950/10 space-y-3"
              >
                {/* Item 1: Track Your Cycle */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-cyan-50 border border-cyan-200/80 text-[#0891B2] flex items-center justify-center shrink-0 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-slate-800">Track Your Cycle</div>
                    <div className="text-[10px] font-medium text-slate-500">Understand patterns</div>
                  </div>
                </div>

                {/* Item 2: Know Your Symptoms */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-rose-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                    <Heart className="w-3.5 h-3.5 fill-[#E11D48]/20" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-slate-800">Know Your Symptoms</div>
                    <div className="text-[10px] font-medium text-slate-500">See the bigger picture</div>
                  </div>
                </div>

                {/* Item 3: Get Personalized Insights */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-slate-800">Get Personalized Insights</div>
                    <div className="text-[10px] font-medium text-slate-500">Take informed next steps</div>
                  </div>
                </div>
              </motion.div>

              {/* Bottom-Right Cursive Handwriting & Botanical Sprig */}
              <div className="absolute bottom-2 sm:bottom-3 right-4 sm:right-8 z-20 flex items-center gap-3 select-none pointer-events-none rotate-[-6deg]">
                <div className="text-right">
                  <span
                    className="text-xl sm:text-2xl font-bold text-[#008CA5] leading-tight block"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    Science
                    <br />
                    for Brighter Days
                  </span>
                  {/* Small underline */}
                  <svg
                    viewBox="0 0 130 16"
                    fill="none"
                    className="w-24 sm:w-28 h-2 text-[#008CA5] ml-auto"
                    aria-hidden="true"
                  >
                    <path d="M5 10 Q 65 2, 125 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Cyan Foliage Sprig */}
                <svg
                  viewBox="0 0 60 100"
                  fill="none"
                  className="w-8 sm:w-10 h-auto text-cyan-300/80 -mt-2"
                  aria-hidden="true"
                >
                  <path d="M30 100 C 30 70, 40 30, 55 5" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M30 80 C 15 70, 10 50, 15 35 C 28 45, 30 65, 30 80 Z" fill="#BAE6FD" fillOpacity="0.8" />
                  <path d="M35 55 C 50 45, 60 30, 55 15 C 42 25, 38 40, 35 55 Z" fill="#7DD3FC" fillOpacity="0.7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FinalCTASection;
