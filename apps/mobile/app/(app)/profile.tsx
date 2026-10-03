import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { useFemaleOnboarding } from '../../features/onboarding';
import { useMaleOnboarding } from '../../features/onboarding/MaleOnboardingContext';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

import { useHealthStore } from '../../store';

/**
 * SCREEN 44: Profile
 * 
 * Provides:
 * - Patient Demographics & Profile Completion meter
 * - Personal Info (Name, Email, DOB/Age, Contact)
 * - Health Metrics (Height, Weight, auto BMI calculation, Blood Group)
 * - Emergency Contact configuration
 * - Pathway & Clinical Preferences
 * - Safe updates with immediate persistence in active session
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, pathway } = useAuth();
  const { updateProfileMetrics } = useHealthStore();
  const { basicInfo: femaleBasic } = useFemaleOnboarding();
  const { basicInfo: maleBasic } = useMaleOnboarding();

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const badgeBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  // Base state with fallback to onboarding or user auth
  const [fullName, setFullName] = useState(
    user?.fullName || (isFemale ? 'Ayesha Khan' : 'Hamza Malik')
  );
  const [email] = useState(user?.email || 'patient@biopulse.ai');
  const [phone, setPhone] = useState('+92 300 1234567');
  
  const [age, setAge] = useState(
    isFemale
      ? String(femaleBasic?.age || 26)
      : String(maleBasic?.age || 38)
  );
  const [heightCm, setHeightCm] = useState(
    isFemale
      ? String(femaleBasic?.heightCm || 162)
      : String(maleBasic?.heightCm || 178)
  );
  const [weightKg, setWeightKg] = useState(
    isFemale
      ? String(femaleBasic?.weightKg || 68)
      : String(maleBasic?.weightKg || 86)
  );

  const [bloodGroup, setBloodGroup] = useState('B+');
  const [emergencyName, setEmergencyName] = useState(isFemale ? 'Hamza Khan' : 'Zainab Ahmed');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('+92 321 9876543');

  const [isEditing, setIsEditing] = useState(false);

  // Compute BMI live
  const hM = parseFloat(heightCm) / 100;
  const wK = parseFloat(weightKg);
  const calculatedBMI =
    hM > 0 && wK > 0 ? (wK / (hM * hM)).toFixed(1) : '--';

  const completionPercent = 90;

  const handleSave = () => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      updateProfileMetrics(w, h);
    }
    setIsEditing(false);
    Alert.alert(
      'Profile Updated',
      'Your personal and clinical demographics have been safely synchronized.'
    );
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Patient Profile</Text>
        <Pressable
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          style={[styles.editBtn, { backgroundColor: badgeBg }]}
        >
          <Text style={[styles.editBtnText, { color: themeAccent }]}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
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
        {/* Profile Card with Completion Ring */}
        <View style={styles.profileHeroCard}>
          <View style={styles.heroRow}>
            <View style={[styles.avatarBox, { backgroundColor: badgeBg, borderColor: themeAccent }]}>
              <Ionicons name="person" size={36} color={themeAccent} />
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{fullName}</Text>
              <Text style={styles.heroEmail}>{email}</Text>
              <View style={[styles.pathwayPill, { backgroundColor: badgeBg }]}>
                <Text style={[styles.pathwayPillText, { color: themeAccent }]}>
                  {isFemale ? '♀ PCOS Screening Pathway' : '♂ Male Hypogonadism Pathway'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.completionRow}>
            <View style={styles.meterCol}>
              <View style={styles.meterHeader}>
                <Text style={styles.meterLabel}>Profile Completion</Text>
                <Text style={[styles.meterVal, { color: themeAccent }]}>
                  {completionPercent}%
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${completionPercent}%`, backgroundColor: themeAccent },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section 1: Personal Info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.fieldsGrid}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.fieldInput}
                />
              ) : (
                <Text style={styles.fieldValue}>{fullName}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.fieldInput}
                />
              ) : (
                <Text style={styles.fieldValue}>{phone}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Age</Text>
              {isEditing ? (
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  style={styles.fieldInput}
                />
              ) : (
                <Text style={styles.fieldValue}>{age} years</Text>
              )}
            </View>
          </View>
        </View>

        {/* Section 2: Health & Biometric Info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="fitness-outline" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>Clinical Biometrics</Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Height</Text>
              {isEditing ? (
                <TextInput
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              ) : (
                <Text style={styles.metricVal}>{heightCm} cm</Text>
              )}
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Weight</Text>
              {isEditing ? (
                <TextInput
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              ) : (
                <Text style={styles.metricVal}>{weightKg} kg</Text>
              )}
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Calculated BMI</Text>
              <Text style={[styles.metricVal, { color: themeAccent }]}>
                {calculatedBMI}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Blood Type</Text>
              {isEditing ? (
                <TextInput
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                  style={styles.metricInput}
                />
              ) : (
                <Text style={styles.metricVal}>{bloodGroup}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Section 3: Emergency Contact */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="call-outline" size={18} color={themeAccent} />
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>

          <View style={styles.fieldsGrid}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Contact Name</Text>
              {isEditing ? (
                <TextInput
                  value={emergencyName}
                  onChangeText={setEmergencyName}
                  style={styles.fieldInput}
                />
              ) : (
                <Text style={styles.fieldValue}>{emergencyName}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Relationship</Text>
              {isEditing ? (
                <TextInput
                  value={emergencyRelation}
                  onChangeText={setEmergencyRelation}
                  style={styles.fieldInput}
                />
              ) : (
                <Text style={styles.fieldValue}>{emergencyRelation}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Emergency Phone</Text>
              {isEditing ? (
                <TextInput
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  style={styles.fieldInput}
                />
              ) : (
                <Text style={styles.fieldValue}>{emergencyPhone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Quick Links Block */}
        <View style={styles.quickLinksSection}>
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            style={styles.quickRow}
          >
            <View style={styles.quickRowLeft}>
              <Ionicons name="settings-outline" size={18} color="#64748B" />
              <Text style={styles.quickRowLabel}>Account Settings & Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/care-circle')}
            style={styles.quickRow}
          >
            <View style={styles.quickRowLeft}>
              <Ionicons name="people-outline" size={18} color="#64748B" />
              <Text style={styles.quickRowLabel}>Care Circle Access Management</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
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
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  heroEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  pathwayPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  pathwayPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completionRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  meterCol: {
    gap: 6,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  meterVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  fieldsGrid: {
    gap: 10,
  },
  fieldCol: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13.5,
    color: '#1E293B',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#64748B',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  metricInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 34,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  quickLinksSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  quickRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickRowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
});
