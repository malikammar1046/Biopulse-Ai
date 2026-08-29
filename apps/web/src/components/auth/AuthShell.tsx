import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { AuthVisual } from './AuthVisual';

export interface AuthShellProps {
  headlineLine1: string;
  headlineLine2: string;
  supportingCopy: string;
  identityTag?: string;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  headlineLine1,
  headlineLine2,
  supportingCopy,
  identityTag,
  children,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen w-full bg-[#0D0518] text-[#F8F5FA] relative flex flex-col justify-center overflow-x-hidden pt-24 sm:pt-28 pb-16 sm:pb-20"
    >
      {/* ── Global Background Ambient Glow Layer (Lightweight CSS) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 10% 20%, rgba(110, 45, 139, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 80%, rgba(232, 112, 132, 0.15) 0%, transparent 45%)
          `,
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ── Desktop Brand Experience (LEFT ~50%) ── */}
          <div className="hidden lg:block lg:col-span-6 rounded-[28px] overflow-hidden border border-[#8E3EAF]/20 shadow-2xl shadow-purple-950/60 bg-[#0C0515] h-full min-h-[620px]">
            <AuthVisual
              headlineLine1={headlineLine1}
              headlineLine2={headlineLine2}
              supportingCopy={supportingCopy}
              identityTag={identityTag}
            />
          </div>

          {/* ── Mobile Brand Header (< lg) ── */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-3 pt-2 pb-2">
            <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
              </div>
              <span className="text-2xl font-bold font-display text-white tracking-tight">
                PMOSense
              </span>
            </Link>

            <div className="space-y-1 max-w-sm px-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                <span>{headlineLine1} </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EDE4F7] to-[#E87084]">
                  {headlineLine2}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#B4A6C7] line-clamp-2">
                {supportingCopy}
              </p>
            </div>
          </div>

          {/* ── Authentication Card Form (RIGHT ~50% on desktop) ── */}
          <div className="w-full lg:col-span-6 flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
