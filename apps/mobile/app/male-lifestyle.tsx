import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import {
  OnboardingStepper,
  PathwayHeader,
} from '../components/onboarding';
import { useMaleOnboarding } from '../features/onboarding';

const MALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Health' },
  { id: 2, label: 'ADAM' },
  { id: 3, label: 'Metabolic' },
  { id: 4, label: 'Review' },
];

export default function MaleLifestyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { lifestyle, updateLifestyle, setLastActiveScreeningRoute } = useMaleOnboarding();

  const [exercise, setExercise] = useState(lifestyle.exerciseFrequency || '1-2_days');
  const [fastFood, setFastFood] = useState(lifestyle.fastFoodIntake || 'occasionally');
  const [sleep, setSleep] = useState(lifestyle.sleepHours || 7);
  const [stress, setStress] = useState(lifestyle.stressLevel || 'moderate');
  const [notes, setNotes] = useState(lifestyle.notes || '');

  const handleContinue = useCallback(() => {
    updateLifestyle({
      exerciseFrequency: exercise,
      fastFoodIntake: fastFood,
      sleepHours: sleep,
      stressLevel: stress,
      notes,
    });
    setLastActiveScreeningRoute('/male-review');
    router.push('/male-review');
  }, [exercise, fastFood, sleep, stress, notes, updateLifestyle, setLastActiveScreeningRoute, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Pathway Header */}
      <View style={{ paddingTop: Math.max(insets.top, 10) }}>
        <PathwayHeader
          onBack={handleBack}
          subtitle="MEN'S HEALTH INTELLIGENCE"
        />
      </View>

      {/* Stepper */}
      <View style={styles.stepperWrap}>
        <OnboardingStepper
          steps={MALE_ONBOARDING_STEPS}
          currentStep={3}
          accentColor={BioPulseColors.malePrimary}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Physical Activity & Resistance Training</Text>
          <Text style={styles.cardSubtitle}>
            Regular resistance exercise stimulates Leydig cell testosterone biosynthesis and improves insulin sensitivity.
          </Text>
          <View style={styles.chipRow}>
            {[
              { id: 'none', label: 'Sedentary (0 days)' },
              { id: '1-2_days', label: '1 - 2 days / week' },
              { id: '3+_days', label: '3+ days / week' },
            ].map((item) => {
              const isSelected = exercise === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setExercise(item.id as any)}
                  style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Fast Food / Dietary Habits */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fast Food & Processed Intake</Text>
          <Text style={styles.cardSubtitle}>
            Diets high in ultra-processed fats impair endocrine signaling and testosterone aromatization.
          </Text>
          <View style={styles.chipRow}>
            {[
              { id: 'never', label: 'Rarely / Never' },
              { id: 'occasionally', label: '1 - 2 times / week' },
              { id: 'frequently', label: '3+ times / week' },
            ].map((item) => {
              const isSelected = fastFood === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFastFood(item.id as any)}
                  style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sleep Hours Stepper */}
        <View style={styles.card}>
          <View style={styles.headerIconRow}>
            <Ionicons name="moon-outline" size={18} color={BioPulseColors.malePrimary} />
            <Text style={styles.cardTitle}>Nightly Sleep Duration</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Peak testosterone synthesis occurs during uninterrupted REM sleep stages.
          </Text>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setSleep((prev) => Math.max(4, prev - 1))}
              style={styles.stepBtn}
            >
              <Ionicons name="remove" size={18} color={BioPulseColors.malePrimary} />
            </Pressable>
            <View style={styles.stepDisplay}>
              <Text style={styles.stepValue}>{sleep}</Text>
              <Text style={styles.stepUnit}>hours / night</Text>
            </View>
            <Pressable
              onPress={() => setSleep((prev) => Math.min(12, prev + 1))}
              style={styles.stepBtn}
            >
              <Ionicons name="add" size={18} color={BioPulseColors.malePrimary} />
            </Pressable>
          </View>
        </View>

        {/* Stress Level */}
        <View style={styles.card}>
          <View style={styles.headerIconRow}>
            <Ionicons name="pulse-outline" size={18} color={BioPulseColors.malePrimary} />
            <Text style={styles.cardTitle}>Chronic Stress Level</Text>
          </View>
          <View style={styles.chipRow}>
            {[
              { id: 'low', label: 'Low' },
              { id: 'moderate', label: 'Moderate' },
              { id: 'high', label: 'High' },
            ].map((item) => {
              const isSelected = stress === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setStress(item.id as any)}
                  style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Optional Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clinical Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any current medications, supplements, or symptoms..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Bottom Continue Action */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.continueBtn, pressed && styles.continueBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Continue to Review"
        >
          <Text style={styles.continueBtnText}>Continue to Review</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stepperWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    lineHeight: 16,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipBtnSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: BioPulseColors.malePrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  chipTextSelected: {
    color: BioPulseColors.malePrimary,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  stepDisplay: {
    alignItems: 'center',
    minWidth: 90,
  },
  stepValue: {
    fontSize: 28,
    fontWeight: '800',
    color: BioPulseColors.malePrimary,
  },
  stepUnit: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  continueBtn: {
    backgroundColor: BioPulseColors.malePrimary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
