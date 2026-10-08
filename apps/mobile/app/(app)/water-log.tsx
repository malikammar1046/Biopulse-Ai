import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
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
 *   - Circular ring gauge with consumed liters of target liters and water droplet
 *   - Right: Daily Goal with edit indicator
 *   - Encouragement box: "You're doing great! Keep going to stay hydrated."
 * - Quick Add Buttons: [+ 250 ml] and [+ 500 ml]
 * - Today's History Section:
 *   - Header: "Today's History" and "Total: X.X L"
 *   - List items: water glass icon, time, amount, delete icon
 * - Persistent Backend Integration:
 *   - Connects to public.water_logs in Supabase
 *   - Loading, Error, Retry, Empty, and Delete handling
 */
export default function WaterLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    water,
    addWaterMl,
    deleteWaterLog,
    isLoadingWater,
    waterError,
    loadWaterData,
  } = useHealthStore();

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const currentLiters = (water.consumedLiters || 0).toFixed(1);
  const targetLiters = (water.targetLiters || 2.5).toFixed(1);

  const handleAdd = useCallback(
    async (ml: number) => {
      const ok = await addWaterMl(ml);
      if (ok) {
        setFeedbackMsg(`Added +${ml} ml to today's hydration total.`);
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        Alert.alert('Save Failed', 'Could not record water intake. Please try again.');
      }
    },
    [addWaterMl]
  );

  const handleDelete = useCallback(
    (id: string, amountMl: number) => {
      Alert.alert(
        'Delete Water Entry',
        `Are you sure you want to remove this ${amountMl} ml log?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const ok = await deleteWaterLog(id);
              if (!ok) {
                Alert.alert('Error', 'Failed to delete water log from server.');
              }
            },
          },
        ]
      );
    },
    [deleteWaterLog]
  );

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
        refreshControl={
          <RefreshControl
            refreshing={isLoadingWater}
            onRefresh={() => loadWaterData()}
            tintColor="#0284C7"
          />
        }
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* DATE NAVIGATOR */}
          <View style={styles.dateNavigatorRow}>
            <Pressable hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color="#64748B" />
            </Pressable>
            <Text style={styles.dateNavigatorText}>
              Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Pressable hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* SUCCESS BANNER */}
          {feedbackMsg && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successBannerText}>{feedbackMsg}</Text>
            </View>
          )}

          {/* ERROR BANNER */}
          {waterError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.errorBannerText}>{waterError}</Text>
              <Pressable onPress={() => loadWaterData()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

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
                <Ionicons name="water-outline" size={14} color="#0284C7" />
              </View>
              <Text style={styles.goalValue}>{targetLiters} L</Text>

              {/* Encouragement box */}
              <View style={styles.encouragementBox}>
                <View style={styles.encouragementHeaderRow}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={styles.encouragementTitle}>
                    {Number(currentLiters) >= Number(targetLiters) ? 'Goal reached!' : 'Daily hydration'}
                  </Text>
                </View>
                <Text style={styles.encouragementSub}>
                  {Number(currentLiters) >= Number(targetLiters)
                    ? 'Excellent job staying hydrated today!'
                    : 'Log each glass to reach your target.'}
                </Text>
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
              <Text style={styles.quickAddBtnText}>+ 250 ml</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAdd(500)}
              style={({ pressed }) => [styles.quickAddBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Add 500 ml"
            >
              <Ionicons name="add" size={18} color="#F43F7D" style={{ marginRight: 4 }} />
              <Text style={styles.quickAddBtnText}>+ 500 ml</Text>
            </Pressable>
          </View>

          {/* TODAY'S HISTORY SECTION */}
          <View style={styles.historySection}>
            <View style={styles.historyHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.historyTitle}>Today's History</Text>
                {isLoadingWater && <ActivityIndicator size="small" color="#0284C7" />}
              </View>
              <Text style={styles.historyTotal}>Total: {currentLiters} L</Text>
            </View>

            <View style={styles.historyList}>
              {(!water.logs || water.logs.length === 0) ? (
                <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#94A3B8' }}>No water logged yet today.</Text>
                </View>
              ) : (
                water.logs.map((item) => (
                  <View key={item.id} style={styles.historyItemRow}>
                    <View style={styles.glassIconBox}>
                      <Ionicons name="water-outline" size={18} color="#0284C7" />
                    </View>
                    <Text style={styles.historyTime}>{item.time}</Text>
                    <Text style={styles.historyAmount}>{item.amountMl} ml</Text>
                    <Pressable
                      onPress={() => handleDelete(item.id, item.amountMl)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                      accessibilityLabel="Delete water entry"
                    >
                      <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                    </Pressable>
                  </View>
                ))
              )}
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  successBannerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
