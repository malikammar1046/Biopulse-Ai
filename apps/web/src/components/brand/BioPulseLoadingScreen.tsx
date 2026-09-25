import React from 'react';
import { motion } from 'framer-motion';
import { BioPulseHeartEmblem } from './Logo';

interface BioPulseLoadingScreenProps {
  /** Optional message displayed below the logo */
  message?: string;
  /** Whether the loading screen fills the entire viewport */
  fullScreen?: boolean;
}

export const BioPulseLoadingScreen: React.FC<BioPulseLoadingScreenProps> = ({
  message = 'Loading BioPulse AI...',
  fullScreen = true,
}) => {
  return (
    <div
      className={`w-full ${
        fullScreen ? 'min-h-screen' : 'min-h-[70vh]'
      } flex flex-col items-center justify-center bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] relative overflow-hidden select-none px-4`}
    >
      {/* Soft Ambient Radial Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-cyan-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-sky-100/35 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Central Logo Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center text-center space-y-5"
      >
        {/* Glowing Heart Emblem with Soft Pulse */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Breathing Glow Aura */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.75, 0.35],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-[#00C4DF]/30 via-[#0284C7]/25 to-[#0D9488]/30 blur-xl pointer-events-none"
          />

          {/* Heart Emblem */}
          <motion.div
            animate={{
              scale: [1, 1.04, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10 p-3.5 rounded-3xl bg-white/90 border border-slate-200/90 shadow-xl shadow-cyan-900/10 backdrop-blur-md flex items-center justify-center"
          >
            <BioPulseHeartEmblem size={52} />
          </motion.div>
        </div>

        {/* Brand Typography */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#0B1E38] leading-tight">
            BioPulse <span className="text-[#0284C7]">AI</span>
          </h1>
          <span className="font-mono uppercase font-bold tracking-[0.2em] text-[9.5px] sm:text-[10px] text-[#0891B2] mt-1">
            SCIENCE TODAY. HEALTHIER TOMORROWS.
          </span>
        </div>

        {/* Clinical Rhythm Loading Indicator */}
        <div className="flex flex-col items-center gap-2 pt-2">
          {/* Pulse Bar */}
          <div className="w-36 h-1 bg-slate-200/70 rounded-full overflow-hidden relative">
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-1/2 h-full bg-gradient-to-r from-[#00C4DF] via-[#0284C7] to-[#0D9488] rounded-full"
            />
          </div>

          {/* Status Message */}
          <div className="inline-flex items-center gap-2 text-xs font-sans text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] animate-pulse" />
            <span>{message}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BioPulseLoadingScreen;
