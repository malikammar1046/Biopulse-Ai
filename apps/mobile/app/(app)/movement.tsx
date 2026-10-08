import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useHealthStore } from '../../store';

interface RecommendedRoutine {
  id: string;
  title: string;
  duration: string;
  benefit: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  defaultMins: number;
  defaultSteps: number;
  type: string;
}

const RECOMMENDED_ROUTINES: RecommendedRoutine[] = [
  {
    id: 'walk',
    title: 'Walking',
    duration: '20–30 min',
    benefit: 'Improves insulin sensitivity & glucose uptake',
    icon: 'walk',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    defaultMins: 25,
    defaultSteps: 2500,
    type: 'walking',
  },
  {
    id: 'strength',
    title: 'Light Strength',
    duration: '15–20 min',
    benefit: 'Builds metabolic health & muscle mass',
    icon: 'barbell',
    iconBg: '#EFF6FF',
    iconColor: '#0284C7',
    defaultMins: 20,
    defaultSteps: 600,
    type: 'strength',
  },
  {
    id: 'stretching',
    title: 'Stretching',
    duration: '10–15 min',
    benefit: 'Reduces cortisol and stress levels',
    icon: 'body',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    defaultMins: 15,
    defaultSteps: 0,
    type: 'stretching',
  },
  {
    id: 'cardio',
    title: 'Low-Impact Cardio',
    duration: '20–25 min',
    benefit: 'Aerobic endurance without adrenal stress',
    icon: 'heart',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    defaultMins: 20,
    defaultSteps: 1800,
    type: 'low_impact_cardio',
  },
  {
    id: 'yoga',
    title: 'Restorative Yoga',
    duration: '20–30 min',
    benefit: 'Calms nervous system and lowers tension',
    icon: 'flower-outline',
    iconBg: '#FDF2F8',
    iconColor: '#EC4899',
    defaultMins: 25,
    defaultSteps: 0,
    type: 'yoga',
  },
  {
    id: 'cycling',
    title: 'Cycling',
    duration: '25–35 min',
    benefit: 'Cardiovascular conditioning with low joint impact',
    icon: 'bicycle',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    defaultMins: 30,
    defaultSteps: 2200,
    type: 'cycling',
  },
];

const ACTIVITY_TYPES = [
  { label: 'Walking', value: 'walking' },
  { label: 'Strength', value: 'strength' },
  { label: 'Yoga', value: 'yoga' },
  { label: 'Stretching', value: 'stretching' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Cardio', value: 'low_impact_cardio' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Other', value: 'other' },
];

const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  const t = (type || '').toLowerCase();
  if (t.includes('walk')) return 'walk';
  if (t.includes('strength') || t.includes('weight') || t.includes('barbell')) return 'barbell';
  if (t.includes('yoga')) return 'flower-outline';
  if (t.includes('stretch')) return 'body';
  if (t.includes('cycl')) return 'bicycle';
  if (t.includes('cardio')) return 'heart';
  if (t.includes('mobility')) return 'fitness';
  return 'fitness-outline';
};

const formatActivityDate = (dateStr?: string) => {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(d.getTime())) return dateStr;
  const today = new Date();
  const isSameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isSameDay) return 'Today';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * SCREEN 29: EXERCISE & MOVEMENT
 *
 * Strict visual match to Screenshot 29:
 * - Top Header: Back chevron (<), centered "Exercise & Movement"
 * - Segmented Tabs: [ Today ] (active pink pill), [ This Week ], [ Recommendations ]
 * - Dual Metrics Row:
 *   - Card 1: Activity Time (min, Goal: 30 min, Teal progress bar, %)
 *   - Card 2: Steps (steps, Goal: 8,000, Teal progress bar, %)
 * - Weekly Activity Card:
 *   - 7 vertical pink bars (Mon-Sun) truthfully calculated from real stored fitness_logs
 *   - 60 min and 30 min benchmark guidelines
 * - Recommended for You Section:
 *   - Header with "View All" link
 *   - Cards: Walking, Light Strength, Stretching, etc.
 * - Persistent Backend Integration:
 *   - Connects to public.fitness_logs via useHealthStore
 *   - Truthful weekly activity without hardcoded demo values
 *   - Loading, Empty, Error, Retry, and Save Confirmation states
 */
