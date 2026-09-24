import React from 'react';

/**
 * High-fidelity vector botanical illustrations matching the BioPulse AI header concept.
 * Left: Cyan / Teal watercolor foliage emerging from bottom-left corner.
 * Right: Pink / Rose and Cyan watercolor branch arching from top-right corner.
 */

// ── 1. Header Left Botanical (Cyan & Teal Watercolor Foliage) ────────────────
export const HeaderLeftBotanical: React.FC<{ className?: string }> = ({
  className = 'w-28 sm:w-36 md:w-44 h-auto',
}) => (
  <svg
    viewBox="0 0 160 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      {/* Central Stem Gradient */}
      <linearGradient id="hl-stem-grad" x1="6" y1="80" x2="46" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0891B2" stopOpacity="0.9" />
        <stop offset="60%" stopColor="#0284C7" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.6" />
      </linearGradient>

      {/* Leaf 1: Bottom Left Leaf */}
      <linearGradient id="hl-leaf-1" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0D9488" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0.8" />
      </linearGradient>

      {/* Leaf 2: Mid-Left Upward Leaf */}
      <linearGradient id="hl-leaf-2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0284C7" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#0891B2" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.85" />
      </linearGradient>

      {/* Leaf 3: Topmost Upright Leaf */}
      <linearGradient id="hl-leaf-3" x1="0%" y1="100%" x2="50%" y2="0%">
        <stop offset="0%" stopColor="#0284C7" stopOpacity="0.95" />
        <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.85" />
      </linearGradient>

      {/* Leaf 4: Upper-Right Leaf Pointing to Logo */}
      <linearGradient id="hl-leaf-4" x1="0%" y1="80%" x2="100%" y2="20%">
        <stop offset="0%" stopColor="#0891B2" stopOpacity="0.95" />
        <stop offset="60%" stopColor="#22D3EE" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#CFFAFE" stopOpacity="0.85" />
      </linearGradient>

      {/* Leaf 5: Mid-Right Leaf */}
      <linearGradient id="hl-leaf-5" x1="10%" y1="90%" x2="90%" y2="10%">
        <stop offset="0%" stopColor="#0369A1" stopOpacity="0.95" />
        <stop offset="55%" stopColor="#06B6D4" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0.8" />
      </linearGradient>

      {/* Vein Highlights */}
      <linearGradient id="hl-vein" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    {/* Graceful Curving Main Stem */}
    <path
      d="M6 80 C14 62 26 40 46 16"
      stroke="url(#hl-stem-grad)"
      strokeWidth="2.6"
      strokeLinecap="round"
    />

    {/* Secondary Branchlets */}
    <path d="M12 72 C8 66 4 60 4 54" stroke="url(#hl-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18 56 C12 46 8 36 12 24" stroke="url(#hl-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M35 34 C48 30 60 28 72 30" stroke="url(#hl-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M26 54 C38 52 52 54 64 57" stroke="url(#hl-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />

    {/* Leaf 1: Lower Left Leaf */}
    <g>
      <path
        d="M12 72 C4 68 -2 58 4 48 C14 50 18 62 12 72Z"
        fill="url(#hl-leaf-1)"
      />
      <path d="M12 70 C7 62 4 56 5 51" stroke="url(#hl-vein)" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* Leaf 2: Mid-Left Upward Leaf */}
    <g>
      <path
        d="M18 56 C8 44 4 28 14 18 C25 24 26 42 18 56Z"
        fill="url(#hl-leaf-2)"
      />
      <path d="M18 54 C13 40 10 28 14 20" stroke="url(#hl-vein)" strokeWidth="1.2" strokeLinecap="round" />
    </g>

    {/* Leaf 3: Topmost Upright Leaf */}
    <g>
      <path
        d="M46 16 C38 6 42 2 52 3 C58 7 56 14 46 16Z"
        fill="url(#hl-leaf-3)"
      />
      <path d="M46 15 C44 8 46 4 50 4" stroke="url(#hl-vein)" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* Leaf 4: Upper-Right Leaf Pointing toward Logo */}
    <g>
      <path
        d="M35 34 C50 24 74 24 84 32 C72 42 50 42 35 34Z"
        fill="url(#hl-leaf-4)"
      />
      <path d="M36 34 C52 30 68 30 80 32" stroke="url(#hl-vein)" strokeWidth="1.2" strokeLinecap="round" />
    </g>

    {/* Leaf 5: Mid-Right Leaf */}
    <g>
      <path
        d="M26 54 C40 46 64 48 76 58 C62 66 40 64 26 54Z"
        fill="url(#hl-leaf-5)"
      />
      <path d="M27 54 C42 51 58 53 72 57" stroke="url(#hl-vein)" strokeWidth="1.2" strokeLinecap="round" />
    </g>

    {/* Leaf 6: Lower Right Leaf */}
    <g>
      <path
        d="M16 74 C28 70 46 72 56 78 C44 82 28 80 16 74Z"
        fill="url(#hl-leaf-1)"
      />
      <path d="M18 74 C30 73 44 75 52 77" stroke="url(#hl-vein)" strokeWidth="1" strokeLinecap="round" />
    </g>
  </svg>
);

