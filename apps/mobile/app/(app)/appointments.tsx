import React, { useState, useCallback } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

/**
 * SCREEN 37: APPOINTMENTS
 *
 * Strict visual match to Screenshot 37:
 * - Top Header: Calendar icon + "Appointments"
 * - Segmented Tabs: [ Upcoming ] (active solid pink pill), [ Find Specialist ], [ History ]
 * - Section: "Your Upcoming Appointment"
 *   - Card with Doctor avatar, "Dr. Sara Khan", "Endocrinologist", "⭐ 4.8 (120 reviews)"
 *   - 📅 15 Mar 2026
 *   - ⏰ 10:00 AM
 *   - 📍 HealthCare Hospital, Lahore (Johar Town, Lahore)
 *   - Action Buttons: [ Reschedule ] (outline pink) & [ View Details ] (solid pink)
 * - Section: "Upcoming Reminders"
 *   - Card: Purple calendar icon, "Lab Test", "Hormone profile (FSH, LH, AMH)", "12 Mar 2026 >"
 */
export default function AppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { appointments, rescheduleAppointment } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'find' | 'history'>('upcoming');

  const handleTabPress = (tab: 'upcoming' | 'find' | 'history') => {
    if (tab === 'find') {
      router.push('/(app)/specialists');
    } else {
      setActiveTab(tab);
    }
  };

  const handleReschedule = useCallback((id: string, doctorName: string) => {
    Alert.alert(
      'Reschedule Consultation',
      `Select a new preferred consultation time with ${doctorName}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next Week (22 Mar, 10:00 AM)',
          onPress: () => {
            rescheduleAppointment(id, '22 Mar 2026', '10:00 AM');
            Alert.alert('Rescheduled', 'Your appointment has been updated to 22 Mar 2026 at 10:00 AM.');
          },
        },
      ]
    );
  }, [rescheduleAppointment]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTitleRow}>
          <View style={styles.calIconBox}>
            <Ionicons name="calendar" size={18} color="#E11D48" />
          </View>
          <Text style={styles.headerTitle}>Appointments</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => handleTabPress('upcoming')}
            style={[styles.tabPill, activeTab === 'upcoming' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress('find')}
            style={styles.tabPill}
          >
            <Text style={styles.tabText}>
              Find Specialist
            </Text>
          </Pressable>

          <View style={styles.tabDivider} />

          <Pressable
            onPress={() => handleTabPress('history')}
            style={[styles.tabPill, activeTab === 'history' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </Pressable>
        </View>

        {/* Section: Your Upcoming Appointment */}
        <Text style={styles.sectionHeading}>Your Upcoming Appointment</Text>

        <View style={styles.upcomingCard}>
          {/* Doctor Top Row */}
          <View style={styles.docRow}>
            <View style={styles.docAvatar}>
              <Ionicons name="person" size={26} color="#073B72" />
            </View>

            <View style={styles.docMeta}>
              <Text style={styles.docName}>Dr. Sara Khan</Text>
              <Text style={styles.docSpecialty}>
                {isFemale ? 'Endocrinologist' : 'Andrologist & Endocrinologist'}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>4.8 (120 reviews)</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#E11D48" />
          </View>

          {/* Appointment Meta Details */}
          <View style={styles.detailsBlock}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>15 Mar 2026</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>10:00 AM</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <View>
                <Text style={styles.detailText}>HealthCare Hospital, Lahore</Text>
                <Text style={styles.detailSubText}>Johar Town, Lahore</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => handleReschedule('apt-1', 'Dr. Sara Khan')}
              style={({ pressed }) => [styles.rescheduleBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(app)/doctor-profile?id=dr-sara' as any)}
              style={({ pressed }) => [styles.viewDetailsBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </Pressable>
          </View>
        </View>

        {/* Section: Upcoming Reminders */}
        <Text style={styles.sectionHeading}>Upcoming Reminders</Text>

        <Pressable
          onPress={() => router.push('/(app)/add-labs')}
          style={({ pressed }) => [styles.reminderCard, pressed && styles.btnPressed]}
        >
          <View style={styles.reminderIconBox}>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
          </View>

          <View style={styles.reminderMeta}>
            <Text style={styles.reminderTitle}>Lab Test</Text>
            <Text style={styles.reminderSub}>
              {isFemale
                ? 'Hormone profile (FSH, LH, AMH)'
                : 'Morning Hormone profile (Testosterone, SHBG)'}
            </Text>
          </View>

          <View style={styles.reminderRight}>
            <Text style={styles.reminderDate}>12 Mar 2026</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Segmented Tabs
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 3,
    marginBottom: 20,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: '#E11D48',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },

  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  // Upcoming Card
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  docAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docMeta: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  docSpecialty: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // Details Block
  detailsBlock: {
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  detailSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rescheduleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E11D48',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  rescheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  viewDetailsBtn: {
    flex: 1,
    backgroundColor: '#E11D48',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Reminders Card
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  reminderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderMeta: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  reminderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reminderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderDate: {
    fontSize: 12,
    color: '#64748B',
  },

  btnPressed: {
    opacity: 0.85,
  },
});
