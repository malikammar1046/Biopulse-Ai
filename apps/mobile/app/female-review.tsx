import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import { OnboardingStepper, PathwayHeader } from '../components/onboarding';
import { useFemaleOnboarding } from '../features/onboarding/FemaleOnboardingContext';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../components/navigation';
import {
  submitFemaleTier1AssessmentWithStatus,
  buildFemaleTier1Inputs,
  validateFemaleReviewInputs,
} from '../services/assessmentService';

const FEMALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Cycle Health' },
  { id: 3, label: 'Symptoms' },
  { id: 4, label: 'Lifestyle' },
  { id: 5, label: 'Review' },
];

interface SymptomMeta {
  id: string;
  label: string;
  category: 'physical' | 'menstrual' | 'other';
}

const SYMPTOM_CATALOG: Record<string, SymptomMeta> = {
  hirsutism: { id: 'hirsutism', label: 'Excess hair growth', category: 'physical' },
  weight_gain: { id: 'weight_gain', label: 'Weight gain', category: 'physical' },
  skin_darkening: { id: 'skin_darkening', label: 'Skin darkening', category: 'physical' },
  hair_loss: { id: 'hair_loss', label: 'Hair loss', category: 'physical' },
  pimples_acne: { id: 'pimples_acne', label: 'Pimples / Acne', category: 'physical' },
  oily_skin: { id: 'oily_skin', label: 'Oily skin', category: 'physical' },
  irregular_periods: { id: 'irregular_periods', label: 'Irregular periods', category: 'menstrual' },
  long_cycles: { id: 'long_cycles', label: 'Long cycles (> 35 days)', category: 'menstrual' },
  heavy_periods: { id: 'heavy_periods', label: 'Heavy flow', category: 'menstrual' },
  missed_periods: { id: 'missed_periods', label: 'Missed periods', category: 'menstrual' },
  severe_cramps: { id: 'severe_cramps', label: 'Severe cramps', category: 'menstrual' },
  bloating: { id: 'bloating', label: 'Bloating', category: 'other' },
  mood_changes: { id: 'mood_changes', label: 'Mood changes', category: 'other' },
  mood_swings: { id: 'mood_swings', label: 'Mood swings', category: 'other' },
  fatigue: { id: 'fatigue', label: 'Fatigue / Low energy', category: 'other' },
  sleep_issues: { id: 'sleep_issues', label: 'Sleep difficulties', category: 'other' },
};

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'Not provided';
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

