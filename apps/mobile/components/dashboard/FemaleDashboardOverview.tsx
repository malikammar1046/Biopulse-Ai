import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../common/BioPulseBackground';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../navigation';
import { useHealthStore } from '../../store/healthStore';

export interface FemaleDashboardOverviewProps {
  onNotificationPress?: () => void;
}

/**
 * SCREEN 12: FEMALE HOME DASHBOARD
 *
 * Matches Screenshot 12:
 * - Header: Sun icon, "Good afternoon, [Name]", "Cycle Day 14 • [Date]", Bell icon
 * - PCOS Screening Card: 72% Probability ring, [⚠️ Higher Risk], Tier 1 Initial Screening
 * - Your Cycle Card: Day 14 of 32 days, Next period (in 14 days), Fertile window subcard
 * - Today Card: 3 metrics (Calories, Water, Activity) with icons
 * - Medication Reminder: "Take Metformin 500 mg", "Today, 8:00 PM" with interactive toggle
 * - Next Best Action: "Add clinical hormone labs" with beaker icon
 * - Fixed bottom navigation in female pink accent
 */
export const FemaleDashboardOverview: React.FC<FemaleDashboardOverviewProps> = ({
  onNotificationPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const {
    profile,
    screening,
    cycle,
    nutrition,
    water,
    movement,
    medications,
  } = useHealthStore();

  const [medTaken, setMedTaken] = useState(true);

  const topPad = Math.max(insets.top, 14);
  const bottomPad = Math.max(insets.bottom, 12);

  // Derive time-of-day greeting & user first name
  const { greeting, firstName, formattedDate } = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good afternoon';
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour >= 17) {
      timeGreeting = 'Good evening';
    }

    const rawName = profile?.fullName || 'Ayesha Khan';
    const first = rawName.split(' ')[0] || 'Ayesha';

    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return { greeting: timeGreeting, firstName: first, formattedDate: dateStr };
  }, [profile]);

  // Screening values
  const probability = screening?.probabilityPercent ?? 72;
  const riskLabel = screening?.riskCategory ? screening.riskCategory.replace('_', ' ') : 'Higher Risk';
  const tierNumber = screening?.tier ?? 1;

  // Cycle values
  const cycleDay = cycle?.currentCycleDay ?? 14;
  const cycleTotalDays = cycle?.cycleLength ?? 32;
  const daysUntilNext = cycle?.nextPeriodDaysRemaining ?? 14;

  const handleNotificationClick = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/(app)/notifications');
    }
  };

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP HEADER ROW */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <View style={styles.greetingLeft}>
          <View style={styles.greetingHeaderRow}>
            <Ionicons name="sunny" size={20} color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={styles.greetingTitle}>
              {greeting}, {firstName}
            </Text>
          </View>
          <Text style={styles.greetingSubtitle}>
            Cycle Day {cycleDay} • {formattedDate}
          </Text>
        </View>

        <Pressable
          onPress={handleNotificationClick}
          style={styles.bellButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={BioPulseColors.textPrimary} />
          <View style={styles.bellBadge} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* CARD 1: PCOS SCREENING */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#FDF2F6' }]}>
                  <Ionicons name="clipboard" size={17} color="#F43F7D" />
                </View>
                <Text style={styles.cardTitle}>PCOS Screening</Text>
              </View>

              <Pressable onPress={() => router.push('/female-screening-result')} hitSlop={10}>
                <Text style={styles.cardLinkText}>View Screening &gt;</Text>
              </Pressable>
            </View>

            <View style={styles.screeningBodyRow}>
              {/* Probability Circular Gauge */}
              <View style={styles.gaugeBox}>
                <View style={styles.gaugeCircle}>
                  <Text style={styles.gaugeNumber}>{probability}%</Text>
                  <Text style={styles.gaugeLabel}>Probability</Text>
                </View>
              </View>

              {/* Risk details */}
              <View style={styles.screeningInfoCol}>
                <View style={styles.higherRiskBadge}>
                  <Ionicons name="warning-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.higherRiskText}>{riskLabel}</Text>
                </View>

                <Text style={styles.tierText}>Tier {tierNumber} • Initial Screening</Text>
                <Text style={styles.lastAssessedText}>Last assessed: {formattedDate}</Text>
              </View>
            </View>
          </View>

          {/* CARD 2: YOUR CYCLE */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#FDF2F6' }]}>
                  <Ionicons name="calendar" size={17} color="#F43F7D" />
                </View>
                <Text style={styles.cardTitle}>Your Cycle</Text>
              </View>

              <Pressable onPress={() => router.push('/(app)/cycle-tracking')} hitSlop={10}>
                <Text style={styles.cardLinkText}>View &gt;</Text>
              </Pressable>
            </View>

            <View style={styles.cycleMetricsRow}>
              <View>
                <Text style={styles.cycleDaysBold}>
                  Day {cycleDay}{' '}
                  <Text style={styles.cycleDaysMuted}>of {cycleTotalDays} days</Text>
                </Text>
              </View>

              <View style={styles.nextPeriodBox}>
                <Ionicons name="sync-outline" size={16} color={BioPulseColors.teal} style={{ marginRight: 6 }} />
                <View>
                  <Text style={styles.nextPeriodLabel}>Next period</Text>
                  <Text style={styles.nextPeriodDate}>
                    7 Apr 2025 <Text style={styles.nextPeriodDays}>(in {daysUntilNext} days)</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Fertile Window Subcard */}
            <View style={styles.fertileSubcard}>
              <View style={styles.fertileIconBox}>
                <Ionicons name="sparkles" size={14} color="#F43F7D" />
              </View>
              <View>
                <Text style={styles.fertileTitle}>Fertile window</Text>
                <Text style={styles.fertileDates}>28 Mar – 2 Apr 2025</Text>
              </View>
            </View>
          </View>

          {/* CARD 3: TODAY SUMMARY */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#E6F8F9' }]}>
                  <Ionicons name="add-circle" size={18} color={BioPulseColors.teal} />
                </View>
                <Text style={styles.cardTitle}>Today</Text>
              </View>

              <Pressable onPress={() => router.push('/(app)/track')} hitSlop={10}>
                <Text style={styles.cardLinkText}>View &gt;</Text>
              </Pressable>
            </View>

            <View style={styles.todayMetricsRow}>
              {/* Calories */}
              <View style={styles.todayMetricCol}>
                <Ionicons name="restaurant" size={20} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={styles.todayMetricValue}>1,320 / 1,800</Text>
                <Text style={styles.todayMetricUnit}>kcal</Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Water */}
              <View style={styles.todayMetricCol}>
                <Ionicons name="water" size={20} color="#0EA5E9" style={{ marginBottom: 4 }} />
                <Text style={styles.todayMetricValue}>1.6 / 2.5</Text>
                <Text style={styles.todayMetricUnit}>L water</Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Activity */}
              <View style={styles.todayMetricCol}>
                <Ionicons name="walk" size={20} color="#14B8C4" style={{ marginBottom: 4 }} />
                <Text style={styles.todayMetricValue}>45 min</Text>
                <Text style={styles.todayMetricUnit}>activity</Text>
              </View>
            </View>
          </View>

          {/* CARD 4: MEDICATION REMINDER */}
          <View style={styles.card}>
            <View style={styles.medicationRow}>
              <View style={styles.medicationLeft}>
                <View style={styles.pillIconBox}>
                  <Ionicons name="medical" size={18} color="#F43F7D" />
                </View>
                <View>
                  <Text style={styles.medicationTitle}>Take Metformin 500 mg</Text>
                  <Text style={styles.medicationTime}>Today, 8:00 PM</Text>
                </View>
              </View>

              <Switch
                value={medTaken}
                onValueChange={setMedTaken}
                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* CARD 5: NEXT BEST ACTION */}
          <Pressable
            onPress={() => router.push('/(app)/add-labs')}
            style={[styles.card, styles.nextActionCard]}
            accessibilityRole="button"
          >
            <View style={styles.nextActionHeaderRow}>
              <View style={styles.nextActionIconBox}>
                <Ionicons name="flask-outline" size={18} color="#0D9488" />
              </View>
              <Text style={styles.nextActionLabel}>Next Best Action</Text>
              <Ionicons name="chevron-forward" size={16} color={BioPulseColors.teal} style={{ marginLeft: 'auto' }} />
            </View>

            <Text style={styles.nextActionTitle}>Add clinical hormone labs</Text>
            <Text style={styles.nextActionDesc}>
              Get key hormone tests (e.g. AMH, testosterone, LH/FSH) for a clearer assessment.
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* FIXED BOTTOM NAVIGATION */}
      <BioPulseBottomNav activeTab="home" />
    </BioPulseBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 12.5,
    color: BioPulseColors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F43F7D',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  mainWrapper: {
    width: '100%',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
  },
  cardLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F43F7D',
  },
  screeningBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 6,
    borderColor: '#FCE7F0',
    borderTopColor: '#F43F7D',
    borderRightColor: '#F43F7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
  },
  gaugeLabel: {
    fontSize: 9.5,
    color: BioPulseColors.textSecondary,
    fontWeight: '600',
    marginTop: -2,
  },
  screeningInfoCol: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  higherRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  higherRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  tierText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  lastAssessedText: {
    fontSize: 11.5,
    color: BioPulseColors.textSecondary,
  },
  cycleMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cycleDaysBold: {
    fontSize: 17,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
  },
  cycleDaysMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: BioPulseColors.textSecondary,
  },
  nextPeriodBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextPeriodLabel: {
    fontSize: 11,
    color: BioPulseColors.textSecondary,
    fontWeight: '500',
  },
  nextPeriodDate: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  nextPeriodDays: {
    fontSize: 11.5,
    fontWeight: '500',
    color: BioPulseColors.textSecondary,
  },
  fertileSubcard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF5F8',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FCE7F0',
  },
  fertileIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fertileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F43F7D',
  },
  fertileDates: {
    fontSize: 12,
    fontWeight: '500',
    color: BioPulseColors.textPrimary,
  },
  todayMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  todayMetricCol: {
    alignItems: 'center',
    flex: 1,
  },
  todayMetricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
  },
  todayMetricUnit: {
    fontSize: 11,
    color: BioPulseColors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: BioPulseColors.borderSubtle,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pillIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FDF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  medicationTime: {
    fontSize: 12,
    color: BioPulseColors.textSecondary,
    marginTop: 2,
  },
  nextActionCard: {
    borderColor: '#BBE6ED',
  },
  nextActionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nextActionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E6F8F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  nextActionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BioPulseColors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextActionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginBottom: 2,
  },
  nextActionDesc: {
    fontSize: 12,
    color: BioPulseColors.textSecondary,
    lineHeight: 17,
  },
});
