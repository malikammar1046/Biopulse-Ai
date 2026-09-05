import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthCard } from '../../components/auth/AuthCard';
import { AuthField } from '../../components/auth/AuthField';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
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
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Check URL search or hash for OAuth callback errors (e.g. user cancelled Google OAuth)
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

      // In demo/mock mode without redirect, navigate to destination or pathway dashboard/onboarding
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
    <AuthShell
      headlineLine1="Understand your rhythm,"
      headlineLine2="every single day."
      supportingCopy="Log in to access your continuous health timeline, personalized cycle guidance, and secure clinical records."
      identityTag="Longitudinal Health Intelligence"
    >
      <AuthCard
        heading="Welcome back"
        subheading="Sign in to continue your OVASense journey."
        headerAccessory={
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE4F7]/10 border border-[#8E3EAF]/30 text-xs text-[#D8B4FE]">
            <Sparkles className="w-3.5 h-3.5 text-[#E87084]" />
            <span>Secure Patient & Longitudinal Portal</span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3 rounded-2xl bg-[#E87084]/15 border border-[#E87084]/40 text-xs text-[#F48498] leading-relaxed">
              {errors.general}
            </div>
          )}

          {/* Email Address */}
          <AuthField
            label="Email address"
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@domain.com"
            required
            disabled={loading || googleLoading}
            value={email}
            errorText={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            leftAccessory={<Mail className="w-4 h-4" />}
          />

          {/* Password with Show/Hide */}
          <PasswordInput
            label="Password"
            id="login-password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            disabled={loading || googleLoading}
            value={password}
            errorText={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />

          {/* Options: Remember me & Forgot password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#B4A6C7] hover:text-[#EDE4F7] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={loading || googleLoading}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md bg-[#140924] border border-[#8E3EAF]/40 text-[#8E3EAF] focus:ring-2 focus:ring-[#8E3EAF]/30 cursor-pointer accent-[#8E3EAF]"
              />
              <span>Remember me</span>
            </label>

            <Link
              to={ROUTES.CONTACT}
              className="text-xs font-semibold text-[#D8B4FE] hover:text-[#E87084] transition-colors focus:outline-none focus:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA Button */}
          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={loading || googleLoading}
              whileHover={!loading && !googleLoading ? { y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' } : undefined}
              whileTap={!loading && !googleLoading ? { scale: 0.98 } : undefined}
              className="w-full min-h-[48px] px-6 py-3 rounded-2xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#A21CAF] border border-[#8E3EAF]/40 hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>

          {/* Visual Divider: ──────── OR ──────── */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-[#8E3EAF]/25" />
            <span className="absolute bg-[#180A26] px-3 text-[11px] font-semibold text-[#B4A6C7] tracking-wider uppercase">
              OR
            </span>
          </div>

          {/* Google OAuth Button */}
          <div>
            <GoogleAuthButton
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading || googleLoading}
              text="Continue with Google"
              loadingText="Connecting to Google..."
            />
          </div>
        </form>

        {/* Bottom Link: Create an account */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-[#B4A6C7]">
          Don&apos;t have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="text-[#D8B4FE] hover:text-[#E87084] font-semibold transition-colors focus:outline-none focus:underline ml-1"
          >
            Create an account
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
};

