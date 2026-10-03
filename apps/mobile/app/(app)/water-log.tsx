import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function WaterLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { water, addWaterMl, resetWater } = useHealthStore();

  const currentLiters = water.consumedLiters.toFixed(1);
  const targetLiters = water.targetLiters.toFixed(1);
  const percent = Math.min(100, Math.round((water.consumedLiters / Math.max(1, water.targetLiters)) * 100));

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Hydration Tracker</Text>
          <Text style={styles.headerSub}>Cellular & Endocrine Clearance</Text>
        </View>
        <Pressable onPress={resetWater} style={styles.resetBtn} accessibilityLabel="Reset water">
          <Ionicons name="refresh-outline" size={16} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.waterDropCircle}>
            <Ionicons name="water" size={38} color="#0284C7" />
          </View>

          <Text style={styles.volumeText}>{currentLiters} / {targetLiters} L</Text>
          <Text style={styles.percentText}>{percent}% of daily hydration target achieved</Text>

          {/* Bar */}
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { width: `${percent}%` }]} />
          </View>

          {/* Quick Add Buttons */}
          <View style={styles.buttonsRow}>
            <Pressable
              onPress={() => addWaterMl(250)}
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            >
              <Ionicons name="add" size={16} color="#0284C7" />
              <Text style={styles.addBtnText}>+250 ml</Text>
            </Pressable>

            <Pressable
              onPress={() => addWaterMl(500)}
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            >
              <Ionicons name="add" size={16} color="#0284C7" />
              <Text style={styles.addBtnText}>+500 ml</Text>
            </Pressable>

            <Pressable
              onPress={() => addWaterMl(1000)}
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            >
              <Ionicons name="add" size={16} color="#0284C7" />
              <Text style={styles.addBtnText}>+1,000 ml</Text>
            </Pressable>
          </View>
        </View>

        {/* Today's Log Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today's Intake Log ({water.logs.length})</Text>
            <Text style={styles.cardSub}>Cumulative</Text>
          </View>

          <View style={styles.logsList}>
            {water.logs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.logLeft}>
                  <View style={styles.logIconBox}>
                    <Ionicons name="water-outline" size={16} color="#0284C7" />
                  </View>
                  <Text style={styles.logTime}>{log.time}</Text>
                </View>

                <View style={styles.logRight}>
                  <Text style={styles.logAmount}>+{log.amountMl} ml</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Clinical Benefit Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={20} color="#0284C7" />
          <Text style={styles.tipText}>
            Steady water intake prevents hemoconcentration, stabilizes blood glucose absorption, and reduces aldosterone-induced fluid retention.
          </Text>
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Nav */}
      <BioPulseBottomNav activeTab="track" />
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  headerSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginTop: 1,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  waterDropCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  volumeText: {
    fontSize: 32,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginBottom: 4,
  },
  percentText: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '600',
    marginBottom: 18,
  },
  gaugeTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 22,
  },
  gaugeFill: {
    height: 10,
    backgroundColor: '#0284C7',
    borderRadius: 5,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 12,
    gap: 4,
  },
  addBtnPressed: {
    backgroundColor: '#E0F2FE',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  cardSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  logsList: {
    gap: 10,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTime: {
    fontSize: 13,
    color: BioPulseColors.navy,
    fontWeight: '600',
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  tipCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
    flex: 1,
  },
});
