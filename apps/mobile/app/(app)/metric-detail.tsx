import React, { useState } from 'react';
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
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function MetricDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '180d'>('90d');

  const historyPoints = [
    { date: 'Oct 02', val: isFemale ? '22.1' : '25.9', note: 'Current' },
    { date: 'Sep 15', val: isFemale ? '22.4' : '26.2', note: 'Check-in' },
    { date: 'Aug 30', val: isFemale ? '22.7' : '26.5', note: 'Check-in' },
    { date: 'Aug 01', val: isFemale ? '23.0' : '26.8', note: 'Check-in' },
    { date: 'Jul 04', val: isFemale ? '23.3' : '27.1', note: 'Baseline' },
  ];

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Metric Deep Dive</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Stat Card */}
        <View style={styles.mainCard}>
          <Text style={styles.metricName}>Body Mass Index (BMI)</Text>
          <Text style={styles.metricUnit}>kg/m² • Measured at standard morning state</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValueBig}>{isFemale ? '22.1' : '25.9'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Baseline</Text>
              <Text style={styles.statValueMuted}>{isFemale ? '23.3' : '27.1'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Change</Text>
              <View style={styles.changeBadge}>
                <Ionicons name="arrow-down" size={14} color="#15803D" />
                <Text style={styles.changeText}>-1.2 kg/m²</Text>
              </View>
            </View>
          </View>
        </View>

        {/* What Changed? Clinical Interpretation Card */}
        <View style={styles.whatChangedCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles" size={18} color={themeAccent} />
            <Text style={styles.whatChangedTitle}>What changed?</Text>
          </View>
          <Text style={styles.whatChangedText}>
            {isFemale
              ? 'Your 1.2 kg/m² reduction over 90 days indicates steady visceral fat reduction. In women with PCOS, even a 5% reduction in adiposity significantly enhances insulin receptor sensitivity, lowers ovarian theca androgen secretion, and aids resumption of regular ovulatory cycles.'
              : 'Your visceral fat decrease directly reduces peripheral aromatase enzyme activity. This reduces the conversion of endogenous testosterone into estrogens, preserving circulating free testosterone levels and improving daytime vitality scores.'}
          </Text>
        </View>

        {/* Historical Records Table */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Historical Data Log</Text>
          <View style={styles.logList}>
            {historyPoints.map((pt, i) => (
              <View key={i} style={styles.logItem}>
                <View style={styles.logLeft}>
                  <Text style={styles.logDate}>{pt.date}</Text>
                  <Text style={styles.logNote}>• {pt.note}</Text>
                </View>
                <Text style={styles.logVal}>{pt.val} kg/m²</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Nav */}
      <BioPulseBottomNav activeTab="track" />
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
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  metricName: {
    fontSize: 20,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  metricUnit: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: BioPulseColors.secondaryText,
    marginBottom: 4,
  },
  statValueBig: {
    fontSize: 24,
    fontWeight: '900',
    color: BioPulseColors.navy,
  },
  statValueMuted: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  whatChangedCard: {
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
    marginBottom: 8,
  },
  whatChangedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  whatChangedText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 12,
  },
  logList: {
    gap: 10,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.navy,
  },
  logNote: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
  },
  logVal: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
});
