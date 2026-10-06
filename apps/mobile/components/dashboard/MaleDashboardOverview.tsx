import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../common/BioPulseBackground';
import { useHealthStore } from '../../store/healthStore';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../navigation';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');
const HERO_MALE_ART = require('../../assets/male_pathway_hero.png');

export interface MaleDashboardOverviewProps {
  onNotificationPress?: () => void;
}

/**
 * SCREEN 17: MALE HOME DASHBOARD
 *
 * Strict visual match to Screenshot 17:
 * - Top Bar: BioPulse AI brand lockup on left, Bell notification icon on right
 * - Greeting Hero: Male avatar illustration on left, "Good afternoon, Adrian",
 *   "Here's your health summary for today."
 * - Card 1: Hypogonadism Screening:
 *   - Circular ring gauge with "38%"
 *   - Right: [ Intermediate Risk ] amber badge, "Tier 1 • Questionnaire", "Last assessed 12 Mar 2025"
 *   - "View" link in top right
 * - Card 2: Today's Progress:
 *   - Green leaf icon
 *   - 3 columns with dividers:
 *     - Nutrition: fork & knife, 1,620 / 2,200 kcal
 *     - Water: drop, 1.8 / 2.5 L
 *     - Activity: runner, 35 / 60 min
 * - Card 3: Nutrition:
 *   - Orange restaurant icon, "Nutrition", "2 meals logged • Good progress today", chevron >
 * - Card 4: Medication Reminder:
 *   - Pink pill icon, "Medication Reminder", "Testosterone Gel", "50 mg • 8:00 AM",
 *     [ Mark Taken ] outline button, 3 dots ⋮
 * - Card 5: Next Best Action:
 *   - Amber lightbulb icon, "Next Best Action", "Add clinical hormone labs",
 *     "Get a complete hormonal profile to refine your screening result.", chevron >
 * - Card 6: Upcoming Appointment:
 *   - Purple calendar icon, "Upcoming Appointment", "Dr. Ahmed Khan", "Endocrinologist",
 *     "15 Mar 2025 > \n10:00 AM"
 * - Permanent Bottom Navigation: 5 tabs with Home active in royal blue (#0284C7)
 */
