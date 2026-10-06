import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useHealthStore } from '../../store/healthStore';

/**
 * SCREEN 18: SCREENING EXPLANATION
 *
 * Strict visual match to Screenshot 18:
 * - Top Header: Back chevron (<), centered "Screening Explanation"
 * - Title: "What influenced your result?"
 * - Subtitle: "These are the top factors that contributed to your PCOS screening result."
 * - Mini Summary Card:
 *   - Circular ring gauge with "72%"
 *   - [ Higher Risk ] badge, "PCOS Screening", "Tier 1 • 12 Mar 2025"
 * - Top 3 Factors (Cards with icon, factor name, ↑ Increased Risk, plain language explanation):
 *   1. Irregular Cycle
 *   2. Excess Hair Growth
 *   3. Higher BMI
 * - Expandable "See all factors" link
 * - Non-diagnostic clinical disclaimer banner
 */
export default function ScreeningExplanationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { isFemale, screening } = useHealthStore();
  const [showAllFactors, setShowAllFactors] = useState(false);

  const themeAccent = isFemale ? '#F43F7D' : '#0284C7';
  const themeBgLight = isFemale ? '#FDF2F8' : '#EFF6FF';
  const themeBorder = isFemale ? '#FCE7F3' : '#DBEAFE';

  const probPercent = screening.probabilityPercent || (isFemale ? 72 : 38);
  const riskLabel = screening.riskBand || (isFemale ? 'Higher Risk' : 'Intermediate Risk');

  // Female curated factors matching reference screenshot
  const femaleCuratedTop3 = useMemo(() => [
    {
      id: 'cycle',
      name: 'Irregular Cycle',
      direction: 'increases_risk',
      icon: 'pulse-outline' as const,
      explanation: 'Having irregular or infrequent periods contributed to a higher screening risk.',
    },
    {
      id: 'hair',
      name: 'Excess Hair Growth',
      direction: 'increases_risk',
      icon: 'cut-outline' as const,
      explanation: 'Higher levels of hair growth are associated with PCOS risk.',
    },
    {
      id: 'bmi',
      name: 'Higher BMI',
      direction: 'increases_risk',
      icon: 'speedometer-outline' as const,
      explanation: 'A higher BMI is a known contributing factor for PCOS.',
    },
  ], []);

  // Male curated factors
  const maleCuratedTop3 = useMemo(() => [
    {
      id: 'libido',
      name: 'Decreased Libido',
      direction: 'increases_risk',
      icon: 'heart-dislike-outline' as const,
      explanation: 'Reduced sexual interest is a primary indicator of lower testosterone activity.',
    },
    {
      id: 'energy',
      name: 'Low Daytime Energy',
      direction: 'increases_risk',
      icon: 'battery-dead-outline' as const,
      explanation: 'Chronic persistent fatigue contributes to androgen deficiency screening.',
    },
    {
      id: 'waist',
      name: 'Elevated Waist Circumference',
      direction: 'increases_risk',
      icon: 'body-outline' as const,
      explanation: 'Visceral abdominal adipose tissue correlates with altered hormonal conversion.',
    },
  ], []);

  const defaultTop3 = isFemale ? femaleCuratedTop3 : maleCuratedTop3;

  // Use store factors if available and valid, fallback to curated
  const top3Factors = useMemo(() => {
    if (screening.topFactors && screening.topFactors.length >= 3) {
      return screening.topFactors.slice(0, 3).map((f, i) => ({
        id: f.id || `factor-${i}`,
        name: f.name,
        direction: f.direction || 'increases_risk',
        icon: (f.iconName as any) || defaultTop3[i]?.icon || 'analytics-outline',
        explanation: f.explanation || defaultTop3[i]?.explanation || 'Influenced your screening probability score.',
      }));
    }
    return defaultTop3;
  }, [screening.topFactors, defaultTop3]);

  const additionalFactors = useMemo(() => {
    if (screening.allFactors && screening.allFactors.length > 3) {
      return screening.allFactors.slice(3).map((f, i) => ({
        id: f.id || `add-${i}`,
        name: f.name,
        direction: f.direction || 'increases_risk',
        icon: (f.iconName as any) || 'analytics-outline',
        explanation: f.explanation || 'Contributed to overall endocrine risk profile.',
      }));
    }
    return [
      {
        id: 'sleep',
        name: isFemale ? 'Healthy Sleep Routine' : 'Consistent Sleep Duration',
        direction: 'decreases_risk',
        icon: 'moon-outline' as const,
        explanation: 'Adequate nocturnal rest supports endocrine homeostasis and reduced risk.',
      },
      {
        id: 'activity',
        name: 'Regular Physical Activity',
        direction: 'decreases_risk',
        icon: 'walk-outline' as const,
        explanation: 'Weekly movement improves metabolic sensitivity and hormone balance.',
      },
    ];
  }, [screening.allFactors, isFemale]);

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

  return (
    <BioPulseBackground style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP HEADER */}
      <View style={[styles.topHeader, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
        </Pressable>

        <Text style={styles.headerTitle}>Screening Explanation</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* TITLE & SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>What influenced your result?</Text>
            <Text style={styles.screenSubtitle}>
              {isFemale
                ? 'These are the top factors that contributed to your PCOS screening result.'
                : 'These are the top factors that contributed to your hypogonadism screening result.'}
            </Text>
          </View>

          {/* MINI RESULT SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.gaugeContainer}>
              <View style={[styles.gaugeRing, { borderColor: themeAccent }]}>
                <Text style={styles.gaugePercentText}>{probPercent}%</Text>
              </View>
            </View>

            <View style={styles.summaryDetailsCol}>
              <View
                style={[
                  styles.riskBadge,
                  {
                    backgroundColor: isFemale ? '#FEE2E2' : '#FEF3C7',
                    borderColor: isFemale ? '#FECACA' : '#FDE68A',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.riskBadgeText,
                    { color: isFemale ? '#DC2626' : '#D97706' },
                  ]}
                >
                  {riskLabel}
                </Text>
              </View>
              <Text style={styles.screeningModuleName}>
                {isFemale ? 'PCOS Screening' : 'Hypogonadism Screening'}
              </Text>
              <Text style={styles.screeningDateMeta}>Tier 1 • 12 Mar 2025</Text>
            </View>
          </View>

          {/* TOP 3 FACTORS LIST */}
          <View style={styles.factorsList}>
            {top3Factors.map((factor) => {
              const isIncrease = factor.direction === 'increases_risk';
              return (
                <View key={factor.id} style={styles.factorCard}>
                  <View style={[styles.factorIconBox, { backgroundColor: themeBgLight }]}>
                    <Ionicons name={factor.icon} size={22} color={themeAccent} />
                  </View>

                  <View style={styles.factorContentCol}>
                    <Text style={styles.factorTitle}>{factor.name}</Text>
                    <Text
                      style={[
                        styles.factorDirectionText,
                        { color: isIncrease ? '#DC2626' : '#10B981' },
                      ]}
                    >
                      {isIncrease ? '↑ Increased Risk' : '↓ Decreased Risk'}
                    </Text>
                    <Text style={styles.factorExplanation}>{factor.explanation}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* EXPANDABLE "SEE ALL FACTORS" */}
          <Pressable
            onPress={() => setShowAllFactors((prev) => !prev)}
            style={({ pressed }) => [styles.expandCard, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel="See all factors"
          >
            <Text style={[styles.expandCardText, { color: themeAccent }]}>
              {showAllFactors ? 'Hide additional factors' : 'See all factors'}
            </Text>
            <Ionicons
              name={showAllFactors ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={themeAccent}
            />
          </Pressable>

          {/* EXPANDED ADDITIONAL FACTORS */}
          {showAllFactors && (
            <View style={styles.additionalFactorsList}>
              {additionalFactors.map((factor) => {
                const isIncrease = factor.direction === 'increases_risk';
                return (
                  <View key={factor.id} style={styles.factorCard}>
                    <View style={[styles.factorIconBox, { backgroundColor: themeBgLight }]}>
                      <Ionicons name={factor.icon} size={22} color={themeAccent} />
                    </View>

                    <View style={styles.factorContentCol}>
                      <Text style={styles.factorTitle}>{factor.name}</Text>
                      <Text
                        style={[
                          styles.factorDirectionText,
                          { color: isIncrease ? '#DC2626' : '#10B981' },
                        ]}
                      >
                        {isIncrease ? '↑ Increased Risk' : '↓ Decreased Risk'}
                      </Text>
                      <Text style={styles.factorExplanation}>{factor.explanation}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* CLINICAL NON-DIAGNOSTIC DISCLAIMER */}
          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle" size={20} color="#0284C7" style={styles.infoIcon} />
            <Text style={styles.disclaimerText}>
              This is a screening result, not a diagnosis. Please consult a healthcare professional
              for proper evaluation.
            </Text>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#073B72',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 460,
  },
  tabletWrapper: {
    maxWidth: 580,
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 6,
    borderLeftColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#073B72',
  },
  summaryDetailsCol: {
    flex: 1,
    gap: 3,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  screeningModuleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
    marginTop: 2,
  },
  screeningDateMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  factorsList: {
    gap: 12,
    marginBottom: 12,
  },
  factorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  factorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorContentCol: {
    flex: 1,
    gap: 3,
  },
  factorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  factorDirectionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  factorExplanation: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  expandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.9,
  },
  expandCardText: {
    fontSize: 14,
    fontWeight: '700',
  },
  additionalFactorsList: {
    gap: 12,
    marginBottom: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
    marginTop: 6,
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
});
