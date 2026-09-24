import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { Typography as TypoTokens, TypographyFontWeight } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';
import { ColorTheme } from '../../constants/Colors';

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'button'
  | 'Display'
  | 'H1'
  | 'H2'
  | 'H3'
  | 'Title'
  | 'Subtitle'
  | 'Body'
  | 'BodySmall'
  | 'Label'
  | 'Caption'
  | 'Button';

export type TypographySemanticColor = keyof Pick<
  ColorTheme,
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
>;

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  semanticColor?: TypographySemanticColor;
  weight?: TypographyFontWeight;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  semanticColor,
  weight,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const theme = useThemeColor();
  const normalizedVariant = variant.toLowerCase() as
    | 'display'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'title'
    | 'subtitle'
    | 'body'
    | 'bodysmall'
    | 'label'
    | 'caption'
    | 'button';

  const resolveTextColor = (): string => {
    if (color) return color;
    if (semanticColor && theme[semanticColor]) return theme[semanticColor];

    switch (normalizedVariant) {
      case 'display':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'title':
        return theme.textPrimary;
      case 'subtitle':
      case 'body':
      case 'bodysmall':
        return theme.textSecondary;
      case 'label':
      case 'caption':
        return theme.textMuted;
      case 'button':
        return theme.textPrimary;
      default:
        return theme.textPrimary;
    }
  };

  const getVariantStyle = (): TextStyle => {
    switch (normalizedVariant) {
      case 'display':
        return {
          fontSize: TypoTokens.fontSize.display,
          lineHeight: TypoTokens.lineHeight.display,
          fontWeight: TypoTokens.fontWeight.bold,
          letterSpacing: TypoTokens.letterSpacing.tight,
        };
      case 'h1':
        return {
          fontSize: TypoTokens.fontSize.h1,
          lineHeight: TypoTokens.lineHeight.h1,
          fontWeight: TypoTokens.fontWeight.bold,
          letterSpacing: TypoTokens.letterSpacing.tight,
        };
      case 'h2':
        return {
          fontSize: TypoTokens.fontSize.h2,
          lineHeight: TypoTokens.lineHeight.h2,
          fontWeight: TypoTokens.fontWeight.bold,
        };
      case 'h3':
        return {
          fontSize: TypoTokens.fontSize.h3,
          lineHeight: TypoTokens.lineHeight.h3,
          fontWeight: TypoTokens.fontWeight.semibold,
        };
      case 'title':
        return {
          fontSize: TypoTokens.fontSize.title,
          lineHeight: TypoTokens.lineHeight.title,
          fontWeight: TypoTokens.fontWeight.semibold,
        };
      case 'subtitle':
        return {
          fontSize: TypoTokens.fontSize.subtitle,
          lineHeight: TypoTokens.lineHeight.subtitle,
          fontWeight: TypoTokens.fontWeight.medium,
        };
      case 'bodysmall':
        return {
          fontSize: TypoTokens.fontSize.bodySmall,
          lineHeight: TypoTokens.lineHeight.bodySmall,
          fontWeight: TypoTokens.fontWeight.regular,
        };
      case 'label':
        return {
          fontSize: TypoTokens.fontSize.label,
          lineHeight: TypoTokens.lineHeight.label,
          fontWeight: TypoTokens.fontWeight.medium,
          letterSpacing: TypoTokens.letterSpacing.wide,
        };
      case 'caption':
        return {
          fontSize: TypoTokens.fontSize.caption,
          lineHeight: TypoTokens.lineHeight.caption,
          fontWeight: TypoTokens.fontWeight.regular,
        };
      case 'button':
        return {
          fontSize: TypoTokens.fontSize.button,
          lineHeight: TypoTokens.lineHeight.button,
          fontWeight: TypoTokens.fontWeight.semibold,
        };
      case 'body':
      default:
        return {
          fontSize: TypoTokens.fontSize.body,
          lineHeight: TypoTokens.lineHeight.body,
          fontWeight: TypoTokens.fontWeight.regular,
        };
    }
  };

  const isHeader =
    normalizedVariant === 'h1' ||
    normalizedVariant === 'h2' ||
    normalizedVariant === 'h3' ||
    normalizedVariant === 'display';

  return (
    <Text
      accessibilityRole={isHeader ? 'header' : undefined}
      style={[
        getVariantStyle(),
        { color: resolveTextColor(), textAlign: align },
        weight ? { fontWeight: TypoTokens.fontWeight[weight] } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
