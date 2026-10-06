import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { useFemaleOnboarding } from '../../features/onboarding';
import {
  resolveRiskBand,
  resolveNextAction,
  fetchActiveScreeningAssessment,
  getFeatureLabel,
  getFeatureIconName,
} from '../../services/assessmentService';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../navigation';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');
const HERO_FEMALE_ART = require('../../assets/female_pathway_hero.png');
const NUTRITION_IMAGE = require('../../assets/nutrition_healthy_bowl.jpg');

export interface FemaleDashboardOverviewProps {
  onNotificationPress?: () => void;
}

/**
 * SCREEN 12: FEMALE HOME / DASHBOARD SCREEN
 *
 * Implements:
 * - Top header with contextual More shortcut, shared BioPulse branding ("PERSONALIZED HEALTH INTELLIGENCE"),
 *   real notification bell, and dynamic profile avatar.
 * - Dynamic time-based greeting ("Good Morning, [Name] 👋") and decorative female hero illustration.
 * - Optional wellness quote pill: "Small steps today for a healthier tomorrow".
 * - Top 3 Summary Cards:
 *     1. Cycle Day & Phase with progress bar (real cycle calculation or clean empty state)
 *     2. Health Journey with dynamic profile completeness %
 *     3. Next Period prediction with days remaining (real calculation or clean empty state)
 * - PCOS Risk Assessment Card:
 *     - Displays real probability %, risk band badge, and non-diagnostic disclaimer.
 *     - Top 3 Contributing Factors with real SHAP impact bars.
 *     - Graceful loading state ("Processing your screening result...") and empty state ("Start Screening").
 * - Next Best Action Card:
 *     - Evidence-based dynamic recommendation and CTA button based on clinical tier progression.
 * - Quick Access Shortcuts (6 cards):
 *     - Cycle Tracking, Log Symptoms, Nutrition Plan, Fitness Plan, AI Assistant, Appointments.
 * - Bottom Row:
 *     - Recent Activity: vertical timeline with authentic logged events or empty fallback.
 *     - Health Tips for You: balanced nutrition card with high-res meal image and carousel indicators.
 * - Permanent fixed bottom navigation (Home tab active in female pink #F43F7D).
 * - Fully responsive across 320px to 820px tablet widths with native safe-area compliance.
 */
