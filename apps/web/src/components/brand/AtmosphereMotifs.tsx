import React from 'react';
import type { AtmosphereDefinition } from './atmosphereTokens';

interface MotifProps {
  atmosphere: AtmosphereDefinition;
}

/**
 * 1. Botanical Corner Sprigs
 * Delicate corner foliage positioned in viewport margins/negative space.
 */
export const BotanicalCornerMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <>
      {/* Top Left Delicate Arching Branch */}
      <div
        className="absolute top-16 -left-6 sm:left-2 lg:left-6 transition-opacity duration-700 pointer-events-none -rotate-12"
        style={{ opacity: motifOpacity }}
      >
        <svg
          viewBox="0 0 160 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-28 sm:w-36 lg:w-44 h-auto"
          aria-hidden="true"
        >
          {/* Main Stem */}
          <path
            d="M8 112 C28 92 64 68 124 24"
            stroke={motifColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M48 78 C62 62 82 58 102 62"
            stroke={motifColor}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Leaves */}
          <path
            d="M28 94 C16 78 18 62 36 58 C46 72 40 88 28 94Z"
            fill={motifColor}
            fillOpacity="0.75"
          />
          <path
            d="M62 66 C52 48 60 32 78 34 C86 48 76 64 62 66Z"
            fill={motifColor}
            fillOpacity="0.7"
          />
          <path
            d="M102 62 C114 54 130 58 132 72 C116 78 104 70 102 62Z"
            fill={motifColor}
            fillOpacity="0.65"
          />
          <path
            d="M124 24 C124 8 110 4 102 12 C104 26 116 30 124 24Z"
            fill={motifColor}
            fillOpacity="0.8"
          />
        </svg>
      </div>

      {/* Top Right Floating Single Leaf */}
      <div
        className="hidden md:block absolute top-24 right-4 lg:right-10 transition-opacity duration-700 pointer-events-none rotate-24"
        style={{ opacity: motifOpacity * 0.9 }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 sm:w-12 h-auto"
          aria-hidden="true"
        >
          <path
            d="M6 42 C12 28 24 14 42 6 C36 24 24 36 6 42Z"
            fill={motifColor}
            fillOpacity="0.65"
            stroke={motifColor}
            strokeWidth="1.2"
          />
          <path
            d="M8 40 C18 28 28 18 38 8"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {/* Lower Margin Leaf Cluster */}
      <div
        className="hidden lg:block absolute bottom-16 right-6 transition-opacity duration-700 pointer-events-none -rotate-15"
        style={{ opacity: motifOpacity * 0.85 }}
      >
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-auto"
          aria-hidden="true"
        >
          <path
            d="M16 64 C24 44 42 28 64 20 C56 40 38 56 16 64Z"
            fill={motifColor}
            fillOpacity="0.7"
          />
          <path
            d="M26 54 C16 42 20 26 36 18 C40 32 34 46 26 54Z"
            fill={motifColor}
            fillOpacity="0.5"
          />
        </svg>
      </div>
    </>
  );
};

/**
 * 2. Herbal / Nutrition Motif
 * Elegant culinary herbs (rosemary & mint sprig silhouette) for Lifestyle & Nutrition.
 */
