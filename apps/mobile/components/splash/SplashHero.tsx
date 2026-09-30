import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../utils/animations';

const HERO_IMAGE = require('../../assets/hero_artwork.png');
const ORIGINAL_ASPECT_RATIO = 458 / 355; // ~1.29

interface SplashHeroProps {
  maxAllowedHeight?: number;
}

export const SplashHero: React.FC<SplashHeroProps> = ({ maxAllowedHeight }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isReduced = useReducedMotion();
  const opacity = useSharedValue(isReduced ? 1 : 0);
  const scale = useSharedValue(isReduced ? 1 : 0.98);

  React.useEffect(() => {
    if (isReduced) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    opacity.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [isReduced, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Dynamic responsive dimensions
  const maxWidth = Math.min(windowWidth, 480);
  const defaultMaxHeight = Math.min(windowHeight * 0.38, 330);
  const targetMaxHeight = maxAllowedHeight || defaultMaxHeight;

  // Compute width and height keeping aspect ratio within boundaries
  let renderWidth = maxWidth;
  let renderHeight = renderWidth / ORIGINAL_ASPECT_RATIO;
  if (renderHeight > targetMaxHeight) {
    renderHeight = targetMaxHeight;
    renderWidth = renderHeight * ORIGINAL_ASPECT_RATIO;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.imageWrapper,
          {
            width: renderWidth,
            height: renderHeight,
            maxHeight: targetMaxHeight,
          },
        ]}
      >
        <Image
          source={HERO_IMAGE}
          style={[styles.image, { width: renderWidth, height: renderHeight }]}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel="BioPulse AI personalized health intelligence for women and men"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    // Dynamic width & height provided inline
  },
});
