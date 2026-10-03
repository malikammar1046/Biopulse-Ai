import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function MovementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const { movement, logActivity } = useHealthStore();

  const weeklyTrend = [
    { day: 'Mon', mins: 35, goalMet: true },
    { day: 'Tue', mins: 45, goalMet: true },
    { day: 'Wed', mins: 20, goalMet: false },
    { day: 'Thu', mins: 50, goalMet: true },
    { day: 'Fri', mins: 40, goalMet: true },
    { day: 'Sat', mins: 60, goalMet: true },
    { day: 'Sun', mins: movement.todayActivityMinutes, goalMet: movement.todayActivityMinutes >= movement.targetMinutes },
  ];

  const handleQuickAdd = useCallback((mins: number, steps: number, name: string) => {
    logActivity(mins, steps);
    Alert.alert(
      'Activity Logged',
      `Added ${mins} minutes (${steps > 0 ? `${steps} steps` : name}) to today's movement totals.`,
      [{ text: 'OK' }]
    );
  }, [logActivity]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Physical Movement</Text>
          <Text style={styles.headerSub}>
            {isFemale ? 'GLUT4 Glucose Uptake & Insulin Sensitivity' : 'Steroidogenic Resistance Stimulus'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Activity Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="barbell-outline" size={22} color="#16A34A" />
              </View>
              <Text style={styles.bigVal}>{movement.todayActivityMinutes}</Text>
              <Text style={styles.valUnit}>min active today</Text>
              <Text style={styles.goalSub}>Goal: {movement.targetMinutes} min</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="walk-outline" size={22} color="#0284C7" />
              </View>
              <Text style={styles.bigVal}>{movement.todaySteps.toLocaleString()}</Text>
              <Text style={styles.valUnit}>steps logged</Text>
              <Text style={styles.goalSub}>Goal: 10,000</Text>
            </View>
          </View>
        </View>

        {/* Quick Log Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Quick Log Activity</Text>
          <View style={styles.quickButtonsRow}>
            <Pressable
              onPress={() => handleQuickAdd(15, 1500, 'Post-Meal Walk')}
              style={({ pressed }) => [styles.quickLogBtn, pressed && styles.quickLogBtnPressed]}
            >
              <Ionicons name="walk" size={16} color="#16A34A" />
              <Text style={styles.quickLogBtnText}>+15m Walk (1.5k)</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAdd(30, 800, 'Strength Training')}
              style={({ pressed }) => [styles.quickLogBtn, pressed && styles.quickLogBtnPressed]}
            >
              <Ionicons name="barbell" size={16} color="#0284C7" />
              <Text style={styles.quickLogBtnText}>+30m Strength</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAdd(20, 2000, 'Brisk Jog')}
              style={({ pressed }) => [styles.quickLogBtn, pressed && styles.quickLogBtnPressed]}
            >
              <Ionicons name="bicycle" size={16} color="#EA580C" />
              <Text style={styles.quickLogBtnText}>+20m Cardio</Text>
            </Pressable>
          </View>
        </View>

        {/* Weekly Trend Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Weekly Movement Minutes</Text>
          <View style={styles.barsContainer}>
            {weeklyTrend.map((t, idx) => {
              const maxMin = 60;
              const barHeight = Math.min(80, Math.round((t.mins / maxMin) * 80));
              return (
                <View key={idx} style={styles.barCol}>
                  <Text style={styles.barMinsText}>{t.mins}m</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: Math.max(8, barHeight),
                          backgroundColor: t.goalMet ? '#16A34A' : '#CBD5E1',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDayText}>{t.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Clinical Recommendation Card */}
        <View style={styles.recCard}>
          <View style={styles.recHeader}>
            <Ionicons name="fitness-outline" size={20} color={themeAccent} />
            <Text style={styles.recTitle}>
              {isFemale ? 'PCOS Movement Protocol' : 'Endocrine Resistance Protocol'}
            </Text>
          </View>
          <Text style={styles.recDesc}>
            {isFemale
              ? 'A 15-minute brisk walk immediately following your highest-carbohydrate meal mobilizes skeletal muscle GLUT4 glucose transporters without taxing the adrenal cortisol axis.'
              : 'Heavy compound resistance training (3 sessions weekly with 48h rest) optimizes androgen receptor sensitivity and preserves lean muscle mass.'}
          </Text>
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Nav */}
      <BioPulseBottomNav activeTab="track" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  headerSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bigVal: {
    fontSize: 24,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  valUnit: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginBottom: 4,
  },
  goalSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E2E8F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 12,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickLogBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    gap: 4,
  },
  quickLogBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  quickLogBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barMinsText: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: 14,
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  recDesc: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    lineHeight: 18,
  },
});
