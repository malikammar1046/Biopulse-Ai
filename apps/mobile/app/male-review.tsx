import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
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
import { submitMaleTier1AssessmentWithStatus } from '../services/assessmentService';

const MALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Health' },
  { id: 2, label: 'ADAM' },
  { id: 3, label: 'Metabolic' },
  { id: 4, label: 'Review' },
];

export default function MaleReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    basicInfo,
    adam,
    lifestyle,
    calculateAdamScore,
    setActiveAssessment,
    setIsLoadingAssessment,
    setAssessmentError,
  } = useMaleOnboarding();

  const [submitting, setSubmitting] = useState(false);
  const adamSummary = calculateAdamScore();

  const handleEditSection = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  const handleRunScreening = useCallback(async () => {
    setSubmitting(true);
    setIsLoadingAssessment(true);
    setAssessmentError(null);

    const answersRecord: Record<string, boolean> = {};
    Object.entries(adam.answers).forEach(([k, v]) => {
      answersRecord[`q${k}`] = v;
    });

    const payload = {
      age: basicInfo.age,
      weight_kg: basicInfo.weightKg,
      height_cm: basicInfo.heightCm,
      bmi: basicInfo.bmi,
      waist_cm: basicInfo.waistCm,
      sleep_hours: lifestyle.sleepHours,
      low_energy_flag: adam.answers[2] ? 1 : 0,
      decreased_libido_flag: adam.answers[1] ? 1 : 0,
      exercise_frequency: lifestyle.exerciseFrequency,
      fast_food: lifestyle.fastFoodIntake === 'frequently' ? 1 : 0,
      adam_answers: answersRecord,
    };

    try {
      const res = await submitMaleTier1AssessmentWithStatus(payload);
      if (res.data) {
        setActiveAssessment(res.data);
        router.push('/male-screening-result');
      } else {
        Alert.alert(
          'Screening Notice',
          res.error || 'Unable to complete male screening at this time. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred during screening.');
    } finally {
      setSubmitting(false);
      setIsLoadingAssessment(false);
    }
  }, [basicInfo, adam, lifestyle, setActiveAssessment, setIsLoadingAssessment, setAssessmentError, router]);

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
          currentStep={4}
          accentColor={BioPulseColors.malePrimary}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Basic Health */}
        <View style={styles.reviewCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="body-outline" size={18} color={BioPulseColors.malePrimary} />
              <Text style={styles.cardTitle}>Basic Health Profile</Text>
            </View>
            <Pressable
              onPress={() => handleEditSection('/male-basic-info')}
              style={styles.editBtn}
              hitSlop={8}
            >
              <Text style={styles.editBtnText}>Edit</Text>
              <Ionicons name="pencil" size={12} color={BioPulseColors.malePrimary} />
            </Pressable>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Age</Text>
              <Text style={styles.metricVal}>{basicInfo.age} yrs</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Height</Text>
              <Text style={styles.metricVal}>{basicInfo.heightCm} cm</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Weight</Text>
              <Text style={styles.metricVal}>{basicInfo.weightKg} kg</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>BMI</Text>
              <Text style={styles.metricVal}>{basicInfo.bmi} kg/m²</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Waist</Text>
              <Text style={styles.metricVal}>{basicInfo.waistCm} cm</Text>
            </View>
          </View>
        </View>

        {/* Section 2: ADAM Questionnaire */}
        <View style={styles.reviewCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="clipboard-outline" size={18} color={BioPulseColors.malePrimary} />
              <Text style={styles.cardTitle}>ADAM Questionnaire</Text>
            </View>
            <Pressable
              onPress={() => handleEditSection('/male-adam')}
              style={styles.editBtn}
              hitSlop={8}
            >
              <Text style={styles.editBtnText}>Edit</Text>
              <Ionicons name="pencil" size={12} color={BioPulseColors.malePrimary} />
            </Pressable>
          </View>

          <View style={styles.adamScoreBox}>
            <View>
              <Text style={styles.adamScoreTitle}>Affirmative Symptoms</Text>
              <Text style={styles.adamScoreSub}>
                {adamSummary.isPositive
                  ? 'Clinical threshold met for androgen evaluation'
                  : 'Below formal threshold for primary androgen symptoms'}
              </Text>
            </View>
            <View
              style={[
                styles.scorePill,
                { backgroundColor: adamSummary.isPositive ? '#FEF2F2' : '#F0FDF4' },
              ]}
            >
              <Text
                style={[
                  styles.scorePillText,
                  { color: adamSummary.isPositive ? '#B91C1C' : '#15803D' },
                ]}
              >
                {adamSummary.score} / 10 Yes
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Metabolic & Lifestyle */}
        <View style={styles.reviewCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="fitness-outline" size={18} color={BioPulseColors.malePrimary} />
              <Text style={styles.cardTitle}>Metabolic & Lifestyle</Text>
            </View>
            <Pressable
              onPress={() => handleEditSection('/male-lifestyle')}
              style={styles.editBtn}
              hitSlop={8}
            >
              <Text style={styles.editBtnText}>Edit</Text>
              <Ionicons name="pencil" size={12} color={BioPulseColors.malePrimary} />
            </Pressable>
          </View>

          <View style={styles.lifestyleRows}>
            <View style={styles.lifestyleRow}>
              <Text style={styles.lifestyleLabel}>Exercise Frequency</Text>
              <Text style={styles.lifestyleVal}>
                {lifestyle.exerciseFrequency === 'none'
                  ? 'Sedentary'
                  : lifestyle.exerciseFrequency === '1-2_days'
                  ? '1-2 days/week'
                  : '3+ days/week'}
              </Text>
            </View>
            <View style={styles.lifestyleRow}>
              <Text style={styles.lifestyleLabel}>Diet / Fast Food</Text>
              <Text style={styles.lifestyleVal}>
                {lifestyle.fastFoodIntake === 'never'
                  ? 'Rarely/Never'
                  : lifestyle.fastFoodIntake === 'occasionally'
                  ? '1-2 times/week'
                  : '3+ times/week'}
              </Text>
            </View>
            <View style={styles.lifestyleRow}>
              <Text style={styles.lifestyleLabel}>Nightly Sleep</Text>
              <Text style={styles.lifestyleVal}>{lifestyle.sleepHours} hours</Text>
            </View>
            <View style={styles.lifestyleRow}>
              <Text style={styles.lifestyleLabel}>Stress Level</Text>
              <Text style={styles.lifestyleVal}>{lifestyle.stressLevel}</Text>
            </View>
          </View>
        </View>

        {/* Clinical Disclaimer */}
        <View style={styles.disclaimerBanner}>
          <Ionicons name="shield-checkmark" size={18} color={BioPulseColors.malePrimary} />
          <Text style={styles.disclaimerText}>
            BioPulse AI provides screening support, not a medical diagnosis. Your clinical health profile is confidential and protected.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleRunScreening}
          disabled={submitting}
          style={({ pressed }) => [
            styles.runBtn,
            submitting && styles.runBtnDisabled,
            pressed && styles.runBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Run Screening"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.runBtnText}>Run Screening / Get Results</Text>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </>
          )}
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
  reviewCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EBF4FC',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.malePrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: BioPulseColors.secondaryText,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  adamScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  adamScoreTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.navy,
  },
  adamScoreSub: {
    fontSize: 11,
    color: BioPulseColors.secondaryText,
    maxWidth: 200,
    marginTop: 2,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scorePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lifestyleRows: {
    gap: 8,
  },
  lifestyleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lifestyleLabel: {
    fontSize: 13,
    color: BioPulseColors.secondaryText,
  },
  lifestyleVal: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.navy,
  },
  disclaimerBanner: {
    backgroundColor: '#EBF4FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
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
  runBtn: {
    backgroundColor: BioPulseColors.malePrimary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  runBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  runBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  runBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
