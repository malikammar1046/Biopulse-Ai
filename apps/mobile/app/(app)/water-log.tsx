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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useHealthStore } from '../../store';

/**
 * SCREEN 28: WATER LOG
 *
 * Strict visual match to Screenshot 28:
 * - Top Header: Back chevron (<), centered "Water Log"
 * - Date Navigator: < Today, 14 Sep 2026 >
 * - Large Circular Progress Card:
 *   - Circular ring gauge with 1.6 L of 2.5 L and water droplet
 *   - Right: Daily Goal (2.5 L) with edit pencil
 *   - Encouragement box: "You're doing great! Keep going to stay hydrated."
 * - Quick Add Buttons: [+ 250 ml] and [+ 500 ml]
 * - Today's History Section:
 *   - Header: "Today's History" and "Total: 1.6 L"
 *   - List items: water glass icon, time (8:00 AM, 10:30 AM...), amount (250 ml, 500 ml...), delete icon
 */
export default function WaterLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { water, addWaterMl, deleteWaterLog } = useHealthStore();

  const [historyItems, setHistoryItems] = useState([
    { id: 'wh-1', time: '8:00 AM', amount: 250 },
    { id: 'wh-2', time: '10:30 AM', amount: 250 },
    { id: 'wh-3', time: '12:45 PM', amount: 500 },
    { id: 'wh-4', time: '3:20 PM', amount: 250 },
    { id: 'wh-5', time: '5:10 PM', amount: 350 },
  ]);

  const currentLiters = water.consumedLiters ? water.consumedLiters.toFixed(1) : '1.6';
  const targetLiters = water.targetLiters ? water.targetLiters.toFixed(1) : '2.5';

  const handleAdd = useCallback(
    (ml: number) => {
      addWaterMl(ml);
      const newEntry = {
        id: `wh-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        amount: ml,
      };
      setHistoryItems((prev) => [newEntry, ...prev]);
    },
    [addWaterMl]
  );

  const handleDelete = useCallback((id: string, amountMl: number) => {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

  return (
    <BioPulseBackground style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP HEADER */}
      <View style={[styles.topHeader, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
        </Pressable>

        <Text style={styles.headerTitle}>Water Log</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* DATE NAVIGATOR */}
          <View style={styles.dateNavigatorRow}>
            <Pressable hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color="#64748B" />
            </Pressable>
            <Text style={styles.dateNavigatorText}>Today, 14 Sep 2026</Text>
            <Pressable hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* LARGE CIRCULAR PROGRESS CARD */}
          <View style={styles.progressCard}>
            {/* Gauge on left */}
            <View style={styles.gaugeBox}>
              <View style={styles.ringOuter}>
                <Ionicons name="water" size={22} color="#0284C7" style={{ marginBottom: 2 }} />
                <Text style={styles.volumeText}>{currentLiters} L</Text>
                <Text style={styles.volumeSubText}>of {targetLiters} L</Text>
              </View>
            </View>

            {/* Right Details Col */}
            <View style={styles.detailsCol}>
              <View style={styles.goalHeaderRow}>
                <Text style={styles.goalLabel}>Daily Goal</Text>
                <Pressable hitSlop={6}>
                  <Ionicons name="pencil-outline" size={15} color="#0284C7" />
                </Pressable>
              </View>
              <Text style={styles.goalValue}>{targetLiters} L</Text>

              {/* Encouragement box */}
              <View style={styles.encouragementBox}>
                <View style={styles.encouragementHeaderRow}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={styles.encouragementTitle}>You're doing great!</Text>
                </View>
                <Text style={styles.encouragementSub}>Keep going to stay hydrated.</Text>
              </View>
            </View>
          </View>

          {/* QUICK ADD BUTTONS */}
          <View style={styles.quickAddRow}>
            <Pressable
              onPress={() => handleAdd(250)}
              style={({ pressed }) => [styles.quickAddBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Add 250 ml"
            >
              <Ionicons name="add" size={18} color="#F43F7D" style={{ marginRight: 4 }} />
              <Text style={styles.quickAddBtnText}>250 ml</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAdd(500)}
              style={({ pressed }) => [styles.quickAddBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Add 500 ml"
            >
              <Ionicons name="add" size={18} color="#F43F7D" style={{ marginRight: 4 }} />
              <Text style={styles.quickAddBtnText}>500 ml</Text>
            </Pressable>
          </View>

          {/* TODAY'S HISTORY SECTION */}
          <View style={styles.historySection}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Today's History</Text>
              <Text style={styles.historyTotal}>Total: {currentLiters} L</Text>
            </View>

            <View style={styles.historyList}>
              {historyItems.map((item) => (
                <View key={item.id} style={styles.historyItemRow}>
                  <View style={styles.glassIconBox}>
                    <Ionicons name="water-outline" size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.historyTime}>{item.time}</Text>
                  <Text style={styles.historyAmount}>{item.amount} ml</Text>
                  <Pressable
                    onPress={() => handleDelete(item.id, item.amount)}
                    hitSlop={8}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </BioPulseBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#073B72',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 460,
  },
  tabletWrapper: {
    maxWidth: 580,
  },
  dateNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dateNavigatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
    gap: 18,
  },
  gaugeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: '#0284C7',
    borderLeftColor: '#E0F2FE',
    borderBottomColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073B72',
  },
  volumeSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  detailsCol: {
    flex: 1,
    gap: 4,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#073B72',
    marginBottom: 6,
  },
  encouragementBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  encouragementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encouragementTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  encouragementSub: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 14,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCE7F3',
    borderRadius: 14,
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  quickAddBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F43F7D',
  },
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  historyTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  historyList: {
    gap: 10,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  glassIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyTime: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
    marginRight: 14,
  },
  deleteBtn: {
    padding: 4,
  },
});
