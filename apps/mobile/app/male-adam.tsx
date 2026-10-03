import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
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
import { useMaleOnboarding, ADAM_QUESTIONS } from '../features/onboarding';

const MALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Health' },
  { id: 2, label: 'ADAM' },
  { id: 3, label: 'Metabolic' },
  { id: 4, label: 'Review' },
];

export default function MaleAdamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { adam, setAdamAnswer, setLastActiveScreeningRoute } = useMaleOnboarding();
  const [currentIdx, setCurrentIdx] = useState<number>(0); // 0 to 9

  const currentQ = ADAM_QUESTIONS[currentIdx];
  const totalQuestions = ADAM_QUESTIONS.length;
  const currentAnswer = adam.answers[currentQ.id];

  const answeredCount = useMemo(() => {
    return Object.keys(adam.answers).length;
  }, [adam.answers]);

  const handleSelectAnswer = useCallback((val: boolean) => {
    setAdamAnswer(currentQ.id, val);
  }, [currentQ.id, setAdamAnswer]);

  const handleNext = useCallback(() => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setLastActiveScreeningRoute('/male-lifestyle');
      router.push('/male-lifestyle');
    }
  }, [currentIdx, totalQuestions, setLastActiveScreeningRoute, router]);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    } else {
      router.back();
    }
  }, [currentIdx, router]);

  const progressPercent = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Pathway Header */}
      <View style={{ paddingTop: Math.max(insets.top, 10) }}>
        <PathwayHeader
          onBack={handlePrev}
          subtitle="MEN'S HEALTH INTELLIGENCE"
        />
      </View>

      {/* Stepper */}
      <View style={styles.stepperWrap}>
        <OnboardingStepper
          steps={MALE_ONBOARDING_STEPS}
          currentStep={2}
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
        {/* Progress Bar & Counter Card */}
        <View style={styles.counterCard}>
          <View style={styles.counterHeader}>
            <Text style={styles.counterBadge}>
              Question {currentIdx + 1} of {totalQuestions}
            </Text>
            <Text style={styles.progressPercentText}>{progressPercent}% completed</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.standardText}>
            Validated Saint Louis University Androgen Deficiency in Aging Males (ADAM) Tool
          </Text>
        </View>

        {/* Current Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionNumBadge}>
            <Text style={styles.questionNumText}>Q{currentQ.id}</Text>
          </View>

          <Text style={styles.questionTitle}>{currentQ.question}</Text>
          <Text style={styles.questionDesc}>{currentQ.description}</Text>

          {/* Large Yes / No Chips */}
          <View style={styles.optionsRow}>
            {/* YES OPTION */}
            <Pressable
              onPress={() => handleSelectAnswer(true)}
              style={({ pressed }) => [
                styles.optionBtn,
                currentAnswer === true && styles.optionBtnSelectedYes,
                pressed && styles.optionBtnPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: currentAnswer === true }}
              accessibilityLabel={`Yes for question ${currentQ.id}`}
            >
              <View
                style={[
                  styles.optionIconCircle,
                  currentAnswer === true && styles.optionIconCircleSelectedYes,
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={22}
                  color={currentAnswer === true ? '#FFFFFF' : '#64748B'}
                />
              </View>
              <Text
                style={[
                  styles.optionText,
                  currentAnswer === true && styles.optionTextSelectedYes,
                ]}
              >
                Yes
              </Text>
            </Pressable>

            {/* NO OPTION */}
            <Pressable
              onPress={() => handleSelectAnswer(false)}
              style={({ pressed }) => [
                styles.optionBtn,
                currentAnswer === false && styles.optionBtnSelectedNo,
                pressed && styles.optionBtnPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: currentAnswer === false }}
              accessibilityLabel={`No for question ${currentQ.id}`}
            >
              <View
                style={[
                  styles.optionIconCircle,
                  currentAnswer === false && styles.optionIconCircleSelectedNo,
                ]}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={currentAnswer === false ? '#FFFFFF' : '#64748B'}
                />
              </View>
              <Text
                style={[
                  styles.optionText,
                  currentAnswer === false && styles.optionTextSelectedNo,
                ]}
              >
                No
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Question Quick Jump Dots */}
        <View style={styles.dotsCard}>
          <Text style={styles.dotsTitle}>Questions Navigation</Text>
          <View style={styles.dotsGrid}>
            {ADAM_QUESTIONS.map((q, idx) => {
              const isAnswered = adam.answers[q.id] !== undefined;
              const isCurrent = idx === currentIdx;
              const ans = adam.answers[q.id];

              let bg = '#F1F5F9';
              let border = '#E2E8F0';
              let textC = '#64748B';

              if (isCurrent) {
                border = BioPulseColors.malePrimary;
                bg = '#EBF4FC';
                textC = BioPulseColors.malePrimary;
              } else if (isAnswered) {
                bg = ans ? '#EFF6FF' : '#F8FAFC';
                border = ans ? '#93C5FD' : '#CBD5E1';
                textC = ans ? '#1D4ED8' : '#475569';
              }

              return (
                <Pressable
                  key={q.id}
                  onPress={() => setCurrentIdx(idx)}
                  style={[styles.jumpDot, { backgroundColor: bg, borderColor: border }]}
                >
                  <Text style={[styles.jumpDotText, { color: textC, fontWeight: isCurrent ? '700' : '500' }]}>
                    {q.id}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Clinical Note Banner */}
        <View style={styles.clinicalBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#0369A1" />
          <Text style={styles.clinicalText}>
            Questions 1 and 7 assess primary sexual and erectile symptoms with the highest clinical sensitivity for testosterone deficiency.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.bottomButtonsRow}>
          {currentIdx > 0 && (
            <Pressable
              onPress={handlePrev}
              style={styles.backStepBtn}
              accessibilityRole="button"
              accessibilityLabel="Previous Question"
            >
              <Ionicons name="arrow-back" size={18} color={BioPulseColors.navy} />
              <Text style={styles.backStepBtnText}>Back</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleNext}
            disabled={currentAnswer === undefined}
            style={({ pressed }) => [
              styles.nextBtn,
              currentAnswer === undefined && styles.nextBtnDisabled,
              pressed && styles.nextBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={currentIdx === totalQuestions - 1 ? 'Save & Continue' : 'Next Question'}
          >
            <Text style={styles.nextBtnText}>
              {currentIdx === totalQuestions - 1 ? 'Continue to Lifestyle' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
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
  counterCard: {
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
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  counterBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.malePrimary,
    backgroundColor: '#EBF4FC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressPercentText: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BioPulseColors.malePrimary,
    borderRadius: 3,
  },
  standardText: {
    fontSize: 11,
    color: BioPulseColors.secondaryText,
    fontStyle: 'italic',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionNumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0868B9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  questionNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BioPulseColors.navy,
    lineHeight: 25,
    marginBottom: 8,
  },
  questionDesc: {
    fontSize: 13,
    color: BioPulseColors.secondaryText,
    lineHeight: 18,
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionBtnSelectedYes: {
    backgroundColor: '#EFF6FF',
    borderColor: BioPulseColors.malePrimary,
  },
  optionBtnSelectedNo: {
    backgroundColor: '#F8FAFC',
    borderColor: '#64748B',
  },
  optionBtnPressed: {
    opacity: 0.85,
  },
  optionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconCircleSelectedYes: {
    backgroundColor: BioPulseColors.malePrimary,
  },
  optionIconCircleSelectedNo: {
    backgroundColor: '#64748B',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  optionTextSelectedYes: {
    color: BioPulseColors.malePrimary,
    fontWeight: '800',
  },
  optionTextSelectedNo: {
    color: '#1E293B',
    fontWeight: '800',
  },
  dotsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  dotsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.navy,
    marginBottom: 10,
  },
  dotsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jumpDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpDotText: {
    fontSize: 12,
  },
  clinicalBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  clinicalText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
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
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backStepBtn: {
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backStepBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BioPulseColors.navy,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: BioPulseColors.malePrimary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  nextBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
