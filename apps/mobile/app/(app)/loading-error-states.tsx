import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import {
  SadCloudIllustration,
  SyncingRingSpinner,
  OfflineStateIcon,
  MiniSadCloudIcon,
} from '../../components/ui/StateIllustrations';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * Animated pulsating Skeleton Placeholder Box
 */
function SkeletonPlaceholder({
  width,
  height,
  borderRadius = 6,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E2E8F0',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * SCREEN 48: Loading & Error States
 *
 * Strict visual match to Screenshot 48:
 * - Top Right: Loading & Error States Showcase
 *   - Loading State (Skeleton): Circle avatar + lines + card placeholders
 *   - Syncing State: Animated dual-arc spinner + "Syncing your data..."
 *   - Error State: Sad cloud with warning badge + "We couldn't update your progress" + [ Retry ]
 *   - Offline State: Crossed-out Wi-Fi + "You're offline" + [ Try Again ]
 * - Bottom Right: Dedicated Progress In-Context Error State
 *   - Hero Sad cloud with exclamation triangle
 *   - "We couldn't load your progress"
 *   - [ Retry ] (primary pink) & [ Check Connection ] (outline)
 *   - "If the problem continues:" guidance card
 */
export default function LoadingErrorStatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // View toggle: 'showcase' (Top Right) or 'progress' (Bottom Right)
  const [viewMode, setViewMode] = useState<'showcase' | 'progress'>('showcase');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRetry = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert('Synced Successfully', 'Your latest longitudinal health records have been synced.');
    }, 1500);
  };

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP HEADER */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => {
            if (viewMode === 'progress') {
              setViewMode('showcase');
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
          {viewMode === 'showcase' ? 'Loading & Error States' : 'Progress'}
        </Text>

        {/* View mode toggle pill */}
        <Pressable
          onPress={() => setViewMode((prev) => (prev === 'showcase' ? 'progress' : 'showcase'))}
          style={styles.viewToggleBtn}
          accessibilityRole="button"
        >
          <Ionicons
            name={viewMode === 'showcase' ? 'analytics-outline' : 'layers-outline'}
            size={18}
            color="#E11D48"
          />
        </Pressable>
      </View>

      {viewMode === 'showcase' ? (
        /* MODE 1: SCREEN 48 (TOP RIGHT) - 4-STATE SHOWCASE */
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
            { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: LOADING STATE (SKELETON) */}
          <View style={styles.stateSection}>
            <Text style={styles.sectionHeading}>Loading State (Skeleton)</Text>
            <View style={styles.cardBox}>
              {/* Header Skeleton row */}
              <View style={styles.skeletonHeaderRow}>
                <SkeletonPlaceholder width={44} height={44} borderRadius={22} />
                <View style={styles.skeletonHeaderTextCol}>
                  <SkeletonPlaceholder width={140} height={12} borderRadius={6} />
                  <SkeletonPlaceholder width={80} height={9} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
              </View>

              {/* Full width divider bar */}
              <SkeletonPlaceholder width="100%" height={8} borderRadius={4} style={{ marginVertical: 14 }} />

              {/* 3 cards skeleton row */}
              <View style={styles.skeletonCardsRow}>
                <SkeletonPlaceholder width="31%" height={40} borderRadius={8} />
                <SkeletonPlaceholder width="31%" height={40} borderRadius={8} />
                <SkeletonPlaceholder width="31%" height={40} borderRadius={8} />
              </View>
            </View>
          </View>

          {/* SECTION 2: SYNCING STATE */}
          <View style={styles.stateSection}>
            <Text style={styles.sectionHeading}>Syncing State</Text>
            <View style={[styles.cardBox, styles.syncingRow]}>
              <SyncingRingSpinner size={46} />
              <View style={styles.syncingTextCol}>
                <Text style={styles.syncingTitle}>Syncing your data...</Text>
                <Text style={styles.syncingDesc}>
                  This may take a few seconds.{'\n'}Please don't close the app.
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 3: ERROR STATE */}
          <View style={styles.stateSection}>
            <Text style={styles.sectionHeading}>Error State</Text>
            <View style={styles.cardBox}>
              <View style={styles.errorCardTopRow}>
                <MiniSadCloudIcon size={52} />
                <View style={styles.errorCardTextCol}>
                  <Text style={styles.errorCardTitle}>We couldn't update your progress.</Text>
                  <Text style={styles.errorCardDesc}>
                    Your saved data is safe.{'\n'}Try syncing again.
                  </Text>
                </View>
              </View>

              {/* Retry Button */}
              <Pressable
                onPress={handleRetry}
                style={[styles.retryBtn, isSyncing && { opacity: 0.7 }]}
                accessibilityRole="button"
              >
                <Text style={styles.retryBtnText}>
                  {isSyncing ? 'Syncing...' : 'Retry'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 4: OFFLINE STATE */}
          <View style={styles.stateSection}>
            <Text style={styles.sectionHeading}>Offline State</Text>
            <View style={styles.cardBox}>
              <View style={styles.offlineCardTopRow}>
                <OfflineStateIcon size={46} />
                <View style={styles.offlineCardTextCol}>
                  <Text style={styles.offlineCardTitle}>You're offline</Text>
                  <Text style={styles.offlineCardDesc}>
                    Some features are unavailable. Your data will sync automatically when you're back online.
                  </Text>
                </View>
              </View>

              {/* Try Again Button */}
              <Pressable
                onPress={() => {
                  Alert.alert('Connection Check', 'Checking connectivity. Internet restored.');
                }}
                style={styles.tryAgainBtn}
                accessibilityRole="button"
              >
                <Text style={styles.tryAgainBtnText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* MODE 2: SCREEN 48 (BOTTOM RIGHT) - DEDICATED PROGRESS IN-CONTEXT ERROR STATE */
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
            { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO ERROR SECTION */}
          <View style={styles.heroErrorCard}>
            <SadCloudIllustration size={160} />

            <Text style={styles.heroErrorTitle}>We couldn't load your progress</Text>
            <Text style={styles.heroErrorDesc}>
              Your saved data is safe. This might be due to a slow connection or a temporary server issue.
            </Text>

            {/* CTA 1: Retry */}
            <Pressable
              onPress={handleRetry}
              style={[styles.heroRetryBtn, isSyncing && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroRetryBtnText}>
                {isSyncing ? 'Syncing...' : 'Retry'}
              </Text>
            </Pressable>

            {/* CTA 2: Check Connection */}
            <Pressable
              onPress={() => {
                Alert.alert('Network Status', 'Wi-Fi & Cellular signal are active.');
              }}
              style={styles.heroCheckConnBtn}
              accessibilityRole="button"
            >
              <Ionicons name="wifi-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.heroCheckConnBtnText}>Check Connection</Text>
            </Pressable>
          </View>

          {/* "IF THE PROBLEM CONTINUES:" CARD */}
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
  stateSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    marginLeft: 2,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderTextCol: {
    marginLeft: 14,
    flex: 1,
  },
  skeletonCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncingTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  syncingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  syncingDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
  },
  errorCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  errorCardTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  errorCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
  },
  retryBtn: {
    width: '100%',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offlineCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  offlineCardTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  offlineCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  offlineCardDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
  },
  tryAgainBtn: {
    width: '100%',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  // HERO PROGRESS ERROR STYLES
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
  // HELP CARD STYLES
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
});
