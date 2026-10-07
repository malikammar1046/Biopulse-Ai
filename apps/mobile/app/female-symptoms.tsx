import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { BioPulseBackground } from '../components/common/BioPulseBackground';
import { BioPulseButton } from '../components/common/BioPulseButton';
import { FemaleOnboardingHeader } from '../components/onboarding/FemaleOnboardingHeader';
import { useFemaleOnboarding } from '../features/onboarding';

interface SymptomItem {
  id: string;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const MODEL_SYMPTOMS: SymptomItem[] = [
  { id: 'weight_gain', title: 'Weight gain', iconName: 'speedometer-outline' },
  { id: 'hirsutism', title: 'Excess hair growth', iconName: 'cut-outline' },
  { id: 'skin_darkening', title: 'Skin darkening', iconName: 'color-palette-outline' },
  { id: 'hair_loss', title: 'Hair loss', iconName: 'finger-print-outline' },
  { id: 'pimples_acne', title: 'Pimples / Acne', iconName: 'sparkles-outline' },
  { id: 'irregular_periods', title: 'Irregular periods', iconName: 'calendar-outline' },
];

/**
 * SCREEN 8: FEMALE SYMPTOMS (Step 3 of 5)
 *
 * Matches Screenshot 8:
 * - Header: Step 3 of 5 with 3 filled progress segments
 * - Title: "Your Symptoms" with pink floral icon
 * - 2x3 Grid of 6 selectable symptom cards
 * - Upper-right pink checkmark badge when selected
 * - Pink accent borders for selected items
 * - Informational notice banner at bottom
 * - Primary "Continue →" pink CTA
 */
export default function FemaleSymptomsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { symptoms, updateSymptoms } = useFemaleOnboarding();

  // Local selection state (defaults to previously saved or common signs)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    symptoms.length > 0 ? symptoms : ['weight_gain', 'hirsutism', 'skin_darkening', 'pimples_acne', 'irregular_periods']
  );

  const bottomPad = Math.max(insets.bottom, 20);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleContinue = useCallback(() => {
    updateSymptoms(selectedIds);
    router.push('/female-lifestyle');
  }, [selectedIds, updateSymptoms, router]);

  const cardWidth = (Math.min(width, 460) - 36 - 12) / 2;

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Top Navigation Bar with Step 3 of 5 */}
      <FemaleOnboardingHeader
        step={3}
        totalSteps={5}
        onBack={() => router.back()}
        accentColor="#F43F7D"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Header Title with Pink Floral Icon */}
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <Ionicons name="flower" size={24} color="#F43F7D" />
            </View>
            <View style={styles.headerTitleTextCol}>
              <Text style={styles.screenTitle}>Your Symptoms</Text>
              <Text style={styles.screenSubtitle}>
                Select any symptoms you experience (common in PCOS).
              </Text>
            </View>
          </View>

          {/* 2x3 Grid of 6 Selectable Symptom Cards */}
          <View style={styles.cardsGrid}>
            {MODEL_SYMPTOMS.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleToggle(item.id)}
                  style={[
                    styles.symptomCard,
                    { width: cardWidth },
                    isSelected && styles.symptomCardSelected,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={item.title}
                >
                  {/* Upper Right Checkmark Badge */}
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    </View>
                  )}

                  {/* Symptom Icon */}
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={item.iconName}
                      size={28}
                      color={isSelected ? '#F43F7D' : BioPulseColors.textSecondary}
                    />
                  </View>

                  {/* Symptom Title */}
                  <Text style={[styles.symptomTitle, isSelected && styles.symptomTitleSelected]}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Informational Guidance Notice */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={BioPulseColors.teal}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={styles.infoBannerText}>
              These are common signs of PCOS. Selecting symptoms helps improve your personalized screening.
            </Text>
          </View>

          {/* Primary CTA */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Continue"
              variant="female"
              showArrow
              onPress={handleContinue}
              style={{ backgroundColor: '#F43F7D', borderColor: '#E11D48' }}
            />
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
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  mainWrapper: {
    width: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FDECF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleTextCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: BioPulseColors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  symptomCard: {
    height: 124,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 12,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  symptomCardSelected: {
    borderColor: '#F43F7D',
    backgroundColor: '#FEF5F8',
    shadowColor: '#F43F7D',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F43F7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  symptomTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  symptomTitleSelected: {
    color: BioPulseColors.textPrimary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF7FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFEBF1',
    padding: 12,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: BioPulseColors.textSecondary,
    lineHeight: 18,
  },
  ctaWrapper: {
    marginTop: 4,
  },
});