export const HerbalNutritionMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <>
      {/* Top Right Herb Line Art */}
      <div
        className="absolute top-14 right-2 sm:right-6 lg:right-10 pointer-events-none rotate-6"
        style={{ opacity: motifOpacity }}
      >
        <svg
          viewBox="0 0 140 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-28 sm:w-36 lg:w-44 h-auto"
          aria-hidden="true"
        >
          {/* Main Herb Stem */}
          <path
            d="M120 10 C90 50 60 100 20 150"
            stroke={motifColor}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Delicate Leaf Pairs */}
          <path
            d="M105 32 C85 24 75 32 85 46 C100 48 108 40 105 32Z"
            fill={motifColor}
            fillOpacity="0.7"
          />
          <path
            d="M112 36 C128 28 138 34 130 50 C118 52 110 44 112 36Z"
            fill={motifColor}
            fillOpacity="0.6"
          />
          <path
            d="M86 68 C66 60 56 68 66 82 C81 84 89 76 86 68Z"
            fill={motifColor}
            fillOpacity="0.7"
          />
          <path
            d="M93 72 C109 64 119 70 111 86 C99 88 91 80 93 72Z"
            fill={motifColor}
            fillOpacity="0.6"
          />
          <path
            d="M62 108 C42 100 32 108 42 122 C57 124 65 116 62 108Z"
            fill={motifColor}
            fillOpacity="0.65"
          />
          <path
            d="M69 112 C85 104 95 110 87 126 C75 128 67 120 69 112Z"
            fill={motifColor}
            fillOpacity="0.55"
          />
        </svg>
      </div>

      {/* Lower Left Subtle Leaf Line */}
      <div
        className="hidden md:block absolute bottom-20 left-4 lg:left-8 pointer-events-none -rotate-12"
        style={{ opacity: motifOpacity * 0.8 }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-20 sm:w-24 h-auto"
          aria-hidden="true"
        >
          <path
            d="M10 90 C30 70 60 50 90 20"
            stroke={motifColor}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M30 70 C20 54 28 42 44 46 C48 60 40 70 30 70Z"
            fill={motifColor}
            fillOpacity="0.6"
          />
          <path
            d="M60 44 C50 28 58 16 74 20 C78 34 70 44 60 44Z"
            fill={motifColor}
            fillOpacity="0.65"
          />
        </svg>
      </div>
    </>
  );
};

/**
 * 3. Kinetic Wave Motif
 * Subtle flowing curves reflecting movement, cardio clarity, and recovery waves.
 */
export const KineticWaveMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <>
      <div
        className="absolute top-20 right-0 pointer-events-none overflow-hidden w-64 sm:w-96 h-48"
        style={{ opacity: motifOpacity }}
      >
        <svg
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          aria-hidden="true"
        >
          <path
            d="M420 20 C340 40 280 120 180 110 C80 100 40 160 -20 170"
            stroke={motifColor}
            strokeWidth="1.6"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
          <path
            d="M440 60 C360 80 300 150 200 140 C100 130 60 180 0 190"
            stroke={motifColor}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M400 100 C320 115 260 170 160 165 C80 160 40 195 20 200"
            stroke={motifColor}
            strokeWidth="0.8"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="hidden md:block absolute bottom-24 left-0 pointer-events-none w-72 h-40"
        style={{ opacity: motifOpacity * 0.7 }}
      >
        <svg
          viewBox="0 0 300 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          aria-hidden="true"
        >
          <path
            d="M-20 40 C60 50 120 110 220 90 C270 80 300 100 340 110"
            stroke={motifColor}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
};

/**
 * 4. Cellular Micro Motif
 * Restrained microscopic cellular contours & biomarker rings for Clinical Screening & Symptoms.
 */
export const CellularMicroMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <>
      <div
        className="absolute top-20 right-4 sm:right-10 pointer-events-none"
        style={{ opacity: motifOpacity }}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-24 sm:w-32 h-auto"
          aria-hidden="true"
        >
          <circle cx="60" cy="60" r="42" stroke={motifColor} strokeWidth="1.2" strokeDasharray="3 4" />
          <circle cx="60" cy="60" r="28" stroke={motifColor} strokeWidth="1" />
          <circle cx="60" cy="60" r="14" stroke={motifColor} strokeWidth="0.8" strokeOpacity="0.5" />
          <circle cx="60" cy="32" r="3" fill={motifColor} fillOpacity="0.6" />
          <circle cx="84" cy="74" r="2.5" fill={motifColor} fillOpacity="0.5" />
        </svg>
      </div>

      <div
        className="hidden lg:block absolute bottom-20 left-8 pointer-events-none"
        style={{ opacity: motifOpacity * 0.8 }}
      >
        <svg
          viewBox="0 0 90 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-20 h-auto"
          aria-hidden="true"
        >
          <circle cx="45" cy="45" r="34" stroke={motifColor} strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="45" cy="45" r="18" stroke={motifColor} strokeWidth="0.8" />
        </svg>
      </div>
    </>
  );
};

