import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BioPulseColors } from '../../constants/Colors';
import { useReducedMotion } from '../../utils/animations';

interface SplashHeadlineProps {
  isCompact?: boolean;
}

export const SplashHeadline: React.FC<SplashHeadlineProps> = ({
  isCompact = false,
}) => {
  const isReduced = useReducedMotion();
  const opacity = useSharedValue(isReduced ? 1 : 0);
  const translateY = useSharedValue(isReduced ? 0 : 6);

  React.useEffect(() => {
    if (isReduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
    translateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [isReduced, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const fontSize = isCompact ? 20 : 25;
  const lineHeight = isCompact ? 26 : 32;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text
        style={[styles.linePrimary, { fontSize, lineHeight }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        Understand Today.
      </Text>
      <Text
        style={[styles.lineSecondary, { fontSize, lineHeight }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        <Text style={styles.highlight}>A Healthier </Text>
        <Text style={styles.linePrimary}>Tomorrow.</Text>
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  linePrimary: {
    color: BioPulseColors.navy,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  lineSecondary: {
    textAlign: 'center',
  },
  highlight: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
