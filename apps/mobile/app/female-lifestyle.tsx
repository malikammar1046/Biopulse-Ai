import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
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
import { useFemaleOnboarding, FemaleLifestyleState } from '../features/onboarding';

/**
 * SCREEN 9: FEMALE LIFESTYLE (Step 4 of 5)
 *
 * Matches Screenshot 9:
 * - Header: Step 4 of 5 with 4 segments filled
 * - Title: "Lifestyle" with running wellness icon
 * - Fast food / processed food frequency (Rarely | 1–2 times | 3+ times)
 * - Exercise frequency (None | 1–2 times | 3+ times)
 * - Sleep (average per night): < 6 hrs | 6–8 hrs | > 8 hrs
 * - Stress level: Low | Moderate | High
 * - Compact dropdown-style row for Water (1.6 L), Smoking (No), Alcohol (Rarely)
 * - Additional notes (optional) with 0/200 limit
 * - Primary "Continue →" pink CTA
 */
export default function FemaleLifestyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { lifestyle, updateLifestyle } = useFemaleOnboarding();

  // Local state
  const [fastFood, setFastFood] = useState<FemaleLifestyleState['fastFoodIntake']>(
    lifestyle.fastFoodIntake || 'occasionally'
  );
  const [exercise, setExercise] = useState<FemaleLifestyleState['exerciseFrequency']>(
    lifestyle.exerciseFrequency || '1-2_days'
  );
  const [sleep, setSleep] = useState<number>(lifestyle.sleepHours || 7);
  const [stress, setStress] = useState<FemaleLifestyleState['stressLevel']>(
    lifestyle.stressLevel || 'moderate'
  );
  const [water, setWater] = useState<string>('1.6 L');
  const [smoking, setSmoking] = useState<string>('No');
  const [alcohol, setAlcohol] = useState<string>('Rarely');
  const [notes, setNotes] = useState<string>('');

  const bottomPad = Math.max(insets.bottom, 20);

  const handleContinue = useCallback(() => {
    updateLifestyle({
      fastFoodIntake: fastFood,
      exerciseFrequency: exercise,
      sleepHours: sleep,
      stressLevel: stress,
    });
    router.push('/female-review');
  }, [fastFood, exercise, sleep, stress, updateLifestyle, router]);

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Top Navigation Bar with Step 4 of 5 */}
      <FemaleOnboardingHeader
        step={4}
        totalSteps={5}
        onBack={() => router.back()}
        accentColor="#F43F7D"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Header Title with Running Icon */}
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <Ionicons name="walk" size={24} color="#0284C7" />
            </View>
            <View style={styles.headerTitleTextCol}>
              <Text style={styles.screenTitle}>Lifestyle</Text>
              <Text style={styles.screenSubtitle}>
                Your daily habits can impact PCOS symptoms. Share a few details to get a clearer picture.
              </Text>
            </View>
          </View>

          {/* 1. Fast food / processed food */}
          <View style={styles.sectionBox}>
            <View style={styles.labelRow}>
              <Ionicons name="fast-food-outline" size={17} color={BioPulseColors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionLabel}>Fast food / processed food</Text>
              <Ionicons name="information-circle-outline" size={15} color={BioPulseColors.textSecondary} style={{ marginLeft: 4 }} />
            </View>

            <View style={styles.pillRow}>
              {[
                { key: 'never', label: 'Rarely' },
                { key: 'occasionally', label: '1–2 times\nper week' },
                { key: 'frequently', label: '3+ times\nper week' },
              ].map((item) => {
                const isSelected = fastFood === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setFastFood(item.key as FemaleLifestyleState['fastFoodIntake'])}
                    style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                  >
                    <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 2. Exercise frequency */}
          <View style={styles.sectionBox}>
            <View style={styles.labelRow}>
              <Ionicons name="barbell-outline" size={17} color={BioPulseColors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionLabel}>Exercise frequency</Text>
              <Ionicons name="information-circle-outline" size={15} color={BioPulseColors.textSecondary} style={{ marginLeft: 4 }} />
            </View>

            <View style={styles.pillRow}>
              {[
                { key: 'none', label: 'None' },
                { key: '1-2_days', label: '1–2 times\nper week' },
                { key: '3+_days', label: '3+ times\nper week' },
              ].map((item) => {
                const isSelected = exercise === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setExercise(item.key as FemaleLifestyleState['exerciseFrequency'])}
                    style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                  >
                    <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 3. Sleep (average per night) */}
          <View style={styles.sectionBox}>
            <View style={styles.labelRow}>
              <Ionicons name="moon-outline" size={17} color={BioPulseColors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionLabel}>Sleep (average per night)</Text>
            </View>

            <View style={styles.pillRow}>
              {[
                { val: 5, label: '< 6 hrs' },
                { val: 7, label: '6–8 hrs' },
                { val: 9, label: '> 8 hrs' },
              ].map((item) => {
                const isSelected =
                  (item.val === 5 && sleep < 6) ||
                  (item.val === 7 && sleep >= 6 && sleep <= 8) ||
                  (item.val === 9 && sleep > 8);
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setSleep(item.val)}
                    style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                  >
                    <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 4. Stress level */}
          <View style={styles.sectionBox}>
            <View style={styles.labelRow}>
              <Ionicons name="pulse-outline" size={17} color={BioPulseColors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionLabel}>Stress level</Text>
            </View>

            <View style={styles.pillRow}>
              {(['low', 'moderate', 'high'] as FemaleLifestyleState['stressLevel'][]).map((lvl) => {
                const label = lvl.charAt(0).toUpperCase() + lvl.slice(1);
                const isSelected = stress === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => setStress(lvl)}
                    style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                  >
                    <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Compact Selectors Row (Water, Smoking, Alcohol) */}
          <View style={styles.compactRow}>
            {/* Water */}
            <View style={styles.compactCol}>
              <View style={styles.compactLabelRow}>
                <Ionicons name="water" size={13} color="#0EA5E9" style={{ marginRight: 3 }} />
                <Text style={styles.compactLabel}>Water</Text>
              </View>
              <Pressable
                onPress={() => setWater((w) => (w === '1.6 L' ? '2.5 L' : w === '2.5 L' ? '1.0 L' : '1.6 L'))}
                style={styles.dropdownPill}
              >
                <Text style={styles.dropdownText}>{water}</Text>
                <Ionicons name="chevron-down" size={13} color={BioPulseColors.textMuted} />
              </Pressable>
            </View>

            {/* Smoking */}
            <View style={styles.compactCol}>
              <View style={styles.compactLabelRow}>
                <Ionicons name="ban-outline" size={13} color="#EF4444" style={{ marginRight: 3 }} />
                <Text style={styles.compactLabel}>Smoking</Text>
              </View>
              <Pressable
                onPress={() => setSmoking((s) => (s === 'No' ? 'Yes' : 'No'))}
                style={styles.dropdownPill}
              >
                <Text style={styles.dropdownText}>{smoking}</Text>
                <Ionicons name="chevron-down" size={13} color={BioPulseColors.textMuted} />
              </Pressable>
            </View>

            {/* Alcohol */}
            <View style={styles.compactCol}>
              <View style={styles.compactLabelRow}>
                <Ionicons name="wine-outline" size={13} color="#8B5CF6" style={{ marginRight: 3 }} />
                <Text style={styles.compactLabel}>Alcohol</Text>
              </View>
              <Pressable
                onPress={() => setAlcohol((a) => (a === 'Rarely' ? 'Never' : a === 'Never' ? 'Weekly' : 'Rarely'))}
                style={styles.dropdownPill}
              >
                <Text style={styles.dropdownText}>{alcohol}</Text>
                <Ionicons name="chevron-down" size={13} color={BioPulseColors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* 6. Additional notes (optional) */}
          <View style={[styles.sectionBox, { marginTop: 12 }]}>
            <Text style={styles.sectionLabel}>Additional notes (optional)</Text>
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="E.g. diet details, work routine, etc."
                placeholderTextColor={BioPulseColors.textMuted}
                value={notes}
                onChangeText={(t) => setNotes(t.slice(0, 200))}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{notes.length}/200</Text>
            </View>
          </View>

          {/* Continue CTA */}
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
    backgroundColor: '#E0F2FE',
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
  sectionBox: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionPill: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  optionPillSelected: {
    backgroundColor: '#F43F7D',
    borderColor: '#F43F7D',
  },
  optionPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
  optionPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  compactRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  compactCol: {
    flex: 1,
  },
  compactLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.textSecondary,
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    paddingHorizontal: 10,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    padding: 12,
  },
  notesInput: {
    minHeight: 54,
    fontSize: 14,
    color: BioPulseColors.textPrimary,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: BioPulseColors.textMuted,
    marginTop: 4,
  },
  ctaWrapper: {
    marginTop: 8,
  },
});
