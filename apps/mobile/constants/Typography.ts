/**
 * OVASense Typography scale and font weight definitions.
 *
 * Designed for clinical legibility, clear hierarchical scanning,
 * and high accessibility.
 */

export const Typography = {
  fontSize: {
    // Semantic scale
    display: 34,
    h1: 28,
    h2: 22,
    h3: 18,
    title: 17,
    subtitle: 15,
    body: 15,
    bodySmall: 13,
    label: 12,
    caption: 11,
    button: 15,

    // Atomic scale
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    // Semantic scale
    display: 40,
    h1: 34,
    h2: 28,
    h3: 24,
    title: 22,
    subtitle: 20,
    body: 22,
    bodySmall: 18,
    label: 16,
    caption: 14,
    button: 20,

    // Atomic scale
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 38,
    '4xl': 44,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    wide: 0.2,
    wider: 0.5,
  },
} as const;

export type TypographyFontSize = keyof typeof Typography.fontSize;
export type TypographyFontWeight = keyof typeof Typography.fontWeight;