// ── 2. Header Right Botanical (Rose / Pink & Cyan Watercolor Branch) ────────
export const HeaderRightBotanical: React.FC<{ className?: string }> = ({
  className = 'w-28 sm:w-36 md:w-44 h-auto',
}) => (
  <svg
    viewBox="0 0 160 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      {/* Arching Stem Gradient */}
      <linearGradient id="hr-stem-grad" x1="154" y1="0" x2="108" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E11D48" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#F472B6" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#0891B2" stopOpacity="0.7" />
      </linearGradient>

      {/* Leaf 1: Topmost Pink Leaf */}
      <linearGradient id="hr-leaf-1" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#F43F5E" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#BE123C" stopOpacity="0.8" />
      </linearGradient>

      {/* Leaf 2: Upper Rose Leaf */}
      <linearGradient id="hr-leaf-2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FCE7F3" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#FB7185" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#E11D48" stopOpacity="0.8" />
      </linearGradient>

      {/* Leaf 3: Mid Leaf (Pink to Cyan Watercolor Bleed) */}
      <linearGradient id="hr-leaf-3" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBCFE8" stopOpacity="0.95" />
        <stop offset="40%" stopColor="#BAE6FD" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.85" />
      </linearGradient>

      {/* Leaf 4: Lower Cyan Leaf */}
      <linearGradient id="hr-leaf-4" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0891B2" stopOpacity="0.8" />
      </linearGradient>

      {/* Leaf 5: Bottom-most Teal Leaf */}
      <linearGradient id="hr-leaf-5" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0.95" />
        <stop offset="55%" stopColor="#06B6D4" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#0D9488" stopOpacity="0.8" />
      </linearGradient>

      {/* Vein Highlights */}
      <linearGradient id="hr-vein" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    {/* Arching Stem from Top-Right Corner */}
    <path
      d="M154 0 C146 22 132 46 108 72"
      stroke="url(#hr-stem-grad)"
      strokeWidth="2.6"
      strokeLinecap="round"
    />

    {/* Branchlets */}
    <path d="M146 16 C152 12 156 8 156 4" stroke="url(#hr-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M138 28 C126 22 114 18 102 18" stroke="url(#hr-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M126 46 C114 44 100 48 88 52" stroke="url(#hr-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M116 62 C124 66 136 72 144 76" stroke="url(#hr-stem-grad)" strokeWidth="1.5" strokeLinecap="round" />

    {/* Leaf 1: Topmost Pink Leaf */}
    <g>
      <path
        d="M146 14 C154 8 160 3 156 2 C145 1 138 6 146 14Z"
        fill="url(#hr-leaf-1)"
      />
      <path d="M147 13 C152 8 156 5 155 3" stroke="url(#hr-vein)" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* Leaf 2: Upper Rose Leaf pointing left */}
    <g>
      <path
        d="M138 28 C122 18 98 16 88 24 C100 36 124 36 138 28Z"
        fill="url(#hr-leaf-2)"
      />
      <path d="M136 28 C120 22 106 20 92 24" stroke="url(#hr-vein)" strokeWidth="1.2" strokeLinecap="round" />
    </g>

    {/* Leaf 3: Mid Leaf (Pink to Cyan Bleed) */}
    <g>
      <path
        d="M126 46 C110 40 88 44 78 54 C92 64 112 58 126 46Z"
        fill="url(#hr-leaf-3)"
      />
      <path d="M124 47 C108 45 96 48 82 53" stroke="url(#hr-vein)" strokeWidth="1.2" strokeLinecap="round" />
    </g>

    {/* Leaf 4: Lower Cyan Leaf */}
    <g>
      <path
        d="M116 62 C104 64 88 72 92 78 C104 78 114 72 116 62Z"
        fill="url(#hr-leaf-4)"
      />
      <path d="M115 63 C106 68 98 73 94 77" stroke="url(#hr-vein)" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* Leaf 5: Bottom-most Teal Leaf */}
    <g>
      <path
        d="M118 64 C128 68 144 72 150 78 C138 80 125 76 118 64Z"
        fill="url(#hr-leaf-5)"
      />
      <path d="M120 65 C130 70 140 73 146 76" stroke="url(#hr-vein)" strokeWidth="1" strokeLinecap="round" />
    </g>
  </svg>
);