export const MaleDashboardOverview: React.FC<MaleDashboardOverviewProps> = ({
  onNotificationPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    profile,
    screening,
    nutrition,
    water,
    movement,
    medications,
    markMedicationStatus,
    appointments,
  } = useHealthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [medTakenLocal, setMedTakenLocal] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const firstName = useMemo(() => {
    if (profile.fullName && profile.fullName.trim().length > 0) {
      return profile.fullName.trim().split(' ')[0];
    }
    return 'Adrian';
  }, [profile.fullName]);

  // Active male medication reminder
  const activeMedication = useMemo(() => {
    const med = medications.find((m) => m.pathway === 'male');
    return med || medications[0];
  }, [medications]);

  const isMedTaken = activeMedication?.status === 'taken' || medTakenLocal;

  const handleToggleMed = useCallback(() => {
    if (activeMedication) {
      const newStatus = isMedTaken ? 'pending' : 'taken';
      markMedicationStatus(activeMedication.id, newStatus);
    }
    setMedTakenLocal((prev) => !prev);
  }, [activeMedication, isMedTaken, markMedicationStatus]);

  // Upcoming appointment
  const upcomingAppointment = useMemo(() => {
    return appointments.find((a) => a.status === 'Upcoming');
  }, [appointments]);

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 12);

  // Derive probability percentage
  const probPercent = screening.probabilityPercent || 38;

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
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0284C7"
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
            onPress={() => router.push('/male-screening-result')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleGroup}>
                <Ionicons name="person-outline" size={18} color="#0284C7" />
                <Text style={styles.cardTitle}>Hypogonadism Screening</Text>
              </View>
              <Pressable
                onPress={() => router.push('/male-screening-result')}
                hitSlop={8}
              >
                <Text style={styles.viewLinkText}>View</Text>
              </Pressable>
            </View>

            <View style={styles.screeningCardBody}>
              {/* Circular Gauge Ring */}
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeOuterTrack}>
                  <View style={styles.gaugeInnerCircle}>
                    <Text style={styles.gaugePercentText}>{probPercent}%</Text>
                  </View>
                </View>
              </View>

              {/* Screening Details */}
              <View style={styles.screeningDetailsCol}>
                <View style={styles.intermediateRiskBadge}>
                  <Text style={styles.intermediateRiskText}>Intermediate Risk</Text>
                </View>
                <Text style={styles.tierMetaText}>Tier 1 • Questionnaire</Text>
                <Text style={styles.lastAssessedMetaText}>Last assessed 12 Mar 2025</Text>
              </View>
            </View>
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
                <Text style={styles.metricValue}>1,620</Text>
                <Text style={styles.metricSub}>/ 2,200 kcal</Text>
              </View>

              <View style={styles.verticalDivider} />

              {/* Column 2: Water */}
              <View style={styles.metricColumn}>
                <Ionicons name="water-outline" size={18} color="#0284C7" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Water</Text>
                <Text style={styles.metricValue}>1.8</Text>
                <Text style={styles.metricSub}>/ 2.5 L</Text>
              </View>

              <View style={styles.verticalDivider} />

              {/* Column 3: Activity */}
              <View style={styles.metricColumn}>
                <Ionicons name="fitness-outline" size={18} color="#8B5CF6" style={styles.metricIcon} />
                <Text style={styles.metricLabel}>Activity</Text>
                <Text style={styles.metricValue}>35</Text>
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
              <Text style={styles.actionSubtitle}>2 meals logged</Text>
              <Text style={styles.actionMetaGreen}>Good progress today</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* CARD 4: MEDICATION REMINDER */}
          <View style={styles.actionCard}>
            <View style={[styles.actionIconBox, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="medical" size={20} color="#EC4899" />
            </View>
            <View style={styles.actionContentCol}>
              <Text style={styles.actionTitle}>Medication Reminder</Text>
              <Text style={styles.medNameText}>Testosterone Gel</Text>
              <Text style={styles.actionSubtitle}>50 mg • 8:00 AM</Text>
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
            <View style={styles.actionContentCol}>
              <Text style={styles.actionTitle}>Upcoming Appointment</Text>
              <Text style={styles.nextActionHighlight}>
                {upcomingAppointment?.doctorName || 'Dr. Ahmed Khan'}
              </Text>
              <Text style={styles.actionSubtitle}>
                {upcomingAppointment?.specialty || 'Endocrinologist'}
              </Text>
            </View>
            <View style={styles.aptTimeCol}>
              <View style={styles.aptDateRow}>
                <Text style={styles.aptDateText}>
                  {upcomingAppointment ? '15 Mar 2025' : '15 Mar 2025'}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#0284C7" />
              </View>
              <Text style={styles.aptTimeText}>
                {upcomingAppointment?.time || '10:00 AM'}
              </Text>
            </View>
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
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    alignItems: 'center',
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 460,
    gap: 12,
  },
  tabletWrapper: {
    maxWidth: 580,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    backgroundColor: '#EFF6FF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  greetingTextCol: {
    flex: 1,
    gap: 1,
  },
  greetingSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#073B72',
    letterSpacing: -0.3,
  },
  greetingMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
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
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeOuterTrack: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 7,
    borderColor: '#0284C7',
    borderLeftColor: '#E2E8F0',
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  gaugeInnerCircle: {
    transform: [{ rotate: '45deg' }],
  },
  gaugePercentText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073B72',
  },
  screeningDetailsCol: {
    flex: 1,
    gap: 4,
  },
  intermediateRiskBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  intermediateRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  tierMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  lastAssessedMetaText: {
    fontSize: 12,
    color: '#64748B',
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
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073B72',
  },
  metricSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContentCol: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  actionMetaGreen: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  medNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  medActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markTakenBtn: {
    borderWidth: 1.5,
    borderColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  markTakenBtnActive: {
    backgroundColor: '#0284C7',
  },
  markTakenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  markTakenBtnTextActive: {
    color: '#FFFFFF',
  },
  threeDotsBtn: {
    padding: 4,
  },
  nextActionHighlight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  aptTimeCol: {
    alignItems: 'flex-end',
    gap: 2,
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
    fontSize: 12,
    color: '#64748B',
  },
});
