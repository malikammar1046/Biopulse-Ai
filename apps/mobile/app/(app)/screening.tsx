import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useHealthStore } from '../../store/healthStore';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');
const HERO_FEMALE_ART = require('../../assets/female_pathway_hero.png');
const HERO_MALE_ART = require('../../assets/male_pathway_hero.png');

/**
 * SCREEN 18: SCREENING OVERVIEW SCREEN
 * Adheres strictly to visual references:
 * - Female: ChatGPT Image Oct 2, 2026, 12_23_33 AM-1.png
 * - Male: ChatGPT Image Oct 2, 2026, 12_23_36 AM-2.png
 *
 * Implements:
 * - Brand Header: Logo, Tagline, Notification bell, Avatar
 * - Greeting & Pathway badge: "Good afternoon, [Name]", "PCOS Pathway" / "Hypogonadism Pathway"
 * - Card 1: Screening Overview with Donut Ring Gauge, Risk Band, Tier status, Non-diagnostic callout
 * - Card 2: Your Screening Journey / Progress with Stepper & "Continue to Next Tier ->" CTA
 * - Card 3: "What this means" Card (opens explanation)
 * - Card 4: "Assessment History" Card
 * - Permanent Bottom Navigation: Screening tab active
 */
export default function ScreeningOverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { isFemale, profile, screening } = useHealthStore();

  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';
  const themeCardBorder = isFemale ? '#FFF0F5' : '#EEF6FD';

  const firstName = useMemo(() => {
    if (profile.fullName && profile.fullName.trim().length > 0) {
      return profile.fullName.trim().split(' ')[0];
    }
    return 'Member';
  }, [profile.fullName]);

  return (
    <View style={[styles.root, { backgroundColor: isFemale ? '#FFF7F9' : '#F4F9FD' }]}>
      <AuthBackgroundFoliage />

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 10), backgroundColor: isFemale ? '#FFF7F9' : '#F4F9FD' }]}>
        <View style={styles.brandRow}>
          <Image source={HEART_EMBLEM} style={styles.emblem} resizeMode="contain" />
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitleNavy}>BioPulse</Text>
              <Text style={[styles.brandTitleAccent, { color: themeAccent }]}> AI</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              {isFemale ? "WOMEN'S HEALTH, BRIGHTER TOMORROWS" : "MEN'S HEALTH INTELLIGENCE"}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            onPress={() => router.push('/(app)/notifications')}
            style={styles.iconBtn}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={21} color="#073B72" />
            <View style={[styles.notifBadge, { backgroundColor: themeAccent }]} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/profile')}
            style={[styles.avatarBtn, { borderColor: themeAccent }]}
          >
            <Image
              source={isFemale ? HERO_FEMALE_ART : HERO_MALE_ART}
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
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* Greeting Hero Section */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingLeft}>
              <View style={styles.sunRow}>
                <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
                <Text style={styles.greetingTimeText}>Good afternoon,</Text>
              </View>
              <Text style={styles.greetingNameText}>{firstName}</Text>
              <View style={[styles.pathwayPill, { backgroundColor: themeSoftBg }]}>
                <Ionicons
                  name={isFemale ? 'female' : 'male'}
                  size={13}
                  color={themeAccent}
                />
                <Text style={[styles.pathwayPillText, { color: themeAccent }]}>
                  {isFemale ? 'PCOS Pathway' : 'Hypogonadism Pathway'}
                </Text>
              </View>
            </View>

            <View style={styles.greetingRight}>
              <Text style={styles.heroQuoteText}>
                {isFemale
                  ? 'A healthier\nyou, brighter\ntomorrows ♡'
                  : 'Stronger health\nfor a stronger\ntomorrow'}
              </Text>
            </View>
          </View>

          {/* CARD 1: Screening Overview */}
          <View style={[styles.cardContainer, { borderColor: themeCardBorder }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: themeSoftBg }]}>
                  <Ionicons
                    name={isFemale ? 'fitness-outline' : 'clipboard-outline'}
                    size={20}
                    color={themeAccent}
                  />
                </View>
                <Text style={styles.cardTitle}>
                  {isFemale ? 'PCOS Screening Overview' : 'Hypogonadism Screening Overview'}
                </Text>
              </View>
              <Ionicons name="information-circle-outline" size={20} color="#94A3B8" />
            </View>

            {/* Donut Ring & Summary */}
            {screening.tierStatus === 'Not Assessed' ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <View style={[styles.cardIconBox, { backgroundColor: themeSoftBg, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }]}>
                  <Ionicons name="clipboard-outline" size={24} color={themeAccent} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#073B72', textAlign: 'center', marginBottom: 4 }}>
                  {isFemale ? 'No PCOS Screening Completed' : 'No Hypogonadism Screening Completed'}
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 16, paddingHorizontal: 16 }}>
                  Complete your initial Tier 1 assessment to receive validated AI probability and personalized clinical risk analysis.
                </Text>
                <Pressable
                  onPress={() => router.push(isFemale ? '/female-review' : '/male-review')}
                  style={[styles.primaryCTA, { backgroundColor: themeAccent, alignSelf: 'stretch', marginHorizontal: 8 }]}
                >
                  <Text style={styles.primaryCTAText}>Start Screening Assessment</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.overviewBody}>
                <View style={[styles.donutGauge, { borderColor: themeAccent, borderTopColor: isFemale ? '#FF80A8' : '#2196E3' }]}>
                  <Text style={styles.donutGaugePercent}>{screening.probabilityPercent}%</Text>
                  <Text style={[styles.donutGaugeLabel, { color: themeAccent }]}>
                    {screening.riskBand.replace(' Risk', '')}
                  </Text>
                </View>

                <View style={styles.overviewDetails}>
                  <Text style={styles.overviewDescription}>
                    {isFemale
                      ? (screening.riskCategory === 'higher'
                          ? "Your screening result suggests a higher likelihood of PCOS based on the information you've shared."
                          : screening.riskCategory === 'intermediate'
                          ? "Your screening result suggests an intermediate likelihood of PCOS. Continued monitoring recommended."
                          : "Your screening result suggests a lower likelihood of PCOS.")
                      : (screening.riskCategory === 'higher'
                          ? "Your answers suggest a higher likelihood of late-onset androgen deficiency."
                          : screening.riskCategory === 'intermediate'
                          ? "Your answers suggest a moderate likelihood of low testosterone (hypogonadism)."
                          : "Your screening pattern indicates lower likelihood of androgen deficiency.")}
                  </Text>

                  <View style={styles.tierStatusRow}>
                    <View style={[styles.tierStatusBadge, { backgroundColor: themeSoftBg }]}>
                      <Ionicons name="checkmark-circle" size={13} color={themeAccent} />
                      <Text style={[styles.tierStatusBadgeText, { color: themeAccent }]}>
                        {screening.tierStatus}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.lastUpdatedRow}>
                    <Ionicons name="calendar-outline" size={13} color="#8A9BA8" />
                    <Text style={styles.lastUpdatedText}>
                      Last updated {screening.lastAssessedDate}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Non-Diagnostic Callout */}
            <View style={[styles.calloutBox, { backgroundColor: themeSoftBg, borderColor: themeCardBorder }]}>
              <Ionicons name="information-circle" size={18} color={themeAccent} />
              <View style={styles.calloutTextWrap}>
                <Text style={[styles.calloutTitle, { color: themeAccent }]}>
                  This is a screening result, not a diagnosis.
                </Text>
                <Text style={styles.calloutBody}>
                  A clinical evaluation and lab tests are needed for a definitive diagnosis.
                </Text>
              </View>
            </View>
          </View>

          {/* CARD 2: Your Screening Journey / Progress */}
          <View style={[styles.cardContainer, { borderColor: themeCardBorder }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: themeSoftBg }]}>
                  <Ionicons name="bar-chart-outline" size={20} color={themeAccent} />
                </View>
                <Text style={styles.cardTitle}>
                  {isFemale ? 'Your Screening Journey' : 'Your Screening Progress'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            {/* Stepper Steps */}
            <View style={styles.stepperContainer}>
              {/* Tier 1 */}
              <View style={styles.stepItem}>
                <View style={screening.tierStatus === 'Not Assessed' ? [styles.stepCircleActive, { borderColor: themeAccent }] : [styles.stepCircleComplete, { backgroundColor: themeAccent }]}>
                  {screening.tierStatus === 'Not Assessed' ? (
                    <Text style={[styles.stepCircleActiveText, { color: themeAccent }]}>1</Text>
                  ) : (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepNumber}>Tier 1</Text>
                  <Text style={[styles.stepStatus, { color: themeAccent }]}>
                    {screening.tierStatus === 'Not Assessed' ? 'Pending' : 'Complete'}
                  </Text>
                  <Text style={styles.stepSub}>Questionnaire & symptoms</Text>
                </View>
              </View>

              <View style={[styles.stepConnector, { backgroundColor: screening.tierStatus === 'Not Assessed' ? '#E2E8F0' : themeAccent }]} />

              {/* Tier 2 */}
              <View style={styles.stepItem}>
                <View style={screening.tierStatus === 'Not Assessed' ? styles.stepCirclePending : [styles.stepCircleActive, { borderColor: themeAccent }]}>
                  <Text style={screening.tierStatus === 'Not Assessed' ? styles.stepCirclePendingText : [styles.stepCircleActiveText, { color: themeAccent }]}>2</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepNumber}>Tier 2</Text>
                  <Text style={styles.stepStatus}>{screening.tierStatus === 'Not Assessed' ? 'Upcoming' : 'Next Step'}</Text>
                  <Text style={styles.stepSub}>Add clinical labs</Text>
                </View>
              </View>

              <View style={[styles.stepConnector, { backgroundColor: '#E2E8F0' }]} />

              {/* Tier 3 */}
              <View style={styles.stepItem}>
                <View style={styles.stepCirclePending}>
                  <Text style={styles.stepCirclePendingText}>3</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepNumber}>Tier 3</Text>
                  <Text style={styles.stepStatusPending}>Guidance</Text>
                  <Text style={styles.stepSub}>Personalized care</Text>
                </View>
              </View>
            </View>

            {/* Primary CTA Button */}
            <Pressable
              onPress={() => router.push(screening.tierStatus === 'Not Assessed' ? (isFemale ? '/female-review' : '/male-review') : '/(app)/tier-progress')}
              style={[styles.primaryCTA, { backgroundColor: themeAccent }]}
            >
              <Text style={styles.primaryCTAText}>
                {screening.tierStatus === 'Not Assessed' ? 'Start Tier 1 Assessment' : 'Continue to Next Tier'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* CARD 3: What this means */}
          <Pressable
            onPress={() => router.push('/(app)/screening-explanation')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed, { borderColor: themeCardBorder }]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="bulb-outline" size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>What this means</Text>
                  <Text style={styles.cardSubtitleText}>
                    {isFemale
                      ? 'Your result suggests a higher likelihood of PCOS based on your symptoms and health information. Click to see top contributing factors.'
                      : 'Your screening result suggests an intermediate risk of low testosterone. Explore the clinical rationale behind this result.'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </Pressable>

          {/* CARD 4: Assessment History */}
          <Pressable
            onPress={() => router.push('/(app)/reports')}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed, { borderColor: themeCardBorder }]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <View style={[styles.cardIconBox, { backgroundColor: themeSoftBg }]}>
                  <Ionicons name="time-outline" size={20} color={themeAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Assessment History</Text>
                  <Text style={styles.cardSubtitleText}>
                    View your past screening results, updates, and tier progression.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Navigation */}
      <BioPulseBottomNav activeTab="screening" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
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
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
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
  pathwayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pathwayPillText: {
    fontSize: 12,
    fontWeight: '700',
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
    shadowColor: '#073B72',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.95,
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
  cardSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  overviewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  donutGauge: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutGaugePercent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#073B72',
  },
  donutGaugeLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  overviewDetails: {
    flex: 1,
  },
  overviewDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  tierStatusRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tierStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#8A9BA8',
  },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  calloutTextWrap: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  calloutBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircleComplete: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActiveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepCirclePending: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCirclePendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepConnector: {
    width: 28,
    height: 2,
    marginTop: 12,
  },
  stepInfo: {
    alignItems: 'center',
    marginTop: 6,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#073B72',
  },
  stepStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  stepStatusPending: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  stepSub: {
    fontSize: 9,
    color: '#8A9BA8',
    textAlign: 'center',
    marginTop: 2,
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
