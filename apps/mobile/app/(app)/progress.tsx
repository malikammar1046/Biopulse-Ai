import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { SadCloudIllustration } from '../../components/ui/StateIllustrations';

interface ProgressMetricDef {
  id: string;
  metricKey: string;
  title: string;
  value: string;
  changeValue: string;
  changeSuffix: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  sparklineColor: string;
  points: number[]; // normalized heights 0-100
}

/**
 * Pure React Native Sparkline Line Renderer
 */
function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  const width = 84;
  const height = 30;

  // Generate segments connecting points
  const segments = useMemo(() => {
    if (points.length < 2) return [];
    const stepX = width / (points.length - 1);
    const result: { x: number; y: number; length: number; angle: number }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const x1 = i * stepX;
      // Invert Y so 100 is at top
      const y1 = height - (points[i] / 100) * height;
      const x2 = (i + 1) * stepX;
      const y2 = height - (points[i + 1] / 100) * height;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      result.push({
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
        length,
        angle,
      });
    }
    return result;
  }, [points]);

  const lastPoint = points[points.length - 1];
  const lastY = height - (lastPoint / 100) * height;

  return (
    <View style={{ width, height, position: 'relative' }}>
      {segments.map((seg, idx) => (
        <View
          key={idx}
          style={{
            position: 'absolute',
            left: seg.x - seg.length / 2,
            top: seg.y - 1,
            width: seg.length,
            height: 2,
            backgroundColor: color,
            borderRadius: 1,
            transform: [{ rotate: `${seg.angle}deg` }],
          }}
        />
      ))}
      {/* End Point Marker */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: lastY - 2.5,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/**
 * SCREEN 32: PROGRESS OVERVIEW
 *
 * Strict visual match to Screenshot 32:
 * - Header: Back chevron (<), centered "Your Progress", right "Last 3 Months ⌵" filter pill
 * - Segmented Tabs: [ Overview ] (active soft blue pill), [ Records ]
 * - 4 Metric Cards (one chart per section, clean & uncluttered):
 *   1. Testosterone (Total T) (or Cycle Regularity for female)
 *   2. Weight / BMI
 *   3. Energy & Symptoms
 *   4. Screening History
 * - Each card has:
 *   - Category Icon box
 *   - Title, Main value & % change pill
 *   - Mini sparkline curve
 *   - "Last updated DD Mon YYYY"
 *   - Chevron > to navigate to Metric Detail Screen (Screen 33)
 */
export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { profile, screening, cycle } = useHealthStore();

  const searchParams = useLocalSearchParams<{ error?: string }>();
  const [hasError, setHasError] = useState(searchParams.error === 'true');
  const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview');
  const [selectedRange, setSelectedRange] = useState('Last 3 Months');

  const maleMetrics: ProgressMetricDef[] = useMemo(() => [
    {
      id: 'm-testosterone',
      metricKey: 'testosterone',
      title: 'Testosterone (Total T)',
      value: '320 ng/dL',
      changeValue: '↑ 18%',
      changeSuffix: 'vs previous',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: '12 Mar 2026',
      icon: 'bar-chart',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      sparklineColor: '#0284C7',
      points: [25, 30, 28, 45, 60, 58, 80],
    },
    {
      id: 'm-weight',
      metricKey: 'weight',
      title: 'Weight / BMI',
      value: `${profile.weightKg || 76} kg`,
      changeValue: '↓ 3%',
      changeSuffix: 'vs previous',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: '10 Mar 2026',
      icon: 'scale-outline',
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
      sparklineColor: '#38BDF8',
      points: [75, 70, 72, 60, 50, 48, 40],
    },
    {
      id: 'm-energy',
      metricKey: 'symptoms',
      title: 'Energy & Symptoms',
      value: 'Improving',
      changeValue: '↑ 25%',
      changeSuffix: 'vs previous',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: '12 Mar 2026',
      icon: 'flash',
      iconBg: '#FFE4E6',
      iconColor: '#EC4899',
      sparklineColor: '#EC4899',
      points: [20, 25, 35, 42, 58, 65, 82],
    },
    {
      id: 'm-screening',
      metricKey: 'screening',
      title: 'Screening History',
      value: `${screening.probabilityPercent || 38}%`,
      changeValue: '↓ 12%',
      changeSuffix: 'vs previous',
      lastUpdatedLabel: 'Last assessed',
      lastUpdated: '12 Mar 2026',
      icon: 'shield-checkmark',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      sparklineColor: '#FB7185',
      points: [80, 70, 65, 52, 48, 42, 35],
    },
  ], [profile.weightKg, screening.probabilityPercent]);

  const femaleMetrics: ProgressMetricDef[] = useMemo(() => [
    {
      id: 'f-cycle',
      metricKey: 'cycle',
      title: 'Cycle Regularity',
      value: `${cycle.cycleLength || 28} Days`,
      changeValue: '↑ Regular',
      changeSuffix: 'vs previous',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: '14 Sep 2026',
      icon: 'calendar',
      iconBg: '#FDF2F8',
      iconColor: '#F43F7D',
      sparklineColor: '#F43F7D',
      points: [30, 40, 55, 60, 70, 75, 85],
    },
    {
      id: 'f-weight',
      metricKey: 'weight',
      title: 'Weight / BMI',
      value: `${profile.weightKg || 64} kg`,
      changeValue: '↓ 2%',
      changeSuffix: 'vs previous',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: '10 Sep 2026',
      icon: 'scale-outline',
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
      sparklineColor: '#38BDF8',
      points: [75, 70, 68, 62, 58, 54, 48],
    },
    {
      id: 'f-symptoms',
      metricKey: 'symptoms',
      title: 'Symptom Severity',
      value: '2.1 / 10',
      changeValue: '↓ 62%',
      changeSuffix: 'vs baseline',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: '10 Sep 2026',
      icon: 'flash',
      iconBg: '#FFE4E6',
      iconColor: '#EC4899',
      sparklineColor: '#FB7185',
      points: [90, 80, 75, 60, 45, 30, 20],
    },
    {
      id: 'f-screening',
      metricKey: 'screening',
      title: 'Screening History',
      value: `${screening.probabilityPercent || 24}%`,
      changeValue: '↓ 15%',
      changeSuffix: 'vs previous',
      lastUpdatedLabel: 'Last assessed',
      lastUpdated: '12 Sep 2026',
      icon: 'shield-checkmark',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      sparklineColor: '#38BDF8',
      points: [80, 65, 60, 50, 40, 32, 24],
    },
  ], [cycle.cycleLength, profile.weightKg, screening.probabilityPercent]);

   const activeMetrics = isFemale ? femaleMetrics : maleMetrics;

  if (hasError) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <BioPulseBackground />

        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBtn}
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>

          <Text style={styles.headerTitle}>Progress</Text>

          <Pressable
            onPress={() => setHasError(false)}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Ionicons name="close-circle-outline" size={20} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO ERROR CARD */}
          <View style={styles.heroErrorCard}>
            <SadCloudIllustration size={160} />

            <Text style={styles.heroErrorTitle}>We couldn't load your progress</Text>
            <Text style={styles.heroErrorDesc}>
              Your saved data is safe. This might be due to a slow connection or a temporary server issue.
            </Text>

            {/* CTA 1: Retry */}
            <Pressable
              onPress={() => setHasError(false)}
              style={styles.heroRetryBtn}
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroRetryBtnText}>Retry</Text>
            </Pressable>

            {/* CTA 2: Check Connection */}
            <Pressable
              onPress={() => {
                Alert.alert('Connection Status', 'Wi-Fi & Cellular signal are active.');
              }}
              style={styles.heroCheckConnBtn}
              accessibilityRole="button"
            >
              <Ionicons name="wifi-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.heroCheckConnBtnText}>Check Connection</Text>
            </Pressable>
          </View>

          {/* HELP CARD */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeaderRow}>
              <View style={styles.helpIconCircle}>
                <Ionicons name="information" size={16} color="#0284C7" />
              </View>
              <Text style={styles.helpTitle}>If the problem continues:</Text>
            </View>

            <View style={styles.helpBulletsCol}>
              <View style={styles.helpBulletRow}>
                <Text style={styles.helpBulletDot}>•</Text>
                <Text style={styles.helpBulletText}>Make sure you have an active internet connection.</Text>
              </View>
              <View style={styles.helpBulletRow}>
                <Text style={styles.helpBulletDot}>•</Text>
                <Text style={styles.helpBulletText}>Try again in a few minutes.</Text>
              </View>
              <View style={styles.helpBulletRow}>
                <Text style={styles.helpBulletDot}>•</Text>
                <Text style={styles.helpBulletText}>Contact support if the issue persists.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <Text style={styles.headerTitle}>Your Progress</Text>

        {/* Filter Dropdown Pill */}
        <Pressable
          onPress={() => {
            setSelectedRange((prev) =>
              prev === 'Last 3 Months' ? 'Last 6 Months' : prev === 'Last 6 Months' ? 'Last 1 Year' : 'Last 3 Months'
            );
          }}
          style={styles.filterPill}
          hitSlop={6}
        >
          <Text style={styles.filterText}>{selectedRange}</Text>
          <Ionicons name="chevron-down" size={12} color="#64748B" style={{ marginLeft: 3 }} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('overview')}
            style={[styles.tabPill, activeTab === 'overview' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('records')}
            style={[styles.tabPill, activeTab === 'records' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
              Records
            </Text>
          </Pressable>
        </View>

        {/* 4 Metric Cards */}
        <View style={styles.cardsList}>
          {activeMetrics.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/(app)/metric-detail?metric=${item.metricKey}` as any)}
              style={({ pressed }) => [
                styles.metricCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardMain}>
                {/* Left Column: Icon, Title, Value, Change */}
                <View style={styles.leftCol}>
                  <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>

                  <Text style={styles.metricTitle}>{item.title}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>

                  <View style={styles.changeRow}>
                    <Text style={styles.changeVal}>{item.changeValue}</Text>
                    <Text style={styles.changeSuffix}> {item.changeSuffix}</Text>
                  </View>
                </View>

                {/* Middle: Sparkline */}
                <View style={styles.sparkCol}>
                  <MiniSparkline points={item.points} color={item.sparklineColor} />
                </View>

                {/* Right Column: Chevron, Date */}
                <View style={styles.rightCol}>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={styles.chevron} />

                  <Text style={styles.lastUpdatedText}>
                    {item.lastUpdatedLabel}{'\n'}{item.lastUpdated}
                  </Text>
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
    paddingBottom: 10,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Segmented Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 3,
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: '#BAE6FD',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },

  // Metric Cards
  cardsList: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1.1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  changeVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  changeSuffix: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  sparkCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  rightCol: {
    width: 90,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 78,
  },
  chevron: {
    alignSelf: 'flex-end',
  },
  lastUpdatedText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    lineHeight: 14,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  // Progress In-Context Error Screen Styles (Screen 48 Bottom Right)
  heroErrorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  heroErrorTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroErrorDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
    marginBottom: 18,
  },
  heroRetryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroRetryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroCheckConnBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCheckConnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
  },
  helpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  helpIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpBulletsCol: {
    gap: 6,
    paddingLeft: 4,
  },
  helpBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  helpBulletDot: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 16,
  },
  helpBulletText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },
});
