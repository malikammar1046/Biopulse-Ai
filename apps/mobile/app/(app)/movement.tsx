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
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

export interface RecommendedRoutine {
  id: string;
  title: string;
  duration: string;
  benefit: string;
  intensity: 'Restorative' | 'Gentle' | 'Low-Impact' | 'Moderate';
  focus: string;
  whyThisRoutine: string;
  steps: string[];
  safetyNotice: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  defaultMins: number;
  defaultSteps: number;
  type: string;
  pathway: 'female' | 'male' | 'both';
  category: 'strength' | 'walking' | 'recovery' | 'yoga' | 'other';
}

const FEMALE_ROUTINES: RecommendedRoutine[] = [
  {
    id: 'f_cramps_pelvic',
    title: 'Pelvic & Lower Back Release',
    duration: '15 min',
    benefit: 'Eases menstrual cramps & reduces abdominal tension',
    intensity: 'Restorative',
    focus: 'Cramp Relief & Lower Back Ease',
    whyThisRoutine:
      'Low-stress gentle stretching eases uterine congestion and lower back pressure without triggering adrenal fatigue or cortisol spikes.',
    steps: [
      '5 mins Child’s Pose (Balasana) with slow diaphragmatic breaths into the belly',
      '5 mins gentle Cat-Cow spine waves to mobilize the sacrum and lower back',
      '5 mins Reclined Bound Angle (Supta Baddha Konasana) with knee support',
    ],
    safetyNotice:
      'Gentle movement can relieve mild muscular tension. It does not replace medical care. Do not push through sharp or severe pelvic pain; seek medical evaluation for unusual or debilitating symptoms.',
    icon: 'body',
    iconBg: '#FDF2F8',
    iconColor: '#E11D48',
    defaultMins: 15,
    defaultSteps: 0,
    type: 'stretching',
    pathway: 'female',
    category: 'recovery',
  },
  {
    id: 'f_period_walk',
    title: 'Mindful Fresh Air Walk',
    duration: '20 min',
    benefit: 'Stimulates pelvic circulation & lymphatic flow',
    intensity: 'Gentle',
    focus: 'Circulation & Mood Support',
    whyThisRoutine:
      'A relaxed outdoor stroll oxygenates smooth muscles, naturally relieving pelvic discomfort without elevating stress hormones.',
    steps: [
      'Walk at a comfortable, conversational pace with shoulders relaxed',
      'Focus on steady nasal breathing to maintain parasympathetic calm',
      'Hydrate with warm water or herbal infusion post-walk',
    ],
    safetyNotice:
      'Keep your pace easy. Listen to your body and rest if you feel fatigued or lightheaded.',
    icon: 'walk',
    iconBg: '#FFF1F2',
    iconColor: '#F43F7D',
    defaultMins: 20,
    defaultSteps: 2200,
    type: 'walking',
    pathway: 'female',
    category: 'walking',
  },
  {
    id: 'f_pcos_strength',
    title: 'Low-Impact Slow Strength & Stability',
    duration: '20 min',
    benefit: 'Enhances insulin sensitivity without cortisol spikes',
    intensity: 'Low-Impact',
    focus: 'Insulin Sensitivity & Muscle Mass',
    whyThisRoutine:
      'Controlled resistance movements recruit large muscle groups for optimal glucose uptake while protecting the HPA axis from overtraining.',
    steps: [
      '3 sets of 10 slow tempo bodyweight or light goblet squats',
      '3 sets of 10 Bird-Dog core stabilizers (5-sec hold per side)',
      '3 sets of 12 standing calf raises and glute bridges',
      '3 mins seated hamstring and chest opening stretch',
    ],
    safetyNotice:
      'Exercise supports metabolic health and insulin regulation, but is not a standalone cure for PCOS. Maintain controlled form and adequate hydration.',
    icon: 'barbell',
    iconBg: '#FCE7F3',
    iconColor: '#BE123C',
    defaultMins: 20,
    defaultSteps: 600,
    type: 'strength',
    pathway: 'female',
    category: 'strength',
  },
  {
    id: 'f_rest_recovery',
    title: 'Restorative Rest & Diaphragmatic Breath',
    duration: '15 min',
    benefit: 'Calms the nervous system & resets cortisol',
    intensity: 'Restorative',
    focus: 'Nervous System Reset',
    whyThisRoutine:
      'Active recovery with elevated legs facilitates venous return and shifts your body into autonomic recovery mode.',
    steps: [
      'Lie comfortably with legs elevated against a wall or resting on pillows',
      'Practice 4-second inhales and 6-second slow exhales',
      'Allow muscles to completely decompress in stillness',
    ],
    safetyNotice:
      'Use comfortable cushioning under your hips and neck for optimal relaxation.',
    icon: 'flower-outline',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    defaultMins: 15,
    defaultSteps: 0,
    type: 'rest_recovery',
    pathway: 'female',
    category: 'recovery',
  },
  {
    id: 'f_glucose_walk',
    title: 'Post-Meal Glucose Clearing Walk',
    duration: '20 min',
    benefit: 'Smooths blood sugar spikes after meals',
    intensity: 'Gentle',
    focus: 'Glycemic Regulation',
    whyThisRoutine:
      'Walking 15–20 minutes after eating uses muscle contractions to clear circulating glucose without requiring extra insulin.',
    steps: [
      'Start walking 15–30 minutes after completing a meal',
      'Maintain an easy conversational tempo',
      'Relax your posture and enjoy the outdoors',
    ],
    safetyNotice:
      'Gentle post-prandial movement supports glycemic stability. Do not perform high-intensity sprints immediately after eating.',
    icon: 'walk',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    defaultMins: 20,
    defaultSteps: 2000,
    type: 'walking',
    pathway: 'female',
    category: 'walking',
  },
];

