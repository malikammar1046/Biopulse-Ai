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
import { MaleOnboardingHeader } from '../components/onboarding/MaleOnboardingHeader';
import {
  useMaleOnboarding,
  MaleActivityLevel,
  MaleWeightContext,
  MaleMetabolicResponse,
  MaleSleepRange,
} from '../features/onboarding';

/**
 * SCREEN 15 — MALE LIFESTYLE & METABOLIC PROFILE
 *
 * Strict visual match to Screenshot 15:
 * - Header: Step 3 of 4 (segmented blue pills)
 * - Title: "Lifestyle & Metabolic Profile"
 * - Subtitle: "This helps us understand factors that can affect your hormonal and metabolic health."
 * - Section 1: Activity Level (4 cards: Sedentary, Lightly Active [selected], Active, Very Active)
 * - Section 2: Weight Context (3 cards: Stable [selected], Recent weight gain, Trying to lose weight)
 * - Section 3: Metabolic Health (3 rows: Diabetes/Prediabetes, High Cholesterol, High BP with [No | Yes | Not sure] segmented pills)
 * - Section 4: Sleep (Average per night) (< 6 hours, 6–8 hours [selected], > 8 hours)
 * - Section 5: Additional Notes (Optional)
 * - CTA: Solid royal blue "Continue" button
 */
