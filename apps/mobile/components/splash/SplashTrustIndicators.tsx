import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BioPulseColors } from '../../constants/Colors';
import { useReducedMotion } from '../../utils/animations';

interface SplashTrustIndicatorsProps {
  isCompact?: boolean;
}

export const SplashTrustIndicators: React.FC<SplashTrustIndicatorsProps> = ({
  isCompact = false,
}) => {
  const isReduced = useReducedMotion();
  const opacity = useSharedValue(isReduced ? 1 : 0);
  const translateY = useSharedValue(isReduced ? 0 : 8);

  React.useEffect(() => {
    if (isReduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.quad),
    });
    translateY.value = withTiming(0, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [isReduced, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const circleSize = isCompact ? 44 : 50;
  const iconSize = isCompact ? 20 : 23;
  const textFontSize = isCompact ? 11 : 12;
  const textLineHeight = isCompact ? 15 : 16.5;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* 1. Evidence-Based Insights */}
      <View style={styles.column}>
        <View
          style={[
            styles.iconCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: BioPulseColors.indicatorLeftBg,
            },
          ]}
        >
          <Ionicons
            name="bar-chart"
            size={iconSize}
            color={BioPulseColors.femaleAccent}
          />
        </View>
        <Text
          style={[
            styles.label,
            { fontSize: textFontSize, lineHeight: textLineHeight },
          ]}
          numberOfLines={2}
        >
          {'Evidence-Based\nInsights'}
        </Text>
      </View>

      {/* Divider 1 */}
      <View style={styles.divider} />

      {/* 2. Your Privacy Our Priority */}
      <View style={styles.column}>
        <View
          style={[
            styles.iconCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: BioPulseColors.indicatorCenterBg,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={iconSize}
            color={BioPulseColors.teal}
          />
        </View>
        <Text
          style={[
            styles.label,
            { fontSize: textFontSize, lineHeight: textLineHeight },
          ]}
          numberOfLines={2}
        >
          {'Your Privacy\nOur Priority'}
        </Text>
      </View>

      {/* Divider 2 */}
      <View style={styles.divider} />

      {/* 3. Non-Diagnostic Support */}
      <View style={styles.column}>
        <View
          style={[
            styles.iconCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: BioPulseColors.indicatorRightBg,
            },
          ]}
        >
          <Ionicons
            name="heart-outline"
            size={iconSize}
            color={BioPulseColors.femaleAccent}
          />
        </View>
        <Text
          style={[
            styles.label,
            { fontSize: textFontSize, lineHeight: textLineHeight },
          ]}
          numberOfLines={2}
        >
          {'Non-Diagnostic\nSupport'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 12,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    color: BioPulseColors.navy,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  divider: {
    width: 1,
    height: 42,
    backgroundColor: BioPulseColors.borderSubtle,
    marginTop: 6,
  },
});
