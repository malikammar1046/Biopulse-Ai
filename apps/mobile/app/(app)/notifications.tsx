import React, { useState, useMemo, useCallback } from 'react';
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
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export interface BioPulseNotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  section: 'Today' | 'Yesterday';
  category: 'Reminders' | 'System';
  isRead: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  route?: string;
}

/**
 * SCREEN 46: Notifications
 *
 * Strict visual match to Screenshot 46 (Top Left):
 * - Header: Back button (<), centered "Notifications", right Settings gear icon
 * - Filter Pills: [ All ] (active pink pill), [ Unread (3) ], [ Reminders ], [ System ]
 * - Section: "Today"
 *   - Medication due (8:00 PM, unread pink dot, Metformin 500 mg / Take 1 tablet with food)
 *   - Period predicted (10:30 AM, unread pink dot, next period expected in 2 days)
 *   - Lab upload processed (09:15 AM, read, hormone lab report processed)
 *   - Appointment tomorrow (08:00 AM, read, Dr. Ayesha Malik / HealthCare Hospital)
 * - Section: "Yesterday"
 *   - Screening follow-up (5:20 PM, unread pink dot, consider adding clinical labs)
 *   - New recommendation (3:10 PM, read, personalized nutrition plan)
 * - Bottom Card: [ 🔔 Notification Preferences > ]
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Reminders' | 'System'>('All');

  const [items, setItems] = useState<BioPulseNotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Medication due',
      subtitle: 'Metformin 500 mg\nTake 1 tablet with food.',
      time: '8:00 PM',
      section: 'Today',
      category: 'Reminders',
      isRead: false,
      iconName: 'medkit',
      iconColor: '#E11D48',
      iconBg: '#FCE7F3',
      route: '/(app)/medications',
    },
    {
      id: 'notif-2',
      title: isFemale ? 'Period predicted' : 'Vitality check-in due',
      subtitle: isFemale
        ? 'Your next period is expected\nin 2 days (16 Sep 2026).'
        : 'Update today’s energy and stamina score\nfor refined hormone tracking.',
      time: '10:30 AM',
      section: 'Today',
      category: 'Reminders',
      isRead: false,
      iconName: 'calendar',
      iconColor: '#E11D48',
      iconBg: '#FCE7F3',
      route: isFemale ? '/(app)/cycle-tracking' : '/(app)/symptom-log',
    },
    {
      id: 'notif-3',
      title: 'Lab upload processed',
      subtitle: 'Your hormone lab report\nhas been successfully processed.',
      time: '09:15 AM',
      section: 'Today',
      category: 'System',
      isRead: true,
      iconName: 'document-text',
      iconColor: '#0284C7',
      iconBg: '#E0F2FE',
      route: '/(app)/add-labs',
    },
    {
      id: 'notif-4',
      title: 'Appointment tomorrow',
      subtitle: 'Dr. Ayesha Malik\n10:00 AM at HealthCare Hospital',
      time: '08:00 AM',
      section: 'Today',
      category: 'Reminders',
      isRead: true,
      iconName: 'calendar-outline',
      iconColor: '#E11D48',
      iconBg: '#FCE7F3',
      route: '/(app)/appointments',
    },
    {
      id: 'notif-5',
      title: 'Screening follow-up',
      subtitle: 'Consider adding clinical labs\nfor a more accurate assessment.',
      time: '5:20 PM',
      section: 'Yesterday',
      category: 'System',
      isRead: false,
      iconName: 'bar-chart',
      iconColor: '#E11D48',
      iconBg: '#FCE7F3',
      route: '/(app)/screening',
    },
    {
      id: 'notif-6',
      title: 'New recommendation',
      subtitle: 'A personalized nutrition plan\nis available for you.',
      time: '3:10 PM',
      section: 'Yesterday',
      category: 'System',
      isRead: true,
      iconName: 'bulb-outline',
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
      route: '/(app)/guidance',
    },
  ]);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Unread') return !item.isRead;
      if (activeTab === 'Reminders') return item.category === 'Reminders';
      if (activeTab === 'System') return item.category === 'System';
      return true;
    });
  }, [items, activeTab]);

  const todayItems = useMemo(
    () => filteredItems.filter((item) => item.section === 'Today'),
    [filteredItems]
  );

  const yesterdayItems = useMemo(
    () => filteredItems.filter((item) => item.section === 'Yesterday'),
    [filteredItems]
  );

  const handleItemPress = useCallback(
    (item: BioPulseNotificationItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i))
      );
      if (item.route) {
        router.push(item.route as any);
      }
    },
    [router]
  );

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

        <Text style={styles.headerTitle}>Notifications</Text>

        <Pressable
          onPress={() => router.push('/(app)/notification-preferences')}
          style={styles.settingsBtn}
          accessibilityRole="button"
          accessibilityLabel="Notification Preferences"
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={20} color={BioPulseColors.navy} />
        </Pressable>
      </View>

      {/* FILTER PILLS */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {/* All */}
          <Pressable
            onPress={() => setActiveTab('All')}
            style={[styles.filterPill, activeTab === 'All' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeTab === 'All' && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>

          {/* Unread */}
          <Pressable
            onPress={() => setActiveTab('Unread')}
            style={[styles.filterPill, activeTab === 'Unread' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeTab === 'Unread' && styles.filterPillTextActive,
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </Pressable>

          {/* Reminders */}
          <Pressable
            onPress={() => setActiveTab('Reminders')}
            style={[styles.filterPill, activeTab === 'Reminders' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeTab === 'Reminders' && styles.filterPillTextActive,
              ]}
            >
              Reminders
            </Text>
          </Pressable>

          {/* System */}
          <Pressable
            onPress={() => setActiveTab('System')}
            style={[styles.filterPill, activeTab === 'System' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeTab === 'System' && styles.filterPillTextActive,
              ]}
            >
              System
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* NOTIFICATIONS CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* TODAY SECTION */}
        {todayItems.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Today</Text>
            <View style={styles.cardContainer}>
              {todayItems.map((item, idx) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  style={[
                    styles.notifRow,
                    idx < todayItems.length - 1 && styles.rowDivider,
                  ]}
                  accessibilityRole="button"
                >
                  {/* Category Icon */}
                  <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.iconName} size={18} color={item.iconColor} />
                  </View>

                  {/* Body Col */}
                  <View style={styles.textCol}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifSubtitle}>{item.subtitle}</Text>
                  </View>

                  {/* Right Col: Time, Unread Dot, Chevron */}
                  <View style={styles.rightCol}>
                    <Text style={styles.timeLabel}>{item.time}</Text>
                    <View style={styles.statusRow}>
                      {!item.isRead && <View style={styles.unreadDot} />}
                      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* YESTERDAY SECTION */}
        {yesterdayItems.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Yesterday</Text>
            <View style={styles.cardContainer}>
              {yesterdayItems.map((item, idx) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  style={[
                    styles.notifRow,
                    idx < yesterdayItems.length - 1 && styles.rowDivider,
                  ]}
                  accessibilityRole="button"
                >
                  {/* Category Icon */}
                  <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.iconName} size={18} color={item.iconColor} />
                  </View>

                  {/* Body Col */}
                  <View style={styles.textCol}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifSubtitle}>{item.subtitle}</Text>
                  </View>

                  {/* Right Col: Time, Unread Dot, Chevron */}
                  <View style={styles.rightCol}>
                    <Text style={styles.timeLabel}>{item.time}</Text>
                    <View style={styles.statusRow}>
                      {!item.isRead && <View style={styles.unreadDot} />}
                      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* NOTIFICATION PREFERENCES LINK CARD */}
        <Pressable
          onPress={() => router.push('/(app)/notification-preferences')}
          style={styles.prefLinkCard}
          accessibilityRole="button"
          accessibilityLabel="Notification Preferences"
        >
          <View style={styles.prefLinkLeft}>
            <View style={styles.prefBellBox}>
              <Ionicons name="notifications-outline" size={18} color="#E11D48" />
            </View>
            <Text style={styles.prefLinkText}>Notification Preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#E11D48" />
        </Pressable>
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
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
  },
  filterPillsScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#E11D48',
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  sectionBlock: {
    marginBottom: 16,
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
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  notifTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  notifSubtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 68,
  },
  timeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E11D48',
  },
  prefLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  prefLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prefBellBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
});
