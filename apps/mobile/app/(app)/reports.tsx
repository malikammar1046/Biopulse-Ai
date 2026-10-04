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

export interface ReportItem {
  id: string;
  title: string;
  category: 'Screening' | 'Clinical Summary' | 'Lab Report';
  date: string;
  status: 'Ready' | 'Verified' | 'Processing';
  size: string;
  route?: string;
}

/**
 * SCREEN 42: Reports
 * 
 * Provides:
 * - Central archive of AI screening assessments, verified clinical summaries, and uploaded labs
 * - Category filter chips: All, Screening, Clinical Summary, Lab Reports
 * - Direct View & Download actions
 * - Pathway-aware branding (PCOS vs Male Hypogonadism)
 */
export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const badgeBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Screening' | 'Clinical Summary' | 'Lab Report'>('All');

  const reports: ReportItem[] = [
    {
      id: 'rep-1',
      title: isFemale ? 'PCOS Longitudinal Clinical Summary' : 'Hypogonadism Clinical Summary',
      category: 'Clinical Summary',
      date: 'Oct 01, 2026',
      status: 'Ready',
      size: '1.4 MB',
      route: '/(app)/clinical-summary',
    },
    {
      id: 'rep-2',
      title: isFemale ? 'Tier 1 Phenotype Risk Assessment' : 'Male ADAM Tier 1 Screening',
      category: 'Screening',
      date: 'Sep 28, 2026',
      status: 'Verified',
      size: '840 KB',
      route: '/(app)/screening-explanation',
    },
    {
      id: 'rep-3',
      title: isFemale ? 'Hormonal Endocrine Lab Panel' : 'Serum Testosterone & Metabolic Panel',
      category: 'Lab Report',
      date: 'Sep 15, 2026',
      status: 'Verified',
      size: '2.1 MB',
      route: '/(app)/add-labs',
    },
    {
      id: 'rep-4',
      title: isFemale ? 'Initial Intake Screening Report' : 'Baseline Andrological Assessment',
      category: 'Screening',
      date: 'Aug 20, 2026',
      status: 'Verified',
      size: '720 KB',
      route: '/(app)/screening',
    },
  ];

  const filteredReports = reports.filter((item) => {
    if (selectedFilter === 'All') return true;
    return item.category === selectedFilter;
  });

  const handleAction = (report: ReportItem) => {
    if (report.route) {
      router.push(report.route as any);
    } else {
      Alert.alert(
        report.title,
        `Document generated on ${report.date} (${report.size}). Encrypted under patient ID.`,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Export PDF',
            onPress: () => router.push('/(app)/clinical-summary'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Health Reports & Records</Text>
        <Pressable
          onPress={() => router.push('/(app)/clinical-summary')}
          style={[styles.exportTopBtn, { backgroundColor: badgeBg }]}
        >
          <Ionicons name="document-text" size={18} color={themeAccent} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {(['All', 'Clinical Summary', 'Screening', 'Lab Report'] as const).map((cat) => {
            const isSel = selectedFilter === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedFilter(cat)}
                style={[
                  styles.filterChip,
                  isSel && {
                    backgroundColor: badgeBg,
                    borderColor: themeAccent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSel && { color: themeAccent, fontWeight: '700' },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Clinician Summary Feature Card */}
        <Pressable
          onPress={() => router.push('/(app)/clinical-summary')}
          style={[styles.featureCard, { borderColor: themeAccent + '40' }]}
        >
          <View style={[styles.featureIconBox, { backgroundColor: badgeBg }]}>
            <Ionicons name="medkit" size={26} color={themeAccent} />
          </View>
          <View style={styles.featureCol}>
            <View style={styles.featureTagRow}>
              <Text style={[styles.featureTag, { color: themeAccent, backgroundColor: badgeBg }]}>
                RECOMMENDED FOR CLINICIAN
              </Text>
            </View>
            <Text style={styles.featureTitle}>Export Complete Clinical Summary</Text>
            <Text style={styles.featureDesc}>
              A comprehensive single-page summary formatted for endocrinologists and gynecologists.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>

        {/* Reports Archive */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>Archived Documents ({filteredReports.length})</Text>

          {filteredReports.map((report) => (
            <Pressable
              key={report.id}
              onPress={() => handleAction(report)}
              style={styles.reportCard}
            >
              <View style={styles.reportRowTop}>
                <View
                  style={[
                    styles.reportIconBox,
                    {
                      backgroundColor:
                        report.category === 'Clinical Summary'
                          ? badgeBg
                          : report.category === 'Screening'
                          ? '#EFF6FF'
                          : '#F3F4F6',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      report.category === 'Clinical Summary'
                        ? 'document-text'
                        : report.category === 'Screening'
                        ? 'shield-checkmark'
                        : 'flask'
                    }
                    size={22}
                    color={
                      report.category === 'Clinical Summary'
                        ? themeAccent
                        : report.category === 'Screening'
                        ? '#2563EB'
                        : '#4B5563'
                    }
                  />
                </View>

                <View style={styles.reportInfoCol}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <View style={styles.reportSubRow}>
                    <Text style={styles.reportDate}>{report.date}</Text>
                    <Text style={styles.reportDot}>•</Text>
                    <Text style={styles.reportSize}>{report.size}</Text>
                  </View>
                </View>

                <View style={styles.statusPill}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={styles.statusText}>{report.status}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.reportRowBottom}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{report.category}</Text>
                </View>

                <View style={styles.actionBtnRow}>
                  <Pressable
                    onPress={() => handleAction(report)}
                    style={[styles.viewBtn, { backgroundColor: badgeBg }]}
                  >
                    <Ionicons name="eye-outline" size={14} color={themeAccent} />
                    <Text style={[styles.viewBtnText, { color: themeAccent }]}>View</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        'Download PDF',
                        `Preparing encrypted download for ${report.title}...`
                      );
                    }}
                    style={styles.downloadIconBtn}
                  >
                    <Ionicons name="download-outline" size={16} color="#64748B" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
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
  exportTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  filterChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCol: {
    flex: 1,
  },
  featureTagRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  featureTag: {
    fontSize: 9.5,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  featureDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  listSection: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginLeft: 4,
    marginBottom: 4,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  reportRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfoCol: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  reportSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  reportDate: {
    fontSize: 11.5,
    color: '#64748B',
  },
  reportDot: {
    fontSize: 11.5,
    color: '#CBD5E1',
  },
  reportSize: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  reportRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  downloadIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
