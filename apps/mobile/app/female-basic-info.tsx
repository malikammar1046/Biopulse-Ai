import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { BioPulseBackground } from '../components/common/BioPulseBackground';
import { BioPulseButton } from '../components/common/BioPulseButton';
import { DatePickerModal } from '../components/onboarding/DatePickerModal';
import { useFemaleOnboarding } from '../features/onboarding';

/**
 * Calculate age dynamically from ISO 'YYYY-MM-DD'
 */
function calculateAge(dobIso: string): number {
  if (!dobIso) return 24;
  const parts = dobIso.split('-').map(Number);
  if (parts.length !== 3) return 24;

  const today = new Date();
  const birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(age, 0);
}

/**
 * Format ISO date string into readable text (e.g. '15 Mar 2002')
 */
function formatReadableDate(dobIso: string): string {
  if (!dobIso) return '15 Mar 2002';
  const parts = dobIso.split('-').map(Number);
  if (parts.length !== 3) return dobIso;

  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

type PregnancyOption = 'not_pregnant' | 'trying_to_conceive' | 'currently_pregnant';

/**
 * Screen 6: Female Onboarding — Basic Information
 *
 * Implements:
 * - Step 1 of 5 in Female PCOS Screening Pathway
 * - Date of Birth selector with live calculated Age
 * - Height (cm) and Weight (kg) inputs with quick adjust buttons
 * - Live automatic BMI gauge & WHO clinical categorization
 * - Pregnancy status selector
 * - "Continue  →" CTA persisting state into FemaleOnboardingContext
 */
export default function FemaleBasicInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const { basicInfo, updateBasicInfo } = useFemaleOnboarding();

  // Local interactive state
  const [dob, setDob] = useState<string>(basicInfo.dateOfBirth || '2002-03-15');
  const [heightCm, setHeightCm] = useState<number>(basicInfo.heightCm || 162);
  const [weightKg, setWeightKg] = useState<number>(basicInfo.weightKg || 58);
  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyOption>(
    (basicInfo.pregnancyStatus as PregnancyOption) || 'not_pregnant'
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 16 : 12);
  const bottomPad = Math.max(insets.bottom, 20);

  // Derived calculations
  const age = useMemo(() => calculateAge(dob), [dob]);

  const { bmi, bmiCategory, bmiColor, bmiBg } = useMemo(() => {
    const heightM = heightCm / 100;
    const computedBmi =
      heightM > 0 ? parseFloat((weightKg / (heightM * heightM)).toFixed(1)) : 22.1;

    let category = 'Normal weight';
    let color: string = BioPulseColors.teal;
    let bg = '#E6F8F9';

    if (computedBmi < 18.5) {
      category = 'Underweight';
      color = '#3B82F6';
      bg = '#EFF6FF';
    } else if (computedBmi < 25.0) {
      category = 'Normal weight';
      color = '#10B981';
      bg = '#ECFDF5';
    } else if (computedBmi < 30.0) {
      category = 'Overweight';
      color = '#F59E0B';
      bg = '#FFFBEB';
    } else {
      category = 'Elevated (Obese)';
      color = '#EF4444';
      bg = '#FEF2F2';
    }

    return { bmi: computedBmi, bmiCategory: category, bmiColor: color, bmiBg: bg };
  }, [heightCm, weightKg]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/pathway-selection');
    }
  }, [router]);

  const handleContinue = useCallback(() => {
    if (age <= 0 || age > 120) {
      Alert.alert('Invalid Date of Birth', 'Please select a valid date of birth.');
      return;
    }
    if (heightCm < 80 || heightCm > 250) {
      Alert.alert('Invalid Height', 'Please enter a valid height between 80 cm and 250 cm.');
      return;
    }
    if (weightKg < 25 || weightKg > 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 25 kg and 300 kg.');
      return;
    }

    // Persist basic information
    updateBasicInfo({
      dateOfBirth: dob,
      age,
      heightCm,
      weightKg,
      bmi,
      pregnancyStatus,
    });

    // Advance to Step 2: Cycle Health
    router.push('/female-cycle-health');
  }, [dob, age, heightCm, weightKg, bmi, pregnancyStatus, updateBasicInfo, router]);

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Top Navigation Bar with Step Indicator */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={BioPulseColors.textPrimary} />
        </Pressable>

        <View style={styles.stepIndicatorContainer}>
          <Text style={styles.stepIndicatorText}>Step 1 of 5</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '20%' }]} />
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Header Title */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Basic Information</Text>
            <Text style={styles.screenSubtitle}>
              These metrics establish your baseline for personalized PCOS screening.
            </Text>
          </View>

          {/* 1. Date of Birth & Age Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Date of Birth & Age</Text>
            <Pressable
              onPress={() => setIsDatePickerOpen(true)}
              style={styles.dobSelector}
              accessibilityRole="button"
              accessibilityLabel="Select Date of Birth"
            >
              <View style={styles.dobLeft}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={BioPulseColors.teal}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.dobDateText}>{formatReadableDate(dob)}</Text>
              </View>

              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeText}>{age} yrs</Text>
              </View>
            </Pressable>
          </View>

          {/* 2. Height & Weight Measurements Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Measurements</Text>

            {/* Height Row */}
            <View style={styles.metricRow}>
              <View>
                <Text style={styles.metricLabel}>Height</Text>
                <Text style={styles.metricValue}>
                  {heightCm} <Text style={styles.metricUnit}>cm</Text>
                </Text>
              </View>

              <View style={styles.adjustButtonsRow}>
                <Pressable
                  onPress={() => setHeightCm((h) => Math.max(120, h - 1))}
                  style={styles.adjustBtn}
                  hitSlop={8}
                >
                  <Ionicons name="remove" size={18} color={BioPulseColors.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={() => setHeightCm((h) => Math.min(220, h + 1))}
                  style={styles.adjustBtn}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={18} color={BioPulseColors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Weight Row */}
            <View style={styles.metricRow}>
              <View>
                <Text style={styles.metricLabel}>Weight</Text>
                <Text style={styles.metricValue}>
                  {weightKg} <Text style={styles.metricUnit}>kg</Text>
                </Text>
              </View>

              <View style={styles.adjustButtonsRow}>
                <Pressable
                  onPress={() => setWeightKg((w) => Math.max(35, w - 1))}
                  style={styles.adjustBtn}
                  hitSlop={8}
                >
                  <Ionicons name="remove" size={18} color={BioPulseColors.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={() => setWeightKg((w) => Math.min(200, w + 1))}
                  style={styles.adjustBtn}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={18} color={BioPulseColors.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* 3. Automatic BMI Calculation Card */}
          <View style={[styles.card, styles.bmiCard]}>
            <View style={styles.bmiHeaderRow}>
              <View>
                <Text style={styles.bmiTitle}>Body Mass Index (BMI)</Text>
                <Text style={styles.bmiSubtext}>WHO Clinical Classification</Text>
              </View>
              <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiBg }]}>
                <Text style={[styles.bmiCategoryText, { color: bmiColor }]}>
                  {bmiCategory}
                </Text>
              </View>
            </View>

            <View style={styles.bmiScoreRow}>
              <Text style={styles.bmiScore}>{bmi}</Text>
              <Text style={styles.bmiScoreUnit}>kg/m²</Text>
            </View>
          </View>

          {/* 4. Pregnancy Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Pregnancy Status</Text>
            <Text style={styles.cardSubtitle}>
              Helps refine hormonal assessment parameters.
            </Text>

            <View style={styles.pregnancyOptionsContainer}>
              {[
                { key: 'not_pregnant', label: 'Not pregnant' },
                { key: 'trying_to_conceive', label: 'Trying to conceive' },
                { key: 'currently_pregnant', label: 'Currently pregnant' },
              ].map((opt) => {
                const isSelected = pregnancyStatus === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setPregnancyStatus(opt.key as PregnancyOption)}
                    style={[
                      styles.pregnancyOption,
                      isSelected && styles.pregnancyOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text
                      style={[
                        styles.pregnancyOptionText,
                        isSelected && styles.pregnancyOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Continue CTA */}
          <View style={styles.ctaContainer}>
            <BioPulseButton
              title="Continue"
              variant="primary"
              showArrow
              onPress={handleContinue}
            />
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={isDatePickerOpen}
        initialDateIso={dob}
        onConfirm={(newIsoDate) => {
          setDob(newIsoDate);
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </BioPulseBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
  },
  stepIndicatorContainer: {
    alignItems: 'center',
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: BioPulseColors.teal,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: 100,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(22, 184, 196, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BioPulseColors.teal,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  mainWrapper: {
    width: '100%',
  },
  titleSection: {
    marginVertical: 14,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13.5,
    color: BioPulseColors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    marginBottom: 14,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: BioPulseColors.textSecondary,
    marginBottom: 12,
  },
  dobSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5FBFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    marginTop: 8,
  },
  dobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dobDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
  },
  ageBadge: {
    backgroundColor: BioPulseColors.teal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 13,
    color: BioPulseColors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    marginTop: 2,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: BioPulseColors.textSecondary,
  },
  adjustButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
  },
  divider: {
    height: 1,
    backgroundColor: BioPulseColors.borderSubtle,
    marginVertical: 10,
  },
  bmiCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(22, 184, 196, 0.35)',
  },
  bmiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bmiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  bmiSubtext: {
    fontSize: 12,
    color: BioPulseColors.textSecondary,
    marginTop: 2,
  },
  bmiCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiCategoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bmiScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  bmiScore: {
    fontSize: 28,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
  },
  bmiScoreUnit: {
    fontSize: 14,
    color: BioPulseColors.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
  },
  pregnancyOptionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  pregnancyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    backgroundColor: '#F8FCFD',
  },
  pregnancyOptionSelected: {
    borderColor: BioPulseColors.teal,
    backgroundColor: '#EBF8FA',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: BioPulseColors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: BioPulseColors.teal,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BioPulseColors.teal,
  },
  pregnancyOptionText: {
    fontSize: 14,
    color: BioPulseColors.textSecondary,
    fontWeight: '500',
  },
  pregnancyOptionTextSelected: {
    color: BioPulseColors.textPrimary,
    fontWeight: '700',
  },
  ctaContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
});
