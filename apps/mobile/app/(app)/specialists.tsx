import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
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

export interface DoctorDef {
  id: string;
  name: string;
  specialty: string;
  degrees: string;
  hospital: string;
  city: string;
  rating: number;
  reviewCount: number;
  isFavorite?: boolean;
}

/**
 * SCREEN 38 (FEMALE) & SCREEN 39 (MALE): FIND A SPECIALIST
 *
 * Strict visual match to Screenshot 38 & 39:
 * - Top Header: Back chevron (<), centered "Find a Specialist", right search icon
 * - Pathway Banner:
 *   - Female: "Specialists for Women's Health", "Find trusted professionals for PCOS and reproductive hormonal health." (Pink)
 *   - Male: "Specialists for Men's Health", "Find trusted professionals for hypogonadism and hormonal health." (Blue)
 * - Category Filter Pills:
 *   - Female: [ Endocrinologists ] (active pink), [ Gynecologists ], [ Reproductive Endocrinologists ], [ Nutritionists ], [ Dermatologists ]
 *   - Male: [ Endocrinologists ] (active blue), [ Urologists ], [ Andrologists ], [ Internal Medicine ], [ Nutrition Specialists ]
 * - Doctor Cards:
 *   - Doctor avatar with coat
 *   - Favorite heart outline (♡)
 *   - Name, Specialty, Degrees, Rating, Hospital
 *   - Action button: [ Book Appointment ] (outlined pink for female, solid blue for male)
 */
