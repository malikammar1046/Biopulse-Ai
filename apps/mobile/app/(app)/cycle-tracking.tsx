import React, { useState, useCallback, useMemo } from 'react';
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
import { BioPulseButton } from '../../components/common/BioPulseButton';
import { useHealthStore } from '../../store';

/**
 * SCREEN 24: CYCLE TRACKING
 *
 * Strict visual match to Screenshot 24:
 * - Top Header: Back chevron (<), centered "Cycle Tracking"
 * - Segmented Tabs: [ Calendar ] (active pink tab), [ Insights ], [ History ]
 * - Interactive Calendar Card:
 *   - "< September 2026 >"
 *   - Sun to Sat day headers
 *   - Color-coded dates: Period (pink 3, 4, 5), Today (solid pink 14), Fertile Window (teal 18, 19, 20), Predicted (blue)
 *   - Legend dots: Period (pink), Fertile Window (teal), Predicted (blue)
 * - Status Card:
 *   - Today: Cycle Day 14, In follicular phase
 *   - Next Period (Predicted): 2 Oct 2026, in 18 days
 * - Period Details Card:
 *   - Flow selector: Light, Moderate (selected), Heavy
 *   - Start Date (3 Sep 2026) and End Date (5 Sep 2026)
 *   - Notes (Optional)
 * - Bottom CTA: Solid pink "Save Update" button
 */
