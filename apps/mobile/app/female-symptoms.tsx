import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import { OnboardingStepper, PathwayHeader } from '../components/onboarding';
import { useFemaleOnboarding } from '../features/onboarding/FemaleOnboardingContext';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../components/navigation';

const FEMALE_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Cycle Health' },
  { id: 3, label: 'Symptoms' },
  { id: 4, label: 'Lifestyle' },
  { id: 5, label: 'Review' },
];

export interface SymptomCardDef {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isModelFeature: boolean;
  isCycleSynced?: boolean;
}

// ── Physical Symptoms (Real Model Features + Oily Skin Context) ────────────
export const PHYSICAL_SYMPTOMS: SymptomCardDef[] = [
  {
    id: 'weight_gain',
    title: 'Weight gain',
    description: 'Difficulty losing weight',
    icon: 'scale-outline',
    isModelFeature: true,
  },
  {
    id: 'hirsutism',
    title: 'Excess hair growth',
    description: 'On face or body',
    icon: 'cut-outline',
    isModelFeature: true,
  },
  {
    id: 'skin_darkening',
    title: 'Skin darkening',
    description: 'Especially around neck',
    icon: 'color-palette-outline',
    isModelFeature: true,
  },
  {
    id: 'hair_loss',
    title: 'Hair loss',
    description: 'Thinning hair',
    icon: 'fitness-outline',
    isModelFeature: true,
  },
  {
    id: 'pimples_acne',
    title: 'Pimples / Acne',
    description: 'Frequent breakouts',
    icon: 'sparkles-outline',
    isModelFeature: true,
  },
  {
    id: 'oily_skin',
    title: 'Oily skin',
    description: 'Increased oiliness',
    icon: 'water-outline',
    isModelFeature: false,
  },
];

// ── Menstrual & Reproductive Symptoms (Reconciled with Cycle Health) ───────
export const MENSTRUAL_SYMPTOMS: SymptomCardDef[] = [
  {
    id: 'irregular_periods',
    title: 'Irregular periods',
    description: 'Unpredictable cycles',
    icon: 'calendar-outline',
    isModelFeature: true,
    isCycleSynced: true,
  },
  {
    id: 'long_cycles',
    title: 'Long cycles',
    description: '> 35 days',
    icon: 'time-outline',
    isModelFeature: true,
    isCycleSynced: true,
  },
  {
    id: 'missed_periods',
    title: 'Missed periods',
    description: 'Occasional or frequent',
    icon: 'alert-circle-outline',
    isModelFeature: false,
    isCycleSynced: true,
  },
];

// ── Other Symptoms (Optional General Wellbeing Context) ────────────────────
export const OTHER_SYMPTOMS: SymptomCardDef[] = [
  {
    id: 'bloating',
    title: 'Bloating',
    description: 'Abdominal discomfort',
    icon: 'disc-outline',
    isModelFeature: false,
  },
  {
    id: 'mood_changes',
    title: 'Mood changes',
    description: 'Anxiety or mood swings',
    icon: 'happy-outline',
    isModelFeature: false,
  },
  {
    id: 'fatigue',
    title: 'Fatigue',
    description: 'Low energy',
    icon: 'battery-charging-outline',
    isModelFeature: false,
  },
];

/**
 * SCREEN 11: FEMALE "PCOS Related Symptoms" (Step 3 of 5)
 *
 * Implements:
 * - Selectable multi-select symptom cards with active pink tint and checkmark
 * - Strict ML feature binding: only valid model features become assessment inputs
 * - Canonical cycle state reconciliation with zero divergence from Cycle Health
 * - Optional symptoms recorded as general clinical context without polluting ML payload
 * - Responsive 2-column (phone) and 3-column (tablet) grid layout
 * - Full state preservation across navigation and review flows
 */
