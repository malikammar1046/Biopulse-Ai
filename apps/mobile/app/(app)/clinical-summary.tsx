import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

/**
 * SCREEN 43: CLINICAL SUMMARY
 *
 * Strict visual match to Screenshot 43:
 * - Top Header: Back chevron (<), centered "Clinical Summary", "Generated on 12 Mar 2026", right "Share" icon
 * - Section 1: Latest Screening Result Card
 *   - Circular ring progress with "72%"
 *   - "↑ Higher Risk", "PCOS Screening – Tier 1", "12 Mar 2026"
 * - Section 2: Important Factors
 *   - "View All" link
 *   - Irregular Cycle -> ↑ Increased risk
 *   - Excess Hair Growth -> ↑ Increased risk
 *   - Higher BMI -> ↑ Increased risk
 * - Section 3: Latest Lab Results
 *   - "View All" link
 *   - FSH: 6.2 mIU/mL [ Normal ]
 *   - LH: 8.1 mIU/mL [ Normal ]
 *   - AMH: 4.3 ng/mL [ Slightly High ]
 * - Section 4: Trends Summary & Current Recommendations rows
 * - Bottom CTA: Solid pink "[ 📄 Export PDF ]" button
 */
export default function ClinicalSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { screening } = useHealthStore();

  const [isExporting, setIsExporting] = useState(false);

  const probPercent = screening.probabilityPercent || 72;
  const riskTitle = screening.riskBand || (isFemale ? 'Higher Risk' : 'Intermediate Risk');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `BioPulse Clinical Summary - Patient Screening Risk: ${probPercent}% (${riskTitle}). Generated on 12 Mar 2026.`,
        title: 'BioPulse Clinical Health Summary',
      });
    } catch (e) {
      // ignore
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Export Successful',
        'Clinical Dossier (BioPulse_Clinical_Summary_12Mar2026.pdf) generated successfully. Ready to print or share with your physician.'
      );
    }, 500);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Clinical Summary</Text>
          <Text style={styles.headerSub}>Generated on 12 Mar 2026</Text>
        </View>

        <Pressable
          onPress={handleShare}
          style={styles.shareBtn}
          hitSlop={8}
        >
          <Ionicons name="share-outline" size={18} color="#0F172A" />
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Latest Screening Result Card */}
        <View style={styles.screeningCard}>
          <Text style={styles.screeningCardLabel}>Latest Screening Result</Text>

          <View style={styles.screeningCardBody}>
            {/* Circular Ring Gauge */}
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringVal}>72%</Text>
              </View>
            </View>

            {/* Screening Meta */}
            <View style={styles.screeningMeta}>
              <View style={styles.riskRow}>
                <Ionicons name="arrow-up" size={14} color="#E11D48" />
                <Text style={styles.riskTitle}>Higher Risk</Text>
              </View>
              <Text style={styles.screeningTier}>
                {isFemale ? 'PCOS Screening – Tier 1' : 'Hypogonadism Screening – Tier 1'}
              </Text>
              <Text style={styles.screeningDate}>12 Mar 2026</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Important Factors */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Important Factors</Text>
            <Pressable onPress={() => router.push('/(app)/screening-explanation' as any)} hitSlop={6}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.factorsCard}>
            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <View style={styles.factorIconBox}>
                  <Ionicons name="pulse-outline" size={16} color="#E11D48" />
                </View>
                <Text style={styles.factorName}>Irregular Cycle</Text>
              </View>
              <View style={styles.factorRiskBadge}>
                <Ionicons name="arrow-up" size={12} color="#E11D48" />
                <Text style={styles.factorRiskText}>Increased risk</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <View style={styles.factorIconBox}>
                  <Ionicons name="body-outline" size={16} color="#E11D48" />
                </View>
                <Text style={styles.factorName}>Excess Hair Growth</Text>
              </View>
              <View style={styles.factorRiskBadge}>
                <Ionicons name="arrow-up" size={12} color="#E11D48" />
                <Text style={styles.factorRiskText}>Increased risk</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <View style={styles.factorIconBox}>
                  <Ionicons name="scale-outline" size={16} color="#E11D48" />
                </View>
                <Text style={styles.factorName}>Higher BMI</Text>
              </View>
              <View style={styles.factorRiskBadge}>
                <Ionicons name="arrow-up" size={12} color="#E11D48" />
                <Text style={styles.factorRiskText}>Increased risk</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: Latest Lab Results */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Latest Lab Results</Text>
            <Pressable onPress={() => router.push('/(app)/add-labs' as any)} hitSlop={6}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.labsCard}>
            <View style={styles.labRow}>
              <Text style={styles.labName}>FSH</Text>
              <Text style={styles.labVal}>6.2 mIU/mL</Text>
              <View style={styles.labBadgeNormal}>
                <Text style={styles.labBadgeNormalText}>Normal</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.labRow}>
              <Text style={styles.labName}>LH</Text>
              <Text style={styles.labVal}>8.1 mIU/mL</Text>
              <View style={styles.labBadgeNormal}>
                <Text style={styles.labBadgeNormalText}>Normal</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.labRow}>
              <Text style={styles.labName}>AMH</Text>
              <Text style={styles.labVal}>4.3 ng/mL</Text>
              <View style={styles.labBadgeWarning}>
                <Text style={styles.labBadgeWarningText}>Slightly High</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: Nav Rows */}
        <View style={styles.navRowsWrap}>
          <Pressable
            onPress={() => router.push('/(app)/progress' as any)}
            style={({ pressed }) => [styles.navRowCard, pressed && styles.cardPressed]}
          >
            <View style={styles.navRowLeft}>
              <View style={styles.navIconBox}>
                <Ionicons name="time-outline" size={16} color="#E11D48" />
              </View>
              <Text style={styles.navRowTitle}>Trends Summary</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/recommendations' as any)}
            style={({ pressed }) => [styles.navRowCard, pressed && styles.cardPressed]}
          >
            <View style={styles.navRowLeft}>
              <View style={styles.navIconBox}>
                <Ionicons name="bulb-outline" size={16} color="#E11D48" />
              </View>
              <Text style={styles.navRowTitle}>Current Recommendations</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Export PDF CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={handleExportPDF}
          style={({ pressed }) => [styles.exportBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.exportBtnText}>
            {isExporting ? 'Generating PDF...' : 'Export PDF'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Screening Card
  screeningCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  screeningCardLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  screeningCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#FFFFFF',
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  screeningMeta: {
    flex: 1,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  riskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  screeningTier: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  screeningDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Section
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },

  // Factors Card
  factorsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  factorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  factorIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  factorRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  factorRiskText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E11D48',
  },

  // Labs Card
  labsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  labName: {
    width: 50,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  labVal: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
  },
  labBadgeNormal: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  labBadgeNormalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  labBadgeWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  labBadgeWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 6,
  },

  // Nav rows
  navRowsWrap: {
    gap: 8,
  },
  navRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Bottom Export Button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  exportBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  btnPressed: {
    opacity: 0.85,
  },
  cardPressed: {
    opacity: 0.9,
  },
});
