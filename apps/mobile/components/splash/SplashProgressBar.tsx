import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { BioPulseColors } from '../../constants/Colors';
import { useReducedMotion } from '../../utils/animations';

interface SplashProgressBarProps {
  /** Optional measurable progress between 0 and 1. If undefined, runs indeterminate animation */
  progress?: number;
  message?: string;
  isCompact?: boolean;
}

export const SplashProgressBar: React.FC<SplashProgressBarProps> = ({
  progress,
  message = 'Loading your personalized experience...',
  isCompact = false,
}) => {
  const isReduced = useReducedMotion();
  const trackWidth = isCompact ? 190 : 220;
  const trackHeight = isCompact ? 5 : 6;
  const isIndeterminate = typeof progress !== 'number';

  // Indeterminate animated translation
  const sweepAnim = useSharedValue(0);
  // Determinate width percentage
  const fillPercent = useSharedValue(progress !== undefined ? Math.min(Math.max(progress, 0), 1) * 100 : 45);

  useEffect(() => {
    if (isIndeterminate) {
      if (isReduced) {
        sweepAnim.value = 0.5;
        return;
      }
      sweepAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );
      return () => {
        cancelAnimation(sweepAnim);
      };
    } else {
      fillPercent.value = withTiming(Math.min(Math.max(progress!, 0), 1) * 100, {
        duration: 350,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isIndeterminate, isReduced, progress, sweepAnim, fillPercent]);

  const animatedFillStyle = useAnimatedStyle(() => {
    if (isIndeterminate) {
      // The fill segment is ~48% width of the track, sweeping back and forth smoothly
      const segmentWidth = trackWidth * 0.48;
      const maxTranslate = trackWidth - segmentWidth;
      return {
        width: segmentWidth,
        transform: [{ translateX: sweepAnim.value * maxTranslate }],
      };
    }
    return {
      width: `${fillPercent.value}%`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Loading Track */}
      <View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel={message}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height: trackHeight,
              borderRadius: trackHeight / 2,
            },
            animatedFillStyle,
          ]}
        />
      </View>

      {/* Loading Message */}
      <Text style={[styles.message, { fontSize: isCompact ? 11.5 : 12.5 }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  track: {
    backgroundColor: BioPulseColors.progressTrack,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  fill: {
    backgroundColor: BioPulseColors.progressFill,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  message: {
    color: BioPulseColors.secondaryText,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
