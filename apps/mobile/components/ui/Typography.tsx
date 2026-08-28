import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'subtitle';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: keyof typeof TypoTokens.fontWeight;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  weight,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const theme = useThemeColor();

  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: TypoTokens.fontSize['3xl'],
          lineHeight: TypoTokens.lineHeight['3xl'],
          fontWeight: TypoTokens.fontWeight.bold,
          color: color || theme.textPrimary,
        };
      case 'h2':
        return {
          fontSize: TypoTokens.fontSize['2xl'],
          lineHeight: TypoTokens.lineHeight['2xl'],
          fontWeight: TypoTokens.fontWeight.bold,
          color: color || theme.textPrimary,
        };
      case 'h3':
        return {
          fontSize: TypoTokens.fontSize.xl,
          lineHeight: TypoTokens.lineHeight.xl,
          fontWeight: TypoTokens.fontWeight.semibold,
          color: color || theme.textPrimary,
        };
      case 'subtitle':
        return {
          fontSize: TypoTokens.fontSize.base,
          lineHeight: TypoTokens.lineHeight.base,
          fontWeight: TypoTokens.fontWeight.medium,
          color: color || theme.textSecondary,
        };
      case 'caption':
        return {
          fontSize: TypoTokens.fontSize.xs,
          lineHeight: TypoTokens.lineHeight.xs,
          fontWeight: TypoTokens.fontWeight.regular,
          color: color || theme.textMuted,
        };
      case 'body':
      default:
        return {
          fontSize: TypoTokens.fontSize.sm,
          lineHeight: TypoTokens.lineHeight.sm,
          fontWeight: TypoTokens.fontWeight.regular,
          color: color || theme.textSecondary,
        };
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        weight ? { fontWeight: TypoTokens.fontWeight[weight] } : undefined,
        { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
