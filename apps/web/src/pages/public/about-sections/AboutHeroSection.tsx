import React, { useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Users, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';
import { AnatomicalLabel } from '../../../components/biological/AnatomicalLabel';
import { BiologicalParticles } from '../../../components/biological/BiologicalParticles';

// Lazy-load the heavy 3D canvas so it does not block initial page render
const AboutAnatomyCanvas = lazy(() =>
  import('../../../components/biological/AboutAnatomyCanvas').then((m) => ({
    default: m.AboutAnatomyCanvas,
  }))
);

/* ──────────────────────────────────────────────────────────────────────────
   About Hero — Cinematic Anatomical Experience
   ────────────────────────────────────────────────────────────────────────*/

export const AboutHeroSection: React.FC = () => {
  const [animPhase, setAnimPhase] = useState(0);
  const labelsVisible = animPhase >= 4;

  // Scroll-based exit: anatomy retreats, labels fade
  const { scrollY } = useScroll();
  const anatomyScale = useTransform(scrollY, [0, 600], [1, 0.82]);
  const anatomyOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const labelsOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section
      id="about-hero"
      className="relative min-h-screen bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white overflow-hidden flex flex-col"
      aria-label="PMOSense About Us hero with anatomical visualization"
    >
      {/* ── Layer 1: Deep obsidian base (CSS gradient above) ── */}

      {/* ── Layer 2: Large blurred orchid radial glow ── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[700px] sm:h-[1000px] bg-[#6E2D8B]/18 rounded-full blur-[170px] pointer-events-none" />

      {/* ── Layer 3: Pink/blush glow around ovary region ── */}
      <div className="absolute top-[35%] left-[30%] w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] bg-[#E87084]/14 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] right-[30%] w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] bg-[#FDA4AF]/12 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Layer 4: Ambient biological particles ── */}
      <BiologicalParticles count={20} />

      {/* ── Layer 5: Soft vignette ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#10071A_95%)] pointer-events-none" />

      {/* ── Layer 6: Extremely subtle grain ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '150px',
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO COPY — positioned above the anatomy, never covering it
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 pt-28 sm:pt-32 pb-4">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-5 max-w-3xl mx-auto"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/8 border border-white/12 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#F6F2FA]">
                About PMOSense
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-display">
              Women's health is{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                complex.
              </span>
              <br className="hidden sm:block" />{' '}
              Understanding it shouldn't be.
            </h1>

            {/* Supporting copy */}
            <p className="text-sm sm:text-base text-[#B4A6C7] leading-relaxed max-w-2xl mx-auto font-sans">
              PMOSense brings cycle patterns, symptoms, medical reports and lifestyle
              information together into one explainable health-information experience.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-xl shadow-purple-950/30"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore How PMOSense Works
                </Button>
              </Link>
              <Link to={ROUTES.TEAM}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/25 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm"
                  iconLeft={<Users className="w-4 h-4" />}
                >
                  Meet Our Team
                </Button>
              </Link>
            </div>

            {/* Non-diagnostic safety meta */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#B4A6C7]/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FB7185]" />
                Non-Diagnostic Health Intelligence
              </span>
              <span className="w-1 h-1 rounded-full bg-white/15 hidden sm:block" />
              <span className="hidden sm:inline">Rotterdam Criteria Aligned</span>
            </div>
          </motion.div>
        </Container>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CENTERED 3D ANATOMY CANVAS + SCIENTIFIC LABELS
         ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{ scale: anatomyScale, opacity: anatomyOpacity }}
        className="relative z-10 flex-grow flex items-center justify-center pb-8"
      >
        <div className="relative w-full max-w-4xl mx-auto px-4">
          {/* 3D Canvas */}
          <Suspense
            fallback={
              <div className="w-full h-[440px] sm:h-[540px] flex items-center justify-center">
                <div className="w-52 h-52 rounded-full bg-gradient-to-tr from-[#6E2D8B]/30 to-[#E87084]/20 blur-3xl animate-pulse" />
              </div>
            }
          >
            <AboutAnatomyCanvas
              className="w-full h-[440px] sm:h-[540px] lg:h-[580px]"
              onPhaseChange={setAnimPhase}
            />
          </Suspense>

          {/* ── Anatomical Labels (sequential animation after phase 4) ── */}
          <motion.div
            style={{ opacity: labelsOpacity }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* 1. UTERUS — top center */}
            <AnatomicalLabel
              label="Uterus"
              subtitle="Central reproductive organ"
              color="#C084FC"
              delay={0}
              visible={labelsVisible}
              anchor="center-top"
              style={{ top: '6%', left: '50%', transform: 'translateX(-50%)' }}
            />

            {/* 2. LEFT OVARY — left side */}
            <AnatomicalLabel
              label="Left Ovary"
              subtitle="Follicles & endocrine activity"
              color="#FB7185"
              delay={0.3}
              visible={labelsVisible}
              anchor="left"
              style={{ top: '28%', left: '2%' }}
              className="hidden sm:block"
            />

            {/* 3. RIGHT OVARY — right side */}
            <AnatomicalLabel
              label="Right Ovary"
              subtitle="Follicles & endocrine activity"
              color="#FB7185"
              delay={0.3}
              visible={labelsVisible}
              anchor="right"
              style={{ top: '28%', right: '2%' }}
              className="hidden sm:block"
            />

            {/* 4. FALLOPIAN TUBES — upper area */}
            <AnatomicalLabel
              label="Fallopian Tubes"
              subtitle="Connect the ovaries with the uterus"
              color="#D8B4FE"
              delay={0.6}
              visible={labelsVisible}
              anchor="right"
              style={{ top: '14%', right: '8%' }}
              className="hidden md:block"
            />

            {/* 5. CERVIX — lower center */}
            <AnatomicalLabel
              label="Cervix"
              subtitle="Lower portion of the uterus"
              color="#8E3EAF"
              delay={0.9}
              visible={labelsVisible}
              anchor="left"
              style={{ bottom: '30%', left: '8%' }}
              className="hidden sm:block"
            />

            {/* 6. VAGINA — bottom center */}
            <AnatomicalLabel
              label="Vagina"
              subtitle="Muscular canal connecting the cervix to the exterior"
              color="#4A154B"
              delay={1.1}
              visible={labelsVisible}
              anchor="center-top"
              style={{ bottom: '10%', left: '50%', transform: 'translateX(-50%)' }}
              className="hidden sm:block"
            />

            {/* 7. FOLLICLES — lower left area */}
            <AnatomicalLabel
              label="Follicles"
              subtitle="Developing ovarian structures"
              color="#FDA4AF"
              delay={1.3}
              visible={labelsVisible}
              anchor="left"
              style={{ bottom: '34%', left: '3%' }}
              className="hidden md:block"
            />
          </motion.div>

          {/* ── Mobile compact anatomy cards (shown on small screens) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={labelsVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="sm:hidden grid grid-cols-2 gap-2 mt-4"
          >
            {[
              { label: 'Uterus', color: '#C084FC' },
              { label: 'Ovaries', color: '#FB7185' },
              { label: 'Cervix', color: '#8E3EAF' },
              { label: 'Follicles', color: '#FDA4AF' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Scroll transition cue ── */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-20 text-center pb-6 flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
      >
        <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-[0.25em] text-[#B4A6C7]">
          Scroll to explore
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-[#FB7185]"
        >
          <path
            d="M8 3v8m0 0l3-3m-3 3L5 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </section>
  );
};
