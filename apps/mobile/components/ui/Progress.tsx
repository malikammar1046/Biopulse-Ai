import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export type ProgressVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  style,
}) => {
  const theme = useThemeColor();
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = Math.round((clampedValue / max) * 100);

  const progressShared = useSharedValue(percentage);

  useEffect(() => {
    progressShared.value = withTiming(percentage, {
      duration: 350,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [percentage, progressShared]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progressShared.value}%`,
  }));

  const getVariantColor = (): string => {
    switch (variant) {
      case 'secondary':
        return theme.secondary;
      case 'accent':
        return theme.accent;
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

  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        return 4;
      case 'lg':
        return 12;
      case 'md':
      default:
        return 8;
    }
  };

  const fillColor = getVariantColor();
  const barHeight = getHeight();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: clampedValue }}
      accessibilityLabel={label || `Progress: ${percentage}%`}
      style={[styles.container, style]}
    >
      {showLabel || label ? (
        <View style={styles.labelRow}>
          {label ? (
            <Text style={[styles.labelText, { color: theme.textSecondary }]}>
              {label}
            </Text>
          ) : <View />}
          {showLabel ? (
            <Text style={[styles.percentageText, { color: theme.textPrimary }]}>
              {percentage}%
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.track,
          {
            height: barHeight,
            backgroundColor: theme.surfaceSubtle,
            borderRadius: BorderRadius.full,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height: barHeight,
              backgroundColor: fillColor,
              borderRadius: BorderRadius.full,
            },
            animatedBarStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  labelText: {
    fontSize: TypoTokens.fontSize.caption,
    fontWeight: TypoTokens.fontWeight.medium,
  },
  percentageText: {
    fontSize: TypoTokens.fontSize.caption,
    fontWeight: TypoTokens.fontWeight.semibold,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
