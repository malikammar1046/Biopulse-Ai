import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Spacing, BorderRadius } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useReducedMotion } from '../../utils/animations';

export interface LoadingIndicatorProps {
  label?: string;
  size?: 'small' | 'large';
  color?: string;
  orb?: boolean;
  style?: ViewStyle;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  label,
  size = 'small',
  color,
  orb = false,
  style,
}) => {
  const theme = useThemeColor();
  const isReduced = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  const activeColor = color || theme.primary;

  useEffect(() => {
    if (isReduced || !orb) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [isReduced, orb, opacity, scale]);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label || 'Loading content'}
      accessibilityState={{ busy: true }}
      style={[styles.container, style]}
    >
      {orb ? (
        <View style={styles.orbWrapper}>
          <Animated.View
            style={[
              styles.pulsingOuterOrb,
              { backgroundColor: theme.primarySoft },
              animatedOrbStyle,
            ]}
          />
          <View
            style={[
              styles.innerCoreOrb,
              { backgroundColor: activeColor },
            ]}
          />
        </View>
      ) : (
        <ActivityIndicator color={activeColor} size={size} />
      )}

      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  orbWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulsingOuterOrb: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  innerCoreOrb: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
  },
  label: {
    marginTop: Spacing.sm,
    fontSize: TypoTokens.fontSize.bodySmall,
    fontWeight: TypoTokens.fontWeight.medium,
    textAlign: 'center',
  },
});
