import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthCard } from '../../components/auth/AuthCard';
import { AuthField } from '../../components/auth/AuthField';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { authService } from '../../services/authService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [forgotSent, setForgotSent] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email format.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (response.success) {
        navigate(ROUTES.APP.DASHBOARD);
      } else {
        setErrors({ general: response.error || 'Authentication failed. Please try again.' });
      }
    } catch {
      setErrors({ general: 'A connection error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email address to receive a recovery link.' });
      return;
    }
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 4000);
  };

  return (
    <AuthShell
      headlineLine1="Understand your health."
      headlineLine2="One pattern at a time."
      supportingCopy="OVASense brings your health information, symptoms, reports and patterns together in one intelligent experience."
      identityTag="AI-assisted women's health intelligence"
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
            <div className="p-3 rounded-2xl bg-[#E87084]/15 border border-[#E87084]/40 text-xs text-[#F48498]">
              {errors.general}
            </div>
          )}

          {/* Forgot Password Confirmation Banner */}
          {forgotSent && (
            <div className="p-3 rounded-2xl bg-[#047857]/20 border border-[#A7F3D0]/30 text-xs text-[#A7F3D0] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0" />
              <span>Password reset instructions dispatched to your email.</span>
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
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md bg-[#140924] border border-[#8E3EAF]/40 text-[#8E3EAF] focus:ring-2 focus:ring-[#8E3EAF]/30 cursor-pointer accent-[#8E3EAF]"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-semibold text-[#D8B4FE] hover:text-[#E87084] transition-colors focus:outline-none focus:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Primary CTA Button */}
          <div className="pt-3">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
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
        </form>

        {/* Bottom Link: Create an account */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-[#B4A6C7]">
          Don't have an account?{' '}
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
