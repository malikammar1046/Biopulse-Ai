import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface GoogleAuthButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  text?: string;
  loadingText?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  text = 'Continue with Google',
  loadingText = 'Connecting to Google...',
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type="button"
      id="google-signin-button"
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { y: -1, scale: 1.005 } : undefined}
      whileTap={!isDisabled ? { scale: 0.985 } : undefined}
      aria-label={loading ? loadingText : text}
      className={`
        w-full min-h-[48px] px-6 py-3 rounded-2xl
        font-sans font-semibold text-sm
        text-slate-700 hover:text-slate-900
        bg-white hover:bg-slate-50
        border border-slate-200 hover:border-slate-300
        shadow-xs hover:shadow-sm
        transition-all duration-200
        flex items-center justify-center gap-3
        cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
        relative overflow-hidden
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[#D8B4FE]" />
          <span className="text-[#D8B4FE]">{loadingText}</span>
        </>
      ) : (
        <>
          {/* Official Google 'G' Logo SVG */}
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>{text}</span>
        </>
      )}
    </motion.button>
  );
};
