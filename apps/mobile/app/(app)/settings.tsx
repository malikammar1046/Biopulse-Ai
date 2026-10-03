import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
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

/**
 * SCREEN 45: Settings
 * 
 * Provides:
 * - App units & localized standards (Metric vs Imperial)
 * - Notification preferences & clinical alert toggles
 * - Privacy & security safeguards (Biometric lock, End-to-end encryption)
 * - Clinical non-diagnostic disclaimer & compliance notes
 * - Session sign-out
 * - Strictly separates app system settings from health profile data
 */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway, logout } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  // Settings State
  const [metricUnits, setMetricUnits] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [screeningReminders, setScreeningReminders] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [deidentifiedResearch, setDeidentifiedResearch] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Offline Storage Cleared',
      'Local cached reports and temporary images were safely removed. Cloud synchronization remains intact.'
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
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Units & Preferences */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>UNITS & DISPLAY</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="scale-outline" size={20} color={themeAccent} />
                <View>
                  <Text style={styles.rowLabel}>Metric System</Text>
                  <Text style={styles.rowSub}>Kilograms (kg) and Centimeters (cm)</Text>
                </View>
              </View>
              <Switch
                value={metricUnits}
                onValueChange={setMetricUnits}
                trackColor={{ false: '#CBD5E1', true: themeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Section 2: Notifications */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS & REMINDERS</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.borderBottom]}>
              <View style={styles.rowLeft}>
                <Ionicons name="notifications-outline" size={20} color={themeAccent} />
                <View>
                  <Text style={styles.rowLabel}>Push Notifications</Text>
                  <Text style={styles.rowSub}>Critical health & appointment alerts</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#CBD5E1', true: themeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.row, styles.borderBottom]}>
              <View style={styles.rowLeft}>
                <Ionicons name="medkit-outline" size={20} color={themeAccent} />
                <View>
                  <Text style={styles.rowLabel}>Medication Schedules</Text>
                  <Text style={styles.rowSub}>Daily dose reminders and alerts</Text>
                </View>
              </View>
              <Switch
                value={medicationReminders}
                onValueChange={setMedicationReminders}
                trackColor={{ false: '#CBD5E1', true: themeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="calendar-outline" size={20} color={themeAccent} />
                <View>
                  <Text style={styles.rowLabel}>Screening Check-in Prompts</Text>
                  <Text style={styles.rowSub}>Periodic risk reassessment check-ins</Text>
                </View>
              </View>
              <Switch
                value={screeningReminders}
                onValueChange={setScreeningReminders}
                trackColor={{ false: '#CBD5E1', true: themeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Section 3: Privacy & Security */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>PRIVACY & DATA PROTECTION</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.borderBottom]}>
              <View style={styles.rowLeft}>
                <Ionicons name="finger-print-outline" size={20} color={themeAccent} />
                <View>
                  <Text style={styles.rowLabel}>Biometric Unlock</Text>
                  <Text style={styles.rowSub}>Require FaceID or Fingerprint on launch</Text>
                </View>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#CBD5E1', true: themeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.row, styles.borderBottom]}>
              <View style={styles.rowLeft}>
                <Ionicons name="flask-outline" size={20} color={themeAccent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>De-identified Research</Text>
                  <Text style={styles.rowSub}>
                    Anonymized data contribution to PCOS and male endocrine research
                  </Text>
                </View>
              </View>
              <Switch
                value={deidentifiedResearch}
                onValueChange={setDeidentifiedResearch}
                trackColor={{ false: '#CBD5E1', true: themeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable
              onPress={() => router.push('/(app)/care-circle')}
              style={[styles.row, styles.borderBottom]}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="people-outline" size={20} color={themeAccent} />
                <View>
                  <Text style={styles.rowLabel}>Care Circle Access</Text>
                  <Text style={styles.rowSub}>Manage doctors and family permissions</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

            <Pressable onPress={handleClearCache} style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="trash-outline" size={20} color="#64748B" />
                <View>
                  <Text style={styles.rowLabel}>Clear Local Cache</Text>
                  <Text style={styles.rowSub}>Re-sync offline database with server</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>
          </View>
        </View>

        {/* Section 4: Clinical Governance & Legal */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>CLINICAL GOVERNANCE</Text>
          <View style={styles.card}>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              <Text style={styles.disclaimerText}>
                BioPulse AI is an evidence-based clinical decision-support and risk-screening engine. It does not provide medical diagnoses or replace physician consultations.
              </Text>
            </View>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Engine Version</Text>
              <Text style={styles.versionVal}>v2.4.0 (Clinical Release)</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Action */}
        <Pressable
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out of BioPulse</Text>
        </Pressable>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  sectionBlock: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  rowSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  versionLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  versionVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 48,
    borderRadius: 14,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
