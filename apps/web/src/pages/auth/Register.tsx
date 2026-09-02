import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, ArrowRight, Loader2, Sparkles, CheckCircle2, ShieldCheck, Calendar } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthCard } from '../../components/auth/AuthCard';
import { AuthField } from '../../components/auth/AuthField';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  consent?: string;
  general?: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailConfirmReq, setEmailConfirmReq] = useState(false);

  const validateForm = (): boolean => {
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

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!consent) {
      nextErrors.consent = 'Please acknowledge that OVASense provides health guidance and does not replace medical advice.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        dateOfBirth: dateOfBirth || undefined,
        consent,
      });

      if (!res.success) {
        setErrors({ general: res.error || 'Registration failed. Please try again.' });
        return;
      }

      setIsSuccess(true);
      if (res.emailConfirmationRequired) {
        setEmailConfirmReq(true);
      }
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Registration could not be completed. Please try again.',
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
      navigate(ROUTES.ONBOARDING, { replace: true });
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Google registration could not be completed. Please try again.',
      });
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      headlineLine1="A new standard for"
      headlineLine2="women's hormonal health."
      supportingCopy="Create your private, clinically grounded health record. Track cycles, log symptoms, and understand biological trends."
      identityTag="Personal Health Intelligence"
    >
      <AuthCard
        heading={!isSuccess ? 'Create your account' : undefined}
        subheading={!isSuccess ? 'Start your OVASense journey.' : undefined}
        headerAccessory={
          !isSuccess ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE4F7]/10 border border-[#8E3EAF]/30 text-xs text-[#D8B4FE]">
              <Sparkles className="w-3.5 h-3.5 text-[#E87084]" />
              <span>Personalized Health Pattern Intelligence</span>
            </div>
          ) : undefined
        }
      >
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.form
              key="register-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4"
            >
              {/* General Error Banner */}
              {errors.general && (
                <div className="p-3 rounded-2xl bg-[#E87084]/15 border border-[#E87084]/40 text-xs text-[#F48498]">
                  {errors.general}
                </div>
              )}

              {/* Full Name */}
              <AuthField
                label="Full Name"
                id="register-fullname"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                required
                value={fullName}
                errorText={errors.fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                leftAccessory={<User className="w-4 h-4" />}
              />

              {/* Email Address */}
              <AuthField
                label="Email Address"
                id="register-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@domain.com"
                required
                value={email}
                errorText={errors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                leftAccessory={<Mail className="w-4 h-4" />}
              />

              {/* Password with Strength Indicator */}
              <PasswordInput
                label="Password"
                id="register-password"
                autoComplete="new-password"
                placeholder="Create a strong password (8+ chars)"
                required
                showStrength
                value={password}
                errorText={errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />

              {/* Confirm Password */}
              <PasswordInput
                label="Confirm Password"
                id="register-confirm-password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                required
                value={confirmPassword}
                errorText={errors.confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
              />

              {/* Optional Date of Birth */}
              <AuthField
                label="Date of birth"
                id="register-dob"
                type="date"
                optional
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                leftAccessory={<Calendar className="w-4 h-4" />}
                helperText="Optional. Medical information is never mandatory during account creation."
              />

              {/* Clinical Consent & Disclaimer Checkbox */}
              <div className="pt-1">
                <div
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    errors.consent
                      ? 'bg-[#E87084]/15 border-[#E87084]'
                      : 'bg-[#12071F]/80 border-[#8E3EAF]/30'
                  }`}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#B4A6C7] select-none">
                    <input
                      type="checkbox"
                      id="register-consent"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (errors.consent) setErrors((prev) => ({ ...prev, consent: undefined }));
                      }}
                      className="mt-0.5 w-4 h-4 rounded bg-[#140924] border border-[#8E3EAF]/50 text-[#8E3EAF] focus:ring-2 focus:ring-[#8E3EAF]/30 cursor-pointer accent-[#8E3EAF] shrink-0"
                    />
                    <span className="leading-relaxed">
                      I understand that OVASense provides AI-assisted health information and monitoring and does not replace professional medical care.
                    </span>
                  </label>
                </div>
                {errors.consent && (
                  <p className="mt-1 text-xs text-[#F48498] font-medium pl-1">
                    {errors.consent}
                  </p>
                )}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
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
                  text="Sign up with Google"
                  loadingText="Connecting to Google..."
                />
              </div>

              {/* Bottom Link: Sign in */}
              <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-[#B4A6C7]">
                Already have an account?{' '}
                <Link
                  to={ROUTES.LOGIN}
                  className="text-[#D8B4FE] hover:text-[#E87084] font-semibold transition-colors focus:outline-none focus:underline ml-1"
                >
                  Sign in
                </Link>
              </div>
            </motion.form>
          ) : (
            /* ── Premium Animated Registration Success State ── */
            <motion.div
              key="register-success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center py-6 sm:py-8 space-y-6"
            >
              {/* Animated Checkmark Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] flex items-center justify-center text-white shadow-xl shadow-purple-950/50"
              >
                <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-white stroke-[2.2]" />
              </motion.div>

              <div className="space-y-2.5">
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
                  {emailConfirmReq ? 'Confirm your email.' : 'Welcome to OVASense.'}
                </h2>
                <p className="text-sm sm:text-base text-[#EDE4F7] max-w-xs mx-auto leading-relaxed">
                  {emailConfirmReq
                    ? `We sent a confirmation link to ${email}. Please check your inbox and verify your email to log in.`
                    : "Your account is ready. Let's start building a clearer picture of your health."}
                </p>
              </div>

              {/* Informative Micro Badges */}
              <div className="p-4 rounded-2xl bg-[#12071F]/80 border border-[#8E3EAF]/30 text-left space-y-2 text-xs text-[#B4A6C7]">
                <div className="flex items-center gap-2 text-[#EDE4F7] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                  <span>Secure Profile Initialized</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your encrypted health record has been provisioned in Supabase with Row Level Security (RLS).
                </p>
              </div>

              {/* Continue CTA */}
              {emailConfirmReq ? (
                <motion.button
                  type="button"
                  whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="w-full min-h-[48px] px-6 py-3.5 rounded-2xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#A21CAF] border border-[#8E3EAF]/40 hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(ROUTES.ONBOARDING)}
                  className="w-full min-h-[48px] px-6 py-3.5 rounded-2xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#A21CAF] border border-[#8E3EAF]/40 hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Complete Health Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </AuthShell>
  );
};