export default function SpecialistsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { bookAppointment } = useHealthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Female Specialties (Screen 38)
  const femaleSpecialties = [
    'Endocrinologists',
    'Gynecologists',
    'Reproductive Endocrinologists',
    'Nutritionists',
    'Dermatologists',
  ];

  // Male Specialties (Screen 39)
  const maleSpecialties = [
    'Endocrinologists',
    'Urologists',
    'Andrologists',
    'Internal Medicine',
    'Nutrition Specialists',
  ];

  const currentSpecialties = isFemale ? femaleSpecialties : maleSpecialties;
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Endocrinologists');

  // Female Doctors list (Screen 38)
  const femaleDoctors: DoctorDef[] = [
    {
      id: 'doc-f1',
      name: 'Dr. Ayesha Malik',
      specialty: 'Endocrinologist',
      degrees: 'MBBS, FCPS (Endocrinology)',
      hospital: 'Shaukat Khanum Hospital',
      city: 'Lahore',
      rating: 4.9,
      reviewCount: 156,
    },
    {
      id: 'doc-f2',
      name: 'Dr. Mehwish Tariq',
      specialty: 'Gynecologist',
      degrees: 'MBBS, FCPS (Gynae & Obs)',
      hospital: 'Al-Fatah Medical Center',
      city: 'Lahore',
      rating: 4.8,
      reviewCount: 98,
    },
    {
      id: 'doc-f3',
      name: 'Dr. Fatima Noor',
      specialty: 'Reproductive Endocrinologists',
      degrees: 'MBBS, FCPS (Reproductive Medicine)',
      hospital: 'Aga Khan University Hospital',
      city: 'Karachi',
      rating: 4.9,
      reviewCount: 112,
    },
    {
      id: 'doc-f4',
      name: 'Dr. Sana Mir',
      specialty: 'Nutritionists',
      degrees: 'M.Sc Clinical Nutrition',
      hospital: 'BioPulse Metabolic Clinic',
      city: 'Islamabad',
      rating: 4.7,
      reviewCount: 84,
    },
    {
      id: 'doc-f5',
      name: 'Dr. Hina Rizvi',
      specialty: 'Dermatologists',
      degrees: 'MBBS, MD Dermatology',
      hospital: 'Liaquat National Hospital',
      city: 'Karachi',
      rating: 4.8,
      reviewCount: 130,
    },
  ];

  // Male Doctors list (Screen 39)
  const maleDoctors: DoctorDef[] = [
    {
      id: 'doc-m1',
      name: 'Dr. Ahmed Raza',
      specialty: 'Endocrinologist',
      degrees: 'MBBS, FCPS (Endocrinology)',
      hospital: 'Aga Khan University Hospital',
      city: 'Lahore',
      rating: 4.9,
      reviewCount: 142,
    },
    {
      id: 'doc-m2',
      name: 'Dr. Bilal Khan',
      specialty: 'Urologist',
      degrees: 'MBBS, FCPS (Urology)',
      hospital: 'Services Hospital',
      city: 'Lahore',
      rating: 4.8,
      reviewCount: 110,
    },
    {
      id: 'doc-m3',
      name: 'Dr. Usman Farooq',
      specialty: 'Andrologists',
      degrees: 'MBBS, MRCP (Andrology)',
      hospital: 'Doctors Hospital',
      city: 'Lahore',
      rating: 4.9,
      reviewCount: 125,
    },
    {
      id: 'doc-m4',
      name: 'Dr. Tariq Mahmood',
      specialty: 'Internal Medicine',
      degrees: 'MBBS, FCPS (Medicine)',
      hospital: 'Shifa International Hospital',
      city: 'Islamabad',
      rating: 4.7,
      reviewCount: 89,
    },
    {
      id: 'doc-m5',
      name: 'Dr. Zeeshan Ali',
      specialty: 'Nutrition Specialists',
      degrees: 'M.Sc Sports & Clinical Nutrition',
      hospital: 'Metabolic Care Center',
      city: 'Lahore',
      rating: 4.8,
      reviewCount: 76,
    },
  ];

  const rawDoctorsList = isFemale ? femaleDoctors : maleDoctors;

  // In Screenshots 38 and 39, Endocrinologists is active, showing the top 2 doctors
  const doctorsList = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return rawDoctorsList.filter(
        (d) => d.name.toLowerCase().includes(q) || d.hospital.toLowerCase().includes(q)
      );
    }
    return rawDoctorsList.slice(0, 2);
  }, [rawDoctorsList, searchQuery]);

  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleBook = useCallback(
    (doctor: DoctorDef) => {
      bookAppointment({
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        clinicOrHospital: doctor.hospital,
        date: '24 Mar 2026',
        time: '11:00 AM',
        location: `${doctor.hospital}, ${doctor.city}`,
        visitType: 'In-person',
      });

      Alert.alert(
        'Appointment Booked',
        `Your consultation with ${doctor.name} has been scheduled for 24 Mar 2026 at 11:00 AM.`,
        [
          {
            text: 'View Appointments',
            onPress: () => router.push('/(app)/appointments'),
          },
          { text: 'OK' },
        ]
      );
    },
    [bookAppointment, router]
  );

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

        <Text style={styles.headerTitle}>Find a Specialist</Text>

        <Pressable
          onPress={() => setShowSearchInput(!showSearchInput)}
          style={styles.headerBtn}
          accessibilityLabel="Search"
          hitSlop={8}
        >
          <Ionicons name="search" size={22} color={isFemale ? '#E11D48' : '#0284C7'} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Optional Search Input */}
        {showSearchInput && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by doctor name or hospital..."
              placeholderTextColor="#94A3B8"
              autoFocus
            />
          </View>
        )}

        {/* Pathway Banner */}
        <View style={[styles.bannerCard, isFemale ? styles.bannerFemale : styles.bannerMale]}>
          <View
            style={[
              styles.bannerIconBox,
              { backgroundColor: isFemale ? '#FCE7F3' : '#DBEAFE' },
            ]}
          >
            <Ionicons
              name={isFemale ? 'heart' : 'shield'}
              size={20}
              color={isFemale ? '#E11D48' : '#0284C7'}
            />
          </View>

          <View style={styles.bannerMeta}>
            <Text
              style={[
                styles.bannerTitle,
                { color: isFemale ? '#E11D48' : '#0284C7' },
              ]}
            >
              {isFemale ? "Specialists for Women's Health" : "Specialists for Men's Health"}
            </Text>
            <Text style={styles.bannerSub}>
              {isFemale
                ? 'Find trusted professionals for PCOS and reproductive hormonal health.'
                : 'Find trusted professionals for hypogonadism and hormonal health.'}
            </Text>
          </View>
        </View>

        {/* Specialty Filter Pills */}
        <View style={styles.pillsWrap}>
          {currentSpecialties.map((spec) => {
            const isSelected = selectedSpecialty === spec;
            return (
              <Pressable
                key={spec}
                onPress={() => setSelectedSpecialty(spec)}
                style={[
                  styles.specPill,
                  isSelected && (isFemale ? styles.specPillActiveFemale : styles.specPillActiveMale),
                ]}
              >
                <Text
                  style={[
                    styles.specText,
                    isSelected && styles.specTextActive,
                  ]}
                >
                  {spec}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Doctor Cards */}
        <View style={styles.docList}>
          {doctorsList.map((doc) => {
            const isFav = !!favorites[doc.id];
            return (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docCardMain}>
                  {/* Doctor Avatar */}
                  <View style={styles.docAvatar}>
                    <Ionicons name="person" size={26} color="#073B72" />
                  </View>

                  {/* Doctor Details */}
                  <View style={styles.docDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.docName}>{doc.name}</Text>
                      {/* Heart Favorite Icon */}
                      <Pressable
                        onPress={() => toggleFavorite(doc.id)}
                        style={styles.heartBtn}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={isFav ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isFav ? (isFemale ? '#E11D48' : '#0284C7') : (isFemale ? '#E11D48' : '#0284C7')}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.docSpec}>{doc.specialty}</Text>
                    <Text style={styles.docDegrees}>{doc.degrees}</Text>

                    {/* Rating and Booking Button Row */}
                    <View style={styles.ratingAndBookRow}>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={13} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {doc.rating} ({doc.reviewCount} reviews)
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleBook(doc)}
                        style={({ pressed }) => [
                          isFemale ? styles.bookBtnFemale : styles.bookBtnMale,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <Text
                          style={
                            isFemale ? styles.bookBtnFemaleText : styles.bookBtnMaleText
                          }
                        >
                          Book Appointment
                        </Text>
                      </Pressable>
                    </View>

                    {/* Hospital Location */}
                    <View style={styles.hospitalRow}>
                      <Ionicons name="location-outline" size={13} color="#64748B" />
                      <Text style={styles.hospitalText}>
                        {doc.hospital}, {doc.city}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  // Pathway Banner
  bannerCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerFemale: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FCE7F3',
  },
  bannerMale: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerMeta: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },

  // Specialty Filter Pills
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  specPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  specPillActiveFemale: {
    backgroundColor: '#E11D48',
  },
  specPillActiveMale: {
    backgroundColor: '#0284C7',
  },
  specText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  specTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Doctor Cards
  docList: {
    gap: 12,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  docCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  docAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  docDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  heartBtn: {
    padding: 2,
  },
  docSpec: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  docDegrees: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  ratingAndBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  bookBtnFemale: {
    borderWidth: 1,
    borderColor: '#E11D48',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  bookBtnFemaleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  bookBtnMale: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bookBtnMaleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  hospitalText: {
    fontSize: 11,
    color: '#64748B',
  },

  btnPressed: {
    opacity: 0.85,
  },
});
