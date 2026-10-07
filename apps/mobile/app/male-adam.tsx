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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { BioPulseBackground } from '../components/common/BioPulseBackground';
import { MaleOnboardingHeader } from '../components/onboarding/MaleOnboardingHeader';
import { useMaleOnboarding, ADAM_QUESTIONS } from '../features/onboarding';

/**
 * SCREEN 14 — MALE ADAM QUESTIONNAIRE
 *
 * Strict visual match to Screenshot 14:
 * - Header: Back button (<), centered "Question X of 10", continuous blue progress bar below
 * - Focused Card:
 *   - Male gender icon badge (light blue square with ♂)
 *   - Question title: "Do you have a decrease in libido (sex drive)?"
 *   - Clinical context: "A reduced interest in sexual activity can be a sign of lower testosterone levels in some men."
 *   - Large selectable answer cards: [ Yes ] and [ No ]
 *     - Selected: royal blue border (#0284C7), soft blue bg (#EFF6FF), solid blue circular checkmark, bold text
 *     - Unselected: clean border (#E2E8F0), white bg, empty radio circle, neutral text
 * - Bottom action bar:
 *   - Dual buttons: [ Back ] (outline/white) and [ Continue ] (solid royal blue #0284C7)
 * - State and navigation:
 *   - Advances through all 10 ADAM questions
 *   - Preserves answers in useMaleOnboarding()
 *   - Routes to /male-lifestyle upon question 10 completion
 */
export default function MaleAdamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { adam, setAdamAnswer, setLastActiveScreeningRoute } = useMaleOnboarding();
  const [currentIdx, setCurrentIdx] = useState<number>(0); // 0 to 9

  const currentQ = ADAM_QUESTIONS[currentIdx] || ADAM_QUESTIONS[0];
  const totalQuestions = ADAM_QUESTIONS.length;
  const currentAnswer = adam.answers[currentQ.id];

  const handleSelectAnswer = useCallback(
    (val: boolean) => {
      setAdamAnswer(currentQ.id, val);
    },
    [currentQ.id, setAdamAnswer]
  );

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
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <BioPulseBackground style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Header with Back button, "Question X of 10" and continuous progress bar */}
      <MaleOnboardingHeader
        customLabel={`Question ${currentIdx + 1} of ${totalQuestions}`}
        isContinuousProgress
        progressPercent={progressPercent}
        onBack={handlePrev}
        accentColor="#0284C7"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 84 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Main Question Card */}
          <View style={styles.questionCard}>
            {/* Male Symbol Icon Badge */}
            <View style={styles.iconBadge}>
              <Ionicons name="male" size={28} color="#0284C7" />
            </View>

            {/* Question Text */}
            <Text style={styles.questionTitle}>{currentQ.question}</Text>

            {/* Short Clinical Context */}
            <Text style={styles.questionDesc}>{currentQ.description}</Text>

            {/* Vertical Answer Options */}
            <View style={styles.optionsContainer}>
              {/* YES OPTION */}
              <Pressable
                onPress={() => handleSelectAnswer(true)}
                style={({ pressed }) => [
                  styles.optionCard,
                  currentAnswer === true && styles.optionCardSelected,
                  pressed && styles.optionCardPressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: currentAnswer === true }}
                accessibilityLabel={`Yes for question ${currentQ.id}`}
              >
                <View
                  style={[
                    styles.radioCircle,
                    currentAnswer === true && styles.radioCircleSelected,
                  ]}
                >
                  {currentAnswer === true && (
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    currentAnswer === true && styles.optionLabelSelected,
                  ]}
                >
                  Yes
                </Text>
              </Pressable>

              {/* NO OPTION */}
              <Pressable
                onPress={() => handleSelectAnswer(false)}
                style={({ pressed }) => [
                  styles.optionCard,
                  currentAnswer === false && styles.optionCardSelected,
                  pressed && styles.optionCardPressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: currentAnswer === false }}
                accessibilityLabel={`No for question ${currentQ.id}`}
              >
                <View
                  style={[
                    styles.radioCircle,
                    currentAnswer === false && styles.radioCircleSelected,
                  ]}
                >
                  {currentAnswer === false && (
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    currentAnswer === false && styles.optionLabelSelected,
                  ]}
                >
                  No
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Decorative subtle background wave effect at bottom corner */}
      <View style={styles.decorativeWave} pointerEvents="none">
        <View style={styles.waveBubble1} />
        <View style={styles.waveBubble2} />
      </View>

      {/* Floating Bottom Dual Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
        <View style={[styles.bottomRow, { maxWidth: Math.min(width, 460) }]}>
          {/* Back Button */}
          <Pressable
            onPress={handlePrev}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back to previous question"
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          {/* Continue Button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue to next question"
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </BioPulseBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#073B72',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  questionDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  optionCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  optionCardPressed: {
    opacity: 0.9,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioCircleSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  optionLabelSelected: {
    fontWeight: '700',
    color: '#073B72',
  },
  decorativeWave: {
    position: 'absolute',
    bottom: 80,
    right: -40,
    width: 220,
    height: 180,
    overflow: 'hidden',
    zIndex: -1,
  },
  waveBubble1: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E0F2FE',
    opacity: 0.35,
  },
  waveBubble2: {
    position: 'absolute',
    right: 30,
    bottom: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#BAE6FD',
    opacity: 0.25,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bottomRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#073B72',
  },
  continueButton: {
    flex: 1.6,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
