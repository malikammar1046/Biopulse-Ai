import React from 'react';
import {
  View,
  ViewProps,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { BorderRadius, Spacing, Shadows } from '../../constants/Layout';
import { useThemeColor } from '../../hooks/useThemeColor';
import { usePressAnimation } from '../../utils/animations';

export type CardVariant = 'standard' | 'elevated' | 'subtle';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  padding = 'lg',
  onPress,
  accessibilityLabel,
  style,
  children,
  ...props
}) => {
  const theme = useThemeColor();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.985, 0.96);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.cardBorder,
          ...Shadows.card,
        };
      case 'subtle':
        return {
          backgroundColor: theme.surfaceSubtle,
          borderColor: 'transparent',
        };
      case 'standard':
      default:
        return {
          backgroundColor: theme.surface,
          borderColor: theme.cardBorder,
          ...Shadows.subtle,
        };
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: Spacing.sm };
      case 'md':
        return { padding: Spacing.md };
      case 'xl':
        return { padding: Spacing.xl };
      case 'lg':
      default:
        return { padding: Spacing.lg };
    }
  };

  if (onPress) {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.base,
          getVariantStyle(),
          getPaddingStyle(),
          animatedStyle,
          style,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.base,
        getVariantStyle(),
        getPaddingStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
