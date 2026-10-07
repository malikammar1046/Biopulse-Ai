import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { BioPulseBackground } from '../components/common/BioPulseBackground';
import { Logo } from '../components/brand/Logo';
import { useAuth } from '../features/authentication';
import { HealthPathway } from '../features/authentication/types';

const FEMALE_CARD_IMAGE = require('../assets/female_card_hero.jpg');
const MALE_CARD_IMAGE = require('../assets/male_card_hero.jpg');

/**
 * Screen 5: Choose Your Path
 *
 * Rebuilt to match Screenshot 5:
 * - BioPulse AI logo at the top
 * - "Choose your health path" ("health path" in teal)
 * - "Personalized insights for a healthier you."
 * - Two large interactive cards:
 *   1. Female Health: PCOS Screening (soft pink & teal glow, female silhouette, "Continue →" CTA)
 *   2. Male Health: Hypogonadism Screening (blue & cyan glow, male silhouette, "Continue →" CTA)
 * - Persists chosen pathway via useAuth().selectPathway()
 * - Female routes to Screen 6 (/female-basic-info)
 * - Male routes to (/male-basic-info)
 */
export default function PathwaySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { selectPathway } = useAuth();

  const isShortScreen = height < 740;
  const isTablet = width >= 768;

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 16 : 12);
  const bottomPad = Math.max(insets.bottom, 20);

  const handleSelectPathway = useCallback(
    (chosenPathway: HealthPathway) => {
      // 1. Persist choice in AuthContext and Supabase session
      selectPathway(chosenPathway);

      // 2. Navigate to first onboarding screen
      if (chosenPathway === 'female_pcos' || chosenPathway === 'female') {
        router.push('/female-basic-info');
      } else {
        router.push('/male-basic-info');
      }
    },
    [selectPathway, router]
  );

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
          {/* 1. Header Brand Logo */}
          <View style={styles.logoSection}>
            <Logo size="sm" layout="vertical" showTagline={false} />
          </View>

          {/* 2. Titles */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Choose your{'\n'}
              <Text style={styles.titleAccent}>health path</Text>
            </Text>
            <Text style={styles.subtitle}>
              Personalized insights for a healthier you.
            </Text>
          </View>

          {/* 3. Pathway Cards */}
          <View style={styles.cardsContainer}>
            {/* CARD 1: FEMALE HEALTH (PCOS SCREENING) */}
            <Pressable
              onPress={() => handleSelectPathway('female_pcos')}
              style={({ pressed }) => [
                styles.pathwayCard,
                styles.femaleCardBorder,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Female Health PCOS Screening"
            >
              {/* Silhouette Illustration */}
              <View style={styles.cardImageContainer}>
                <Image
                  source={FEMALE_CARD_IMAGE}
                  style={styles.cardSilhouetteImage}
                  resizeMode="contain"
                />
              </View>

              {/* Card Text & CTA */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Female Health</Text>
                <Text style={styles.femaleSubtitle}>PCOS Screening</Text>
                <Text style={styles.cardDescription}>
                  Understand your hormonal health with AI-powered screening.
                </Text>

                <Pressable
                  onPress={() => handleSelectPathway('female_pcos')}
                  style={styles.femaleButton}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to Female Health"
                >
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </Pressable>

            {/* CARD 2: MALE HEALTH (HYPOGONADISM SCREENING) */}
            <Pressable
              onPress={() => handleSelectPathway('male_hypogonadism')}
              style={({ pressed }) => [
                styles.pathwayCard,
                styles.maleCardBorder,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Male Health Hypogonadism Screening"
            >
              {/* Silhouette Illustration */}
              <View style={styles.cardImageContainer}>
                <Image
                  source={MALE_CARD_IMAGE}
                  style={styles.cardSilhouetteImage}
                  resizeMode="contain"
                />
              </View>

              {/* Card Text & CTA */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Male Health</Text>
                <Text style={styles.maleSubtitle}>Hypogonadism Screening</Text>
                <Text style={styles.cardDescription}>
                  Assess your hormonal health and overall vitality with AI-powered screening.
                </Text>

                <Pressable
                  onPress={() => handleSelectPathway('male_hypogonadism')}
                  style={styles.maleButton}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to Male Health"
                >
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </BioPulseBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: BioPulseColors.teal,
  },
  subtitle: {
    fontSize: 14,
    color: BioPulseColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 16,
  },
  pathwayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 180,
  },
  femaleCardBorder: {
    borderColor: 'rgba(244, 63, 125, 0.22)',
  },
  maleCardBorder: {
    borderColor: 'rgba(33, 150, 243, 0.22)',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  cardImageContainer: {
    width: 100,
    height: 145,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BioPulseColors.borderSubtle,
    marginRight: 14,
  },
  cardSilhouetteImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.3,
  },
  femaleSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.teal,
    marginTop: 2,
    marginBottom: 6,
  },
  maleSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1988D4',
    marginTop: 2,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12.5,
    color: BioPulseColors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  femaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BioPulseColors.teal,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    gap: 6,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  maleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    gap: 6,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
