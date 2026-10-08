import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
import { Logo } from '../components/brand/Logo';
import { useFemaleOnboarding } from '../features/onboarding';
import { useHealthStore } from '../store';
import {
  getFeatureLabel,
  getFeatureIconName,
  resolveRiskBand,
  formatShapFactorForPatient,
  formatAssessmentDate,
} from '../services/assessmentService';

interface FactorItem {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  direction?: 'increases_risk' | 'decreases_risk' | 'positive' | 'negative' | 'higher' | 'lower' | 'neutral';
  patientLabel?: string;
  impactPercent?: number;
}

/**
 * SCREEN 11: FEMALE SCREENING RESULT
 *
 * Connected directly to real assessment pipeline:
 * Assessment -> Probability -> Risk Category -> SHAP Values -> Top Contributing Factors -> Patient-Friendly Explanation
 */
export default function FemaleScreeningResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { activeAssessment } = useFemaleOnboarding();
  const { updateProfile, screening } = useHealthStore();

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

  const hasAssessment = Boolean(
    activeAssessment || (screening.tierStatus && screening.tierStatus !== 'Not Assessed' && screening.probabilityPercent > 0)
  );

  // Extract probability and category from authentic model assessment
  const probability = activeAssessment?.probability ?? (screening.probability ?? (screening.probabilityPercent > 0 ? screening.probabilityPercent / 100 : 0));
  const probabilityPercent = activeAssessment?.probability_percent ??
    (activeAssessment ? Math.round((activeAssessment.probability ?? 0) * 100) : screening.probabilityPercent);

  const band = resolveRiskBand(
    probability,
    activeAssessment?.risk_category || screening.riskCategory,
    activeAssessment?.threshold || 0.25
  );

  const riskLabel = activeAssessment?.risk_label || band.label;
  const assessmentDate = formatAssessmentDate(activeAssessment?.created_at || screening.createdAt);
  const assessmentId = activeAssessment?.assessment_id || activeAssessment?.id || screening.assessmentId;
  const disclaimerText =
    activeAssessment?.disclaimer ||
    screening.disclaimer ||
    'This is not a medical diagnosis. Results are an AI-based risk assessment. Please consult a healthcare professional for a confirmed diagnosis.';

  const displayFactors: FactorItem[] = useMemo(() => {
    const rawFactors =
      (activeAssessment?.explanations && activeAssessment.explanations.length > 0)
        ? activeAssessment.explanations
        : (activeAssessment?.shap_explanation?.factors && activeAssessment.shap_explanation.factors.length > 0)
        ? activeAssessment.shap_explanation.factors
        : screening.topFactors || [];

    if (rawFactors.length > 0) {
      return rawFactors.slice(0, 3).map((f: any, idx: number) => {
        const pf = formatShapFactorForPatient(f, idx);
        return {
          id: idx + 1,
          icon: (pf.iconName || getFeatureIconName(pf.feature_key)) as any,
          title: pf.feature_name,
          description: pf.patient_explanation || 'Contributing clinical indicator identified during AI screening.',
          direction: pf.direction,
          patientLabel: pf.patient_label,
          impactPercent: pf.explanation_share_percent,
        };
      });
    }
    return [];
  }, [activeAssessment, screening]);

  const handleContinueNextTier = () => {
    updateProfile({ isOnboarded: true });
    // Route to home dashboard (Screen 12)
    router.replace('/(app)');
  };

  const handleDownloadReport = () => {
    Alert.alert('Download Report', 'Your clinical PCOS screening summary report has been prepared for download.', [{ text: 'OK' }]);
  };

  const handleBookConsultation = () => {
    Alert.alert('Book Consultation', 'Connecting you with certified reproductive endocrinologists and gynecologists.', [{ text: 'OK' }]);
  };

  if (!hasAssessment) {
    return (
      <BioPulseBackground style={styles.container}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
          </Pressable>
          <View style={styles.logoCenter}>
            <Logo size="sm" layout="horizontal" showTagline={false} />
          </View>
          <View style={{ width: 38 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FDF2F8', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="clipboard-outline" size={36} color="#F43F7D" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#073B72', marginBottom: 8, textAlign: 'center' }}>
            No Screening Result Found
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 320 }}>
            You have not completed an active PCOS screening assessment yet. Start your questionnaire to receive your personalized clinical evaluation.
          </Text>
          <Pressable
            onPress={() => router.push('/female-review')}
            style={{ backgroundColor: '#F43F7D', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Start Screening Assessment →</Text>
          </Pressable>
        </View>
      </BioPulseBackground>
    );
  }

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Top Header Row */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
        </Pressable>

        <View style={styles.logoCenter}>
          <Logo size="sm" layout="horizontal" showTagline={false} />
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Your PCOS Screening Result</Text>
            <Text style={styles.screenSubtitle}>
              Based on your clinical screening information, our AI model has evaluated your likelihood of PCOS.
            </Text>
          </View>

          {/* CENTRAL RISK CARD */}
          <View style={styles.riskCard}>
            <View style={styles.riskHeaderRow}>
              {/* Circular Gauge */}
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeCircle}>
                  <Text style={styles.gaugePercent}>{probabilityPercent}%</Text>
                  <Text style={styles.gaugeLabel}>Probability</Text>
                </View>
              </View>

              {/* Right Side: Risk Badge & Tier */}
              <View style={styles.riskInfoCol}>
                <View style={[styles.riskBadge, { backgroundColor: band.badgeBg, borderColor: band.badgeBorder }]}>
                  <Ionicons
                    name={band.category === 'higher' ? 'warning-outline' : 'shield-checkmark-outline'}
                    size={15}
                    color={band.color}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.riskBadgeText, { color: band.color }]}>{riskLabel}</Text>
                </View>

                <View style={styles.tierStatusRow}>
                  <View style={styles.tierCircle}>
                    <View style={styles.tierDot} />
                  </View>
                  <View>
                    <Text style={styles.tierTitle}>Tier 1</Text>
                    <Text style={styles.tierSubtitle}>{assessmentDate}</Text>
                    {assessmentId ? (
                      <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                        Ref #{assessmentId.slice(0, 8)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.riskSummaryText}>
              {band.summaryText}
            </Text>
          </View>

          {/* TOP CONTRIBUTING FACTORS */}
          <View style={styles.factorsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>What influenced your result?</Text>
              <Ionicons name="information-circle-outline" size={16} color={BioPulseColors.textSecondary} />
            </View>

            {displayFactors.length > 0 ? (
              <View style={styles.factorsList}>
                {displayFactors.map((factor) => {
                  const isHigher = factor.direction === 'increases_risk';
                  const isLower = factor.direction === 'decreases_risk';
                  return (
                    <View key={factor.id} style={styles.factorCard}>
                      {/* Number Badge */}
                      <View style={styles.numberBadge}>
                        <Text style={styles.numberText}>{factor.id}</Text>
                      </View>

                      {/* Icon */}
                      <View style={styles.factorIconBox}>
                        <Ionicons name={factor.icon} size={18} color="#F43F7D" />
                      </View>

                      {/* Text Details */}
                      <View style={styles.factorTextCol}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={styles.factorTitle}>{factor.title}</Text>
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: isHigher ? '#FEE2E2' : isLower ? '#DCFCE7' : '#F1F5F9',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: isHigher ? '#DC2626' : isLower ? '#15803D' : '#64748B',
                              }}
                            >
                              {isHigher ? '↑ Increased Risk' : isLower ? '↓ Favorable Factor' : 'Neutral'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.factorDesc}>{factor.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                  Top clinical factors are being processed for this assessment.
                </Text>
              </View>
            )}
          </View>

          {/* Non-Diagnostic Disclaimer */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={BioPulseColors.teal}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={styles.infoBannerText}>
              {disclaimerText}
            </Text>
          </View>

          {/* NEXT BEST ACTION CARD */}
          <Pressable
            onPress={handleContinueNextTier}
            style={styles.nextActionCard}
            accessibilityRole="button"
          >
            <View style={styles.nextActionLeft}>
              <View style={styles.flaskIconBox}>
                <Ionicons name="flask-outline" size={20} color="#0D9488" />
              </View>
              <View style={styles.nextActionTextCol}>
                <Text style={styles.nextActionLabel}>Next Best Action</Text>
                <Text style={styles.nextActionTitle}>Add clinical hormone labs</Text>
                <Text style={styles.nextActionDesc}>
                  A blood test (e.g. AMH, testosterone, LH/FSH) can provide more clarity on your hormonal health.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={BioPulseColors.teal} />
          </Pressable>

          {/* PRIMARY CTA */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Continue to Next Tier"
              variant="female"
              showArrow
              onPress={handleContinueNextTier}
              style={{ backgroundColor: '#F43F7D', borderColor: '#E11D48' }}
            />
          </View>

          {/* SECONDARY ACTIONS ROW */}
          <View style={styles.secondaryRow}>
            <Pressable onPress={handleDownloadReport} style={styles.secondaryBtn}>
              <Ionicons name="download-outline" size={16} color="#F43F7D" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Download Report</Text>
            </Pressable>

            <Pressable onPress={handleBookConsultation} style={styles.secondaryBtn}>
              <Ionicons name="calendar-outline" size={16} color="#F43F7D" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Book Consultation</Text>
            </Pressable>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  mainWrapper: {
    width: '100%',
  },
  titleSection: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: BioPulseColors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    marginBottom: 16,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  riskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 8,
    borderColor: '#FCE7F0',
    borderTopColor: '#F43F7D',
    borderRightColor: '#F43F7D',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  gaugePercent: {
    fontSize: 26,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.5,
  },
  gaugeLabel: {
    fontSize: 11,
    color: BioPulseColors.textSecondary,
    fontWeight: '600',
    marginTop: -2,
  },
  riskInfoCol: {
    flex: 1,
    marginLeft: 18,
    gap: 10,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  riskBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  tierStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: BioPulseColors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BioPulseColors.teal,
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  tierSubtitle: {
    fontSize: 11,
    color: BioPulseColors.textSecondary,
  },
  riskSummaryText: {
    fontSize: 12.5,
    color: BioPulseColors.textSecondary,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: BioPulseColors.borderSubtle,
    paddingTop: 10,
  },
  factorsSection: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  factorsList: {
    gap: 8,
  },
  factorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  factorIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FDF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  factorTextCol: {
    flex: 1,
  },
  factorTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  factorDesc: {
    fontSize: 11.5,
    color: BioPulseColors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF7FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFEBF1',
    padding: 12,
    marginBottom: 14,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: BioPulseColors.textSecondary,
    lineHeight: 17,
  },
  nextActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#BBE6ED',
    marginBottom: 16,
  },
  nextActionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  flaskIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E6F8F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nextActionTextCol: {
    flex: 1,
  },
  nextActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BioPulseColors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginTop: 1,
  },
  nextActionDesc: {
    fontSize: 11.5,
    color: BioPulseColors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  ctaWrapper: {
    marginBottom: 12,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#F9CFDE',
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F43F7D',
  },
});
