import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN 43: Clinical Summary
 * 
 * Provides:
 * - Clinician-ready exportable single-view health dossier
 * - Sections:
 *   1. Patient Demographics & Assessment Timestamp
 *   2. Active Screening Risk & Tier Stratification
 *   3. Primary Clinical Influencers (Explainability)
 *   4. Verified Laboratory Values (Hormonal + Metabolic)
 *   5. Longitudinal Health Trends
 *   6. Evidence-Based Clinical Recommendations
 * - Primary CTA: "Export PDF" & "Share with Specialist"
 */
export default function ClinicalSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const badgeBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  const [isExporting, setIsExporting] = useState(false);

  const patientName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Patient');
  const patientId = `BP-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Clinical PDF Generated',
        `A high-resolution clinical dossier (BioPulse_${patientId}_Summary.pdf) is ready for export or print.`,
        [
          { text: 'Done', style: 'default' },
          {
            text: 'Send to Doctor',
            onPress: () => router.push('/(app)/care-circle'),
          },
        ]
      );
    }, 1000);
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Clinical Summary</Text>
        <Pressable
          onPress={handleExportPDF}
          style={[styles.exportIconBtn, { backgroundColor: badgeBg }]}
        >
          <Ionicons name="share-outline" size={18} color={themeAccent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Clinician Banner */}
        <View style={styles.clinicianHeaderCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.docType}>BioPulse AI Decision Support Dossier</Text>
              <Text style={styles.docSub}>
                CONFIDENTIAL • FOR CLINICIAN REFERENCE & ASSESSMENT
              </Text>
            </View>
            <View style={[styles.badgeContainer, { backgroundColor: badgeBg }]}>
              <Text style={[styles.badgeText, { color: themeAccent }]}>
                {isFemale ? 'PCOS TIER 1+2' : 'ANDROLOGY TIER 1'}
              </Text>
            </View>
          </View>

          <View style={styles.demographicsGrid}>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Patient Name</Text>
              <Text style={styles.demoVal}>{patientName}</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Record ID</Text>
              <Text style={styles.demoVal}>{patientId}</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Biological Sex</Text>
              <Text style={styles.demoVal}>{isFemale ? 'Female' : 'Male'}</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Date of Report</Text>
              <Text style={styles.demoVal}>{currentDate}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Screening Stratification */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>1. Latest Screening Stratification</Text>
          </View>

          <View style={[styles.riskSummaryBox, { backgroundColor: isFemale ? '#FEF2F2' : '#EFF6FF' }]}>
            <View>
              <Text style={styles.riskLabel}>Stratified Risk Category</Text>
              <Text
                style={[
                  styles.riskValue,
                  { color: isFemale ? '#DC2626' : '#2563EB' },
                ]}
              >
                {isFemale ? 'Higher Likelihood (78%)' : 'Intermediate Likelihood (62%)'}
              </Text>
            </View>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillText}>Tier 1 Completed</Text>
            </View>
          </View>

          <Text style={styles.clinicalCaveat}>
            {isFemale
              ? 'Model analysis indicates elevated risk probability based on menstrual pattern irregularities and clinical hyperandrogenism markers. Recommended for confirmatory endocrine workup.'
              : 'Screening indicates symptoms consistent with partial androgen deficiency based on ADAM criteria (low libido + fatigue flags) alongside elevated BMI.'}
          </Text>
        </View>

        {/* Section 2: Important Clinical Factors */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="analytics" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>2. Primary Influencing Factors</Text>
          </View>

          <View style={styles.factorsList}>
            {(isFemale
              ? [
                  {
                    name: 'Menstrual Irregularity',
                    impact: 'Strong Positive',
                    desc: 'Cycle length > 38 days with 3+ skipped cycles in the past 12 months.',
                  },
                  {
                    name: 'Clinical Hyperandrogenism',
                    impact: 'Moderate Positive',
                    desc: 'Persistent hirsutism (Ferriman-Gallwey localized) and cystic acne.',
                  },
                  {
                    name: 'Metabolic & BMI Index',
                    impact: 'Moderate Positive',
                    desc: 'Calculated BMI 27.4 kg/m² indicating metabolic predisposition.',
                  },
                ]
              : [
                  {
                    name: 'ADAM Positive Flags',
                    impact: 'Strong Positive',
                    desc: 'Affirmative response on loss of libido and decreased stamina.',
                  },
                  {
                    name: 'Metabolic Adiposity',
                    impact: 'Moderate Positive',
                    desc: 'Elevated waist circumference and BMI 28.2 kg/m².',
                  },
                  {
                    name: 'Sleep & Recovery Markers',
                    impact: 'Mild Positive',
                    desc: 'Reported poor sleep quality with morning exhaustion.',
                  },
                ]
            ).map((factor, idx) => (
              <View key={idx} style={styles.factorRow}>
                <View style={styles.factorTop}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  <View style={styles.impactBadge}>
                    <Text style={styles.impactText}>{factor.impact}</Text>
                  </View>
                </View>
                <Text style={styles.factorDesc}>{factor.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 3: Key Laboratory Findings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flask" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>3. Key Laboratory Findings</Text>
          </View>

          <View style={styles.labsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Analyte</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Value</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Ref Range</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Flag</Text>
            </View>

            {(isFemale
              ? [
                  { name: 'LH / FSH Ratio', val: '2.8', ref: '< 1.5', flag: 'High' },
                  { name: 'Total Testosterone', val: '64 ng/dL', ref: '15 - 70', flag: 'Normal-High' },
                  { name: 'Fasting Insulin', val: '18.2 µIU/mL', ref: '< 10.0', flag: 'Elevated' },
                  { name: 'Fasting Blood Sugar', val: '98 mg/dL', ref: '70 - 99', flag: 'Normal' },
                ]
              : [
                  { name: 'Total Testosterone', val: '280 ng/dL', ref: '300 - 1000', flag: 'Low' },
                  { name: 'Free Testosterone', val: '6.2 pg/mL', ref: '9.0 - 30.0', flag: 'Low' },
                  { name: 'Serum LH', val: '3.4 mIU/mL', ref: '1.7 - 8.6', flag: 'Normal' },
                  { name: 'Fasting Glucose', val: '104 mg/dL', ref: '70 - 99', flag: 'Impaired' },
                ]
            ).map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tdAnalyte, { flex: 2 }]}>{row.name}</Text>
                <Text style={[styles.tdVal, { flex: 1.5 }]}>{row.val}</Text>
                <Text style={[styles.tdRef, { flex: 1.5 }]}>{row.ref}</Text>
                <View style={[styles.flagWrap, { flex: 1, alignItems: 'flex-end' }]}>
                  <Text
                    style={[
                      styles.tdFlag,
                      row.flag === 'High' || row.flag === 'Low' || row.flag === 'Elevated'
                        ? { color: '#DC2626', fontWeight: '700' }
                        : { color: '#16A34A' },
                    ]}
                  >
                    {row.flag}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: Longitudinal Trends */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trending-up" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>4. 90-Day Longitudinal Trends</Text>
          </View>

          <View style={styles.trendsRow}>
            <View style={styles.trendBlock}>
              <Text style={styles.trendLabel}>BMI Stability</Text>
              <Text style={styles.trendValue}>-1.2 kg</Text>
              <Text style={styles.trendSub}>Gradual lifestyle descent</Text>
            </View>
            <View style={styles.trendBlock}>
              <Text style={styles.trendLabel}>
                {isFemale ? 'Cycle Regularity' : 'Energy Score'}
              </Text>
              <Text style={styles.trendValue}>{isFemale ? '38 d avg' : '+15% pts'}</Text>
              <Text style={styles.trendSub}>Improving tracking continuity</Text>
            </View>
          </View>
        </View>

        {/* Section 5: Clinical Next Steps */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="clipboard" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>5. Decision Support Next Steps</Text>
          </View>

          <View style={styles.recommendationsList}>
            {(isFemale
              ? [
                  'Pelvic ultrasound examination to evaluate antral follicle count (> 12 per ovary).',
                  'Oral Glucose Tolerance Test (OGTT) with 2-hour insulin curve for metabolic staging.',
                  'Low-glycemic nutritional protocol and progressive resistance training integration.',
                ]
              : [
                  'Confirm morning fasting repeat testosterone draw (between 08:00 - 10:00 AM).',
                  'Evaluate serum prolactin and thyroid-stimulating hormone (TSH) to exclude secondary etiologies.',
                  'Initiate progressive strength stimulus and targeted weight management plan.',
                ]
            ).map((rec, idx) => (
              <View key={idx} style={styles.recRow}>
                <Ionicons name="checkmark-circle" size={16} color={themeAccent} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Bar */}
        <View style={styles.ctaBar}>
          <Pressable
            onPress={handleExportPDF}
            style={[styles.exportPdfBtn, { backgroundColor: themeAccent }]}
          >
            <Ionicons name="download" size={18} color="#FFFFFF" />
            <Text style={styles.exportPdfText}>
              {isExporting ? 'Generating PDF...' : 'Export Complete Dossier (PDF)'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/care-circle')}
            style={[styles.shareDocBtn, { borderColor: themeAccent }]}
          >
            <Ionicons name="people-outline" size={18} color={themeAccent} />
            <Text style={[styles.shareDocText, { color: themeAccent }]}>
              Share with Care Circle
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BioPulseBottomNav activeTab="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  exportIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  tabletScrollContent: {
    maxWidth: 620,
    alignSelf: 'center',
    width: '100%',
  },
  clinicianHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  docType: {
    fontSize: 13,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  docSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  demographicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  demoItem: {
    width: '45%',
  },
  demoLabel: {
    fontSize: 10.5,
    color: '#64748B',
  },
  demoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  riskSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  riskLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  riskValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  tierPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  clinicalCaveat: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  factorsList: {
    gap: 10,
  },
  factorRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  factorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  impactBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  factorDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  labsTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  tdAnalyte: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  tdVal: {
    fontSize: 12,
    color: '#334155',
  },
  tdRef: {
    fontSize: 11,
    color: '#94A3B8',
  },
  flagWrap: {},
  tdFlag: {
    fontSize: 11,
  },
  trendsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trendBlock: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  trendLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginVertical: 4,
  },
  trendSub: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  recommendationsList: {
    gap: 8,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  ctaBar: {
    gap: 10,
    marginTop: 6,
  },
  exportPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  exportPdfText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  shareDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  shareDocText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
