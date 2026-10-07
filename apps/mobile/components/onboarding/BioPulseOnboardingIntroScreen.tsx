import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../common/BioPulseBackground';
import { BioPulseButton } from '../common/BioPulseButton';
import { TrustBadgeRow } from '../common/TrustBadgeRow';
import { Logo } from '../brand/Logo';

const WELCOME_HERO_IMAGE = require('../../assets/welcome_hero_artwork.jpg');

export interface BioPulseOnboardingIntroScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
  onSkip?: () => void;
}

/**
 * Screen 2: Welcome / Intro Screen
 *
 * Rebuilt to match Screenshot 2:
 * - BioPulse AI logo centered at top
 * - Stylized glowing dual silhouettes artwork (female & male hormonal health)
 * - Headline: "Your health. Better understood." ("Better understood." in teal)
 * - Subtitle: "AI-powered screening and personalized guidance for PCOS and male hormonal health."
 * - Primary CTA: "Get Started  →"
 * - Secondary CTA: "I already have an account"
 * - Bottom trust indicators: Evidence-based | Private | Non-diagnostic
 */
export const BioPulseOnboardingIntroScreen: React.FC<BioPulseOnboardingIntroScreenProps> = ({
  onGetStarted,
  onSignIn,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Responsive scaling
  const isShortScreen = height < 740;
  const isVeryShortScreen = height < 640;
  const isTablet = width >= 768;

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 16 : 12);
  const bottomPad = Math.max(insets.bottom, 16);

  // Scalable hero dimensions
  const heroSize = isVeryShortScreen
    ? Math.min(width * 0.52, 200)
    : isShortScreen
    ? Math.min(width * 0.62, 240)
    : Math.min(width * 0.72, 300);

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPad + 8,
            paddingBottom: bottomPad + 8,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* 1. Header Logo */}
          <View style={styles.logoSection}>
            <Logo size={isShortScreen ? 'sm' : 'md'} layout="vertical" showTagline={false} />
          </View>

          {/* 2. Central Artwork Hero */}
          <View style={[styles.heroSection, { marginVertical: isShortScreen ? 12 : 20 }]}>
            <View
              style={[
                styles.heroGlowContainer,
                {
                  width: heroSize,
                  height: heroSize,
                  borderRadius: heroSize / 2,
                },
              ]}
            >
              <Image
                source={WELCOME_HERO_IMAGE}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* 3. Text & Value Proposition */}
          <View style={styles.textSection}>
            <Text style={styles.headline}>
              Your health.{'\n'}
              <Text style={styles.headlineAccent}>Better understood.</Text>
            </Text>

            <Text style={styles.subhead}>
              AI-powered screening and personalized guidance for PCOS and male hormonal health.
            </Text>
          </View>

          {/* 4. Action Buttons */}
          <View style={styles.buttonSection}>
            <BioPulseButton
              title="Get Started"
              variant="primary"
              showArrow
              onPress={() => onGetStarted && onGetStarted()}
            />

            <BioPulseButton
              title="I already have an account"
              variant="secondary"
              onPress={() => onSignIn && onSignIn()}
            />
          </View>

          {/* 5. Trust Indicators Row */}
          <View style={styles.trustSection}>
            <TrustBadgeRow variant="welcome" />
          </View>
        </View>
      </ScrollView>
    </BioPulseBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 6,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  headlineAccent: {
    color: BioPulseColors.teal,
  },
  subhead: {
    fontSize: 14,
    color: BioPulseColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  buttonSection: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  trustSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
});
