/**
 * OVASense Brand Palette & Semantic Theme Tokens
 *
 * Visual Identity:
 * - Deep Orchid / Sophisticated Purple (Primary Brand)
 * - Misty Lavender (Soft Supporting UI)
 * - Rich Berry / Magenta (Secondary Accent)
 * - Warm Blush / Coral-Pink (Empathetic Accent)
 * - Soft Lilac Neutrals (Surfaces & Backgrounds)
 * - Deep Plum Charcoal (High-Contrast Text)
 *
 * 60-25-10-5 Rule:
 * 60% Neutral Surfaces, 25% Purple/Lavender, 10% Berry/Magenta, 5% Warm Blush
 */

export interface ColorTheme {
  // Brand Primary Family (Deep Orchid)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;

  // Brand Secondary Family (Rich Berry / Magenta)
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondarySoft: string;

  // Empathetic Accent Family (Warm Blush / Coral-Pink)
  accent: string;
  accentLight: string;
  accentDark: string;
  accentSoft: string;

  // Surfaces & Background Hierarchy (Soft Lilac Neutrals - avoiding pure white everywhere)
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;

  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderFocus: string;

  // Card Tokens
  card: string;
  cardBorder: string;

  // Typography & Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Health Information Status Tokens (Non-diagnostic semantics, WCAG AA/AAA verified)
  success: string;
  successSoft: string;
  successBorder: string;

  warning: string;
  warningSoft: string;
  warningBorder: string;

  error: string;
  errorSoft: string;
  errorBorder: string;

  info: string;
  infoSoft: string;
  infoBorder: string;

  // Gradients (Subtle & Intentional)
  gradientBrand: readonly [string, string, string];
  gradientSoft: readonly [string, string];
  gradientAccent: readonly [string, string];

  // Ambient Glow Orbs
  glowOrbPrimary: string;
  glowOrbAccent: string;
}

export const Colors: { dark: ColorTheme; light: ColorTheme } = {
  light: {
    // Brand Primary (Deep Orchid)
    primary: '#6E2D8B',
    primaryLight: '#8E3EAF',
    primaryDark: '#4A154B',
    primarySoft: '#EDE4F7',

    // Brand Secondary (Rich Berry / Magenta)
    secondary: '#A21CAF',
    secondaryLight: '#C026D3',
    secondaryDark: '#701A75',
    secondarySoft: '#FDF2F8',

    // Empathetic Accent (Warm Blush / Coral-Pink)
    accent: '#E87084',
    accentLight: '#F48498',
    accentDark: '#BE185D',
    accentSoft: '#FFF0F2',

    // Surfaces & Backgrounds (Soft Lilac Neutrals - avoiding pure white everywhere)
    background: '#F8F5FA',
    surface: '#FFFFFF',
    surfaceSubtle: '#F2ECF7',
    surfaceElevated: '#FFFFFF',

    // Borders & Dividers
    border: '#E7DFEF',
    borderSubtle: '#F0EAF5',
    borderFocus: '#8E3EAF',

    // Cards
    card: '#FFFFFF',
    cardBorder: 'rgba(110, 45, 139, 0.08)',

    // Typography (Deep Plum Charcoal for high readability)
    textPrimary: '#1C1326',
    textSecondary: '#584B68',
    textMuted: '#8D7E9E',
    textInverse: '#FFFFFF',

    // Health Information Status Tokens (WCAG AA/AAA compliant)
    success: '#047857',
    successSoft: '#ECFDF5',
    successBorder: '#A7F3D0',

    warning: '#B45309',
    warningSoft: '#FFFBEB',
    warningBorder: '#FDE68A',

    error: '#BE123C',
    errorSoft: '#FFF1F2',
    errorBorder: '#FECDD3',

    info: '#4338CA',
    infoSoft: '#EEF2FF',
    infoBorder: '#C7D2FE',

    // Gradients
    gradientBrand: ['#6E2D8B', '#8E3EAF', '#D946EF'] as const,
    gradientSoft: ['#EDE4F7', '#FFF0F2'] as const,
    gradientAccent: ['#A21CAF', '#E87084'] as const,

    // Glow Orbs
    glowOrbPrimary: 'rgba(110, 45, 139, 0.12)',
    glowOrbAccent: 'rgba(232, 112, 132, 0.15)',
  },

  dark: {
    // Brand Primary (Vivid Orchid on Dark)
    primary: '#A855F7',
    primaryLight: '#C084FC',
    primaryDark: '#7E22CE',
    primarySoft: '#2D1C3D',

    // Brand Secondary (Vibrant Berry on Dark)
    secondary: '#E879F9',
    secondaryLight: '#F0ABFC',
    secondaryDark: '#A21CAF',
    secondarySoft: '#3B1838',

    // Empathetic Accent (Warm Coral Blush on Dark)
    accent: '#FB7185',
    accentLight: '#FDA4AF',
    accentDark: '#E11D48',
    accentSoft: '#3E1822',

    // Surfaces & Backgrounds (Obsidian Plum)
    background: '#0C0814',
    surface: '#161124',
    surfaceSubtle: '#201933',
    surfaceElevated: '#2A2042',

    // Borders & Dividers
    border: '#2E2445',
    borderSubtle: '#241C38',
    borderFocus: '#A855F7',

    // Cards
    card: '#161124',
    cardBorder: 'rgba(255, 255, 255, 0.08)',

    // Typography (Soft Pearl Lilac)
    textPrimary: '#F6F2FA',
    textSecondary: '#B4A6C7',
    textMuted: '#7E6F94',
    textInverse: '#0C0814',

    // Health Information Status Tokens (WCAG AA/AAA compliant)
    success: '#10B981',
    successSoft: '#064E3B',
    successBorder: '#047857',

    warning: '#F59E0B',
    warningSoft: '#451A03',
    warningBorder: '#B45309',

    error: '#F43F5E',
    errorSoft: '#4C0519',
    errorBorder: '#9F1239',

    info: '#818CF8',
    infoSoft: '#1E1B4B',
    infoBorder: '#3730A3',

    // Gradients
    gradientBrand: ['#581C87', '#7E22CE', '#C084FC'] as const,
    gradientSoft: ['#2D1C3D', '#1E122B'] as const,
    gradientAccent: ['#C026D3', '#FB7185'] as const,

    // Glow Orbs
    glowOrbPrimary: 'rgba(168, 85, 247, 0.16)',
    glowOrbAccent: 'rgba(251, 113, 133, 0.18)',
  },
};

export type ColorKey = keyof ColorTheme;
