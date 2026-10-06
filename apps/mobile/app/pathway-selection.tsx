import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import {
  PathwayHeader,
  OnboardingStepper,
  PathwayCard,
  PathwayFeatureItem,
} from '../components/onboarding';
import { useAuth } from '../features/authentication';
import { HealthPathway } from '../features/authentication/types';

const FEMALE_HERO = require('../assets/female_pathway_hero.png');
const MALE_HERO = require('../assets/male_pathway_hero.png');

const FEMALE_FEATURES: PathwayFeatureItem[] = [
  { icon: 'flower-outline', text: 'Hormonal & reproductive health' },
  { icon: 'git-network-outline', text: 'Metabolic wellness' },
  { icon: 'sparkles-outline', text: 'Personalized guidance & support' },
];

const MALE_FEATURES: PathwayFeatureItem[] = [
  { icon: 'male-outline', text: 'Testosterone & hormonal health' },
  { icon: 'barbell-outline', text: 'Metabolic & reproductive wellness' },
  { icon: 'shield-checkmark-outline', text: 'Personalized guidance & support' },
];

/**
 * Screen 5: "Choose Your Health Pathway"
 *
 * Implements:
 * - Dual-pathway branching point (Female PCOS vs Male Hypogonadism)
 * - Header with back navigation, BioPulse AI brand lockup, and Help guidance
 * - 4-step progress stepper (Step 1 active: "Choose Path")
 * - Female Health Card & Male Health Card with equal visual hierarchy
 * - Mutual exclusivity & dynamic continue CTA
 * - Responsive 2-column or stacked layout with tablet width centering
 * - Full state persistence via AuthContext / profile architecture
 */
export default function PathwaySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { pathway, selectPathway } = useAuth();

  // Initialize with existing pathway if present in state, otherwise null
  const [selectedPathway, setSelectedPathway] = useState<HealthPathway | null>(
    pathway || null
  );

  // Responsive breakpoint calculations
  const isTablet = width >= 768;
  const isVeryNarrow = width < 350;
  const isTwoColumn = !isVeryNarrow;

  // Handle back navigation cleanly
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  // Handle pathway selection
  const handleSelectPathway = useCallback((type: 'female' | 'male') => {
    const nextValue: HealthPathway = type === 'female' ? 'female_pcos' : 'male_hypogonadism';
    setSelectedPathway(nextValue);
  }, []);

  // Handle continue CTA action
  const handleContinue = useCallback(() => {
    if (!selectedPathway) return;

    // Persist choice into existing state architecture
    selectPathway(selectedPathway);

    // Route to pathway-specific onboarding flow (Step 1: Basic Info)
    if (selectedPathway === 'female_pcos' || selectedPathway === 'female') {
      router.push('/female-basic-info');
    } else {
      router.push('/male-basic-info');
    }
  }, [selectedPathway, selectPathway, router]);

  const isFemaleSelected =
    selectedPathway === 'female_pcos' || selectedPathway === 'female';
  const isMaleSelected =
    selectedPathway === 'male_hypogonadism' || selectedPathway === 'male';

  // Dynamic button properties
  const isButtonEnabled = Boolean(selectedPathway);
  const buttonColor = isFemaleSelected
    ? BioPulseColors.femaleAccent
    : isMaleSelected
    ? '#0284C7'
    : '#CBD5E1';

  const buttonText = isFemaleSelected
    ? 'Continue with Female Health'
    : isMaleSelected
    ? 'Continue with Male Health'
    : 'Select a Health Pathway';

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <AuthBackgroundFoliage />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* 1. Header (Back button, BioPulse AI logo, Help) */}
          <PathwayHeader onBack={handleBack} />

          {/* 2. Progress Stepper (Step 1: Choose Path) */}
          <OnboardingStepper
            currentStep={1}
            accentColor={
              isMaleSelected ? '#0284C7' : BioPulseColors.femaleAccent
            }
          />

          {/* 3. Main Content Title & Description */}
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>
              Choose Your Health Pathway
            </Text>
            <Text style={styles.screenDescription}>
              Select the pathway that best fits your health goals.{'\n'}
              You can always change this later in settings.
            </Text>
          </View>

          {/* 4. Pathway Cards (Female & Male) */}
          <View
            style={[
              styles.cardsWrapper,
              isTwoColumn ? styles.cardsRow : styles.cardsColumn,
            ]}
          >
            {/* Female Health Card */}
            <PathwayCard
              type="female"
              title="Female Health"
              subtitle="PCOS Screening"
              illustrationSource={FEMALE_HERO}
              features={FEMALE_FEATURES}
              footerText="Designed for women with PCOS and related concerns"
              isSelected={isFemaleSelected}
              onSelect={() => handleSelectPathway('female')}
              isTwoColumn={isTwoColumn}
            />

            {/* Male Health Card */}
            <PathwayCard
              type="male"
              title="Male Health"
              subtitle="Hypogonadism Screening"
              illustrationSource={MALE_HERO}
              features={MALE_FEATURES}
              footerText="Designed for men with hypogonadism and related concerns"
              isSelected={isMaleSelected}
              onSelect={() => handleSelectPathway('male')}
              isTwoColumn={isTwoColumn}
            />
          </View>

          {/* 5. Information Banner */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              BioPulse AI provides screening support and personalized guidance, not a medical diagnosis.
            </Text>
          </View>

          {/* 6. Continue CTA Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!isButtonEnabled}
            style={({ pressed }) => [
              styles.continueButton,
              { backgroundColor: buttonColor },
              isFemaleSelected && styles.continueButtonFemaleShadow,
              isMaleSelected && styles.continueButtonMaleShadow,
              !isButtonEnabled && styles.continueButtonDisabled,
              pressed && isButtonEnabled && styles.continueButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={buttonText}
            accessibilityState={{ disabled: !isButtonEnabled }}
          >
            <View style={styles.buttonInnerRow}>
              <Text
                style={[
                  styles.continueButtonText,
                  !isButtonEnabled && styles.continueButtonTextDisabled,
                ]}
              >
                {buttonText}
              </Text>
              {isButtonEnabled && (
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                  style={styles.arrowIcon}
                />
              )}
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FEF8FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 680,
  },
  titleBlock: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BioPulseColors.navy,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  screenDescription: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '400',
  },
  cardsWrapper: {
    width: '100%',
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  cardsColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 10,
  },
  infoIcon: {
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#475569',
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonFemaleShadow: {
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonMaleShadow: {
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.8,
  },
  continueButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#64748B',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
