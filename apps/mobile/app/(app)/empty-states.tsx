import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { SaladBowlIllustration } from '../../components/ui/StateIllustrations';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * Custom vector mini illustrations for each of the 6 empty state cards
 */
function ScreeningCardIllustration() {
  return (
    <View style={styles.miniIllContainer}>
      <View style={styles.clipboardBase}>
        {/* Clip top */}
        <View style={styles.clipboardClip} />
        {/* Paper cross */}
        <View style={styles.paperBody}>
          <Ionicons name="add" size={24} color="#E11D48" />
        </View>
      </View>
    </View>
  );
}

function MealsCardIllustration() {
  return (
    <View style={styles.miniIllContainer}>
      <SaladBowlIllustration size={72} />
    </View>
  );
}

function CycleCardIllustration() {
  return (
    <View style={styles.miniIllContainer}>
      <View style={styles.calendarMiniBody}>
        <View style={styles.calendarMiniHeader}>
          <View style={styles.calendarPeg} />
          <View style={styles.calendarPeg} />
        </View>
        <View style={styles.calendarMiniGrid}>
          <View style={[styles.calendarDot, { backgroundColor: '#E11D48' }]} />
          <View style={[styles.calendarDot, { backgroundColor: '#FECDD3' }]} />
          <View style={[styles.calendarDot, { backgroundColor: '#E11D48' }]} />
          <View style={[styles.calendarDot, { backgroundColor: '#FECDD3' }]} />
          <View style={[styles.calendarDot, { backgroundColor: '#E11D48' }]} />
          <View style={[styles.calendarDot, { backgroundColor: '#E11D48' }]} />
        </View>
      </View>
    </View>
  );
}

function MedicationCardIllustration() {
  return (
    <View style={styles.miniIllContainer}>
      <View style={styles.pillMiniGraphic}>
        <View style={styles.pillLeftHalf} />
        <View style={styles.pillRightHalf} />
      </View>
      <View style={[styles.miniSparkle, { top: 2, right: 8 }]}>
        <Ionicons name="sparkles" size={10} color="#38BDF8" />
      </View>
    </View>
  );
}

