import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'Medication' | 'Screening' | 'Appointment' | 'Labs' | 'Guidance';
  isRead: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

/**
 * SCREEN 46: Notifications
 * 
 * Provides:
 * - Timely clinical & daily management updates:
 *   - Medication schedule alerts
 *   - Cycle prediction / vitality check-in prompts
 *   - Lab OCR verification confirmations
 *   - Upcoming doctor appointments
 *   - New AI personalized recommendations
 * - Filter tabs: All, Clinical, Reminders
 * - Mark all read & quick jump to actions
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const badgeBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  const [activeTab, setActiveTab] = useState<'All' | 'Clinical' | 'Reminders'>('All');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Medication Due in 30 Mins',
      message: isFemale
        ? 'Metformin 500mg • Take with evening dinner.'
        : 'Zinc & Vitamin D3 Complex • Take with evening meal.',
      time: '15m ago',
      category: 'Medication',
      isRead: false,
      actionRoute: '/(app)/medications',
      actionLabel: 'Log Dose',
    },
    {
      id: 'n2',
      title: isFemale ? 'Predicted Period in 4 Days' : 'Daily Stamina Check-in',
      message: isFemale
        ? 'Based on your 34-day cycle trend, your next cycle is expected on Tuesday.'
        : 'Log today’s energy and symptom intensity to refine your ADAM vitality curve.',
      time: '2h ago',
      category: 'Screening',
      isRead: false,
      actionRoute: isFemale ? '/(app)/cycle-tracking' : '/(app)/symptom-log',
      actionLabel: 'View Details',
    },
    {
      id: 'n3',
      title: 'Lab Report Verified',
      message: 'Hormonal panel OCR extraction verified and added to Tier 2 assessment.',
      time: '1d ago',
      category: 'Labs',
      isRead: true,
      actionRoute: '/(app)/add-labs',
      actionLabel: 'View Labs',
    },
    {
      id: 'n4',
      title: 'Upcoming Video Consultation',
      message: isFemale
        ? 'Appointment with Dr. Fatima Noor scheduled for Thursday at 10:30 AM.'
        : 'Appointment with Dr. Tariq Mahmood scheduled for Wednesday at 09:30 AM.',
      time: '2d ago',
      category: 'Appointment',
      isRead: true,
      actionRoute: '/(app)/appointments',
      actionLabel: 'View Appointment',
    },
    {
      id: 'n5',
      title: 'New Personalized Recommendation',
      message: isFemale
        ? 'Spearmint infusion protocol added to your evening routine.'
        : 'High-protein breakfast recommendation added to optimize insulin response.',
      time: '3d ago',
      category: 'Guidance',
      isRead: true,
      actionRoute: '/(app)/guidance',
      actionLabel: 'Open Guidance',
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    Alert.alert('All Caught Up', 'All notifications marked as read.');
  };

  const handleAction = (item: NotificationItem) => {
    // mark read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    if (item.actionRoute) {
      router.push(item.actionRoute as any);
    }
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Clinical') {
      return (
        item.category === 'Screening' ||
        item.category === 'Labs' ||
        item.category === 'Appointment'
      );
    }
    if (activeTab === 'Reminders') {
      return item.category === 'Medication' || item.category === 'Guidance';
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={() => router.push('/(app)/settings')}
          style={styles.settingsIconBtn}
        >
          <Ionicons name="settings-outline" size={20} color="#64748B" />
        </Pressable>
      </View>

      {/* Tabs Row & Mark All Read */}
      <View style={styles.tabRowContainer}>
        <View style={styles.filterPills}>
          {(['All', 'Clinical', 'Reminders'] as const).map((tab) => {
            const isSel = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabPill,
                  isSel && {
                    backgroundColor: badgeBg,
                    borderColor: themeAccent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isSel && { color: themeAccent, fontWeight: '700' },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead}>
            <Text style={[styles.markReadText, { color: themeAccent }]}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listCol}>
          {filtered.map((item) => {
            const getIcon = () => {
              switch (item.category) {
                case 'Medication':
                  return 'medkit';
                case 'Screening':
                  return 'shield-checkmark';
                case 'Appointment':
                  return 'calendar';
                case 'Labs':
                  return 'flask';
                case 'Guidance':
                  return 'sparkles';
                default:
                  return 'notifications';
              }
            };

            return (
              <Pressable
                key={item.id}
                onPress={() => handleAction(item)}
                style={[
                  styles.notifCard,
                  !item.isRead && styles.unreadCard,
                  !item.isRead && { borderLeftColor: themeAccent },
                ]}
              >
                <View style={styles.notifTopRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: !item.isRead ? badgeBg : '#F1F5F9',
                      },
                    ]}
                  >
                    <Ionicons
                      name={getIcon()}
                      size={20}
                      color={!item.isRead ? themeAccent : '#64748B'}
                    />
                  </View>

                  <View style={styles.notifBodyCol}>
                    <View style={styles.titleLine}>
                      <Text
                        style={[
                          styles.notifTitle,
                          !item.isRead && { fontWeight: '800' },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>

                    <Text style={styles.notifMessage}>{item.message}</Text>

                    {item.actionLabel && (
                      <View style={styles.actionRow}>
                        <Pressable
                          onPress={() => handleAction(item)}
                          style={[
                            styles.actionBtn,
                            { backgroundColor: badgeBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.actionBtnText,
                              { color: themeAccent },
                            ]}
                          >
                            {item.actionLabel}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={12}
                            color={themeAccent}
                          />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRowContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
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
  listCol: {
    gap: 10,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
  },
  notifTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBodyCol: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.navy,
    flex: 1,
    paddingRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notifMessage: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
