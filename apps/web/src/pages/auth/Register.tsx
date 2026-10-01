import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail01,
  User01,
  Lock01,
  Eye,
  EyeOff,
  ArrowRight,
  InfoCircle,
  CheckCircle,
  ActivityHeart,
  Users01,
  LineChartUp01,
  HeartHand,
} from '@untitledui/icons';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { Logo } from '../../components/brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPathwayOnboardingRoute } from '../../constants/routes';
import type { UserGender } from '../../types/onboarding';
import { PathwaySelectionScreen } from '../../components/auth/PathwaySelectionScreen';
import { SmallBotanicalSprig } from '../../components/brand/BotanicalFoliage';
import { BioPulseLoadingScreen } from '../../components/brand/BioPulseLoadingScreen';
import { preloadOnboardingRoutes } from '../../utils/routePreloaders';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  general?: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  // Step state: 'credentials' (Step 1 matching reference) | 'pathway' (Step 2)
  const [step, setStep] = useState<'credentials' | 'pathway'>('credentials');

  // Step 1: Account credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailConfirmReq, setEmailConfirmReq] = useState(false);
  const [loadingPathway, setLoadingPathway] = useState<'female' | 'male' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPathway, setTransitionPathway] = useState<'female' | 'male' | null>(null);

  // Preload lazy onboarding route chunks as soon as pathway selection step opens
  useEffect(() => {
    if (step === 'pathway') {
      preloadOnboardingRoutes();
    }
  }, [step]);

  const validateCredentials = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Please create a password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinueToPathway = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCredentials()) {
      setErrors({});
      setStep('pathway');
    }
  };

  const handlePathwaySelectAndSubmit = async (pathway: 'female' | 'male') => {
    // 1. Immediately transition UI to the botanical loader without waiting for network
    setIsTransitioning(true);
    setTransitionPathway(pathway);
    setLoadingPathway(pathway);
    setLoading(true);
    setErrors({});

    const derivedGender: UserGender = pathway === 'female' ? 'female' : 'male';

    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        consent: true,
        pathway,
        gender: derivedGender,
      });

      if (!res.success) {
        setErrors({ general: res.error || 'Registration failed. Please try again.' });
        setIsTransitioning(false);
        setLoading(false);
        setLoadingPathway(null);
        return;
      }

      if (res.emailConfirmationRequired) {
        setIsTransitioning(false);
        setIsSuccess(true);
        setEmailConfirmReq(true);
      } else {
        const targetOnboarding = getPathwayOnboardingRoute({
          pathway,
          gender: derivedGender,
        });
        navigate(targetOnboarding, { replace: true });
      }
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Registration could not be completed. Please try again.',
      });
      setIsTransitioning(false);
      setLoading(false);
      setLoadingPathway(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;

    setGoogleLoading(true);
    setErrors({});

    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrors({ general: res.error || 'Unable to connect to Google. Please try again.' });
        setGoogleLoading(false);
        return;
      }
      navigate(ROUTES.ONBOARDING, { replace: true });
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Google registration could not be completed. Please try again.',
      });
      setGoogleLoading(false);
    }
  };

  // Immediate Botanical Loading Screen on Pathway Click (Replaces selection screen instantly)
  if (isTransitioning) {
    return (
      <BioPulseLoadingScreen
        message={
          transitionPathway === 'male'
            ? 'Preparing your Men’s Health pathway...'
            : 'Preparing your Women’s Health pathway...'
        }
        fullScreen={true}
      />
    );
  }

  // If user completed Step 1 and is on Step 2: Dedicated Pathway Selection Screen
  if (!isSuccess && step === 'pathway') {
    return (
      <PathwaySelectionScreen
        onSelectPathway={handlePathwaySelectAndSubmit}
        loading={loading}
        loadingPathway={loadingPathway}
        error={errors.general}
        onBack={() => setStep('credentials')}
      />
    );
  }

  // If email confirmation is required
  if (isSuccess && emailConfirmReq) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#EAF7F9] text-[#162A45] flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-[#008CA5] flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F254B]">Verify your email</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We sent a verification link to <span className="font-semibold text-[#008CA5]">{email}</span>. Please click the link to activate your BioPulse AI account and begin your assessment.
          </p>
          <Link to={ROUTES.LOGIN}>
            <button
              type="button"
              className="mt-4 w-full py-3 rounded-full font-bold text-white bg-[#008CA5] hover:bg-[#007A90] transition-colors"
            >
              Return to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFF5F7] via-[#FFFFFF] to-[#EAF7F9] text-[#162A45] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#008CA5] selection:text-white">
      {/* ── 1. Top Auth Navigation Header ── */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between relative z-20">
        {/* Brand Logo uniform with Home Page */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 group transition-transform hover:scale-[1.01]"
          aria-label="BioPulse AI Home"
        >
          <Logo size="md" theme="light" />
        </Link>

        {/* Auth Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-medium text-slate-500 hidden sm:inline">
            Already have an account?
          </span>
          <Link to={ROUTES.LOGIN}>
            <button
              type="button"
              className="px-4 sm:px-5 py-1.5 rounded-full border border-[#008CA5]/40 text-[#008CA5] hover:bg-cyan-50/70 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Login
            </button>
          </Link>
        </div>
      </header>

      {/* ── 2. Main Register Content (2-Column Grid) ── */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex-1 flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full">
          {/* ══════════════════════════════════════════════
              LEFT COLUMN: VALUE PROPOSITIONS & BOTANICAL ACCENTS
             ══════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-start justify-center space-y-6 text-left relative pl-2">
            {/* Subtle botanical leaves behind text */}
            <div className="absolute -top-10 -right-8 opacity-45 pointer-events-none -z-10">
              <SmallBotanicalSprig variant="pink" className="w-36 h-auto" />
            </div>
            <div className="absolute bottom-6 -left-12 opacity-35 pointer-events-none -z-10">
              <SmallBotanicalSprig variant="teal" flip className="w-40 h-auto" />
            </div>

            {/* Eyebrow */}
            <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#008CA5] uppercase select-none">
              CREATE YOUR ACCOUNT
            </p>

            {/* Display Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F254B] font-display leading-[1.12]">
              Start Your
              <br />
              Health Journey
              <br />
              <span className="text-[#008CA5]">Today</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-md">
              Join BioPulse AI and take a step towards better reproductive and hormonal health.
            </p>

            {/* 4 Feature Items with Round Badges matching reference */}
            <div className="space-y-4 pt-2">
              {/* Feature 1 */}
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] flex items-center justify-center text-[#008CA5] shrink-0 shadow-2xs">
                  <ActivityHeart className="w-4 h-4 text-[#008CA5]" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-[#0F254B]">
                  Personalized insights
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] flex items-center justify-center text-[#008CA5] shrink-0 shadow-2xs">
                  <Users01 className="w-4 h-4 text-[#008CA5]" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-[#0F254B]">
                  AI-powered screening
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] flex items-center justify-center text-[#008CA5] shrink-0 shadow-2xs">
                  <LineChartUp01 className="w-4 h-4 text-[#008CA5]" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-[#0F254B]">
                  Track progress over time
                </span>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] flex items-center justify-center text-[#008CA5] shrink-0 shadow-2xs">
                  <HeartHand className="w-4 h-4 text-[#008CA5]" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-[#0F254B]">
                  Support for a healthier you
                </span>
              </div>
            </div>

            {/* Cursive flourish: Same Care Different Journeys */}
            <div className="pt-4 -rotate-6 select-none">
              <span
                className="text-2xl sm:text-3xl font-bold text-[#008CA5] block leading-tight"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                Same
                <br />
                Care
                <br />
                Different
                <br />
                Journeys
              </span>
              <div className="w-20 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mt-1 opacity-80" />
            </div>

            {/* Bottom note with carousel indicator */}
            <div className="pt-2 space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Informed Today • Healthier Tomorrow
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1.5 rounded-full bg-[#008CA5]" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              RIGHT COLUMN: THE REGISTER FORM CARD (STEP 1)
             ══════════════════════════════════════════════ */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-[460px] bg-white rounded-[32px] sm:rounded-[36px] border border-slate-200/80 shadow-2xl shadow-cyan-950/5 p-7 sm:p-10 text-left space-y-6 relative"
            >
              {/* Card Header */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F254B] font-display tracking-tight">
                  Create Your <span className="text-[#008CA5]">Account</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Join BioPulse AI in just a few steps.
                </p>
              </div>

              {/* General Error Notice */}
              <AnimatePresence>
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed font-medium"
                  >
                    {errors.general}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Controls */}
              <form onSubmit={handleContinueToPathway} noValidate className="space-y-4">
                {/* Full Name Input */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <User01 className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" aria-hidden="true" />
                    <input
                      type="text"
                      id="register-fullname"
                      autoComplete="name"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      className={`
                        w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium
                        border bg-white text-[#0F254B] placeholder:text-slate-400
                        transition-all duration-200 outline-none
                        ${errors.fullName ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-[#008CA5] focus:ring-2 focus:ring-cyan-100'}
                      `}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[11px] font-semibold text-rose-600 pl-2">{errors.fullName}</p>
                  )}
                </div>

                {/* Email Address Input */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <Mail01 className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" aria-hidden="true" />
                    <input
                      type="email"
                      id="register-email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`
                        w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium
                        border bg-white text-[#0F254B] placeholder:text-slate-400
                        transition-all duration-200 outline-none
                        ${errors.email ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-[#008CA5] focus:ring-2 focus:ring-cyan-100'}
                      `}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] font-semibold text-rose-600 pl-2">{errors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <Lock01 className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register-password"
                      autoComplete="new-password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      className={`
                        w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm font-medium
                        border bg-white text-[#0F254B] placeholder:text-slate-400
                        transition-all duration-200 outline-none
                        ${errors.password ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-[#008CA5] focus:ring-2 focus:ring-cyan-100'}
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] font-semibold text-rose-600 pl-2">{errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 rounded-full font-bold text-white bg-[#008CA5] hover:bg-[#007A90] shadow-md shadow-cyan-900/15 flex items-center justify-center gap-2 text-sm sm:text-base transition-all cursor-pointer"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </motion.button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or sign up with
                </span>
              </div>

              {/* Social Login Options */}
              <div>
                {/* Google Sign-in */}
                <GoogleAuthButton
                  onClick={handleGoogleSignIn}
                  loading={googleLoading}
                  disabled={loading}
                  text="Continue with Google"
                />
              </div>

              {/* Terms & Privacy */}
              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                By creating an account, you agree to our{' '}
                <Link to={ROUTES.TRUST_PRIVACY} className="underline hover:text-slate-600">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to={ROUTES.TRUST_PRIVACY} className="underline hover:text-slate-600">
                  Privacy Policy
                </Link>
                .
              </p>

              {/* Informational Notice Box at the bottom of the card */}
              <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD]/80 flex items-center gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-cyan-100/70 text-[#008CA5] flex items-center justify-center shrink-0">
                  <InfoCircle className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium text-slate-600 leading-snug">
                  Date of birth and basic details will be collected during onboarding.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── 3. Bottom Inspirational Slogan ── */}
      <footer className="w-full py-4 text-center select-none relative z-10">
        <div className="inline-flex flex-col items-center">
          <span
            className="text-xs sm:text-sm font-semibold text-slate-500"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            &ldquo;A healthier tomorrow starts with you.&rdquo;
          </span>
          <div className="w-12 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mt-1 opacity-70" />
        </div>
      </footer>
    </div>
  );
};

export default Register;
