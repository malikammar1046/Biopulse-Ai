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
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function AppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const { appointments, cancelAppointment } = useHealthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const handleCancel = useCallback((id: string, doctorName: string) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your consultation with ${doctorName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => {
            cancelAppointment(id);
            Alert.alert('Cancelled', 'Your appointment has been cancelled and removed from your schedule.');
          },
        },
      ]
    );
  }, [cancelAppointment]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Clinical Appointments</Text>
        <Pressable onPress={() => router.push('/(app)/specialists')} style={styles.findBtn}>
          <Ionicons name="person-add" size={16} color={themeAccent} />
          <Text style={[styles.findBtnText, { color: themeAccent }]}>Find</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => setActiveTab('upcoming')}
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && { color: themeAccent, fontWeight: '700' }]}>
            Upcoming ({appointments.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('history')}
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'history' && { color: themeAccent, fontWeight: '700' }]}>
            Past Consultations
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'upcoming' ? (
          <View style={styles.appointmentsList}>
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <View key={apt.id} style={styles.appointmentCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.docAvatar}>
                      <Ionicons name="medical" size={20} color={themeAccent} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{apt.doctorName}</Text>
                      <Text style={styles.docSpecialty}>{apt.specialty}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" />
                      <Text style={styles.detailText}>{apt.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#64748B" />
                      <Text style={styles.detailText}>{apt.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color="#64748B" />
                      <Text style={styles.detailText}>{apt.clinicOrHospital}</Text>
                    </View>
                  </View>

                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={() => handleCancel(apt.id, apt.doctorName)}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/(app)/doctor-profile')}
                      style={[styles.viewDoctorBtn, { backgroundColor: themeAccent }]}
                    >
                      <Text style={styles.viewDoctorBtnText}>Doctor Profile</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
                <Text style={styles.emptySub}>
                  You don't have any pending doctor visits. Browse verified specialists in your pathway to book a consultation.
                </Text>
                <Pressable
                  onPress={() => router.push('/(app)/specialists')}
                  style={[styles.bookBtn, { backgroundColor: themeAccent }]}
                >
                  <Text style={styles.bookBtnText}>Find a Specialist</Text>
                </Pressable>
              </View>
            )}

            {appointments.length > 0 && (
              <Pressable
                onPress={() => router.push('/(app)/specialists')}
                style={styles.bookAnotherBtn}
              >
                <Ionicons name="add-circle-outline" size={20} color={themeAccent} />
                <Text style={[styles.bookAnotherText, { color: themeAccent }]}>
                  Book with a New Specialist
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.emptyHistoryCard}>
            <Ionicons name="time-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyHistoryTitle}>No Past Consultations</Text>
            <Text style={styles.emptyHistorySub}>
              Completed clinical consultations and diagnostic summaries will be archived here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Permanent Fixed Bottom Nav */}
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
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  findBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: BioPulseColors.navy,
  },
  tabText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  appointmentsList: {
    gap: 14,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  docAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  docSpecialty: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  viewDoctorBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDoctorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginTop: 10,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  bookBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookAnotherBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookAnotherText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyHistorySub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
});
