import React from 'react';
import {
  SmallBotanicalSprig,
  SingleBotanicalLeaf,
  DelicateBotanicalCluster,
} from './BotanicalFoliage';

/**
 * GlobalBotanicalBackground
 *
 * Renders a full-canvas ambient atmosphere featuring:
 * 1. Soft dual-tone pinkish and teal atmospheric tint washes that softly illuminate
 *    the page margins and depth layers.
 * 2. Small, delicate botanical leaves, sprigs, and floating foliage clusters
 *    placed along the viewport margins to frame the UI organically.
 * 3. Responsive scaling and positioning with pointer-events-none to ensure zero
 *    interference with clicks, form inputs, or text readability.
 */
export const GlobalBotanicalBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* ── 1. Soft Atmospheric Dual-Tint Radiant Fields ── */}
      {/* Top Left: Warm Pinkish / Rose Aura (PCOS / "Healthier Her") */}
      <div
        className="absolute top-0 left-0 w-[48vw] h-[55vh] max-w-[750px] max-h-[650px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 12% 16%, rgba(254, 205, 211, 0.42) 0%, rgba(251, 207, 232, 0.18) 45%, transparent 70%)',
        }}
      />

      {/* Top Right: Cool Teal / Cyan Aura (Hypogonadism / "Stronger Him") */}
      <div
        className="absolute top-0 right-0 w-[48vw] h-[55vh] max-w-[750px] max-h-[650px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 88% 16%, rgba(186, 230, 253, 0.48) 0%, rgba(207, 250, 254, 0.2) 45%, transparent 70%)',
        }}
      />

      {/* Mid Left: Alternating Teal / Sky Aura */}
      <div
        className="absolute top-[40%] left-0 w-[45vw] h-[50vh] max-w-[700px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 6% 50%, rgba(207, 250, 254, 0.35) 0%, rgba(224, 242, 254, 0.15) 50%, transparent 70%)',
        }}
      />

      {/* Mid Right: Alternating Soft Rose / Blush Aura */}
      <div
        className="absolute top-[42%] right-0 w-[45vw] h-[50vh] max-w-[700px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 94% 50%, rgba(251, 207, 232, 0.38) 0%, rgba(254, 205, 211, 0.16) 50%, transparent 70%)',
        }}
      />

      {/* Lower Left: Pinkish / Blossom Glow */}
      <div
        className="absolute bottom-0 left-0 w-[50vw] h-[50vh] max-w-[750px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 10% 85%, rgba(254, 205, 211, 0.38) 0%, rgba(252, 231, 243, 0.15) 45%, transparent 70%)',
        }}
      />

      {/* Lower Right: Mint / Teal Glow */}
      <div
        className="absolute bottom-0 right-0 w-[50vw] h-[50vh] max-w-[750px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 90% 85%, rgba(186, 230, 253, 0.42) 0%, rgba(167, 243, 208, 0.15) 45%, transparent 70%)',
        }}
      />

      {/* ── 2. Small Botanical Leaf Sprigs & Foliage Clusters in Margins ── */}

      {/* [TOP LEFT] Small Pinkish Botanical Sprig (tucked gracefully below navbar) */}
      <div className="hidden sm:block absolute top-20 left-2 lg:left-6 opacity-75 transform -rotate-12 transition-transform duration-700 hover:scale-105">
        <SmallBotanicalSprig variant="pink" className="w-14 sm:w-18 lg:w-22 h-auto" />
      </div>

      {/* [TOP RIGHT] Small Teal Botanical Sprig */}
      <div className="hidden sm:block absolute top-20 right-2 lg:right-6 opacity-75 transform rotate-12 transition-transform duration-700 hover:scale-105">
        <SmallBotanicalSprig variant="teal" flip className="w-14 sm:w-18 lg:w-22 h-auto" />
      </div>

      {/* [MID-UPPER LEFT] Delicate Dual Leaf Cluster */}
      <div className="hidden md:block absolute top-[28%] left-3 lg:left-8 opacity-70 transform rotate-45">
        <DelicateBotanicalCluster variant="dual" className="w-12 sm:w-16 h-auto" />
      </div>

      {/* [MID-UPPER RIGHT] Floating Single Rose Leaf */}
      <div className="hidden md:block absolute top-[26%] right-4 lg:right-10 opacity-65 transform -rotate-25">
        <SingleBotanicalLeaf variant="pink" className="w-6 sm:w-8 h-auto" />
      </div>

      {/* [MID LEFT] Single Teal Leaf */}
      <div className="hidden lg:block absolute top-[48%] left-4 lg:left-8 opacity-65 transform rotate-15">
        <SingleBotanicalLeaf variant="teal" className="w-7 sm:w-9 h-auto" />
      </div>

      {/* [MID RIGHT] Small Dual Botanical Sprig */}
      <div className="hidden sm:block absolute top-[50%] right-2 lg:right-6 opacity-75 transform -rotate-6">
        <SmallBotanicalSprig variant="dual" flip className="w-14 sm:w-18 lg:w-20 h-auto" />
      </div>

      {/* [LOWER-MID LEFT] Small Teal Sprig */}
      <div className="hidden sm:block absolute top-[68%] left-2 lg:left-6 opacity-70 transform rotate-12">
        <SmallBotanicalSprig variant="teal" className="w-14 sm:w-18 h-auto" />
      </div>

      {/* [LOWER-MID RIGHT] Delicate Pink Cluster */}
      <div className="hidden md:block absolute top-[70%] right-3 lg:right-8 opacity-70 transform -rotate-15">
        <DelicateBotanicalCluster variant="pink" className="w-12 sm:w-15 h-auto" />
      </div>

      {/* [BOTTOM LEFT] Single Mint Leaf */}
      <div className="hidden lg:block absolute bottom-24 left-4 lg:left-10 opacity-65 transform rotate-35">
        <SingleBotanicalLeaf variant="mint" className="w-7 sm:w-8 h-auto" />
      </div>

      {/* [BOTTOM RIGHT] Floating Rose Leaf */}
      <div className="hidden lg:block absolute bottom-24 right-4 lg:right-10 opacity-65 transform -rotate-45">
        <SingleBotanicalLeaf variant="pink" className="w-7 sm:w-8 h-auto" />
      </div>
    </div>
  );
};

export default GlobalBotanicalBackground;
