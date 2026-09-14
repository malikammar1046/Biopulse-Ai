import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Heart,
  BarChart3,
  Dumbbell,
  Zap,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Users,
  Layers,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { ROUTES } from '../../../constants/routes';

// Female Venus symbol
const VenusIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7" />
    <path d="M9 18h6" />
  </svg>
);

// Male Mars symbol
const MarsIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="10" cy="14" r="5" />
    <path d="M19 5l-5.4 5.4" />
    <path d="M15 5h4v4" />
  </svg>
);

// Decorative Lotus symbol for reproductive wellness
const LotusIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 4C10 8 8 13 8 16C8 18.2 9.8 20 12 20C14.2 20 16 18.2 16 16C16 13 14 8 12 4Z"
      fill="#FDA4AF"
      fillOpacity="0.4"
    />
    <path d="M8 16C5.5 15.5 3 13 3 10C5 10 7.5 11.5 8 14" />
    <path d="M16 16C18.5 15.5 21 13 21 10C19 10 16.5 11.5 16 14" />
  </svg>
);

export const TwoHealthPathwaysSection: React.FC = () => {
  return (
    <section
      id="two-pathways"
      className="relative py-20 sm:py-28 bg-[#FAFCFF] text-[#162A45] border-t border-slate-200/70 overflow-hidden select-none"
      aria-labelledby="two-pathways-title"
    >
      {/* ── Top-Left Subtle Curved Cyan Wave / Ambient Glow ── */}
      <div
        className="absolute -top-12 -left-12 w-[480px] h-[480px] rounded-full pointer-events-none -z-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(207, 250, 254, 0.8) 0%, rgba(224, 247, 250, 0.4) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <svg
        className="absolute top-0 left-0 w-80 sm:w-[460px] h-auto pointer-events-none text-cyan-100/50 -z-0"
        viewBox="0 0 460 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M-20 0C80 80 160 140 280 120C380 100 420 180 460 220"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
      </svg>

      {/* ── Bottom-Right Flowing Curve Accent & Cursive Script ── */}
      <svg
        className="hidden lg:block absolute bottom-8 right-32 w-64 h-24 pointer-events-none text-cyan-200/70 -z-0"
        viewBox="0 0 240 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 60 C80 60, 140 15, 230 40"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div className="hidden lg:block absolute bottom-4 right-6 xl:right-12 rotate-[-8deg] select-none pointer-events-none z-10">
        <span
          className="text-3xl xl:text-4xl font-bold text-[#00A8B5] block leading-tight drop-shadow-xs"
          style={{ fontFamily: "'Caveat', cursive" }}
        >
          Healthier
          <br />
          Together
        </span>
      </div>

      <Container size="xl" className="relative z-10">
        {/* ── Section Header ── */}
        <div className="max-w-3xl mx-auto text-center space-y-3.5 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] text-xs font-semibold text-[#00838F] shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em]">
              TWO DEDICATED PATHWAYS
            </span>
          </div>

          <h2
            id="two-pathways-title"
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold font-display tracking-tight leading-[1.15]"
          >
            <span className="text-[#0F254B]">Different Journeys.</span>{' '}
            <span className="text-[#00838F]">A Healthier Tomorrow.</span>
          </h2>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            Specialized, evidence-based screening for women and men — powered by AI, designed for you.
          </p>
        </div>

        {/* ── Dual Specialized Pathway Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 sm:gap-8 items-stretch max-w-6xl mx-auto">
          {/* ══════════════════════════════════════════════
              CARD 1: FOR WOMEN — PCOS SCREENING
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-[32px] bg-gradient-to-br from-white via-white to-[#FFF5F8] border border-pink-100 shadow-[0_12px_35px_rgba(244,114,182,0.09)] hover:shadow-[0_18px_45px_rgba(244,114,182,0.14)] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center h-full">
              {/* Left Content Column */}
              <div className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-between h-full space-y-5">
                <div className="space-y-3">
                  {/* Top Pill: ♀ For Women */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] border border-pink-200/80 text-[11px] font-bold text-[#E11D48] w-fit shadow-2xs">
                    <VenusIcon className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>For Women</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-[1.65rem] font-bold font-display leading-tight tracking-tight">
                    <span className="text-[#E11D48]">PCOS</span>{' '}
                    <span className="text-[#0F254B]">Screening</span>
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 font-sans leading-relaxed">
                    Understand your risk for PCOS with a simple, non-diagnostic assessment based on symptoms, cycle information, lifestyle, and metabolic indicators.
                  </p>
                </div>

                {/* 3 Benefit Bullets */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                      <Calendar className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Menstrual &amp; hormonal health
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                      <Heart className="w-3 h-3 fill-[#E11D48]/20" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Symptom &amp; lifestyle assessment
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                      <BarChart3 className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Personalized insights
                    </span>
                  </div>
                </div>

                {/* Button CTA */}
                <div className="pt-2">
                  <Link to={ROUTES.UNDERSTAND_PCOS_CANONICAL}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-full font-bold text-white text-xs sm:text-sm bg-[#E11D48] hover:bg-[#BE123C] shadow-md shadow-pink-600/20 transition-all cursor-pointer"
                    >
                      <span>Understand PCOS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right Visual Column (Model + Organic Shapes + Script + Floating Badge) */}
              <div className="sm:col-span-5 relative p-4 sm:p-5 flex items-center justify-center min-h-[270px] sm:min-h-[310px] h-full overflow-hidden">
                {/* Organic Pastel Pink Blob Shape Background */}
                <div
                  className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-[48%_52%_58%_42%/45%_55%_45%_55%] bg-gradient-to-br from-[#FCE7F3] via-[#FBCFE8]/80 to-[#FCE7F3]/70 -z-0"
                  aria-hidden="true"
                />

                {/* Model Portrait */}
                <div className="relative z-10 w-44 sm:w-52 aspect-[4/5] rounded-[24px] overflow-hidden shadow-xs">
                  <img
                    src="/assets/images/female-pathway.jpg"
                    alt="PCOS Screening - For Women"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Cursive Handwriting: Stronger Every Day */}
                <div className="absolute top-2 right-1 sm:right-3 rotate-6 select-none z-20 pointer-events-none drop-shadow-xs">
                  <span
                    className="text-2xl sm:text-3xl font-bold text-[#F43F5E] block leading-tight text-right"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    Stronger
                    <br />
                    Every Day
                  </span>
                </div>

                {/* Floating Badge Card: Your Health / Your Power */}
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-pink-100 shadow-md shadow-pink-900/10 flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-pink-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0">
                    <LotusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-bold text-slate-800">Your Health</div>
                    <div className="text-[10px] font-medium text-slate-500">Your Power</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              CARD 2: FOR MEN — HYPOGONADISM SCREENING
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-[32px] bg-gradient-to-br from-white via-white to-[#F0F9FF] border border-sky-100 shadow-[0_12px_35px_rgba(56,189,248,0.09)] hover:shadow-[0_18px_45px_rgba(56,189,248,0.14)] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center h-full">
              {/* Left Content Column */}
              <div className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-between h-full space-y-5">
                <div className="space-y-3">
                  {/* Top Pill: ♂ For Men */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F9FF] border border-sky-200/80 text-[11px] font-bold text-[#0284C7] w-fit shadow-2xs">
                    <MarsIcon className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>For Men</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-[1.65rem] font-bold font-display leading-tight tracking-tight">
                    <span className="text-[#0284C7]">Hypogonadism</span>{' '}
                    <span className="text-[#0F254B]">Screening</span>
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 font-sans leading-relaxed">
                    Explore your risk for hypogonadism with a simple, non-diagnostic assessment based on symptoms, health profile, and relevant hormonal and metabolic indicators.
                  </p>
                </div>

                {/* 3 Benefit Bullets */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                      <Dumbbell className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Symptoms &amp; energy levels
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                      <Heart className="w-3 h-3 fill-[#0284C7]/20" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Hormonal &amp; metabolic health
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                      <BarChart3 className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Personalized insights
                    </span>
                  </div>
                </div>

                {/* Button CTA */}
                <div className="pt-2">
                  <Link to={ROUTES.UNDERSTAND_HYPOGONADISM}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-full font-bold text-white text-xs sm:text-sm bg-[#0284C7] hover:bg-[#0369A1] shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                    >
                      <span>Understand Hypogonadism</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right Visual Column (Model + Organic Shapes + Script + Floating Badge) */}
              <div className="sm:col-span-5 relative p-4 sm:p-5 flex items-center justify-center min-h-[270px] sm:min-h-[310px] h-full overflow-hidden">
                {/* Overlapping Pastel Cyan/Blue Circular Shapes Background */}
                <div
                  className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-[#E0F2FE]/80 -top-2 left-2 sm:left-4 -z-0"
                  aria-hidden="true"
                />
                <div
                  className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#BAE6FD]/60 bottom-1 right-2 sm:right-4 -z-0"
                  aria-hidden="true"
                />

                {/* Model Portrait */}
                <div className="relative z-10 w-44 sm:w-52 aspect-[4/5] rounded-[24px] overflow-hidden shadow-xs">
                  <img
                    src="/assets/images/male-pathway.jpg"
                    alt="Hypogonadism Screening - For Men"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Cursive Handwriting: More Energy Brighter Days */}
                <div className="absolute top-1 right-1 sm:right-2 rotate-6 select-none z-20 pointer-events-none drop-shadow-xs">
                  <span
                    className="text-xl sm:text-2xl font-bold text-[#0284C7] block leading-tight text-right"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    More
                    <br />
                    Energy
                    <br />
                    Brighter
                    <br />
                    Days
                  </span>
                </div>

                {/* Floating Badge Card: Optimized Today / for a Stronger You */}
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-sky-100 shadow-md shadow-sky-900/10 flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#0284C7]" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-bold text-slate-800">Optimized Today</div>
                    <div className="text-[10px] font-medium text-slate-500">for a Stronger You</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom Micro-Trust Bar Matching Reference Design ── */}
        <div className="mt-12 sm:mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00838F]" />
            <span>Private &amp; Secure</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-slate-200" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#00838F]" />
            <span>Clinically Informed</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-slate-200" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00838F]" />
            <span>Built for Pakistan</span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TwoHealthPathwaysSection;
