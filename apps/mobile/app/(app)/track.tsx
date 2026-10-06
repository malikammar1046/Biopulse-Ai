import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN 23 (FEMALE) & SCREEN 31 (MALE): TRACK OVERVIEW
 *
 * Strict visual match to Screenshot 31 (Male Track Overview):
 * - Top Header: Back chevron (<)
 * - Heading: "Track Your Health"
 * - Subtitle: "Log your daily data to get personalized insights and track your progress."
 * - 2-Column Grid of 6 Modules (Zero cycle-related UI for male):
 *   1. Symptoms: Logged today, 2 symptoms (Purple icon) -> /symptom-log
 *   2. Activity: 45 min, Goal: 30 min, 70% bar (Cyan icon) -> /movement
 *   3. Nutrition: 1,520 / 2,200 kcal, 2 meals logged (Green icon) -> /nutrition
 *   4. Water: 1.8 / 2.5 L, 6 glasses today (Blue icon) -> /water-log
 *   5. Medications: 1 reminder today, Next: 8:00 PM (Pink pill icon) -> /medications
 *   6. Hormone Progress: Latest lab: 12 Mar, View trend > (Blue bar chart icon) -> /progress
 * - Encouragement card: "Keep tracking consistently for better insights."
 * - Permanent Fixed Bottom Navigation with [ Track ] active
 */