export default function MaleLifestyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { lifestyle, updateLifestyle, setLastActiveScreeningRoute } = useMaleOnboarding();

  // Local state initialized with context or matching reference design
  const [activity, setActivity] = useState<MaleActivityLevel>(lifestyle.activityLevel || 'lightly_active');
  const [weightContext, setWeightContext] = useState<MaleWeightContext>(lifestyle.weightContext || 'stable');
  const [diabetes, setDiabetes] = useState<MaleMetabolicResponse>(lifestyle.diabetes || 'no');
  const [cholesterol, setCholesterol] = useState<MaleMetabolicResponse>(lifestyle.highCholesterol || 'no');
  const [bloodPressure, setBloodPressure] = useState<MaleMetabolicResponse>(lifestyle.highBloodPressure || 'no');
  const [sleepRange, setSleepRange] = useState<MaleSleepRange>(lifestyle.sleepRange || '6_8');
  const [notes, setNotes] = useState<string>(lifestyle.notes || '');

  const bottomPad = Math.max(insets.bottom, 20);

  const handleContinue = useCallback(() => {
    // Map activityLevel to legacy exerciseFrequency for backend ML model
    let exerciseFrequency: 'none' | '1-2_days' | '3+_days' = '1-2_days';
    if (activity === 'sedentary') exerciseFrequency = 'none';
    else if (activity === 'active' || activity === 'very_active') exerciseFrequency = '3+_days';

    // Map sleepRange to numeric sleepHours
    let sleepHours = 7;
    if (sleepRange === 'less_6') sleepHours = 5;
    else if (sleepRange === 'more_8') sleepHours = 9;

    updateLifestyle({
      activityLevel: activity,
      weightContext,
      diabetes,
      highCholesterol: cholesterol,
      highBloodPressure: bloodPressure,
      sleepRange,
      exerciseFrequency,
      sleepHours,
      notes,
    });

    setLastActiveScreeningRoute('/male-review');
    router.push('/male-review');
  }, [
    activity,
    weightContext,
    diabetes,
    cholesterol,
    bloodPressure,
    sleepRange,
    notes,
    updateLifestyle,
    setLastActiveScreeningRoute,
    router,
  ]);

  return (
    <BioPulseBackground style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Header: Step 3 of 4 */}
      <MaleOnboardingHeader
        step={3}
        totalSteps={4}
        onBack={() => router.back()}
        accentColor="#0284C7"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Lifestyle & Metabolic Profile</Text>
            <Text style={styles.screenSubtitle}>
              This helps us understand factors that can affect your hormonal and metabolic health.
            </Text>
          </View>

          {/* SECTION 1: ACTIVITY LEVEL */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Activity Level</Text>
            <View style={styles.activityGrid}>
              {/* Sedentary */}
              <Pressable
                onPress={() => setActivity('sedentary')}
                style={[
                  styles.activityCard,
                  activity === 'sedentary' && styles.activityCardActive,
                ]}
              >
                <Ionicons
                  name="bed-outline"
                  size={24}
                  color={activity === 'sedentary' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.activityCardTitle,
                    activity === 'sedentary' && styles.activityCardTitleActive,
                  ]}
                >
                  Sedentary
                </Text>
                <Text style={styles.activityCardSub}>(Little or no{'\n'}exercise)</Text>
              </Pressable>

              {/* Lightly Active */}
              <Pressable
                onPress={() => setActivity('lightly_active')}
                style={[
                  styles.activityCard,
                  activity === 'lightly_active' && styles.activityCardActive,
                ]}
              >
                <Ionicons
                  name="walk-outline"
                  size={24}
                  color={activity === 'lightly_active' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.activityCardTitle,
                    activity === 'lightly_active' && styles.activityCardTitleActive,
                  ]}
                >
                  Lightly Active
                </Text>
                <Text style={styles.activityCardSub}>(1–2 days/{'\n'}week)</Text>
              </Pressable>

              {/* Active */}
              <Pressable
                onPress={() => setActivity('active')}
                style={[
                  styles.activityCard,
                  activity === 'active' && styles.activityCardActive,
                ]}
              >
                <Ionicons
                  name="fitness-outline"
                  size={24}
                  color={activity === 'active' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.activityCardTitle,
                    activity === 'active' && styles.activityCardTitleActive,
                  ]}
                >
                  Active
                </Text>
                <Text style={styles.activityCardSub}>(3–5 days/{'\n'}week)</Text>
              </Pressable>

              {/* Very Active */}
              <Pressable
                onPress={() => setActivity('very_active')}
                style={[
                  styles.activityCard,
                  activity === 'very_active' && styles.activityCardActive,
                ]}
              >
                <Ionicons
                  name="barbell-outline"
                  size={24}
                  color={activity === 'very_active' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.activityCardTitle,
                    activity === 'very_active' && styles.activityCardTitleActive,
                  ]}
                >
                  Very Active
                </Text>
                <Text style={styles.activityCardSub}>(5+ days/{'\n'}week)</Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 2: WEIGHT CONTEXT */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Weight Context</Text>
            <View style={styles.weightContextRow}>
              {/* Stable */}
              <Pressable
                onPress={() => setWeightContext('stable')}
                style={[
                  styles.weightCard,
                  weightContext === 'stable' && styles.weightCardActive,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  color={weightContext === 'stable' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.weightCardTitle,
                    weightContext === 'stable' && styles.weightCardTitleActive,
                  ]}
                >
                  Stable
                </Text>
                <Text style={styles.weightCardSub}>(No significant{'\n'}change)</Text>
              </Pressable>

              {/* Recent weight gain */}
              <Pressable
                onPress={() => setWeightContext('recent_gain')}
                style={[
                  styles.weightCard,
                  weightContext === 'recent_gain' && styles.weightCardActive,
                ]}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={24}
                  color={weightContext === 'recent_gain' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.weightCardTitle,
                    weightContext === 'recent_gain' && styles.weightCardTitleActive,
                  ]}
                >
                  Recent{'\n'}weight gain
                </Text>
                <Text style={styles.weightCardSub}>{'(> 5 kg)'}</Text>
              </Pressable>

              {/* Trying to lose weight */}
              <Pressable
                onPress={() => setWeightContext('trying_to_lose')}
                style={[
                  styles.weightCard,
                  weightContext === 'trying_to_lose' && styles.weightCardActive,
                ]}
              >
                <Ionicons
                  name="flame-outline"
                  size={24}
                  color={weightContext === 'trying_to_lose' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.weightCardTitle,
                    weightContext === 'trying_to_lose' && styles.weightCardTitleActive,
                  ]}
                >
                  Trying to{'\n'}lose weight
                </Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 3: METABOLIC HEALTH */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Metabolic Health</Text>

            {/* Row 1: Diabetes / Prediabetes */}
            <View style={styles.metabolicRow}>
              <View style={styles.metabolicLeft}>
                <View style={styles.metabolicIconBox}>
                  <Ionicons name="medkit-outline" size={18} color="#0284C7" />
                </View>
                <Text style={styles.metabolicLabel}>Diabetes / Prediabetes</Text>
              </View>
              <View style={styles.segmentGroup}>
                <Pressable
                  onPress={() => setDiabetes('no')}
                  style={[styles.segmentBtn, diabetes === 'no' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, diabetes === 'no' && styles.segmentBtnTextActive]}>
                    No
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDiabetes('yes')}
                  style={[styles.segmentBtn, diabetes === 'yes' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, diabetes === 'yes' && styles.segmentBtnTextActive]}>
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDiabetes('not_sure')}
                  style={[styles.segmentBtn, diabetes === 'not_sure' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, diabetes === 'not_sure' && styles.segmentBtnTextActive]}>
                    Not sure
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Row 2: High Cholesterol */}
            <View style={styles.metabolicRow}>
              <View style={styles.metabolicLeft}>
                <View style={styles.metabolicIconBox}>
                  <Ionicons name="heart-outline" size={18} color="#0284C7" />
                </View>
                <Text style={styles.metabolicLabel}>High Cholesterol</Text>
              </View>
              <View style={styles.segmentGroup}>
                <Pressable
                  onPress={() => setCholesterol('no')}
                  style={[styles.segmentBtn, cholesterol === 'no' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, cholesterol === 'no' && styles.segmentBtnTextActive]}>
                    No
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCholesterol('yes')}
                  style={[styles.segmentBtn, cholesterol === 'yes' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, cholesterol === 'yes' && styles.segmentBtnTextActive]}>
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCholesterol('not_sure')}
                  style={[styles.segmentBtn, cholesterol === 'not_sure' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, cholesterol === 'not_sure' && styles.segmentBtnTextActive]}>
                    Not sure
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Row 3: High Blood Pressure */}
            <View style={styles.metabolicRow}>
              <View style={styles.metabolicLeft}>
                <View style={styles.metabolicIconBox}>
                  <Ionicons name="shield-outline" size={18} color="#0284C7" />
                </View>
                <Text style={styles.metabolicLabel}>High Blood Pressure</Text>
              </View>
              <View style={styles.segmentGroup}>
                <Pressable
                  onPress={() => setBloodPressure('no')}
                  style={[styles.segmentBtn, bloodPressure === 'no' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, bloodPressure === 'no' && styles.segmentBtnTextActive]}>
                    No
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setBloodPressure('yes')}
                  style={[styles.segmentBtn, bloodPressure === 'yes' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, bloodPressure === 'yes' && styles.segmentBtnTextActive]}>
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setBloodPressure('not_sure')}
                  style={[styles.segmentBtn, bloodPressure === 'not_sure' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, bloodPressure === 'not_sure' && styles.segmentBtnTextActive]}>
                    Not sure
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* SECTION 4: SLEEP (AVERAGE PER NIGHT) */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Sleep (Average per night)</Text>
            <View style={styles.sleepRow}>
              <View style={styles.sleepIconBox}>
                <Ionicons name="bed-outline" size={18} color="#0284C7" />
              </View>
              <View style={styles.sleepSegmentGroup}>
                <Pressable
                  onPress={() => setSleepRange('less_6')}
                  style={[styles.sleepSegmentBtn, sleepRange === 'less_6' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, sleepRange === 'less_6' && styles.segmentBtnTextActive]}>
                    {'< 6 hours'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSleepRange('6_8')}
                  style={[styles.sleepSegmentBtn, sleepRange === '6_8' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, sleepRange === '6_8' && styles.segmentBtnTextActive]}>
                    6–8 hours
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSleepRange('more_8')}
                  style={[styles.sleepSegmentBtn, sleepRange === 'more_8' && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentBtnText, sleepRange === 'more_8' && styles.segmentBtnTextActive]}>
                    {'> 8 hours'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* SECTION 5: ADDITIONAL NOTES (OPTIONAL) */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Additional Notes (Optional)</Text>
            <View style={styles.notesBox}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any additional information..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Primary Action Button */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Continue"
              onPress={handleContinue}
              style={styles.continueButton}
            />
          </View>
        </View>
      </ScrollView>
    </BioPulseBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
  },
  titleSection: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#073B72',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  activityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  activityCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  activityCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'center',
  },
  activityCardTitleActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  activityCardSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },
  weightContextRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  weightCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  weightCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'center',
  },
  weightCardTitleActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  weightCardSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },
  metabolicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  metabolicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  metabolicIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  metabolicLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  segmentGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#0284C7',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sleepIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sleepSegmentGroup: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  sleepSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notesInput: {
    fontSize: 14,
    color: '#0F172A',
    minHeight: 44,
  },
  ctaWrapper: {
    marginTop: 10,
    marginBottom: 8,
  },
  continueButton: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    height: 52,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
