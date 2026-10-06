import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { BioPulseColors } from '../../constants/Colors';
import { SplashBrandHeader } from './SplashBrandHeader';
import { SplashHeadline } from './SplashHeadline';
import { SplashHero } from './SplashHero';
import { SplashTrustIndicators } from './SplashTrustIndicators';
import { SplashProgressBar } from './SplashProgressBar';
import { SplashBackgroundFoliage } from './SplashBackgroundFoliage';

export interface BioPulseSplashScreenProps {
  /** Optional callback fired when initialization has completed */
  onInitializationComplete?: () => void;
  /** Minimum duration in milliseconds the splash screen is displayed (default: 1800ms) */
  minDisplayTimeMs?: number;
  /** Custom progress between 0 and 1, or undefined for indeterminate smooth pulsing */
  progress?: number;
  /** Custom message below progress bar */
  loadingMessage?: string;
  /** If true, fires onInitializationComplete automatically after initialization */
  autoNavigate?: boolean;
}

export const BioPulseSplashScreen: React.FC<BioPulseSplashScreenProps> = ({
  onInitializationComplete,
  minDisplayTimeMs = 1800,
  progress,
  loadingMessage = 'Loading your personalized experience...',
  autoNavigate = true,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isInitialized, setIsInitialized] = useState(false);

  // Responsive breakpoints
  const isShortScreen = windowHeight < 720;
  const isVeryShortScreen = windowHeight < 620;
  const isNarrowScreen = windowWidth < 360;
  const isCompact = isShortScreen || isNarrowScreen;

  // Dynamic spacing based on available height
  const topSafePad = Math.max(insets.top, Platform.OS === 'android' ? 12 : 8);
  const bottomSafePad = Math.max(insets.bottom, 16);

  // Vertical gaps
  const brandToHeadlineGap = isVeryShortScreen ? 6 : isShortScreen ? 10 : 16;
  const headlineToHeroGap = isVeryShortScreen ? 4 : isShortScreen ? 8 : 12;
  const heroToTrustGap = isVeryShortScreen ? 8 : isShortScreen ? 12 : 18;
  const trustToLoadingGap = isVeryShortScreen ? 12 : isShortScreen ? 16 : 24;

  // Calculate max allowed hero height so the layout never overflows
  const availableContentHeight =
    windowHeight - topSafePad - bottomSafePad - (isCompact ? 320 : 380);
  const maxHeroHeight = Math.max(
    Math.min(availableContentHeight, isCompact ? 240 : 330),
    160
  );

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    const runStartupInitialization = async () => {
      try {
        // App startup initialization tasks (e.g. font verification, state hydration)
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, minDisplayTimeMs - elapsed);

        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        if (isMounted) {
          setIsInitialized(true);
          if (autoNavigate && onInitializationComplete) {
            onInitializationComplete();
          }
        }
      } catch (error) {
        console.warn('BioPulse startup initialization error:', error);
        if (isMounted) {
          setIsInitialized(true);
          if (autoNavigate && onInitializationComplete) {
            onInitializationComplete();
          }
        }
      }
    };

    runStartupInitialization();

    return () => {
      isMounted = false;
    };
  }, [minDisplayTimeMs, autoNavigate, onInitializationComplete]);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: topSafePad,
          paddingBottom: bottomSafePad,
        },
      ]}
      accessibilityRole="none"
      accessibilityLabel="BioPulse AI Launch Screen"
    >
      <StatusBar style="dark" backgroundColor={BioPulseColors.background} />

      {/* Decorative botanical leaf accents in upper margins */}
      <SplashBackgroundFoliage topOffset={topSafePad} />

      {/* Central responsive content column */}
      <View
        style={[
          styles.mainContainer,
          {
            maxWidth: Math.min(windowWidth, 480),
          },
        ]}
      >
        {/* 1. Branding Section (Heart Logo + Wordmark + Subtitle) */}
        <View style={styles.sectionBranding}>
          <SplashBrandHeader isCompact={isCompact} />
        </View>

        {/* 2. Main Headline Section */}
        <View
          style={[
            styles.sectionHeadline,
            { marginTop: brandToHeadlineGap, marginBottom: headlineToHeroGap },
          ]}
        >
          <SplashHeadline isCompact={isCompact} />
        </View>

        {/* 3. Hero Artwork Section (Female & Male Wellness Characters + Wave) */}
        <View style={styles.sectionHero}>
          <SplashHero maxAllowedHeight={maxHeroHeight} />
        </View>

        {/* 4. Trust & Value Indicators Section */}
        <View
          style={[
            styles.sectionTrust,
            { marginTop: heroToTrustGap, marginBottom: trustToLoadingGap },
          ]}
        >
          <SplashTrustIndicators isCompact={isCompact} />
        </View>

        {/* 5. Progress Indicator & Loading Message Section */}
        <View style={styles.sectionLoading}>
          <SplashProgressBar
            progress={progress}
            message={loadingMessage}
            isCompact={isCompact}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BioPulseColors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    overflow: 'hidden',
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  sectionBranding: {
    width: '100%',
    alignItems: 'center',
  },
  sectionHeadline: {
    width: '100%',
    alignItems: 'center',
  },
  sectionHero: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTrust: {
    width: '100%',
    alignItems: 'center',
  },
  sectionLoading: {
    width: '100%',
    alignItems: 'center',
  },
});
