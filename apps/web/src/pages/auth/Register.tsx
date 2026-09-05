import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Heart,
  Activity,
  Compass,
  Check,
} from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthCard } from '../../components/auth/AuthCard';
import { AuthField } from '../../components/auth/AuthField';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPathwayOnboardingRoute } from '../../constants/routes';
import type { HealthPathway, UserGender } from '../../types/onboarding';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  consent?: string;
  pathway?: string;
  general?: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  // Step state: 1 = credentials, 2 = pathway selection
  const [step, setStep] = useState<'credentials' | 'pathway'>('credentials');

  // Step 1: Account credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [consent, setConsent] = useState(false);

  // Step 2: Pathway selection
  const [selectedPathway, setSelectedPathway] = useState<HealthPathway>('female');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailConfirmReq, setEmailConfirmReq] = useState(false);

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

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!consent) {
      nextErrors.consent = 'Please acknowledge that VITASense provides health guidance and does not replace medical advice.';
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});

    if (!selectedPathway) {
      setErrors({ pathway: 'Please select a health pathway to personalize your experience.' });
      return;
    }

    const derivedGender: UserGender =
      selectedPathway === 'female' ? 'female' : selectedPathway === 'male' ? 'male' : 'other';

    setLoading(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        dateOfBirth: dateOfBirth || undefined,
        consent,
        pathway: selectedPathway,
        gender: derivedGender,
      });

      if (!res.success) {
        setErrors({ general: res.error || 'Registration failed. Please try again.' });
        return;
      }

      if (res.emailConfirmationRequired) {
        setIsSuccess(true);
        setEmailConfirmReq(true);
      } else {
        // Direct seamless navigation to the selected pathway's onboarding journey
        const targetOnboarding = getPathwayOnboardingRoute({
          pathway: selectedPathway,
          gender: derivedGender,
        });
        navigate(targetOnboarding, { replace: true });
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
      headlineLine1="A unified standard for"
      headlineLine2="specialized health intelligence."
      supportingCopy="Create your private, clinically grounded health record across specialized women's, men's, or baseline health pathways."
      identityTag="Personal Health Intelligence"
    >
      <AuthCard
        heading={
          !isSuccess
            ? step === 'credentials'
              ? 'Create your account'
              : 'Choose your health pathway'
            : undefined
        }
        subheading={
          !isSuccess
            ? step === 'credentials'
              ? 'Start your VITASense journey.'
              : 'Select the companion and screening focus tailored to you.'
            : undefined
        }
        headerAccessory={
          !isSuccess ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE4F7]/10 border border-[#8E3EAF]/30 text-xs text-[#D8B4FE]">
              <Sparkles className="w-3.5 h-3.5 text-[#E87084]" />
              <span>Step {step === 'credentials' ? '1 of 2' : '2 of 2'}</span>
            </div>
          ) : undefined
        }
      >
        <AnimatePresence mode="wait">
          {!isSuccess && step === 'credentials' && (
            /* ── Step 1: Basic Account Information ── */
            <motion.form
              key="step-credentials"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleContinueToPathway}
              noValidate
              className="space-y-4 text-left"
            >
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
                leftAccessory={<User className="w-4 h-4 text-[#B4A6C7]" />}
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
                leftAccessory={<Mail className="w-4 h-4 text-[#B4A6C7]" />}
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
                leftAccessory={<Calendar className="w-4 h-4 text-[#B4A6C7]" />}
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
                      I understand that VITASense provides AI-assisted health screening and educational insights and does not replace professional medical care.
                    </span>
                  </label>
                </div>
                {errors.consent && (
                  <p className="mt-1 text-xs text-[#F48498] font-medium pl-1">
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* Continue to Step 2 Button */}
              <div className="pt-2">
                <motion.button
                  type="submit"
                  whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full min-h-[48px] px-6 py-3 rounded-2xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#A21CAF] border border-[#8E3EAF]/40 hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Pathway Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Visual Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-[#8E3EAF]/25" />
                <span className="absolute bg-[#180A26] px-3 text-[11px] font-semibold text-[#B4A6C7] tracking-wider uppercase">
                  OR
                </span>
              </div>

              {/* Google OAuth */}
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
          )}

          {!isSuccess && step === 'pathway' && (
            /* ── Step 2: Pathway Selection ── */
            <motion.div
              key="step-pathway"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 text-left"
            >
              {/* Informative Guidance */}
              <div className="p-3.5 rounded-2xl bg-[#12071F]/80 border border-[#8E3EAF]/30 space-y-1">
                <p className="text-xs text-[#EDE4F7] font-medium leading-relaxed">
                  We’ll use your selection to personalize your onboarding and health experience. You can explore information and screening tools relevant to your pathway.
                </p>
                <p className="text-[11px] text-[#A797BD]">
                  This determines your specialized dashboard and educational focus. It is not a medical diagnosis.
                </p>
              </div>

              {errors.general && (
                <div className="p-3 rounded-2xl bg-[#E87084]/15 border border-[#E87084]/40 text-xs text-[#F48498]">
                  {errors.general}
                </div>
              )}

              {/* Pathway Selection Cards */}
              <div className="space-y-3 pt-1">
                {/* 1. Women's Health (OvaSense AI) */}
                <button
                  type="button"
                  onClick={() => setSelectedPathway('female')}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    selectedPathway === 'female'
                      ? 'bg-gradient-to-r from-[#6E2D8B]/40 to-[#8E3EAF]/30 border-[#FB7185] ring-1 ring-[#FB7185]/50 shadow-md shadow-purple-950/40'
                      : 'bg-[#180A26]/80 border-white/10 hover:border-[#8E3EAF]/50 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedPathway === 'female'
                          ? 'bg-gradient-to-br from-[#FB7185] to-[#E87084] text-white shadow-md'
                          : 'bg-white/10 text-[#CDBDD8]'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#FB7185] font-bold">
                          Women's Health
                        </span>
                        <span className="text-sm font-bold text-white font-display">
                          OvaSense AI
                        </span>
                      </div>
                      <p className="text-xs text-[#CDBDD8] mt-1 leading-relaxed">
                        Understand and monitor women's reproductive and metabolic health, PCOS screening, and cycle patterns.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedPathway === 'female'
                        ? 'border-[#FB7185] bg-[#FB7185] text-white'
                        : 'border-white/30 bg-transparent'
                    }`}
                  >
                    {selectedPathway === 'female' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                {/* 2. Men's Health (AndroSense AI) */}
                <button
                  type="button"
                  onClick={() => setSelectedPathway('male')}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    selectedPathway === 'male'
                      ? 'bg-gradient-to-r from-[#1E293B]/60 to-[#334155]/40 border-[#38BDF8] ring-1 ring-[#38BDF8]/50 shadow-md shadow-sky-950/40'
                      : 'bg-[#180A26]/80 border-white/10 hover:border-[#38BDF8]/50 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedPathway === 'male'
                          ? 'bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white shadow-md'
                          : 'bg-white/10 text-[#CDBDD8]'
                      }`}
                    >
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#38BDF8] font-bold">
                          Men's Health
                        </span>
                        <span className="text-sm font-bold text-white font-display">
                          AndroSense AI
                        </span>
                      </div>
                      <p className="text-xs text-[#CDBDD8] mt-1 leading-relaxed">
                        Understand and monitor men's reproductive and hormone-related health, vitality, and hypogonadism screening.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedPathway === 'male'
                        ? 'border-[#38BDF8] bg-[#38BDF8] text-white'
                        : 'border-white/30 bg-transparent'
                    }`}
                  >
                    {selectedPathway === 'male' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                {/* 3. General Health (VITASense) */}
                <button
                  type="button"
                  onClick={() => setSelectedPathway('general')}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    selectedPathway === 'general'
                      ? 'bg-gradient-to-r from-[#14532D]/40 to-[#166534]/30 border-[#34D399] ring-1 ring-[#34D399]/50 shadow-md shadow-emerald-950/40'
                      : 'bg-[#180A26]/80 border-white/10 hover:border-[#34D399]/50 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedPathway === 'general'
                          ? 'bg-gradient-to-br from-[#34D399] to-[#059669] text-white shadow-md'
                          : 'bg-white/10 text-[#CDBDD8]'
                      }`}
                    >
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#34D399] font-bold">
                          General Health
                        </span>
                        <span className="text-sm font-bold text-white font-display">
                          VITASense
                        </span>
                      </div>
                      <p className="text-xs text-[#CDBDD8] mt-1 leading-relaxed">
                        Start with a broader baseline health experience, lifestyle tracking, nutrition, and wellness monitoring.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedPathway === 'general'
                        ? 'border-[#34D399] bg-[#34D399] text-white'
                        : 'border-white/30 bg-transparent'
                    }`}
                  >
                    {selectedPathway === 'general' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  disabled={loading}
                  className="px-4 py-3 rounded-2xl border border-white/15 text-xs text-[#CDBDD8] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <motion.button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit()}
                  whileHover={!loading ? { y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' } : undefined}
                  whileTap={!loading ? { scale: 0.98 } : undefined}
                  className="flex-1 min-h-[48px] px-6 py-3 rounded-2xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#A21CAF] border border-[#8E3EAF]/40 hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Start Onboarding</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {isSuccess && (
            /* ── Registration Success State (e.g. Email Confirmation Required) ── */
            <motion.div
              key="register-success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center py-6 sm:py-8 space-y-6"
            >
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
                  {emailConfirmReq ? 'Confirm your email.' : 'Welcome to VITASense.'}
                </h2>
                <p className="text-sm sm:text-base text-[#EDE4F7] max-w-xs mx-auto leading-relaxed">
                  {emailConfirmReq
                    ? `We sent a confirmation link to ${email}. Please check your inbox and verify your email to log in.`
                    : "Your account is ready. Let's start building a clearer picture of your health."}
                </p>
              </div>

              {/* Pathway confirmation tag */}
              <div className="p-4 rounded-2xl bg-[#12071F]/80 border border-[#8E3EAF]/30 text-left space-y-2 text-xs text-[#B4A6C7]">
                <div className="flex items-center gap-2 text-[#EDE4F7] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                  <span>
                    {selectedPathway === 'female'
                      ? 'OvaSense AI Pathway Assigned'
                      : selectedPathway === 'male'
                      ? 'AndroSense AI Pathway Assigned'
                      : 'VITASense Baseline Pathway Assigned'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your encrypted health record has been initialized with your personalized companion.
                </p>
              </div>

              {/* Continue CTA */}
              <motion.button
                type="button"
                whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  navigate(
                    emailConfirmReq
                      ? ROUTES.LOGIN
                      : getPathwayOnboardingRoute({ pathway: selectedPathway })
                  )
                }
                className="w-full min-h-[48px] px-6 py-3.5 rounded-2xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#A21CAF] border border-[#8E3EAF]/40 hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{emailConfirmReq ? 'Proceed to Log In' : 'Begin Personalized Onboarding'}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </AuthShell>
  );
};

export default Register;
