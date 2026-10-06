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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN 44: PROFILE
 *
 * Strict visual match to Screenshot 44:
 * - Top Header: Back chevron (<), centered "My Profile", right "Edit" link
 * - Avatar: Rounded avatar with camera badge
 * - Identity: "Ayesha Khan", "22 years old", "[ PCOS Pathway ]" pill
 * - Profile Completion: Progress track, "85%", chevron >
 * - 4 Stat Boxes: Age (22), Height (165 cm), Weight (68 kg), BMI (25.0)
 * - Emergency Contact Card: Phone icon, "Ali Khan (Brother)", "+92 300 1234567", "Edit"
 * - 4 Navigation Rows:
 *   1. Personal Information (Name, age, contact details)
 *   2. Health Information (Height, weight, cycle details, medical history)
 *   3. Privacy (Data and account privacy)
 *   4. Preferences (App preferences, language, reminders)
 * - Permanent Fixed Bottom Navigation with [ More ] active
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway, user } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const { profile, bmi } = useHealthStore();

  const [emergencyContact, setEmergencyContact] = useState({
    name: profile.emergencyContactName || (isFemale ? 'Ali Khan (Brother)' : 'Zainab Bibi (Spouse)'),
    phone: profile.emergencyContactPhone || '+92 300 1234567',
  });

  const userName = user?.fullName || profile.fullName || (isFemale ? 'Ayesha Khan' : 'Hamza Malik');
  const userAge = profile.age || 22;
  const userHeight = profile.heightCm || (isFemale ? 165 : 178);
  const userWeight = profile.weightKg || (isFemale ? 68 : 80);
  const computedBmi = bmi ? bmi.toFixed(1) : (userWeight / Math.pow(userHeight / 100, 2)).toFixed(1);

  const handleEditContact = () => {
    Alert.prompt
      ? Alert.prompt(
          'Edit Emergency Contact',
          'Enter contact name and phone number',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save',
              onPress: (val) => {
                if (val) setEmergencyContact((prev) => ({ ...prev, name: val }));
              },
            },
          ],
          'plain-text',
          emergencyContact.name
        )
      : Alert.alert('Emergency Contact', `Current Contact: ${emergencyContact.name} (${emergencyContact.phone})`);
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

        <Text style={styles.headerTitle}>My Profile</Text>

        <Pressable
          onPress={() => router.push('/(app)/settings')}
          style={styles.editBtn}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={16} color="#0284C7" />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity & Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={46} color="#073B72" />
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userAge}>{userAge} years old</Text>

          <View style={styles.pathwayPill}>
            <Text style={styles.pathwayText}>
              {isFemale ? 'PCOS Pathway' : 'Hypogonadism Pathway'}
            </Text>
          </View>
        </View>

        {/* Profile Completion */}
        <Pressable
          onPress={() => router.push('/(app)/settings')}
          style={styles.completionCard}
        >
          <Text style={styles.completionLabel}>Profile Completion</Text>
          <View style={styles.completionTrack}>
            <View style={[styles.completionFill, { width: '85%' }]} />
          </View>
          <Text style={styles.completionVal}>85%</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </Pressable>

        {/* 4 Stat Boxes Row */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statVal}>{userAge}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statVal}>{userHeight} cm</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statVal}>{userWeight} kg</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={styles.statVal}>{computedBmi}</Text>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.contactCard}>
          <View style={styles.phoneIconBox}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </View>

          <View style={styles.contactMeta}>
            <Text style={styles.contactLabel}>Emergency Contact</Text>
            <Text style={styles.contactName}>{emergencyContact.name}</Text>
            <Text style={styles.contactPhone}>{emergencyContact.phone}</Text>
          </View>

          <Pressable onPress={handleEditContact} hitSlop={8}>
            <Text style={styles.editContactText}>Edit</Text>
          </Pressable>
        </View>

        {/* 4 Navigation Rows */}
        <View style={styles.navRowsWrap}>
          {/* Personal Information */}
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            style={({ pressed }) => [styles.navRowItem, pressed && styles.rowPressed]}
          >
            <View style={[styles.rowIconBox, { backgroundColor: '#FFE4E6' }]}>
              <Ionicons name="person" size={16} color="#E11D48" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Personal Information</Text>
              <Text style={styles.rowSub}>Name, age, contact details</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* Health Information */}
          <Pressable
            onPress={() => router.push('/(app)/screening')}
            style={({ pressed }) => [styles.navRowItem, pressed && styles.rowPressed]}
          >
            <View style={[styles.rowIconBox, { backgroundColor: '#CCFBF1' }]}>
              <Ionicons name="medical" size={16} color="#0D9488" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Health Information</Text>
              <Text style={styles.rowSub}>Height, weight, cycle details, medical history</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* Privacy */}
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            style={({ pressed }) => [styles.navRowItem, pressed && styles.rowPressed]}
          >
            <View style={[styles.rowIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="shield-checkmark" size={16} color="#0284C7" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Privacy</Text>
              <Text style={styles.rowSub}>Data and account privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* Preferences */}
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            style={({ pressed }) => [styles.navRowItem, pressed && styles.rowPressed]}
          >
            <View style={[styles.rowIconBox, { backgroundColor: '#FFE4E6' }]}>
              <Ionicons name="settings" size={16} color="#E11D48" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Preferences</Text>
              <Text style={styles.rowSub}>App preferences, language, reminders</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Nav with More Active */}
      <BioPulseBottomNav activeTab="more" />
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  editText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
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

  // Avatar & Identity
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userAge: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pathwayPill: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  pathwayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },

  // Completion
  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  completionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 10,
  },
  completionTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  completionVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    marginRight: 6,
  },

  // 4 Stat Boxes
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Emergency Contact
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  phoneIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactMeta: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  contactPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  editContactText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Nav rows
  navRowsWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  navRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowMeta: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rowPressed: {
    backgroundColor: '#F8FAFC',
  },
});
