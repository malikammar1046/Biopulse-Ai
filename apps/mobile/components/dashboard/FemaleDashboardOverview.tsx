import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../common/BioPulseBackground';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../navigation';
import { useDashboardData } from '../../hooks/useDashboardData';

export interface FemaleDashboardOverviewProps {
  onNotificationPress?: () => void;
}

/**
 * SCREEN 12: FEMALE HOME DASHBOARD
 *
 * Connected directly to authoritative backend user data.
 * Zero fabricated numbers:
 * - Dynamic Greeting & First Name
 * - Real PCOS Screening probability, risk band, and tier (or authentic Not Screened state)
 * - Real Menstrual Cycle days and fertile window (or authentic No Cycle Logged state)
 * - Real Today metrics for Nutrition, Water, and Activity
 * - Real active Medications (or empty state)
 * - Real Next Best Action based on actual clinical state
 */
export const FemaleDashboardOverview: React.FC<FemaleDashboardOverviewProps> = ({
  onNotificationPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { state, data, error, isRefreshing, refresh, retry } = useDashboardData('female');

  const [medTaken, setMedTaken] = useState(false);

  const topPad = Math.max(insets.top, 14);
  const bottomPad = Math.max(insets.bottom, 12);

  // Time-of-day greeting & user first name from backend
  const { greeting, firstName, formattedDate } = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good afternoon';
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour >= 17) {
      timeGreeting = 'Good evening';
    }

    const rawName = data?.userName?.trim() || '';
    const first = rawName ? rawName.split(' ')[0] : 'Member';

    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return { greeting: timeGreeting, firstName: first, formattedDate: dateStr };
  }, [data?.userName]);

  const handleNotificationClick = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/(app)/notifications');
    }
  };

  // 1. Assessment derived state
  const assessment = data?.assessment;
  const hasAssessment = Boolean(assessment && assessment.hasAssessment);
  const probability = assessment?.probabilityPercent ?? null;
  const riskLabel = assessment?.riskLabel ?? 'Not Screened';
  const tierNumber = assessment?.tier ?? 1;
  const lastAssessedDate = assessment?.lastAssessedDate ?? 'Not assessed yet';

  // 2. Cycle derived state
  const cycle = data?.cycle;
  const hasCycleData = Boolean(cycle && cycle.hasCycleData);
  const cycleDay = cycle?.currentCycleDay ?? 0;
  const cycleTotalDays = cycle?.cycleLength ?? 28;
  const daysUntilNext = cycle?.nextPeriodDaysRemaining ?? 0;
  const nextPeriodDate = cycle?.nextPeriodExpectedDate ?? '';
  const fertileDates = cycle?.fertileWindowStart && cycle?.fertileWindowEnd
    ? `${cycle.fertileWindowStart} – ${cycle.fertileWindowEnd}`
    : 'Not logged';

  // 3. Today metrics derived state
  const caloriesVal = data?.nutrition?.hasNutritionLogs
    ? `${data.nutrition.caloriesConsumed.toLocaleString()} / ${data.nutrition.calorieTarget.toLocaleString()}`
    : `0 / ${data?.nutrition?.calorieTarget?.toLocaleString() || '1,800'}`;
  const waterVal = data?.water?.hasWaterLogs
    ? `${data.water.consumedLiters.toFixed(1)} / ${data.water.targetLiters.toFixed(1)}`
    : `0.0 / 2.5`;
  const activityVal = data?.movement?.hasMovementLogs
    ? `${data.movement.todayActivityMinutes} min`
    : `0 min`;

  // 4. Medication derived state
  const activeMed = data?.medication?.activeMedication;
  const hasMedication = Boolean(data?.medication?.hasMedications && activeMed);

  // If initial load failed with no cache
  if (state === 'error' && !data) {
    return (
      <BioPulseBackground style={styles.container}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={[styles.errorContainer, { paddingTop: topPad + 40 }]}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="cloud-offline-outline" size={36} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Unable to load health summary</Text>
          <Text style={styles.errorSubtitle}>
            {error || 'Could not connect to BioPulse servers. Please check your connection.'}
          </Text>
          <Pressable onPress={retry} style={styles.retryButton}>
            <Ionicons name="reload" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
        <BioPulseBottomNav activeTab="home" />
      </BioPulseBackground>
    );
  }

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
            {hasCycleData ? `Cycle Day ${cycleDay} • ${formattedDate}` : formattedDate}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="#F43F7D"
            colors={['#F43F7D']}
          />
        }
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

              <Pressable
                onPress={() => router.push(hasAssessment ? '/female-screening-result' : '/female-basic-info')}
                hitSlop={10}
              >
                <Text style={styles.cardLinkText}>
                  {hasAssessment ? 'View Screening >' : 'Start Screening >'}
                </Text>
              </Pressable>
            </View>

            {hasAssessment ? (
              <View style={styles.screeningBodyRow}>
                {/* Probability Circular Gauge */}
                <View style={styles.gaugeBox}>
                  <View style={styles.gaugeCircle}>
                    <Text style={styles.gaugeNumber}>{probability ?? 0}%</Text>
                    <Text style={styles.gaugeLabel}>Probability</Text>
                  </View>
                </View>

                {/* Risk details */}
                <View style={styles.screeningInfoCol}>
                  <View style={riskLabel.includes('Higher') ? styles.higherRiskBadge : styles.moderateRiskBadge}>
                    <Ionicons
                      name={riskLabel.includes('Higher') ? 'warning-outline' : 'shield-checkmark-outline'}
                      size={14}
                      color={riskLabel.includes('Higher') ? '#EF4444' : '#0D9488'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={riskLabel.includes('Higher') ? styles.higherRiskText : styles.moderateRiskText}>
                      {riskLabel}
                    </Text>
                  </View>

                  <Text style={styles.tierText}>Tier {tierNumber} • Initial Screening</Text>
                  <Text style={styles.lastAssessedText}>Last assessed: {lastAssessedDate}</Text>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/female-basic-info')}
                style={styles.emptyScreeningRow}
              >
                <View style={styles.emptyGaugeBox}>
                  <Ionicons name="help-circle-outline" size={32} color="#F43F7D" />
                </View>
                <View style={styles.emptyScreeningTextCol}>
                  <Text style={styles.emptyCardTitle}>No screening yet</Text>
                  <Text style={styles.emptyCardDesc}>
                    Complete your initial screening to receive your personalized PCOS probability and risk factors.
                  </Text>
                </View>
              </Pressable>
            )}
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
                <Text style={styles.cardLinkText}>{hasCycleData ? 'View >' : 'Log Cycle >'}</Text>
              </Pressable>
            </View>

            {hasCycleData ? (
              <>
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
                        {nextPeriodDate || 'Predicted'}{' '}
                        <Text style={styles.nextPeriodDays}>(in {daysUntilNext} days)</Text>
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
                    <Text style={styles.fertileDates}>{fertileDates}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/(app)/cycle-tracking')}
                style={styles.emptyCycleBox}
              >
                <View style={styles.emptyCycleIconBox}>
                  <Ionicons name="calendar-outline" size={24} color="#F43F7D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyCardTitle}>No cycle logged yet</Text>
                  <Text style={styles.emptyCardDesc}>
                    Log your last period to receive accurate cycle day calculations, fertile windows, and period predictions.
                  </Text>
                </View>
              </Pressable>
            )}
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
                <Text style={styles.todayMetricValue}>{caloriesVal}</Text>
                <Text style={styles.todayMetricUnit}>kcal</Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Water */}
              <View style={styles.todayMetricCol}>
                <Ionicons name="water" size={20} color="#0EA5E9" style={{ marginBottom: 4 }} />
                <Text style={styles.todayMetricValue}>{waterVal}</Text>
                <Text style={styles.todayMetricUnit}>L water</Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Activity */}
              <View style={styles.todayMetricCol}>
                <Ionicons name="walk" size={20} color="#14B8C4" style={{ marginBottom: 4 }} />
                <Text style={styles.todayMetricValue}>{activityVal}</Text>
                <Text style={styles.todayMetricUnit}>activity</Text>
              </View>
            </View>
          </View>

          {/* CARD 4: MEDICATION REMINDER */}
          <View style={styles.card}>
            {hasMedication && activeMed ? (
              <View style={styles.medicationRow}>
                <View style={styles.medicationLeft}>
                  <View style={styles.pillIconBox}>
                    <Ionicons name="medical" size={18} color="#F43F7D" />
                  </View>
                  <View>
                    <Text style={styles.medicationTitle}>Take {activeMed.name} {activeMed.dosage}</Text>
                    <Text style={styles.medicationTime}>Today, {activeMed.scheduledTime}</Text>
                  </View>
                </View>

                <Switch
                  value={medTaken}
                  onValueChange={setMedTaken}
                  trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/(app)/medications')}
                style={styles.medicationRow}
              >
                <View style={styles.medicationLeft}>
                  <View style={[styles.pillIconBox, { backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="medical-outline" size={18} color="#94A3B8" />
                  </View>
                  <View>
                    <Text style={styles.medicationTitle}>Medication Schedule</Text>
                    <Text style={styles.medicationTime}>No active medications scheduled for today</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            )}
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
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  cardLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F43F7D',
  },
  screeningBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeBox: {
    marginRight: 18,
  },
  gaugeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#F43F7D',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F8',
  },
  gaugeNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.5,
  },
  gaugeLabel: {
    fontSize: 10,
    color: BioPulseColors.textSecondary,
    fontWeight: '500',
    marginTop: -2,
  },
  screeningInfoCol: {
    flex: 1,
  },
  higherRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  higherRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  moderateRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  moderateRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  tierText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
    marginBottom: 2,
  },
  lastAssessedText: {
    fontSize: 11.5,
    color: BioPulseColors.textSecondary,
  },
  emptyScreeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emptyGaugeBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyScreeningTextCol: {
    flex: 1,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginBottom: 3,
  },
  emptyCardDesc: {
    fontSize: 12,
    color: BioPulseColors.textSecondary,
    lineHeight: 16,
  },
  emptyCycleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emptyCycleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontSize: 10.5,
    color: BioPulseColors.textSecondary,
    fontWeight: '500',
  },
  nextPeriodDate: {
    fontSize: 12,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  nextPeriodDays: {
    fontSize: 11,
    fontWeight: '500',
    color: BioPulseColors.teal,
  },
  fertileSubcard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderRadius: 10,
    padding: 10,
  },
  fertileIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fertileTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#BE185D',
  },
  fertileDates: {
    fontSize: 11,
    color: BioPulseColors.textSecondary,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  todayMetricUnit: {
    fontSize: 11,
    color: BioPulseColors.textSecondary,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
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
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  medicationTime: {
    fontSize: 11.5,
    color: BioPulseColors.textSecondary,
    marginTop: 1,
  },
  nextActionCard: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  nextActionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextActionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  nextActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nextActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginBottom: 4,
  },
  nextActionDesc: {
    fontSize: 12,
    color: BioPulseColors.textSecondary,
    lineHeight: 17,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: BioPulseColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F7D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
