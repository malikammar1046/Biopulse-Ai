import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail01,
  Lock01,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw01,
  ShieldTick,
  Users01,
  ActivityHeart,
} from '@untitledui/icons';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { Logo } from '../../components/brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPathwayDashboardRoute, getPathwayOnboardingRoute } from '../../constants/routes';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, userProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Check URL search or hash for OAuth callback errors
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));

    const errorParam = params.get('error') || hashParams.get('error');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');

    if (errorParam || errorDesc) {
      if (
        errorParam === 'access_denied' ||
        errorDesc?.toLowerCase().includes('cancel') ||
        errorDesc?.toLowerCase().includes('denied')
      ) {
        setErrors({
          general: 'Google sign-in was cancelled. You can sign in using email & password or try Google again.',
        });
      } else {
        setErrors({
          general: 'Google sign-in could not be completed. Please try again or use your password.',
        });
      }
    }
  }, [location]);

  // Validate form client-side
  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Please enter your password.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      if (!res.success) {
        setErrors({ general: res.error || 'Invalid email or password. Please try again.' });
        return;
      }

      // Route to destination: if onboarding incomplete -> pathway onboarding, otherwise pathway dashboard
      const activeProfile = res.profile || userProfile;
      const destination = activeProfile.isOnboarded
        ? getPathwayDashboardRoute(activeProfile)
        : getPathwayOnboardingRoute(activeProfile);

      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const target =
        from &&
        from !== ROUTES.LOGIN &&
        from !== ROUTES.REGISTER &&
        !from.startsWith('/onboarding')
          ? from
          : destination;

      navigate(target, { replace: true });
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Invalid email or password. Please try again.',
      });
    } finally {
      setLoading(false);
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

      const destination = userProfile.isOnboarded
        ? getPathwayDashboardRoute(userProfile)
        : getPathwayOnboardingRoute(userProfile);

      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const target =
        from &&
        from !== ROUTES.LOGIN &&
        from !== ROUTES.REGISTER &&
        !from.startsWith('/onboarding')
          ? from
          : destination;

      navigate(target, { replace: true });
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Google sign-in could not be completed. Please try again.',
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#EAF7F9] text-[#162A45] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#008CA5] selection:text-white">
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
            Don&apos;t have an account?
          </span>
          <Link to={ROUTES.REGISTER}>
            <button
              type="button"
              className="px-4 sm:px-5 py-1.5 rounded-full border border-[#008CA5]/40 text-[#008CA5] hover:bg-cyan-50/70 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* ── 2. Main Login Content (2-Column Grid) ── */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex-1 flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full">
          {/* ══════════════════════════════════════════════
              LEFT COLUMN: BRAND VISUAL & COUPLE EXPERIENCE
             ══════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center space-y-6 text-center relative">
            {/* Cursive Tag at Top Left */}
            <div className="w-full flex justify-start pl-4">
              <div className="-rotate-6 select-none">
                <span
                  className="text-2xl sm:text-3xl font-bold text-[#008CA5] block leading-tight"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Small Steps
                  <br />
                  Healthier Tomorrows
                </span>
                <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mt-0.5 opacity-80" />
              </div>
            </div>

            {/* Couple Portrait Image with Floating Card Overlay */}
            <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[36px] overflow-hidden shadow-2xl shadow-cyan-900/15 border border-cyan-100 group">
              <img
                src="/assets/images/hero-couple.jpg"
                alt="BioPulse AI - Healthier Her & Stronger Him"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
              />

              {/* Frosted Floating Card at Bottom of Couple */}
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg shadow-cyan-950/10 text-left flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E0F7FA] border border-[#B2EBF2] flex items-center justify-center text-[#008CA5] shrink-0">
                    <ActivityHeart className="w-4 h-4 text-[#008CA5]" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#0F254B]">
                      Better Insights
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Brighter Tomorrows
                    </div>
                  </div>
                </div>

                {/* Carousel Dots */}
                <div className="flex items-center gap-1.5 pr-2">
                  <div className="w-5 h-1.5 rounded-full bg-[#008CA5]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>
              </div>
            </div>

            {/* 3 Trust Signals */}
            <div className="w-full max-w-[440px] grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-7 h-7 rounded-full bg-cyan-50 text-[#008CA5] flex items-center justify-center">
                  <ShieldTick className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                  Your data stays private
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-7 h-7 rounded-full bg-cyan-50 text-[#008CA5] flex items-center justify-center">
                  <Users01 className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                  Trusted by clinicians
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-7 h-7 rounded-full bg-cyan-50 text-[#008CA5] flex items-center justify-center">
                  <ActivityHeart className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                  Evidence-based &amp; AI
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              RIGHT COLUMN: THE LOGIN FORM CARD
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
                <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#008CA5] uppercase select-none">
                  WELCOME BACK
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F254B] font-display tracking-tight">
                  Login to <span className="text-[#008CA5]">BioPulse AI</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Continue your journey towards better reproductive and hormonal health.
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
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Email Address Input */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <Mail01 className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" aria-hidden="true" />
                    <input
                      type="email"
                      id="login-email"
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
                      id="login-password"
                      autoComplete="current-password"
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

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between pt-1 select-none">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#008CA5] focus:ring-[#008CA5] accent-[#008CA5] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setErrors({
                        general: 'Password recovery is enabled. Please enter your email above and contact support if you need immediate assistance.',
                      });
                    }}
                    className="text-xs font-semibold text-[#008CA5] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 rounded-full font-bold text-white bg-[#008CA5] hover:bg-[#007A90] shadow-md shadow-cyan-900/15 flex items-center justify-center gap-2 text-sm sm:text-base transition-all cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <RefreshCw01 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or continue with
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
              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
                By logging in, you agree to our{' '}
                <Link to={ROUTES.TRUST_PRIVACY} className="underline hover:text-slate-600">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to={ROUTES.TRUST_PRIVACY} className="underline hover:text-slate-600">
                  Privacy Policy
                </Link>
                .
              </p>
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
            &ldquo;Healthier individuals, Stronger tomorrows.&rdquo;
          </span>
          <div className="w-12 h-0.5 bg-gradient-to-r from-[#22D3EE] to-[#008CA5] rounded-full mt-1 opacity-70" />
        </div>
      </footer>
    </div>
  );
};

export default Login;
