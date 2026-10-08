import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  ATMOSPHERE_TOKENS,
  isDashboardRoute,
  resolveAtmosphereTone,
  type AtmosphereTone,
} from './atmosphereTokens';
import { AtmosphereMotifs } from './AtmosphereMotifs';
import { useUserHealth } from '../../context/UserHealthContext';
import type { HealthPathway } from '../../types/onboarding';
import { ROUTES } from '../../constants/routes';

export interface PageAtmosphereProps {
  /** Explicit override for the semantic mood/tone */
  tone?: AtmosphereTone;
  /** Explicit override for the pathway ('female' | 'male' | 'general') */
  pathway?: HealthPathway;
  /** Manually disable the background atmosphere */
  disabled?: boolean;
  /** Custom wrapper class */
  className?: string;
}

/**
 * PageAtmosphere
 *
 * Provides a clinical, calm, and organic atmospheric backdrop across BioPulse
 * public pages and authenticated non-dashboard pages.
 *
 * STRICT EXCLUSION:
 * Automatically disables itself on all dashboard routes (/app/ovasense,
 * /app/androsense, /app/vitasense, /app/dashboard, /app) to preserve their
 * intentional pathway-specific visual identities and card grids.
 */
export const PageAtmosphere: React.FC<PageAtmosphereProps> = ({
  tone: toneProp,
  pathway: pathwayProp,
  disabled = false,
  className = '',
}) => {
  const location = useLocation();
  const { userProfile } = useUserHealth();

  // 1. Strict Dashboard and Home Route Exclusion
  // Dashboards retain their visual identity; Home retains its exact pre-theme design.
  if (
    disabled ||
    isDashboardRoute(location.pathname) ||
    location.pathname === '/' ||
    location.pathname === ROUTES.HOME
  ) {
    return null;
  }

  // 2. Resolve Active Pathway (Props > Context > Default)
  const activePathway =
    pathwayProp ||
    userProfile?.pathway ||
    (userProfile?.gender === 'female' ? 'female' : userProfile?.gender === 'male' ? 'male' : 'female');

  // 3. Resolve Semantic Atmosphere Tone
  const activeTone: AtmosphereTone =
    toneProp || resolveAtmosphereTone(location.pathname, activePathway);

  const atmosphere = ATMOSPHERE_TOKENS[activeTone] || ATMOSPHERE_TOKENS.neutral;

  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{
        background: atmosphere.baseGradient,
      }}
    >
      {/* ── 1. Primary Soft Ambient Radial Aura ── */}
      <div
        className={`absolute pointer-events-none transition-all duration-1000 ${atmosphere.primaryAura.position} ${atmosphere.primaryAura.size}`}
        style={{
          background: atmosphere.primaryAura.color,
        }}
      />

      {/* ── 2. Secondary Ambient Radial Aura (if configured) ── */}
      {atmosphere.secondaryAura && (
        <div
          className={`absolute pointer-events-none transition-all duration-1000 ${atmosphere.secondaryAura.position} ${atmosphere.secondaryAura.size}`}
          style={{
            background: atmosphere.secondaryAura.color,
          }}
        />
      )}

      {/* ── 3. Low-Opacity Semantic Biological / Botanical Vector Motifs ── */}
      <AtmosphereMotifs atmosphere={atmosphere} />
    </div>
  );
};

/**
 * Alias component for semantic flexibility across layouts.
 */
export const AppAmbientBackground: React.FC<PageAtmosphereProps> = PageAtmosphere;

export default PageAtmosphere;
