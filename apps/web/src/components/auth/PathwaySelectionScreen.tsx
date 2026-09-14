import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  BarChart3,
  Zap,
  Dumbbell,
  User,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { ROUTES } from '../../constants/routes';

interface PathwaySelectionScreenProps {
  onSelectPathway: (pathway: 'female' | 'male') => void;
  loading?: boolean;
  loadingPathway?: 'female' | 'male' | null;
  error?: string;
  onBack?: () => void;
}

// Crisp Venus / Female Symbol SVG
const VenusIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
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

// Crisp Lotus / Reproductive Wellness SVG
const LotusIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3c1.5 3 4 5.5 7 7-2 3-5 4-7 4s-5-1-7-4c3-1.5 5.5-4 7-7z" />
    <path d="M12 7v7" />
    <path d="M6 14c-1.5 1.5-3 2.5-4 2.5 1.5 2 4.5 2.5 8 2.5" />
    <path d="M18 14c1.5 1.5 3 2.5 4 2.5-1.5 2-4.5 2.5-8 2.5" />
  </svg>
);

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
      strokeOpacity="0.4"
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
      strokeOpacity="0.4"
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

export const PathwaySelectionScreen: React.FC<PathwaySelectionScreenProps> = ({
  onSelectPathway,
  loading = false,
  loadingPathway = null,
  error,
  onBack,
}) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#F7F9FD] text-[#162A45] relative overflow-x-hidden flex flex-col justify-between selection:bg-[#E87084] selection:text-white">
      {/* ── Soft Ambient Glows ── */}
      <div
        className="absolute top-0 left-0 w-[45vw] h-[55vh] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 15% 15%, rgba(254, 205, 211, 0.35) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-[45vw] h-[55vh] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 85% 15%, rgba(186, 230, 253, 0.4) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* ── Botanical Leaf Accents ── */}
      <PinkBotanicalFoliage className="hidden md:block absolute top-6 -left-10 w-64 lg:w-80 h-auto pointer-events-none z-0" />
      <BlueBotanicalFoliage className="hidden md:block absolute top-6 -right-10 w-64 lg:w-80 h-auto pointer-events-none z-0" />

      {/* ── Top Auth Navigation Header ── */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 group transition-transform hover:scale-[1.01]"
            aria-label="BioPulse AI Home"
          >
            <Logo size="md" theme="light" />
          </Link>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/90 hover:bg-white border border-slate-200/80 shadow-2xs backdrop-blur-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Step 2 of 2: Choose Pathway</span>
        </div>
      </header>

      {/* ── Main Hero & Cards Presentation ── */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 flex-1 flex flex-col justify-center">
        {/* Header Block with Decorative Cursive Annotations */}
        <div className="relative text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          {/* Left Cursive Note */}
          <div className="hidden lg:flex flex-col items-center absolute -top-3 -left-44 xl:-left-56 rotate-[-8deg] select-none pointer-events-none">
            <span
              className="text-2xl xl:text-3xl font-bold text-[#E11D48] leading-tight text-center"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Different<br />journeys.<br />A healthier you.
            </span>
            <svg
              className="w-24 h-4 text-[#E11D48] mt-1"
              viewBox="0 0 100 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
            >
              <path d="M5 8 Q 25 2, 45 8 T 85 8" />
              <path d="M15 15 Q 35 9, 55 15 T 95 15" />
            </svg>
          </div>

          {/* Right Cursive Note */}
          <div className="hidden lg:flex flex-col items-center absolute -top-3 -right-44 xl:-right-56 rotate-[8deg] select-none pointer-events-none">
            <span
              className="text-2xl xl:text-3xl font-bold text-[#0284C7] leading-tight text-center"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Your health<br />today.<br />A brighter<br />tomorrow.
            </span>
            <svg
              className="w-24 h-4 text-[#0284C7] mt-1"
              viewBox="0 0 100 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
            >
              <path d="M10 10 Q 30 4, 50 10 T 90 10" />
            </svg>
          </div>

          {/* Top Eyebrow */}
          <p className="text-[11px] sm:text-xs font-extrabold tracking-[0.22em] text-[#162A45] uppercase mb-1.5 sm:mb-2">
            SCIENCE TODAY. HEALTHIER TOMORROWS.
          </p>

          {/* Main Display Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold tracking-tight text-[#162A45] leading-[1.1] mb-2">
            Choose Your <span className="text-[#0891B2]">Health Path</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 font-medium text-xs sm:text-sm lg:text-base leading-relaxed max-w-md mx-auto">
            Tailored insights. Evidence-based screening.
            <br />
            A brighter tomorrow.
          </p>

          {/* Global error banner if registration failed */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-semibold text-rose-700 shadow-xs max-w-md mx-auto"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* ── Two Specialized Pathway Cards (Female & Male only) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-4xl mx-auto w-full items-stretch">
          {/* ══════════════════════════════════════════════
              CARD 1: FEMALE HEALTH (Healthier Her)
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="rounded-[32px] p-2.5 sm:p-3 bg-gradient-to-b from-[#FFF0F5] via-[#FFF6FA] to-[#FFE8F0] border border-pink-200/90 shadow-xl shadow-pink-100/60 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-pink-200/70 hover:-translate-y-1 group"
          >
            {/* Top Portrait Image Section */}
            <div className="relative w-full h-64 sm:h-72 rounded-[24px] overflow-hidden bg-pink-100">
              <img
                src="/images/pathway/female-pathway.jpg"
                alt="Female Health Pathway"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />

              {/* Decorative Subtle Foliage Overlay */}
              <div
                className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#FFEBF2]/90 via-transparent to-transparent opacity-80"
                aria-hidden="true"
              />

              {/* Cursive Handwriting Badge: Healthier Her */}
              <div className="absolute top-4 left-4 -rotate-6 select-none">
                <span
                  className="text-3xl sm:text-4xl font-bold text-[#E11D48] drop-shadow-md"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Healthier Her
                </span>
              </div>
            </div>

            {/* Bottom Content White Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-6 sm:p-7 mt-3 shadow-xs border border-pink-100/80 flex flex-col justify-between flex-1">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#162A45] tracking-tight text-center">
                  Female Health
                </h2>
                <h3 className="text-base sm:text-lg font-bold text-[#E11D48] text-center mt-1">
                  PCOS Screening
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm text-center mt-2 leading-relaxed max-w-[270px] mx-auto">
                  Understand your hormones. Take control of your health. A brighter tomorrow.
                </p>

                {/* 4 Feature Items */}
                <div className="mt-6 space-y-3.5 max-w-xs mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                      <Heart className="w-4 h-4 fill-pink-100" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Menstrual & hormonal health
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                      <VenusIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Metabolic insights
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                      <LotusIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Reproductive wellness
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200/80 text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Personalized guidance
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button & Italic Script Note */}
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onSelectPathway('female')}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-full font-bold text-white text-sm sm:text-base shadow-lg shadow-pink-500/25 bg-gradient-to-r from-[#F43F5E] via-[#EC4899] to-[#E11D48] hover:shadow-pink-500/40 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && loadingPathway === 'female' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Starting Female Path...</span>
                    </>
                  ) : (
                    <>
                      <span>Choose Female Path</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p
                  className="text-center text-[#E11D48] text-sm sm:text-base font-semibold mt-3 select-none"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  For her. A healthier, brighter you.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              CARD 2: MALE HEALTH (Stronger Him)
             ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            className="rounded-[32px] p-2.5 sm:p-3 bg-gradient-to-b from-[#F0F9FF] via-[#F8FCFF] to-[#E0F2FE] border border-sky-200/90 shadow-xl shadow-sky-100/60 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-sky-200/70 hover:-translate-y-1 group"
          >
            {/* Top Portrait Image Section */}
            <div className="relative w-full h-64 sm:h-72 rounded-[24px] overflow-hidden bg-sky-100">
              <img
                src="/images/pathway/male-pathway.jpg"
                alt="Male Health Pathway"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />

              {/* Decorative Subtle Foliage Overlay */}
              <div
                className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#E0F2FE]/90 via-transparent to-transparent opacity-80"
                aria-hidden="true"
              />

              {/* Cursive Handwriting Badge: Stronger Him */}
              <div className="absolute top-4 right-4 rotate-6 select-none">
                <span
                  className="text-3xl sm:text-4xl font-bold text-[#0284C7] drop-shadow-md"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Stronger Him
                </span>
              </div>
            </div>

            {/* Bottom Content White Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-6 sm:p-7 mt-3 shadow-xs border border-sky-100/80 flex flex-col justify-between flex-1">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#162A45] tracking-tight text-center">
                  Male Health
                </h2>
                <h3 className="text-base sm:text-lg font-bold text-[#0284C7] text-center mt-1">
                  Hypogonadism Screening
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm text-center mt-2 leading-relaxed max-w-[270px] mx-auto">
                  Understand your hormones. Reclaim your energy, vitality and well-being.
                </p>

                {/* 4 Feature Items */}
                <div className="mt-6 space-y-3.5 max-w-xs mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                      <Zap className="w-4 h-4 fill-sky-100" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Hormonal health
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Energy & vitality
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Metabolic function
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Personalized guidance
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button & Italic Script Note */}
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onSelectPathway('male')}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-full font-bold text-white text-sm sm:text-base shadow-lg shadow-sky-500/25 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#2563EB] hover:shadow-sky-500/40 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && loadingPathway === 'male' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Starting Male Path...</span>
                    </>
                  ) : (
                    <>
                      <span>Choose Male Path</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p
                  className="text-center text-[#0284C7] text-sm sm:text-base font-semibold mt-3 select-none"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  For him. A stronger, brighter tomorrow.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Minimal Footer ── */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} BIOPulse AI. All rights reserved.</p>
      </footer>
    </div>
  );
};
