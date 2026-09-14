import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export interface AppleAuthButtonProps {
  onUnavailableNotice?: () => void;
}

export const AppleAuthButton: React.FC<AppleAuthButtonProps> = ({ onUnavailableNotice }) => {
  const [showNotice, setShowNotice] = useState(false);

  const handleClick = () => {
    if (onUnavailableNotice) {
      onUnavailableNotice();
    } else {
      setShowNotice(true);
      setTimeout(() => setShowNotice(false), 4000);
    }
  };

  return (
    <div className="w-full space-y-2">
      <motion.button
        type="button"
        id="apple-signin-button"
        onClick={handleClick}
        whileHover={{ y: -1, scale: 1.005 }}
        whileTap={{ scale: 0.985 }}
        aria-label="Continue with Apple"
        className="
          w-full min-h-[48px] px-6 py-3 rounded-2xl
          font-sans font-semibold text-sm
          text-slate-800 hover:text-black
          bg-white hover:bg-slate-50
          border border-slate-200 hover:border-slate-300
          shadow-xs hover:shadow-sm
          transition-all duration-200
          flex items-center justify-center gap-3
          cursor-pointer relative overflow-hidden
        "
      >
        {/* Official Apple Logo SVG */}
        <svg
          className="w-4 h-4 shrink-0 fill-current"
          viewBox="0 0 170 170"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.7-14.02-6.53-10.02-11.64-21.46-15.34-34.33-3.7-12.87-5.55-24.81-5.55-35.82 0-15.24 3.7-27.46 11.1-36.65 7.4-9.19 16.75-13.88 28.05-14.07 4.57 0 9.79 1.14 15.66 3.42 5.87 2.28 9.78 3.48 11.73 3.59 1.52-.11 5.71-1.36 12.56-3.75 6.85-2.39 12.34-3.48 16.48-3.26 12.83.65 22.84 5.38 30.04 14.19-11.31 6.85-16.86 16.53-16.64 29.04.22 9.79 4.02 17.89 11.41 24.31 7.39 6.42 16.09 10.12 26.1 11.1-2.17 6.74-4.89 13.59-8.15 20.55zM119.22 31.84c0-7.39 2.66-14.35 7.99-20.88C132.54 4.43 139.17.65 147.1 0c.22 1.3.33 2.39.33 3.26 0 7.18-2.83 14.25-8.48 21.21-5.65 6.96-12.39 10.77-20.23 11.42.33-1.42.5-2.77.5-4.05z" />
        </svg>
        <span>Continue with Apple</span>
      </motion.button>

      <AnimatePresence>
        {showNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2"
          >
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Apple sign-in is coming soon. Please continue with Google or your email.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