// ── 3. Footer Banner Silhouettes (Translucent White) ─────────────────────────
export const FooterBannerLeftBotanical: React.FC<{ className?: string }> = ({
  className = 'w-48 sm:w-60 h-auto',
}) => (
  <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M-20 180C30 140 80 90 120 40C140 15 170 0 190 -10" stroke="white" strokeWidth="2.5" strokeOpacity="0.25" strokeLinecap="round" />
    <path d="M20 140C45 115 85 125 80 155C55 165 30 155 20 140Z" fill="white" fillOpacity="0.16" />
    <path d="M55 100C85 75 125 90 118 120C90 130 65 115 55 100Z" fill="white" fillOpacity="0.18" />
    <path d="M90 60C120 35 160 50 152 80C125 90 100 75 90 60Z" fill="white" fillOpacity="0.15" />
    <path d="M130 20C155 0 190 12 185 38C160 48 138 35 130 20Z" fill="white" fillOpacity="0.2" />
  </svg>
);

export const FooterBannerRightBotanical: React.FC<{ className?: string }> = ({
  className = 'w-48 sm:w-60 h-auto',
}) => (
  <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M260 180C210 140 160 90 120 40C100 15 70 0 50 -10" stroke="white" strokeWidth="2.5" strokeOpacity="0.25" strokeLinecap="round" />
    <path d="M220 140C195 115 155 125 160 155C185 165 210 155 220 140Z" fill="white" fillOpacity="0.16" />
    <path d="M185 100C155 75 115 90 122 120C150 130 175 115 185 100Z" fill="white" fillOpacity="0.18" />
    <path d="M150 60C120 35 80 50 88 80C115 90 140 75 150 60Z" fill="white" fillOpacity="0.15" />
    <path d="M110 20C85 0 50 12 55 38C80 48 102 35 110 20Z" fill="white" fillOpacity="0.2" />
  </svg>
);

