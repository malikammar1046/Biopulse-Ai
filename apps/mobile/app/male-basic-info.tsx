import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Alert,
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

/**
 * SCREEN 13: MALE BASIC HEALTH (Step 1 of 4)
 *
 * Matches Screenshot 13:
 * - Header: Step 1 of 4 with 4 segmented progress pills (segment 1 active blue)
 * - Title: "Your Basic Health Information"
 * - Inputs:
 *   - Age (with "years" label)
 *   - Height (with [cm | ft] unit toggle)
 *   - Weight (with [kg | lbs] unit toggle)
 *   - Waist Circumference (with "cm" suffix)
 * - Dedicated "Your BMI" card with numeric score (24.0), "Normal range" badge,
 *   and 4-segment visual gauge bar with needle pointer
 * - "Why we ask this information?" context card
 * - Primary solid blue "Continue" CTA
 */
export default function MaleBasicHealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { basicInfo, updateBasicInfo } = useMaleOnboarding();

  // Local interactive form state
  const [age, setAge] = useState<string>(String(basicInfo.age || 32));
  const [heightVal, setHeightVal] = useState<string>(String(basicInfo.heightCm || 178));
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightVal, setWeightVal] = useState<string>(String(basicInfo.weightKg || 76));
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [waistVal, setWaistVal] = useState<string>(String(basicInfo.waistCm || 86));

  const bottomPad = Math.max(insets.bottom, 20);

  // Compute Height in CM
  const heightCm = useMemo(() => {
    const raw = parseFloat(heightVal) || 178;
    return heightUnit === 'cm' ? raw : Math.round(raw * 30.48);
  }, [heightVal, heightUnit]);

  // Compute Weight in KG
  const weightKg = useMemo(() => {
    const raw = parseFloat(weightVal) || 76;
    return weightUnit === 'kg' ? raw : Math.round(raw * 0.453592);
  }, [weightVal, weightUnit]);

  const waistCm = useMemo(() => parseFloat(waistVal) || 86, [waistVal]);

  // Live BMI calculation
  const { bmi, bmiCategory, bmiColor, bmiBadgeBg, bmiPercentPosition } = useMemo(() => {
    const heightM = heightCm / 100;
    const computedBmi =
      heightM > 0 ? parseFloat((weightKg / (heightM * heightM)).toFixed(1)) : 24.0;

    let category = 'Normal range';
    let color = '#10B981';
    let badgeBg = '#ECFDF5';

    // Position on bar (range 15 to 35)
    const clamped = Math.max(15, Math.min(35, computedBmi));
    const percent = ((clamped - 15) / 20) * 100;

    if (computedBmi < 18.5) {
      category = 'Underweight';
      color = '#3B82F6';
      badgeBg = '#EFF6FF';
    } else if (computedBmi < 25.0) {
      category = 'Normal range';
      color = '#10B981';
      badgeBg = '#ECFDF5';
    } else if (computedBmi < 30.0) {
      category = 'Overweight';
      color = '#F59E0B';
      badgeBg = '#FFFBEB';
    } else {
      category = 'Obese';
      color = '#EF4444';
      badgeBg = '#FEF2F2';
    }

    return {
      bmi: computedBmi,
      bmiCategory: category,
      bmiColor: color,
      bmiBadgeBg: badgeBg,
      bmiPercentPosition: percent,
    };
  }, [heightCm, weightKg]);

  const handleContinue = useCallback(() => {
    const parsedAge = parseInt(age, 10);
    if (!parsedAge || parsedAge < 18 || parsedAge > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 18 and 120.');
      return;
    }
    if (heightCm < 80 || heightCm > 250) {
      Alert.alert('Invalid Height', 'Please enter a valid height between 80 cm and 250 cm.');
      return;
    }
    if (weightKg < 25 || weightKg > 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 25 kg and 300 kg.');
      return;
    }

    updateBasicInfo({
      age: parsedAge,
      heightCm,
      weightKg,
      bmi,
      waistCm,
    });
    router.push('/male-adam');
  }, [age, heightCm, weightKg, bmi, waistCm, updateBasicInfo, router]);

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Top Header Row with Step 1 of 4 */}
      <MaleOnboardingHeader
        step={1}
        totalSteps={4}
        onBack={() => router.back()}
        accentColor="#0284C7"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Your Basic Health Information</Text>
            <Text style={styles.screenSubtitle}>
              This helps us assess your hormonal health and overall risk.
            </Text>
          </View>

          {/* 1. Age Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInputField}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.inputSuffix}>years</Text>
            </View>
          </View>

          {/* 2. Height Field with [cm | ft] toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height</Text>
            <View style={styles.toggleRowContainer}>
              <View style={[styles.textInputContainer, { flex: 1, marginRight: 10 }]}>
                <TextInput
                  style={styles.textInputField}
                  value={heightVal}
                  onChangeText={setHeightVal}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={styles.unitToggleGroup}>
                <Pressable
                  onPress={() => setHeightUnit('cm')}
                  style={[styles.unitToggleBtn, heightUnit === 'cm' && styles.unitToggleBtnActive]}
                >
                  <Text style={[styles.unitToggleText, heightUnit === 'cm' && styles.unitToggleTextActive]}>
                    cm
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setHeightUnit('ft')}
                  style={[styles.unitToggleBtn, heightUnit === 'ft' && styles.unitToggleBtnActive]}
                >
                  <Text style={[styles.unitToggleText, heightUnit === 'ft' && styles.unitToggleTextActive]}>
                    ft
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 3. Weight Field with [kg | lbs] toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight</Text>
            <View style={styles.toggleRowContainer}>
              <View style={[styles.textInputContainer, { flex: 1, marginRight: 10 }]}>
                <TextInput
                  style={styles.textInputField}
                  value={weightVal}
                  onChangeText={setWeightVal}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={styles.unitToggleGroup}>
                <Pressable
                  onPress={() => setWeightUnit('kg')}
                  style={[styles.unitToggleBtn, weightUnit === 'kg' && styles.unitToggleBtnActive]}
                >
                  <Text style={[styles.unitToggleText, weightUnit === 'kg' && styles.unitToggleTextActive]}>
                    kg
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setWeightUnit('lbs')}
                  style={[styles.unitToggleBtn, weightUnit === 'lbs' && styles.unitToggleBtnActive]}
                >
                  <Text style={[styles.unitToggleText, weightUnit === 'lbs' && styles.unitToggleTextActive]}>
                    lbs
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 4. Waist Circumference Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Waist Circumference</Text>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInputField}
                value={waistVal}
                onChangeText={setWaistVal}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.inputSuffix}>cm</Text>
            </View>
          </View>

          {/* 5. YOUR BMI CARD */}
          <View style={styles.bmiCard}>
            <View style={styles.bmiHeaderRow}>
              <Text style={styles.bmiCardTitle}>Your BMI</Text>
              <View style={[styles.bmiBadge, { backgroundColor: bmiBadgeBg }]}>
                <Text style={[styles.bmiBadgeText, { color: bmiColor }]}>{bmiCategory}</Text>
              </View>
            </View>

            <Text style={styles.bmiNumber}>{bmi.toFixed(1)}</Text>

            {/* 4-Band Color Gauge Bar with Needle */}
            <View style={styles.gaugeBarWrapper}>
              <View style={styles.gaugeBar}>
                <View style={[styles.gaugeSegment, { backgroundColor: '#60A5FA' }]} />
                <View style={[styles.gaugeSegment, { backgroundColor: '#34D399' }]} />
                <View style={[styles.gaugeSegment, { backgroundColor: '#FBBF24' }]} />
                <View style={[styles.gaugeSegment, { backgroundColor: '#F87171' }]} />
              </View>

              {/* Pin indicator */}
              <View style={[styles.gaugeNeedle, { left: `${Math.max(4, Math.min(94, bmiPercentPosition))}%` }]}>
                <View style={[styles.needlePin, { backgroundColor: bmiColor }]} />
                <View style={styles.needleLine} />
              </View>
            </View>

            {/* Legend Labels */}
            <View style={styles.gaugeLegendRow}>
              <View style={styles.legendItem}>
                <Text style={styles.legendLabel}>Underweight</Text>
                <Text style={styles.legendSub}>&lt; 18.5</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendLabel}>Normal</Text>
                <Text style={styles.legendSub}>18.5–24.9</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendLabel}>Overweight</Text>
                <Text style={styles.legendSub}>25–29.9</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendLabel}>Obese</Text>
                <Text style={styles.legendSub}>≥ 30</Text>
              </View>
            </View>
          </View>

          {/* 6. WHY WE ASK THIS INFORMATION */}
          <View style={styles.whyCard}>
            <Ionicons
              name="information-circle"
              size={20}
              color="#0284C7"
              style={{ marginRight: 10, marginTop: 1 }}
            />
            <View style={styles.whyTextCol}>
              <Text style={styles.whyTitle}>Why we ask this information?</Text>
              <Text style={styles.whyDesc}>
                Body measurements like BMI and waist circumference help assess metabolic health, which can be related to testosterone levels and overall hormonal health.
              </Text>
            </View>
          </View>

          {/* 7. PRIMARY CTA */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Continue"
              variant="male"
              showArrow
              onPress={handleContinue}
              style={{ backgroundColor: '#0284C7', borderColor: '#0369A1' }}
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
  titleSection: {
    marginBottom: 20,
    marginTop: 6,
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
    marginTop: 4,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginBottom: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    paddingHorizontal: 14,
  },
  textInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: BioPulseColors.textSecondary,
    marginLeft: 6,
  },
  toggleRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitToggleGroup: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    overflow: 'hidden',
    padding: 3,
  },
  unitToggleBtn: {
    paddingHorizontal: 14,
    height: '100%',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitToggleBtnActive: {
    backgroundColor: '#0284C7',
  },
  unitToggleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.textSecondary,
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
  },
  bmiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bmiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bmiCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bmiNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    marginVertical: 4,
  },
  gaugeBarWrapper: {
    position: 'relative',
    marginVertical: 14,
    height: 24,
    justifyContent: 'center',
  },
  gaugeBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  gaugeSegment: {
    flex: 1,
  },
  gaugeNeedle: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    marginLeft: -7,
  },
  needlePin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  needleLine: {
    width: 2,
    height: 10,
    backgroundColor: '#64748B',
  },
  gaugeLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: BioPulseColors.textSecondary,
  },
  legendSub: {
    fontSize: 9.5,
    color: BioPulseColors.textMuted,
    marginTop: 1,
  },
  whyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
  },
  whyTextCol: {
    flex: 1,
  },
  whyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 3,
  },
  whyDesc: {
    fontSize: 12,
    color: BioPulseColors.textSecondary,
    lineHeight: 17,
  },
  ctaWrapper: {
    marginTop: 4,
  },
});
