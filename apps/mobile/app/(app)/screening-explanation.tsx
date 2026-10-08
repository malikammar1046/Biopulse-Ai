import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useHealthStore } from '../../store/healthStore';
import {
  formatShapFactorForPatient,
  formatAssessmentDate,
  getFeatureIconName,
  getHistoricalAssessmentById,
  ProgressiveAssessment,
} from '../../services/assessmentService';

/**
 * SCREEN 18: SCREENING EXPLANATION
 *
 * Strict visual match to Screenshot 18:
 * - Top Header: Back chevron (<), centered "Screening Explanation"
 * - Title: "What influenced your result?"
 * - Subtitle: "These are the top factors that contributed to your PCOS / hypogonadism screening result."
 * - Mini Summary Card: Real probability ring, risk badge, module name, real tier & assessment date & Ref #
 * - Top Factors from validated model SHAP outputs with patient-friendly language & directional indicators
 * - Expandable "See all factors" for additional model factors
 * - Clinical non-diagnostic disclaimer
 */
export default function ScreeningExplanationScreen() {
  const router = useRouter();
  const { id: queryAssessmentId } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { isFemale, pathway, screening, assessmentHistory } = useHealthStore();
  const [showAllFactors, setShowAllFactors] = useState(false);
  const [historicalData, setHistoricalData] = useState<ProgressiveAssessment | null>(null);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);

  useEffect(() => {
    if (!queryAssessmentId) {
      setHistoricalData(null);
      return;
    }
    const found = assessmentHistory?.find(
      (a) => a.id === queryAssessmentId || a.assessment_id === queryAssessmentId
    );
    if (found) {
      setHistoricalData(found);
      return;
    }
    setIsLoadingHistorical(true);
    getHistoricalAssessmentById(queryAssessmentId)
      .then((res) => {
        if (res) setHistoricalData(res);
      })
      .finally(() => {
        setIsLoadingHistorical(false);
      });
  }, [queryAssessmentId, assessmentHistory]);

  const activeAssessment = historicalData || null;

  const isAssessed = activeAssessment
    ? Boolean(activeAssessment.probability_percent > 0 || (activeAssessment.probability ?? 0) > 0)
    : Boolean(screening.tierStatus !== 'Not Assessed' && screening.probabilityPercent > 0);

  const isAssessmentFemale = activeAssessment?.module
    ? activeAssessment.module === 'female_pcos' || activeAssessment.module === 'female'
    : isFemale;

  const themeAccent = isAssessmentFemale ? '#F43F7D' : '#0284C7';
  const themeBgLight = isAssessmentFemale ? '#FDF2F8' : '#EFF6FF';

  const probPercent = activeAssessment
    ? Math.round(Number(activeAssessment.probability_percent || (activeAssessment.probability ? activeAssessment.probability * 100 : 0)))
    : screening.probabilityPercent;

  const riskLabel = activeAssessment
    ? String(activeAssessment.risk_label || activeAssessment.risk_category || 'Assessed')
    : screening.riskBand;

  const assessmentDate = activeAssessment
    ? formatAssessmentDate(activeAssessment.created_at)
    : (screening.lastAssessedDate || formatAssessmentDate(screening.createdAt));

  const assessmentId = activeAssessment
    ? (activeAssessment.assessment_id || activeAssessment.id || queryAssessmentId)
    : screening.assessmentId;

  const activeTier = activeAssessment?.assessment_level || screening.tier || 1;

  // Real factors derived strictly from validated model output — Zero fabricated factors
  const top3Factors = useMemo(() => {
    const raw = activeAssessment
      ? (activeAssessment.explanations && activeAssessment.explanations.length > 0
          ? activeAssessment.explanations
          : activeAssessment.shap_explanation?.factors || [])
      : screening.topFactors || [];

    if (raw.length > 0) {
      return raw.slice(0, 3).map((f, i) => {
        const pf = formatShapFactorForPatient(f, i);
        return {
          id: pf.feature_key || `factor_${i}`,
          name: pf.patient_label || pf.feature_name,
          direction: pf.direction,
          icon: (pf.iconName || getFeatureIconName(pf.feature_key)) as any,
          explanation: pf.patient_explanation || pf.description || 'Influenced your screening likelihood score.',
          patientLabel: pf.patient_label,
          impactPercent: pf.explanation_share_percent,
        };
      });
    }
    return [];
  }, [activeAssessment, screening.topFactors]);

  const additionalFactors = useMemo(() => {
    const rawAll = activeAssessment
      ? (activeAssessment.explanations && activeAssessment.explanations.length > 3
          ? activeAssessment.explanations
          : activeAssessment.shap_explanation?.factors || [])
      : screening.allFactors || [];

    if (rawAll.length > 3) {
      return rawAll.slice(3).map((f, i) => {
        const pf = formatShapFactorForPatient(f, i + 3);
        return {
          id: pf.feature_key || `add_${i}`,
          name: pf.patient_label || pf.feature_name,
          direction: pf.direction,
          icon: (pf.iconName || getFeatureIconName(pf.feature_key)) as any,
          explanation: pf.patient_explanation || pf.description || 'Contributed to overall screening profile.',
          patientLabel: pf.patient_label,
          impactPercent: pf.explanation_share_percent,
        };
      });
    }
    return [];
  }, [activeAssessment, screening.allFactors]);

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

  if (isLoadingHistorical) {
    return (
      <BioPulseBackground style={styles.root}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={themeAccent} />
          <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>
            Loading assessment explanation...
          </Text>
        </View>
      </BioPulseBackground>
    );
  }

  if (!isAssessed) {
    return (
      <BioPulseBackground style={styles.root}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: themeBgLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="analytics-outline" size={36} color={themeAccent} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#073B72', marginBottom: 8, textAlign: 'center' }}>
            No Assessment Available
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 320 }}>
            Complete your initial screening to view personalized clinical factors and understand how each feature influences your assessment.
          </Text>
          <Pressable
            onPress={() => router.push(isAssessmentFemale ? '/female-review' : '/male-review')}
            style={{ backgroundColor: themeAccent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Start Screening Assessment →</Text>
          </Pressable>
        </View>
      </BioPulseBackground>
    );
  }

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
              {isAssessmentFemale
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
                    backgroundColor: isAssessmentFemale ? '#FEE2E2' : '#FEF3C7',
                    borderColor: isAssessmentFemale ? '#FECACA' : '#FDE68A',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.riskBadgeText,
                    { color: isAssessmentFemale ? '#DC2626' : '#D97706' },
                  ]}
                >
                  {riskLabel}
                </Text>
              </View>
              <Text style={styles.screeningModuleName}>
                {isAssessmentFemale ? 'PCOS Screening' : 'Hypogonadism Screening'}
              </Text>
              <Text style={styles.screeningDateMeta}>
                Tier {activeTier} • {assessmentDate}{assessmentId ? ` • Ref #${assessmentId.slice(0, 8)}` : ''}
              </Text>
            </View>
          </View>

          {/* TOP 3 FACTORS LIST */}
          <View style={styles.factorsList}>
            {top3Factors.length === 0 ? (
              <View style={[styles.factorCard, { paddingVertical: 18, alignItems: 'center' }]}>
                <Ionicons name="information-circle-outline" size={22} color="#64748B" style={{ marginBottom: 4 }} />
                <Text style={[styles.factorTitle, { textAlign: 'center', marginBottom: 4 }]}>
                  Factor Breakdown Computed
                </Text>
                <Text style={[styles.factorExplanation, { textAlign: 'center' }]}>
                  Your overall likelihood score incorporates your verified clinical responses. Consult a healthcare provider for detailed guidance.
                </Text>
              </View>
            ) : (
              top3Factors.map((factor) => {
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
              })
            )}
          </View>

          {/* EXPANDABLE "SEE ALL FACTORS" */}
          {additionalFactors.length > 0 && (
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
          )}

          {/* EXPANDED ADDITIONAL FACTORS */}
          {showAllFactors && additionalFactors.length > 0 && (
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
              {activeAssessment?.disclaimer ||
                screening.disclaimer ||
                'This is a screening result, not a diagnosis. Please consult a healthcare professional for proper evaluation.'}
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
