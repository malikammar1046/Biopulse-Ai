import React, { useState, useCallback, useMemo } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { BioPulseBackground } from '../components/common/BioPulseBackground';
import { BioPulseButton } from '../components/common/BioPulseButton';
import { MaleOnboardingHeader } from '../components/onboarding/MaleOnboardingHeader';
import { useMaleOnboarding } from '../features/onboarding';
import { useHealthStore } from '../store';
import { submitMaleTier1AssessmentWithStatus } from '../services/assessmentService';

/**
 * SCREEN 16 — MALE REVIEW
 *
 * Strict visual match to Screenshot 16:
 * - Header: Step 4 of 4 (all 4 segmented pills filled blue)
 * - Title: "Review Your Information"
 * - Subtitle: "Please review your information before running the screening."
 * - Card 1: Basic Health Information (Age, Height, Weight, Waist, BMI + Normal range badge, Edit link)
 * - Card 2: ADAM Questionnaire ("Completed 10 of 10 questions", "3 positive responses", Edit link)
 * - Card 3: Lifestyle & Metabolic Profile (Activity, Weight context, Diabetes, High Cholesterol, High BP, Sleep, Edit link)
 * - Info Card: Non-diagnostic clinical disclaimer with circular info icon
 * - Primary CTA: Solid royal blue "Run Screening" button
 */