/**
 * 5. Reports Rhythm Motif
 * Structured horizontal and vertical cadence lines representing lab panels and report data.
 */
export const ReportsRhythmMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <div
      className="absolute top-24 right-6 pointer-events-none"
      style={{ opacity: motifOpacity }}
    >
      <svg
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-20 sm:w-28 h-auto"
        aria-hidden="true"
      >
        <line x1="10" y1="20" x2="90" y2="20" stroke={motifColor} strokeWidth="1" strokeDasharray="4 6" />
        <line x1="20" y1="40" x2="80" y2="40" stroke={motifColor} strokeWidth="1" strokeDasharray="2 4" />
        <line x1="30" y1="60" x2="70" y2="60" stroke={motifColor} strokeWidth="1" />
        <circle cx="50" cy="40" r="3" fill={motifColor} fillOpacity="0.5" />
      </svg>
    </div>
  );
};

/**
 * 6. Linked Care Motif
 * Connected organic arcs symbolizing physician-patient partnership and family care circle.
 */
export const LinkedCareMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <div
      className="absolute top-20 right-4 sm:right-10 pointer-events-none"
      style={{ opacity: motifOpacity }}
    >
      <svg
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-24 sm:w-32 h-auto"
        aria-hidden="true"
      >
        <circle cx="45" cy="50" r="28" stroke={motifColor} strokeWidth="1.4" />
        <circle cx="75" cy="50" r="28" stroke={motifColor} strokeWidth="1.4" />
        <path
          d="M60 30 C64 42 64 58 60 70"
          stroke={motifColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/**
 * 7. Upward Growth Motif
 * Upward curving organic stem with twin leaves symbolizing longitudinal healing & recovery.
 */
export const UpwardGrowthMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <div
      className="absolute top-20 right-4 sm:right-8 pointer-events-none"
      style={{ opacity: motifOpacity }}
    >
      <svg
        viewBox="0 0 90 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-20 sm:w-26 h-auto"
        aria-hidden="true"
      >
        <path
          d="M20 110 C35 75 55 45 70 10"
          stroke={motifColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M50 55 C65 42 75 50 72 65 C58 68 50 62 50 55Z"
          fill={motifColor}
          fillOpacity="0.75"
        />
        <path
          d="M35 80 C20 70 18 82 25 92 C36 92 40 85 35 80Z"
          fill={motifColor}
          fillOpacity="0.6"
        />
      </svg>
    </div>
  );
};

/**
 * 8. Neural Bio Motif
 * Delicate node lattice for the AI companion and predictive inference.
 */
export const NeuralBioMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <div
      className="absolute top-16 right-4 sm:right-12 pointer-events-none"
      style={{ opacity: motifOpacity }}
    >
      <svg
        viewBox="0 0 140 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-28 sm:w-36 h-auto"
        aria-hidden="true"
      >
        <line x1="25" y1="35" x2="65" y2="25" stroke={motifColor} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="65" y1="25" x2="110" y2="40" stroke={motifColor} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="65" y1="25" x2="70" y2="75" stroke={motifColor} strokeWidth="1" />
        <line x1="25" y1="35" x2="70" y2="75" stroke={motifColor} strokeWidth="1" />
        <line x1="70" y1="75" x2="110" y2="40" stroke={motifColor} strokeWidth="1" strokeDasharray="3 3" />

        <circle cx="25" cy="35" r="3.5" fill={motifColor} fillOpacity="0.7" />
        <circle cx="65" cy="25" r="4.5" fill={motifColor} fillOpacity="0.8" />
        <circle cx="110" cy="40" r="3.5" fill={motifColor} fillOpacity="0.7" />
        <circle cx="70" cy="75" r="4" fill={motifColor} fillOpacity="0.75" />
      </svg>
    </div>
  );
};