const MALE_ROUTINES: RecommendedRoutine[] = [
  {
    id: 'm_functional_strength',
    title: 'Full Body Functional Strength & Mobility',
    duration: '30 min',
    benefit: 'Supports lean body mass & metabolic vitality',
    intensity: 'Moderate',
    focus: 'Muscular Health & Metabolic Rate',
    whyThisRoutine:
      'Compound movements engage major muscle groups, promoting lean body composition, bone mineral density, and optimal metabolic health.',
    steps: [
      '5 mins joint mobilization (shoulder circles, hip openers, torso twists)',
      '3 sets of 10-12 bodyweight or goblet squats with controlled tempo',
      '3 sets of 8-10 push-ups (incline or standard)',
      '3 sets of 10 resistance band rows',
      '3 mins cool-down stretch and nasal breathing recovery',
    ],
    safetyNotice:
      'Regular strength training supports general metabolic wellness and body composition. It does not replace medical hormone evaluation or diagnostic testing for hypogonadism.',
    icon: 'barbell',
    iconBg: '#EFF6FF',
    iconColor: '#0284C7',
    defaultMins: 30,
    defaultSteps: 800,
    type: 'strength',
    pathway: 'male',
    category: 'strength',
  },
  {
    id: 'm_zone2_walk',
    title: 'Zone-2 Brisk Aerobic Power Walk',
    duration: '25 min',
    benefit: 'Cardiovascular endurance & mitochondrial health',
    intensity: 'Moderate',
    focus: 'Cardiovascular & Metabolic Fitness',
    whyThisRoutine:
      'Steady conversational aerobic exercise improves vascular endothelium, capillary density, and insulin sensitivity.',
    steps: [
      '3 mins easy warm-up pace',
      '20 mins steady brisk walking (maintain a pace where you can hold a conversation)',
      '2 mins gentle cool-down stroll and hydration',
    ],
    safetyNotice:
      'Cardiorespiratory fitness benefits overall longevity. If you experience chest tightness, dizziness, or irregular heartbeat, stop immediately and seek medical attention.',
    icon: 'walk',
    iconBg: '#E0F2FE',
    iconColor: '#0369A1',
    defaultMins: 25,
    defaultSteps: 2800,
    type: 'walking',
    pathway: 'male',
    category: 'walking',
  },
  {
    id: 'm_postural_decompression',
    title: 'Postural Alignment & Decompression',
    duration: '15 min',
    benefit: 'Relieves desk strain, decompresses spine & eases stress',
    intensity: 'Restorative',
    focus: 'Spinal Health & Autonomic Balance',
    whyThisRoutine:
      'Counters prolonged sitting by opening tight hip flexors and decompressing the lumbar spine, resetting parasympathetic balance.',
    steps: [
      '5 mins gentle Cat-Cow and thoracic spine rotations',
      '5 mins door-frame chest stretches and kneeling hip flexor release',
      '5 mins slow diaphragmatic box breathing in a comfortable seated position',
    ],
    safetyNotice:
      'Move gently through your natural range of motion. Avoid sharp twisting or painful hyperextension.',
    icon: 'body',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    defaultMins: 15,
    defaultSteps: 0,
    type: 'rest_recovery',
    pathway: 'male',
    category: 'recovery',
  },
  {
    id: 'm_metabolic_walk',
    title: 'Metabolic Clearing Evening Stroll',
    duration: '20 min',
    benefit: 'Supports insulin sensitivity & evening blood pressure',
    intensity: 'Gentle',
    focus: 'Insulin Sensitivity & Sleep Prep',
    whyThisRoutine:
      'Gentle post-dinner walking clears circulating triglycerides and blood sugar while lowering evening cortisol before sleep.',
    steps: [
      'Walk at an unhurried, comfortable pace in fresh air',
      'Keep shoulders and jaw relaxed',
      'Hydrate with pure water when finished',
    ],
    safetyNotice:
      'Regular walking is safe for most adults. Consult your physician before initiating any vigorous exercise program.',
    icon: 'walk',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    defaultMins: 20,
    defaultSteps: 2100,
    type: 'walking',
    pathway: 'male',
    category: 'walking',
  },
];

