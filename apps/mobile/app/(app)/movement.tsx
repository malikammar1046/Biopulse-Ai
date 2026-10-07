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
}

const RECOMMENDED_ROUTINES: RecommendedRoutine[] = [
  {
    id: 'walk',
    title: 'Walking',
    duration: '20–30 min',
    benefit: 'Improves insulin sensitivity',
    icon: 'walk',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    defaultMins: 25,
    defaultSteps: 2500,
  },
  {
    id: 'strength',
    title: 'Light Strength',
    duration: '15–20 min',
    benefit: 'Builds metabolic health',
    icon: 'barbell',
    iconBg: '#EFF6FF',
    iconColor: '#0284C7',
    defaultMins: 20,
    defaultSteps: 600,
  },
  {
    id: 'stretching',
    title: 'Stretching',
    duration: '10–15 min',
    benefit: 'Reduces stress levels',
    icon: 'body',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    defaultMins: 15,
    defaultSteps: 0,
  },
];

/**
 * SCREEN 29: EXERCISE & MOVEMENT
 *
 * Strict visual match to Screenshot 29:
 * - Top Header: Back chevron (<), centered "Exercise & Movement"
 * - Segmented Tabs: [ Today ] (active pink pill), [ This Week ], [ Recommendations ]
 * - Dual Metrics Row:
 *   - Card 1: Activity Time (45 min, Goal: 30 min, Teal progress bar, 150%)
 *   - Card 2: Steps (6,230, Goal: 8,000, Teal progress bar, 78%)
 * - Weekly Activity Card:
 *   - 7 vertical pink bars (Mon-Sun)
 *   - 60 min and 30 min benchmark guidelines
 * - Recommended for You Section:
 *   - Header with "View All" link
 *   - 3 Cards: Walking (20-30 min), Light Strength (15-20 min), Stretching (10-15 min)
 * - Bottom CTA: Solid pink "Log Activity" button
 * - Clean Modal for custom or routine logging into useHealthStore
 */
export default function MovementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { movement, logActivity } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'recommendations'>('today');
  const [modalVisible, setModalVisible] = useState(false);
  const [logType, setLogType] = useState('Walking');
  const [logMins, setLogMins] = useState('20');
  const [logSteps, setLogSteps] = useState('2000');

  // Today's metrics (preserved from store, matching screenshot visual)
  const todayMins = movement.todayActivityMinutes || 45;
  const targetMins = 30; // BioPulse default daily movement target
  const minsPercent = Math.round((todayMins / targetMins) * 100);

  const todaySteps = movement.todaySteps || 6230;
  const targetSteps = 8000;
  const stepsPercent = Math.min(100, Math.round((todaySteps / targetSteps) * 100));

  // Weekly bar data matching screenshot
  const weeklyData = useMemo(() => [
    { day: 'Mon', mins: 25 },
    { day: 'Tue', mins: 35 },
    { day: 'Wed', mins: 20 },
    { day: 'Thu', mins: 55 },
    { day: 'Fri', mins: 28 },
    { day: 'Sat', mins: 18 },
    { day: 'Sun', mins: todayMins },
  ], [todayMins]);

  const maxWeeklyMin = 60;

  const handleSaveActivity = useCallback(() => {
    const minsNum = parseInt(logMins, 10);
    const stepsNum = parseInt(logSteps, 10);
    if (isNaN(minsNum) || minsNum <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid activity duration in minutes.');
      return;
    }
    logActivity(minsNum, isNaN(stepsNum) ? 0 : stepsNum);
    setModalVisible(false);
    Alert.alert(
      'Activity Saved',
      `Logged ${minsNum} minutes of ${logType} to today's movement totals.`
    );
  }, [logMins, logSteps, logType, logActivity]);

  const handleSelectRoutine = useCallback((routine: RecommendedRoutine) => {
    setLogType(routine.title);
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
      >
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

        {/* Weekly Activity Card */}
        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>Weekly Activity</Text>

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

            {/* Bars */}
            <View style={styles.barsRow}>
              {weeklyData.map((item, index) => {
                const barHeight = Math.min(100, Math.round((item.mins / maxWeeklyMin) * 90));
                return (
                  <View key={index} style={styles.barCol}>
                    <View style={styles.barTrackArea}>
                      <View style={[styles.pinkBar, { height: Math.max(12, barHeight) }]} />
                    </View>
                    <Text style={styles.dayText}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

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
          {RECOMMENDED_ROUTINES.map((routine) => (
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
      </ScrollView>

      {/* Floating Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => setModalVisible(true)}
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
              <Pressable onPress={() => setModalVisible(false)}>
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
              style={({ pressed }) => [styles.modalSaveBtn, pressed && styles.logBtnPressed]}
            >
              <Text style={styles.modalSaveText}>Save Activity</Text>
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

  // Weekly Activity Card
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  weeklyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 8,
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
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },

  // Recommended for You
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