export default function CycleTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { cycle, updateCycle, logPeriodStart } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'calendar' | 'insights' | 'history'>('calendar');
  const [selectedFlow, setSelectedFlow] = useState<'Light' | 'Moderate' | 'Heavy'>('Moderate');
  const [startDate, setStartDate] = useState('3 Sep 2026');
  const [endDate, setEndDate] = useState('5 Sep 2026');
  const [notes, setNotes] = useState('');

  const cycleDay = cycle.currentCycleDay || 14;
  const daysUntilNext = cycle.nextPeriodDaysRemaining || 18;

  const handleSaveUpdate = useCallback(() => {
    updateCycle({
      flow: selectedFlow,
      notes: notes || cycle.notes,
    });
    Alert.alert(
      'Cycle Updated',
      `Period details and cycle parameters have been saved. Cycle Day: ${cycleDay}.`,
      [{ text: 'OK' }]
    );
  }, [selectedFlow, notes, cycle.notes, cycleDay, updateCycle]);

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

  // Calendar matrix for September 2026 (Starts on Tuesday = index 2)
  // Week 1: 30(Aug), 31(Aug), 1, 2, 3, 4, 5
  // Week 2: 6, 7, 8, 9, 10, 11, 12
  // Week 3: 13, 14, 15, 16, 17, 18, 19
  // Week 4: 20, 21, 22, 23, 24, 25, 26
  // Week 5: 27, 28, 29, 30
  const calendarRows = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, null, null, null],
  ];

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

        <Text style={styles.headerTitle}>Cycle Tracking</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* TOP TABS: CALENDAR | INSIGHTS | HISTORY */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => setActiveTab('calendar')}
              style={[styles.tabBtn, activeTab === 'calendar' && styles.tabBtnActive]}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'calendar' && styles.tabBtnTextActive]}
              >
                Calendar
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('insights')}
              style={[styles.tabBtn, activeTab === 'insights' && styles.tabBtnActive]}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'insights' && styles.tabBtnTextActive]}
              >
                Insights
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('history')}
              style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}
              >
                History
              </Text>
            </Pressable>
          </View>

          {/* CALENDAR CARD */}
          <View style={styles.calendarCard}>
            {/* Month Header */}
            <View style={styles.monthHeaderRow}>
              <Pressable hitSlop={10}>
                <Ionicons name="chevron-back" size={18} color="#64748B" />
              </Pressable>
              <Text style={styles.monthTitle}>September 2026</Text>
              <Pressable hitSlop={10}>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Days of week */}
            <View style={styles.daysOfWeekRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text key={d} style={styles.dayOfWeekText}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Date Grid */}
            <View style={styles.gridContainer}>
              {calendarRows.map((row, rIdx) => (
                <View key={`row-${rIdx}`} style={styles.gridRow}>
                  {row.map((day, cIdx) => {
                    if (day === null) {
                      return <View key={`empty-${cIdx}`} style={styles.dayCell} />;
                    }

                    const isPeriod = day >= 3 && day <= 5;
                    const isToday = day === 14;
                    const isFertile = day >= 18 && day <= 20;

                    return (
                      <View key={`day-${day}`} style={styles.dayCell}>
                        <View
                          style={[
                            styles.dayCellInner,
                            isPeriod && styles.dayCellPeriod,
                            isFertile && styles.dayCellFertile,
                            isToday && styles.dayCellToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayNumberText,
                              isPeriod && styles.dayTextPeriod,
                              isFertile && styles.dayTextFertile,
                              isToday && styles.dayTextToday,
                            ]}
                          >
                            {day}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F43F7D' }]} />
                <Text style={styles.legendText}>Period</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#14B8A6' }]} />
                <Text style={styles.legendText}>Fertile Window</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={styles.legendText}>Predicted</Text>
              </View>
            </View>
          </View>

          {/* STATUS SUMMARY CARD */}
          <View style={styles.statusCard}>
            {/* Left Col: Today */}
            <View style={styles.statusCol}>
              <View style={styles.statusHeaderLeft}>
                <View style={styles.calendarIconBox}>
                  <Ionicons name="calendar-outline" size={16} color="#F43F7D" />
                </View>
                <View>
                  <Text style={styles.statusMutedLabel}>Today</Text>
                  <Text style={styles.statusBoldTitle}>Cycle Day {cycleDay}</Text>
                  <Text style={styles.statusPhaseText}>In follicular phase</Text>
                </View>
              </View>
            </View>

            <View style={styles.statusDivider} />

            {/* Right Col: Next Period */}
            <View style={styles.statusColRight}>
              <Text style={styles.statusMutedLabel}>Next Period (Predicted)</Text>
              <Text style={styles.statusBoldTitle}>2 Oct 2026</Text>
              <Text style={styles.statusDaysRemaining}>in {daysUntilNext} days</Text>
            </View>
          </View>

          {/* PERIOD DETAILS CARD */}
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsHeaderLeft}>
                <Ionicons name="water" size={18} color="#F43F7D" />
                <Text style={styles.detailsHeaderTitle}>Period Details</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>

            {/* Flow Selector */}
            <View style={styles.flowRow}>
              <Text style={styles.flowLabel}>Flow</Text>
              <View style={styles.flowOptionsGroup}>
                {(['Light', 'Moderate', 'Heavy'] as const).map((flow) => {
                  const isSelected = selectedFlow === flow;
                  return (
                    <Pressable
                      key={flow}
                      onPress={() => setSelectedFlow(flow)}
                      style={[
                        styles.flowChip,
                        isSelected && styles.flowChipSelected,
                      ]}
                    >
                      <Ionicons
                        name="water"
                        size={14}
                        color={isSelected ? '#F43F7D' : '#94A3B8'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.flowChipText,
                          isSelected && styles.flowChipTextSelected,
                        ]}
                      >
                        {flow}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Dates Row */}
            <View style={styles.datesRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateFieldLabel}>Start Date</Text>
                <View style={styles.datePickerPill}>
                  <Text style={styles.datePickerText}>{startDate}</Text>
                  <Ionicons name="calendar-outline" size={14} color="#F43F7D" />
                </View>
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.dateFieldLabel}>End Date</Text>
                <View style={styles.datePickerPill}>
                  <Text style={styles.datePickerText}>{endDate}</Text>
                  <Ionicons name="calendar-outline" size={14} color="#F43F7D" />
                </View>
              </View>
            </View>

            {/* Notes Field */}
            <View style={styles.notesGroup}>
              <Text style={styles.notesLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes about your period, symptoms, or changes..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Primary CTA */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Save Update"
              onPress={handleSaveUpdate}
              style={styles.saveBtn}
            />
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
    paddingHorizontal: 18,
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#F43F7D',
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayOfWeekText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  gridContainer: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellPeriod: {
    backgroundColor: '#FDF2F8',
  },
  dayCellFertile: {
    backgroundColor: '#CCFBF1',
  },
  dayCellToday: {
    backgroundColor: '#F43F7D',
  },
  dayNumberText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  dayTextPeriod: {
    color: '#F43F7D',
    fontWeight: '700',
  },
  dayTextFertile: {
    color: '#0F766E',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statusCol: {
    flex: 1,
  },
  statusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  calendarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMutedLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBoldTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
    marginTop: 1,
  },
  statusPhaseText: {
    fontSize: 11,
    color: '#14B8A6',
    marginTop: 2,
    fontWeight: '500',
  },
  statusDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 10,
  },
  statusColRight: {
    flex: 1,
    paddingLeft: 4,
  },
  statusDaysRemaining: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  flowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  flowOptionsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  flowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  flowChipSelected: {
    borderColor: '#F43F7D',
    backgroundColor: '#FDF2F8',
  },
  flowChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  flowChipTextSelected: {
    color: '#F43F7D',
    fontWeight: '700',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  dateCol: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  datePickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  datePickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  notesGroup: {
    gap: 6,
  },
  notesLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  ctaWrapper: {
    marginTop: 4,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#F43F7D',
    height: 52,
    borderRadius: 14,
  },
});