function getBmiBadge(bmi: number): { label: string; bg: string; text: string; border: string } {
  if (bmi < 18.5) {
    return { label: 'Underweight', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
  }
  if (bmi < 25.0) {
    return { label: 'Normal', bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
  }
  if (bmi < 30.0) {
    return { label: 'Overweight', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
  }
  return { label: 'Obese', bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
}

function getRegularityDisplay(reg: string): string {
  if (reg === 'regular') return 'Regular';
  if (reg === 'irregular') return 'Irregular';
  return 'Not sure';
}

function getDietDisplay(fastFood: string): string {
  switch (fastFood) {
    case 'never':
      return 'Healthy';
    case 'occasionally':
      return 'Sometimes';
    case 'frequently':
      return 'Frequent';
    default:
      return 'Sometimes';
  }
}

function getExerciseDisplay(exercise: string): string {
  switch (exercise) {
    case 'none':
      return 'None';
    case '1-2_days':
      return '1–2 times/week';
    case '3+_days':
      return '3+ times/week';
    default:
      return '1–2 times/week';
  }
}

function getSleepDisplay(hours: number): string {
  if (hours >= 7 && hours <= 8) return '6–8 hours';
  if (hours < 6) return '< 6 hours';
  if (hours > 8) return '8+ hours';
  return `${hours} hours`;
}

function getStressDisplay(stress: string): string {
  switch (stress) {
    case 'low':
      return 'Low';
    case 'moderate':
      return 'Moderate';
    case 'high':
      return 'High';
    default:
      return 'Moderate';
  }
}

/**
 * SCREEN 10: FEMALE "Review Your Information"
 *
 * Implements:
 * - Complete pre-inference screening review of all Tier-1 collected data
 * - Active state binding from FemaleOnboardingContext with no duplicate local state
 * - Section-by-section edit navigation with full state preservation
 * - Real BMI calculation & clinical category resolution
 * - Categorized symptom chip rendering with unselected items excluded
 * - Real lifestyle metrics display
 * - Cautious, non-diagnostic guidance banner
 * - Strict duplicate submission prevention & loading state
 * - Full validation & backend Tier-1 API integration
 * - Preserves existing active Tier-2 state if present
 */
export default function FemaleReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    basicInfo,
    cycleHealth,
    symptoms,
    lifestyle,
    setActiveAssessment,
    setAssessmentError,
    setLastActiveScreeningRoute,
  } = useFemaleOnboarding();

  // Track that user is on Review step
  useEffect(() => {
    setLastActiveScreeningRoute('/female-review');
  }, [setLastActiveScreeningRoute]);

  const handleBeforeTabNavigate = useCallback(() => {
    setLastActiveScreeningRoute('/female-review');
  }, [setLastActiveScreeningRoute]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Group symptoms
  const physicalSymptoms = useMemo(() => {
    return symptoms
      .filter((sId) => SYMPTOM_CATALOG[sId]?.category === 'physical')
      .map((sId) => SYMPTOM_CATALOG[sId].label);
  }, [symptoms]);

  const menstrualSymptoms = useMemo(() => {
    return symptoms
      .filter((sId) => SYMPTOM_CATALOG[sId]?.category === 'menstrual')
      .map((sId) => SYMPTOM_CATALOG[sId].label);
  }, [symptoms]);

  const otherSymptoms = useMemo(() => {
    return symptoms
      .filter((sId) => !SYMPTOM_CATALOG[sId] || SYMPTOM_CATALOG[sId]?.category === 'other')
      .map((sId) => SYMPTOM_CATALOG[sId]?.label || sId.replace(/_/g, ' '));
  }, [symptoms]);

  const bmiBadge = useMemo(() => getBmiBadge(basicInfo.bmi || 22.1), [basicInfo.bmi]);

  // Edit Navigation Handlers
  const handleEditBasicInfo = useCallback(() => {
    router.push('/female-basic-info?returnTo=review');
  }, [router]);

  const handleEditCycleHealth = useCallback(() => {
    router.push('/female-cycle-health?returnTo=review');
  }, [router]);

  const handleEditSymptoms = useCallback(() => {
    router.push('/female-symptoms?returnTo=review');
  }, [router]);

  const handleEditLifestyle = useCallback(() => {
    router.push('/female-lifestyle?returnTo=review');
  }, [router]);

  const handleEditNotes = useCallback(() => {
    router.push('/female-cycle-health?returnTo=review');
  }, [router]);

  // Final Submit CTA
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    // 1. Validate required data exists
    const validation = validateFemaleReviewInputs(basicInfo, cycleHealth);
    if (!validation.isValid) {
      Alert.alert('Incomplete Information', validation.error || 'Please review your inputs before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    // 2. Transform UI state into exact payload expected by current assessment API
    const payload = buildFemaleTier1Inputs(basicInfo, cycleHealth, symptoms, lifestyle);

    try {
      // 3. Call existing female Tier-1 assessment service
      const res = await submitFemaleTier1AssessmentWithStatus(payload);

      if (res.data) {
        // 4. Persist returned assessment appropriately
        setActiveAssessment(res.data);
        setAssessmentError(null);
        // 5. Navigate to Screening Result only after success
        router.push('/female-screening-result');
      } else {
        // Handle API or validation error gracefully
        const errorMsg = res.error || 'Unable to generate your screening result. Please try again.';
        setSubmissionError(errorMsg);
        setAssessmentError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        'Unable to complete screening submission. Please verify your connection and try again.';
      setSubmissionError(errorMsg);
      setAssessmentError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    basicInfo,
    cycleHealth,
    symptoms,
    lifestyle,
    setActiveAssessment,
    setAssessmentError,
    router,
  ]);

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
        {/* Top Header */}
        <PathwayHeader
          onBack={() => router.back()}
          subtitle="WOMEN'S HEALTH INTELLIGENCE"
          showHelp={false}
        />

        {/* Stepper (Step 5 of 5) */}
        <OnboardingStepper
          currentStep={5}
          steps={FEMALE_ONBOARDING_STEPS}
          accentColor={BioPulseColors.femaleAccent}
        />

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Review Your Information</Text>
          <Text style={styles.screenSubtitle}>
            Please review your details before submitting.{'\n'}
            You can go back and make changes if needed.
          </Text>
        </View>

        {/* Section 1: Basic Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="person-outline" size={18} color={BioPulseColors.femaleAccent} />
              </View>
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>
            <Pressable
              onPress={handleEditBasicInfo}
              hitSlop={8}
              style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Edit Basic Information"
            >
              <Ionicons name="create-outline" size={14} color={BioPulseColors.femaleAccent} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Date of Birth</Text>
              <Text style={styles.metricValue}>{formatDisplayDate(basicInfo.dateOfBirth)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Age</Text>
              <Text style={styles.metricValue}>{basicInfo.age ? `${basicInfo.age} years` : '—'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Height</Text>
              <Text style={styles.metricValue}>{basicInfo.heightCm ? `${basicInfo.heightCm} cm` : '—'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Weight</Text>
              <Text style={styles.metricValue}>{basicInfo.weightKg ? `${basicInfo.weightKg} kg` : '—'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>BMI</Text>
              <View style={styles.bmiValueRow}>
                <Text style={styles.metricValue}>{basicInfo.bmi ? basicInfo.bmi.toFixed(1) : '—'}</Text>
                {basicInfo.bmi ? (
                  <View
                    style={[
                      styles.bmiBadge,
                      { backgroundColor: bmiBadge.bg, borderColor: bmiBadge.border },
                    ]}
                  >
                    <Text style={[styles.bmiBadgeText, { color: bmiBadge.text }]}>
                      {bmiBadge.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Cycle Health */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="calendar-outline" size={18} color={BioPulseColors.femaleAccent} />
              </View>
              <Text style={styles.cardTitle}>Cycle Health</Text>
            </View>
            <Pressable
              onPress={handleEditCycleHealth}
              hitSlop={8}
              style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Edit Cycle Health"
            >
              <Ionicons name="create-outline" size={14} color={BioPulseColors.femaleAccent} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Cycle Regularity</Text>
              <Text style={styles.metricValue}>
                {getRegularityDisplay(cycleHealth.regularity)}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Average Cycle Length</Text>
              <Text style={styles.metricValue}>
                {cycleHealth.cycleLength ? `${cycleHealth.cycleLength} days` : '28 days'}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Last Period Start Date</Text>
              <Text style={styles.metricValue}>
                {formatDisplayDate(cycleHealth.lastPeriodDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Symptoms */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="medkit-outline" size={18} color={BioPulseColors.femaleAccent} />
              </View>
              <Text style={styles.cardTitle}>Symptoms</Text>
            </View>
            <Pressable
              onPress={handleEditSymptoms}
              hitSlop={8}
              style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Edit Symptoms"
            >
              <Ionicons name="create-outline" size={14} color={BioPulseColors.femaleAccent} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          {/* Physical Symptoms */}
          {physicalSymptoms.length > 0 && (
            <View style={styles.symptomGroup}>
              <Text style={styles.symptomCategoryTitle}>Physical Symptoms</Text>
              <View style={styles.chipContainer}>
                {physicalSymptoms.map((label, idx) => (
                  <View key={`phys-${idx}`} style={styles.symptomChip}>
                    <Text style={styles.symptomChipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Menstrual & Reproductive */}
          {menstrualSymptoms.length > 0 && (
            <View style={styles.symptomGroup}>
              <Text style={styles.symptomCategoryTitle}>Menstrual & Reproductive</Text>
              <View style={styles.chipContainer}>
                {menstrualSymptoms.map((label, idx) => (
                  <View key={`menstr-${idx}`} style={styles.symptomChip}>
                    <Text style={styles.symptomChipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Other Symptoms */}
          {otherSymptoms.length > 0 && (
            <View style={styles.symptomGroup}>
              <Text style={styles.symptomCategoryTitle}>Other Symptoms</Text>
              <View style={styles.chipContainer}>
                {otherSymptoms.map((label, idx) => (
                  <View key={`other-${idx}`} style={styles.symptomChip}>
                    <Text style={styles.symptomChipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {physicalSymptoms.length === 0 &&
            menstrualSymptoms.length === 0 &&
            otherSymptoms.length === 0 && (
              <View style={styles.emptyNoteContainer}>
                <Text style={styles.emptyNoteText}>No symptoms selected.</Text>
              </View>
            )}
        </View>

        {/* Section 4: Lifestyle & Daily Habits */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="barbell-outline" size={18} color={BioPulseColors.femaleAccent} />
              </View>
              <Text style={styles.cardTitle}>Lifestyle & Daily Habits</Text>
            </View>
            <Pressable
              onPress={handleEditLifestyle}
              hitSlop={8}
              style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Edit Lifestyle & Daily Habits"
            >
              <Ionicons name="create-outline" size={14} color={BioPulseColors.femaleAccent} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.lifestyleRow}>
            {/* Diet */}
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                <Ionicons name="restaurant-outline" size={16} color={BioPulseColors.femaleAccent} />
              </View>
              <View style={styles.lifestyleTextCol}>
                <Text style={styles.lifestyleLabel}>Diet</Text>
                <Text style={styles.lifestyleValue}>
                  {getDietDisplay(lifestyle.fastFoodIntake)}
                </Text>
              </View>
            </View>

            {/* Exercise */}
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                <Ionicons name="barbell-outline" size={16} color={BioPulseColors.femaleAccent} />
              </View>
              <View style={styles.lifestyleTextCol}>
                <Text style={styles.lifestyleLabel}>Exercise</Text>
                <Text style={styles.lifestyleValue}>
                  {getExerciseDisplay(lifestyle.exerciseFrequency)}
                </Text>
              </View>
            </View>

            {/* Sleep */}
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                <Ionicons name="moon-outline" size={16} color={BioPulseColors.femaleAccent} />
              </View>
              <View style={styles.lifestyleTextCol}>
                <Text style={styles.lifestyleLabel}>Sleep</Text>
                <Text style={styles.lifestyleValue}>
                  {getSleepDisplay(lifestyle.sleepHours)}
                </Text>
              </View>
            </View>

            {/* Stress */}
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                <Ionicons name="flash-outline" size={16} color={BioPulseColors.femaleAccent} />
              </View>
              <View style={styles.lifestyleTextCol}>
                <Text style={styles.lifestyleLabel}>Stress</Text>
                <Text style={styles.lifestyleValue}>
                  {getStressDisplay(lifestyle.stressLevel)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 5: Additional Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="document-text-outline" size={18} color={BioPulseColors.femaleAccent} />
              </View>
              <Text style={styles.cardTitle}>Additional Information</Text>
            </View>
            <Pressable
              onPress={handleEditNotes}
              hitSlop={8}
              style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Edit Additional Information"
            >
              <Ionicons name="create-outline" size={14} color={BioPulseColors.femaleAccent} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.notesContainer}>
            <Text
              style={[
                styles.notesText,
                !cycleHealth.additionalNotes?.trim() && styles.notesTextMuted,
              ]}
            >
              {cycleHealth.additionalNotes?.trim() || 'No additional notes provided.'}
            </Text>
          </View>
        </View>

        {/* Information Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={22} color="#2563EB" style={styles.infoBannerIcon} />
          <Text style={styles.infoBannerText}>
            Please make sure all information is correct. This will be used to generate your personalized screening result and recommendations.
          </Text>
        </View>

        {/* Error Alert Display */}
        {submissionError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Submission Notice</Text>
              <Text style={styles.errorDescription}>{submissionError}</Text>
            </View>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Submit CTA Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
            pressed && !isSubmitting && styles.submitButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Submit & Get Results"
        >
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Processing Screening...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit & Get Results →</Text>
          )}
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
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A5F',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    fontWeight: '400',
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
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.femaleAccent,
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
  },
  metricItem: {
    minWidth: 80,
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2444',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bmiBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  bmiBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  symptomGroup: {
    marginBottom: 12,
  },
  symptomCategoryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomChip: {
    backgroundColor: '#FDF0F4',
    borderWidth: 1,
    borderColor: '#F8CAD9',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  symptomChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.femaleAccent,
  },
  emptyNoteContainer: {
    paddingVertical: 6,
  },
  emptyNoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  lifestyleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  lifestyleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '22%',
    flex: 1,
  },
  lifestyleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifestyleTextCol: {
    flexDirection: 'column',
  },
  lifestyleLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  lifestyleValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F2444',
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  notesTextMuted: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  infoBanner: {
    backgroundColor: '#F0F6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoBannerIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: '#1E40AF',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  errorTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  errorTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  errorDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#991B1B',
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: BioPulseColors.femaleAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
