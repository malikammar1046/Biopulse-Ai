import React from 'react';
import {
  Pressable,
  PressableProps,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { BorderRadius, Spacing, TouchTarget } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';
import { usePressAnimation } from '../../utils/animations';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const theme = useThemeColor();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.97, 0.9);
  const isInteractive = !disabled && !loading;

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.primarySoft,
          borderColor: 'transparent',
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.primary,
          borderWidth: 1.5,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 1.5,
        };
      case 'destructive':
        return {
          backgroundColor: theme.error,
          borderColor: theme.error,
          borderWidth: 1,
        };
      case 'primary':
      default:
        return {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          borderWidth: 1,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'secondary':
        return theme.primary;
      case 'outline':
        return theme.primary;
      case 'ghost':
        return theme.textPrimary;
      case 'destructive':
        return '#FFFFFF';
      case 'primary':
      default:
        return '#FFFFFF';
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          minHeight: TouchTarget.min,
          paddingVertical: Spacing.xs + 2,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.md,
        };
      case 'lg':
        return {
          minHeight: 54,
          paddingVertical: Spacing.md + 2,
          paddingHorizontal: Spacing['2xl'],
          borderRadius: BorderRadius.xl,
        };
      case 'md':
      default:
        return {
          minHeight: TouchTarget.min + 4,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xl,
          borderRadius: BorderRadius.lg,
        };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return TypoTokens.fontSize.bodySmall;
      case 'lg':
        return TypoTokens.fontSize.base;
      case 'md':
      default:
        return TypoTokens.fontSize.button;
    }
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={label}
      disabled={!isInteractive}
      onPress={isInteractive ? onPress : undefined}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.base,
        getSizeStyle(),
        getContainerStyle(),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size={size === 'sm' ? 'small' : 'small'}
          style={styles.spinner}
        />
      ) : (
        <View style={styles.contentRow}>
          {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: TypoTokens.fontWeight.semibold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  spinner: {
    paddingVertical: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
