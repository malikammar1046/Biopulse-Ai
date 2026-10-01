import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import { OnboardingStepper, PathwayHeader } from '../components/onboarding';
import { useFemaleOnboarding, FemaleLifestyleState } from '../features/onboarding/FemaleOnboardingContext';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../components/navigation';

const FEMALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Cycle Health' },
  { id: 3, label: 'Symptoms' },
  { id: 4, label: 'Lifestyle' },
  { id: 5, label: 'Review' },
];

/**
 * SCREEN 8/12: FEMALE LIFESTYLE & DAILY HABITS (Step 4 of 5)
 */
export default function FemaleLifestyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const isFromReview = params.returnTo === 'review';

  const { lifestyle, updateLifestyle, setLastActiveScreeningRoute } = useFemaleOnboarding();

  // Track that user is on Lifestyle step
  useEffect(() => {
    setLastActiveScreeningRoute('/female-lifestyle');
  }, [setLastActiveScreeningRoute]);

  const [fastFoodIntake, setFastFoodIntake] = useState<FemaleLifestyleState['fastFoodIntake']>(
    lifestyle.fastFoodIntake || 'occasionally'
  );
  const [exerciseFrequency, setExerciseFrequency] = useState<FemaleLifestyleState['exerciseFrequency']>(
    lifestyle.exerciseFrequency || '1-2_days'
  );
  const [sleepHours, setSleepHours] = useState<number>(lifestyle.sleepHours || 7);
  const [stressLevel, setStressLevel] = useState<FemaleLifestyleState['stressLevel']>(
    lifestyle.stressLevel || 'moderate'
  );

  // Persist draft before switching tabs
  const handleBeforeTabNavigate = useCallback(() => {
    updateLifestyle({
      fastFoodIntake,
      exerciseFrequency,
      sleepHours,
      stressLevel,
    });
    setLastActiveScreeningRoute('/female-lifestyle');
  }, [fastFoodIntake, exerciseFrequency, sleepHours, stressLevel, updateLifestyle, setLastActiveScreeningRoute]);

  const handleSaveAndContinue = useCallback(() => {
    updateLifestyle({
      fastFoodIntake,
      exerciseFrequency,
      sleepHours,
      stressLevel,
    });
    router.push('/female-review');
  }, [fastFoodIntake, exerciseFrequency, sleepHours, stressLevel, updateLifestyle, router]);

  const handleBack = useCallback(() => {
    updateLifestyle({
      fastFoodIntake,
      exerciseFrequency,
      sleepHours,
      stressLevel,
    });
    if (isFromReview) {
      router.push('/female-review');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/female-symptoms');
    }
  }, [fastFoodIntake, exerciseFrequency, sleepHours, stressLevel, updateLifestyle, isFromReview, router]);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: 0,
        },
      ]}
    >
      <AuthBackgroundFoliage />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PathwayHeader
          onBack={handleBack}
          subtitle="WOMEN'S HEALTH INTELLIGENCE"
          showHelp={false}
        />

        <OnboardingStepper
          currentStep={4}
          steps={FEMALE_ONBOARDING_STEPS}
          accentColor={BioPulseColors.femaleAccent}
        />

        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Lifestyle & Daily Habits</Text>
          <Text style={styles.screenSubtitle}>
            Your daily routines influence metabolic equilibrium and endocrine regulation.
          </Text>
        </View>

        {/* Fast Food / Diet */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="restaurant-outline" size={20} color={BioPulseColors.femaleAccent} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Fast Food / Processed Meals</Text>
          </View>
          <View style={styles.optionsRow}>
            {[
              { id: 'never', label: 'Rarely / Never' },
              { id: 'occasionally', label: 'Sometimes' },
              { id: 'frequently', label: 'Frequently' },
            ].map((opt) => {
              const selected = fastFoodIntake === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setFastFoodIntake(opt.id as any)}
                  style={[styles.pillOption, selected && styles.pillOptionSelected]}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Exercise Frequency */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="barbell-outline" size={20} color={BioPulseColors.femaleAccent} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Physical Activity Frequency</Text>
          </View>
          <View style={styles.optionsRow}>
            {[
              { id: 'none', label: 'Sedentary' },
              { id: '1-2_days', label: '1–2 times/week' },
              { id: '3+_days', label: '3+ times/week' },
            ].map((opt) => {
              const selected = exerciseFrequency === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setExerciseFrequency(opt.id as any)}
                  style={[styles.pillOption, selected && styles.pillOptionSelected]}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sleep Hours */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon-outline" size={20} color={BioPulseColors.femaleAccent} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Average Nightly Sleep</Text>
          </View>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setSleepHours((h) => Math.max(4, h - 1))}
              style={styles.stepperBtn}
            >
              <Ionicons name="remove" size={18} color={BioPulseColors.femaleAccent} />
            </Pressable>
            <Text style={styles.stepperValue}>{sleepHours} hours</Text>
            <Pressable
              onPress={() => setSleepHours((h) => Math.min(12, h + 1))}
              style={styles.stepperBtn}
            >
              <Ionicons name="add" size={18} color={BioPulseColors.femaleAccent} />
            </Pressable>
          </View>
        </View>

        {/* Stress Level */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={20} color={BioPulseColors.femaleAccent} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Perceived Stress Level</Text>
          </View>
          <View style={styles.optionsRow}>
            {[
              { id: 'low', label: 'Low' },
              { id: 'moderate', label: 'Moderate' },
              { id: 'high', label: 'High' },
            ].map((opt) => {
              const selected = stressLevel === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setStressLevel(opt.id as any)}
                  style={[styles.pillOption, selected && styles.pillOptionSelected]}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Continue Button */}
        <Pressable
          onPress={handleSaveAndContinue}
          style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.submitBtnText}>
            {isFromReview ? 'Save & Return to Review →' : 'Continue to Review →'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Permanent BioPulse Bottom Navigation */}
      <BioPulseBottomNav activeTab="screening" beforeNavigate={handleBeforeTabNavigate} />
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
  titleSection: {
    marginVertical: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A5F',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCE7F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  pillOptionSelected: {
    borderColor: BioPulseColors.femaleAccent,
    backgroundColor: '#FDF0F4',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pillTextSelected: {
    color: BioPulseColors.femaleAccent,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF0F4',
    borderWidth: 1,
    borderColor: '#F8CAD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  submitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: BioPulseColors.femaleAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