const ACTIVITY_TYPES = [
  { label: 'Walking', value: 'walking' },
  { label: 'Strength', value: 'strength' },
  { label: 'Yoga', value: 'yoga' },
  { label: 'Stretching', value: 'stretching' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Cardio', value: 'low_impact_cardio' },
  { label: 'Recovery', value: 'rest_recovery' },
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
  if (t.includes('recovery')) return 'bed-outline';
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
 * Full pathway parity (Female PCOS/cramps, Male metabolic/strength)
 * Integrated with Supabase public.fitness_logs.
 * Real metrics, genuine routines, honest empty states.
 */
export default function MovementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<RecommendedRoutine | null>(null);

  const [logType, setLogType] = useState('Walking');
  const [selectedActivityType, setSelectedActivityType] = useState('walking');
  const [logMins, setLogMins] = useState('20');
  const [logSteps, setLogSteps] = useState('2000');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Pathway specific routines
  const availableRoutines = isFemale ? FEMALE_ROUTINES : MALE_ROUTINES;

  const filteredRoutines = useMemo(() => {
    if (filterCategory === 'All') return availableRoutines;
    return availableRoutines.filter((r) => r.category === filterCategory.toLowerCase());
  }, [availableRoutines, filterCategory]);

  // Today's metrics connected to persistent health store
  const todayMins = movement.todayActivityMinutes ?? 0;
  const targetMins = movement.targetMinutes || 30;
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
    const currentDayIdx = (new Date().getDay() + 6) % 7;
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
      setDetailModalVisible(false);
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

  const handleOpenRoutineDetails = useCallback((routine: RecommendedRoutine) => {
    setSelectedRoutine(routine);
    setDetailModalVisible(true);
  }, []);

  const handleLogRoutineDirectly = useCallback((routine: RecommendedRoutine) => {
    setLogType(routine.title);
    setSelectedActivityType(routine.type || 'walking');
    setLogMins(routine.defaultMins.toString());
    setLogSteps(routine.defaultSteps.toString());
    setModalVisible(true);
  }, []);

  const themeColor = isFemale ? '#E11D48' : '#0284C7';
  const themeBgLight = isFemale ? '#FCE7F3' : '#DBEAFE';

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
            tintColor={themeColor}
          />
        }
      >
        {/* User feedback banner */}
        {feedbackMsg && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.successBannerText}>{feedbackMsg}</Text>
          </View>
        )}

        {/* Error banner */}
        {movementError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorBannerText}>{movementError}</Text>
            <Pressable onPress={loadMovementData} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('today')}
            style={[styles.tabPill, activeTab === 'today' && { backgroundColor: themeBgLight }]}
          >
            <Text style={[styles.tabText, activeTab === 'today' && { color: themeColor, fontWeight: '700' }]}>
              Today
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('week')}
            style={[styles.tabPill, activeTab === 'week' && { backgroundColor: themeBgLight }]}
          >
            <Text style={[styles.tabText, activeTab === 'week' && { color: themeColor, fontWeight: '700' }]}>
              This Week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('recommendations')}
            style={[styles.tabPill, activeTab === 'recommendations' && { backgroundColor: themeBgLight }]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'recommendations' && { color: themeColor, fontWeight: '700' },
              ]}
            >
              Recommendations
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: TODAY */}
        {activeTab === 'today' && (
          <>
            {/* Dual Metrics Row */}
            <View style={styles.statsRow}>
              {/* Card 1: Activity Time */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <View style={[styles.statIconBox, { backgroundColor: isFemale ? '#FDF2F8' : '#EFF6FF' }]}>
                    <Ionicons name="time-outline" size={20} color={themeColor} />
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
                        {
                          width: `${Math.min(100, minsPercent)}%`,
                          backgroundColor: themeColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPercent, { color: themeColor }]}>{minsPercent}%</Text>
                </View>
              </View>

              {/* Card 2: Steps */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="footsteps-outline" size={20} color="#10B981" />
                  </View>
                  <View style={styles.statMeta}>
                    <Text style={styles.statLabel}>Steps</Text>
                    <Text style={styles.statValue}>{todaySteps.toLocaleString()}</Text>
                    <Text style={styles.statGoal}>Goal: 8,000</Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, stepsPercent)}%`, backgroundColor: '#10B981' },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPercent, { color: '#059669' }]}>{stepsPercent}%</Text>
                </View>
              </View>
            </View>

            {/* Today's Logged Activities */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Today's Activities ({todayLogs.length})</Text>
              <Pressable onPress={() => setModalVisible(true)} hitSlop={8}>
                <Text style={[styles.addActivityLink, { color: themeColor }]}>+ Log Activity</Text>
              </Pressable>
            </View>

            {todayLogs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="walk-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Activities Logged Today</Text>
                <Text style={styles.emptySubtitle}>
                  Every minute of gentle movement supports your hormone balance. Tap below to log a walk or stretch.
                </Text>
              </View>
            ) : (
              <View style={styles.logsList}>
                {todayLogs.map((log) => (
                  <View key={log.id} style={styles.activityItemCard}>
                    <View style={[styles.activityItemIconBox, { backgroundColor: isFemale ? '#FDF2F8' : '#EFF6FF' }]}>
                      <Ionicons name={getActivityIcon(log.activityType)} size={20} color={themeColor} />
                    </View>
                    <View style={styles.activityItemInfo}>
                      <Text style={styles.activityItemName}>{log.activityName || 'Activity'}</Text>
                      <Text style={styles.activityItemMeta}>
                        {log.notes || `${log.activityType.replace('_', ' ')}`}
                      </Text>
                    </View>
                    <View style={styles.activityItemRight}>
                      <Text style={[styles.activityItemMins, { color: themeColor }]}>{log.durationMinutes} min</Text>
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
              <Text style={styles.recSectionTitle}>
                {isFemale ? 'Gentle Recommendations' : 'Metabolic Recommendations'}
              </Text>
              <Pressable onPress={() => setActiveTab('recommendations')} hitSlop={8}>
                <Text style={[styles.viewAllText, { color: themeColor }]}>View All</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recCardsRow}
            >
              {availableRoutines.slice(0, 3).map((routine) => (
                <Pressable
                  key={routine.id}
                  onPress={() => handleOpenRoutineDetails(routine)}
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
                      <Text style={styles.routineTitle} numberOfLines={1}>{routine.title}</Text>
                      <Text style={styles.routineDuration}>{routine.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.routineBenefit} numberOfLines={2}>{routine.benefit}</Text>
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
                <Text style={[styles.weeklySummaryText, { color: themeColor }]}>
                  {totalWeeklyMins} min total ({activeDaysCount} active days)
                </Text>
              </View>

              <View style={styles.chartWrapper}>
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
                            <View style={[styles.pinkBar, { height: barHeight, backgroundColor: themeColor }]} />
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
                    <View style={[styles.activityItemIconBox, { backgroundColor: isFemale ? '#FDF2F8' : '#EFF6FF' }]}>
                      <Ionicons name={getActivityIcon(log.activityType)} size={20} color={themeColor} />
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
                      <Text style={[styles.activityItemMins, { color: themeColor }]}>{log.durationMinutes} min</Text>
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
            <Text style={styles.recTabHeader}>
              {isFemale ? 'Clinical Movement Routines' : 'Metabolic & Physical Routines'}
            </Text>
            <Text style={styles.recTabSubtitle}>
              {isFemale
                ? 'Hormone-aware low-impact movement designed for cramps, PCOS insulin regulation, and recovery.'
                : 'Cardiovascular conditioning and functional resistance designed for metabolic health and energy.'}
            </Text>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsRow}
            >
              {['All', 'Strength', 'Walking', 'Recovery'].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setFilterCategory(cat)}
                  style={[
                    styles.catPill,
                    filterCategory === cat && { backgroundColor: themeColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      filterCategory === cat && styles.catPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.recList}>
              {filteredRoutines.map((routine) => (
                <Pressable
                  key={routine.id}
                  onPress={() => handleOpenRoutineDetails(routine)}
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
                      <Text style={[styles.fullRoutineDuration, { color: themeColor }]}>
                        {routine.duration}
                      </Text>
                    </View>
                    <Text style={styles.fullRoutineBenefit}>{routine.benefit}</Text>
                    <View style={styles.routineBadgeRow}>
                      <Text style={styles.intensityBadge}>{routine.intensity}</Text>
                      <Text style={styles.focusBadge}>{routine.focus}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleLogRoutineDirectly(routine)}
                    style={styles.fullRoutineAction}
                    hitSlop={8}
                  >
                    <Ionicons name="add-circle" size={26} color={themeColor} />
                  </Pressable>
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
          style={({ pressed }) => [
            styles.logBtn,
            { backgroundColor: themeColor, shadowColor: themeColor },
            pressed && styles.logBtnPressed,
          ]}
        >
          <Text style={styles.logBtnText}>Log Activity</Text>
        </Pressable>
      </View>

      {/* Routine Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selectedRoutine && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRoutine.title}</Text>
                  <Pressable onPress={() => setDetailModalVisible(false)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={BioPulseColors.navy} />
                  </Pressable>
                </View>

                <View style={styles.detailMetaRow}>
                  <Text style={[styles.detailMetaDuration, { color: themeColor }]}>
                    {selectedRoutine.duration} • {selectedRoutine.intensity}
                  </Text>
                </View>

                <Text style={styles.detailSectionTitle}>Clinical Rationale & Hormone Balance</Text>
                <Text style={styles.detailBodyText}>{selectedRoutine.whyThisRoutine}</Text>

                <Text style={styles.detailSectionTitle}>Routine Instructions</Text>
                {selectedRoutine.steps.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={[styles.stepBullet, { backgroundColor: themeColor }]} />
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}

                {/* Safety notice banner */}
                <View style={styles.safetyBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#0369A1" />
                  <Text style={styles.safetyText}>{selectedRoutine.safetyNotice}</Text>
                </View>

                <Pressable
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleLogRoutineDirectly(selectedRoutine);
                  }}
                  style={[styles.modalSaveBtn, { backgroundColor: themeColor, marginTop: 20 }]}
                >
                  <Text style={styles.modalSaveText}>Log This Routine</Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
                    selectedActivityType === t.value && { backgroundColor: themeBgLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      selectedActivityType === t.value && { color: themeColor, fontWeight: '700' },
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
                  style={[styles.quickChip, { backgroundColor: themeBgLight }]}
                >
                  <Text style={[styles.quickChipText, { color: themeColor }]}>+{m} min</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSaveActivity}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.modalSaveBtn,
                { backgroundColor: themeColor },
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

  // Banners
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
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
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
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
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
  },
  deleteBtn: {
    padding: 6,
  },

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
    paddingRight: 44,
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
  },
  recCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  routineCard: {
    width: 156,
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
    lineHeight: 17,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  },
  fullRoutineBenefit: {
    fontSize: 11,
    color: '#059669',
    lineHeight: 15,
  },
  routineBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  intensityBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  focusBadge: {
    fontSize: 10,
    color: '#0284C7',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullRoutineAction: {
    marginLeft: 10,
  },

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
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  detailMetaRow: {
    marginBottom: 12,
  },
  detailMetaDuration: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginTop: 12,
    marginBottom: 6,
  },
  detailBodyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  stepBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  stepText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 17,
  },
  safetyBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  safetyText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
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
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
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
    borderRadius: 16,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalSaveBtn: {
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
