import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
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
  BmiGaugeCard,
} from '../components/onboarding';
import { useMaleOnboarding } from '../features/onboarding';

const MALE_HERO = require('../assets/male_pathway_hero.png');

const MALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Health' },
  { id: 2, label: 'ADAM' },
  { id: 3, label: 'Metabolic' },
  { id: 4, label: 'Review' },
];

export default function MaleBasicInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { basicInfo, updateBasicInfo, setLastActiveScreeningRoute } = useMaleOnboarding();

  const [age, setAge] = useState<number>(basicInfo.age || 36);
  const [heightCm, setHeightCm] = useState<number>(basicInfo.heightCm || 178);
  const [weightKg, setWeightKg] = useState<number>(basicInfo.weightKg || 82);
  const [waistCm, setWaistCm] = useState<number>(basicInfo.waistCm || 92);

  // Compute BMI
  const computedBmi = useMemo(() => {
    const heightM = heightCm / 100;
    if (heightM <= 0) return 24.5;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  }, [heightCm, weightKg]);

  const handleContinue = useCallback(() => {
    updateBasicInfo({
      age,
      heightCm,
      weightKg,
      bmi: computedBmi,
      waistCm,
    });
    setLastActiveScreeningRoute('/male-adam');
    router.push('/male-adam');
  }, [age, heightCm, weightKg, computedBmi, waistCm, updateBasicInfo, setLastActiveScreeningRoute, router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/pathway-selection');
    }
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
          currentStep={1}
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
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Image source={MALE_HERO} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Physical & Metabolic Metrics</Text>
            <Text style={styles.heroSubtitle}>
              Accurate anthropometrics are crucial for evaluating androgen sufficiency and metabolic syndrome risk.
            </Text>
          </View>
        </View>

        {/* Age Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calendar-outline" size={20} color={BioPulseColors.malePrimary} />
            <Text style={styles.cardTitle}>Age</Text>
          </View>
          <View style={styles.numberStepperRow}>
            <Pressable
              onPress={() => setAge((prev) => Math.max(18, prev - 1))}
              style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
            >
              <Ionicons name="remove" size={20} color={BioPulseColors.malePrimary} />
            </Pressable>
            <View style={styles.numberDisplay}>
              <Text style={styles.numberValueText}>{age}</Text>
              <Text style={styles.numberUnitText}>years old</Text>
            </View>
            <Pressable
              onPress={() => setAge((prev) => Math.min(85, prev + 1))}
              style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
            >
              <Ionicons name="add" size={20} color={BioPulseColors.malePrimary} />
            </Pressable>
          </View>
        </View>

        {/* Height & Weight Dual Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="body-outline" size={20} color={BioPulseColors.malePrimary} />
            <Text style={styles.cardTitle}>Height & Weight</Text>
          </View>

          {/* Height Row */}
          <View style={styles.measureRow}>
            <Text style={styles.measureLabel}>Height</Text>
            <View style={styles.measureControls}>
              <Pressable
                onPress={() => setHeightCm((prev) => Math.max(120, prev - 1))}
                style={styles.smallStepBtn}
              >
                <Ionicons name="remove" size={16} color={BioPulseColors.navy} />
              </Pressable>
              <Text style={styles.measureValue}>{heightCm} cm</Text>
              <Pressable
                onPress={() => setHeightCm((prev) => Math.min(230, prev + 1))}
                style={styles.smallStepBtn}
              >
                <Ionicons name="add" size={16} color={BioPulseColors.navy} />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Weight Row */}
          <View style={styles.measureRow}>
            <Text style={styles.measureLabel}>Weight</Text>
            <View style={styles.measureControls}>
              <Pressable
                onPress={() => setWeightKg((prev) => Math.max(40, prev - 1))}
                style={styles.smallStepBtn}
              >
                <Ionicons name="remove" size={16} color={BioPulseColors.navy} />
              </Pressable>
              <Text style={styles.measureValue}>{weightKg} kg</Text>
              <Pressable
                onPress={() => setWeightKg((prev) => Math.min(200, prev + 1))}
                style={styles.smallStepBtn}
              >
                <Ionicons name="add" size={16} color={BioPulseColors.navy} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Waist Circumference Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="resize-outline" size={20} color={BioPulseColors.malePrimary} />
            <Text style={styles.cardTitle}>Waist Circumference</Text>
          </View>
          <Text style={styles.inputHelperText}>
            Measured at the level of the umbilicus. A key indicator of visceral adiposity affecting free testosterone.
          </Text>
          <View style={styles.numberStepperRow}>
            <Pressable
              onPress={() => setWaistCm((prev) => Math.max(60, prev - 1))}
              style={styles.stepBtn}
            >
              <Ionicons name="remove" size={20} color={BioPulseColors.malePrimary} />
            </Pressable>
            <View style={styles.numberDisplay}>
              <Text style={styles.numberValueText}>{waistCm}</Text>
              <Text style={styles.numberUnitText}>cm</Text>
            </View>
            <Pressable
              onPress={() => setWaistCm((prev) => Math.min(160, prev + 1))}
              style={styles.stepBtn}
            >
              <Ionicons name="add" size={20} color={BioPulseColors.malePrimary} />
            </Pressable>
          </View>
        </View>

        {/* BMI Gauge Card */}
        <BmiGaugeCard heightCm={heightCm} weightKg={weightKg} />

        {/* Why we ask this banner */}
        <View style={styles.whyBanner}>
          <Ionicons name="information-circle" size={18} color={BioPulseColors.malePrimary} />
          <Text style={styles.whyText}>
            BioPulse AI uses age, BMI, and waist metrics to calibrate hormone reference intervals and assess late-onset hypogonadism risks according to the Endocrine Society guidelines.
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
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.continueBtn, pressed && styles.continueBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Continue to ADAM Questionnaire"
        >
          <Text style={styles.continueBtnText}>Continue to ADAM Questionnaire</Text>
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  heroImage: {
    width: 64,
    height: 64,
    marginRight: 14,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    lineHeight: 16,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BioPulseColors.navy,
  },
  numberStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  stepBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  numberDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  numberValueText: {
    fontSize: 32,
    fontWeight: '800',
    color: BioPulseColors.malePrimary,
  },
  numberUnitText: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    fontWeight: '500',
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  measureLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: BioPulseColors.navy,
  },
  measureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
    minWidth: 70,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  inputHelperText: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    lineHeight: 16,
    marginBottom: 8,
  },
  whyBanner: {
    backgroundColor: '#EBF4FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  whyText: {
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
