import React from 'react';
import {
  Pressable,
  PressableProps,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { BorderRadius, Spacing, TouchTarget } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';
import { usePressAnimation } from '../../utils/animations';

export type ChipVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface ChipProps extends Omit<PressableProps, 'style'> {
  label: string;
  selected?: boolean;
  variant?: ChipVariant;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  variant = 'primary',
  disabled = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const theme = useThemeColor();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.96, 0.9);

  const getVariantColor = (): string => {
    switch (variant) {
      case 'neutral':
        return theme.textSecondary;
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'error':
        return theme.error;
      case 'info':
        return theme.info;
      case 'primary':
      default:
        return theme.primary;
    }
  };

  const activeColor = getVariantColor();

  const getContainerStyle = (): ViewStyle => {
    if (selected) {
      return {
        backgroundColor: theme.primarySoft,
        borderColor: activeColor,
        borderWidth: 1.5,
      };
    }
    return {
      backgroundColor: theme.surfaceSubtle,
      borderColor: theme.border,
      borderWidth: 1,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return theme.textMuted;
    if (selected) return activeColor;
    return theme.textSecondary;
  };

  return (
    <AnimatedPressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.base,
        getContainerStyle(),
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
      <Text
        style={[
          styles.text,
          { color: getTextColor() },
          selected && styles.selectedText,
          textStyle,
        ]}
      >
        {label}
      </Text>
      {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: TouchTarget.min,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: TypoTokens.fontSize.bodySmall,
    fontWeight: TypoTokens.fontWeight.medium,
  },
  selectedText: {
    fontWeight: TypoTokens.fontWeight.semibold,
  },
  iconLeft: {
    marginRight: Spacing.xs + 2,
  },
  iconRight: {
    marginLeft: Spacing.xs + 2,
  },
  disabled: {
    opacity: 0.45,
  },
});
