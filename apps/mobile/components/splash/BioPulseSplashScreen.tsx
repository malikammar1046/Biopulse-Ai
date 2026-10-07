import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../common/BioPulseBackground';
import { Logo } from '../brand/Logo';

export interface BioPulseSplashScreenProps {
  /** Optional callback fired when initialization has completed */
  onInitializationComplete?: () => void;
  /** Minimum duration in milliseconds the splash screen is displayed (default: 2000ms) */
  minDisplayTimeMs?: number;
  /** If true, fires onInitializationComplete automatically after initialization */
  autoNavigate?: boolean;
}

/**
 * Screen 1: Splash Screen
 * 
 * Rebuild matching Screenshot 1:
 * - BioPulse AI logo (3D heart & vitality emblem)
 * - Tagline: "Understand Today. A Healthier Tomorrow."
 * - Soft pathway-neutral teal background with very subtle pink + blue ambient accents
 * - Rotating minimalist circular loading spinner
 * - Auto-navigates cleanly to Welcome / Intro Screen
 * - Fallback continue button only if loading takes unexpectedly long
 */
export const BioPulseSplashScreen: React.FC<BioPulseSplashScreenProps> = ({
  onInitializationComplete,
  minDisplayTimeMs = 2000,
  autoNavigate = true,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [showManualContinue, setShowManualContinue] = useState(false);

  // Rotation animation for the subtle loading spinner
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in brand lockup smoothly
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Continuous spin for the circular loader
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // Timer for initialization transition
    const startTime = Date.now();
    let isMounted = true;

    const timer = setTimeout(() => {
      if (isMounted && autoNavigate && onInitializationComplete) {
        onInitializationComplete();
      }
    }, minDisplayTimeMs);

    // Fallback if loading takes longer than 6 seconds
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setShowManualContinue(true);
      }
    }, 6000);

    return () => {
      isMounted = false;
      spinLoop.stop();
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [minDisplayTimeMs, autoNavigate, onInitializationComplete]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Main Centered Content */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Logo
            size={height < 700 ? 'lg' : 'xl'}
            layout="vertical"
            showText={true}
            showTagline={true}
            tagline="Understand Today. A Healthier Tomorrow."
          />
        </View>

        {/* Minimalist Circular Loader at Bottom */}
        <View style={styles.bottomLoaderContainer}>
          <Animated.View
            style={[
              styles.spinnerRing,
              { transform: [{ rotate: spinInterpolation }] },
            ]}
          />

          {showManualContinue && (
            <Pressable
              onPress={() => onInitializationComplete && onInitializationComplete()}
              style={styles.continueButton}
              hitSlop={12}
            >
              <Text style={styles.continueButtonText}>Tap to continue</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </BioPulseBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  bottomLoaderContainer: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: 'rgba(22, 184, 196, 0.25)',
    borderTopColor: BioPulseColors.teal,
  },
  continueButton: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
  },
  continueButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.teal,
  },
});
