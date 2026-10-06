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
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function TrackHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const themeColor = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';

  const {
    water,
    addWaterMl,
    nutrition,
    cycle,
    movement,
    medications,
    markMedicationStatus,
    symptoms,
  } = useHealthStore();

  const takenMedsCount = medications.filter((m) => m.status === 'taken').length;
  const waterLiters = water.consumedLiters.toFixed(1);
  const waterTargetLiters = water.targetLiters.toFixed(1);
  const reportedSymptomsCount = symptoms.symptoms.filter((s) => s.selected).length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tracking Hub</Text>
          <Text style={styles.headerSubtitle}>
            {isFemale ? 'Endocrine, Cycle & Metabolic Rhythm' : 'Hormonal Health & Vitality Monitor'}
          </Text>
        </View>

        <View style={[styles.pathwayBadge, { backgroundColor: themeSoftBg }]}>
          <Text style={[styles.pathwayBadgeText, { color: themeColor }]}>
            {isFemale ? '♀ PCOS Path' : '♂ Andro Path'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* Daily Quick Summary Strip */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryCol}>
              <Ionicons name="water" size={16} color="#0284C7" />
              <Text style={styles.summaryVal}>{waterLiters}L</Text>
              <Text style={styles.summaryLabel}>Water</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Ionicons name="flame" size={16} color="#EA580C" />
              <Text style={styles.summaryVal}>{nutrition.caloriesConsumed}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Ionicons name="walk" size={16} color="#16A34A" />
              <Text style={styles.summaryVal}>{movement.todayActivityMinutes}m</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Ionicons name="medkit" size={16} color={themeColor} />
              <Text style={styles.summaryVal}>{takenMedsCount}/{medications.length}</Text>
              <Text style={styles.summaryLabel}>Meds</Text>
            </View>
          </View>

          {/* 1. Female Only: Cycle Tracking Card */}
          {isFemale && (
            <Pressable
              onPress={() => router.push('/(app)/cycle-tracking')}
              style={({ pressed }) => [styles.trackCard, pressed && styles.cardPressed]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: '#FFF2F7' }]}>
                  <Ionicons name="calendar" size={22} color={BioPulseColors.femaleAccent} />
                </View>
                <View style={[styles.activePill, { backgroundColor: '#FCE7F3' }]}>
                  <Text style={[styles.activePillText, { color: '#BE185D' }]}>
                    Cycle Day {cycle.currentCycleDay} of {cycle.cycleLength}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Menstrual Cycle & Ovulation</Text>
              <Text style={styles.cardSub}>
                Current Phase: {cycle.phase} • Next period predicted in {cycle.nextPeriodDaysRemaining} days • Rhythm is {cycle.regularity}.
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.footerLink, { color: themeColor }]}>Open Cycle Calendar →</Text>
              </View>
            </Pressable>
          )}

          {/* 2. Symptoms Log Card */}
          <Pressable
            onPress={() => router.push('/(app)/symptom-log')}
            style={({ pressed }) => [styles.trackCard, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: themeSoftBg }]}>
                <Ionicons name="heart" size={22} color={themeColor} />
              </View>
              <View style={[styles.activePill, { backgroundColor: themeSoftBg }]}>
                <Text style={[styles.activePillText, { color: themeColor }]}>
                  {reportedSymptomsCount > 0 ? `${reportedSymptomsCount} Active Today` : 'Check-in Pending'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>
              {isFemale ? 'PCOS Symptom Pattern' : 'ADAM Symptom Tracker'}
            </Text>
            <Text style={styles.cardSub}>
              {isFemale
                ? 'Monitors acne, hirsutism, hair density, pelvic cramping, and daytime fatigue fluctuations.'
                : 'Tracks morning energy levels, libido, strength maintenance, and post-meal fatigue.'}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.footerLink, { color: themeColor }]}>Log Daily Symptoms →</Text>
            </View>
          </Pressable>

          {/* 3. Nutrition & Meal Tracking Card */}
          <Pressable
            onPress={() => router.push('/(app)/nutrition')}
            style={({ pressed }) => [styles.trackCard, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="restaurant" size={22} color="#EA580C" />
              </View>
              <View style={[styles.activePill, { backgroundColor: '#FFEDD5' }]}>
                <Text style={[styles.activePillText, { color: '#C2410C' }]}>
                  {nutrition.caloriesConsumed} / {nutrition.calorieTarget} kcal
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Nutrition & Macros</Text>
            <Text style={styles.cardSub}>
              {isFemale
                ? `Protein: ${nutrition.proteinConsumed}g • Carbs: ${nutrition.carbsConsumed}g • Fat: ${nutrition.fatsConsumed}g. Low-glycemic meals prevent postprandial insulin surges.`
                : `Protein: ${nutrition.proteinConsumed}g • Carbs: ${nutrition.carbsConsumed}g • Fat: ${nutrition.fatsConsumed}g. Micronutrient-rich support for testosterone synthesis.`}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.footerLink, { color: '#EA580C' }]}>Log Meal & View Plans →</Text>
            </View>
          </Pressable>

          {/* 4. Hydration Water Log Card */}
          <View style={styles.trackCard}>
            <Pressable onPress={() => router.push('/(app)/water-log')}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="water" size={22} color="#0284C7" />
                </View>
                <View style={[styles.activePill, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.activePillText, { color: '#0369A1' }]}>
                    {waterLiters} / {waterTargetLiters} L
                  </Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Hydration Tracker</Text>
              <Text style={styles.cardSub}>
                Maintains cellular hydration, supports hepatic clearance, and reduces fluid retention.
              </Text>
            </Pressable>

            {/* In-Card Quick Hydration Add */}
            <View style={styles.quickAddRow}>
              <Pressable
                onPress={() => addWaterMl(250)}
                style={({ pressed }) => [styles.quickAddBtn, pressed && styles.quickAddBtnPressed]}
              >
                <Ionicons name="add" size={14} color="#0284C7" />
                <Text style={styles.quickAddBtnText}>+250 ml</Text>
              </Pressable>
              <Pressable
                onPress={() => addWaterMl(500)}
                style={({ pressed }) => [styles.quickAddBtn, pressed && styles.quickAddBtnPressed]}
              >
                <Ionicons name="add" size={14} color="#0284C7" />
                <Text style={styles.quickAddBtnText}>+500 ml</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(app)/water-log')}
                style={styles.moreLinkWrap}
              >
                <Text style={styles.moreLinkText}>History →</Text>
              </Pressable>
            </View>
          </View>

          {/* 5. Physical Movement & Activity Card */}
          <Pressable
            onPress={() => router.push('/(app)/movement')}
            style={({ pressed }) => [styles.trackCard, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="barbell" size={22} color="#16A34A" />
              </View>
              <View style={[styles.activePill, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.activePillText, { color: '#15803D' }]}>
                  {movement.todayActivityMinutes} min • {movement.todaySteps.toLocaleString()} steps
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Physical Movement</Text>
            <Text style={styles.cardSub}>
              {isFemale
                ? 'Targeted post-meal walks and low-stress resistance exercise for GLUT4 glucose disposal.'
                : 'Compound resistance training and brisk walking to preserve lean mass and enhance testosterone.'}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.footerLink, { color: '#16A34A' }]}>View Activity Trends →</Text>
            </View>
          </Pressable>

          {/* 6. Medications & Supplements Card */}
          <View style={styles.trackCard}>
            <Pressable onPress={() => router.push('/(app)/medications')}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="medical" size={22} color="#7C3AED" />
                </View>
                <View style={[styles.activePill, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.activePillText, { color: '#6D28D9' }]}>
                    {takenMedsCount} of {medications.length} Taken
                  </Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Medications & Supplements</Text>
              <Text style={styles.cardSub}>
                Daily scheduled doses tailored to your metabolic and hormonal protocol.
              </Text>
            </Pressable>

            {/* Quick med items list with inline check toggle */}
            <View style={styles.medsQuickList}>
              {medications.slice(0, 2).map((med) => (
                <View key={med.id} style={styles.medQuickItem}>
                  <Pressable
                    onPress={() => markMedicationStatus(med.id, med.status === 'taken' ? 'pending' : 'taken')}
                    style={[
                      styles.medCheckCircle,
                      med.status === 'taken' && { backgroundColor: '#10B981', borderColor: '#10B981' },
                    ]}
                  >
                    {med.status === 'taken' && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.medQuickName, med.status === 'taken' && styles.medQuickNameDone]}>
                      {med.name} ({med.dosage})
                    </Text>
                    <Text style={styles.medQuickTime}>{med.scheduledTime} • {med.instructions}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Pressable onPress={() => router.push('/(app)/medications')}>
                <Text style={[styles.footerLink, { color: '#7C3AED' }]}>View All Prescriptions →</Text>
              </Pressable>
            </View>
          </View>
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginTop: 2,
  },
  pathwayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  pathwayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
  container: {
    gap: 14,
  },
  tabletContainer: {
    width: '100%',
  },
  summaryBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  summaryCol: {
    alignItems: 'center',
    gap: 3,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  cardPressed: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  quickAddBtnPressed: {
    backgroundColor: '#E0F2FE',
  },
  quickAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  moreLinkWrap: {
    marginLeft: 'auto',
  },
  moreLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  medsQuickList: {
    gap: 8,
    marginBottom: 10,
  },
  medQuickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  medCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medQuickName: {
    fontSize: 12,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  medQuickNameDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  medQuickTime: {
    fontSize: 10,
    color: '#64748B',
  },
});
