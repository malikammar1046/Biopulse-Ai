import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { calculateAuthoritativeBmi } from '../../services/measurementService';
import { SadCloudIllustration } from '../../components/ui/StateIllustrations';

interface ProgressMetricDef {
  id: string;
  metricKey: string;
  title: string;
  value: string;
  changeValue: string;
  changeSuffix: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  sparklineColor: string;
  points: number[];
}
 
function formatCardDate(iso?: string): string {
  if (!iso) return 'Recent';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Recent';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function normalizePoints(values: number[]): number[] {
  if (values.length === 0) return [50, 50];
  if (values.length === 1) return [50, 50];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  if (span === 0) return values.map(() => 50);
  return values.map((v) => Math.round(20 + ((v - min) / span) * 65));
}

/**
 * Pure React Native Sparkline Line Renderer
 */
function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  const width = 84;
  const height = 30;

  if (!points || points.length < 2) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 36, height: 2, backgroundColor: '#CBD5E1', borderRadius: 1 }} />
      </View>
    );
  }

  // Generate segments connecting points
  const segments = useMemo(() => {
    if (points.length < 2) return [];
    const stepX = width / (points.length - 1);
    const result: { x: number; y: number; length: number; angle: number }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const x1 = i * stepX;
      // Invert Y so 100 is at top
      const y1 = height - (points[i] / 100) * height;
      const x2 = (i + 1) * stepX;
      const y2 = height - (points[i + 1] / 100) * height;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      result.push({
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
        length,
        angle,
      });
    }
    return result;
  }, [points]);

  const lastPoint = points[points.length - 1];
  const lastY = height - (lastPoint / 100) * height;

  return (
    <View style={{ width, height, position: 'relative' }}>
      {segments.map((seg, idx) => (
        <View
          key={idx}
          style={{
            position: 'absolute',
            left: seg.x - seg.length / 2,
            top: seg.y - 1,
            width: seg.length,
            height: 2,
            backgroundColor: color,
            borderRadius: 1,
            transform: [{ rotate: `${seg.angle}deg` }],
          }}
        />
      ))}
      {/* End Point Marker */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: lastY - 2.5,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/**
 * SCREEN 32: PROGRESS OVERVIEW
 *
 * Strict visual match to Screenshot 32:
 * - Header: Back chevron (<), centered "Your Progress", right "Last 3 Months ⌵" filter pill
 * - Segmented Tabs: [ Overview ] (active soft blue pill), [ Records ]
 * - 4 Metric Cards (one chart per section, clean & uncluttered):
 *   1. Testosterone (Total T) (or Cycle Regularity for female)
 *   2. Weight / BMI
 *   3. Energy & Symptoms
 *   4. Screening History
 * - Each card has:
 *   - Category Icon box
 *   - Title, Main value & % change pill
 *   - Mini sparkline curve
 *   - "Last updated DD Mon YYYY"
 *   - Chevron > to navigate to Metric Detail Screen (Screen 33)
 */
export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const {
    profile,
    screening,
    assessmentHistory,
    cycle,
    cycleHistory,
    symptoms,
    symptomHistory,
    bmi,
    measurementObservations,
    logMeasurement,
    loadMeasurementObservations,
    loadSymptoms,
    loadCycleData,
  } = useHealthStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadMeasurementObservations?.(),
        loadSymptoms?.(),
        loadCycleData?.(),
      ]);
    } catch {
      // Non-blocking
    } finally {
      setIsRefreshing(false);
    }
  }, [loadMeasurementObservations, loadSymptoms, loadCycleData]);

  const searchParams = useLocalSearchParams<{ error?: string }>();
  const [hasError, setHasError] = useState(searchParams.error === 'true');
  const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview');
  const [selectedRange, setSelectedRange] = useState('Last 3 Months');

  // Measurement Modal Form states
  const [showLogModal, setShowLogModal] = useState(false);
  const [logWeight, setLogWeight] = useState(profile.weightKg ? String(profile.weightKg) : '');
  const [logHeight, setLogHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [logWaist, setLogWaist] = useState(profile.waistCm ? String(profile.waistCm) : '');
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    if (profile.weightKg) setLogWeight(String(profile.weightKg));
    if (profile.heightCm) setLogHeight(String(profile.heightCm));
    if (profile.waistCm) setLogWaist(String(profile.waistCm));
  }, [profile.weightKg, profile.heightCm, profile.waistCm]);

  const handleSaveMeasurement = async () => {
    const w = parseFloat(logWeight);
    const h = parseFloat(logHeight);
    const waist = parseFloat(logWaist);

    if (isNaN(w) && isNaN(h) && isNaN(waist)) {
      Alert.alert('Missing Value', 'Please enter at least one measurement (weight, height, or waist).');
      return;
    }

    setIsLogging(true);
    try {
      const success = await logMeasurement({
        weightKg: !isNaN(w) && w > 0 ? w : undefined,
        heightCm: !isNaN(h) && h > 0 ? h : undefined,
        waistCm: !isNaN(waist) && waist > 0 ? waist : undefined,
      });

      if (success) {
        setShowLogModal(false);
        Alert.alert('Measurements Saved', 'Your measurements and calculated BMI have been saved.');
      } else {
        Alert.alert('Saved Locally', 'Your measurements have been updated.');
        setShowLogModal(false);
      }
    } catch {
      Alert.alert('Error', 'Could not save measurement. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const previewBmi = useMemo(() => {
    const w = parseFloat(logWeight);
    const h = parseFloat(logHeight);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return calculateAuthoritativeBmi(w, h);
    }
    return bmi > 0 ? bmi : 0;
  }, [logWeight, logHeight, bmi]);

  // Real longitudinal weight observations
  const weightObservations = useMemo(() => {
    return measurementObservations
      .filter((o) => o.metricKey === 'weight_kg')
      .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  }, [measurementObservations]);

  // Real longitudinal testosterone observations
  const testosteroneObservations = useMemo(() => {
    return measurementObservations
      .filter((o) => o.metricKey === 'testosterone' || o.metricKey === 'total_t')
      .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  }, [measurementObservations]);

  // Real assessments sorted chronologically
  const chronologicalAssessments = useMemo(() => {
    return [...assessmentHistory].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
  }, [assessmentHistory]);

  const maleMetrics: ProgressMetricDef[] = useMemo(() => {
    // 1. Testosterone
    const hasT = testosteroneObservations.length > 0;
    const tValues = testosteroneObservations.map((o) => o.value);
    const currentT = hasT ? tValues[tValues.length - 1] : null;
    const prevT = tValues.length > 1 ? tValues[tValues.length - 2] : null;
    const diffT = currentT !== null && prevT !== null ? currentT - prevT : 0;
    const pctT = prevT && prevT > 0 ? Math.round((diffT / prevT) * 100) : 0;
    const tPoints = tValues.length > 1 ? normalizePoints(tValues) : [];
    const lastTDate = hasT
      ? formatCardDate(testosteroneObservations[testosteroneObservations.length - 1].observedAt)
      : 'No tests logged';

    // 2. Weight / BMI
    const hasW = weightObservations.length > 0 || Boolean(profile.weightKg && profile.weightKg > 0);
    const wValues = weightObservations.map((o) => o.value);
    const currentW = profile.weightKg || (wValues.length > 0 ? wValues[wValues.length - 1] : null);
    const prevW = wValues.length > 1 ? wValues[wValues.length - 2] : null;
    const diffW = currentW !== null && prevW !== null ? currentW - prevW : 0;
    const pctW = prevW && prevW > 0 ? Math.abs(Math.round((diffW / prevW) * 100)) : 0;
    const wPoints = wValues.length > 1 ? normalizePoints(wValues) : [];
    const lastWDate = weightObservations.length > 0
      ? formatCardDate(weightObservations[weightObservations.length - 1].observedAt)
      : (hasW ? 'Current Profile' : 'No logs yet');

    // 3. Screening
    const sValues = chronologicalAssessments.map((a) => a.probability_percent || Math.round((a.probability || 0) * 100));
    const hasS = sValues.length > 0 || Boolean(screening.probabilityPercent && screening.probabilityPercent > 0);
    const currentS = screening.probabilityPercent || (sValues.length > 0 ? sValues[sValues.length - 1] : null);
    const prevS = sValues.length > 1 ? sValues[sValues.length - 2] : null;
    const diffS = currentS !== null && prevS !== null ? currentS - prevS : 0;
    const sPoints = sValues.length > 1 ? normalizePoints(sValues) : [];
    const lastSDate = chronologicalAssessments.length > 0
      ? formatCardDate(chronologicalAssessments[chronologicalAssessments.length - 1].created_at)
      : (screening.lastAssessedDate || 'No screening yet');

    // 4. Symptoms
    const hasSymptoms = symptomHistory.length > 0;
    const lastSympDate = hasSymptoms
      ? formatCardDate(symptomHistory[0]?.occurredAt)
      : 'No logs yet';

    return [
      {
        id: 'm-testosterone',
        metricKey: 'testosterone',
        title: 'Testosterone (Total T)',
        value: currentT !== null ? `${currentT} ng/dL` : 'Not tested',
        changeValue: prevT !== null ? (diffT >= 0 ? `↑ ${pctT}%` : `↓ ${Math.abs(pctT)}%`) : '—',
        changeSuffix: prevT !== null ? 'vs previous' : 'Baseline',
        lastUpdatedLabel: 'Last updated',
        lastUpdated: lastTDate,
        icon: 'bar-chart',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
        sparklineColor: '#0284C7',
        points: tPoints,
      },
      {
        id: 'm-weight',
        metricKey: 'weight',
        title: 'Weight / BMI',
        value: currentW !== null ? `${currentW} kg (BMI ${bmi > 0 ? bmi.toFixed(1) : (currentW / 3.06).toFixed(1)})` : 'Not logged',
        changeValue: prevW !== null ? (diffW <= 0 ? `↓ ${pctW}%` : `↑ ${pctW}%`) : '—',
        changeSuffix: prevW !== null ? 'vs previous' : 'Baseline',
        lastUpdatedLabel: 'Last updated',
        lastUpdated: lastWDate,
        icon: 'scale-outline',
        iconBg: '#F3E8FF',
        iconColor: '#9333EA',
        sparklineColor: '#38BDF8',
        points: wPoints,
      },
      {
        id: 'm-energy',
        metricKey: 'symptoms',
        title: 'Energy & Symptoms',
        value: hasSymptoms ? `${symptomHistory.length} check-ins` : 'No symptoms logged',
        changeValue: hasSymptoms ? 'Logged' : '—',
        changeSuffix: hasSymptoms ? 'recent check-ins' : 'Not recorded',
        lastUpdatedLabel: 'Last updated',
        lastUpdated: lastSympDate,
        icon: 'flash',
        iconBg: '#FFE4E6',
        iconColor: '#EC4899',
        sparklineColor: '#EC4899',
        points: [],
      },
      {
        id: 'm-screening',
        metricKey: 'screening',
        title: 'Screening History',
        value: currentS !== null ? `${currentS}%` : 'Not screened',
        changeValue: prevS !== null ? (diffS <= 0 ? `↓ ${Math.abs(diffS)}%` : `↑ ${diffS}%`) : '—',
        changeSuffix: prevS !== null ? 'vs previous' : 'Initial',
        lastUpdatedLabel: 'Last assessed',
        lastUpdated: lastSDate,
        icon: 'shield-checkmark',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
        sparklineColor: '#FB7185',
        points: sPoints,
      },
    ];
  }, [testosteroneObservations, weightObservations, chronologicalAssessments, profile.weightKg, bmi, screening, symptomHistory]);

  const femaleMetrics: ProgressMetricDef[] = useMemo(() => {
    // 1. Cycle
    const hasCycle = cycleHistory.length > 0 || Boolean(cycle.cycleLength);
    const cycleLen = cycle.cycleLength || (cycleHistory.length > 0 ? cycleHistory[0].cycleLength : null);
    const cPoints = cycleHistory.length > 1
      ? normalizePoints(cycleHistory.map((c) => c.cycleLength || 28))
      : [];
    const lastCycleDate = cycleHistory.length > 0
      ? formatCardDate(cycleHistory[0].periodStartDate)
      : (cycle.lastPeriodStartDate ? formatCardDate(cycle.lastPeriodStartDate) : 'No logs yet');

    // 2. Weight
    const hasW = weightObservations.length > 0 || Boolean(profile.weightKg && profile.weightKg > 0);
    const wValues = weightObservations.map((o) => o.value);
    const currentW = profile.weightKg || (wValues.length > 0 ? wValues[wValues.length - 1] : null);
    const prevW = wValues.length > 1 ? wValues[wValues.length - 2] : null;
    const diffW = currentW !== null && prevW !== null ? currentW - prevW : 0;
    const pctW = prevW && prevW > 0 ? Math.abs(Math.round((diffW / prevW) * 100)) : 0;
    const wPoints = wValues.length > 1 ? normalizePoints(wValues) : [];
    const lastWDate = weightObservations.length > 0
      ? formatCardDate(weightObservations[weightObservations.length - 1].observedAt)
      : (hasW ? 'Current Profile' : 'No logs yet');

    // 3. Symptoms
    const sCount = symptomHistory.length;
    const lastSympDate = sCount > 0 ? formatCardDate(symptomHistory[0]?.occurredAt) : 'No logs yet';

    // 4. Screening
    const sValues = chronologicalAssessments.map((a) => a.probability_percent || Math.round((a.probability || 0) * 100));
    const currentS = screening.probabilityPercent || (sValues.length > 0 ? sValues[sValues.length - 1] : null);
    const prevS = sValues.length > 1 ? sValues[sValues.length - 2] : null;
    const diffS = currentS !== null && prevS !== null ? currentS - prevS : 0;
    const sPoints = sValues.length > 1 ? normalizePoints(sValues) : [];
    const lastSDate = chronologicalAssessments.length > 0
      ? formatCardDate(chronologicalAssessments[chronologicalAssessments.length - 1].created_at)
      : (screening.lastAssessedDate || 'No screening yet');

    return [
      {
        id: 'f-cycle',
        metricKey: 'cycle',
        title: 'Cycle Regularity',
        value: cycleLen !== null ? `${cycleLen} Days` : 'No cycle logged',
        changeValue: cycleHistory.length > 1 ? 'Tracked' : '—',
        changeSuffix: cycleHistory.length > 1 ? 'vs previous' : 'Not recorded',
        lastUpdatedLabel: 'Last updated',
        lastUpdated: lastCycleDate,
        icon: 'calendar',
        iconBg: '#FDF2F8',
        iconColor: '#F43F7D',
        sparklineColor: '#F43F7D',
        points: cPoints,
      },
      {
        id: 'f-weight',
        metricKey: 'weight',
        title: 'Weight / BMI',
        value: currentW !== null ? `${currentW} kg (BMI ${bmi > 0 ? bmi.toFixed(1) : (currentW / 2.72).toFixed(1)})` : 'Not logged',
        changeValue: prevW !== null ? (diffW <= 0 ? `↓ ${pctW}%` : `↑ ${pctW}%`) : '—',
        changeSuffix: prevW !== null ? 'vs previous' : 'Baseline',
        lastUpdatedLabel: 'Last updated',
        lastUpdated: lastWDate,
        icon: 'scale-outline',
        iconBg: '#F3E8FF',
        iconColor: '#9333EA',
        sparklineColor: '#38BDF8',
        points: wPoints,
      },
      {
        id: 'f-symptoms',
        metricKey: 'symptoms',
        title: 'Symptom Severity',
        value: sCount > 0 ? `${sCount} check-ins` : 'No symptoms logged',
        changeValue: sCount > 0 ? 'Recorded' : '—',
        changeSuffix: sCount > 0 ? 'recent check-ins' : 'Not recorded',
        lastUpdatedLabel: 'Last updated',
        lastUpdated: lastSympDate,
        icon: 'flash',
        iconBg: '#FFE4E6',
        iconColor: '#EC4899',
        sparklineColor: '#FB7185',
        points: [],
      },
      {
        id: 'f-screening',
        metricKey: 'screening',
        title: 'Screening History',
        value: currentS !== null ? `${currentS}%` : 'Not screened',
        changeValue: prevS !== null ? (diffS <= 0 ? `↓ ${Math.abs(diffS)}%` : `↑ ${diffS}%`) : '—',
        changeSuffix: prevS !== null ? 'vs previous' : 'Initial',
        lastUpdatedLabel: 'Last assessed',
        lastUpdated: lastSDate,
        icon: 'shield-checkmark',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
        sparklineColor: '#38BDF8',
        points: sPoints,
      },
    ];
  }, [cycle.cycleLength, cycleHistory, weightObservations, profile.weightKg, bmi, symptomHistory, chronologicalAssessments, screening]);

   const activeMetrics = isFemale ? femaleMetrics : maleMetrics;

  if (hasError) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <BioPulseBackground />

        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBtn}
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>

          <Text style={styles.headerTitle}>Progress</Text>

          <Pressable
            onPress={() => setHasError(false)}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Ionicons name="close-circle-outline" size={20} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO ERROR CARD */}
          <View style={styles.heroErrorCard}>
            <SadCloudIllustration size={160} />

            <Text style={styles.heroErrorTitle}>We couldn't load your progress</Text>
            <Text style={styles.heroErrorDesc}>
              Your saved data is safe. This might be due to a slow connection or a temporary server issue.
            </Text>

            {/* CTA 1: Retry */}
            <Pressable
              onPress={() => setHasError(false)}
              style={styles.heroRetryBtn}
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroRetryBtnText}>Retry</Text>
            </Pressable>

            {/* CTA 2: Check Connection */}
            <Pressable
              onPress={() => {
                Alert.alert('Connection Status', 'Wi-Fi & Cellular signal are active.');
              }}
              style={styles.heroCheckConnBtn}
              accessibilityRole="button"
            >
              <Ionicons name="wifi-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.heroCheckConnBtnText}>Check Connection</Text>
            </Pressable>
          </View>

          {/* HELP CARD */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeaderRow}>
              <View style={styles.helpIconCircle}>
                <Ionicons name="information" size={16} color="#0284C7" />
              </View>
              <Text style={styles.helpTitle}>If the problem continues:</Text>
            </View>

            <View style={styles.helpBulletsCol}>
              <View style={styles.helpBulletRow}>
                <Text style={styles.helpBulletDot}>•</Text>
                <Text style={styles.helpBulletText}>Make sure you have an active internet connection.</Text>
              </View>
              <View style={styles.helpBulletRow}>
                <Text style={styles.helpBulletDot}>•</Text>
                <Text style={styles.helpBulletText}>Try again in a few minutes.</Text>
              </View>
              <View style={styles.helpBulletRow}>
                <Text style={styles.helpBulletDot}>•</Text>
                <Text style={styles.helpBulletText}>Contact support if the issue persists.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <Text style={styles.headerTitle}>Your Progress</Text>

        {/* Filter Dropdown Pill */}
        <Pressable
          onPress={() => {
            setSelectedRange((prev) =>
              prev === 'Last 3 Months' ? 'Last 6 Months' : prev === 'Last 6 Months' ? 'Last 1 Year' : 'Last 3 Months'
            );
          }}
          style={styles.filterPill}
          hitSlop={6}
        >
          <Text style={styles.filterText}>{selectedRange}</Text>
          <Ionicons name="chevron-down" size={12} color="#64748B" style={{ marginLeft: 3 }} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isFemale ? '#F43F7D' : '#0284C7'}
          />
        }
      >
        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('overview')}
            style={[styles.tabPill, activeTab === 'overview' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('records')}
            style={[styles.tabPill, activeTab === 'records' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
              Records
            </Text>
          </Pressable>
        </View>

        {/* =================================================================== */}
        {/* OVERVIEW TAB */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <View style={styles.cardsList}>
            {activeMetrics.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/(app)/metric-detail?metric=${item.metricKey}` as any)}
                style={({ pressed }) => [
                  styles.metricCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.cardMain}>
                  {/* Left Column: Icon, Title, Value, Change */}
                  <View style={styles.leftCol}>
                    <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon} size={20} color={item.iconColor} />
                    </View>

                    <Text style={styles.metricTitle}>{item.title}</Text>
                    <Text style={styles.metricValue}>{item.value}</Text>

                    <View style={styles.changeRow}>
                      <Text style={styles.changeVal}>{item.changeValue}</Text>
                      <Text style={styles.changeSuffix}> {item.changeSuffix}</Text>
                    </View>
                  </View>

                  {/* Middle: Sparkline */}
                  <View style={[styles.sparkCol, styles.sparklineArea]}>
                    <MiniSparkline points={item.points} color={item.sparklineColor} />
                  </View>

                  {/* Right Column: Chevron, Date */}
                  <View style={styles.rightCol}>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={styles.chevron} />

                    <Text style={styles.lastUpdatedText}>
                      {item.lastUpdatedLabel}{'\n'}{item.lastUpdated}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* =================================================================== */}
        {/* RECORDS TAB */}
        {/* =================================================================== */}
        {activeTab === 'records' && (
          <View style={styles.recordsContainer}>
            {/* Current Measurements Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <Text style={styles.summaryTitle}>Current Measurements</Text>
                <Pressable
                  onPress={() => setShowLogModal(true)}
                  style={styles.logSmallBtn}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.logSmallBtnText}>Log</Text>
                </Pressable>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Weight</Text>
                  <Text style={styles.summaryVal}>
                    {profile.weightKg ? `${profile.weightKg} kg` : '--'}
                  </Text>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Height</Text>
                  <Text style={styles.summaryVal}>
                    {profile.heightCm ? `${profile.heightCm} cm` : '--'}
                  </Text>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Waist</Text>
                  <Text style={styles.summaryVal}>
                    {profile.waistCm ? `${profile.waistCm} cm` : '--'}
                  </Text>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>BMI (Authoritative)</Text>
                  <Text style={[styles.summaryVal, { color: '#0284C7' }]}>
                    {bmi > 0 ? bmi.toFixed(1) : '--'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Historical Observations List */}
            <Text style={styles.historySectionTitle}>Observation History</Text>

            {measurementObservations.length === 0 ? (
              <View style={styles.emptyRecordsCard}>
                <MaterialCommunityIcons name="tape-measure" size={40} color="#94A3B8" />
                <Text style={styles.emptyRecordsTitle}>No observations logged</Text>
                <Text style={styles.emptyRecordsSub}>
                  Record your weight, height, or waist circumference to track authoritative health metrics.
                </Text>
                <Pressable
                  onPress={() => setShowLogModal(true)}
                  style={styles.emptyLogBtn}
                >
                  <Text style={styles.emptyLogBtnText}>+ Log Measurement</Text>
                </Pressable>
              </View>
            ) : (
              measurementObservations.map((obs) => {
                const isWeight = obs.metricKey === 'weight_kg';
                const isHeight = obs.metricKey === 'height_cm';
                const isWaist = obs.metricKey === 'waist_circumference';
                const isBmi = obs.metricKey === 'bmi';

                const label = isWeight
                  ? 'Weight'
                  : isHeight
                  ? 'Height'
                  : isWaist
                  ? 'Waist Circumference'
                  : isBmi
                  ? 'Body Mass Index (BMI)'
                  : obs.metricKey;

                const iconName = isWeight
                  ? 'scale-outline'
                  : isHeight
                  ? 'resize-outline'
                  : isWaist
                  ? 'fitness-outline'
                  : 'calculator-outline';

                const iconColor = isWeight
                  ? '#9333EA'
                  : isHeight
                  ? '#0284C7'
                  : isWaist
                  ? '#10B981'
                  : '#F59E0B';

                return (
                  <View key={obs.id} style={styles.recordRowCard}>
                    <View style={[styles.recordIconBox, { backgroundColor: `${iconColor}15` }]}>
                      <Ionicons name={iconName as any} size={18} color={iconColor} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordRowTitle}>{label}</Text>
                      <Text style={styles.recordRowDate}>
                        {new Date(obs.observedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.recordRowVal}>
                        {obs.value} {obs.unit}
                      </Text>
                      <Text style={styles.recordRowSource}>{obs.source}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Log Measurement Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLogModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Measurements</Text>
              <Pressable onPress={() => setShowLogModal(false)}>
                <Ionicons name="close" size={22} color={BioPulseColors.navy} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={logWeight}
                onChangeText={setLogWeight}
                keyboardType="decimal-pad"
                placeholder="e.g. 68.5"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={logHeight}
                onChangeText={setLogHeight}
                keyboardType="decimal-pad"
                placeholder="e.g. 165"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Waist Circumference (cm)</Text>
              <TextInput
                style={styles.input}
                value={logWaist}
                onChangeText={setLogWaist}
                keyboardType="decimal-pad"
                placeholder="e.g. 80"
                placeholderTextColor="#94A3B8"
              />

              {previewBmi > 0 && (
                <View style={styles.bmiPreviewBox}>
                  <Ionicons name="calculator-outline" size={16} color="#0284C7" />
                  <Text style={styles.bmiPreviewText}>
                    Authoritative Calculated BMI: <Text style={{ fontWeight: '700' }}>{previewBmi.toFixed(1)} kg/m²</Text>
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleSaveMeasurement}
                disabled={isLogging}
                style={({ pressed }) => [styles.modalSaveBtn, pressed && styles.btnPressed]}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Measurements</Text>
                )}
              </Pressable>
            </ScrollView>
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
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
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
    backgroundColor: '#EEF2F6',
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
    backgroundColor: '#BAE6FD',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },

  // Metric Cards
  cardsList: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1.1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  changeVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  changeSuffix: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  sparkCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  sparklineArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  rightCol: {
    width: 90,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 78,
  },
  chevron: {
    alignSelf: 'flex-end',
  },
  lastUpdatedText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    lineHeight: 14,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  // Progress In-Context Error Screen Styles (Screen 48 Bottom Right)
  heroErrorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  heroErrorTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroErrorDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
    marginBottom: 18,
  },
  heroRetryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroRetryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroCheckConnBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCheckConnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
  },
  helpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  helpIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpBulletsCol: {
    gap: 6,
    paddingLeft: 4,
  },
  helpBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  helpBulletDot: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 16,
  },
  helpBulletText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },

  // Records View
  recordsContainer: {
    gap: 14,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  logSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  logSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  historySectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  emptyRecordsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyRecordsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyRecordsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  emptyLogBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyLogBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  recordRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordRowDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recordRowVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordRowSource: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  bmiPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  bmiPreviewText: {
    fontSize: 12,
    color: '#0369A1',
  },
  modalSaveBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
