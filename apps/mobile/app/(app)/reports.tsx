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

  const [activeTab, setActiveTab] = useState<'All' | 'Screening' | 'Lab Reports' | 'Summaries'>('All');

  const allReports: ReportCardItem[] = useMemo(() => [
    {
      id: 'rep-screening',
      category: 'Screening',
      title: isFemale ? 'PCOS Screening Report' : 'Hypogonadism Screening Report',
      subtitle: 'Tier 1 Assessment',
      date: '12 Mar 2026',
      status: 'Completed',
      icon: 'document-text',
      iconBg: '#FFE4E6',
      iconColor: '#E11D48',
      route: '/(app)/screening-explanation',
    },
    {
      id: 'rep-hormone',
      category: 'Lab Reports',
      title: 'Hormone Lab Report',
      subtitle: 'Blood Tests',
      date: '10 Mar 2026',
      status: 'Completed',
      icon: 'flask',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      route: '/(app)/add-labs',
    },
    {
      id: 'rep-summary',
      category: 'Summaries',
      title: 'Clinical Summary',
      subtitle: 'AI Generated Summary',
      date: '10 Mar 2026',
      status: 'Completed',
      icon: 'clipboard',
      iconBg: '#F3E8FF',
      iconColor: '#8B5CF6',
      route: '/(app)/clinical-summary',
    },
    {
      id: 'rep-ultrasound',
      category: 'Lab Reports',
      title: isFemale ? 'Ultrasound Report' : 'Endocrine Ultrasound Report',
      subtitle: isFemale ? 'Ovarian Ultrasound' : 'Scrotal Ultrasound',
      date: '2 Mar 2026',
      status: 'Uploaded',
      icon: 'water',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      route: '/(app)/reports',
    },
    {
      id: 'rep-lifestyle',
      category: 'Summaries',
      title: 'Lifestyle Progress Report',
      subtitle: '1 Feb 2026',
      date: '1 Feb 2026',
      status: 'Completed',
      icon: 'document-text',
      iconBg: '#F3E8FF',
      iconColor: '#8B5CF6',
      route: '/(app)/progress',
    },
    {
      id: 'rep-monthly',
      category: 'Summaries',
      title: 'Monthly Summary',
      subtitle: 'Jan 2026',
      date: 'Jan 2026',
      status: 'Completed',
      icon: 'document-text',
      iconBg: '#F3E8FF',
      iconColor: '#8B5CF6',
      route: '/(app)/progress',
    },
  ], [isFemale]);

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
          {displayedReports.map((item) => (
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
          ))}
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
});