// ── 4. Main Footer Right Botanical (Lush Rose & Teal Corner Cluster) ─────────
export const FooterRightBotanical: React.FC<{ className?: string }> = ({
  className = 'w-64 sm:w-80 h-auto',
}) => (
  <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="frb-stem" x1="320" y1="280" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0891B2" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#E11D48" stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id="frb-leaf-rose" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#E11D48" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="frb-leaf-pink" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#FCE7F3" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="frb-leaf-teal" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#0284C7" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="frb-leaf-mint" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#0D9488" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#99F6E4" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    <path d="M340 280C280 230 200 170 140 110C90 60 50 30 10 10" stroke="url(#frb-stem)" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M260 260C210 200 150 160 90 120" stroke="url(#frb-stem)" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M40 25C15 15 5 45 25 65C50 65 60 40 40 25Z" fill="url(#frb-leaf-teal)" />
    <path d="M85 55C60 40 45 75 70 95C95 95 105 70 85 55Z" fill="url(#frb-leaf-rose)" />
    <path d="M130 95C100 80 85 115 110 140C140 135 150 110 130 95Z" fill="url(#frb-leaf-pink)" />
    <path d="M175 140C145 125 130 160 155 185C185 180 195 155 175 140Z" fill="url(#frb-leaf-teal)" />
    <path d="M225 185C195 170 180 205 205 230C235 225 245 200 225 185Z" fill="url(#frb-leaf-rose)" />
    <path d="M110 135C85 125 75 155 95 175C120 175 130 150 110 135Z" fill="url(#frb-leaf-mint)" />
    <path d="M160 175C135 165 125 195 145 215C170 215 180 190 160 175Z" fill="url(#frb-leaf-pink)" />
    <path d="M210 215C185 205 175 235 195 255C220 255 230 230 210 215Z" fill="url(#frb-leaf-teal)" />
  </svg>
);

// ── 5. Main Footer Left Botanical (Teal Corner Cluster) ───────────────────────
export const FooterLeftBotanical: React.FC<{ className?: string }> = ({
  className = 'w-48 sm:w-64 h-auto',
}) => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="flb-stem" x1="0" y1="200" x2="200" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0891B2" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="flb-leaf-cyan" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0891B2" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="flb-leaf-mint" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0D9488" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.85" />
      </linearGradient>
    </defs>
    <path d="M-10 200C40 160 100 120 150 70C180 40 200 20 220 0" stroke="url(#flb-stem)" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M25 170C48 150 78 162 72 186C50 192 28 184 25 170Z" fill="url(#flb-leaf-cyan)" />
    <path d="M68 135C92 115 122 128 116 152C94 158 72 150 68 135Z" fill="url(#flb-leaf-mint)" />
    <path d="M115 95C140 75 170 88 164 112C142 118 120 110 115 95Z" fill="url(#flb-leaf-cyan)" />
    <path d="M165 55C188 38 214 50 208 72C190 76 170 70 165 55Z" fill="url(#flb-leaf-mint)" />
  </svg>
);

