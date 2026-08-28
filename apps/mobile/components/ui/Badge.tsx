import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type BadgeStyle = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  badgeStyle?: BadgeStyle;
  size?: BadgeSize;
  showDot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  badgeStyle = 'soft',
  size = 'md',
  showDot = false,
  style,
  textStyle,
}) => {
  const theme = useThemeColor();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          solidBg: theme.primary,
          softBg: theme.primarySoft,
          textColor: theme.primary,
          borderColor: theme.primaryLight,
          dotColor: theme.primary,
        };
      case 'success':
        return {
          solidBg: theme.success,
          softBg: theme.successSoft,
          textColor: theme.success,
          borderColor: theme.successBorder,
          dotColor: theme.success,
        };
      case 'warning':
        return {
          solidBg: theme.warning,
          softBg: theme.warningSoft,
          textColor: theme.warning,
          borderColor: theme.warningBorder,
          dotColor: theme.warning,
        };
      case 'error':
        return {
          solidBg: theme.error,
          softBg: theme.errorSoft,
          textColor: theme.error,
          borderColor: theme.errorBorder,
          dotColor: theme.error,
        };
      case 'info':
        return {
          solidBg: theme.info,
          softBg: theme.infoSoft,
          textColor: theme.info,
          borderColor: theme.infoBorder,
          dotColor: theme.info,
        };
      case 'neutral':
      default:
        return {
          solidBg: theme.textSecondary,
          softBg: theme.surfaceSubtle,
          textColor: theme.textSecondary,
          borderColor: theme.border,
          dotColor: theme.textMuted,
        };
    }
  };

  const colors = getVariantColors();

  const getContainerStyle = (): ViewStyle => {
    switch (badgeStyle) {
      case 'solid':
        return {
          backgroundColor: colors.solidBg,
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.borderColor,
          borderWidth: 1,
        };
      case 'soft':
      default:
        return {
          backgroundColor: colors.softBg,
          borderColor: colors.borderColor,
          borderWidth: 1,
        };
    }
  };

  const getResolvedTextColor = (): string => {
    if (badgeStyle === 'solid') return '#FFFFFF';
    return colors.textColor;
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 2,
          paddingHorizontal: Spacing.xs + 2,
          borderRadius: BorderRadius.full,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.full,
        };
      case 'md':
      default:
        return {
          paddingVertical: 3,
          paddingHorizontal: Spacing.sm + 2,
          borderRadius: BorderRadius.full,
        };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 10;
      case 'lg':
        return TypoTokens.fontSize.bodySmall;
      case 'md':
      default:
        return TypoTokens.fontSize.caption;
    }
  };

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.base,
        getSizeStyle(),
        getContainerStyle(),
        style,
      ]}
    >
      {showDot ? (
        <View
          style={[
            styles.dot,
            {
              backgroundColor:
                badgeStyle === 'solid' ? '#FFFFFF' : colors.dotColor,
            },
          ]}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          {
            color: getResolvedTextColor(),
            fontSize: getFontSize(),
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  text: {
    fontWeight: TypoTokens.fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
