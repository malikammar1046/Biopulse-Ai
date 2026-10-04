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

import { useHealthStore } from '../../store';

/**
 * SCREEN 40: Doctor Profile
 * 
 * Provides:
 * - Detailed clinical credentials, specialty, expertise, and verified affiliations
 * - Consultation availability and schedule slots
 * - CTAs: Book Appointment and Add to Care Circle
 * - Full pathway awareness (Pink accents for Female PCOS, Blue accents for Male Andrology)
 */
export default function DoctorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const { bookAppointment, addToCareCircle } = useHealthStore();

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const badgeBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  const [selectedSlot, setSelectedSlot] = useState<string>('Thu, 10:30 AM');
  const [inCareCircle, setInCareCircle] = useState<boolean>(false);

  // Default doctor profile adapted to pathway
  const doctor = isFemale
    ? {
        name: 'Dr. Fatima Noor',
        credentials: 'MD, FCPS (Reproductive Endocrinology)',
        specialty: 'Reproductive Endocrinologist',
        hospital: 'Aga Khan University Hospital, Karachi',
        experience: '14 years clinical experience',
        rating: 4.9,
        reviewsCount: 142,
        consultationFee: 'PKR 3,500 (~$12)',
        about:
          'Specialist in polycystic ovary syndrome (PCOS), ovulatory dysfunction, and metabolic hormonal management. Dedicated to evidence-based lifestyle integration alongside clinical protocols.',
        expertise: [
          'PCOS Phenotyping',
          'Insulin Resistance',
          'Ovulation Tracking',
          'Hormonal Lab Interpretation',
          'Fertility Counseling',
        ],
        availableSlots: [
          'Thu, 10:30 AM',
          'Thu, 11:30 AM',
          'Thu, 02:00 PM',
          'Fri, 04:30 PM',
        ],
      }
    : {
        name: 'Dr. Tariq Mahmood',
        credentials: 'MD, FRCS (Urology & Andrology)',
        specialty: 'Clinical Andrologist & Endocrinologist',
        hospital: 'Aga Khan University Hospital, Karachi',
        experience: '18 years clinical experience',
        rating: 4.9,
        reviewsCount: 189,
        consultationFee: 'PKR 4,000 (~$14)',
        about:
          'Senior specialist in hypogonadism, testosterone deficiency protocols, and male metabolic health. Focuses on clinical risk-tier evaluation and sustainable hormonal optimization.',
        expertise: [
          'Hypogonadism Screening',
          'Testosterone Replacement Monitoring',
          'Metabolic Syndrome in Men',
          'Endocrine Lab Panels',
          'ADAM Score Stratification',
        ],
        availableSlots: [
          'Wed, 09:30 AM',
          'Wed, 11:00 AM',
          'Thu, 03:00 PM',
          'Sat, 10:00 AM',
        ],
      };

  const handleBook = () => {
    Alert.alert(
      'Confirm Consultation',
      `Book video appointment with ${doctor.name} for ${selectedSlot}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking',
          onPress: () => {
            bookAppointment({
              doctorId: doctor.name,
              doctorName: doctor.name,
              specialty: doctor.specialty,
              clinicOrHospital: doctor.hospital,
              location: 'Karachi, Pakistan',
              visitType: 'Online Consultation',
              date: selectedSlot.includes(',') ? selectedSlot.split(',')[0].trim() : 'Thursday',
              time: selectedSlot.includes(',') ? selectedSlot.split(',')[1].trim() : selectedSlot,
            });

            Alert.alert(
              'Appointment Scheduled',
              `Your appointment is booked for ${selectedSlot}. A calendar invite and clinical summary will be shared.`,
              [
                {
                  text: 'View Appointments',
                  onPress: () => router.push('/(app)/appointments'),
                },
                { text: 'OK' },
              ]
            );
          },
        },
      ]
    );
  };

  const handleToggleCareCircle = () => {
    if (!inCareCircle) {
      setInCareCircle(true);
      addToCareCircle({
        name: doctor.name,
        role: 'Doctor',
        accessLevel: 'Clinical Summary Only',
        email: `${doctor.name.toLowerCase().replace(/[^a-z]/g, '')}@aku.edu`,
      });
      Alert.alert(
        'Added to Care Circle',
        `${doctor.name} has been added to your Care Circle with clinician-level read access to your latest validated screening summary.`
      );
    } else {
      setInCareCircle(false);
      Alert.alert('Removed', `${doctor.name} was removed from your Care Circle.`);
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Physician Profile</Text>
        <Pressable onPress={handleToggleCareCircle} style={styles.circleIconBtn}>
          <Ionicons
            name={inCareCircle ? 'people' : 'people-outline'}
            size={22}
            color={inCareCircle ? themeAccent : '#64748B'}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.topInfoRow}>
            <View style={[styles.avatarBox, { backgroundColor: badgeBg }]}>
              <Ionicons name="person" size={36} color={themeAccent} />
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.docName}>{doctor.name}</Text>
              <Text style={styles.docCreds}>{doctor.credentials}</Text>
              <View style={[styles.specialtyBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.specialtyText, { color: themeAccent }]}>
                  {doctor.specialty}
                </Text>
              </View>

              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingVal}>{doctor.rating}</Text>
                <Text style={styles.reviewCount}>({doctor.reviewsCount} reviews)</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quick Info Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="business-outline" size={16} color="#64748B" />
              <View>
                <Text style={styles.metaLabel}>Affiliation</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {doctor.hospital}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="ribbon-outline" size={16} color="#64748B" />
              <View>
                <Text style={styles.metaLabel}>Experience</Text>
                <Text style={styles.metaValue}>{doctor.experience}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color="#64748B" />
              <View>
                <Text style={styles.metaLabel}>Consultation</Text>
                <Text style={styles.metaValue}>{doctor.consultationFee}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Clinical Focus */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Clinical Focus & Philosophy</Text>
          <Text style={styles.aboutText}>{doctor.about}</Text>
        </View>

        {/* Areas of Expertise */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key Clinical Specialties</Text>
          <View style={styles.chipsWrap}>
            {doctor.expertise.map((exp, idx) => (
              <View key={idx} style={[styles.chip, { borderColor: themeAccent + '30' }]}>
                <Ionicons name="checkmark-circle" size={14} color={themeAccent} />
                <Text style={styles.chipText}>{exp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Schedule & Availability */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Consultation Slot</Text>
          <Text style={styles.subtext}>
            Secure end-to-end encrypted video consult via BioPulse Telehealth.
          </Text>

          <View style={styles.slotsGrid}>
            {doctor.availableSlots.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => setSelectedSlot(slot)}
                  style={[
                    styles.slotPill,
                    isSelected && {
                      backgroundColor: badgeBg,
                      borderColor: themeAccent,
                    },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={isSelected ? themeAccent : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.slotText,
                      isSelected && { color: themeAccent, fontWeight: '700' },
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionBlock}>
          <Pressable
            onPress={handleBook}
            style={[styles.primaryBookBtn, { backgroundColor: themeAccent }]}
          >
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBookText}>Book Appointment • {selectedSlot}</Text>
          </Pressable>

          <Pressable
            onPress={handleToggleCareCircle}
            style={[
              styles.careCircleBtn,
              { borderColor: inCareCircle ? '#10B981' : themeAccent },
            ]}
          >
            <Ionicons
              name={inCareCircle ? 'checkmark-circle' : 'person-add-outline'}
              size={18}
              color={inCareCircle ? '#10B981' : themeAccent}
            />
            <Text
              style={[
                styles.careCircleBtnText,
                { color: inCareCircle ? '#10B981' : themeAccent },
              ]}
            >
              {inCareCircle ? 'In Your Care Circle (Shared)' : 'Add to Care Circle'}
            </Text>
          </Pressable>
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
  circleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topInfoRow: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  docName: {
    fontSize: 17,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  docCreds: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  specialtyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewCount: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  metaGrid: {
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  subtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  actionBlock: {
    gap: 10,
    marginTop: 6,
  },
  primaryBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  primaryBookText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  careCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  careCircleBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
