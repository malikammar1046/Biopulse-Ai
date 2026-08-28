import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { BorderRadius, TouchTarget } from '../../constants/Layout';
import { useThemeColor } from '../../hooks/useThemeColor';
import { usePressAnimation } from '../../utils/animations';

export type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'subtle';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  icon: React.ReactNode;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  accessibilityLabel,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  onPress,
  ...props
}) => {
  const theme = useThemeColor();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.95, 0.85);
  const isInteractive = !disabled && !loading;

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          width: TouchTarget.min,
          height: TouchTarget.min,
          borderRadius: BorderRadius.full,
        };
      case 'lg':
        return {
          width: 52,
          height: 52,
          borderRadius: BorderRadius.full,
        };
      case 'md':
      default:
        return {
          width: 44,
          height: 44,
          borderRadius: BorderRadius.full,
        };
    }
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: theme.primarySoft,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.border,
          borderWidth: 1,
        };
      case 'subtle':
        return {
          backgroundColor: theme.surfaceSubtle,
          borderWidth: 0,
        };
      case 'ghost':
      default:
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const getSpinnerColor = (): string => {
    if (variant === 'primary') return '#FFFFFF';
    return theme.primary;
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      disabled={!isInteractive}
      onPress={isInteractive ? onPress : undefined}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.base,
        getSizeStyle(),
        getContainerStyle(),
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : (
        icon
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
