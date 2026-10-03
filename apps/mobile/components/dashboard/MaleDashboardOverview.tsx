import React, { useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../auth/AuthBackgroundFoliage';
import { useHealthStore } from '../../store/healthStore';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../navigation';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');
const HERO_MALE_ART = require('../../assets/male_pathway_hero.png');

export interface MaleDashboardOverviewProps {
  onNotificationPress?: () => void;
}

/**
 * SCREEN 17: MALE HOME / DASHBOARD SCREEN
 * Adheres strictly to visual reference: BioPulse AI Health Dashboard.png & Pastel Health App Home Screens-2.png
 *
 * Implements:
 * - Header: Logo, Men's Health tagline, Bell with dot badge, Male avatar
 * - Greeting: "Good afternoon, Adrian", "Stronger health today for a stronger tomorrow.", "Hypogonadism Pathway >"
 * - Card 1: Hypogonadism Screening (26% circle gauge, Intermediate Risk, Tier 1, "View Screening" CTA)
 * - Card 2: Today (45 min Activity, 1,780 / 2,200 kcal, 1.8 / 2.5 L Hydration)
 * - Card 3: Nutrition (Protein 82 / 120 g, Balanced lunch logged with checkmark)
 * - Card 4: Medication Reminder (Testosterone gel, Due at 8:00 PM, "Mark as taken" CTA)
 * - Card 5: Next Best Action ("Book your hormone lab test...", "Book Lab Test" CTA)
 * - Card 6: Upcoming Appointment (Dr. Ahmed Khan, Tomorrow 4:30 PM, "View" CTA)
 * - Bottom Navigation: Home active in male blue (#0868B9)
 * - Strict dynamic state sync with useHealthStore()
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

  const [refreshing, setRefreshing] = React.useState(false);

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
    const med = medications.find((m) => m.pathway === 'male' || m.pathway === 'all');
    return med || medications[0];
  }, [medications]);

  const isMedTaken = activeMedication?.status === 'taken';

  const handleToggleMed = useCallback(() => {
    if (!activeMedication) return;
    const newStatus = isMedTaken ? 'pending' : 'taken';
    markMedicationStatus(activeMedication.id, newStatus);
  }, [activeMedication, isMedTaken, markMedicationStatus]);

  // Upcoming appointment
  const upcomingAppointment = useMemo(() => {
    return appointments.find((a) => a.status === 'Upcoming');
  }, [appointments]);

  // Metric percentages
  const activityPercent = Math.min(100, Math.round((movement.todayActivityMinutes / movement.targetMinutes) * 100));
  const caloriePercent = Math.min(100, Math.round((nutrition.caloriesConsumed / nutrition.calorieTarget) * 100));
  const waterPercent = Math.min(100, Math.round((water.consumedLiters / water.targetLiters) * 100));
  const proteinPercent = Math.min(100, Math.round((nutrition.proteinConsumed / nutrition.proteinTarget) * 100));

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.brandRow}>
          <Image source={HEART_EMBLEM} style={styles.emblem} resizeMode="contain" />
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitleNavy}>BioPulse</Text>
              <Text style={styles.brandTitleAccent}> AI</Text>
            </View>
            <Text style={styles.brandSubtitle}>MEN'S HEALTH</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            onPress={() => {
              if (onNotificationPress) {
                onNotificationPress();
              } else {
                router.push('/(app)/notifications');
              }
            }}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={21} color="#073B72" />
            <View style={styles.notifBadge} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/profile')}
            style={styles.avatarBtn}
            accessibilityRole="button"
            accessibilityLabel="User Profile"
          >
            <Image
              source={HERO_MALE_ART}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BioPulseColors.malePrimary}
          />
        }
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* Greeting Hero Section */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingLeft}>
              <Text style={styles.greetingTimeText}>Good afternoon,</Text>
              <Text style={styles.greetingNameText}>{firstName}</Text>
              <Text style={styles.taglineText}>
                Stronger health today for a stronger tomorrow.
              </Text>
              <Pressable
                onPress={() => router.push('/pathway-selection')}
                style={styles.pathwayPill}
              >
                <Ionicons name="male" size={14} color="#0868B9" />
                <Text style={styles.pathwayPillText}>Hypogonadism Pathway</Text>
                <Ionicons name="chevron-forward" size={12} color="#0868B9" />
              </Pressable>
            </View>
          </View>

          {/* CARD 1: Hypogonadism Screening */}
          <Pressable
            onPress={() => router.push('/(app)/screening')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EAF5FD' }]}>
                  <Ionicons name="clipboard-outline" size={20} color="#0868B9" />
                </View>
                <Text style={styles.cardTitle}>Hypogonadism Screening</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <View style={styles.screeningCardBody}>
              {/* Circular Gauge */}
              <View style={styles.circleGauge}>
                <Text style={styles.circleGaugeText}>{screening.probabilityPercent}%</Text>
              </View>

              <View style={styles.screeningDetails}>
                <Text style={styles.screeningRiskText}>{screening.riskBand}</Text>
                <Text style={styles.screeningMetaText}>
                  Tier {screening.tier} • Last assessed {screening.lastAssessedDate}
                </Text>
              </View>

              <Pressable
                onPress={() => router.push('/(app)/screening')}
                style={styles.viewScreeningBtn}
              >
                <Text style={styles.viewScreeningBtnText}>View Screening</Text>
              </Pressable>
            </View>
          </Pressable>

          {/* CARD 2: Today (Activity, Calories, Hydration) */}
          <Pressable
            onPress={() => router.push('/(app)/track')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EAF5FD' }]}>
                  <Ionicons name="bar-chart-outline" size={20} color="#0868B9" />
                </View>
                <Text style={styles.cardTitle}>Today</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <View style={styles.todayMetricsRow}>
              {/* Activity */}
              <Pressable
                onPress={() => router.push('/(app)/movement')}
                style={styles.metricItem}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="fitness-outline" size={16} color="#0868B9" />
                  <Text style={styles.metricLabel}>Activity</Text>
                </View>
                <Text style={styles.metricValue}>
                  {movement.todayActivityMinutes}
                  <Text style={styles.metricTarget}> min</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${activityPercent}%`, backgroundColor: '#0868B9' }]} />
                </View>
              </Pressable>

              {/* Calories */}
              <Pressable
                onPress={() => router.push('/(app)/nutrition')}
                style={styles.metricItem}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="restaurant-outline" size={16} color="#0E9EAA" />
                  <Text style={styles.metricLabel}>Calories</Text>
                </View>
                <Text style={styles.metricValue}>
                  {nutrition.caloriesConsumed.toLocaleString()}
                  <Text style={styles.metricTarget}> / {nutrition.calorieTarget.toLocaleString()} kcal</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${caloriePercent}%`, backgroundColor: '#0E9EAA' }]} />
                </View>
              </Pressable>

              {/* Hydration */}
              <Pressable
                onPress={() => router.push('/(app)/water-log')}
                style={styles.metricItem}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="water-outline" size={16} color="#2196E3" />
                  <Text style={styles.metricLabel}>Hydration</Text>
                </View>
                <Text style={styles.metricValue}>
                  {water.consumedLiters}
                  <Text style={styles.metricTarget}> / {water.targetLiters} L</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${waterPercent}%`, backgroundColor: '#2196E3' }]} />
                </View>
              </Pressable>
            </View>
          </Pressable>

          {/* CARD 3: Nutrition Summary */}
          <Pressable
            onPress={() => router.push('/(app)/nutrition')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#E6F8F0' }]}>
                  <Ionicons name="leaf-outline" size={20} color="#10B981" />
                </View>
                <Text style={styles.cardTitle}>Nutrition</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <View style={styles.nutritionContentRow}>
              <View style={styles.proteinCol}>
                <View style={styles.metricHeader}>
                  <Ionicons name="restaurant" size={15} color="#10B981" />
                  <Text style={styles.metricLabel}>Protein</Text>
                </View>
                <Text style={styles.metricValue}>
                  {nutrition.proteinConsumed}
                  <Text style={styles.metricTarget}> / {nutrition.proteinTarget} g</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${proteinPercent}%`, backgroundColor: '#10B981' }]} />
                </View>
              </View>

              <View style={styles.mealLoggedBadge}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#10B981" />
                </View>
                <Text style={styles.mealLoggedText}>Balanced lunch logged</Text>
              </View>
            </View>
          </Pressable>

          {/* CARD 4: Medication Reminder */}
          {activeMedication && (
            <Pressable
              onPress={() => router.push('/(app)/medications')}
              style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleWithIcon}>
                  <View style={[styles.cardIconBox, { backgroundColor: '#EAF5FD' }]}>
                    <Ionicons name="medkit-outline" size={20} color="#0868B9" />
                  </View>
                  <Text style={styles.cardTitle}>Medication Reminder</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>

              <View style={styles.medContentRow}>
                <View style={styles.medIconBox}>
                  <Ionicons
                    name={isMedTaken ? 'checkmark-circle' : 'time-outline'}
                    size={18}
                    color={isMedTaken ? '#10B981' : '#0868B9'}
                  />
                </View>

                <View style={styles.medDetails}>
                  <Text style={styles.medNameText}>
                    {activeMedication.name} {activeMedication.dosage}
                  </Text>
                  <Text style={styles.medTimeText}>
                    Due at {activeMedication.scheduledTime} • {activeMedication.instructions}
                  </Text>
                </View>

                <Pressable
                  onPress={handleToggleMed}
                  style={[
                    styles.medActionBtn,
                    isMedTaken && styles.medActionBtnTaken,
                  ]}
                >
                  <Text
                    style={[
                      styles.medActionBtnText,
                      isMedTaken && styles.medActionBtnTextTaken,
                    ]}
                  >
                    {isMedTaken ? 'Taken ✓' : 'Mark as taken'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          )}

          {/* CARD 5: Next Best Action */}
          <Pressable
            onPress={() => router.push('/(app)/tier-progress')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EAF5FD' }]}>
                  <Ionicons name="bulb-outline" size={20} color="#0868B9" />
                </View>
                <Text style={styles.cardTitle}>Next Best Action</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <View style={styles.nbaContentRow}>
              <Text style={styles.nbaDescription}>
                Book your hormone lab test to better understand your screening result.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/add-labs')}
                style={styles.nbaBtn}
              >
                <Text style={styles.nbaBtnText}>Book Lab Test</Text>
              </Pressable>
            </View>
          </Pressable>

          {/* CARD 6: Upcoming Appointment */}
          {upcomingAppointment && (
            <Pressable
              onPress={() => router.push('/(app)/appointments')}
              style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleWithIcon}>
                  <View style={[styles.cardIconBox, { backgroundColor: '#EAF5FD' }]}>
                    <Ionicons name="calendar-outline" size={20} color="#0868B9" />
                  </View>
                  <Text style={styles.cardTitle}>Upcoming Appointment</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>

              <View style={styles.aptContentRow}>
                <View style={styles.docAvatarCircle}>
                  <Ionicons name="person" size={20} color="#0868B9" />
                </View>

                <View style={styles.aptDetails}>
                  <Text style={styles.docNameText}>
                    {upcomingAppointment.doctorName} • {upcomingAppointment.specialty}
                  </Text>
                  <Text style={styles.aptTimeText}>
                    {upcomingAppointment.date}, {upcomingAppointment.time}
                  </Text>
                </View>

                <Pressable
                  onPress={() => router.push('/(app)/appointments')}
                  style={styles.aptViewBtn}
                >
                  <Text style={styles.aptViewBtnText}>View</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Navigation */}
      <BioPulseBottomNav activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F9FD',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#F4F9FD',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblem: {
    width: 34,
    height: 34,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleNavy: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.3,
  },
  brandTitleAccent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0868B9',
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#55718F',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0868B9',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0868B9',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: 14,
  },
  tabletContainer: {
    maxWidth: 600,
  },
  greetingSection: {
    marginVertical: 4,
  },
  greetingLeft: {
    gap: 2,
  },
  greetingTimeText: {
    fontSize: 14,
    color: '#55718F',
    fontWeight: '500',
  },
  greetingNameText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.5,
  },
  taglineText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pathwayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF5FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pathwayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0868B9',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0868B9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF6FD',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  screeningCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  circleGauge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 5,
    borderColor: '#0868B9',
    borderTopColor: '#2196E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleGaugeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#073B72',
  },
  screeningDetails: {
    flex: 1,
  },
  screeningRiskText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0868B9',
  },
  screeningMetaText: {
    fontSize: 11,
    color: '#8A9BA8',
    marginTop: 2,
  },
  viewScreeningBtn: {
    backgroundColor: '#0868B9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  viewScreeningBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  todayMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#FAFCFE',
    borderRadius: 12,
    padding: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#55718F',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
  },
  metricTarget: {
    fontSize: 10,
    fontWeight: '400',
    color: '#8A9BA8',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  nutritionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  proteinCol: {
    flex: 1,
  },
  mealLoggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLoggedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  medContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FAFCFE',
    padding: 10,
    borderRadius: 14,
    gap: 10,
  },
  medIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medDetails: {
    flex: 1,
  },
  medNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
  },
  medTimeText: {
    fontSize: 11,
    color: '#8A9BA8',
    marginTop: 1,
  },
  medActionBtn: {
    backgroundColor: '#EAF5FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  medActionBtnTaken: {
    backgroundColor: '#E6F9F0',
  },
  medActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0868B9',
  },
  medActionBtnTextTaken: {
    color: '#10B981',
  },
  nbaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  nbaDescription: {
    flex: 1,
    fontSize: 12,
    color: '#55718F',
    lineHeight: 16,
  },
  nbaBtn: {
    backgroundColor: '#0868B9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  nbaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aptContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FAFCFE',
    padding: 10,
    borderRadius: 14,
    gap: 10,
  },
  docAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptDetails: {
    flex: 1,
  },
  docNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
  },
  aptTimeText: {
    fontSize: 11,
    color: '#8A9BA8',
    marginTop: 1,
  },
  aptViewBtn: {
    backgroundColor: '#EAF5FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  aptViewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0868B9',
  },
});