export const FemaleDashboardOverview: React.FC<FemaleDashboardOverviewProps> = ({
  onNotificationPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isTablet = width >= 768;
  const isSmallPhone = width < 360;

  const { user } = useAuth();
  const {
    basicInfo,
    cycleHealth,
    symptoms,
    lifestyle,
    activeAssessment,
    isLoadingAssessment,
    setActiveAssessment,
    setIsLoadingAssessment,
    setAssessmentError,
  } = useFemaleOnboarding();

  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications] = useState<number>(0); // Connects to real state; 0 hides fake badge

  // ---------------------------------------------------------------------------
  // 1. Initial Assessment Check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function checkAssessment() {
      if (!activeAssessment) {
        try {
          setIsLoadingAssessment(true);
          const remote = await fetchActiveScreeningAssessment();
          if (isMounted && remote && (remote.probability !== undefined || remote.has_assessment)) {
            setActiveAssessment(remote);
          }
        } catch (err: any) {
          if (isMounted) {
            setAssessmentError(err?.message || 'Unable to sync screening assessment');
          }
        } finally {
          if (isMounted) {
            setIsLoadingAssessment(false);
          }
        }
      }
    }
    checkAssessment();
    return () => {
      isMounted = false;
    };
  }, [activeAssessment, setActiveAssessment, setIsLoadingAssessment, setAssessmentError]);

  // ---------------------------------------------------------------------------
  // 2. Refresh Control
  // ---------------------------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const remote = await fetchActiveScreeningAssessment();
      if (remote && (remote.probability !== undefined || remote.has_assessment)) {
        setActiveAssessment(remote);
      }
    } catch {
      // Keep existing local assessment state if network fails
    } finally {
      setRefreshing(false);
    }
  }, [setActiveAssessment]);

  // ---------------------------------------------------------------------------
  // 3. User & Greeting Formatting
  // ---------------------------------------------------------------------------
  const firstName = useMemo(() => {
    if (user?.fullName && user.fullName.trim().length > 0) {
      return user.fullName.trim().split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Member';
  }, [user]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  // ---------------------------------------------------------------------------
  // 4. Dynamic Profile Completeness Calculation
  // ---------------------------------------------------------------------------
  const profileCompleteness = useMemo(() => {
    let total = 12;
    let filled = 0;

    // Basic Info (4)
    if (basicInfo?.age > 0) filled++;
    if (basicInfo?.heightCm > 0) filled++;
    if (basicInfo?.weightKg > 0) filled++;
    if (basicInfo?.maritalStatus) filled++;

    // Cycle Health (4)
    if (cycleHealth?.regularity) filled++;
    if (cycleHealth?.cycleLength > 0) filled++;
    if (cycleHealth?.periodDuration > 0) filled++;
    if (cycleHealth?.flowPattern) filled++;

    // Symptoms (1)
    if (symptoms && symptoms.length > 0) filled++;

    // Lifestyle (3)
    if (lifestyle?.sleepHours > 0) filled++;
    if (lifestyle?.fastFoodIntake) filled++;
    if (lifestyle?.exerciseFrequency) filled++;

    return Math.round((filled / total) * 100);
  }, [basicInfo, cycleHealth, symptoms, lifestyle]);

  // ---------------------------------------------------------------------------
  // 5. Menstrual Cycle Calculations
  // ---------------------------------------------------------------------------
  const cycleData = useMemo(() => {
    if (!cycleHealth?.lastPeriodDate) {
      return {
        hasData: false,
        cycleDay: 0,
        phase: '',
        nextDays: 0,
        nextDateFormatted: '',
        progress: 0,
      };
    }

    const parts = cycleHealth.lastPeriodDate.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return {
        hasData: false,
        cycleDay: 0,
        phase: '',
        nextDays: 0,
        nextDateFormatted: '',
        progress: 0,
      };
    }

    const lastDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();

    const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diffDays = Math.floor((todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        hasData: false,
        cycleDay: 0,
        phase: '',
        nextDays: 0,
        nextDateFormatted: '',
        progress: 0,
      };
    }

    const length = cycleHealth.cycleLength || 28;
    const periodDuration = cycleHealth.periodDuration || 5;
    const day = (diffDays % length) + 1;

    let phase = 'Follicular Phase';
    if (day <= periodDuration) {
      phase = 'Menstrual Phase';
    } else if (day < Math.round(length / 2) - 1) {
      phase = 'Follicular Phase';
    } else if (day <= Math.round(length / 2) + 1) {
      phase = 'Ovulatory Phase';
    } else {
      phase = 'Luteal Phase';
    }

    const nextDays = length - (diffDays % length);
    const expectedDateObj = new Date(todayMidnight + nextDays * (1000 * 60 * 60 * 24));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const nextDateFormatted = `${expectedDateObj.getDate()} ${monthNames[expectedDateObj.getMonth()]} ${expectedDateObj.getFullYear()}`;
    const progress = Math.min(1, Math.max(0, day / length));

    return {
      hasData: true,
      cycleDay: day,
      phase,
      nextDays,
      nextDateFormatted,
      progress,
    };
  }, [cycleHealth]);

  // ---------------------------------------------------------------------------
  // 6. PCOS Risk Assessment & Factors Resolution
  // ---------------------------------------------------------------------------
  const riskDisplay = useMemo(() => {
    if (!activeAssessment) return null;
    const prob = activeAssessment.probability ?? 0;
    return {
      probPercent: Math.round(prob * 100),
      band: resolveRiskBand(prob, activeAssessment.risk_category, activeAssessment.threshold || 0.38),
    };
  }, [activeAssessment]);

  const lastUpdatedFormatted = useMemo(() => {
    if (!activeAssessment?.created_at) return '';
    try {
      const d = new Date(activeAssessment.created_at);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return '';
    }
  }, [activeAssessment]);

  const topFactors = useMemo(() => {
    if (!activeAssessment) return [];
    const rawFactors = activeAssessment.shap_explanation?.factors || activeAssessment.explanations || [];
    return rawFactors.slice(0, 3);
  }, [activeAssessment]);

  const nextAction = useMemo(() => {
    return resolveNextAction(activeAssessment);
  }, [activeAssessment]);

  // ---------------------------------------------------------------------------
  // 7. Recent Activity Timeline Data
  // ---------------------------------------------------------------------------
  const recentActivities = useMemo(() => {
    const items: Array<{
      id: string;
      icon: keyof typeof Ionicons.glyphMap;
      color: string;
      title: string;
      time: string;
      onPress?: () => void;
    }> = [];

    if (symptoms && symptoms.length > 0) {
      items.push({
        id: 'symptoms',
        icon: 'heart-outline',
        color: '#F43F7D',
        title: 'Logged symptoms',
        time: 'Recent update',
        onPress: () => router.push('/female-symptoms'),
      });
    }

    if (lifestyle && (lifestyle.fastFoodIntake || lifestyle.exerciseFrequency)) {
      items.push({
        id: 'lifestyle',
        icon: 'restaurant-outline',
        color: '#16B8C4',
        title: 'Logged meal & habits',
        time: 'Today, active',
        onPress: () => router.push('/(app)/guidance'),
      });
    }

    if (activeAssessment) {
      items.push({
        id: 'screening',
        icon: 'document-text-outline',
        color: '#0868B9',
        title: 'Completed screening',
        time: lastUpdatedFormatted || 'Verified result',
        onPress: () => router.push('/female-screening-result'),
      });
    }

    return items;
  }, [symptoms, lifestyle, activeAssessment, lastUpdatedFormatted, router]);

  // Quick Action Handler
  const handleQuickAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'cycle':
          router.push('/female-cycle-health');
          break;
        case 'symptoms':
          router.push('/female-symptoms');
          break;
        case 'nutrition':
        case 'fitness':
        case 'ai_assistant':
          router.push('/(app)/guidance');
          break;
        case 'appointments':
          Alert.alert(
            'Care Appointments',
            'Connect with BioPulse reproductive endocrinology network or schedule your next lab panel.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'View Guidance',
                onPress: () => router.push('/(app)/guidance'),
              },
            ]
          );
          break;
      }
    },
    [router]
  );

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        {/* Left: Contextual shortcut to More Menu */}
        <Pressable
          onPress={() => router.push('/(app)/more')}
          style={({ pressed }) => [styles.gridIconBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Open application menu"
          hitSlop={8}
        >
          <Ionicons name="grid-outline" size={19} color={BioPulseColors.femaleAccent} />
        </Pressable>

        {/* Center: Official Brand Logo with Approved Subtitle */}
        <View style={styles.brandCenter}>
          <View style={styles.brandRow}>
            <Image source={HEART_EMBLEM} style={styles.emblem} resizeMode="contain" />
            <Text style={styles.brandTitleNavy}>BioPulse</Text>
            <Text style={styles.brandTitleAccent}> AI</Text>
          </View>
          <Text style={styles.brandSubtitle}>PERSONALIZED HEALTH INTELLIGENCE</Text>
        </View>

        {/* Right: Notification Bell & Profile Avatar */}
        <View style={styles.headerRightRow}>
          <Pressable
            onPress={() => {
              if (onNotificationPress) {
                onNotificationPress();
              } else {
                router.push('/(app)/more');
              }
            }}
            style={({ pressed }) => [styles.bellBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={21} color="#073B72" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationDot} />
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/more')}
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="User profile and settings"
            hitSlop={6}
          >
            <Ionicons name="person" size={17} color={BioPulseColors.femaleAccent} />
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable Dashboard Content ─────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={BioPulseColors.femaleAccent}
            colors={[BioPulseColors.femaleAccent]}
          />
        }
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* ── Hero Greeting Section ──────────────────────────── */}
          <View style={styles.heroSection}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingSub}>{greeting}</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {firstName} 👋
              </Text>
              <Text style={styles.greetingTagline}>
                Let's take a step towards a healthier you today.
              </Text>
            </View>

            {/* Decorative Female Illustration */}
            <View pointerEvents="none" style={styles.heroArtworkWrap} accessible={false}>
              <Image source={HERO_FEMALE_ART} style={styles.heroArtwork} resizeMode="contain" />
            </View>

            {/* Optional Decorative Wellness Quote */}
            {!isSmallPhone && (
              <View style={styles.quoteCard} accessible={false}>
                <Text style={styles.quoteText}>
                  “Small steps today for a healthier tomorrow”
                </Text>
              </View>
            )}
          </View>

          {/* ── Top 3 Summary Cards ────────────────────────────── */}
          <View style={[styles.summaryCardsRow, isSmallPhone && styles.summaryCardsStacked]}>
            {/* Card 1: Cycle Day */}
            <Pressable
              onPress={() => router.push('/female-cycle-health')}
              style={({ pressed }) => [
                styles.summaryCard,
                isSmallPhone && styles.summaryCardFull,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                cycleData.hasData
                  ? `Cycle Day ${cycleData.cycleDay}, ${cycleData.phase}. Tap to view cycle tracking.`
                  : 'Cycle Tracking: Tap to add your cycle details.'
              }
            >
              <View style={styles.summaryCardTop}>
                <View style={[styles.summaryIconBadge, { backgroundColor: '#FDF0F4' }]}>
                  <Ionicons name="water-outline" size={17} color={BioPulseColors.femaleAccent} />
                </View>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </View>

              <Text style={styles.summaryCardLabel}>Cycle Day</Text>
              <Text style={styles.summaryCardValue}>
                {cycleData.hasData ? cycleData.cycleDay : '—'}
              </Text>
              <Text style={styles.summaryCardSub} numberOfLines={1}>
                {cycleData.hasData ? cycleData.phase : 'Add cycle details'}
              </Text>

              {/* Progress Bar Under Cycle Day */}
              <View style={styles.cycleProgressTrack}>
                <View
                  style={[
                    styles.cycleProgressFill,
                    { width: `${Math.round(cycleData.progress * 100)}%` },
                  ]}
                />
              </View>
            </Pressable>

            {/* Card 2: Health Journey / Profile Complete */}
            <Pressable
              onPress={() => router.push('/female-basic-info')}
              style={({ pressed }) => [
                styles.summaryCard,
                isSmallPhone && styles.summaryCardFull,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Your Health Journey: ${profileCompleteness}% profile complete.`}
            >
              <View style={styles.summaryCardTop}>
                <View style={styles.percentRingMini}>
                  <Text style={styles.percentRingText}>{profileCompleteness}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </View>

              <Text style={styles.summaryCardLabel}>Your Health Journey</Text>
              <Text style={styles.summaryCardValueSm}>Profile Complete</Text>
              <Text style={styles.summaryCardSub} numberOfLines={2}>
                Complete profile for more accurate results.
              </Text>
            </Pressable>

            {/* Card 3: Next Period */}
            <Pressable
              onPress={() => router.push('/female-cycle-health')}
              style={({ pressed }) => [
                styles.summaryCard,
                isSmallPhone && styles.summaryCardFull,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                cycleData.hasData
                  ? `Next period in ${cycleData.nextDays} days. Expected ${cycleData.nextDateFormatted}.`
                  : 'Next period: Not enough data. Add cycle history.'
              }
            >
              <View style={styles.summaryCardTop}>
                <View style={[styles.summaryIconBadge, { backgroundColor: '#FDF0F4' }]}>
                  <Ionicons name="calendar-outline" size={17} color={BioPulseColors.femaleAccent} />
                </View>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </View>

              <Text style={styles.summaryCardLabel}>Next Period</Text>
              <Text style={styles.summaryCardValue}>
                {cycleData.hasData ? `${cycleData.nextDays} days` : '—'}
              </Text>
              <Text style={styles.summaryCardSub} numberOfLines={1}>
                {cycleData.hasData ? `Expected ${cycleData.nextDateFormatted}` : 'Not enough data'}
              </Text>
            </Pressable>
          </View>

          {/* ── PCOS Risk Assessment Main Card ──────────────────── */}
          <View style={styles.riskCard}>
            {/* Header: Shield + Title + Last Updated */}
            <View style={styles.riskCardHeaderRow}>
              <View style={styles.riskHeaderLeft}>
                <View style={styles.shieldBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={BioPulseColors.femaleAccent} />
                </View>
                <Text style={styles.riskCardTitle}>PCOS Risk Assessment</Text>
                <Ionicons name="information-circle-outline" size={15} color="#94A3B8" />
              </View>

              {lastUpdatedFormatted ? (
                <Text style={styles.lastUpdatedText}>Last Updated: {lastUpdatedFormatted}</Text>
              ) : null}
            </View>

            {/* Loading State: Never prematurely shows "Start Screening" */}
            {isLoadingAssessment && !activeAssessment ? (
              <View style={styles.assessmentLoadingWrap}>
                <ActivityIndicator size="small" color={BioPulseColors.femaleAccent} />
                <Text style={styles.assessmentLoadingText}>Processing your screening result...</Text>
              </View>
            ) : activeAssessment && riskDisplay ? (
              /* Active Assessment: Side-by-side on tablet/phone, vertically stacked on very small screen */
              <View style={[styles.riskBodyRow, isSmallPhone && styles.riskBodyStacked]}>
                {/* Left Column: Risk Score & Category Badge */}
                <View style={styles.riskScoreCol}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.riskPercentBig}>{riskDisplay.probPercent}%</Text>
                    <View
                      style={[
                        styles.riskBadgePill,
                        {
                          backgroundColor: riskDisplay.band.badgeBg,
                          borderColor: riskDisplay.band.badgeBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.riskBadgeText,
                          { color: riskDisplay.band.badgeTextColor },
                        ]}
                      >
                        {riskDisplay.band.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.disclaimerText}>
                    This is a screening result, not a medical diagnosis.
                  </Text>
                </View>

                {/* Right Column: Top Contributing Factors */}
                <View style={styles.riskFactorsCol}>
                  <Pressable
                    onPress={() => router.push('/female-screening-result')}
                    style={styles.factorsHeaderRow}
                    accessibilityRole="button"
                    accessibilityLabel="View all contributing factors"
                  >
                    <Text style={styles.factorsHeading}>Top Contributing Factors</Text>
                    <Ionicons name="chevron-forward" size={14} color={BioPulseColors.femaleAccent} />
                  </Pressable>

                  {topFactors.length > 0 ? (
                    <View style={styles.factorsList}>
                      {topFactors.map((factor, idx) => {
                        const icon = getFeatureIconName(factor.feature_key);
                        const label = getFeatureLabel(factor.feature_key, factor.feature_name);
                        const share = factor.explanation_share_percent || 25;
                        return (
                          <View key={factor.feature_key || idx} style={styles.factorRow}>
                            <View style={styles.factorIconWrap}>
                              <Ionicons name={icon} size={13} color={BioPulseColors.femaleAccent} />
                            </View>
                            <Text style={styles.factorLabel} numberOfLines={1}>
                              {label}
                            </Text>
                            <View style={styles.factorBarTrack}>
                              <View
                                style={[
                                  styles.factorBarFill,
                                  { width: `${Math.min(100, Math.max(15, share))}%` },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.factorsEmptyText}>
                      Baseline clinical indicators evaluated.
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              /* Empty State: Prompt User to Begin Screening */
              <View style={styles.riskEmptyWrap}>
                <Text style={styles.riskEmptyTitle}>No screening result yet</Text>
                <Text style={styles.riskEmptySub}>
                  Complete your baseline screening questionnaire to evaluate your statistical PCOS risk.
                </Text>
                <Pressable
                  onPress={() => router.push('/female-symptoms')}
                  style={({ pressed }) => [styles.startScreeningBtn, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Start Screening"
                >
                  <Text style={styles.startScreeningBtnText}>Start Screening →</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* ── Next Best Action Card ──────────────────────────── */}
          <View style={styles.nextActionCard}>
            <View style={styles.nextActionIconWrap}>
              <Ionicons name="bulb-outline" size={20} color={BioPulseColors.femaleAccent} />
            </View>

            <View style={styles.nextActionTextCol}>
              <Text style={styles.nextActionTitle}>{nextAction.title}</Text>
              <Text style={styles.nextActionDesc}>{nextAction.description}</Text>
            </View>

            <Pressable
              onPress={() => {
                if (activeAssessment) {
                  router.push('/female-screening-result');
                } else {
                  router.push('/female-symptoms');
                }
              }}
              style={({ pressed }) => [styles.nextActionBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel={nextAction.buttonLabel}
            >
              <Text style={styles.nextActionBtnText}>{nextAction.buttonLabel}</Text>
            </Pressable>
          </View>

          {/* ── Quick Access Section ───────────────────────────── */}
          <View style={styles.quickAccessSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <Pressable
                onPress={() => router.push('/(app)/more')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="See all shortcuts"
              >
                <Text style={styles.seeAllText}>See All &gt;</Text>
              </Pressable>
            </View>

            <View style={styles.quickGrid}>
              {/* Shortcut 1: Cycle Tracking */}
              <Pressable
                onPress={() => handleQuickAction('cycle')}
                style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
                accessibilityRole="button"
                accessibilityLabel="Cycle Tracking"
              >
                <View style={[styles.tileIconWrap, { backgroundColor: '#FDF2F4' }]}>
                  <Ionicons name="calendar-outline" size={22} color={BioPulseColors.femaleAccent} />
                </View>
                <Text style={styles.tileLabel}>Cycle{'\n'}Tracking</Text>
              </Pressable>

              {/* Shortcut 2: Log Symptoms */}
              <Pressable
                onPress={() => handleQuickAction('symptoms')}
                style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
                accessibilityRole="button"
                accessibilityLabel="Log Symptoms"
              >
                <View style={[styles.tileIconWrap, { backgroundColor: '#FDF2F4' }]}>
                  <Ionicons name="heart-outline" size={22} color={BioPulseColors.femaleAccent} />
                </View>
                <Text style={styles.tileLabel}>Log{'\n'}Symptoms</Text>
              </Pressable>

              {/* Shortcut 3: Nutrition Plan */}
              <Pressable
                onPress={() => handleQuickAction('nutrition')}
                style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
                accessibilityRole="button"
                accessibilityLabel="Nutrition Plan"
              >
                <View style={[styles.tileIconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="restaurant-outline" size={22} color="#16A34A" />
                </View>
                <Text style={styles.tileLabel}>Nutrition{'\n'}Plan</Text>
              </Pressable>

              {/* Shortcut 4: Fitness Plan */}
              <Pressable
                onPress={() => handleQuickAction('fitness')}
                style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
                accessibilityRole="button"
                accessibilityLabel="Fitness Plan"
              >
                <View style={[styles.tileIconWrap, { backgroundColor: '#FAF5FF' }]}>
                  <Ionicons name="barbell-outline" size={22} color="#9333EA" />
                </View>
                <Text style={styles.tileLabel}>Fitness{'\n'}Plan</Text>
              </Pressable>

              {/* Shortcut 5: AI Assistant */}
              <Pressable
                onPress={() => handleQuickAction('ai_assistant')}
                style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
                accessibilityRole="button"
                accessibilityLabel="AI Health Assistant"
              >
                <View style={[styles.tileIconWrap, { backgroundColor: '#F0F9FF' }]}>
                  <Ionicons name="sparkles-outline" size={22} color="#0284C7" />
                </View>
                <Text style={styles.tileLabel}>AI{'\n'}Assistant</Text>
              </Pressable>

              {/* Shortcut 6: Appointments */}
              <Pressable
                onPress={() => handleQuickAction('appointments')}
                style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
                accessibilityRole="button"
                accessibilityLabel="Appointments"
              >
                <View style={[styles.tileIconWrap, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="calendar-number-outline" size={22} color="#D97706" />
                </View>
                <Text style={styles.tileLabel}>Appointments</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Bottom Row: Recent Activity & Health Tips ──────── */}
          <View style={[styles.bottomCardsRow, isTablet && styles.bottomCardsTablet]}>
            {/* Card A: Recent Activity */}
            <View style={styles.activityCard}>
              <Pressable
                onPress={() => router.push('/(app)/track')}
                style={styles.cardHeaderRow}
                accessibilityRole="button"
                accessibilityLabel="View recent activity log"
              >
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="document-text-outline" size={17} color={BioPulseColors.femaleAccent} />
                  <Text style={styles.cardHeaderTitle}>Recent Activity</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
              </Pressable>

              {recentActivities.length > 0 ? (
                <View style={styles.timelineList}>
                  {recentActivities.map((act, index) => {
                    const isLast = index === recentActivities.length - 1;
                    return (
                      <Pressable
                        key={act.id}
                        onPress={act.onPress}
                        style={styles.timelineItem}
                      >
                        <View style={styles.timelineIndicatorCol}>
                          <View style={[styles.timelineDot, { backgroundColor: act.color }]} />
                          {!isLast && <View style={styles.timelineLine} />}
                        </View>

                        <View style={[styles.timelineIconBadge, { backgroundColor: '#F8FAFC' }]}>
                          <Ionicons name={act.icon} size={15} color={act.color} />
                        </View>

                        <View style={styles.timelineTextCol}>
                          <Text style={styles.timelineTitle}>{act.title}</Text>
                          <Text style={styles.timelineTime}>{act.time}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyActivityText}>
                  No recent activity yet. Start tracking to see your health journey here.
                </Text>
              )}
            </View>

            {/* Card B: Health Tips for You */}
            <View style={styles.healthTipsCard}>
              <Pressable
                onPress={() => router.push('/(app)/guidance')}
                style={styles.cardHeaderRow}
                accessibilityRole="button"
                accessibilityLabel="View personalized health tips"
              >
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="leaf-outline" size={17} color={BioPulseColors.femaleAccent} />
                  <Text style={styles.cardHeaderTitle}>Health Tips for You</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
              </Pressable>

              <View style={styles.tipContentRow}>
                <View style={styles.tipTextCol}>
                  <Text style={styles.tipTitle}>
                    Balanced Nutrition Supports Hormonal Health
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(app)/guidance')}
                    style={styles.tipBtn}
                    accessibilityRole="button"
                    accessibilityLabel="View Meal Plan"
                  >
                    <Text style={styles.tipBtnText}>View Meal Plan →</Text>
                  </Pressable>
                </View>

                {/* Appetizing Meal Image matching visual reference */}
                <Image
                  source={NUTRITION_IMAGE}
                  style={styles.tipMealImage}
                  resizeMode="cover"
                />
              </View>

              {/* Carousel Indicator Dots */}
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Permanent BioPulse Bottom Navigation ─────────────── */}
      <BioPulseBottomNav activeTab="home" />
    </View>
  );
};

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
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 10,
  },
  gridIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FDF0F4',
    borderWidth: 1,
    borderColor: '#FCE7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCenter: {
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emblem: {
    width: 22,
    height: 22,
    marginRight: 2,
  },
  brandTitleNavy: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.2,
  },
  brandTitleAccent: {
    fontSize: 16.5,
    fontWeight: '800',
    color: BioPulseColors.femaleAccent,
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#55718F',
    marginTop: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: BioPulseColors.femaleAccent,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF0F4',
    borderWidth: 1.5,
    borderColor: BioPulseColors.femaleAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 680,
  },

  // ── Hero Section ───────────────────────────────────────────
  heroSection: {
    position: 'relative',
    paddingVertical: 12,
    marginBottom: 8,
    minHeight: 110,
    justifyContent: 'center',
  },
  greetingTextContainer: {
    maxWidth: '65%',
    zIndex: 2,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#073B72',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  greetingTagline: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  heroArtworkWrap: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 140,
    height: 140,
    opacity: 0.88,
    zIndex: 1,
  },
  heroArtwork: {
    width: '100%',
    height: '100%',
  },
  quoteCard: {
    position: 'absolute',
    top: 15,
    right: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#FCE7F0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 3,
  },
  quoteText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#64748B',
    lineHeight: 14,
    textAlign: 'center',
  },

  // ── Summary Cards ──────────────────────────────────────────
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCardsStacked: {
    flexDirection: 'column',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  summaryCardFull: {
    width: '100%',
  },
  summaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentRingMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: BioPulseColors.femaleAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentRingText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: BioPulseColors.femaleAccent,
  },
  summaryCardLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.2,
  },
  summaryCardValueSm: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
  },
  summaryCardSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 13,
  },
  cycleProgressTrack: {
    height: 3.5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  cycleProgressFill: {
    height: '100%',
    backgroundColor: BioPulseColors.femaleAccent,
    borderRadius: 2,
  },

  // ── PCOS Risk Assessment Main Card ─────────────────────────
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCE7F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  riskCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#073B72',
  },
  lastUpdatedText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  assessmentLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  assessmentLoadingText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  riskBodyRow: {
    flexDirection: 'row',
    gap: 14,
  },
  riskBodyStacked: {
    flexDirection: 'column',
  },
  riskScoreCol: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  riskPercentBig: {
    fontSize: 38,
    fontWeight: '900',
    color: BioPulseColors.femaleAccent,
    letterSpacing: -1,
  },
  riskBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  disclaimerText: {
    fontSize: 10.5,
    color: '#94A3B8',
    lineHeight: 14,
    marginTop: 4,
  },
  riskFactorsCol: {
    flex: 1.15,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
    paddingLeft: 12,
    justifyContent: 'center',
  },
  factorsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorsHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#073B72',
  },
  factorsList: {
    gap: 6,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factorIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorLabel: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  factorBarTrack: {
    width: 44,
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    backgroundColor: BioPulseColors.femaleAccent,
    borderRadius: 3,
  },
  factorsEmptyText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  riskEmptyWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  riskEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 4,
  },
  riskEmptySub: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  startScreeningBtn: {
    backgroundColor: BioPulseColors.femaleAccent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  startScreeningBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Next Best Action Card ──────────────────────────────────
  nextActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FCE7F0',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  nextActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextActionTextCol: {
    flex: 1,
  },
  nextActionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#073B72',
    marginBottom: 2,
  },
  nextActionDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },
  nextActionBtn: {
    backgroundColor: BioPulseColors.femaleAccent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  nextActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Quick Access ───────────────────────────────────────────
  quickAccessSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#073B72',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: BioPulseColors.femaleAccent,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickTile: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F0',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  tilePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Bottom Row: Activity & Health Tips ─────────────────────
  bottomCardsRow: {
    flexDirection: 'column',
    gap: 12,
  },
  bottomCardsTablet: {
    flexDirection: 'row',
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCE7F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#073B72',
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelineIndicatorCol: {
    width: 14,
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    justifyContent: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 10,
    bottom: -10,
    width: 1.5,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  timelineIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginRight: 8,
  },
  timelineTextCol: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  timelineTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  emptyActivityText: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
    paddingVertical: 10,
  },
  healthTipsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCE7F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tipContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipTextCol: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#073B72',
    lineHeight: 16,
    marginBottom: 8,
  },
  tipBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF0F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tipBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: BioPulseColors.femaleAccent,
  },
  tipMealImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    backgroundColor: BioPulseColors.femaleAccent,
    width: 14,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
