import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

interface PreferenceRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  showDivider?: boolean;
}

function PreferenceRow({
  iconName,
  title,
  subtitle,
  value,
  onValueChange,
  showDivider = true,
}: PreferenceRowProps) {
  return (
    <View style={[styles.prefRow, showDivider && styles.prefRowDivider]}>
      {/* Icon in soft blue circle */}
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={18} color="#0284C7" />
      </View>

      {/* Text Info */}
      <View style={styles.prefTextCol}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>

      {/* Switch Toggle */}
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#E11D48' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E2E8F0"
        style={styles.switchControl}
      />
    </View>
  );
}

/**
 * SCREEN 46 (SUB-SCREEN): Notification Preferences
 *
 * Strict visual match to Screenshot 46 (Bottom Left):
 * - Header: Back button (<), centered "Notification Preferences"
 * - Section 1: "Reminders"
 *   - Medication reminders (Active)
 *   - Period predictions (Active)
 *   - Appointment reminders (Active)
 * - Section 2: "Health Updates"
 *   - Lab report updates (Active)
 *   - Screening follow-ups (Active)
 *   - New recommendations (Active)
 * - Section 3: "System"
 *   - App updates (Inactive)
 *   - Marketing updates (Inactive)
 */
export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { notifications, updateNotificationSetting } = useHealthStore();

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP HEADER */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.navy} />
        </Pressable>

        <Text style={styles.headerTitle}>Notification Preferences</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PUSH INFRASTRUCTURE TRANSPARENCY NOTICE */}
        <View style={styles.infraNoticeCard}>
          <View style={styles.infraNoticeHeader}>
            <Ionicons name="information-circle-outline" size={17} color="#0284C7" />
            <Text style={styles.infraNoticeTitle}>Channel Status: In-App Alerts Live</Text>
          </View>
          <Text style={styles.infraNoticeDesc}>
            In-app clinical notifications are active and backed by your health records. External push notifications via device APNs/FCM are currently in staging development.
          </Text>
        </View>

        {/* REMINDERS SECTION */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Reminders</Text>
          <View style={styles.cardContainer}>
            <PreferenceRow
              iconName="medkit"
              title="Medication reminders"
              subtitle="Get notified when it's time to take your medication."
              value={notifications.medicationDue}
              onValueChange={(val) => updateNotificationSetting('medicationDue', val)}
            />
            <PreferenceRow
              iconName="calendar"
              title="Period predictions"
              subtitle="Get alerts for upcoming periods."
              value={notifications.periodPredicted}
              onValueChange={(val) => updateNotificationSetting('periodPredicted', val)}
            />
            <PreferenceRow
              iconName="calendar-outline"
              title="Appointment reminders"
              subtitle="Notifications for upcoming appointments."
              value={notifications.appointmentTomorrow}
              onValueChange={(val) => updateNotificationSetting('appointmentTomorrow', val)}
              showDivider={false}
            />
          </View>
        </View>

        {/* HEALTH UPDATES SECTION */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Health Updates</Text>
          <View style={styles.cardContainer}>
            <PreferenceRow
              iconName="document-text"
              title="Lab report updates"
              subtitle="Notify when lab reports are processed."
              value={notifications.labUploadProcessed}
              onValueChange={(val) => updateNotificationSetting('labUploadProcessed', val)}
            />
            <PreferenceRow
              iconName="bar-chart"
              title="Screening follow-ups"
              subtitle="Reminders for next tier or reassessment."
              value={notifications.screeningFollowUp}
              onValueChange={(val) => updateNotificationSetting('screeningFollowUp', val)}
            />
            <PreferenceRow
              iconName="bulb-outline"
              title="New recommendations"
              subtitle="Get notified about personalized tips."
              value={notifications.newRecommendation}
              onValueChange={(val) => updateNotificationSetting('newRecommendation', val)}
              showDivider={false}
            />
          </View>
        </View>

        {/* SYSTEM SECTION */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>System</Text>
          <View style={styles.cardContainer}>
            <PreferenceRow
              iconName="settings-outline"
              title="App updates"
              subtitle="Important updates and new features."
              value={notifications.appUpdates}
              onValueChange={(val) => updateNotificationSetting('appUpdates', val)}
            />
            <PreferenceRow
              iconName="megaphone-outline"
              title="Marketing updates"
              subtitle="Tips, blogs and educational content."
              value={notifications.marketingUpdates}
              onValueChange={(val) => updateNotificationSetting('marketingUpdates', val)}
              showDivider={false}
            />
          </View>
        </View>
      </ScrollView>

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
    fontSize: 16.5,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  headerSpacer: {
    width: 36,
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
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    marginLeft: 2,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  prefRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prefTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  prefTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  prefSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 15,
  },
  switchControl: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  infraNoticeCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
    marginBottom: 16,
  },
  infraNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infraNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  infraNoticeDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
});
