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
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';
import { FemaleDashboardOverview } from '../../components/dashboard';

export default function MobileDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, pathway, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  // SCREEN 12: Female BioPulse Home / Dashboard
  if (isFemale) {
    return <FemaleDashboardOverview />;
  }

  // Male Endocrine Vitality Dashboard
  const themeColor = BioPulseColors.malePrimary;
  const themeBg = 'rgba(8, 104, 185, 0.08)';

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSwitchPathway = () => {
    router.push('/pathway-selection');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <AuthBackgroundFoliage />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* Top Bar / User Header */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greetingText}>
                Welcome back, {user?.fullName ? user.fullName.split(' ')[0] : 'Member'}
              </Text>
              <Text style={styles.userEmailText}>{user?.email || 'Active BioPulse Session'}</Text>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </Pressable>
          </View>

          {/* Active Pathway Banner */}
          <View style={[styles.pathwayBanner, { borderColor: themeColor, backgroundColor: '#FFFFFF' }]}>
            <View style={styles.bannerRow}>
              <View style={[styles.pathwayBadge, { backgroundColor: themeBg }]}>
                <Text style={[styles.pathwayBadgeText, { color: themeColor }]}>
                  {isFemale ? 'FEMALE PCOS PATHWAY' : 'MALE HYPOGONADISM PATHWAY'}
                </Text>
              </View>

              <Pressable
                onPress={handleSwitchPathway}
                style={({ pressed }) => [styles.switchBtn, pressed && styles.switchBtnPressed]}
              >
                <Text style={styles.switchBtnText}>Switch Pathway ⇄</Text>
              </Pressable>
            </View>

            <Text style={styles.bannerTitle}>
              {isFemale
                ? 'PCOS Risk & Cycle Health Overview'
                : 'Endocrine & Testosterone Vitality Overview'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isFemale
                ? 'Your clinical longitudinal monitor is active. Track cycle regularity, metabolic indicators, and hormone labs.'
                : 'Morning testosterone monitoring and ADAM symptom scoring are synchronized with clinical guidelines.'}
            </Text>
          </View>

          {/* Clinical Insights Grid */}
          <View style={styles.insightsGrid}>
            {/* Card 1: Assessment Status */}
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>AI RISK EVALUATION</Text>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.cardMainValue}>Tier 1 Complete</Text>
              <Text style={styles.cardSubtext}>
                {isFemale
                  ? 'Rotterdam-aligned baseline screening: Low Statistical Risk (0.13)'
                  : 'ADAM baseline questionnaire: Normal Endocrine Profile'}
              </Text>
            </View>

            {/* Card 2: Daily Health Action */}
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>NEXT BEST ACTION</Text>
                <Text style={styles.actionIcon}>✦</Text>
              </View>
              <Text style={styles.cardMainValue}>
                {isFemale ? 'Log Cycle & Symptoms' : 'Morning Check-In'}
              </Text>
              <Text style={styles.cardSubtext}>
                {isFemale
                  ? 'Daily check-ins refine your longitudinal hormonal patterns.'
                  : 'Record energy, sleep quality, and physical vitality metrics.'}
              </Text>
            </View>

            {/* Card 3: Nutrition & Lifestyle */}
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>CLINICAL LIFESTYLE</Text>
                <Text style={styles.actionIcon}>🥗</Text>
              </View>
              <Text style={styles.cardMainValue}>Metabolic Nutrition</Text>
              <Text style={styles.cardSubtext}>
                {isFemale
                  ? 'High protein, low-glycemic Mediterranean meal support.'
                  : 'Zinc, Vitamin D, and resistance exercise endocrine support.'}
              </Text>
            </View>
          </View>

          {/* Privacy & Security Affirmation */}
          <View style={styles.privacyStrip}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.privacyStripText}>
              HIPAA & GDPR-aligned encryption protects your biometric health data.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Permanent BioPulse Bottom Navigation */}
      <BioPulseBottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BioPulseColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: BOTTOM_NAV_HEIGHT + 28,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 620,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1E38',
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  logoutBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pathwayBanner: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pathwayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pathwayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  switchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  switchBtnPressed: {
    opacity: 0.7,
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0B1E38',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  insightsGrid: {
    gap: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionIcon: {
    fontSize: 14,
    color: '#0284C7',
  },
  cardMainValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B1E38',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  privacyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.1)',
  },
  lockIcon: {
    fontSize: 14,
  },
  privacyStripText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
});
