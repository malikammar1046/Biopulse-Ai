import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ArrowRight,
  ShieldCheck,
  Users,
  Sun,
  Mail,
  CheckCircle2,
  ShieldAlert,
  Sprout
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Container } from '../ui/Container';
import { Logo } from '../brand/Logo';
import {
  FooterBannerLeftBotanical,
  FooterBannerRightBotanical,
  FooterLeftBotanical,
  FooterRightBotanical,
} from '../brand/BotanicalFoliage';

// Social Vector SVG Icons
const LinkedInIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.91 0-1.64.73-1.64 1.64 0 .91.73 1.64 1.64 1.64.91 0 1.64-.73 1.64-1.64 0-.91-.73-1.64-1.64-1.64z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// X (formerly Twitter) SVG Icon
const XTwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const Footer: React.FC = () => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim() && emailInput.includes('@')) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="w-full select-none text-[#162A45] relative overflow-hidden bg-white border-t border-slate-100">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* ── 1. TOP CALL-TO-ACTION RIBBON ("Ready to Take the First Step?") ─────── */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative w-full bg-gradient-to-r from-[#0284C7] via-[#0D9488] to-[#06B6D4] text-white py-4 sm:py-5 overflow-hidden">
        {/* Botanical White Silhouettes Overlay */}
        <div className="absolute left-0 bottom-0 pointer-events-none -z-0 opacity-75">
          <FooterBannerLeftBotanical className="w-28 sm:w-40 lg:w-48 h-auto" />
        </div>
        <div className="absolute right-0 bottom-0 pointer-events-none -z-0 opacity-75">
          <FooterBannerRightBotanical className="w-28 sm:w-40 lg:w-48 h-auto" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5 lg:gap-6">
            {/* Left: Heading & Subtitle */}
            <div className="text-center lg:text-left space-y-0.5 max-w-lg">
              <h2 className="text-base sm:text-lg font-extrabold font-display tracking-tight text-white">
                Ready to Take the First Step?
              </h2>
              <p className="text-xs text-white/90 font-sans leading-normal">
                Start your personalized health screening today for a brighter, healthier tomorrow.
              </p>
            </div>

            {/* Center Action: Pill Button */}
            <div className="shrink-0">
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-[#0D9488] hover:text-[#0369A1] font-bold text-xs sm:text-sm shadow-md hover:scale-[1.02] transition-all group"
              >
                <span>Sign Up Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Right: Cursive Flourish + 3 Mini Badges */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              {/* Cursive Tagline */}
              <div className="hidden sm:flex items-center gap-1.5 text-white -rotate-1 select-none">
                <span className="font-script text-xl lg:text-2xl font-bold tracking-wide">
                  For a healthier you.
                </span>
                <Heart className="w-3.5 h-3.5 text-white fill-white/20 stroke-[2.2]" />
              </div>

              {/* 3 Mini Trust Columns with Dividers */}
              <div className="flex items-center gap-3 sm:gap-4 border-l border-white/25 pl-4 sm:pl-5">
                <div className="flex flex-col items-center text-center space-y-0.5">
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white">
                    <Sprout className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-medium text-white/95">Insights</span>
                </div>

                <div className="h-6 w-px bg-white/20" />

                <div className="flex flex-col items-center text-center space-y-0.5">
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white">
                    <Users className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-medium text-white/95">Inclusive</span>
                </div>

                <div className="h-6 w-px bg-white/20" />

                <div className="flex flex-col items-center text-center space-y-0.5">
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white">
                    <Sun className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-medium text-white/95">Tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* ── 2. COMPACT MAIN FOOTER BODY (4 PROFESSIONAL COLUMNS ON WHITE) ─────── */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-9 pb-5 overflow-hidden bg-white text-[#162A45]">
        {/* Subtle Botanical Foliage Accents on Left and Right Edges */}
        <div className="absolute bottom-0 left-0 pointer-events-none -z-0 opacity-50">
          <FooterLeftBotanical className="w-32 sm:w-44 h-auto" />
        </div>
        <div className="absolute bottom-0 right-0 pointer-events-none -z-0 opacity-60">
          <FooterRightBotanical className="w-44 sm:w-56 h-auto" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 pb-6">
            {/* ── Column 1: Brand Presentation (Col Span 4) ── */}
            <div className="lg:col-span-4 space-y-3 text-left">
              <Link to={ROUTES.HOME} className="inline-block">
                <Logo size="md" theme="light" />
              </Link>

              <p className="text-xs text-slate-600 font-sans leading-relaxed max-w-sm">
                BioPulse AI is an AI-assisted reproductive-endocrine screening platform providing evidence-based guidance for PCOS (female) and Hypogonadism (male).
              </p>

              {/* 3 Trust Attribute Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[11px] text-[#0891B2] font-semibold">
                  <Sprout className="w-3 h-3" />
                  <span>Evidence Based</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] text-[#0284C7] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Dual Pathway</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-pink-200 text-[11px] text-[#E11D48] font-semibold">
                  <Heart className="w-3 h-3 fill-rose-100" />
                  <span>Non-Diagnostic</span>
                </span>
              </div>

              {/* Cursive Tagline Accent */}
              <div className="pt-0.5 flex items-center gap-1.5 text-[#0891B2] -rotate-1 select-none">
                <span className="font-script text-base sm:text-lg font-bold">
                  Different journeys. Same brighter goal.
                </span>
                <Heart className="w-3.5 h-3.5 text-[#E11D48] fill-rose-100 stroke-[2.2]" />
              </div>
            </div>

            {/* ── Column 2: Platform Links (Col Span 2) ── */}
            <div className="lg:col-span-2 space-y-2 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E38] font-display">
                Platform
              </h3>
              <ul className="space-y-1 text-xs font-medium text-slate-600">
                <li>
                  <Link to={ROUTES.HOME} className="hover:text-[#0891B2] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.ABOUT} className="hover:text-[#0891B2] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.HOW_IT_WORKS} className="hover:text-[#0891B2] transition-colors">
                    How Screening Works
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.CONDITIONS} className="hover:text-[#0891B2] transition-colors">
                    Supported Conditions
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.CARE_CIRCLE} className="hover:text-[#0891B2] transition-colors">
                    Care Circle Ecosystem
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.DOCTORS} className="hover:text-[#0891B2] transition-colors">
                    Doctors Directory
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.FEATURES} className="hover:text-[#0891B2] transition-colors">
                    Resources &amp; Capabilities
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.APP_DOWNLOAD} className="hover:text-[#0891B2] transition-colors flex items-center gap-1.5 font-semibold text-[#0891B2]">
                    <span>Download Mobile App (APK)</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-100 text-[#0891B2] text-[9px] font-bold">
                      v1.0.0
                    </span>
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.CONTACT} className="hover:text-[#0891B2] transition-colors">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* ── Column 3: Screening & Guidance (Col Span 3) ── */}
            <div className="lg:col-span-3 space-y-2 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E38] font-display">
                Screening &amp; Guidance
              </h3>
              <ul className="space-y-1 text-xs font-medium text-slate-600">
                <li>
                  <Link to={ROUTES.UNDERSTAND_PCOS_CANONICAL} className="hover:text-[#0891B2] transition-colors">
                    Understand PCOS (Female)
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.UNDERSTAND_MALE_HYPOGONADISM} className="hover:text-[#0891B2] transition-colors">
                    Understand Hypogonadism (Male)
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.FEATURES} className="hover:text-[#0891B2] transition-colors">
                    Clinical Resources &amp; Meal Plans
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.HOW_IT_WORKS} className="hover:text-[#0891B2] transition-colors">
                    Cost-Aware Progression
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.CARE_CIRCLE} className="hover:text-[#0891B2] transition-colors">
                    Doctor &amp; Family Sharing
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.TRUST_PRIVACY} className="hover:text-[#0891B2] transition-colors">
                    Privacy &amp; Data Security
                  </Link>
                </li>
              </ul>
            </div>

            {/* ── Column 4: Stay Updated (Col Span 3) ── */}
            <div className="lg:col-span-3 space-y-2 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E38] font-display">
                Stay Updated
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Get reproductive-endocrine screening updates directly to your inbox.
              </p>

              {/* Newsletter Subscription Form */}
              <form onSubmit={handleSubscribe} className="space-y-1.5 pt-0.5">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-slate-300 focus:outline-none focus:border-[#0891B2] text-[#162A45] placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 px-4 rounded-full bg-gradient-to-r from-[#00C4DF] to-[#0284C7] hover:from-[#00B4CB] hover:to-[#0369A1] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Subscribe
                </button>

                {subscribed && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 pt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Subscribed successfully!</span>
                  </p>
                )}
              </form>

              {/* Compact Cursive Signature */}
              <div className="pt-0.5 text-right text-[#0891B2] select-none pr-2">
                <span className="font-script text-base font-bold inline-flex items-center gap-1">
                  Knowledge. Care. Brighter Tomorrows.
                  <Heart className="w-3 h-3 text-[#E11D48] fill-rose-100 stroke-[2.5]" />
                </span>
              </div>
            </div>
          </div>

          {/* ── Compact Medical Notice Strip ── */}
          <div className="mb-4 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5 text-left">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-[11px] text-slate-500 leading-normal font-sans">
              <strong className="text-slate-700 mr-1">Medical Notice:</strong>
              BioPulse AI is an AI-assisted screening and decision-support tool. It is <strong>NOT</strong> a diagnostic system or doctor replacement. Consult healthcare professionals for formal clinical diagnoses.
            </p>
          </div>

          {/* ──────────────────────────────────────────────────────────────────── */}
          {/* ── 3. BOTTOM SUB-FOOTER BAR ──────────────────────────────────────── */}
          {/* ──────────────────────────────────────────────────────────────────── */}
          <div className="pt-3.5 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            {/* Left: Copyright */}
            <p>© {new Date().getFullYear()} BioPulse AI. All rights reserved.</p>

            {/* Center: "MADE WITH CARE FOR A HEALTHIER WORLD." */}
            <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              <Heart className="w-3 h-3 text-[#E11D48] fill-rose-100 stroke-[2]" />
              <span>MADE WITH CARE FOR A HEALTHIER WORLD.</span>
            </div>

            {/* Right: Social Media Icons + Privacy Link */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-slate-500">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full bg-slate-100 hover:text-[#0284C7] flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon className="w-3 h-3" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full bg-slate-100 hover:text-[#0284C7] flex items-center justify-center transition-colors"
                  aria-label="X (Twitter)"
                >
                  <XTwitterIcon className="w-3 h-3" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full bg-slate-100 hover:text-[#E11D48] flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-3 h-3" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full bg-slate-100 hover:text-[#E11D48] flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="w-3 h-3" />
                </a>
              </div>
              <Link to={ROUTES.TRUST_PRIVACY} className="hover:text-slate-600 transition-colors">
                Privacy &amp; Terms
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </footer>
  );
};