function DoctorCardIllustration() {
  return (
    <View style={styles.miniIllContainer}>
      <View style={styles.doctorMiniAvatar}>
        <Ionicons name="person" size={28} color="#0284C7" />
        <View style={styles.doctorPlusBadge}>
          <Ionicons name="add" size={10} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

function ReportCardIllustration() {
  return (
    <View style={styles.miniIllContainer}>
      <View style={styles.reportDocMini}>
        <View style={styles.reportFold} />
        <View style={styles.reportChartLine}>
          <Ionicons name="bar-chart" size={18} color="#0284C7" />
        </View>
      </View>
    </View>
  );
}

/**
 * SCREEN 47: Empty States
 *
 * Strict visual match to Screenshot 47:
 * - Top Middle: Empty States 2x3 Overview Grid
 *   - No screening yet (Start Screening -> hot pink)
 *   - No meals logged today (Log a Meal -> teal/green)
 *   - No cycle data (Add Cycle Data -> hot pink)
 *   - No medications (Add Medication -> blue)
 *   - No appointments yet (Find a Doctor -> hot pink)
 *   - No reports yet (Upload a Report -> blue)
 * - Bottom Middle: Dedicated Meals In-Context Empty State
 *   - Salad bowl hero illustration
 *   - "No meals logged today"
 *   - "Log a Meal" (primary) & "View Meal Plan" (secondary)
 *   - "Why log meals?" educational card with 3 green checkmarks
 */
export default function EmptyStatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // View toggle: 'grid' (Screen 47 Top Middle) or 'meals' (Screen 47 Bottom Middle)
  const [viewMode, setViewMode] = useState<'grid' | 'meals'>('grid');

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP HEADER */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => {
            if (viewMode === 'meals') {
              setViewMode('grid');
            } else {
              router.back();
            }
          }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.navy} />
        </Pressable>

        <Text style={styles.headerTitle}>
          {viewMode === 'grid' ? 'Empty States' : 'Meals'}
        </Text>

        {/* View mode toggle pill */}
        <Pressable
          onPress={() => setViewMode((prev) => (prev === 'grid' ? 'meals' : 'grid'))}
          style={styles.viewToggleBtn}
          accessibilityRole="button"
        >
          <Ionicons
            name={viewMode === 'grid' ? 'restaurant-outline' : 'grid-outline'}
            size={18}
            color="#E11D48"
          />
        </Pressable>
      </View>

      {/* MODE 1: SCREEN 47 (TOP MIDDLE) - 2X3 EMPTY STATES GRID */}
      {viewMode === 'grid' ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
            { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridRow}>
            {/* CARD 1: No screening yet */}
            <View style={styles.gridCard}>
              <ScreeningCardIllustration />
              <Text style={styles.cardTitle}>No screening yet</Text>
              <Text style={styles.cardDesc}>
                Complete your screening to get personalized insights.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/screening')}
                style={[styles.cardBtn, { backgroundColor: '#E11D48' }]}
                accessibilityRole="button"
              >
                <Text style={styles.cardBtnText}>Start Screening</Text>
              </Pressable>
            </View>

            {/* CARD 2: No meals logged today */}
            <View style={styles.gridCard}>
              <MealsCardIllustration />
              <Text style={styles.cardTitle}>No meals logged today</Text>
              <Text style={styles.cardDesc}>
                Start logging meals to receive more relevant nutrition insights.
              </Text>
              <Pressable
                onPress={() => setViewMode('meals')}
                style={[styles.cardBtn, { backgroundColor: '#0D9488' }]}
                accessibilityRole="button"
              >
                <Text style={styles.cardBtnText}>Log a Meal</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* CARD 3: No cycle data */}
            <View style={styles.gridCard}>
              <CycleCardIllustration />
              <Text style={styles.cardTitle}>No cycle data</Text>
              <Text style={styles.cardDesc}>
                Track your period to monitor your cycle and get better PCOS insights.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/cycle-tracking')}
                style={[styles.cardBtn, { backgroundColor: '#E11D48' }]}
                accessibilityRole="button"
              >
                <Text style={styles.cardBtnText}>Add Cycle Data</Text>
              </Pressable>
            </View>

            {/* CARD 4: No medications */}
            <View style={styles.gridCard}>
              <MedicationCardIllustration />
              <Text style={styles.cardTitle}>No medications</Text>
              <Text style={styles.cardDesc}>
                Add your medications to get reminders and stay on track.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/medications')}
                style={[styles.cardBtn, { backgroundColor: '#0284C7' }]}
                accessibilityRole="button"
              >
                <Text style={styles.cardBtnText}>Add Medication</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* CARD 5: No appointments yet */}
            <View style={styles.gridCard}>
              <DoctorCardIllustration />
              <Text style={styles.cardTitle}>No appointments yet</Text>
              <Text style={styles.cardDesc}>
                Book a consultation with a specialist for professional guidance.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/specialists')}
                style={[styles.cardBtn, { backgroundColor: '#E11D48' }]}
                accessibilityRole="button"
              >
                <Text style={styles.cardBtnText}>Find a Doctor</Text>
              </Pressable>
            </View>

            {/* CARD 6: No reports yet */}
            <View style={styles.gridCard}>
              <ReportCardIllustration />
              <Text style={styles.cardTitle}>No reports yet</Text>
              <Text style={styles.cardDesc}>
                Your lab reports and summaries will appear here.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/ocr-upload')}
                style={[styles.cardBtn, { backgroundColor: '#0284C7' }]}
                accessibilityRole="button"
              >
                <Text style={styles.cardBtnText}>Upload a Report</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* MODE 2: SCREEN 47 (BOTTOM MIDDLE) - DEDICATED MEALS IN-CONTEXT EMPTY STATE */
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
            { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO EMPTY STATE SECTION */}
          <View style={styles.heroSection}>
            <SaladBowlIllustration size={160} />

            <Text style={styles.heroTitle}>No meals logged today</Text>
            <Text style={styles.heroDesc}>
              Start logging meals to receive more relevant nutrition insights and personalized meal recommendations.
            </Text>

            {/* CTA 1: Log a Meal */}
            <Pressable
              onPress={() => router.push('/(app)/nutrition')}
              style={styles.heroPrimaryBtn}
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroPrimaryBtnText}>Log a Meal</Text>
            </Pressable>

            {/* CTA 2: View Meal Plan */}
            <Pressable
              onPress={() => router.push('/(app)/meal-plan')}
              style={styles.heroSecondaryBtn}
              accessibilityRole="button"
            >
              <Ionicons name="book-outline" size={18} color="#E11D48" style={{ marginRight: 6 }} />
              <Text style={styles.heroSecondaryBtnText}>View Meal Plan</Text>
            </Pressable>
          </View>

          {/* "WHY LOG MEALS?" CARD */}
          <View style={styles.whyCard}>
            <View style={styles.whyHeaderRow}>
              <View style={styles.whyIconCircle}>
                <Ionicons name="bulb-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.whyTitle}>Why log meals?</Text>
            </View>

            <View style={styles.whyBulletsCol}>
              <View style={styles.whyBulletRow}>
                <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                <Text style={styles.whyBulletText}>Helps in personalized nutrition plans</Text>
              </View>
              <View style={styles.whyBulletRow}>
                <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                <Text style={styles.whyBulletText}>Supports better weight and hormonal health</Text>
              </View>
              <View style={styles.whyBulletRow}>
                <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                <Text style={styles.whyBulletText}>Provides relevant food recommendations</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <BioPulseBottomNav activeTab="more" />
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
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 210,
  },
  miniIllContainer: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  clipboardBase: {
    width: 44,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clipboardClip: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  paperBody: {
    width: 32,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMiniBody: {
    width: 46,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    overflow: 'hidden',
    alignItems: 'center',
  },
  calendarMiniHeader: {
    width: '100%',
    height: 12,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  calendarPeg: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  calendarMiniGrid: {
    flex: 1,
    padding: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillMiniGraphic: {
    width: 44,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pillLeftHalf: {
    flex: 1,
    backgroundColor: '#0284C7',
  },
  pillRightHalf: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  miniSparkle: {
    position: 'absolute',
  },
  doctorMiniAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  doctorPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportDocMini: {
    width: 42,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reportFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderBottomLeftRadius: 4,
    backgroundColor: '#BAE6FD',
  },
  reportChartLine: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 10,
  },
  cardBtn: {
    width: '100%',
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // HERO IN-CONTEXT MEALS STYLES
  heroSection: {
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
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
    marginBottom: 20,
  },
  heroPrimaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSecondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48',
  },
  // WHY LOG MEALS CARD
  whyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  whyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  whyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  whyBulletsCol: {
    gap: 8,
  },
  whyBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whyBulletText: {
    fontSize: 12,
    color: '#475569',
  },
});
