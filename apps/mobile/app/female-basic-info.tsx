import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import {
  OnboardingStepper,
  PathwayHeader,
  DatePickerModal,
  BmiGaugeCard,
} from '../components/onboarding';
import { useFemaleOnboarding } from '../features/onboarding';

const FEMALE_HERO = require('../assets/female_pathway_hero.png');

const FEMALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Cycle Health' },
  { id: 3, label: 'Symptoms' },
  { id: 4, label: 'Lifestyle' },
  { id: 5, label: 'Review' },
];

/**
 * Accurately calculate age from date of birth (ISO 'YYYY-MM-DD').
 * Dynamically computes against the current local date.
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
 * Format ISO date ('2002-03-15') into readable display ('15 Mar 2002')
 */
function formatReadableDate(dobIso: string): string {
  if (!dobIso) return '15 Mar 2002';
  const parts = dobIso.split('-').map(Number);
  if (parts.length !== 3) return dobIso;

  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Screen 7: FEMALE "Basic Information" (Refined Layout)
 *
 * Implements:
 * - Step 1 of 5 in Female PCOS Screening Pathway
 * - Screen 5 header architecture with "PERSONALIZED HEALTH INTELLIGENCE"
 * - Decorative female character artwork in header
 * - Date of Birth with platform date picker & strictly derived read-only age
 * - Metric height (cm) & weight (kg) selectors
 * - Dynamic Body Mass Index (BMI) gauge with WHO classification
 * - Marital status selection with conditional marriage duration for Tier-1 ML
 * - Pregnancy status with clinically sound non-diagnostic mapping
 * - Informational privacy and personalization banner
 * - Full state persistence via FemaleOnboardingContext
 */
export default function FemaleBasicInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isNarrow = width < 360;

  // Retrieve persistent state from FemaleOnboardingContext
  const { basicInfo, updateBasicInfo } = useFemaleOnboarding();

  // Local form state
  const [dob, setDob] = useState<string>(basicInfo.dateOfBirth || '2002-03-15');
  const [heightCm, setHeightCm] = useState<number>(basicInfo.heightCm || 162);
  const [weightKg, setWeightKg] = useState<number>(basicInfo.weightKg || 58);
  const [maritalStatus, setMaritalStatus] = useState<
    'single' | 'married' | 'prefer_not_to_say'
  >(basicInfo.maritalStatus || 'single');
  const [marriageYears, setMarriageYears] = useState<number>(basicInfo.marriageYears ?? 1);
  const [pregnancyStatus, setPregnancyStatus] = useState<
    'not_pregnant' | 'currently_pregnant' | 'trying_to_conceive' | 'prefer_not_to_say'
  >(basicInfo.pregnancyStatus || 'not_pregnant');

  // Date picker modal state
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Derived age dynamically computed from Date of Birth
  const age = useMemo(() => calculateAge(dob), [dob]);

  // Derived BMI
  const computedBmi = useMemo(() => {
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }, [heightCm, weightKg]);

  // Save state to context
  const saveState = useCallback(
    (overrides?: Partial<typeof basicInfo>) => {
      updateBasicInfo({
        dateOfBirth: dob,
        age,
        heightCm,
        weightKg,
        bmi: computedBmi,
        maritalStatus,
        marriageYears: maritalStatus === 'married' ? marriageYears : 0,
        pregnancyStatus,
        ...overrides,
      });
    },
    [
      dob,
      age,
      heightCm,
      weightKg,
      computedBmi,
      maritalStatus,
      marriageYears,
      pregnancyStatus,
      updateBasicInfo,
    ]
  );

  const params = useLocalSearchParams<{ returnTo?: string }>();
  const isFromReview = params.returnTo === 'review';

  // Back Navigation
  const handleBack = useCallback(() => {
    saveState();
    if (isFromReview) {
      router.push('/female-review');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/pathway-selection');
    }
  }, [saveState, isFromReview, router]);

  // Skip Navigation
  const handleSkip = useCallback(() => {
    Alert.alert(
      'Skip Basic Info?',
      'Standard demographic baselines (24 years, 162 cm, 58 kg) will be used for your initial screening.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip to Cycle Health',
          style: 'destructive',
          onPress: () => {
            saveState();
            if (isFromReview) {
              router.push('/female-review');
            } else {
              router.push('/female-cycle-health');
            }
          },
        },
      ]
    );
  }, [saveState, isFromReview, router]);

  // Continue CTA
  const handleContinue = useCallback(() => {
    // Validate bounds
    if (age < 12 || age > 65) {
      Alert.alert('Validation Notice', 'Please verify your date of birth.');
      return;
    }
    if (heightCm < 100 || heightCm > 240) {
      Alert.alert('Validation Notice', 'Please enter a realistic height between 100 and 240 cm.');
      return;
    }
    if (weightKg < 30 || weightKg > 250) {
      Alert.alert('Validation Notice', 'Please enter a realistic weight between 30 and 250 kg.');
      return;
    }

    saveState();
    if (isFromReview) {
      router.push('/female-review');
    } else {
      router.push('/female-cycle-health');
    }
  }, [age, heightCm, weightKg, isFromReview, saveState, router]);

  // Height and Weight Steppers
  const decrementHeight = () => heightCm > 120 && setHeightCm((h) => h - 1);
  const incrementHeight = () => heightCm < 220 && setHeightCm((h) => h + 1);

  const decrementWeight = () => weightKg > 35 && setWeightKg((w) => w - 1);
  const incrementWeight = () => weightKg < 200 && setWeightKg((w) => w + 1);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 8),
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
          {/* 1. Header (Screen 5 Architecture with Skip on Right) */}
          <View style={styles.headerWrapper}>
            <PathwayHeader onBack={handleBack} />
            <Pressable
              onPress={handleSkip}
              hitSlop={8}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Skip basic information step"
            >
              <Text style={styles.skipText}>Skip </Text>
              <Ionicons name="chevron-forward" size={14} color={BioPulseColors.femaleAccent} />
            </Pressable>
          </View>

          {/* 2. Onboarding Stepper (Step 1 Active: Basic Info) */}
          <OnboardingStepper
            currentStep={1}
            steps={FEMALE_ONBOARDING_STEPS}
            accentColor={BioPulseColors.femaleAccent}
          />

          {/* 3. Title Block with Decorative Hero Artwork */}
          <View style={styles.titleSectionRow}>
            <View style={styles.titleTextCol}>
              <Text style={styles.screenTitle}>Basic Information</Text>
              <Text style={styles.screenDescription}>
                Let’s start with some basic information about you.
              </Text>
            </View>

            {/* Decorative Female Illustration */}
            <View
              style={styles.heroArtworkWrap}
              accessible={false}
              aria-hidden={true}
            >
              <Image
                source={FEMALE_HERO}
                style={styles.heroArtworkImage}
                resizeMode="cover"
                accessible={false}
              />
            </View>
          </View>

          {/* 4. Row 1: Date of Birth & Derived Age (Paired Cards) */}
          <View style={[styles.pairedCardsRow, isNarrow && styles.pairedCardsStacked]}>
            {/* Date of Birth Card */}
            <View style={[styles.smallCard, !isNarrow && styles.halfCard]}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <Pressable
                onPress={() => setIsDatePickerVisible(true)}
                style={styles.interactiveBox}
                accessibilityRole="button"
                accessibilityLabel={`Date of birth: ${formatReadableDate(dob)}`}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={BioPulseColors.femaleAccent}
                  style={styles.fieldIcon}
                />
                <Text style={styles.interactiveBoxText}>{formatReadableDate(dob)}</Text>
                <Ionicons name="chevron-down" size={15} color="#64748B" />
              </Pressable>
            </View>

            {/* Age Card (Derived / Read-only) */}
            <View style={[styles.smallCard, !isNarrow && styles.halfCard]}>
              <Text style={styles.fieldLabel}>Age</Text>
              <View style={[styles.interactiveBox, styles.readOnlyBox]}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={BioPulseColors.femaleAccent}
                  style={styles.fieldIcon}
                />
                <Text style={styles.readOnlyText}>{age} years</Text>
              </View>
            </View>
          </View>

          {/* 5. Row 2: Height & Weight (Paired Cards) */}
          <View style={[styles.pairedCardsRow, isNarrow && styles.pairedCardsStacked]}>
            {/* Height Card */}
            <View style={[styles.smallCard, !isNarrow && styles.halfCard]}>
              <Text style={styles.fieldLabel}>Height</Text>
              <View style={styles.interactiveBox}>
                <Ionicons
                  name="resize-outline"
                  size={16}
                  color={BioPulseColors.femaleAccent}
                  style={styles.fieldIcon}
                />
                <View style={styles.measureStepper}>
                  <Pressable
                    onPress={decrementHeight}
                    style={({ pressed }) => [styles.microBtn, pressed && styles.microBtnPressed]}
                    accessibilityLabel="Decrease height"
                  >
                    <Ionicons name="remove" size={13} color="#073B72" />
                  </Pressable>

                  <Text style={styles.measureValueText}>{heightCm}</Text>

                  <Pressable
                    onPress={incrementHeight}
                    style={({ pressed }) => [styles.microBtn, pressed && styles.microBtnPressed]}
                    accessibilityLabel="Increase height"
                  >
                    <Ionicons name="add" size={13} color="#073B72" />
                  </Pressable>
                </View>

                <View style={styles.unitBadge}>
                  <Text style={styles.unitBadgeText}>cm</Text>
                  <Ionicons name="chevron-down" size={11} color="#64748B" />
                </View>
              </View>
            </View>

            {/* Weight Card */}
            <View style={[styles.smallCard, !isNarrow && styles.halfCard]}>
              <Text style={styles.fieldLabel}>Weight</Text>
              <View style={styles.interactiveBox}>
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={BioPulseColors.femaleAccent}
                  style={styles.fieldIcon}
                />
                <View style={styles.measureStepper}>
                  <Pressable
                    onPress={decrementWeight}
                    style={({ pressed }) => [styles.microBtn, pressed && styles.microBtnPressed]}
                    accessibilityLabel="Decrease weight"
                  >
                    <Ionicons name="remove" size={13} color="#073B72" />
                  </Pressable>

                  <Text style={styles.measureValueText}>{weightKg}</Text>

                  <Pressable
                    onPress={incrementWeight}
                    style={({ pressed }) => [styles.microBtn, pressed && styles.microBtnPressed]}
                    accessibilityLabel="Increase weight"
                  >
                    <Ionicons name="add" size={13} color="#073B72" />
                  </Pressable>
                </View>

                <View style={styles.unitBadge}>
                  <Text style={styles.unitBadgeText}>kg</Text>
                  <Ionicons name="chevron-down" size={11} color="#64748B" />
                </View>
              </View>
            </View>
          </View>

          {/* 6. Row 3: Body Mass Index (BMI) Unified Dynamic Card */}
          <BmiGaugeCard heightCm={heightCm} weightKg={weightKg} />

          {/* 7. Row 4: Marital Status */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="heart-outline"
                size={16}
                color={BioPulseColors.femaleAccent}
                style={styles.sectionHeaderIcon}
              />
              <Text style={styles.fieldLabel}>Marital Status</Text>
            </View>

            <View style={styles.segmentedRow}>
              {(['single', 'married', 'prefer_not_to_say'] as const).map((opt) => {
                const isSelected = maritalStatus === opt;
                const label =
                  opt === 'single'
                    ? 'Single'
                    : opt === 'married'
                    ? 'Married'
                    : 'Prefer not to say';
                return (
                  <Pressable
                    key={`marital-${opt}`}
                    onPress={() => setMaritalStatus(opt)}
                    style={[
                      styles.segmentBtn,
                      isSelected ? styles.segmentBtnActive : styles.segmentBtnInactive,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        isSelected ? styles.segmentTextActive : styles.segmentTextInactive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Conditionally asked marriage duration for ML Tier-1 requirement */}
            {maritalStatus === 'married' && (
              <View style={styles.subQuestionBox}>
                <Text style={styles.subQuestionLabel}>Years married (for clinical modeling):</Text>
                <View style={styles.subStepperRow}>
                  <Pressable
                    onPress={() => marriageYears > 0 && setMarriageYears((y) => y - 1)}
                    style={styles.microBtn}
                  >
                    <Ionicons name="remove" size={13} color="#073B72" />
                  </Pressable>
                  <Text style={styles.subStepperValue}>
                    {marriageYears} {marriageYears === 1 ? 'year' : 'years'}
                  </Text>
                  <Pressable
                    onPress={() => marriageYears < 40 && setMarriageYears((y) => y + 1)}
                    style={styles.microBtn}
                  >
                    <Ionicons name="add" size={13} color="#073B72" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* 8. Row 5: Pregnancy Status */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="female-outline"
                size={16}
                color={BioPulseColors.femaleAccent}
                style={styles.sectionHeaderIcon}
              />
              <Text style={styles.fieldLabel}>Pregnancy Status</Text>
            </View>

            <View style={styles.pregnancyPillsRow}>
              {(
                [
                  { id: 'not_pregnant', label: 'Not Pregnant' },
                  { id: 'currently_pregnant', label: 'Currently Pregnant' },
                  { id: 'trying_to_conceive', label: 'Trying to Conceive' },
                  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
                ] as const
              ).map((opt) => {
                const isSelected = pregnancyStatus === opt.id;
                return (
                  <Pressable
                    key={`preg-${opt.id}`}
                    onPress={() => setPregnancyStatus(opt.id)}
                    style={[
                      styles.pregnancyPill,
                      isSelected ? styles.segmentBtnActive : styles.segmentBtnInactive,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.pregnancyPillText,
                        isSelected ? styles.segmentTextActive : styles.segmentTextInactive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 9. Row 6: Information Banner */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle"
              size={18}
              color="#64748B"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              This information helps us provide more accurate screening and personalized recommendations for your PCOS health.{'\n'}Your data is private and secure.
            </Text>
          </View>

          {/* 10. Row 7: Continue CTA Button */}
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue to Cycle Health"
          >
            <View style={styles.buttonInnerRow}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons
                name="arrow-forward"
                size={17}
                color="#FFFFFF"
                style={styles.arrowIcon}
              />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Date of Birth Picker Modal */}
      <DatePickerModal
        visible={isDatePickerVisible}
        initialDateIso={dob}
        onClose={() => setIsDatePickerVisible(false)}
        onConfirm={(newDob) => setDob(newDob)}
      />
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
    maxWidth: 600,
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
  },
  skipBtn: {
    position: 'absolute',
    right: 8,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  skipBtnPressed: {
    opacity: 0.6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.femaleAccent,
  },
  titleSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 12,
  },
  titleTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BioPulseColors.navy,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    fontWeight: '400',
  },
  heroArtworkWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
  },
  heroArtworkImage: {
    width: '100%',
    height: '100%',
  },
  pairedCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  pairedCardsStacked: {
    flexDirection: 'column',
  },
  halfCard: {
    flex: 1,
  },
  smallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1D5DF',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 6,
  },
  interactiveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 6,
  },
  fieldIcon: {
    marginRight: 2,
  },
  interactiveBoxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  readOnlyBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  measureStepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  microBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  microBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  measureValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1D5DF',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHeaderIcon: {
    marginRight: 2,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  segmentBtnActive: {
    backgroundColor: '#FFF0F5',
    borderColor: BioPulseColors.femaleAccent,
  },
  segmentBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: '#55718F',
  },
  subQuestionBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8DCE5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subQuestionLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  subStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subStepperValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  pregnancyPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pregnancyPill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pregnancyPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
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
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#475569',
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: BioPulseColors.femaleAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
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
  arrowIcon: {
    marginLeft: 8,
  },
});
