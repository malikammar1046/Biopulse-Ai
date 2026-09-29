import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { BioPulseColors } from '../../constants/Colors';
import { useReducedMotion } from '../../utils/animations';
import { OnboardingHeader } from './OnboardingHeader';
import { OnboardingFeatureRow } from './OnboardingFeatureRow';
import { OnboardingTrustStrip } from './OnboardingTrustStrip';
import { OnboardingPaginationDots } from './OnboardingPaginationDots';

const DUAL_HERO_IMAGE = require('../../assets/onboarding_dual_hero.png');

export interface BioPulseOnboardingIntroScreenProps {
  onGetStarted?: () => void;
  onSkip?: () => void;
  onSignIn?: () => void;
}

export const BioPulseOnboardingIntroScreen: React.FC<BioPulseOnboardingIntroScreenProps> = ({
  onGetStarted,
  onSkip,
  onSignIn,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isReduced = useReducedMotion();

  // Responsive layout breakpoints
  const isShortScreen = windowHeight < 720;
  const isVeryShortScreen = windowHeight < 620;
  const isNarrowScreen = windowWidth < 360;
  const isCompact = isShortScreen || isNarrowScreen;

  // Safe area padding
  const topSafePad = Math.max(insets.top, Platform.OS === 'android' ? 12 : 8);
  const bottomSafePad = Math.max(insets.bottom, 16);

  // Subtle entrance animation
  const opacity = useSharedValue(isReduced ? 1 : 0);
  const translateY = useSharedValue(isReduced ? 0 : 8);

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

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Responsive typography
  const headlineSize = isVeryShortScreen ? 23 : isShortScreen ? 26 : 30;
  const headlineLineHeight = isVeryShortScreen ? 29 : isShortScreen ? 32 : 36;
  const introSize = isVeryShortScreen ? 12 : isShortScreen ? 13 : 14;
  const introLineHeight = isVeryShortScreen ? 17 : isShortScreen ? 19 : 20.5;

  // Responsive hero dimensions
  const heroHeight = isVeryShortScreen ? 190 : isShortScreen ? 230 : 280;
  const heroWidth = Math.round(heroHeight * (458 / 355));

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
      accessibilityLabel="BioPulse AI Introduction Screen"
    >
      <StatusBar style="dark" backgroundColor={BioPulseColors.background} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: Math.min(windowWidth, 480),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.innerContent, animatedContentStyle]}>
          {/* 1. Header (Brand lockup + Skip) */}
          <OnboardingHeader onSkip={onSkip} isCompact={isCompact} />

          {/* 2. Intro Section (Headline + Copy) */}
          <View style={[styles.introSection, { marginTop: isCompact ? 10 : 16 }]}>
            <Text style={[styles.headlineNavy, { fontSize: headlineSize, lineHeight: headlineLineHeight }]}>
              Your health.
            </Text>
            <Text style={[styles.headlinePink, { fontSize: headlineSize, lineHeight: headlineLineHeight }]}>
              Better understood.
            </Text>
            <Text style={[styles.introDescription, { fontSize: introSize, lineHeight: introLineHeight }]}>
              AI-assisted screening and personalized guidance for female and male hormonal health.
            </Text>
          </View>

          {/* 3. Main Composition: Feature List + Dual-Gender Illustration */}
          <View style={[styles.middleSection, { minHeight: heroHeight }]}>
            {/* Background Dual-Pathway Hero Artwork (Female on left, Male on right) */}
            <View
              style={[
                styles.heroContainer,
                {
                  width: heroWidth,
                  height: heroHeight,
                  right: isNarrowScreen ? -50 : -25,
                },
              ]}
              pointerEvents="none"
              accessible={false}
            >
              <Image
                source={DUAL_HERO_IMAGE}
                style={{ width: heroWidth, height: heroHeight }}
                resizeMode="contain"
                accessible={false}
              />
            </View>

            {/* Foreground Feature Rows (Left side) */}
            <View style={[styles.featureListContainer, { width: isNarrowScreen ? '62%' : '60%' }]}>
              <OnboardingFeatureRow
                iconName="stats-chart"
                iconColor={BioPulseColors.femaleAccent}
                circleBg={BioPulseColors.indicatorLeftBg}
                title="AI-Powered Screening"
                description="Understand your health risks early and clearly."
                isCompact={isCompact}
              />

              <OnboardingFeatureRow
                iconName="leaf"
                iconColor={BioPulseColors.teal}
                circleBg={BioPulseColors.indicatorCenterBg}
                title="Personalized Guidance"
                description="Nutrition, fitness and lifestyle recommendations tailored to you."
                isCompact={isCompact}
              />

              <OnboardingFeatureRow
                iconName="people"
                iconColor={BioPulseColors.malePrimary}
                circleBg={BioPulseColors.maleSoft}
                title="Health Journey Support"
                description="Track female or male hormonal health over time."
                isCompact={isCompact}
              />

              <OnboardingFeatureRow
                iconName="shield-checkmark"
                iconColor={BioPulseColors.teal}
                circleBg={BioPulseColors.indicatorCenterBg}
                title="Your Privacy Our Priority"
                description="Your health information stays secure and confidential."
                isCompact={isCompact}
              />
            </View>
          </View>

          {/* 4. Bottom Controls Section (Trust Strip + Dots + CTAs) */}
          <View style={[styles.bottomSection, { marginTop: isCompact ? 10 : 16 }]}>
            {/* Trust / Positioning Strip */}
            <OnboardingTrustStrip isCompact={isCompact} />

            {/* Pagination Dots (Slide 1 of 4) */}
            <View style={{ marginVertical: isCompact ? 8 : 12 }}>
              <OnboardingPaginationDots totalDots={4} activeIndex={0} />
            </View>

            {/* Primary CTA: Get Started */}
            <Pressable
              onPress={onGetStarted}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Get Started with BioPulse AI"
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
                style={styles.buttonArrow}
              />
            </Pressable>

            {/* Secondary CTA: I already have an account */}
            <Pressable
              onPress={onSignIn}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { backgroundColor: '#FDF0F4' },
              ]}
              accessibilityRole="button"
              accessibilityLabel="I already have an account, sign in"
            >
              <Text style={styles.secondaryButtonText}>
                I already have an account
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BioPulseColors.background,
    alignItems: 'center',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  innerContent: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  },
  introSection: {
    width: '100%',
    marginBottom: 6,
  },
  headlineNavy: {
    color: BioPulseColors.navy,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headlinePink: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  introDescription: {
    color: BioPulseColors.secondaryText,
    fontWeight: '400',
    maxWidth: 340,
  },
  middleSection: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 4,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  featureListContainer: {
    zIndex: 2,
    justifyContent: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    backgroundColor: BioPulseColors.femaleAccent,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  buttonArrow: {
    marginLeft: 6,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: BioPulseColors.femaleAccent,
    borderRadius: 14,
    marginBottom: 4,
  },
  secondaryButtonText: {
    color: BioPulseColors.femaleAccent,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
