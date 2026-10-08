import React, { useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import { PathwayHeader } from '../components/onboarding';
import { useMaleOnboarding } from '../features/onboarding';
import { useHealthStore } from '../store';
import { resolveRiskBand } from '../services/assessmentService';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../components/navigation';

export default function MaleScreeningResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { activeAssessment, calculateAdamScore } = useMaleOnboarding();
  const { updateProfile, screening } = useHealthStore();
  const adamSummary = calculateAdamScore();

  const hasAssessment = Boolean(activeAssessment || (screening.tierStatus && screening.tierStatus !== 'Not Assessed'));

  const probability = activeAssessment?.probability ?? (screening.probabilityPercent ? screening.probabilityPercent / 100 : 0);
  const probPercent = activeAssessment?.probability_percent ??
    (activeAssessment ? Math.round((activeAssessment.probability ?? 0) * 100) : screening.probabilityPercent);

  const band = resolveRiskBand(probability, activeAssessment?.risk_category || screening.riskCategory, activeAssessment?.threshold || 0.45);
  const riskCategory = band.category;

  const riskBadgeConfig = useMemo(() => {
    switch (riskCategory) {
      case 'higher':
        return {
          label: 'Higher Screening Risk',
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#B91C1C',
          icon: 'alert-circle-outline' as const,
        };
      case 'intermediate':
        return {
          label: 'Intermediate Screening Risk',
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#D97706',
          icon: 'help-circle-outline' as const,
        };
      default:
        return {
          label: 'Lower Screening Risk',
          bg: '#F0FDF4',
          border: '#BBF7D0',
          text: '#15803D',
          icon: 'checkmark-circle-outline' as const,
        };
    }
  }, [riskCategory]);

  const factors = useMemo(() => {
    if (activeAssessment?.explanations && activeAssessment.explanations.length > 0) {
      return activeAssessment.explanations.slice(0, 3);
    }
    return [
      {
        feature_name: 'ADAM Symptom Profile',
        patient_label: `${adamSummary.score}/10 affirmative`,
        direction: adamSummary.isPositive ? 'increases_risk' : 'decreases_risk',
        description: 'Meets clinical screening threshold for late-onset androgen deficiency symptoms.',
      },
      {
        feature_name: 'Metabolic & BMI Factor',
        patient_label: 'Visceral index',
        direction: 'neutral',
        description: 'Visceral adiposity modulates peripheral aromatase and sex hormone-binding globulin.',
      },
      {
        feature_name: 'REM Sleep & Rest Pattern',
        patient_label: 'Circadian cycle',
        direction: 'decreases_risk',
        description: 'Adequate sleep preserves nocturnal LH pulsatility and morning testosterone surge.',
      },
    ];
  }, [activeAssessment, adamSummary]);

  const handleGoHome = useCallback(() => {
    updateProfile({ isOnboarded: true });
    router.replace('/(app)');
  }, [updateProfile, router]);

  const handleViewExplanation = useCallback(() => {
    router.push('/(app)/screening-explanation');
  }, [router]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Pathway Header */}
      <View style={{ paddingTop: Math.max(insets.top, 10) }}>
        <PathwayHeader
          onBack={handleGoHome}
          subtitle="MEN'S HEALTH INTELLIGENCE"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk Probability Card */}
        <View style={styles.resultCard}>
          <View style={[styles.badgePill, { backgroundColor: riskBadgeConfig.bg, borderColor: riskBadgeConfig.border }]}>
            <Ionicons name={riskBadgeConfig.icon} size={16} color={riskBadgeConfig.text} />
            <Text style={[styles.badgeText, { color: riskBadgeConfig.text }]}>
              {riskBadgeConfig.label}
            </Text>
          </View>

          <View style={styles.gaugeContainer}>
            <Text style={styles.probPercentText}>{probPercent}%</Text>
            <Text style={styles.probSubtext}>Estimated Screening Likelihood</Text>
          </View>

          {/* Progress Bar Gauge */}
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${probPercent}%`,
                  backgroundColor: riskCategory === 'higher' ? '#DC2626' : riskCategory === 'intermediate' ? '#F59E0B' : '#10B981',
                },
              ]}
            />
          </View>

          <Text style={styles.disclaimerText}>
            BioPulse AI provides algorithmic screening risk stratification based on clinical guidelines. This is not a formal medical diagnosis.
          </Text>
        </View>

        {/* Top 3 Contributing Factors */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles-outline" size={18} color={BioPulseColors.malePrimary} />
            <Text style={styles.sectionTitle}>What influenced your result?</Text>
          </View>
          <Text style={styles.sectionSub}>Top clinical drivers evaluated by the model:</Text>

          <View style={styles.factorsList}>
            {factors.map((f, i) => (
              <View key={i} style={styles.factorItem}>
                <View style={styles.factorHeaderRow}>
                  <Text style={styles.factorName}>{f.feature_name}</Text>
                  <View
                    style={[
                      styles.directionTag,
                      {
                        backgroundColor:
                          f.direction === 'increases_risk'
                            ? '#FEF2F2'
                            : f.direction === 'decreases_risk'
                            ? '#F0FDF4'
                            : '#F1F5F9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.directionText,
                        {
                          color:
                            f.direction === 'increases_risk'
                              ? '#B91C1C'
                              : f.direction === 'decreases_risk'
                              ? '#15803D'
                              : '#64748B',
                        },
                      ]}
                    >
                      {f.direction === 'increases_risk' ? '↑ Higher impact' : '↓ Protective'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.factorDesc}>{f.description}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={handleViewExplanation} style={styles.seeAllBtn}>
            <Text style={styles.seeAllBtnText}>See detailed factor breakdown</Text>
            <Ionicons name="chevron-forward" size={16} color={BioPulseColors.malePrimary} />
          </Pressable>
        </View>

        {/* Next Best Action Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="flask-outline" size={22} color={BioPulseColors.malePrimary} />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionTag}>RECOMMENDED NEXT STEP</Text>
            <Text style={styles.actionTitle}>Add Clinical Lab Biomarkers (Tier 2)</Text>
            <Text style={styles.actionDesc}>
              A fasting morning total and free testosterone blood test confirms diagnostic status and rules out secondary endocrine causes.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsWrap}>
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Text style={styles.primaryBtnText}>Go to Male Dashboard</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/add-labs')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
          >
            <Ionicons name="add-circle-outline" size={18} color={BioPulseColors.malePrimary} />
            <Text style={styles.secondaryBtnText}>Upload or Enter Lab Results</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Permanent Bottom Nav */}
      <BioPulseBottomNav activeTab="screening" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  probPercentText: {
    fontSize: 48,
    fontWeight: '900',
    color: BioPulseColors.navy,
  },
  probSubtext: {
    fontSize: 13,
    color: BioPulseColors.secondaryText,
    marginTop: 2,
  },
  gaugeTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  sectionSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginBottom: 12,
  },
  factorsList: {
    gap: 10,
  },
  factorItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  factorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
    color: BioPulseColors.navy,
  },
  directionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  directionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  factorDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
  },
  seeAllBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.malePrimary,
  },
  actionCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContent: {
    flex: 1,
  },
  actionTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  buttonsWrap: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: BioPulseColors.malePrimary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BioPulseColors.malePrimary,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnPressed: {
    backgroundColor: '#F8FAFC',
  },
  secondaryBtnText: {
    color: BioPulseColors.malePrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
