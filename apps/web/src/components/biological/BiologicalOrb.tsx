import React from 'react';

interface BiologicalOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showAnnotations?: boolean;
}

export const BiologicalOrb: React.FC<BiologicalOrbProps> = ({
  className = 'w-full h-full min-h-[340px]',
  size = 'md',
  showAnnotations = false,
}) => {
  const sizeClasses = {
    sm: 'w-48 h-48 sm:w-60 sm:h-60',
    md: 'w-64 h-64 sm:w-80 sm:h-80',
    lg: 'w-72 h-72 sm:w-96 sm:h-96',
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* ── Ambient Radial Atmosphere Glows ── */}
      <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-[#6E2D8B]/30 blur-[60px] pointer-events-none -z-10" />
      <div className="absolute w-52 sm:w-64 h-52 sm:h-64 rounded-full bg-[#E87084]/20 blur-[50px] pointer-events-none -z-10" />

      {/* ── Outer Orbital Guidance SVG Curves ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
        fill="none"
      >
        {/* Orbital Track 1 */}
        <ellipse
          cx="200"
          cy="200"
          rx="155"
          ry="70"
          transform="rotate(-25 200 200)"
          stroke="url(#orb-grad-1)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity="0.45"
        />

        {/* Orbital Track 2 */}
        <ellipse
          cx="200"
          cy="200"
          rx="140"
          ry="60"
          transform="rotate(35 200 200)"
          stroke="url(#orb-grad-2)"
          strokeWidth="1"
          opacity="0.35"
        />

        {/* Inflowing Data Stream Curve */}
        <path
          d="M 50 120 Q 200 60 340 180"
          stroke="url(#orb-stream)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          opacity="0.4"
        />

        <defs>
          <linearGradient id="orb-grad-1" x1="0" y1="0" x2="400" y2="400">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#E879F9" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
          <linearGradient id="orb-grad-2" x1="400" y1="0" x2="0" y2="400">
            <stop offset="0%" stopColor="#8E3EAF" />
            <stop offset="100%" stopColor="#FDA4AF" />
          </linearGradient>
          <linearGradient id="orb-stream" x1="0" y1="0" x2="400" y2="200">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Central Bilateral Biological Intelligence Core ── */}
      <div className={`relative ${sizeClasses} flex items-center justify-center`}>
        {/* Left Asymmetrical Lobe */}
        <div
          className="absolute -left-3 sm:-left-5 w-[65%] h-[85%] rounded-[48%_52%_55%_45%/50%_55%_45%_50%] bg-gradient-to-br from-[#7E22CE]/80 via-[#6E2D8B]/75 to-[#4A154B]/85 border border-white/20 shadow-2xl backdrop-blur-md transition-transform duration-700 hover:scale-105"
          style={{
            animation: 'bioPulse 8s ease-in-out infinite alternate',
          }}
        />

        {/* Right Asymmetrical Lobe */}
        <div
          className="absolute -right-3 sm:-right-5 w-[65%] h-[82%] rounded-[52%_48%_45%_55%/48%_50%_52%_48%] bg-gradient-to-bl from-[#A21CAF]/75 via-[#8E3EAF]/70 to-[#6E2D8B]/80 border border-white/15 shadow-xl backdrop-blur-md"
          style={{
            animation: 'bioPulse 7s ease-in-out infinite alternate-reverse',
          }}
        />

        {/* Luminous Inner Core Heartbeat */}
        <div
          className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#E87084]/90 via-[#FB7185]/80 to-[#E879F9]/75 shadow-[0_0_40px_rgba(251,113,133,0.5)] border border-white/30 flex items-center justify-center backdrop-blur-md"
          style={{
            animation: 'bioHeartbeat 4s ease-in-out infinite',
          }}
        >
          <div className="w-8 h-8 rounded-full bg-white/60 blur-xs" />
        </div>

        {/* ── Glowing Follicle Nodes ── */}
        {/* Follicle 1 */}
        <div className="absolute top-[18%] left-[22%] z-20 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FB7185] shadow-[0_0_12px_#FB7185] border border-white/60" />
        {/* Follicle 2 */}
        <div className="absolute bottom-[22%] left-[18%] z-20 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FDA4AF] shadow-[0_0_10px_#FDA4AF] border border-white/50" />
        {/* Follicle 3 */}
        <div className="absolute top-[24%] right-[20%] z-20 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#E879F9] shadow-[0_0_12px_#E879F9] border border-white/60" />
        {/* Follicle 4 */}
        <div className="absolute bottom-[26%] right-[22%] z-20 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#C084FC] shadow-[0_0_10px_#C084FC] border border-white/50" />
        {/* Follicle 5 (Active Signal) */}
        <div className="absolute top-[48%] right-[8%] z-20 w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
      </div>

      {/* ── Optional Scientific Annotations ── */}
      {showAnnotations && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Cycle Patterns (Top-Left) */}
          <div className="absolute top-2 left-2 sm:-left-4 text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C084FC] shadow-[0_0_8px_#C084FC]" />
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white">
                Cycle Patterns
              </span>
            </div>
            <div className="w-24 sm:w-28 h-[1px] bg-gradient-to-r from-[#C084FC]/80 to-transparent mt-1" />
            <span className="text-[10px] text-[#B4A6C7] font-sans block mt-0.5">
              Follicular & Luteal Rhythm
            </span>
          </div>

          {/* Symptoms (Top-Right) */}
          <div className="absolute top-1/4 right-0 sm:-right-4 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white">
                Symptoms
              </span>
              <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185]" />
            </div>
            <div className="w-24 sm:w-28 h-[1px] bg-gradient-to-l from-[#FB7185]/80 to-transparent mt-1 ml-auto" />
            <span className="text-[10px] text-[#B4A6C7] font-sans block mt-0.5">
              Multivariate Signal Logging
            </span>
          </div>

          {/* Medical Reports (Bottom-Left) */}
          <div className="absolute bottom-8 left-2 sm:-left-4 text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E879F9] shadow-[0_0_8px_#E879F9]" />
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white">
                Medical Reports
              </span>
            </div>
            <div className="w-24 sm:w-28 h-[1px] bg-gradient-to-r from-[#E879F9]/80 to-transparent mt-1" />
            <span className="text-[10px] text-[#B4A6C7] font-sans block mt-0.5">
              Verified Hormone OCR
            </span>
          </div>

          {/* Lifestyle (Bottom-Right) */}
          <div className="absolute bottom-6 right-2 sm:right-0 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white">
                Lifestyle
              </span>
              <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            </div>
            <div className="w-24 sm:w-28 h-[1px] bg-gradient-to-l from-[#34D399]/80 to-transparent mt-1 ml-auto" />
            <span className="text-[10px] text-[#B4A6C7] font-sans block mt-0.5">
              Diet & Movement Context
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
