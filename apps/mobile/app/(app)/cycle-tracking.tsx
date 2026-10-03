import React, { useState, useCallback } from 'react';
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
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function CycleTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { cycle, logPeriodStart } = useHealthStore();

  const [selectedDay, setSelectedDay] = useState<number>(cycle.currentCycleDay || 14);
  const [selectedFlow, setSelectedFlow] = useState<string>('moderate');

  // Days in current month mock calendar
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const flowOptions = [
    { key: 'spotting', label: 'Spotting', icon: 'water-outline' },
    { key: 'light', label: 'Light', icon: 'water-outline' },
    { key: 'moderate', label: 'Moderate', icon: 'water' },
    { key: 'heavy', label: 'Heavy', icon: 'rainy' },
  ];

  const handleLogPeriod = useCallback(() => {
    logPeriodStart(new Date().toISOString().split('T')[0], 'Moderate');
    Alert.alert(
      'Period Logged',
      `Cycle Day reset to 1. Predicted next ovulation and fertile window have been recalibrated for your ${cycle.cycleLength}-day cycle.`,
      [{ text: 'OK' }]
    );
  }, [logPeriodStart, cycle.cycleLength]);

  if (!isFemale) {
    return (
      <View style={[styles.root, styles.centerAlign]}>
        <Text style={styles.notAvailableTitle}>Pathway Specific Feature</Text>
        <Text style={styles.notAvailableDesc}>Menstrual cycle tracking is only available in the female health profile.</Text>
        <Pressable onPress={() => router.replace('/(app)/track')} style={styles.backBtnPill}>
          <Text style={styles.backBtnPillText}>Return to Tracking Hub</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Cycle Tracking</Text>
          <Text style={styles.headerSub}>Ovulation & Menstrual Rhythm</Text>
        </View>
        <Pressable onPress={handleLogPeriod} style={styles.quickLogBtn}>
          <Ionicons name="add" size={16} color={BioPulseColors.femaleAccent} />
          <Text style={styles.quickLogText}>Log</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cycle Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View style={styles.phasePill}>
              <Text style={styles.phasePillText}>{cycle.phase.toUpperCase()}</Text>
            </View>
            <View style={styles.regularityBadge}>
              <Text style={styles.regularityBadgeText}>{cycle.regularity.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.cycleCenterInfo}>
            <Text style={styles.dayBigText}>Cycle Day {selectedDay}</Text>
            <Text style={styles.cycleSubText}>
              Next period in ~{cycle.nextPeriodDaysRemaining} days • Typical length {cycle.cycleLength} days
            </Text>
          </View>

          <View style={styles.cycleStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Period Duration</Text>
              <Text style={styles.statVal}>{cycle.periodDuration} Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Fertile Window</Text>
              <Text style={styles.statVal}>Days 12 - 16</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Ovulation</Text>
              <Text style={styles.statVal}>Day 14 (Est.)</Text>
            </View>
          </View>
        </View>

        {/* Horizontal Calendar Strip Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calendar-outline" size={18} color={BioPulseColors.femaleAccent} />
            <Text style={styles.cardTitle}>Cycle Day Timeline</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarStrip}
          >
            {daysInMonth.map((day) => {
              const isSelected = selectedDay === day;
              const isPeriodDay = day >= 1 && day <= cycle.periodDuration;
              const isFertile = day >= 12 && day <= 16;
              const isOvulation = day === 14;

              return (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.dayPill,
                    isSelected && styles.dayPillSelected,
                    isPeriodDay && styles.dayPillPeriod,
                    isOvulation && styles.dayPillOvulation,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                      isPeriodDay && styles.dayNumberPeriod,
                    ]}
                  >
                    {day}
                  </Text>
                  <Text
                    style={[
                      styles.dayTypeLabel,
                      isSelected && styles.dayTypeLabelSelected,
                    ]}
                  >
                    {isPeriodDay ? 'Period' : isOvulation ? 'Ovul' : isFertile ? 'Fertile' : 'Foll'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F43F7D' }]} />
              <Text style={styles.legendText}>Period</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>Ovulation</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0E9EAA' }]} />
              <Text style={styles.legendText}>Fertile</Text>
            </View>
          </View>
        </View>

        {/* Flow Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log Menstrual Flow for Day {selectedDay}</Text>
          <View style={styles.flowOptionsRow}>
            {flowOptions.map((opt) => {
              const isChosen = selectedFlow === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSelectedFlow(opt.key)}
                  style={[styles.flowBtn, isChosen && styles.flowBtnActive]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={18}
                    color={isChosen ? BioPulseColors.femaleAccent : '#64748B'}
                  />
                  <Text style={[styles.flowBtnText, isChosen && styles.flowBtnTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Action Button: Log Period Start */}
        <Pressable
          onPress={handleLogPeriod}
          style={({ pressed }) => [styles.periodActionBtn, pressed && styles.periodActionBtnPressed]}
        >
          <Ionicons name="calendar" size={18} color="#FFFFFF" />
          <Text style={styles.periodActionBtnText}>+ Log Period Started Today (Day 1)</Text>
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
  centerAlign: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 8,
  },
  notAvailableDesc: {
    fontSize: 14,
    color: BioPulseColors.secondaryText,
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtnPill: {
    backgroundColor: BioPulseColors.malePrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  headerSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginTop: 1,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  quickLogText: {
    fontSize: 12,
    fontWeight: '700',
    color: BioPulseColors.femaleAccent,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  phasePill: {
    backgroundColor: '#FFF2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phasePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BioPulseColors.femaleAccent,
  },
  regularityBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  regularityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  cycleCenterInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dayBigText: {
    fontSize: 26,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginBottom: 4,
  },
  cycleSubText: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    textAlign: 'center',
  },
  cycleStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 10,
  },
  calendarStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dayPill: {
    width: 48,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayPillSelected: {
    borderColor: BioPulseColors.femaleAccent,
    borderWidth: 2,
    backgroundColor: '#FFF2F7',
  },
  dayPillPeriod: {
    backgroundColor: '#FCE7F3',
    borderColor: '#F472B6',
  },
  dayPillOvulation: {
    backgroundColor: '#EDE9FE',
    borderColor: '#A78BFA',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  dayNumberSelected: {
    color: BioPulseColors.femaleAccent,
  },
  dayNumberPeriod: {
    color: '#BE185D',
  },
  dayTypeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dayTypeLabelSelected: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
  },
  flowOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flowBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  flowBtnActive: {
    borderColor: BioPulseColors.femaleAccent,
    backgroundColor: '#FFF2F7',
  },
  flowBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  flowBtnTextActive: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '700',
  },
  periodActionBtn: {
    backgroundColor: BioPulseColors.femaleAccent,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  periodActionBtnPressed: {
    opacity: 0.88,
  },
  periodActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
