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
const HERO_FEMALE_ART = require('../../assets/female_pathway_hero.png');

export interface FemaleDashboardOverviewProps {
  onNotificationPress?: () => void;
}

/**
 * SCREEN 12: FEMALE HOME / DASHBOARD SCREEN
 * Adheres strictly to visual reference: mbl 17.png & Pastel Health App Home Screens-2.png
 *
 * Implements:
 * - Header: Logo, Women's health tagline, Bell with red dot badge, User avatar
 * - Greeting: Sun icon, "Good afternoon, Ayesha", "Cycle Day 14" pill, "A healthier you, brighter tomorrows ♡"
 * - PCOS Screening Card: 72% Higher Risk, Tier 1, "View Screening" button
 * - Cycle Card: Day 14 of 29, Next period in 12 days, Fertile window Apr 28 - May 2, dot timeline
 * - Today Card: Calories (1,320 / 1,800 kcal), Water (1.6 / 2.5 L), Exercise (45 min activity) with progress bars
 * - Medication Reminder: Metformin 500 mg, Due at 8:00 PM, "Mark as taken" action
 * - Next Best Action: "Book your hormone lab test to better understand your screening result.", "Book Lab Test" button
 * - Permanent Bottom Navigation: Home active in female pink (#F43F7D)
 * - Strict dynamic state sync with useHealthStore()
 */