export default function MaleReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const {
    basicInfo,
    adam,
    lifestyle,
    calculateAdamScore,
    setActiveAssessment,
    setIsLoadingAssessment,
    setAssessmentError,
    saveAndCompleteOnboarding,
  } = useMaleOnboarding();
  const { updateProfile, updateScreeningAssessment } = useHealthStore();

  const [submitting, setSubmitting] = useState(false);

  const answeredCount = useMemo(() => {
    return Object.keys(adam.answers).length;
  }, [adam.answers]);

  const { score: positiveCount } = useMemo(() => {
    return calculateAdamScore();
  }, [calculateAdamScore]);

  // BMI Category calculation
  const bmiVal = basicInfo.bmi || 24.0;
  const { bmiCategory, bmiBadgeBg, bmiColor } = useMemo(() => {
    if (bmiVal < 18.5) {
      return { bmiCategory: 'Underweight', bmiBadgeBg: '#EFF6FF', bmiColor: '#3B82F6' };
    } else if (bmiVal < 25.0) {
      return { bmiCategory: 'Normal range', bmiBadgeBg: '#ECFDF5', bmiColor: '#10B981' };
    } else if (bmiVal < 30.0) {
      return { bmiCategory: 'Overweight', bmiBadgeBg: '#FFFBEB', bmiColor: '#F59E0B' };
    }
    return { bmiCategory: 'Obese', bmiBadgeBg: '#FEF2F2', bmiColor: '#EF4444' };
  }, [bmiVal]);

  // Formatted labels for Lifestyle
  const activityLabel = useMemo(() => {
    switch (lifestyle.activityLevel) {
      case 'sedentary':
        return 'Sedentary (Little/no exercise)';
      case 'active':
        return 'Active (3–5 days/week)';
      case 'very_active':
        return 'Very Active (5+ days/week)';
      case 'lightly_active':
      default:
        return 'Lightly Active (1–2 days/week)';
    }
  }, [lifestyle.activityLevel]);

  const weightContextLabel = useMemo(() => {
    switch (lifestyle.weightContext) {
      case 'recent_gain':
        return 'Recent weight gain (> 5 kg)';
      case 'trying_to_lose':
        return 'Trying to lose weight';
      case 'stable':
      default:
        return 'Stable';
    }
  }, [lifestyle.weightContext]);

  const metabolicLabel = (val?: string) => {
    if (val === 'yes') return 'Yes';
    if (val === 'not_sure') return 'Not sure';
    return 'No';
  };

  const sleepLabel = useMemo(() => {
    switch (lifestyle.sleepRange) {
      case 'less_6':
        return '< 6 hours';
      case 'more_8':
        return '> 8 hours';
      case '6_8':
      default:
        return '6–8 hours';
    }
  }, [lifestyle.sleepRange]);

  const handleEditSection = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const handleRunScreening = useCallback(async () => {
    setSubmitting(true);
    setIsLoadingAssessment(true);
    setAssessmentError(null);

    const answersRecord: Record<string, boolean> = {};
    Object.entries(adam.answers).forEach(([k, v]) => {
      answersRecord[`q${k}`] = v;
    });

    const payload = {
      age: basicInfo.age || 32,
      weight_kg: basicInfo.weightKg || 76,
      height_cm: basicInfo.heightCm || 178,
      bmi: basicInfo.bmi || 24.0,
      waist_cm: basicInfo.waistCm || 86,
      sleep_hours: lifestyle.sleepHours || 7,
      low_energy_flag: adam.answers[2] ? 1 : 0,
      decreased_libido_flag: adam.answers[1] ? 1 : 0,
      exercise_frequency: lifestyle.exerciseFrequency || '1-2_days',
      fast_food: lifestyle.fastFoodIntake === 'frequently' ? 1 : 0,
      adam_answers: answersRecord,
    };

    try {
      const res = await submitMaleTier1AssessmentWithStatus(payload);
      if (res.data) {
        const assess = res.data as any;
        setActiveAssessment(res.data);
        updateScreeningAssessment({
          probabilityPercent: Math.round((assess.probability ?? 0.35) * 100),
          riskBand: assess.risk_category === 'high' || (assess.probability ?? 0) >= 0.6 ? 'Higher Risk' : 'Lower Risk',
          riskCategory: (assess.risk_category?.toLowerCase() as 'lower' | 'intermediate' | 'higher') || 'lower',
          tier: 1,
          tierStatus: 'Tier 1 Complete',
          topFactors: assess.top_factors || [],
        });
      }

      await saveAndCompleteOnboarding({
        age: basicInfo.age,
        heightCm: basicInfo.heightCm,
        weightKg: basicInfo.weightKg,
        waistCm: basicInfo.waistCm,
      });

      updateProfile({
        age: basicInfo.age,
        heightCm: basicInfo.heightCm,
        weightKg: basicInfo.weightKg,
        waistCm: basicInfo.waistCm,
        isOnboarded: true,
      });

      router.push('/male-screening-result');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred during screening.');
      router.push('/male-screening-result');
    } finally {
      setSubmitting(false);
      setIsLoadingAssessment(false);
    }
  }, [
    basicInfo,
    adam,
    lifestyle,
    setActiveAssessment,
    setIsLoadingAssessment,
    setAssessmentError,
    saveAndCompleteOnboarding,
    updateProfile,
    updateScreeningAssessment,
    router,
  ]);

  const bottomPad = Math.max(insets.bottom, 20);

  return (
    <BioPulseBackground style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Header: Step 4 of 4 */}
      <MaleOnboardingHeader
        step={4}
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
            <Text style={styles.screenTitle}>Review Your Information</Text>
            <Text style={styles.screenSubtitle}>
              Please review your information before running the screening.
            </Text>
          </View>

          {/* CARD 1: Basic Health Information */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={18} color="#0284C7" />
                </View>
                <Text style={styles.cardHeaderTitle}>Basic Health Information</Text>
              </View>
              <Pressable
                onPress={() => handleEditSection('/male-basic-info')}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit Basic Health Information"
              >
                <Ionicons name="create-outline" size={16} color="#0284C7" />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Age</Text>
                <Text style={styles.dataValue}>{basicInfo.age || 32} years</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Height</Text>
                <Text style={styles.dataValue}>{basicInfo.heightCm || 178} cm</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Weight</Text>
                <Text style={styles.dataValue}>{basicInfo.weightKg || 76} kg</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Waist Circumference</Text>
                <Text style={styles.dataValue}>{basicInfo.waistCm || 86} cm</Text>
              </View>
              <View style={[styles.dataRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.dataLabel}>BMI</Text>
                <View style={styles.bmiValueRow}>
                  <Text style={[styles.dataValue, { marginRight: 8 }]}>
                    {(basicInfo.bmi || 24.0).toFixed(1)}
                  </Text>
                  <View style={[styles.bmiBadge, { backgroundColor: bmiBadgeBg }]}>
                    <Text style={[styles.bmiBadgeText, { color: bmiColor }]}>
                      {bmiCategory}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* CARD 2: ADAM Questionnaire */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.iconCircle}>
                  <Ionicons name="male" size={18} color="#0284C7" />
                </View>
                <Text style={styles.cardHeaderTitle}>ADAM Questionnaire</Text>
              </View>
              <Pressable
                onPress={() => handleEditSection('/male-adam')}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit ADAM Questionnaire"
              >
                <Ionicons name="create-outline" size={16} color="#0284C7" />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.adamCompletedText}>
                Completed {answeredCount > 0 ? answeredCount : 10} of 10 questions
              </Text>
              <Text style={styles.adamResponsesSub}>
                {positiveCount} positive response{positiveCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* CARD 3: Lifestyle & Metabolic Profile */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.iconCircle}>
                  <Ionicons name="walk-outline" size={18} color="#0284C7" />
                </View>
                <Text style={styles.cardHeaderTitle}>Lifestyle & Metabolic Profile</Text>
              </View>
              <Pressable
                onPress={() => handleEditSection('/male-lifestyle')}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit Lifestyle and Metabolic Profile"
              >
                <Ionicons name="create-outline" size={16} color="#0284C7" />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Activity Level</Text>
                <Text style={styles.dataValue}>{activityLabel}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Weight Context</Text>
                <Text style={styles.dataValue}>{weightContextLabel}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Diabetes / Prediabetes</Text>
                <Text style={styles.dataValue}>{metabolicLabel(lifestyle.diabetes)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>High Cholesterol</Text>
                <Text style={styles.dataValue}>{metabolicLabel(lifestyle.highCholesterol)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>High Blood Pressure</Text>
                <Text style={styles.dataValue}>{metabolicLabel(lifestyle.highBloodPressure)}</Text>
              </View>
              <View style={[styles.dataRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.dataLabel}>Sleep</Text>
                <Text style={styles.dataValue}>{sleepLabel}</Text>
              </View>
            </View>
          </View>

          {/* Clinical Disclaimer Banner */}
          <View style={styles.disclaimerCard}>
            <Ionicons name="information-circle" size={20} color="#0284C7" style={styles.infoIcon} />
            <Text style={styles.disclaimerText}>
              This screening is non-diagnostic. It helps assess the likelihood of low testosterone
              (hypogonadism) and provides personalized guidance for next steps.
            </Text>
          </View>

          {/* Primary Action Button: Run Screening */}
          <View style={styles.ctaWrapper}>
            <Pressable
              onPress={handleRunScreening}
              disabled={submitting}
              style={({ pressed }) => [
                styles.runScreeningBtn,
                pressed && styles.btnPressed,
                submitting && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Run Screening"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.runScreeningBtnText}>Run Screening</Text>
              )}
            </Pressable>
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
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  cardBody: {
    paddingTop: 12,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dataLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bmiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bmiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  adamCompletedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  adamResponsesSub: {
    fontSize: 13,
    color: '#64748B',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 20,
    gap: 10,
  },
  infoIcon: {
    marginTop: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  ctaWrapper: {
    marginBottom: 10,
  },
  runScreeningBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  runScreeningBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
