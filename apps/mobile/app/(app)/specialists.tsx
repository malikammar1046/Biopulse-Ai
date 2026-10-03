import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export interface DoctorDef {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  experience: string;
  rating: number;
  availability: string;
  isTelehealth: boolean;
}

export default function SpecialistsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const femaleSpecialties = [
    'All',
    'Endocrinologist',
    'Gynecologist',
    'Reproductive Endocrinologist',
    'Nutritionist',
    'Dermatologist',
  ];

  const maleSpecialties = [
    'All',
    'Endocrinologist',
    'Urologist',
    'Andrologist',
    'Internal Medicine',
    'Nutrition Specialist',
  ];

  const availableSpecialties = isFemale ? femaleSpecialties : maleSpecialties;
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const femaleDoctors: DoctorDef[] = [
    {
      id: 'f1',
      name: 'Dr. Fatima Noor, MD, FCPS',
      specialty: 'Reproductive Endocrinologist',
      hospital: 'Aga Khan University Hospital, Karachi',
      experience: '14 years experience',
      rating: 4.9,
      availability: 'Available Thursday',
      isTelehealth: true,
    },
    {
      id: 'f2',
      name: 'Dr. Ayesha Siddiqa, MBBS, MRCOG',
      specialty: 'Gynecologist',
      hospital: 'South City Hospital, Clifton',
      experience: '11 years experience',
      rating: 4.8,
      availability: 'Available Tomorrow',
      isTelehealth: true,
    },
    {
      id: 'f3',
      name: 'Dr. Sana Mir, MS (Clinical Nutrition)',
      specialty: 'Nutritionist',
      hospital: 'BioPulse Metabolic Care Clinic',
      experience: '8 years experience',
      rating: 4.9,
      availability: 'Available Today',
      isTelehealth: true,
    },
    {
      id: 'f4',
      name: 'Dr. Hina Rizvi, MD',
      specialty: 'Dermatologist',
      hospital: 'Liaquat National Hospital',
      experience: '9 years experience',
      rating: 4.7,
      availability: 'Available Friday',
      isTelehealth: false,
    },
  ];

  const maleDoctors: DoctorDef[] = [
    {
      id: 'm1',
      name: 'Dr. Tariq Mahmood, MD, FRCS',
      specialty: 'Andrologist',
      hospital: 'Aga Khan University Hospital, Karachi',
      experience: '18 years experience',
      rating: 4.9,
      availability: 'Available Tomorrow',
      isTelehealth: true,
    },
    {
      id: 'm2',
      name: 'Dr. Bilal Qureshi, MBBS, FCPS',
      specialty: 'Urologist',
      hospital: 'Shifa International Hospital, Islamabad',
      experience: '15 years experience',
      rating: 4.8,
      availability: 'Available Friday',
      isTelehealth: true,
    },
    {
      id: 'm3',
      name: 'Dr. Kamran Baig, MD (Endocrinology)',
      specialty: 'Endocrinologist',
      hospital: 'National Hospital & Medical Centre, Lahore',
      experience: '12 years experience',
      rating: 4.9,
      availability: 'Available Monday',
      isTelehealth: true,
    },
    {
      id: 'm4',
      name: 'Dr. Zaid Al-Mansoor, MD',
      specialty: 'Internal Medicine',
      hospital: 'BioPulse Vitality Center',
      experience: '10 years experience',
      rating: 4.7,
      availability: 'Available Today',
      isTelehealth: true,
    },
  ];

  const allDoctors = isFemale ? femaleDoctors : maleDoctors;

  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doc) => {
      const matchesSpecialty =
        selectedSpecialty === 'All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSpecialty && matchesSearch;
    });
  }, [allDoctors, selectedSpecialty, searchQuery]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isFemale ? 'Find a PCOS Specialist' : 'Find an Andrologist / Specialist'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by doctor name or hospital..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Specialty Filter Chips */}
      <View style={styles.specialtyScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {availableSpecialties.map((spec) => {
            const isSelected = selectedSpecialty === spec;
            return (
              <Pressable
                key={spec}
                onPress={() => setSelectedSpecialty(spec)}
                style={[
                  styles.specChip,
                  isSelected && {
                    backgroundColor: isFemale ? '#FDF0F4' : '#EFF6FF',
                    borderColor: themeAccent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.specChipText,
                    isSelected && { color: themeAccent, fontWeight: '700' },
                  ]}
                >
                  {spec}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.countText}>Showing {filteredDoctors.length} verified physicians</Text>

        <View style={styles.docsList}>
          {filteredDoctors.map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push('/(app)/doctor-profile')}
              style={styles.doctorCard}
            >
              <View style={styles.docCardTop}>
                <View style={[styles.avatarBox, { backgroundColor: isFemale ? '#FDF0F4' : '#EBF4FC' }]}>
                  <Ionicons name="person" size={24} color={themeAccent} />
                </View>

                <View style={styles.docDetailsCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{doc.rating}</Text>
                    </View>
                  </View>

                  <Text style={[styles.docSpecialty, { color: themeAccent }]}>{doc.specialty}</Text>
                  <Text style={styles.hospitalText}>{doc.hospital}</Text>
                  <Text style={styles.expText}>{doc.experience}</Text>
                </View>
              </View>

              <View style={styles.docCardBottom}>
                <View style={styles.availRow}>
                  <Ionicons name="calendar-outline" size={14} color="#16A34A" />
                  <Text style={styles.availText}>{doc.availability}</Text>
                </View>

                <Pressable
                  onPress={() => router.push('/(app)/doctor-profile')}
                  style={[styles.bookBtn, { backgroundColor: themeAccent }]}
                >
                  <Text style={styles.bookBtnText}>Book Visit</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
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
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  specialtyScrollWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  specChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
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
  countText: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginBottom: 10,
  },
  docsList: {
    gap: 12,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  docCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docDetailsCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  docSpecialty: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  hospitalText: {
    fontSize: 11,
    color: BioPulseColors.secondaryText,
    marginTop: 2,
  },
  expText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  docCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  bookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