export default function FemaleSymptomsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const isFromReview = params.returnTo === 'review';

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallPhone = width < 360;

  const cardWidth = isTablet ? '31.8%' : isSmallPhone ? '100%' : '48.5%';

  // Persistent onboarding context
  const { symptoms, updateSymptoms, cycleHealth, updateCycleHealth, setLastActiveScreeningRoute } = useFemaleOnboarding();

  // Track that user is currently on Screen 11 (Symptoms step)
  useEffect(() => {
    setLastActiveScreeningRoute('/female-symptoms');
  }, [setLastActiveScreeningRoute]);

  // Initialize selected symptoms combining stored context + canonical cycle health state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() => {
    const initial = new Set(symptoms || []);
    if (cycleHealth.regularity === 'irregular') {
      initial.add('irregular_periods');
    }
    if (cycleHealth.cycleLength > 35) {
      initial.add('long_cycles');
    }
    if (cycleHealth.missedPeriodsYear && cycleHealth.missedPeriodsYear !== '0') {
      initial.add('missed_periods');
    }
    return Array.from(initial);
  });

  // Persist draft selections before navigating to other tabs
  const handleBeforeTabNavigate = useCallback(() => {
    updateSymptoms(selectedSymptoms);
    setLastActiveScreeningRoute('/female-symptoms');
  }, [selectedSymptoms, updateSymptoms, setLastActiveScreeningRoute]);

  // Reconciled toggle handler: keeps single canonical truth for cycle rhythm
  const toggleSymptom = useCallback(
    (id: string) => {
      setSelectedSymptoms((prev) => {
        const isSelected = prev.includes(id);
        const next = isSelected ? prev.filter((item) => item !== id) : [...prev, id];

        // Reconcile canonical cycleHealth fields to prevent contradictory inputs
        if (id === 'irregular_periods') {
          updateCycleHealth({ regularity: !isSelected ? 'irregular' : 'regular' });
        } else if (id === 'long_cycles') {
          updateCycleHealth({
            cycleLength: !isSelected
              ? (cycleHealth.cycleLength > 35 ? cycleHealth.cycleLength : 36)
              : (cycleHealth.cycleLength > 35 ? 28 : cycleHealth.cycleLength),
          });
        } else if (id === 'missed_periods') {
          updateCycleHealth({
            missedPeriodsYear: !isSelected
              ? (cycleHealth.missedPeriodsYear !== '0' ? cycleHealth.missedPeriodsYear : '1-2')
              : '0',
          });
        }

        return next;
      });
    },
    [cycleHealth, updateCycleHealth]
  );

  const handleContinue = useCallback(() => {
    updateSymptoms(selectedSymptoms);
    if (isFromReview) {
      router.push('/female-review');
    } else {
      router.push('/female-lifestyle');
    }
  }, [selectedSymptoms, updateSymptoms, isFromReview, router]);

  const handleBack = useCallback(() => {
    updateSymptoms(selectedSymptoms);
    if (isFromReview) {
      router.push('/female-review');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/female-cycle-health');
    }
  }, [selectedSymptoms, updateSymptoms, isFromReview, router]);

  const renderCard = (item: SymptomCardDef) => {
    const isSelected = selectedSymptoms.includes(item.id);

    return (
      <Pressable
        key={item.id}
        onPress={() => toggleSymptom(item.id)}
        style={({ pressed }) => [
          styles.card,
          { width: cardWidth },
          isSelected && styles.cardSelected,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.title}, ${item.description}`}
      >
        <View style={styles.cardHeaderRow}>
          <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
            <Ionicons
              name={item.icon}
              size={18}
              color={isSelected ? BioPulseColors.femaleAccent : '#64748B'}
            />
          </View>
          <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
            {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
        </View>

        <View style={styles.cardTextCol}>
          <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {item.isCycleSynced && (
          <View style={[styles.syncedBadge, isSelected && styles.syncedBadgeSelected]}>
            <Ionicons
              name="sync-outline"
              size={10}
              color={isSelected ? BioPulseColors.femaleAccent : '#64748B'}
            />
            <Text style={[styles.syncedText, isSelected && styles.syncedTextSelected]}>
              Cycle Synced
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

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

      {/* Decorative upper-right female illustration matching brand aesthetic */}
      <View pointerEvents="none" style={styles.heroIllustrationContainer}>
        <Image
          source={require('../assets/female_pathway_hero.png')}
          style={styles.heroIllustration}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PathwayHeader
          onBack={handleBack}
          subtitle="WOMEN'S HEALTH INTELLIGENCE"
          showHelp={false}
        />

        <OnboardingStepper
          currentStep={3}
          steps={FEMALE_ONBOARDING_STEPS}
          accentColor={BioPulseColors.femaleAccent}
        />

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>PCOS Related Symptoms</Text>
          <Text style={styles.screenSubtitle}>
            Select the symptoms you experience. These responses will be used as part of your screening assessment.
          </Text>

          {/* Reassuring Context Pill */}
          <View style={styles.statusPill}>
            <Ionicons
              name={selectedSymptoms.length > 0 ? 'checkmark-circle-outline' : 'information-circle-outline'}
              size={15}
              color={selectedSymptoms.length > 0 ? BioPulseColors.femaleAccent : '#64748B'}
            />
            <Text style={styles.statusPillText}>
              {selectedSymptoms.length === 0
                 ? 'No symptoms selected (reporting none is clinically valid)'
                 : `${selectedSymptoms.length} symptom${selectedSymptoms.length > 1 ? 's' : ''} selected`}
            </Text>
          </View>
        </View>

        {/* ── Section 1: Physical Symptoms ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="body-outline" size={15} color={BioPulseColors.femaleAccent} />
            </View>
            <View>
              <Text style={styles.sectionHeading}>Physical Symptoms</Text>
              <Text style={styles.sectionSubtext}>Common bodily and dermatological indicators</Text>
            </View>
          </View>
          <View style={styles.cardGrid}>
            {PHYSICAL_SYMPTOMS.map((item) => renderCard(item))}
          </View>
        </View>

        {/* ── Section 2: Menstrual & Reproductive Symptoms ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="calendar-outline" size={15} color={BioPulseColors.femaleAccent} />
            </View>
            <View>
              <Text style={styles.sectionHeading}>Menstrual & Reproductive Symptoms</Text>
              <Text style={styles.sectionSubtext}>Synchronized with your Cycle Health history</Text>
            </View>
          </View>
          <View style={styles.cardGrid}>
            {MENSTRUAL_SYMPTOMS.map((item) => renderCard(item))}
          </View>
        </View>

        {/* ── Section 3: Other Symptoms (Optional Context) ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="sparkles-outline" size={15} color={BioPulseColors.femaleAccent} />
            </View>
            <View>
              <Text style={styles.sectionHeading}>Other Symptoms</Text>
              <Text style={styles.sectionSubtext}>Optional general wellbeing indicators (non-diagnostic)</Text>
            </View>
          </View>
          <View style={styles.cardGrid}>
            {OTHER_SYMPTOMS.map((item) => renderCard(item))}
          </View>
        </View>

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.continueBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel={isFromReview ? 'Save and return to review' : 'Continue to lifestyle'}
        >
          <Text style={styles.continueBtnText}>
            {isFromReview ? 'Save & Return to Review →' : 'Continue →'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Permanent BioPulse Bottom Navigation (Screen 11 Onward) */}
      <BioPulseBottomNav activeTab="screening" beforeNavigate={handleBeforeTabNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FEF8FA',
  },
  heroIllustrationContainer: {
    position: 'absolute',
    top: 45,
    right: -10,
    width: 140,
    height: 140,
    opacity: 0.85,
    zIndex: 0,
  },
  heroIllustration: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    zIndex: 1,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#162A45',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#64748B',
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCE7F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statusPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCE8EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#162A45',
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#8A99AD',
    marginTop: 1,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.25,
    borderColor: '#F1F5F9',
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cardSelected: {
    borderColor: BioPulseColors.femaleAccent,
    backgroundColor: '#FFF6F9',
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: '#FCE8EF',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkCircleSelected: {
    borderColor: BioPulseColors.femaleAccent,
    backgroundColor: BioPulseColors.femaleAccent,
  },
  cardTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#162A45',
    marginBottom: 3,
    lineHeight: 18,
  },
  cardTitleSelected: {
    color: BioPulseColors.femaleAccent,
  },
  cardDesc: {
    fontSize: 11.5,
    lineHeight: 15,
    color: '#64748B',
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  syncedBadgeSelected: {
    backgroundColor: '#FCE8EF',
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  syncedTextSelected: {
    color: BioPulseColors.femaleAccent,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: BioPulseColors.femaleAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