export const FemaleDashboardOverview: React.FC<FemaleDashboardOverviewProps> = ({
  onNotificationPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    profile,
    screening,
    cycle,
    nutrition,
    water,
    movement,
    medications,
    markMedicationStatus,
    notifications,
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
    return 'Ayesha';
  }, [profile.fullName]);

  // Active female medication reminder
  const activeMedication = useMemo(() => {
    const med = medications.find((m) => m.pathway === 'female' || m.pathway === 'all');
    return med || medications[0];
  }, [medications]);

  const isMedTaken = activeMedication?.status === 'taken';

  const handleToggleMed = useCallback(() => {
    if (!activeMedication) return;
    const newStatus = isMedTaken ? 'pending' : 'taken';
    markMedicationStatus(activeMedication.id, newStatus);
  }, [activeMedication, isMedTaken, markMedicationStatus]);

  // Calorie percentage
  const calPercent = Math.min(100, Math.round((nutrition.caloriesConsumed / nutrition.calorieTarget) * 100));
  const waterPercent = Math.min(100, Math.round((water.consumedLiters / water.targetLiters) * 100));
  const exercisePercent = Math.min(100, Math.round((movement.todayActivityMinutes / movement.targetMinutes) * 100));

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
            <Text style={styles.brandSubtitle}>WOMEN'S HEALTH, BRIGHTER TOMORROWS</Text>
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
              source={HERO_FEMALE_ART}
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
            tintColor={BioPulseColors.femaleAccent}
          />
        }
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* Greeting Hero Section */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingLeft}>
              <View style={styles.sunRow}>
                <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
                <Text style={styles.greetingTimeText}>Good afternoon,</Text>
              </View>
              <Text style={styles.greetingNameText}>{firstName}</Text>
              <Pressable
                onPress={() => router.push('/(app)/cycle-tracking')}
                style={styles.cycleDayPill}
              >
                <Ionicons name="calendar-outline" size={14} color="#F43F7D" />
                <Text style={styles.cycleDayPillText}>
                  Cycle Day {cycle.currentCycleDay}
                </Text>
              </Pressable>
            </View>

            <View style={styles.greetingRight}>
              <Text style={styles.heroQuoteText}>
                A healthier{'\n'}you, brighter{'\n'}tomorrows ♡
              </Text>
            </View>
          </View>

          {/* CARD 1: PCOS Screening */}
          <Pressable
            onPress={() => router.push('/(app)/screening')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#FFF2F7' }]}>
                  <Ionicons name="fitness-outline" size={20} color="#F43F7D" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>PCOS Screening</Text>
                  <View style={styles.riskValueRow}>
                    <Text style={styles.riskPercentText}>{screening.probabilityPercent}%</Text>
                    <Text style={styles.riskLabelText}> {screening.riskBand}</Text>
                  </View>
                  <Text style={styles.cardMetaText}>
                    Tier {screening.tier} • Last assessed {screening.lastAssessedDate}
                  </Text>
                </View>
              </View>

              <View style={styles.cardHeaderRight}>
                <Pressable
                  onPress={() => router.push('/(app)/screening')}
                  style={styles.viewScreeningBtn}
                >
                  <Text style={styles.viewScreeningBtnText}>View Screening</Text>
                </Pressable>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </View>
          </Pressable>

          {/* CARD 2: Cycle */}
          <Pressable
            onPress={() => router.push('/(app)/cycle-tracking')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#E6F7F8' }]}>
                  <Ionicons name="calendar" size={20} color="#0E9EAA" />
                </View>
                <Text style={styles.cardTitle}>Cycle</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <View style={styles.cycleInfoGrid}>
              <View style={styles.cycleCol}>
                <Text style={styles.cycleColLabel}>Current day</Text>
                <Text style={styles.cycleColValue}>{cycle.currentCycleDay}</Text>
              </View>

              <View style={styles.cycleColDivider} />

              <View style={styles.cycleCol}>
                <Text style={styles.cycleColLabel}>Next period in</Text>
                <Text style={styles.cycleColValue}>{cycle.nextPeriodDaysRemaining} days</Text>
              </View>

              <View style={styles.cycleColDivider} />

              <View style={styles.cycleCol}>
                <Text style={styles.cycleColLabel}>Fertile window</Text>
                <Text style={[styles.cycleColValue, { color: '#0E9EAA', fontSize: 13 }]}>
                  Apr 28 – May 2
                </Text>
              </View>
            </View>

            {/* Cycle Dot Timeline */}
            <View style={styles.dotTimeline}>
              <View style={styles.dotsRow}>
                {/* Period dots (pink) */}
                <View style={[styles.miniDot, styles.pinkDot]} />
                <View style={[styles.miniDot, styles.pinkDot]} />
                <View style={[styles.miniDot, styles.pinkDot]} />
                <View style={[styles.miniDot, styles.pinkDot]} />
                <View style={[styles.miniDot, styles.pinkDot]} />

                {/* Day 14 active pill */}
                <View style={styles.activeDayCircle}>
                  <Text style={styles.activeDayCircleText}>{cycle.currentCycleDay}</Text>
                </View>

                {/* Normal dots */}
                <View style={[styles.miniDot, styles.neutralDot]} />
                <View style={[styles.miniDot, styles.neutralDot]} />
                <View style={[styles.miniDot, styles.neutralDot]} />

                {/* Fertile window dots (teal) */}
                <View style={[styles.miniDot, styles.tealDot]} />
                <View style={[styles.miniDot, styles.tealDot]} />
                <View style={[styles.miniDot, styles.tealDot]} />
                <View style={[styles.miniDot, styles.tealDot]} />
              </View>

              <View style={styles.timelineLabels}>
                <Text style={styles.timelineLabelPink}>Period</Text>
                <Text style={styles.timelineLabelTeal}>Fertile window</Text>
              </View>
            </View>
          </Pressable>

          {/* CARD 3: Today (Calories, Water, Exercise) */}
          <Pressable
            onPress={() => router.push('/(app)/track')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#FFF2F7' }]}>
                  <Ionicons name="leaf-outline" size={20} color="#F43F7D" />
                </View>
                <Text style={styles.cardTitle}>Today</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <View style={styles.todayMetricsRow}>
              {/* Calories */}
              <Pressable
                onPress={() => router.push('/(app)/nutrition')}
                style={styles.metricItem}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="restaurant-outline" size={16} color="#F43F7D" />
                  <Text style={styles.metricLabel}>Calories</Text>
                </View>
                <Text style={styles.metricValue}>
                  {nutrition.caloriesConsumed.toLocaleString()}
                  <Text style={styles.metricTarget}> / {nutrition.calorieTarget.toLocaleString()} kcal</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${calPercent}%`, backgroundColor: '#F43F7D' }]} />
                </View>
              </Pressable>

              {/* Water */}
              <Pressable
                onPress={() => router.push('/(app)/water-log')}
                style={styles.metricItem}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="water-outline" size={16} color="#0E9EAA" />
                  <Text style={styles.metricLabel}>Water</Text>
                </View>
                <Text style={styles.metricValue}>
                  {water.consumedLiters}
                  <Text style={styles.metricTarget}> / {water.targetLiters} L</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${waterPercent}%`, backgroundColor: '#0E9EAA' }]} />
                </View>
              </Pressable>

              {/* Exercise */}
              <Pressable
                onPress={() => router.push('/(app)/movement')}
                style={styles.metricItem}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="walk-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.metricLabel}>Exercise</Text>
                </View>
                <Text style={styles.metricValue}>
                  {movement.todayActivityMinutes}
                  <Text style={styles.metricTarget}> min activity</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${exercisePercent}%`, backgroundColor: '#8B5CF6' }]} />
                </View>
              </Pressable>
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
                  <View style={[styles.cardIconBox, { backgroundColor: '#EBF8F9' }]}>
                    <Ionicons name="medkit-outline" size={20} color="#0E9EAA" />
                  </View>
                  <Text style={styles.cardTitle}>Medication Reminder</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>

              <View style={styles.medContentRow}>
                <View style={styles.medIconBox}>
                  <Ionicons
                    name={isMedTaken ? 'checkmark-circle' : 'notifications'}
                    size={18}
                    color={isMedTaken ? '#10B981' : '#F43F7D'}
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
                <View style={[styles.cardIconBox, { backgroundColor: '#FFF2F7' }]}>
                  <Ionicons name="disc-outline" size={20} color="#F43F7D" />
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
    backgroundColor: '#FFF7F9',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#FFF7F9',
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
    color: '#F43F7D',
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
    backgroundColor: '#F43F7D',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F43F7D',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  greetingLeft: {
    flex: 1,
  },
  sunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginTop: 2,
  },
  cycleDayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  cycleDayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F43F7D',
  },
  greetingRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  heroQuoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8A9BA8',
    textAlign: 'right',
    lineHeight: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFF0F5',
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
  riskValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  riskPercentText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F43F7D',
  },
  riskLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F43F7D',
  },
  cardMetaText: {
    fontSize: 11,
    color: '#8A9BA8',
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewScreeningBtn: {
    backgroundColor: '#F43F7D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  viewScreeningBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cycleInfoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: '#FAFCFD',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cycleCol: {
    flex: 1,
    alignItems: 'center',
  },
  cycleColLabel: {
    fontSize: 11,
    color: '#8A9BA8',
    marginBottom: 4,
  },
  cycleColValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  cycleColDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  dotTimeline: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinkDot: {
    backgroundColor: '#F43F7D',
  },
  tealDot: {
    backgroundColor: '#0E9EAA',
  },
  neutralDot: {
    backgroundColor: '#E2E8F0',
  },
  activeDayCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F43F7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDayCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 6,
  },
  timelineLabelPink: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F43F7D',
  },
  timelineLabelTeal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0E9EAA',
  },
  todayMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#FAFCFD',
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
  medContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FAFCFD',
    padding: 10,
    borderRadius: 14,
    gap: 10,
  },
  medIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE8F0',
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
    backgroundColor: '#FFE8F0',
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
    color: '#F43F7D',
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
    backgroundColor: '#F43F7D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  nbaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
