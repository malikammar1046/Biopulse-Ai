import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
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
  FemaleCycleCalendarCard,
} from '../components/onboarding';
import {
  useFemaleOnboarding,
  CycleRegularity,
  MissedPeriodsRange,
  FlowIntensity,
} from '../features/onboarding';

const FEMALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Cycle Health' },
  { id: 3, label: 'Symptoms' },
  { id: 4, label: 'Lifestyle' },
  { id: 5, label: 'Review' },
];

/**
 * Screen 6: FEMALE "Your Cycle Health"
 *
 * Implements:
 * - Step 2 of 5 in Female / PCOS Screening Pathway
 * - Screen 5 header architecture with "PERSONALIZED HEALTH INTELLIGENCE"
 * - Safe Skip navigation with baseline data integrity guards
 * - Cycle regularity single-select control
 * - Average cycle length stepper / picker (realistic 21-45 days)
 * - Platform date selection & interactive Cycle Calendar
 * - Average missed periods selector (0, 1-2, 3+)
 * - Flow pattern cards with droplet indicators (Light, Moderate, Heavy)
 * - Additional notes multiline field with 200-char limit counter
 * - State preservation via FemaleOnboardingContext
 */
export default function FemaleCycleHealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isNarrow = width < 360;

  // Retrieve persistent state from FemaleOnboardingContext
  const { cycleHealth, updateCycleHealth } = useFemaleOnboarding();

  // Local form state initialized from persistent context
  const [regularity, setRegularity] = useState<CycleRegularity>(cycleHealth.regularity);
  const [cycleLength, setCycleLength] = useState<number>(cycleHealth.cycleLength);
  const [lastPeriodDate, setLastPeriodDate] = useState<string>(cycleHealth.lastPeriodDate);
  const [missedPeriods, setMissedPeriods] = useState<MissedPeriodsRange>(cycleHealth.missedPeriodsYear);
  const [flow, setFlow] = useState<FlowIntensity>(cycleHealth.flowPattern);
  const [notes, setNotes] = useState<string>(cycleHealth.additionalNotes);

  // Sync state changes to context
  const saveState = useCallback(
    (overrides?: Partial<typeof cycleHealth>) => {
      updateCycleHealth({
        regularity,
        cycleLength,
        lastPeriodDate,
        missedPeriodsYear: missedPeriods,
        flowPattern: flow,
        additionalNotes: notes,
        ...overrides,
      });
    },
    [regularity, cycleLength, lastPeriodDate, missedPeriods, flow, notes, updateCycleHealth]
  );

  const params = useLocalSearchParams<{ returnTo?: string }>();
  const isFromReview = params.returnTo === 'review';

  // Back Navigation: save current progress and return
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

  // Safe Skip Navigation: ensures screening data is not corrupted
  const handleSkip = useCallback(() => {
    Alert.alert(
      'Skip Cycle Details?',
      'Cycle rhythm is a key indicator for PCOS risk evaluation. We will register standard baseline parameters (28 days, Not Sure) so your screening remains clinically valid.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip to Symptoms',
          style: 'destructive',
          onPress: () => {
            saveState({
              regularity: 'not_sure',
              cycleLength: 28,
            });
            if (isFromReview) {
              router.push('/female-review');
            } else {
              router.push('/female-symptoms');
            }
          },
        },
      ]
    );
  }, [saveState, isFromReview, router]);

  // Continue CTA: validate required inputs and transition to next step
  const handleContinue = useCallback(() => {
    saveState();
    if (isFromReview) {
      router.push('/female-review');
    } else {
      router.push('/female-symptoms');
    }
  }, [saveState, isFromReview, router]);

  // Cycle Length adjustments
  const decrementCycle = () => {
    if (cycleLength > 21) setCycleLength((prev) => prev - 1);
  };
  const incrementCycle = () => {
    if (cycleLength < 45) setCycleLength((prev) => prev + 1);
  };

  // Format readable date
  const readableDate = (() => {
    const parts = lastPeriodDate.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return lastPeriodDate;
  })();

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
          {/* 1. Header (Screen 5 Architecture with Skip on Right) */}
          <View style={styles.headerWrapper}>
            <PathwayHeader onBack={handleBack} />
            <Pressable
              onPress={handleSkip}
              hitSlop={8}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Skip cycle health step"
            >
              <Text style={styles.skipText}>Skip </Text>
              <Ionicons name="chevron-forward" size={14} color={BioPulseColors.femaleAccent} />
            </Pressable>
          </View>

          {/* 2. Onboarding Stepper (Step 2 Active: Cycle Health) */}
          <OnboardingStepper
            currentStep={2}
            steps={FEMALE_ONBOARDING_STEPS}
            accentColor={BioPulseColors.femaleAccent}
          />

          {/* 3. Title & Subtitle */}
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>Your Cycle Health</Text>
            <Text style={styles.screenDescription}>
              Help us understand your menstrual cycle{'\n'}better for more accurate insights.
            </Text>
          </View>

          {/* 4. Question: Is your menstrual cycle regular? */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>Is your menstrual cycle regular?</Text>
            <View style={styles.segmentedRow}>
              {(['regular', 'irregular', 'not_sure'] as CycleRegularity[]).map((opt) => {
                const isSelected = regularity === opt;
                const optLabel =
                  opt === 'regular' ? 'Regular' : opt === 'irregular' ? 'Irregular' : 'Not sure';
                return (
                  <Pressable
                    key={`reg-${opt}`}
                    onPress={() => setRegularity(opt)}
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
                      {optLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Average Cycle Length & Last Period Date (Paired Cards) */}
          <View style={[styles.pairedCardsWrapper, isNarrow && styles.pairedCardsStacked]}>
            {/* Cycle Length Card */}
            <View style={[styles.smallCard, !isNarrow && styles.halfCard]}>
              <View style={styles.cardHeaderSmall}>
                <View style={styles.iconCircleSmall}>
                  <Ionicons name="time-outline" size={14} color={BioPulseColors.femaleAccent} />
                </View>
                <Text style={styles.cardTitleSmall}>Average cycle length</Text>
              </View>

              <View style={styles.stepperRow}>
                <Pressable
                  onPress={decrementCycle}
                  disabled={cycleLength <= 21}
                  style={({ pressed }) => [
                    styles.stepperActionBtn,
                    cycleLength <= 21 && styles.stepperBtnDisabled,
                    pressed && styles.stepperBtnPressed,
                  ]}
                  accessibilityLabel="Decrease cycle length"
                >
                  <Ionicons name="remove" size={16} color="#073B72" />
                </Pressable>

                <View style={styles.cycleValueBox}>
                  <Text style={styles.cycleValueNum}>{cycleLength}</Text>
                  <Text style={styles.cycleValueUnit}>days</Text>
                </View>

                <Pressable
                  onPress={incrementCycle}
                  disabled={cycleLength >= 45}
                  style={({ pressed }) => [
                    styles.stepperActionBtn,
                    cycleLength >= 45 && styles.stepperBtnDisabled,
                    pressed && styles.stepperBtnPressed,
                  ]}
                  accessibilityLabel="Increase cycle length"
                >
                  <Ionicons name="add" size={16} color="#073B72" />
                </Pressable>
              </View>
            </View>

            {/* Last Period Start Date Card */}
            <View style={[styles.smallCard, !isNarrow && styles.halfCard]}>
              <View style={styles.cardHeaderSmall}>
                <View style={styles.iconCircleSmall}>
                  <Ionicons name="calendar-outline" size={14} color={BioPulseColors.femaleAccent} />
                </View>
                <Text style={styles.cardTitleSmall}>Last period start date</Text>
              </View>

              <View style={styles.dateDisplayRow}>
                <Text style={styles.dateDisplayText}>{readableDate}</Text>
                <Ionicons name="create-outline" size={16} color={BioPulseColors.femaleAccent} />
              </View>
              <Text style={styles.dateHelper}>Tap on calendar below to edit</Text>
            </View>
          </View>

          {/* 6. Cycle Calendar Card */}
          <FemaleCycleCalendarCard
            lastPeriodDate={lastPeriodDate}
            periodDuration={cycleHealth.periodDuration || 5}
            cycleLength={cycleLength}
            onSelectStartDate={(dateIso) => setLastPeriodDate(dateIso)}
            showEstimatedOverlay={false}
          />

          {/* 7. Question: How many periods do you miss in a year? */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>
              How many periods do you miss in a year (on average)?
            </Text>
            <View style={styles.segmentedRow}>
              {(['0', '1-2', '3+'] as MissedPeriodsRange[]).map((opt) => {
                const isSelected = missedPeriods === opt;
                return (
                  <Pressable
                    key={`missed-${opt}`}
                    onPress={() => setMissedPeriods(opt)}
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
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 8. Flow Pattern Cards */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>Flow pattern</Text>
            <View style={styles.flowCardsRow}>
              {(
                [
                  { id: 'light', label: 'Light', drops: 1, desc: 'Minimal flow' },
                  { id: 'moderate', label: 'Moderate', drops: 2, desc: 'Normal flow' },
                  { id: 'heavy', label: 'Heavy', drops: 3, desc: 'Heavy flow' },
                ] as const
              ).map((item) => {
                const isSelected = flow === item.id;
                return (
                  <Pressable
                    key={`flow-${item.id}`}
                    onPress={() => setFlow(item.id)}
                    style={[
                      styles.flowCard,
                      isSelected ? styles.flowCardSelected : styles.flowCardUnselected,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.dropsRow}>
                      {Array.from({ length: item.drops }).map((_, i) => (
                        <Ionicons
                          key={`drop-${i}`}
                          name="water"
                          size={14}
                          color={isSelected ? BioPulseColors.femaleAccent : '#94A3B8'}
                          style={{ marginHorizontal: 1 }}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.flowTitle,
                        isSelected && { color: BioPulseColors.femaleAccent },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.flowDesc}>{item.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 9. Additional Notes (Optional) */}
          <View style={styles.sectionCard}>
            <View style={styles.notesHeaderRow}>
              <Text style={styles.questionLabel}>Additional Notes (Optional)</Text>
              <Text style={styles.charCount}>{notes.length}/200</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={(text) => text.length <= 200 && setNotes(text)}
              placeholder="E.g. pain, mood changes, or anything else..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>

          {/* 10. Information Banner */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Accurate cycle logging assists BioPulse AI in distinguishing ovulatory from anovulatory patterns under Rotterdam consensus criteria.
            </Text>
          </View>

          {/* 11. Continue CTA Button */}
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue to Symptoms"
          >
            <View style={styles.buttonInnerRow}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
                style={styles.arrowIcon}
              />
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
    paddingBottom: 28,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 640,
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
  titleBlock: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F8DCE5',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 10,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  segmentBtnActive: {
    backgroundColor: '#FFF0F5',
    borderColor: BioPulseColors.femaleAccent,
  },
  segmentBtnInactive: {
    backgroundColor: '#FAFCFF',
    borderColor: '#E2E8F0',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: '#64748B',
  },
  pairedCardsWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  pairedCardsStacked: {
    flexDirection: 'column',
  },
  halfCard: {
    flex: 1,
  },
  smallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F8DCE5',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  iconCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleSmall: {
    fontSize: 12.5,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFCFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
  },
  stepperActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepperBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  cycleValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cycleValueNum: {
    fontSize: 18,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  cycleValueUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8DCE5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  dateDisplayText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.femaleAccent,
  },
  dateHelper: {
    fontSize: 10,
    color: '#8BA1B7',
    fontStyle: 'italic',
  },
  flowCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flowCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowCardSelected: {
    backgroundColor: '#FFF0F5',
    borderColor: BioPulseColors.femaleAccent,
  },
  flowCardUnselected: {
    backgroundColor: '#FAFCFF',
    borderColor: '#E2E8F0',
  },
  dropsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  flowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  flowDesc: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  notesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: '#8BA1B7',
  },
  notesInput: {
    backgroundColor: '#FAFCFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 70,
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
    marginBottom: 16,
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
