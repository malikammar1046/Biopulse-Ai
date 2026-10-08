import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

/**
 * SCREEN 40: DOCTOR PROFILE
 *
 * Strict visual match to Screenshot 40:
 * - Top Header: Back chevron (<), favorite heart (♡)
 * - Doctor Overview:
 *   - Avatar with white coat
 *   - "Dr. Ayesha Malik" with verified checkmark
 *   - "Endocrinologist", "MBBS, FCPS (Endocrinology)"
 *   - "⭐ 4.9 (152 reviews)"
 * - About section: "Specializes in hormonal disorders, PCOS, thyroid diseases and women's endocrine health."
 * - 3 Metric Highlight boxes: [ 8+ Years Experience ], [ 500+ Patients Treated ], [ Shaukat Khanum Hospital, Lahore ]
 * - Areas of Expertise chips: PCOS, Hormonal Disorders, Thyroid, Menstrual Irregularities, Reproductive Endocrinology
 * - Availability selector: Mon 15 Mar, Tue 16 Mar (active pink), Wed 17 Mar, Thu 18 Mar, Fri 19 Mar
 * - Dual Bottom CTAs: [ 👤+ Add to Care Circle ] & [ 📅 Book Appointment ]
 */
export default function DoctorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { id } = useLocalSearchParams<{ id?: string }>();
  const { specialists, bookAppointment, addToCareCircle } = useHealthStore();

  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Tue 16 Mar');
  const [inCareCircle, setInCareCircle] = useState(false);

  const matchedSpecialist = useMemo(() => {
    if (!id || !specialists) return null;
    return specialists.find((s) => s.id === id);
  }, [id, specialists]);

  const defaultDoctor = isFemale
    ? {
        name: 'Dr. Ayesha Malik',
        specialty: 'Endocrinologist',
        degrees: 'MBBS, FCPS (Endocrinology)',
        rating: 4.9,
        reviewsCount: 152,
        about:
          "Specializes in hormonal disorders, PCOS, thyroid diseases and women's endocrine health.",
        experienceYears: '8+',
        patientsTreated: '500+',
        hospitalName: 'Shaukat Khanum\nHospital',
        hospitalCity: 'Lahore',
        expertise: [
          'PCOS',
          'Hormonal Disorders',
          'Thyroid',
          'Menstrual Irregularities',
          'Reproductive Endocrinology',
        ],
      }
    : {
        name: 'Dr. Ahmed Raza',
        specialty: 'Endocrinologist',
        degrees: 'MBBS, FCPS (Endocrinology)',
        rating: 4.9,
        reviewsCount: 142,
        about:
          'Specializes in male endocrine health, late-onset hypogonadism, metabolic syndrome, and testosterone optimization.',
        experienceYears: '12+',
        patientsTreated: '750+',
        hospitalName: 'Aga Khan University\nHospital',
        hospitalCity: 'Lahore',
        expertise: [
          'Hypogonadism',
          'Testosterone Replacement',
          'Metabolic Syndrome',
          'Endocrine Recovery',
          'Andrology',
        ],
      };

  const doctor = matchedSpecialist
    ? {
        name: matchedSpecialist.name,
        specialty: matchedSpecialist.specialty,
        degrees: (matchedSpecialist as any).degrees || 'MBBS, FCPS',
        rating: matchedSpecialist.rating || 4.9,
        reviewsCount: (matchedSpecialist as any).reviewsCount || (matchedSpecialist as any).reviewCount || matchedSpecialist.patientsCount || 120,
        about: matchedSpecialist.about || (matchedSpecialist as any).bio || defaultDoctor.about,
        experienceYears: `${matchedSpecialist.experienceYears || 10}+`,
        patientsTreated: `${matchedSpecialist.patientsCount || 500}+`,
        hospitalName: matchedSpecialist.hospital,
        hospitalCity: (matchedSpecialist as any).city || 'Lahore',
        expertise: matchedSpecialist.areasOfExpertise?.length ? matchedSpecialist.areasOfExpertise : defaultDoctor.expertise,
      }
    : defaultDoctor;

  const availabilityDays = [
    { day: 'Mon', date: '15 Mar', slots: '10 slots' },
    { day: 'Tue', date: '16 Mar', slots: '8 slots' },
    { day: 'Wed', date: '17 Mar', slots: '6 slots' },
    { day: 'Thu', date: '18 Mar', slots: '9 slots' },
    { day: 'Fri', date: '19 Mar', slots: '5 slots' },
  ];

  const handleBook = () => {
    const docId = matchedSpecialist?.id || (id as string) || (isFemale ? 'doc-ayesha' : 'doc-ahmed');
    const bookingDate = '16 Mar 2026';
    bookAppointment({
      doctorId: docId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      clinicOrHospital: doctor.hospitalName.replace('\n', ' '),
      date: bookingDate,
      time: '10:00 AM',
      location: `${doctor.hospitalName.replace('\n', ' ')}, ${doctor.hospitalCity}`,
      visitType: 'In-person',
    });

    Alert.alert(
      'Appointment Booked',
      `Your consultation with ${doctor.name} has been scheduled for ${bookingDate}.`,
      [
        {
          text: 'View Appointments',
          onPress: () => router.push('/(app)/appointments'),
        },
        { text: 'OK' },
      ]
    );
  };

  const handleAddToCircle = () => {
    addToCareCircle({
      name: doctor.name,
      role: 'Doctor',
      relationship: doctor.specialty,
      accessLevel: 'Clinical Summary Only',
    });
    setInCareCircle(true);
    Alert.alert('Care Circle Updated', `${doctor.name} was added to your Care Circle.`);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <Pressable
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.headerBtn}
          accessibilityLabel="Favorite"
          hitSlop={8}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color="#E11D48"
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Overview Top Row */}
        <View style={styles.docOverviewRow}>
          <View style={styles.docAvatarBox}>
            <Ionicons name="person" size={40} color="#073B72" />
          </View>

          <View style={styles.docMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.docName}>{doctor.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#0284C7" style={{ marginLeft: 4 }} />
            </View>

            <Text style={styles.docSpecialty}>{doctor.specialty}</Text>
            <Text style={styles.docDegrees}>{doctor.degrees}</Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#EAB308" />
              <Text style={styles.ratingText}>
                {doctor.rating} ({doctor.reviewsCount} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{doctor.about}</Text>
        </View>

        {/* 3 Metric Highlight Boxes */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Ionicons name="medal-outline" size={20} color="#0284C7" />
            <Text style={styles.metricVal}>{doctor.experienceYears}</Text>
            <Text style={styles.metricLabel}>Years{'\n'}Experience</Text>
          </View>

          <View style={styles.metricBox}>
            <Ionicons name="people-outline" size={20} color="#0284C7" />
            <Text style={styles.metricVal}>{doctor.patientsTreated}</Text>
            <Text style={styles.metricLabel}>Patients{'\n'}Treated</Text>
          </View>

          <View style={styles.metricBox}>
            <Ionicons name="business-outline" size={20} color="#0284C7" />
            <Text style={styles.metricHospitalVal}>{doctor.hospitalName}</Text>
            <Text style={styles.metricHospitalCity}>{doctor.hospitalCity}</Text>
          </View>
        </View>

        {/* Areas of Expertise */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Areas of Expertise</Text>
          <View style={styles.chipsWrap}>
            {doctor.expertise.map((item, idx) => (
              <View key={idx} style={styles.chipPill}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.sectionWrap}>
          <View style={styles.availHeader}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <Pressable hitSlop={6}>
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
            {availabilityDays.map((d, idx) => {
              const fullKey = `${d.day} ${d.date}`;
              const isSelected = selectedDay === fullKey;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedDay(fullKey)}
                  style={[styles.dayCard, isSelected && styles.dayCardActive]}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayTextActive]}>{d.day}</Text>
                  <Text style={[styles.dayDate, isSelected && styles.dayTextActive]}>{d.date}</Text>
                  <Text style={[styles.daySlots, isSelected && styles.dayTextActive]}>{d.slots}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Dual Bottom CTAs */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable
          onPress={handleAddToCircle}
          style={({ pressed }) => [styles.careCircleBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="person-add-outline" size={16} color="#E11D48" style={{ marginRight: 6 }} />
          <Text style={styles.careCircleText}>
            {inCareCircle ? 'In Care Circle' : 'Add to Care Circle'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleBook}
          style={({ pressed }) => [styles.bookBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.bookText}>Book Appointment</Text>
        </Pressable>
      </View>
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
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Overview
  docOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  docAvatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSpecialty: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  docDegrees: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  // Section
  sectionWrap: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  // 3 Metric Boxes
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 12,
  },
  metricHospitalVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12,
  },
  metricHospitalCity: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },

  // Expertise Chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPill: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E11D48',
  },

  // Availability
  availHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 62,
  },
  dayCardActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 2,
  },
  daySlots: {
    fontSize: 10,
    color: '#64748B',
  },
  dayTextActive: {
    color: '#E11D48',
  },

  // Dual Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF5FF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  careCircleBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E11D48',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  bookBtn: {
    flex: 1.2,
    flexDirection: 'row',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  btnPressed: {
    opacity: 0.85,
  },
});
