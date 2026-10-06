import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BioPulseColors } from '../../constants/Colors';
import { useReducedMotion } from '../../utils/animations';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');

interface SplashBrandHeaderProps {
  isCompact?: boolean;
}

export const SplashBrandHeader: React.FC<SplashBrandHeaderProps> = ({
  isCompact = false,
}) => {
  const isReduced = useReducedMotion();
  const opacity = useSharedValue(isReduced ? 1 : 0);
  const translateY = useSharedValue(isReduced ? 0 : -8);

  React.useEffect(() => {
    if (isReduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [isReduced, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const emblemSize = isCompact ? 46 : 56;
  const titleSize = isCompact ? 22 : 26;
  const subtitleSize = isCompact ? 9 : 10.5;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* BioPulse Heart & Pulse Vector Emblem */}
      <View style={[styles.emblemContainer, { width: emblemSize, height: emblemSize }]}>
        <Image
          source={HEART_EMBLEM}
          style={{ width: emblemSize, height: emblemSize }}
          resizeMode="contain"
          accessible
          accessibilityLabel="BioPulse AI Heart and Pulse Emblem"
        />
      </View>

      {/* BioPulse AI Wordmark */}
      <View style={styles.titleRow}>
        <Text style={[styles.titleBrand, { fontSize: titleSize }]}>
          BioPulse
        </Text>
        <Text style={[styles.titleAccent, { fontSize: titleSize }]}>
          {' '}AI
        </Text>
      </View>

      {/* Gender-Inclusive Subtitle */}
      <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
        PERSONALIZED HEALTH INTELLIGENCE
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  titleBrand: {
    color: BioPulseColors.navy,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  titleAccent: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: BioPulseColors.secondaryText,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 3,
    textAlign: 'center',
  },
});