// ── 6. Small Botanical Sprig (Miniature Arching Branch with 4 Delicate Leaves) ───
export const SmallBotanicalSprig: React.FC<{
  variant?: 'pink' | 'teal' | 'dual';
  flip?: boolean;
  className?: string;
}> = ({ variant = 'dual', flip = false, className = 'w-16 sm:w-20 h-auto' }) => {
  const isPink = variant === 'pink';
  const isTeal = variant === 'teal';

  // Leaf 1 color
  const leaf1Fill = isPink ? '#FDA4AF' : isTeal ? '#38BDF8' : '#FDA4AF';
  // Leaf 2 color
  const leaf2Fill = isPink ? '#F472B6' : isTeal ? '#0891B2' : '#22D3EE';
  // Leaf 3 color
  const leaf3Fill = isPink ? '#FBCFE8' : isTeal ? '#67E8F9' : '#F472B6';
  // Leaf 4 color
  const leaf4Fill = isPink ? '#FDA4AF' : isTeal ? '#0D9488' : '#0891B2';
  // Stem color
  const stemStroke = isPink ? '#F472B6' : isTeal ? '#0891B2' : '#38BDF8';

  return (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${flip ? '-scale-x-100' : ''}`}
      aria-hidden="true"
    >
      {/* Arching Stem */}
      <path
        d="M6 74 C24 60 52 46 88 18"
        stroke={stemStroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      {/* Secondary branchlet */}
      <path
        d="M34 52 C44 42 56 40 68 42"
        stroke={stemStroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />

      {/* Leaf 1: Base Leaf */}
      <g>
        <path
          d="M20 62 C12 50 14 38 28 36 C34 46 30 58 20 62Z"
          fill={leaf1Fill}
          fillOpacity="0.75"
        />
        <path d="M21 60 C17 50 18 42 26 38" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.6" strokeLinecap="round" />
      </g>

      {/* Leaf 2: Upper Left Leaf */}
      <g>
        <path
          d="M45 42 C38 28 44 16 58 18 C64 28 56 40 45 42Z"
          fill={leaf2Fill}
          fillOpacity="0.8"
        />
        <path d="M46 40 C42 30 45 22 54 20" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.6" strokeLinecap="round" />
      </g>

      {/* Leaf 3: Branchlet Leaf */}
      <g>
        <path
          d="M68 42 C78 36 90 40 92 50 C80 54 70 48 68 42Z"
          fill={leaf3Fill}
          fillOpacity="0.7"
        />
        <path d="M70 43 C78 39 86 42 88 48" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.5" strokeLinecap="round" />
      </g>

      {/* Leaf 4: Terminal Tip Leaf */}
      <g>
        <path
          d="M88 18 C88 6 78 2 72 8 C72 18 82 22 88 18Z"
          fill={leaf4Fill}
          fillOpacity="0.85"
        />
        <path d="M86 16 C84 9 78 6 74 9" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.6" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// ── 7. Single Floating Botanical Leaf ──────────────────────────────────────────
export const SingleBotanicalLeaf: React.FC<{
  variant?: 'pink' | 'teal' | 'mint';
  className?: string;
}> = ({ variant = 'teal', className = 'w-6 h-6' }) => {
  const colors = {
    pink: { fill: '#FDA4AF', vein: '#FFFFFF', stroke: '#F472B6' },
    teal: { fill: '#38BDF8', vein: '#FFFFFF', stroke: '#0891B2' },
    mint: { fill: '#6EE7B7', vein: '#FFFFFF', stroke: '#059669' },
  }[variant];

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 28 C8 18 16 8 28 4 C24 16 16 24 4 28Z"
        fill={colors.fill}
        fillOpacity="0.75"
        stroke={colors.stroke}
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
      <path
        d="M6 26 C12 18 18 12 26 6"
        stroke={colors.vein}
        strokeWidth="0.9"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ── 8. Delicate Botanical Cluster (2-3 leaves with organic dewdrops) ──────────
export const DelicateBotanicalCluster: React.FC<{
  variant?: 'pink' | 'teal' | 'dual';
  className?: string;
}> = ({ variant = 'dual', className = 'w-14 sm:w-18 h-auto' }) => {
  const leafA = variant === 'teal' ? '#38BDF8' : '#FDA4AF';
  const leafB = variant === 'pink' ? '#F472B6' : '#22D3EE';
  const dotColor = variant === 'pink' ? '#F472B6' : '#0891B2';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Tiny ambient sparkle / dewdrop */}
      <circle cx="52" cy="12" r="2.5" fill={dotColor} fillOpacity="0.6" />
      <circle cx="56" cy="24" r="1.5" fill={dotColor} fillOpacity="0.4" />

      {/* Main leaf */}
      <path
        d="M12 52 C18 36 32 22 50 16 C44 32 30 46 12 52Z"
        fill={leafA}
        fillOpacity="0.75"
      />
      <path d="M14 50 C22 36 34 26 48 18" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.6" strokeLinecap="round" />

      {/* Secondary offset leaf */}
      <path
        d="M20 44 C12 34 16 20 28 14 C32 26 28 38 20 44Z"
        fill={leafB}
        fillOpacity="0.7"
      />
      <path d="M20 42 C16 34 18 24 26 16" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.6" strokeLinecap="round" />
    </svg>
  );
};

