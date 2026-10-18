import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation/BioPulseBottomNav';
import { useAuth } from '../../features/authentication';
import {
  UnitPreferences,
  HeightUnit,
  WeightUnit,
  loadSavedUnitPreferences,
  saveUnitPreferences,
  DEFAULT_UNIT_PREFERENCES,
} from '../../utils/units';

/**
 * SCREEN 42: SETTINGS
 *
 * Full parity unit preference management, notifications, privacy,
 * care circle, security, support, and logout.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { logout } = useAuth();
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(DEFAULT_UNIT_PREFERENCES);
  const [showUnitModal, setShowUnitModal] = useState(false);

  useEffect(() => {
    loadSavedUnitPreferences().then((prefs) => {
      setUnitPrefs(prefs);
    });
  }, []);

  const handleSelectHeightUnit = async (unit: HeightUnit) => {
    const updated = { ...unitPrefs, heightUnit: unit };
    setUnitPrefs(updated);
    await saveUnitPreferences(updated);
  };

  const handleSelectWeightUnit = async (unit: WeightUnit) => {
    const updated = { ...unitPrefs, weightUnit: unit };
    setUnitPrefs(updated);
    await saveUnitPreferences(updated);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your active session on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
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

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsList}>
          {/* 1. Notifications */}
          <Pressable
            onPress={() => router.push('/(app)/notifications')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="notifications" size={18} color="#0284C7" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Notifications</Text>
              <Text style={styles.itemSub}>Appointment reminders, medication alerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* 2. Units */}
          <Pressable
            onPress={() => setShowUnitModal(true)}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="speedometer-outline" size={18} color="#0284C7" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Units</Text>
              <Text style={styles.itemSub}>Measurement display preferences</Text>
            </View>
            <Text style={styles.unitsValueText}>
              {unitPrefs.heightUnit.toUpperCase()} / {unitPrefs.weightUnit.toUpperCase()}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
          </Pressable>

          {/* 3. Privacy */}
          <Pressable
            onPress={() => router.push('/(auth)/privacy')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#CCFBF1' }]}>
              <Ionicons name="shield-checkmark" size={18} color="#0D9488" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Privacy</Text>
              <Text style={styles.itemSub}>Control your data and visibility</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* 4. Data Sharing */}
          <Pressable
            onPress={() => router.push('/(app)/care-circle')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="share-social" size={18} color="#0284C7" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Data Sharing</Text>
              <Text style={styles.itemSub}>Manage how your data is shared</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* 5. Security */}
          <Pressable
            onPress={() => router.push('/(app)/security')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="lock-closed" size={18} color="#4F46E5" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Security</Text>
              <Text style={styles.itemSub}>Change password, login methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* 6. Help & Support */}
          <Pressable
            onPress={() => router.push('/(app)/support')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="help-circle" size={18} color="#0284C7" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Help & Support</Text>
              <Text style={styles.itemSub}>FAQs, contact support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* 7. About BioPulse AI */}
          <Pressable
            onPress={() => router.push('/(app)/about')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="information-circle" size={18} color="#E11D48" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>About BioPulse AI</Text>
              <Text style={styles.itemSub}>App version 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* 8. Logout */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed, { borderBottomWidth: 0 }]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.logoutText}>Logout</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Unit Preferences Modal */}
      <Modal
        visible={showUnitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowUnitModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Measurement Units</Text>
              <Pressable onPress={() => setShowUnitModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>

            <Text style={styles.unitSectionLabel}>Height Unit</Text>
            <View style={styles.unitPillsRow}>
              {(['cm', 'm', 'ft'] as HeightUnit[]).map((u) => {
                const isSelected = unitPrefs.heightUnit === u;
                const label = u === 'cm' ? 'Centimeters (cm)' : u === 'm' ? 'Meters (m)' : 'Feet & Inches (ft)';
                return (
                  <Pressable
                    key={u}
                    onPress={() => handleSelectHeightUnit(u)}
                    style={[styles.unitPill, isSelected && styles.unitPillActive]}
                  >
                    <Text style={[styles.unitPillText, isSelected && styles.unitPillTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.unitSectionLabel}>Weight Unit</Text>
            <View style={styles.unitPillsRow}>
              {(['kg', 'lb'] as WeightUnit[]).map((u) => {
                const isSelected = unitPrefs.weightUnit === u;
                const label = u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)';
                return (
                  <Pressable
                    key={u}
                    onPress={() => handleSelectWeightUnit(u)}
                    style={[styles.unitPill, isSelected && styles.unitPillActive]}
                  >
                    <Text style={[styles.unitPillText, isSelected && styles.unitPillTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.unitNoteBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0284C7" />
              <Text style={styles.unitNoteText}>
                Measurements are stored canonically in database standards (cm and kg) and converted dynamically for your display.
              </Text>
            </View>

            <Pressable
              onPress={() => setShowUnitModal(false)}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Save Preferences</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Permanent Fixed Bottom Navigation with More Active */}
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
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 38,
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

  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemMeta: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  unitsValueText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  rowPressed: {
    backgroundColor: '#F8FAFC',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  unitSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 8,
  },
  unitPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  unitPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  unitPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unitNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  unitNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
