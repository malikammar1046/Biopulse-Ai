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
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN 45: SETTINGS
 *
 * Strict visual match to Screenshot 45:
 * - Top Header: Back chevron (<), centered "Settings"
 * - Settings Items List:
 *   1. Notifications (Blue bell icon, "Appointment reminders, medication alerts", chevron >)
 *   2. Units (Blue icon, "Metric (kg, cm)", chevron >)
 *   3. Privacy (Teal shield icon, "Control your data and visibility", chevron >)
 *   4. Data Sharing (Blue nodes icon, "Manage how your data is shared", chevron >)
 *   5. Security (Blue lock icon, "Change password, login methods", chevron >)
 *   6. Help & Support (Blue question icon, "FAQs, contact support", chevron >)
 *   7. About BioPulse AI (Pink icon, "App version 1.0.0", chevron >)
 *   8. Logout (Red exit icon, "Logout")
 * - Permanent Fixed Bottom Navigation with [ More ] active
 */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { logout } = useAuth();
  const [unitsMetric, setUnitsMetric] = useState(true);

  const handleToggleUnits = () => {
    setUnitsMetric(!unitsMetric);
    Alert.alert('Units Updated', `Switched display units to ${!unitsMetric ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}.`);
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
            onPress={handleToggleUnits}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="speedometer-outline" size={18} color="#0284C7" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Units</Text>
            </View>
            <Text style={styles.unitsValueText}>
              {unitsMetric ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}
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
            onPress={() => router.push('/(auth)/forgot-password')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="lock-closed" size={18} color="#0284C7" />
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>Security</Text>
              <Text style={styles.itemSub}>Change password, login methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* 6. Help & Support */}
          <Pressable
            onPress={() => Alert.alert('Help & Support', 'Reach our clinical team at support@biopulse.health or chat with BioPulse AI.')}
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
            onPress={() => Alert.alert('BioPulse AI', 'BioPulse AI Health Platform v1.0.0.\nDual-pathway diagnostic intelligence for endocrine health.')}
            style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}>
              <Ionicons name="heart" size={18} color="#E11D48" />
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
    color: '#64748B',
    fontWeight: '500',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  rowPressed: {
    backgroundColor: '#F8FAFC',
  },
});
