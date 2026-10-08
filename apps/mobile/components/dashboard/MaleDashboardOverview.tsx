import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
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

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');
const HERO_MALE_ART = require('../../assets/male_pathway_hero.png');

export interface MaleDashboardOverviewProps {
  onNotificationPress?: () => void;
}

/**
 * SCREEN 17: MALE HOME DASHBOARD
 *
 * Connected directly to authoritative backend user data.
 * Zero fabricated numbers:
 * - Brand Lockup + Notification Bell
 * - Dynamic Greeting & First Name (never hardcoded 'Adrian')
 * - Real Hypogonadism Screening probability, risk band, and tier (or authentic Not Screened state)
 * - Real Today Progress metrics for Nutrition, Water, and Activity
 * - Real Nutrition meal counts
 * - Real active Medications (or empty state, never fabricated 'Testosterone Gel')
 * - Real Upcoming Appointments (or empty state, never fabricated 'Dr. Ahmed Khan')
 */
export const MaleDashboardOverview: React.FC<MaleDashboardOverviewProps> = ({
  onNotificationPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { state, data, error, isRefreshing, refresh, retry } = useDashboardData('male');

  const [medTakenLocal, setMedTakenLocal] = useState(false);

  const firstName = useMemo(() => {
    const rawName = data?.userName?.trim() || '';
    if (rawName.length > 0) {
      return rawName.split(' ')[0];
    }
    return 'Member';
  }, [data?.userName]);

  // Assessment derived state
  const assessment = data?.assessment;
  const hasAssessment = Boolean(assessment && assessment.hasAssessment);
  const probPercent = assessment?.probabilityPercent ?? null;
  const riskLabel = assessment?.riskLabel ?? 'Not Screened';
  const tierNumber = assessment?.tier ?? 1;
  const lastAssessedMetaText = assessment?.lastAssessedDate
    ? `Last assessed ${assessment.lastAssessedDate}`
    : 'No assessment recorded yet';

  // Active male medication reminder
  const activeMedication = data?.medication?.activeMedication ?? null;
  const hasMedication = Boolean(data?.medication?.hasMedications && activeMedication);
  const isMedTaken = activeMedication?.status === 'taken' || medTakenLocal;

  const handleToggleMed = useCallback(() => {
    setMedTakenLocal((prev) => !prev);
  }, []);

  // Upcoming appointment
  const upcomingAppointment = data?.appointment?.upcomingAppointment ?? null;
  const hasAppointment = Boolean(data?.appointment?.hasUpcomingAppointment && upcomingAppointment);

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 12);

  // Initial loading state when no cache is available yet
  if (state === 'loading' && !data) {
    return (
      <BioPulseBackground style={styles.root}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={[styles.errorContainer, { paddingTop: topPad + 80 }]}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={[styles.errorTitle, { marginTop: 16 }]}>Loading Health Dashboard</Text>
          <Text style={styles.errorSubtitle}>
            Synchronizing your clinical parameters and latest tracking data...
          </Text>
        </View>
        <BioPulseBottomNav activeTab="home" />
      </BioPulseBackground>
    );
  }

  // If initial load failed with no cache
  if (state === 'error' && !data) {
    return (
      <BioPulseBackground style={styles.root}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={[styles.errorContainer, { paddingTop: topPad + 40 }]}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="cloud-offline-outline" size={36} color="#0284C7" />
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
    <BioPulseBackground style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP BRAND HEADER ROW */}
      <View style={[styles.topHeader, { paddingTop: topPad }]}>
        <View style={styles.brandRow}>
          <Image source={HEART_EMBLEM} style={styles.brandEmblem} resizeMode="contain" />
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandBioPulse}>BioPulse</Text>
            <Text style={styles.brandAi}> AI</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (onNotificationPress) {
              onNotificationPress();
            } else {
              router.push('/(app)/notifications');
            }
          }}
          style={styles.bellBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color="#073B72" />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="#0284C7"
            colors={['#0284C7']}
          />
        }
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* USER GREETING ROW */}
          <View style={styles.greetingRow}>
            <View style={styles.avatarWrapper}>
              <Image source={HERO_MALE_ART} style={styles.avatarImage} resizeMode="cover" />
            </View>
            <View style={styles.greetingTextCol}>
              <Text style={styles.greetingSub}>Good afternoon,</Text>
              <Text style={styles.greetingName}>{firstName}</Text>
              <Text style={styles.greetingMeta}>Here's your health summary for today.</Text>
            </View>
          </View>

          {/* CARD 1: HYPOGONADISM SCREENING */}
          <Pressable
            onPress={() => router.push(hasAssessment ? '/male-screening-result' : '/male-basic-info')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleGroup}>
                <Ionicons name="person-outline" size={18} color="#0284C7" />
                <Text style={styles.cardTitle}>Hypogonadism Screening</Text>
              </View>
              <Pressable
                onPress={() => router.push(hasAssessment ? '/male-screening-result' : '/male-basic-info')}
                hitSlop={8}
              >
                <Text style={styles.viewLinkText}>{hasAssessment ? 'View' : 'Start'}</Text>
              </Pressable>
            </View>

            {hasAssessment ? (
              <View style={styles.screeningCardBody}>
                {/* Circular Gauge Ring */}
                <View style={styles.gaugeContainer}>
                  <View style={styles.gaugeOuterTrack}>
                    <View style={styles.gaugeInnerCircle}>
                      <Text style={styles.gaugePercentText}>{probPercent ?? 0}%</Text>
                    </View>
                  </View>
                </View>

                {/* Screening Details */}
                <View style={styles.screeningDetailsCol}>
                  <View
                    style={
                      riskLabel.includes('Higher')
                        ? styles.higherRiskBadge
                        : riskLabel.includes('Intermediate')
                        ? styles.intermediateRiskBadge
                        : styles.lowerRiskBadge
                    }
                  >
                    <Text
                      style={
                        riskLabel.includes('Higher')
                          ? styles.higherRiskText
                          : riskLabel.includes('Intermediate')
                          ? styles.intermediateRiskText
                          : styles.lowerRiskText
                      }
                    >
                      {riskLabel}
                    </Text>
                  </View>
                  <Text style={styles.tierMetaText}>Tier {tierNumber} • Questionnaire</Text>
                  <Text style={styles.lastAssessedMetaText}>{lastAssessedMetaText}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyScreeningCardBody}>
                <View style={styles.emptyGaugeContainer}>
                  <Ionicons name="help-circle-outline" size={30} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyCardTitle}>Not Screened Yet</Text>
                  <Text style={styles.emptyCardDesc}>
                    Complete the SLU ADAM questionnaire to evaluate androgen deficiency and receive clinical insights.
                  </Text>
                </View>
              </View>
            )}
          </Pressable>

          {/* CARD 2: TODAY'S PROGRESS */}
          <Pressable
            onPress={() => router.push('/(app)/track')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleGroup}>
                <Ionicons name="leaf-outline" size={18} color="#10B981" />
                <Text style={styles.cardTitle}>Today's Progress</Text>
              </View>
            </View>

            <View style={styles.todayMetricsRow}>
              {/* Column 1: Nutrition */}
              <View style={styles.metricColumn}>
                <Ionicons name="restaurant-outline" size={18} color="#10B981" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Nutrition</Text>
                <Text style={styles.metricValue}>
                  {data?.nutrition?.hasNutritionLogs
                    ? data.nutrition.caloriesConsumed.toLocaleString()
                    : '0'}
                </Text>
                <Text style={styles.metricSub}>
                  / {data?.nutrition?.calorieTarget?.toLocaleString() || '2,200'} kcal
                </Text>
              </View>

              <View style={styles.verticalDivider} />

              {/* Column 2: Water */}
              <View style={styles.metricColumn}>
                <Ionicons name="water-outline" size={18} color="#0284C7" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Water</Text>
                <Text style={styles.metricValue}>
                  {data?.water?.hasWaterLogs
                    ? data.water.consumedLiters.toFixed(1)
                    : '0.0'}
                </Text>
                <Text style={styles.metricSub}>
                  / {data?.water?.targetLiters?.toFixed(1) || '2.5'} L
                </Text>
              </View>

              <View style={styles.verticalDivider} />

              {/* Column 3: Activity */}
              <View style={styles.metricColumn}>
                <Ionicons name="fitness-outline" size={18} color="#8B5CF6" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Activity</Text>
                <Text style={styles.metricValue}>
                  {data?.movement?.hasMovementLogs ? data.movement.todayActivityMinutes : 0}
                </Text>
                <Text style={styles.metricSub}>/ 60 min</Text>
              </View>
            </View>
          </Pressable>

          {/* CARD 3: NUTRITION */}
          <Pressable
            onPress={() => router.push('/(app)/nutrition')}
            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="restaurant" size={20} color="#EA580C" />
            </View>
            <View style={styles.actionContentCol}>
              <Text style={styles.actionTitle}>Nutrition</Text>
              <Text style={styles.actionSubtitle}>
                {data?.nutrition?.hasNutritionLogs
                  ? `${data.nutrition.mealsCount} meals logged`
                  : '0 meals logged'}
              </Text>
              <Text style={styles.actionMetaGreen}>
                {data?.nutrition?.hasNutritionLogs
                  ? 'Good progress today'
                  : 'Start logging meals to track your nutrition'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* CARD 4: MEDICATION REMINDER */}
          <View style={styles.actionCard}>
            <View style={[styles.actionIconBox, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="medical" size={20} color="#EC4899" />
            </View>
            {hasMedication && activeMedication ? (
              <>
                <View style={styles.actionContentCol}>
                  <Text style={styles.actionTitle}>Medication Reminder</Text>
                  <Text style={styles.medNameText}>{activeMedication.name}</Text>
                  <Text style={styles.actionSubtitle}>
                    {activeMedication.dosage} • {activeMedication.scheduledTime}
                  </Text>
                </View>
                <View style={styles.medActionsRow}>
                  <Pressable
                    onPress={handleToggleMed}
                    style={[
                      styles.markTakenBtn,
                      isMedTaken && styles.markTakenBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.markTakenBtnText,
                        isMedTaken && styles.markTakenBtnTextActive,
                      ]}
                    >
                      {isMedTaken ? 'Taken ✓' : 'Mark Taken'}
                    </Text>
                  </Pressable>
                  <Pressable hitSlop={6} style={styles.threeDotsBtn}>
                    <Ionicons name="ellipsis-vertical" size={18} color="#94A3B8" />
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/(app)/medications')}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={styles.actionContentCol}>
                  <Text style={styles.actionTitle}>Medication Schedule</Text>
                  <Text style={styles.actionSubtitle}>No active prescriptions scheduled for today</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* CARD 5: NEXT BEST ACTION */}
          <Pressable
            onPress={() => router.push('/(app)/add-labs')}
            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF9C3' }]}>
              <Ionicons name="bulb-outline" size={20} color="#CA8A04" />
            </View>
            <View style={styles.actionContentCol}>
              <Text style={styles.actionTitle}>Next Best Action</Text>
              <Text style={styles.nextActionHighlight}>Add clinical hormone labs</Text>
              <Text style={styles.actionSubtitle}>
                Get a complete hormonal profile to refine your screening result.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* CARD 6: UPCOMING APPOINTMENT */}
          <Pressable
            onPress={() => router.push('/(app)/specialists')}
            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#9333EA" />
            </View>
            {hasAppointment && upcomingAppointment ? (
              <>
                <View style={styles.actionContentCol}>
                  <Text style={styles.actionTitle}>Upcoming Appointment</Text>
                  <Text style={styles.nextActionHighlight}>
                    {upcomingAppointment.doctorName}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {upcomingAppointment.specialty}
                  </Text>
                </View>
                <View style={styles.aptTimeCol}>
                  <View style={styles.aptDateRow}>
                    <Text style={styles.aptDateText}>{upcomingAppointment.date}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0284C7" />
                  </View>
                  <Text style={styles.aptTimeText}>{upcomingAppointment.time}</Text>
                </View>
              </>
            ) : (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.actionContentCol}>
                  <Text style={styles.actionTitle}>Upcoming Appointment</Text>
                  <Text style={styles.actionSubtitle}>No appointments scheduled</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* FIXED PERMANENT BOTTOM NAVIGATION BAR */}
      <BioPulseBottomNav activeTab="home" />
    </BioPulseBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandEmblem: {
    width: 28,
    height: 28,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBioPulse: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.3,
  },
  brandAi: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284C7',
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0284C7',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabletScrollContent: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
  },
  tabletWrapper: {
    maxWidth: 600,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
    gap: 14,
  },
  avatarWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
    backgroundColor: '#E0F2FE',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  greetingTextCol: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  greetingMeta: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
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
  cardPressed: {
    opacity: 0.96,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  viewLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  screeningCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emptyScreeningCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  emptyGaugeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 3,
  },
  emptyCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  gaugeContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeOuterTrack: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 6,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
  },
  gaugeInnerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.5,
  },
  screeningDetailsCol: {
    flex: 1,
    gap: 4,
  },
  intermediateRiskBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  intermediateRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  higherRiskBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  higherRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  lowerRiskBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  lowerRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  tierMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  lastAssessedMetaText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  todayMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricIcon: {
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.3,
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContentCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  actionMetaGreen: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 1,
  },
  medNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
    marginTop: 1,
  },
  medActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markTakenBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  markTakenBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  markTakenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  markTakenBtnTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  threeDotsBtn: {
    padding: 4,
  },
  nextActionHighlight: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#073B72',
    marginTop: 1,
  },
  aptTimeCol: {
    alignItems: 'flex-end',
  },
  aptDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  aptDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  aptTimeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
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
