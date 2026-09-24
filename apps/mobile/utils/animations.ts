import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';

export const AnimationPresets = {
  spring: {
    damping: 18,
    stiffness: 220,
    mass: 0.8,
  } as WithSpringConfig,
  gentleSpring: {
    damping: 24,
    stiffness: 160,
    mass: 1.0,
  } as WithSpringConfig,
  timing: {
    duration: 250,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } as WithTimingConfig,
  fastTiming: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } as WithTimingConfig,
};

/**
 * Hook to detect whether user has requested reduced motion.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

/**
 * Subtle press animation providing natural tactile feedback for buttons and interactive cards.
 */
export function usePressAnimation(scaleTarget = 0.97, opacityTarget = 0.9) {
  const isReduced = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const onPressIn = () => {
    if (isReduced) return;
    scale.value = withSpring(scaleTarget, AnimationPresets.spring);
    opacity.value = withTiming(opacityTarget, AnimationPresets.fastTiming);
  };

  const onPressOut = () => {
    if (isReduced) return;
    scale.value = withSpring(1, AnimationPresets.spring);
    opacity.value = withTiming(1, AnimationPresets.fastTiming);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
}

/**
 * Smooth fade-in animation hook on component mount.
 */
export function useFadeIn(delay = 0, duration = 300) {
  const isReduced = useReducedMotion();
  const opacity = useSharedValue(isReduced ? 1 : 0);

  useEffect(() => {
    if (isReduced) {
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [isReduced, delay, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, opacity };
}

/**
 * Directional slide-and-fade entry animation.
 */
export function useSlideIn(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  offset = 20,
  duration = 300
) {
  const isReduced = useReducedMotion();
  const opacity = useSharedValue(isReduced ? 1 : 0);
  const translation = useSharedValue(
    isReduced
      ? 0
      : direction === 'up' || direction === 'left'
      ? offset
      : -offset
  );

  useEffect(() => {
    if (isReduced) {
      opacity.value = 1;
      translation.value = 0;
      return;
    }
    opacity.value = withTiming(1, { duration });
    translation.value = withSpring(0, AnimationPresets.gentleSpring);
  }, [isReduced, duration, opacity, translation]);

  const animatedStyle = useAnimatedStyle(() => {
    const isHorizontal = direction === 'left' || direction === 'right';
    return {
      opacity: opacity.value,
      transform: isHorizontal
        ? [{ translateX: translation.value }]
        : [{ translateY: translation.value }],
    };
  });

  return { animatedStyle };
}

/**
 * Subtle organic scale-in entry.
 */
export function useScaleIn(initialScale = 0.94, duration = 280) {
  const isReduced = useReducedMotion();
  const scale = useSharedValue(isReduced ? 1 : initialScale);
  const opacity = useSharedValue(isReduced ? 1 : 0);

  useEffect(() => {
    if (isReduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withSpring(1, AnimationPresets.gentleSpring);
    opacity.value = withTiming(1, { duration });
  }, [isReduced, duration, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle };
}
