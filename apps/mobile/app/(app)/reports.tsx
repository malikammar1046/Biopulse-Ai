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
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

interface ReportCardItem {
  id: string;
  category: 'Screening' | 'Lab Reports' | 'Summaries';
  title: string;
  subtitle: string;
  date: string;
  status: 'Completed' | 'Uploaded';
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  route?: string;
}

/**
 * SCREEN 42: REPORTS
 *
 * Strict visual match to Screenshot 42:
 * - Top Header: Back chevron (<), "Reports", "View and manage all your health reports."
 * - Category filter pills: [ All ] (active solid pink), [ Screening ], [ Lab Reports ], [ Summaries ]
 * - 6 Report cards:
 *   1. PCOS Screening Report (Tier 1 Assessment, 12 Mar 2026, Completed, View, >)
 *   2. Hormone Lab Report (Blood Tests, 10 Mar 2026, Completed, View, >)
 *   3. Clinical Summary (AI Generated Summary, 10 Mar 2026, Completed, View, >)
 *   4. Ultrasound Report (Ovarian Ultrasound, 2 Mar 2026, Uploaded, View, >)
 *   5. Lifestyle Progress Report (1 Feb 2026, Completed, View, >)
 *   6. Monthly Summary (Jan 2026, Completed, View, >)
 */
export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { reports, screening } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'All' | 'Screening' | 'Lab Reports' | 'Summaries'>('All');

  const allReports: ReportCardItem[] = useMemo(() => {
    const list: ReportCardItem[] = [];

    // Verified persistent screening assessment
    if (screening.tierStatus && screening.tierStatus !== 'Not Assessed') {
      list.push({
        id: 'rep-screening',
        category: 'Screening',
        title: isFemale ? 'PCOS Screening Report' : 'Hypogonadism Screening Report',
        subtitle: `${screening.tierStatus} (${screening.riskBand})`,
        date: screening.lastAssessedDate || 'Recent Assessment',
        status: 'Completed',
        icon: 'document-text',
        iconBg: '#FFE4E6',
        iconColor: '#E11D48',
        route: '/(app)/screening-explanation',
      });
    }

    // Verified persistent user reports & lab documents
    if (reports && reports.length > 0) {
      reports.forEach((r) => {
        const isLab = r.type === 'Lab';
        const isSummary = r.type === 'Clinical Summary';
        const category: 'Screening' | 'Lab Reports' | 'Summaries' = isLab
          ? 'Lab Reports'
          : isSummary
          ? 'Summaries'
          : 'Screening';

        list.push({
          id: r.id,
          category,
          title: r.title,
          subtitle: (r.tags && r.tags.length > 0 ? r.tags.join(', ') : r.type) || 'Health Record',
          date: r.date,
          status: (r.status === 'Uploaded' ? 'Uploaded' : 'Completed') as 'Completed' | 'Uploaded',
          icon: isLab ? 'flask' : 'document-text',
          iconBg: isLab ? '#E0F2FE' : '#F3E8FF',
          iconColor: isLab ? '#0284C7' : '#8B5CF6',
          route: isLab ? '/(app)/add-labs' : '/(app)/clinical-summary',
        });
      });
    }

    return list;
  }, [screening, reports, isFemale]);

  const displayedReports = useMemo(() => {
    if (activeTab === 'All') return allReports;
    return allReports.filter((r) => r.category === activeTab);
  }, [allReports, activeTab]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSub}>View and manage all your health reports.</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter Pills */}
        <View style={styles.pillsRow}>
          {(['All', 'Screening', 'Lab Reports', 'Summaries'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.catPill, isSelected && styles.catPillActive]}
              >
                <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Reports List */}
        <View style={styles.reportsList}>
          {displayedReports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={42} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No Reports Available</Text>
              <Text style={styles.emptySub}>
                Complete a clinical screening assessment or upload lab results to view generated health reports.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/assessment')}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Start Assessment</Text>
              </Pressable>
            </View>
          ) : (
            displayedReports.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => item.route && router.push(item.route as any)}
                style={({ pressed }) => [styles.reportCard, pressed && styles.cardPressed]}
              >
                {/* Icon Box */}
                <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>

                {/* Meta */}
                <View style={styles.reportMeta}>
                  <Text style={styles.reportTitle}>{item.title}</Text>
                  <Text style={styles.reportSub}>{item.subtitle}</Text>
                  <Text style={styles.reportDate}>{item.date}</Text>
                </View>

                {/* Status and Action */}
                <View style={styles.rightActionCol}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'Completed'
                        ? styles.badgeCompleted
                        : styles.badgeUploaded,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'Completed'
                          ? styles.textCompleted
                          : styles.textUploaded,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>

                  <View style={styles.viewRow}>
                    <View style={styles.viewBtn}>
                      <Text style={styles.viewBtnText}>View</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
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
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitleWrap: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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

  // Pills
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Cards
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportMeta: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reportDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },

  rightActionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeCompleted: {
    backgroundColor: '#ECFDF5',
  },
  badgeUploaded: {
    backgroundColor: '#EFF6FF',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textCompleted: {
    color: '#10B981',
  },
  textUploaded: {
    color: '#0284C7',
  },

  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },

  cardPressed: {
    opacity: 0.88,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