export default function MovementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    movement,
    movementLogs,
    isLoadingMovement,
    movementError,
    loadMovementData,
    logActivity,
    deleteActivityLog,
  } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'recommendations'>('today');
  const [modalVisible, setModalVisible] = useState(false);
  const [logType, setLogType] = useState('Walking');
  const [selectedActivityType, setSelectedActivityType] = useState('walking');
  const [logMins, setLogMins] = useState('20');
  const [logSteps, setLogSteps] = useState('2000');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Today's metrics connected to persistent health store
  const todayMins = movement.todayActivityMinutes ?? 0;
  const targetMins = movement.targetMinutes || 30; // BioPulse daily movement target
  const minsPercent = targetMins > 0 ? Math.round((todayMins / targetMins) * 100) : 0;

  const todaySteps = movement.todaySteps ?? 0;
  const targetSteps = 8000;
  const stepsPercent = targetSteps > 0 ? Math.min(100, Math.round((todaySteps / targetSteps) * 100)) : 0;

  // Filter today's logged activities from persistent logs
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayLogs = useMemo(() => {
    return movementLogs.filter((log) => {
      if (!log.occurredAt) return false;
      return log.occurredAt.split('T')[0] === todayStr;
    });
  }, [movementLogs, todayStr]);

  // Weekly bar data connected to health store (strictly based on real fitness_logs)
  const weeklyData = useMemo(() => {
    if (movement.weeklyMinutes && movement.weeklyMinutes.length > 0) {
      return movement.weeklyMinutes.map((w) => ({
        day: w.day,
        mins: (w as any).mins ?? w.minutes ?? 0,
      }));
    }
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayIdx = (new Date().getDay() + 6) % 7; // 0 for Mon, 6 for Sun
    return days.map((day, idx) => ({
      day,
      mins: idx === currentDayIdx ? todayMins : 0,
    }));
  }, [movement.weeklyMinutes, todayMins]);

  const maxWeeklyMin = Math.max(60, ...weeklyData.map((d) => d.mins));
  const totalWeeklyMins = weeklyData.reduce((acc, d) => acc + d.mins, 0);
  const activeDaysCount = weeklyData.filter((d) => d.mins > 0).length;

  const handleSaveActivity = useCallback(async () => {
    const minsNum = parseInt(logMins, 10);
    const stepsNum = parseInt(logSteps, 10);
    if (isNaN(minsNum) || minsNum <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid activity duration in minutes.');
      return;
    }
    setIsSaving(true);
    const success = await logActivity(
      minsNum,
      isNaN(stepsNum) ? undefined : stepsNum,
      logType,
      selectedActivityType
    );
    setIsSaving(false);
    if (success) {
      setModalVisible(false);
      setFeedbackMsg(`Logged ${minsNum} min of ${logType}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      Alert.alert(
        'Activity Saved',
        `Logged ${minsNum} minutes of ${logType} to your movement totals.`
      );
    } else {
      Alert.alert('Save Failed', 'Could not save activity to your health profile. Please try again.');
    }
  }, [logMins, logSteps, logType, selectedActivityType, logActivity]);

  const handleDeleteActivity = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete Activity', `Are you sure you want to delete "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteActivityLog(id);
            if (success) {
              setFeedbackMsg('Activity log removed');
              setTimeout(() => setFeedbackMsg(null), 3000);
            } else {
              Alert.alert('Error', 'Failed to delete activity log.');
            }
          },
        },
      ]);
    },
    [deleteActivityLog]
  );

  const handleSelectRoutine = useCallback((routine: RecommendedRoutine) => {
    setLogType(routine.title);
    setSelectedActivityType(routine.type || 'walking');
    setLogMins(routine.defaultMins.toString());
    setLogSteps(routine.defaultSteps.toString());
    setModalVisible(true);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.navy} />
        </Pressable>

        <Text style={styles.headerTitle}>Exercise & Movement</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingMovement}
            onRefresh={loadMovementData}
            tintColor="#F43F7D"
            colors={['#F43F7D']}
          />
        }
      >
        {/* Success Banner */}
        {feedbackMsg && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.successBannerText}>{feedbackMsg}</Text>
          </View>
        )}

        {/* Error Banner with Retry */}
        {movementError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.errorBannerText}>{movementError}</Text>
            <Pressable onPress={() => loadMovementData()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoadingMovement && movementLogs.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#F43F7D" />
            <Text style={styles.loadingText}>Syncing movement data...</Text>
          </View>
        )}

        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('today')}
            style={[styles.tabPill, activeTab === 'today' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
              Today
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('week')}
            style={[styles.tabPill, activeTab === 'week' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>
              This Week
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('recommendations')}
            style={[styles.tabPill, activeTab === 'recommendations' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'recommendations' && styles.tabTextActive]}>
              Recommendations
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: TODAY */}
        {activeTab === 'today' && (
          <>
            {/* Dual Stat Cards */}
            <View style={styles.statsRow}>
              {/* Card 1: Activity Time */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <View style={[styles.statIconBox, { backgroundColor: '#FDF2F8' }]}>
                    <Ionicons name="walk" size={20} color="#F43F7D" />
                  </View>
                  <View style={styles.statMeta}>
                    <Text style={styles.statLabel}>Activity Time</Text>
                    <Text style={styles.statValue}>{todayMins} min</Text>
                    <Text style={styles.statGoal}>Goal: {targetMins} min</Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, minsPercent)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercent}>{minsPercent}%</Text>
                </View>
              </View>

              {/* Card 2: Steps */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="footsteps" size={20} color="#0284C7" />
                  </View>
                  <View style={styles.statMeta}>
                    <Text style={styles.statLabel}>Steps</Text>
                    <Text style={styles.statValue}>{todaySteps.toLocaleString()}</Text>
                    <Text style={styles.statGoal}>Goal: {targetSteps.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${stepsPercent}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercent}>{stepsPercent}%</Text>
                </View>
              </View>
            </View>

            {/* Today's Activities Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Today's Activities ({todayLogs.length})
              </Text>
              <Pressable onPress={() => setModalVisible(true)} hitSlop={8}>
                <Text style={styles.addActivityLink}>+ Add</Text>
              </Pressable>
            </View>

            {todayLogs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="fitness-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Activities Logged Today</Text>
                <Text style={styles.emptySubtitle}>
                  Every minute counts toward metabolic balance and hormone health. Log your activity below or choose a routine.
                </Text>
              </View>
            ) : (
              <View style={styles.logsList}>
                {todayLogs.map((log) => (
                  <View key={log.id} style={styles.activityItemCard}>
                    <View style={[styles.activityItemIconBox, { backgroundColor: '#FDF2F8' }]}>
                      <Ionicons name={getActivityIcon(log.activityType)} size={20} color="#F43F7D" />
                    </View>
                    <View style={styles.activityItemInfo}>
                      <Text style={styles.activityItemName}>{log.activityName || 'Activity'}</Text>
                      <Text style={styles.activityItemMeta}>
                        {log.notes || `${log.activityType.replace('_', ' ')}`}
                      </Text>
                    </View>
                    <View style={styles.activityItemRight}>
                      <Text style={styles.activityItemMins}>{log.durationMinutes} min</Text>
                      <Pressable
                        onPress={() => handleDeleteActivity(log.id, log.activityName || 'Activity')}
                        hitSlop={8}
                        style={styles.deleteBtn}
                        accessibilityLabel="Delete activity"
                      >
                        <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recommended for You Section */}
            <View style={styles.recSectionHeader}>
              <Text style={styles.recSectionTitle}>Recommended for You</Text>
              <Pressable
                onPress={() => setActiveTab('recommendations')}
                hitSlop={8}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recCardsRow}
            >
              {RECOMMENDED_ROUTINES.slice(0, 3).map((routine) => (
                <Pressable
                  key={routine.id}
                  onPress={() => handleSelectRoutine(routine)}
                  style={({ pressed }) => [
                    styles.routineCard,
                    pressed && styles.routineCardPressed,
                  ]}
                >
                  <View style={styles.routineCardTop}>
                    <View style={[styles.routineIconBox, { backgroundColor: routine.iconBg }]}>
                      <Ionicons name={routine.icon} size={18} color={routine.iconColor} />
                    </View>
                    <View style={styles.routineTitleWrap}>
                      <Text style={styles.routineTitle}>{routine.title}</Text>
                      <Text style={styles.routineDuration}>{routine.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.routineBenefit}>{routine.benefit}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* TAB 2: THIS WEEK */}
        {activeTab === 'week' && (
          <>
            {/* Weekly Activity Card */}
            <View style={styles.weeklyCard}>
              <View style={styles.weeklyCardHeader}>
                <Text style={styles.weeklyTitle}>Weekly Activity</Text>
                <Text style={styles.weeklySummaryText}>
                  {totalWeeklyMins} min total ({activeDaysCount} active days)
                </Text>
              </View>

              <View style={styles.chartWrapper}>
                {/* Y-axis guidelines & labels */}
                <View style={styles.guideline60}>
                  <View style={styles.guidelineLine} />
                  <Text style={styles.guidelineText}>60 min</Text>
                </View>

                <View style={styles.guideline30}>
                  <View style={styles.guidelineLine} />
                  <Text style={styles.guidelineText}>30 min</Text>
                </View>

                {/* Truthful Bars */}
                <View style={styles.barsRow}>
                  {weeklyData.map((item, index) => {
                    const barHeight =
                      item.mins > 0
                        ? Math.max(8, Math.min(90, Math.round((item.mins / maxWeeklyMin) * 90)))
                        : 0;
                    return (
                      <View key={index} style={styles.barCol}>
                        <View style={styles.barTrackArea}>
                          {item.mins > 0 ? (
                            <View style={[styles.pinkBar, { height: barHeight }]} />
                          ) : (
                            <View style={styles.emptyBarDash} />
                          )}
                        </View>
                        <Text style={styles.dayText}>{item.day}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Weekly Summary Metrics */}
            <View style={styles.weekMetricsRow}>
              <View style={styles.weekMetricCard}>
                <Text style={styles.weekMetricLabel}>Weekly Total</Text>
                <Text style={styles.weekMetricValue}>{totalWeeklyMins} min</Text>
              </View>
              <View style={styles.weekMetricCard}>
                <Text style={styles.weekMetricLabel}>Active Days</Text>
                <Text style={styles.weekMetricValue}>{activeDaysCount} of 7</Text>
              </View>
              <View style={styles.weekMetricCard}>
                <Text style={styles.weekMetricLabel}>Daily Average</Text>
                <Text style={styles.weekMetricValue}>
                  {Math.round(totalWeeklyMins / 7)} min
                </Text>
              </View>
            </View>

            {/* Activity History Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Activity History ({movementLogs.length})
              </Text>
            </View>

            {movementLogs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Past Activities</Text>
                <Text style={styles.emptySubtitle}>
                  Logged activities will appear here to help you track your longitudinal movement habits.
                </Text>
              </View>
            ) : (
              <View style={styles.logsList}>
                {movementLogs.map((log) => (
                  <View key={log.id} style={styles.activityItemCard}>
                    <View style={[styles.activityItemIconBox, { backgroundColor: '#FDF2F8' }]}>
                      <Ionicons name={getActivityIcon(log.activityType)} size={20} color="#F43F7D" />
                    </View>
                    <View style={styles.activityItemInfo}>
                      <View style={styles.historyRow}>
                        <Text style={styles.activityItemName}>{log.activityName || 'Activity'}</Text>
                        <Text style={styles.historyDateBadge}>
                          {formatActivityDate(log.occurredAt)}
                        </Text>
                      </View>
                      <Text style={styles.activityItemMeta}>
                        {log.notes || `${log.activityType.replace('_', ' ')}`}
                      </Text>
                    </View>
                    <View style={styles.activityItemRight}>
                      <Text style={styles.activityItemMins}>{log.durationMinutes} min</Text>
                      <Pressable
                        onPress={() => handleDeleteActivity(log.id, log.activityName || 'Activity')}
                        hitSlop={8}
                        style={styles.deleteBtn}
                        accessibilityLabel="Delete activity"
                      >
                        <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* TAB 3: RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <View style={styles.recommendationsTabWrapper}>
            <Text style={styles.recTabHeader}>Recommended Routines</Text>
            <Text style={styles.recTabSubtitle}>
              Gentle, hormone-balancing movement tailored for metabolic health and insulin regulation.
            </Text>

            <View style={styles.recList}>
              {RECOMMENDED_ROUTINES.map((routine) => (
                <Pressable
                  key={routine.id}
                  onPress={() => handleSelectRoutine(routine)}
                  style={({ pressed }) => [
                    styles.fullRoutineCard,
                    pressed && styles.routineCardPressed,
                  ]}
                >
                  <View style={[styles.fullRoutineIconBox, { backgroundColor: routine.iconBg }]}>
                    <Ionicons name={routine.icon} size={22} color={routine.iconColor} />
                  </View>
                  <View style={styles.fullRoutineInfo}>
                    <View style={styles.fullRoutineHeader}>
                      <Text style={styles.fullRoutineTitle}>{routine.title}</Text>
                      <Text style={styles.fullRoutineDuration}>{routine.duration}</Text>
                    </View>
                    <Text style={styles.fullRoutineBenefit}>{routine.benefit}</Text>
                    {routine.defaultSteps > 0 && (
                      <Text style={styles.fullRoutineSteps}>
                        ~{routine.defaultSteps.toLocaleString()} steps estimated
                      </Text>
                    )}
                  </View>
                  <View style={styles.fullRoutineAction}>
                    <Ionicons name="add-circle" size={24} color="#F43F7D" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => {
            setLogType('Walking');
            setSelectedActivityType('walking');
            setLogMins('20');
            setLogSteps('2000');
            setModalVisible(true);
          }}
          style={({ pressed }) => [styles.logBtn, pressed && styles.logBtnPressed]}
        >
          <Text style={styles.logBtnText}>Log Activity</Text>
        </Pressable>
      </View>

      {/* Log Activity Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Movement</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={BioPulseColors.navy} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Activity Name</Text>
            <TextInput
              style={styles.input}
              value={logType}
              onChangeText={setLogType}
              placeholder="e.g. Walking, Light Strength"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Activity Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeChipsRow}
            >
              {ACTIVITY_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => {
                    setSelectedActivityType(t.value);
                    if (logType === '' || ACTIVITY_TYPES.some((at) => at.label === logType)) {
                      setLogType(t.label);
                    }
                  }}
                  style={[
                    styles.typeChip,
                    selectedActivityType === t.value && styles.typeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      selectedActivityType === t.value && styles.typeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={logMins}
                  onChangeText={setLogMins}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Steps (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={logSteps}
                  onChangeText={setLogSteps}
                  keyboardType="numeric"
                  placeholder="2000"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.quickChipRow}>
              {[15, 30, 45].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setLogMins(m.toString())}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>+{m} min</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSaveActivity}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.modalSaveBtn,
                pressed && styles.logBtnPressed,
                isSaving && { opacity: 0.7 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveText}>Save Activity</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Banners & Loading
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  successBannerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Segmented Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 3,
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: '#FCE7F3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#F43F7D',
    fontWeight: '700',
  },

  // Dual Stat Cards
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statCardTop: {
    marginBottom: 10,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statMeta: {},
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginTop: 2,
  },
  statGoal: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#14B8A6',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 8,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  addActivityLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F43F7D',
  },

  // Activity List Items
  logsList: {
    gap: 8,
    marginBottom: 16,
  },
  activityItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  activityItemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityItemInfo: {
    flex: 1,
  },
  activityItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  activityItemMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activityItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityItemMins: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F43F7D',
  },
  deleteBtn: {
    padding: 6,
  },

  // History Badges
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDateBadge: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Weekly Activity Card
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  weeklyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  weeklySummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F43F7D',
  },
  chartWrapper: {
    height: 125,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingTop: 16,
  },
  guideline60: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideline30: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidelineLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  guidelineText: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 6,
    width: 38,
    textAlign: 'right',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingRight: 44, // leave room for right y-axis text
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: 90,
    justifyContent: 'flex-end',
  },
  barTrackArea: {
    height: 70,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pinkBar: {
    width: 13,
    backgroundColor: '#F43F7D',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  emptyBarDash: {
    width: 8,
    height: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },

  // Week Metric Row
  weekMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  weekMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  weekMetricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  weekMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },

  // Recommended for You (Today Tab)
  recSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  recSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F43F7D',
  },
  recCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  routineCard: {
    width: 146,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  routineCardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#FAF5FF',
  },
  routineCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  routineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTitleWrap: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  routineDuration: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  routineBenefit: {
    fontSize: 10,
    color: '#059669',
    lineHeight: 14,
  },

  // Recommendations Tab (Full list)
  recommendationsTabWrapper: {
    paddingTop: 4,
  },
  recTabHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  recTabSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  recList: {
    gap: 10,
  },
  fullRoutineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fullRoutineIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fullRoutineInfo: {
    flex: 1,
  },
  fullRoutineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  fullRoutineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  fullRoutineDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F43F7D',
  },
  fullRoutineBenefit: {
    fontSize: 11,
    color: '#059669',
    lineHeight: 15,
  },
  fullRoutineSteps: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  fullRoutineAction: {
    marginLeft: 10,
  },

  // Floating Bottom Button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  logBtn: {
    backgroundColor: '#F43F7D',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logBtnPressed: {
    opacity: 0.88,
  },
  logBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 59, 114, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.navy,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: BioPulseColors.navy,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  typeChipActive: {
    backgroundColor: '#FCE7F3',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: '#F43F7D',
  },
  inputRow: {
    flexDirection: 'row',
  },
  quickChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FCE7F3',
    borderRadius: 16,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F43F7D',
  },
  modalSaveBtn: {
    backgroundColor: '#F43F7D',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
