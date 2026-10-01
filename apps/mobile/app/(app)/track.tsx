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
import { useFemaleOnboarding } from '../../features/onboarding';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN: TRACK HUB (Primary Navigation Destination 3)
 *
 * Implements:
 * - Pathway-aware longitudinal tracking center
 * - Female: Cycle Tracking, Symptoms Log, Rotterdam Progress
 * - Male: Hormonal Health, ADAM Symptoms, Endocrine Progress
 * - Direct deep links to existing screening modules
 * - Permanent BioPulse bottom navigation
 */
export default function TrackHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const { cycleHealth, symptoms } = useFemaleOnboarding();

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeColor = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tracking Hub</Text>
          <Text style={styles.headerSubtitle}>
            {isFemale ? 'Longitudinal Cycle & Endocrine Monitor' : 'Hormonal Health & Vitality Monitor'}
          </Text>
        </View>

        <View style={[styles.pathwayBadge, { backgroundColor: themeSoftBg }]}>
          <Text style={[styles.pathwayBadgeText, { color: themeColor }]}>
            {isFemale ? '♀ PCOS' : '♂ LOH'}
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
          {/* Female Only: Cycle Tracking Card */}
          {isFemale && (
            <Pressable
              onPress={() => router.push('/female-cycle-health')}
              style={({ pressed }) => [styles.trackCard, pressed && styles.cardPressed]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: '#FDF0F4' }]}>
                  <Ionicons name="calendar" size={22} color={BioPulseColors.femaleAccent} />
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Cycle Day 14</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Menstrual Cycle Rhythm</Text>
              <Text style={styles.cardSub}>
                Regularity: {cycleHealth.regularity} • Length: {cycleHealth.cycleLength} days • Recorded {cycleHealth.lastPeriodDate}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.footerLink, { color: themeColor }]}>View Cycle Calendar →</Text>
              </View>
            </Pressable>
          )}

          {/* Symptoms Log Card */}
          <Pressable
            onPress={() => router.push(isFemale ? '/female-symptoms' : '/(app)')}
            style={({ pressed }) => [styles.trackCard, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: themeSoftBg }]}>
                <Ionicons name="heart" size={22} color={themeColor} />
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{symptoms?.length || 0} Reported</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>
              {isFemale ? 'PCOS Symptom Pattern' : 'Androgen Symptom Scoring'}
            </Text>
            <Text style={styles.cardSub}>
              {isFemale
                ? 'Tracks hyperandrogenism, acanthosis nigricans, acne, and weight trends over 6–12 months.'
                : 'Tracks morning energy levels, libido, muscle mass maintenance, and mood stability.'}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.footerLink, { color: themeColor }]}>Update Symptoms Log →</Text>
            </View>
          </Pressable>

          {/* Longitudinal Progress Card */}
          <View style={styles.trackCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#F8FAFC' }]}>
                <Ionicons name="analytics" size={22} color="#0B1E38" />
              </View>
              <View style={styles.neutralPill}>
                <Text style={styles.neutralPillText}>Multi-Tier</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Progress & Biomarkers</Text>
            <Text style={styles.cardSub}>
              Longitudinal AI model synthesis correlates clinical lab markers (Tier 2) and ultrasound features (Tier 3) with your baseline profile.
            </Text>

            <View style={styles.cardFooter}>
              <Text style={styles.footerMutedText}>Requires active screening completion</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Permanent BioPulse Bottom Navigation */}
      <BioPulseBottomNav activeTab="track" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFCFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1E38',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  pathwayBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pathwayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: 14,
  },
  tabletContainer: {
    maxWidth: 580,
  },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  neutralPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  neutralPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1E38',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerMutedText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
