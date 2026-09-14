import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Layers,
  Leaf,
} from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';

// Decorative Botanical Leaves SVG (Left / Pink tones)
const PinkBotanicalFoliage: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 320 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M-20 40C30 80 80 120 110 190C130 240 140 310 120 380"
      stroke="#F472B6"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />
    <path
      d="M40 70C65 50 110 65 115 105C90 115 55 100 40 70Z"
      fill="#FBCFE8"
      fillOpacity="0.75"
    />
    <path
      d="M75 125C110 110 150 135 145 175C115 180 85 160 75 125Z"
      fill="#F472B6"
      fillOpacity="0.6"
    />
    <path
      d="M20 140C40 120 85 130 90 165C65 175 35 165 20 140Z"
      fill="#FCE7F3"
      fillOpacity="0.9"
    />
    <path
      d="M100 200C140 190 175 220 170 260C135 265 110 240 100 200Z"
      fill="#FDA4AF"
      fillOpacity="0.65"
    />
    <path
      d="M60 230C90 220 125 245 120 280C95 285 70 265 60 230Z"
      fill="#FBCFE8"
      fillOpacity="0.7"
    />
  </svg>
);

// Decorative Botanical Leaves SVG (Right / Cyan tones)
const BlueBotanicalFoliage: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 320 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M340 40C290 80 240 120 210 190C190 240 180 310 200 380"
      stroke="#38BDF8"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />
    <path
      d="M280 70C255 50 210 65 205 105C230 115 265 100 280 70Z"
      fill="#BAE6FD"
      fillOpacity="0.75"
    />
    <path
      d="M245 125C210 110 170 135 175 175C205 180 235 160 245 125Z"
      fill="#38BDF8"
      fillOpacity="0.6"
    />
    <path
      d="M300 140C280 120 235 130 230 165C255 175 285 165 300 140Z"
      fill="#E0F2FE"
      fillOpacity="0.9"
    />
    <path
      d="M220 200C180 190 145 220 150 260C185 265 210 240 220 200Z"
      fill="#7DD3FC"
      fillOpacity="0.65"
    />
    <path
      d="M260 230C230 220 195 245 200 280C225 285 250 265 260 230Z"
      fill="#BAE6FD"
      fillOpacity="0.7"
    />
  </svg>
);

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] bg-transparent text-[#162A45] pt-24 sm:pt-32 pb-12 sm:pb-16 overflow-hidden flex flex-col justify-between selection:bg-[#0891B2] selection:text-white">
      {/* ── Soft Ambient Glows ── */}
      <div
        className="absolute top-0 left-0 w-[50vw] h-[60vh] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at 15% 15%, rgba(254, 205, 211, 0.4) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-[50vw] h-[60vh] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at 85% 15%, rgba(186, 230, 253, 0.45) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[50vh] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(207, 250, 254, 0.25) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* ── Botanical Leaf Accents ── */}
      <PinkBotanicalFoliage className="hidden md:block absolute top-16 -left-12 w-64 lg:w-80 h-auto pointer-events-none z-0" />
      <BlueBotanicalFoliage className="hidden md:block absolute top-16 -right-12 w-64 lg:w-80 h-auto pointer-events-none z-0" />

      <Container size="xl" className="relative z-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ══════════════════════════════════════════════
              LEFT COLUMN: HEADLINE, HIGHLIGHTS, CTAS
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Top Eyebrow Tag */}
            <p className="text-[11px] sm:text-xs font-extrabold tracking-[0.22em] text-[#0891B2] uppercase select-none">
              SCIENCE TODAY. HEALTHIER TOMORROWS.
            </p>

            {/* Main Display Headline Matching Concept Image */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-extrabold tracking-tight leading-[1.08] font-display">
              <span className="text-[#00838F]">Stronger</span>
              <br />
              <span className="text-[#0F254B]">Hormones</span>
              <br />
              <span className="text-[#00A8B5]">Brighter Lives</span>
            </h1>

            {/* Sub-headline Copy */}
            <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg">
              AI-powered screening and guidance for PCOS (female) and Hypogonadism (male) with personalized insights.
            </p>

            {/* 4 Feature Items with Light-Cyan Circular Badges */}
            <div className="space-y-3 pt-1">
              {/* Feature 1 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#162A45]">
                  Early risk assessment
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#162A45]">
                  Explainable AI results
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#162A45]">
                  Personalized recommendations
                </span>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#162A45]">
                  Progressive &amp; cost-aware screening
                </span>
              </div>
            </div>

            {/* Dual CTA Buttons Matching Concept Image */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link to={ROUTES.REGISTER}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white text-sm sm:text-base bg-[#008CA5] hover:bg-[#007A90] shadow-md shadow-cyan-900/15 transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>

              <a href="#who-is-it-for">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-[#008CA5] hover:text-[#007A90] bg-white hover:bg-sky-50/60 border-[1.5px] border-[#008CA5] transition-all cursor-pointer shadow-xs text-sm sm:text-base"
                >
                  <span>Learn More</span>
                </motion.button>
              </a>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              RIGHT COLUMN: UNIFIED HERO COUPLE PORTRAIT
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative flex items-center justify-center"
          >
            {/* Ambient Backing Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/40 via-white/50 to-sky-200/40 rounded-[40px] blur-2xl -z-10" />

            {/* Dual Visual Container */}
            <div className="relative w-full max-w-[520px] aspect-square rounded-[36px] bg-gradient-to-b from-[#FAFCFF] via-white to-[#F0F9FF] p-3 sm:p-4 border border-cyan-100/80 shadow-2xl shadow-cyan-900/10 flex items-center justify-center overflow-hidden group">
              {/* Subtle Ambient Leaf Vectors Inside Card */}
              <div className="absolute -top-8 -left-8 w-48 h-48 pointer-events-none opacity-80">
                <PinkBotanicalFoliage className="w-full h-full" />
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 pointer-events-none opacity-80">
                <BlueBotanicalFoliage className="w-full h-full" />
              </div>

              {/* Single Unified Couple Portrait */}
              <div className="relative w-full h-full rounded-[28px] overflow-hidden">
                <img
                  src="/assets/images/hero-couple.jpg"
                  alt="Healthier Her & Stronger Him - BioPulse AI"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="eager"
                />

                {/* Cursive Handwriting: Healthier Her (Over female model on left) */}
                <div className="absolute top-[56%] left-3 sm:left-5 -rotate-6 select-none drop-shadow-md">
                  <span
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#D946EF] sm:text-[#BE185D] block leading-tight"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    Healthier
                    <br />
                    Her
                  </span>
                </div>

                {/* Cursive Handwriting: Stronger Him (Over male model on right) */}
                <div className="absolute top-[54%] right-3 sm:right-5 rotate-6 select-none drop-shadow-md text-right">
                  <span
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0284C7] sm:text-[#1D4ED8] block leading-tight"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    Stronger
                    <br />
                    Him
                  </span>
                </div>
              </div>

              {/* Floating Quote Badge (Bottom Right, matching reference screenshot) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute bottom-3 right-3 sm:right-5 z-20 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-cyan-200/80 shadow-lg shadow-cyan-900/10 flex items-center gap-2.5 max-w-[280px]"
              >
                <div className="w-6 h-6 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-[#00838F] flex items-center justify-center shrink-0">
                  <Leaf className="w-3.5 h-3.5 fill-[#22D3EE] text-[#00838F]" />
                </div>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-700 leading-snug">
                  &ldquo;Small steps today, a healthier tomorrow.&rdquo;
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════
            BOTTOM METRICS RIBBON / ATTRIBUTES BAR
            Color matched to image: Soft light-cyan gradient card
            Content preserved: 2 Health Pathways, Explainable AI,
            Cost-Aware, Pakistani Nutrition & guidance
           ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-12 sm:mt-16 w-full p-5 sm:p-6 rounded-[24px] bg-gradient-to-r from-[#E0F7FA]/75 via-[#E6F7F9]/85 to-[#E0F2FE]/75 backdrop-blur-md border border-[#B2EBF2]/80 shadow-[0_10px_35px_rgba(2,132,199,0.08)]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 divide-y md:divide-y-0 md:divide-x divide-cyan-200/60">
            {/* Attribute 1: 2 Health Pathways */}
            <div className="text-left md:text-center px-3 pt-2 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#00838F] tracking-tight font-display">
                2
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                Health Pathways
              </div>
            </div>

            {/* Attribute 2: Explainable AI / Clear factor attribution */}
            <div className="text-left md:text-center px-3 pt-4 md:pt-0">
              <div className="text-xl sm:text-2xl font-extrabold text-[#0F254B] tracking-tight font-display">
                Explainable AI
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                Clear factor attribution
              </div>
            </div>

            {/* Attribute 3: Cost-Aware / Progressive next steps */}
            <div className="text-left md:text-center px-3 pt-4 md:pt-0">
              <div className="text-xl sm:text-2xl font-extrabold text-[#0F254B] tracking-tight font-display">
                Cost-Aware
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                Progressive next steps
              </div>
            </div>

            {/* Attribute 4: Pakistani / Nutrition & guidance */}
            <div className="text-left md:text-center px-3 pt-4 md:pt-0">
              <div className="text-xl sm:text-2xl font-extrabold text-[#00838F] tracking-tight font-display">
                Pakistani
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                Nutrition &amp; guidance
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default HeroSection;
