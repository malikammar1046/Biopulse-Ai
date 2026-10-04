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

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const [period, setPeriod] = useState<'30d' | '90d' | '1y'>('90d');

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Longitudinal Health Progress</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Period Filter Buttons */}
      <View style={styles.periodRow}>
        {(['30d', '90d', '1y'] as const).map((p) => {
          const isSelected = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, isSelected && { backgroundColor: themeAccent }]}
            >
              <Text style={[styles.periodText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                {p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trend 1: Screening Risk Probability Trajectory */}
        <Pressable
          onPress={() => router.push('/(app)/metric-detail')}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Screening Risk Probability</Text>
              <Text style={styles.cardSub}>Algorithm-estimated likelihood trend</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          <View style={styles.trendRow}>
            <Text style={styles.currentVal}>{isFemale ? '68%' : '72%'}</Text>
            <View style={styles.changeBadgeGood}>
              <Ionicons name="arrow-down" size={12} color="#15803D" />
              <Text style={styles.changeTextGood}>-8% from baseline</Text>
            </View>
          </View>

          {/* Simple Sparkline SVG representation */}
          <View style={styles.sparklineContainer}>
            <View style={[styles.sparklinePoint, { bottom: 50, left: '10%' }]} />
            <View style={[styles.sparklineLine, { bottom: 45, left: '10%', width: '35%', transform: [{ rotate: '-12deg' }] }]} />
            <View style={[styles.sparklinePoint, { bottom: 38, left: '45%' }]} />
            <View style={[styles.sparklineLine, { bottom: 30, left: '45%', width: '45%', transform: [{ rotate: '-15deg' }] }]} />
            <View style={[styles.sparklinePoint, { bottom: 20, left: '90%', backgroundColor: themeAccent }]} />
          </View>

          <View style={styles.axisLabelsRow}>
            <Text style={styles.axisText}>Day 1</Text>
            <Text style={styles.axisText}>Day 45</Text>
            <Text style={styles.axisText}>Today</Text>
          </View>
        </Pressable>

        {/* Trend 2: Weight & BMI Trajectory */}
        <Pressable
          onPress={() => router.push('/(app)/metric-detail')}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Body Mass Index (BMI)</Text>
              <Text style={styles.cardSub}>Anthropometric weight tracking</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          <View style={styles.trendRow}>
            <Text style={styles.currentVal}>{isFemale ? '22.1' : '25.9'} kg/m²</Text>
            <View style={styles.changeBadgeGood}>
              <Ionicons name="arrow-down" size={12} color="#15803D" />
              <Text style={styles.changeTextGood}>-1.2 kg total</Text>
            </View>
          </View>

          <View style={styles.progressNote}>
            <Text style={styles.progressNoteText}>
              Gradual weight reduction improves peripheral insulin sensitivity and sex hormone-binding globulin synthesis.
            </Text>
          </View>
        </Pressable>

        {/* Trend 3: Cycle Regularity or Testosterone Status */}
        <Pressable
          onPress={() => router.push('/(app)/metric-detail')}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                {isFemale ? 'Cycle Duration Regularity' : 'Morning Total Testosterone'}
              </Text>
              <Text style={styles.cardSub}>
                {isFemale ? 'Rotterdam cycle interval tracking' : 'Laboratory & ADAM symptom correlation'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          <View style={styles.trendRow}>
            <Text style={styles.currentVal}>{isFemale ? '32 days' : '385 ng/dL'}</Text>
            <View style={styles.changeBadgeGood}>
              <Ionicons name="trending-up" size={12} color="#15803D" />
              <Text style={styles.changeTextGood}>{isFemale ? 'Stabilizing' : '+45 ng/dL'}</Text>
            </View>
          </View>
        </Pressable>

        {/* Trend 4: Symptom Severity Score */}
        <Pressable
          onPress={() => router.push('/(app)/metric-detail')}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Reported Symptom Burden</Text>
              <Text style={styles.cardSub}>Composite score of daily logged symptoms</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          <View style={styles.trendRow}>
            <Text style={styles.currentVal}>Mild</Text>
            <View style={styles.changeBadgeGood}>
              <Ionicons name="arrow-down" size={12} color="#15803D" />
              <Text style={styles.changeTextGood}>Down from Moderate</Text>
            </View>
          </View>
        </Pressable>
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
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  cardSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginTop: 1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  currentVal: {
    fontSize: 24,
    fontWeight: '900',
    color: BioPulseColors.navy,
  },
  changeBadgeGood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changeTextGood: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  sparklineContainer: {
    height: 70,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    position: 'relative',
    marginBottom: 6,
    overflow: 'hidden',
  },
  sparklinePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
  sparklineLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#94A3B8',
  },
  axisLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  axisText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  progressNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  progressNoteText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
});