/**
 * 9. Ovarian Bio Motif
 * Subtle ovarian follicular and cycle wave contours for Understand PCOS.
 */
export const OvarianBioMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <div
      className="absolute top-20 right-4 sm:right-10 pointer-events-none"
      style={{ opacity: motifOpacity }}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-24 sm:w-32 h-auto"
        aria-hidden="true"
      >
        <ellipse cx="60" cy="60" rx="48" ry="36" stroke={motifColor} strokeWidth="1.4" strokeDasharray="4 4" />
        <circle cx="45" cy="55" r="8" stroke={motifColor} strokeWidth="1.2" />
        <circle cx="72" cy="50" r="10" stroke={motifColor} strokeWidth="1.2" />
        <circle cx="65" cy="74" r="7" stroke={motifColor} strokeWidth="1.2" />
      </svg>
    </div>
  );
};

/**
 * 10. Endocrine Bio Motif
 * Diurnal circadian testosterone wave contour for Understand Male Hypogonadism.
 */
export const EndocrineBioMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <div
      className="absolute top-20 right-4 sm:right-10 pointer-events-none"
      style={{ opacity: motifOpacity }}
    >
      <svg
        viewBox="0 0 140 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-28 sm:w-36 h-auto"
        aria-hidden="true"
      >
        <path
          d="M10 65 C40 65 50 15 80 15 C110 15 120 55 140 55"
          stroke={motifColor}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="80" cy="15" r="3.5" fill={motifColor} fillOpacity="0.8" />
        <line x1="80" y1="15" x2="80" y2="65" stroke={motifColor} strokeWidth="1" strokeDasharray="2 3" />
      </svg>
    </div>
  );
};

/**
 * 11. Minimal Privacy Motif
 * Restrained shield / encryption contour for Trust & Privacy.
 */
export const MinimalPrivacyMotif: React.FC<MotifProps> = ({ atmosphere }) => {
  const { motifColor, motifOpacity } = atmosphere;

  return (
    <div
      className="absolute top-20 right-6 pointer-events-none"
      style={{ opacity: motifOpacity }}
    >
      <svg
        viewBox="0 0 80 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-16 sm:w-20 h-auto"
        aria-hidden="true"
      >
        <path
          d="M40 10 L70 24 V50 C70 68 56 80 40 85 C24 80 10 68 10 50 V24 L40 10Z"
          stroke={motifColor}
          strokeWidth="1.4"
          strokeDasharray="3 4"
        />
      </svg>
    </div>
  );
};

export const AtmosphereMotifs: React.FC<MotifProps> = ({ atmosphere }) => {
  switch (atmosphere.motifType) {
    case 'botanical_corner':
      return <BotanicalCornerMotif atmosphere={atmosphere} />;
    case 'herbal_nutrition':
      return <HerbalNutritionMotif atmosphere={atmosphere} />;
    case 'kinetic_wave':
      return <KineticWaveMotif atmosphere={atmosphere} />;
    case 'cellular_micro':
      return <CellularMicroMotif atmosphere={atmosphere} />;
    case 'reports_rhythm':
      return <ReportsRhythmMotif atmosphere={atmosphere} />;
    case 'linked_care':
      return <LinkedCareMotif atmosphere={atmosphere} />;
    case 'upward_growth':
      return <UpwardGrowthMotif atmosphere={atmosphere} />;
    case 'neural_bio':
      return <NeuralBioMotif atmosphere={atmosphere} />;
    case 'ovarian_bio':
      return <OvarianBioMotif atmosphere={atmosphere} />;
    case 'endocrine_bio':
      return <EndocrineBioMotif atmosphere={atmosphere} />;
    case 'minimal_privacy':
      return <MinimalPrivacyMotif atmosphere={atmosphere} />;
    default:
      return null;
  }
};