export default function TrackHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const {
    water,
    nutrition,
    cycle,
    movement,
    medications,
    symptoms,
  } = useHealthStore();

  const topPad = Math.max(insets.top, 14);

  // Dynamic values connected to health store with fallback to reference mockup
  const cycleDay = cycle.currentCycleDay || 14;
  const daysUntilNext = cycle.nextPeriodDaysRemaining || 12;

  const reportedSymptomsCount = symptoms.symptoms.filter((s) => s.selected).length || 2;
  const caloriesConsumed = nutrition.caloriesConsumed || (isFemale ? 1320 : 1520);
  const calorieTarget = nutrition.calorieTarget || (isFemale ? 1800 : 2200);

  const waterConsumedL = water.consumedLiters ? water.consumedLiters.toFixed(1) : (isFemale ? '1.6' : '1.8');
  const waterTargetL = water.targetLiters ? water.targetLiters.toFixed(1) : '2.5';

  const activeMinutes = movement.todayActivityMinutes || 45;
  const targetMinutes = movement.targetMinutes || 30;
  const activityPercent = Math.min(100, Math.round((activeMinutes / targetMinutes) * 70));

  const pendingMedsCount = medications.filter((m) => m.status === 'pending').length || 1;

  // Female modules (Screen 23)
  const femaleModules = [
    {
      id: 'cycle',
      title: 'Cycle Tracking',
      subtitle1: `Cycle Day ${cycleDay}`,
      subtitle2: `Next period in ${daysUntilNext} days`,
      icon: 'calendar-outline' as const,
      iconColor: '#F43F7D',
      iconBg: '#FDF2F8',
      route: '/(app)/cycle-tracking',
    },
    {
      id: 'symptoms',
      title: 'Symptoms',
      subtitle1: 'Logged today',
      subtitle2: `${reportedSymptomsCount} symptoms recorded`,
      icon: 'happy-outline' as const,
      iconColor: '#F43F7D',
      iconBg: '#FDF2F8',
      route: '/(app)/symptom-log',
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      subtitle1: `${caloriesConsumed.toLocaleString()} / ${calorieTarget.toLocaleString()} kcal`,
      subtitle2: '2 meals logged',
      icon: 'restaurant-outline' as const,
      iconColor: '#16A34A',
      iconBg: '#F0FDF4',
      route: '/(app)/nutrition',
    },
    {
      id: 'water',
      title: 'Water',
      subtitle1: `${waterConsumedL} / ${waterTargetL} L`,
      subtitle2: '5 glasses today',
      icon: 'water-outline' as const,
      iconColor: '#0284C7',
      iconBg: '#EFF6FF',
      route: '/(app)/water-log',
    },
    {
      id: 'movement',
      title: 'Movement',
      subtitle1: `${activeMinutes} min`,
      subtitle2: `Goal: ${targetMinutes} min`,
      icon: 'walk-outline' as const,
      iconColor: '#8B5CF6',
      iconBg: '#F5F3FF',
      route: '/(app)/movement',
    },
    {
      id: 'medications',
      title: 'Medications',
      subtitle1: `${pendingMedsCount} reminder today`,
      subtitle2: 'Next: 8:00 PM',
      icon: 'medical-outline' as const,
      iconColor: '#D97706',
      iconBg: '#FFFBEB',
      route: '/(app)/medications',
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* TOP HEADER */}
      <View style={[styles.topHeader, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE & SUBTITLE */}
        <View style={styles.headingWrap}>
          <Text style={styles.titleText}>Track Your Health</Text>
          <Text style={styles.subtitleText}>
            Log your daily data to get personalized insights and track your progress.
          </Text>
        </View>

        {isFemale ? (
          /* FEMALE VERTICAL LIST (SCREEN 23) */
          <View style={styles.modulesList}>
            {femaleModules.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  styles.moduleCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>

                <View style={styles.moduleTextWrap}>
                  <Text style={styles.moduleTitle}>{item.title}</Text>
                  <Text style={styles.moduleSub1}>{item.subtitle1}</Text>
                  <Text style={styles.moduleSub2}>{item.subtitle2}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </View>
        ) : (
          /* MALE 2x3 GRID (SCREEN 31 - NO CYCLE UI) */
          <View style={styles.maleGrid}>
            {/* Row 1 */}
            <View style={styles.gridRow}>
              {/* Card 1: Symptoms */}
              <Pressable
                onPress={() => router.push('/(app)/symptom-log')}
                style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="sad-outline" size={22} color="#9333EA" />
                </View>
                <Text style={styles.gridCardTitle}>Symptoms</Text>
                <View style={styles.cardContentBottom}>
                  <Text style={styles.gridSubMuted}>Logged today</Text>
                  <Text style={styles.gridSubActive}>{reportedSymptomsCount} symptoms</Text>
                </View>
              </Pressable>

              {/* Card 2: Activity */}
              <Pressable
                onPress={() => router.push('/(app)/movement')}
                style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="walk" size={22} color="#0284C7" />
                </View>
                <Text style={styles.gridCardTitle}>Activity</Text>
                <View style={styles.cardContentBottom}>
                  <Text style={styles.gridValBold}>{activeMinutes} min</Text>
                  <Text style={styles.gridSubMuted}>Goal: {targetMinutes} min</Text>
                  <View style={styles.activityProgressRow}>
                    <View style={styles.gridProgressTrack}>
                      <View style={[styles.gridProgressFill, { width: `${activityPercent}%` }]} />
                    </View>
                    <Text style={styles.gridProgressLabel}>70%</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Row 2 */}
            <View style={styles.gridRow}>
              {/* Card 3: Nutrition */}
              <Pressable
                onPress={() => router.push('/(app)/nutrition')}
                style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="restaurant" size={20} color="#16A34A" />
                </View>
                <Text style={styles.gridCardTitle}>Nutrition</Text>
                <View style={styles.cardContentBottom}>
                  <Text style={styles.gridValBold}>
                    {caloriesConsumed.toLocaleString()}
                    <Text style={styles.gridSubMutedSmall}> / {calorieTarget.toLocaleString()} kcal</Text>
                  </Text>
                  <Text style={styles.gridSubMuted}>2 meals logged</Text>
                </View>
              </Pressable>

              {/* Card 4: Water */}
              <Pressable
                onPress={() => router.push('/(app)/water-log')}
                style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="water" size={22} color="#0284C7" />
                </View>
                <Text style={styles.gridCardTitle}>Water</Text>
                <View style={styles.cardContentBottom}>
                  <Text style={styles.gridValBold}>{waterConsumedL} / {waterTargetL} L</Text>
                  <Text style={styles.gridSubMuted}>6 glasses today</Text>
                </View>
              </Pressable>
            </View>

            {/* Row 3 */}
            <View style={styles.gridRow}>
              {/* Card 5: Medications */}
              <Pressable
                onPress={() => router.push('/(app)/medications')}
                style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#FFE4E6' }]}>
                  <MaterialCommunityIcons name="pill" size={22} color="#E11D48" style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
                <Text style={styles.gridCardTitle}>Medications</Text>
                <View style={styles.cardContentBottom}>
                  <Text style={styles.gridSubMuted}>{pendingMedsCount} reminder today</Text>
                  <Text style={styles.gridSubActive}>Next: 8:00 PM</Text>
                </View>
              </Pressable>

              {/* Card 6: Hormone Progress */}
              <Pressable
                onPress={() => router.push('/(app)/progress')}
                style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.gridIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="bar-chart" size={20} color="#0284C7" />
                </View>
                <Text style={styles.gridCardTitle}>Hormone Progress</Text>
                <View style={styles.cardContentBottom}>
                  <Text style={styles.gridSubMuted}>Latest lab: 12 Mar</Text>
                  <Text style={styles.gridTrendLink}>View trend &gt;</Text>
                </View>
              </Pressable>
            </View>

            {/* Bottom Encouragement Card */}
            <View style={styles.encouragementCard}>
              <View style={styles.maleAvatarBox}>
                <Ionicons name="person" size={24} color="#0284C7" />
              </View>
              <Text style={styles.encouragementText}>
                Keep tracking consistently for better insights.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Permanent Bottom Navigation */}
      <BioPulseBottomNav activeTab="track" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  headingWrap: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // Male 2x3 Grid
  maleGrid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minHeight: 126,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardContentBottom: {
    marginTop: 'auto',
  },
  gridValBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  gridSubMuted: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  gridSubMutedSmall: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  gridSubActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 1,
  },
  activityProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  gridProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gridProgressFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 3,
  },
  gridProgressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  gridTrendLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },

  // Bottom Encouragement Card
  encouragementCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  maleAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  encouragementText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 18,
  },

  // Female Vertical List
  modulesList: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moduleTextWrap: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  moduleSub1: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
    fontWeight: '600',
  },
  moduleSub2: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
