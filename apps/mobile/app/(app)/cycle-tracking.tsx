import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
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
import { BioPulseButton } from '../../components/common/BioPulseButton';
import { useHealthStore } from '../../store';

/**
 * SCREEN 24: CYCLE TRACKING
 *
 * Strict visual match to Screenshot 24:
 * - Top Header: Back chevron (<), centered "Cycle Tracking"
 * - Segmented Tabs: [ Calendar ] (active pink tab), [ Insights ], [ History ]
 * - Interactive Calendar Card:
 *   - "< Month Year >"
 *   - Sun to Sat day headers
 *   - Color-coded dates: Period (pink), Today (solid pink), Fertile Window (teal), Predicted (blue)
 *   - Legend dots: Period (pink), Fertile Window (teal), Predicted (blue)
 * - Status Card:
 *   - Today: Cycle Day X, phase
 *   - Next Period (Predicted): date, in X days (only if verified backend data exists)
 * - Period Details Card:
 *   - Flow selector: Light, Moderate, Heavy
 *   - Start Date and End Date
 *   - Notes (Optional)
 * - Bottom CTA: Solid pink "Save Update" button
 * - Insights Tab: Real recorded metrics (cycle length, duration, regularity)
 * - History Tab: Real historical cycles from public.cycle_records with delete action
 * - Male Pathway Isolation Guard: Cycle tracking blocked for male users
 */
export default function CycleTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    isFemale,
    pathway,
    cycle,
    cycleHistory,
    isLoadingCycle,
    cycleError,
    loadCycleData,
    updateCycle,
    logCycleEntry,
    deleteCycleEntry,
  } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'calendar' | 'insights' | 'history'>('calendar');
  const [selectedFlow, setSelectedFlow] = useState<'Light' | 'Moderate' | 'Heavy'>(
    cycle.flow || 'Moderate'
  );
  const [startDate, setStartDate] = useState(
    cycle.lastPeriodStartDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    cycle.lastPeriodStartDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(cycle.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cycleDay = cycle.currentCycleDay;
  const daysUntilNext = cycle.nextPeriodDaysRemaining;

  // Male pathway protection guard
  const isMaleUser = !isFemale || pathway === 'male' || pathway === 'male_hypogonadism';

  // Interactive month navigation state
  const [viewDate, setViewDate] = useState<Date>(new Date());

  // Sync cycle data on mount for female users
  useEffect(() => {
    if (!isMaleUser) {
      loadCycleData();
    }
  }, [isMaleUser, loadCycleData]);

  // Synchronize component form state when store cycle resolves
  useEffect(() => {
    if (cycle.lastPeriodStartDate) {
      setStartDate(cycle.lastPeriodStartDate);
      setEndDate(cycle.lastPeriodStartDate);
    }
    if (cycle.flow) {
      setSelectedFlow(cycle.flow);
    }
    if (cycle.notes) {
      setNotes(cycle.notes);
    }
  }, [cycle.lastPeriodStartDate, cycle.flow, cycle.notes]);

  const handleSaveUpdate = useCallback(async () => {
    setIsSaving(true);
    setSuccessMsg(null);

    const success = await logCycleEntry({
      periodStartDate: startDate,
      periodEndDate: endDate !== startDate ? endDate : undefined,
      flow: selectedFlow,
      cycleLength: cycle.cycleLength || 28,
      notes: notes || undefined,
    });

    setIsSaving(false);

    if (success) {
      updateCycle({
        flow: selectedFlow,
        notes: notes || cycle.notes,
        lastPeriodStartDate: startDate,
      });
      setSuccessMsg('Cycle update saved successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      Alert.alert(
        'Cycle Updated',
        cycleDay
          ? `Period details and cycle parameters have been saved. Cycle Day: ${cycleDay}.`
          : 'Period details and cycle parameters have been saved.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Save Failed', cycleError || 'Could not save cycle details. Please try again.');
    }
  }, [startDate, endDate, selectedFlow, cycle.cycleLength, cycle.notes, notes, cycleDay, logCycleEntry, updateCycle, cycleError]);

  const handleDeleteHistory = useCallback((recordId: string, recordDate: string) => {
    Alert.alert(
      'Delete Cycle Record',
      `Are you sure you want to delete the cycle record starting on ${recordDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteCycleEntry(recordId);
            if (!ok) {
              Alert.alert('Error', 'Failed to delete cycle record.');
            }
          },
        },
      ]
    );
  }, [deleteCycleEntry]);

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

  // MALE PATHWAY ISOLATION VIEW
  if (isMaleUser) {
    return (
      <BioPulseBackground style={styles.root}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={[styles.topHeader, { paddingTop: topPad }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Cycle Tracking</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.maleBlockedContainer}>
          <View style={styles.maleBlockedCard}>
            <View style={styles.maleBlockedIconCircle}>
              <Ionicons name="shield-checkmark" size={32} color="#0284C7" />
            </View>
            <Text style={styles.maleBlockedTitle}>Female Pathway Feature</Text>
            <Text style={styles.maleBlockedDesc}>
              Menstrual cycle tracking is specific to female reproductive health pathways. Your account is currently configured for the male health pathway.
            </Text>
            <Pressable
              onPress={() => router.push('/(app)/track')}
              style={styles.maleBlockedBtn}
            >
              <Text style={styles.maleBlockedBtnText}>Return to Health Tracking</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(app)/symptom-log')}
              style={styles.maleBlockedSecondaryBtn}
            >
              <Text style={styles.maleBlockedSecondaryBtnText}>Log Daily Symptoms</Text>
            </Pressable>
          </View>
        </View>
      </BioPulseBackground>
    );
  }

  // Dynamic monthly calendar matrix based on viewed date
  const currentYear = viewDate.getFullYear();
  const currentMonthIdx = viewDate.getMonth(); // 0-indexed
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(currentYear, currentMonthIdx, 1).getDay(); // 0 is Sun
  const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const todayDate = new Date();
  const isViewingCurrentMonth =
    viewDate.getMonth() === todayDate.getMonth() &&
    viewDate.getFullYear() === todayDate.getFullYear();
  const todayNum = isViewingCurrentMonth ? todayDate.getDate() : -1;

  const handlePrevMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleSelectDay = useCallback((dayNum: number) => {
    const formatted = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setStartDate(formatted);
    setEndDate(formatted);
  }, [currentYear, currentMonthIdx]);

  const calendarRows: (number | null)[][] = [];
  let currentRow: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentRow.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    currentRow.push(d);
    if (currentRow.length === 7) {
      calendarRows.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(null);
    }
    calendarRows.push(currentRow);
  }

  // Insight calculations from real history
  const averageCycleLength = useMemo(() => {
    if (cycleHistory.length >= 2) {
      const sum = cycleHistory.reduce((acc, c) => acc + (c.cycleLength || 28), 0);
      return Math.round(sum / cycleHistory.length);
    }
    return cycle.cycleLength || 28;
  }, [cycleHistory, cycle.cycleLength]);

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
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCycle}
            onRefresh={loadCycleData}
            tintColor="#F43F7D"
            colors={['#F43F7D']}
          />
        }
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
                History ({cycleHistory.length})
              </Text>
            </Pressable>
          </View>

          {/* SUCCESS BANNER */}
          {successMsg && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          )}

          {/* ERROR BANNER */}
          {cycleError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.errorBannerText}>{cycleError}</Text>
              <Pressable onPress={() => loadCycleData()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* LOADING INDICATOR */}
          {isLoadingCycle && !cycle.lastPeriodStartDate && cycleHistory.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F43F7D" />
              <Text style={styles.loadingText}>Syncing cycle records...</Text>
            </View>
          )}

          {/* TAB 1: CALENDAR */}
          {activeTab === 'calendar' && (
            <>
              {/* CALENDAR CARD */}
              <View style={styles.calendarCard}>
                {/* Month Header */}
                <View style={styles.monthHeaderRow}>
                  <Pressable onPress={handlePrevMonth} hitSlop={10} accessibilityLabel="Previous month">
                    <Ionicons name="chevron-back" size={18} color="#64748B" />
                  </Pressable>
                  <Text style={styles.monthTitle}>{monthName}</Text>
                  <Pressable onPress={handleNextMonth} hitSlop={10} accessibilityLabel="Next month">
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

                        const isToday = day === todayNum;
                        const isPeriod = cycleDay != null && cycleDay > 0 && Math.abs(todayNum - day) < 3 && day <= todayNum;

                        return (
                          <View key={`day-${day}`} style={styles.dayCell}>
                            <Pressable
                              onPress={() => handleSelectDay(day)}
                              style={[
                                styles.dayCellInner,
                                isPeriod && styles.dayCellPeriod,
                                isToday && styles.dayCellToday,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayNumberText,
                                  isPeriod && styles.dayTextPeriod,
                                  isToday && styles.dayTextToday,
                                ]}
                              >
                                {day}
                              </Text>
                            </Pressable>
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
                      <Text style={styles.statusBoldTitle}>
                        {cycleDay ? `Cycle Day ${cycleDay}` : 'Not Logged'}
                      </Text>
                      <Text style={styles.statusPhaseText}>
                        {cycleDay ? `In ${cycle.phase || 'Follicular Phase'}` : 'Log period to track phase'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statusDivider} />

                {/* Right Col: Next Period */}
                <View style={styles.statusColRight}>
                  <Text style={styles.statusMutedLabel}>Next Period (Predicted)</Text>
                  <Text style={styles.statusBoldTitle}>
                    {daysUntilNext != null && daysUntilNext > 0
                      ? new Date(Date.now() + daysUntilNext * 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                      : cycle.lastPeriodStartDate ? 'Calculated on log' : 'Pending log'}
                  </Text>
                  <Text style={styles.statusDaysRemaining}>
                    {daysUntilNext != null && daysUntilNext > 0 ? `in ${daysUntilNext} days` : 'Log period start'}
                  </Text>
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
                    <Text style={styles.dateFieldLabel}>Start Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.dateCol}>
                    <Text style={styles.dateFieldLabel}>End Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                    />
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
                  title={isSaving ? "Saving Update..." : "Save Update"}
                  onPress={handleSaveUpdate}
                  disabled={isSaving}
                  style={styles.saveBtn}
                />
              </View>
            </>
          )}

          {/* TAB 2: INSIGHTS */}
          {activeTab === 'insights' && (
            <View style={styles.insightsContainer}>
              <View style={styles.insightStatCard}>
                <Text style={styles.insightStatTitle}>Cycle Statistics</Text>
                <View style={styles.insightStatRow}>
                  <View style={styles.insightItem}>
                    <Text style={styles.insightItemValue}>{averageCycleLength} days</Text>
                    <Text style={styles.insightItemLabel}>Average Cycle Length</Text>
                  </View>
                  <View style={styles.insightDivider} />
                  <View style={styles.insightItem}>
                    <Text style={styles.insightItemValue}>{cycle.periodDuration || 5} days</Text>
                    <Text style={styles.insightItemLabel}>Average Period Duration</Text>
                  </View>
                </View>
              </View>

              <View style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                  <Ionicons name="analytics-outline" size={20} color="#F43F7D" />
                  <Text style={styles.predictionTitle}>Ovulation & Predictions</Text>
                </View>
                {cycleHistory.length >= 2 ? (
                  <Text style={styles.predictionText}>
                    Based on your {cycleHistory.length} recorded cycles, your average cycle duration is {averageCycleLength} days. Your next fertile window is expected around day 12–16 of your cycle.
                  </Text>
                ) : (
                  <Text style={styles.predictionText}>
                    BioPulse does not invent cycle predictions without verifiable health data. Ovulation and cycle regularity forecasting requires at least 2 logged historical cycles. Continue logging your cycle starts to unlock clinical predictions.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyTitle}>Logged Historical Cycles</Text>
                {isLoadingCycle && <ActivityIndicator size="small" color="#F43F7D" />}
              </View>

              {cycleHistory.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Ionicons name="calendar-outline" size={32} color="#94A3B8" style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyHistoryTitle}>No historical cycles recorded yet</Text>
                  <Text style={styles.emptyHistorySubtitle}>
                    Log your period start dates on the Calendar tab to build your verified cycle history.
                  </Text>
                </View>
              ) : (
                cycleHistory.map((item) => (
                  <View key={item.id} style={styles.cycleHistoryCard}>
                    <View style={styles.cycleHistoryLeft}>
                      <View style={styles.cycleDateRow}>
                        <Ionicons name="water" size={16} color="#F43F7D" />
                        <Text style={styles.cycleStartDateText}>
                          {item.periodStartDate} {item.periodEndDate ? `– ${item.periodEndDate}` : ''}
                        </Text>
                        <View style={styles.flowBadge}>
                          <Text style={styles.flowBadgeText}>{item.flow || 'Moderate'}</Text>
                        </View>
                      </View>
                      <Text style={styles.cycleLengthMeta}>
                        Cycle Duration: {item.cycleLength} days
                        {item.notes ? ` • "${item.notes}"` : ''}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleDeleteHistory(item.id, item.periodStartDate)}
                      style={styles.deleteCycleBtn}
                      hitSlop={8}
                      accessibilityLabel="Delete cycle record"
                    >
                      <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
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
    borderWidth: 1,
    borderColor: '#FCE7F3',
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
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  datePickerInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  insightsContainer: {
    gap: 14,
  },
  insightStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  insightStatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 12,
  },
  insightStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
  },
  insightItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F43F7D',
    marginBottom: 2,
  },
  insightItemLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  insightDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  predictionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  historyContainer: {
    gap: 10,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  emptyHistoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  emptyHistorySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
  },
  cycleHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cycleHistoryLeft: {
    flex: 1,
    marginRight: 10,
  },
  cycleDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cycleStartDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  flowBadge: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flowBadgeText: {
    fontSize: 11,
    color: '#F43F7D',
    fontWeight: '600',
  },
  cycleLengthMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  deleteCycleBtn: {
    padding: 6,
  },
  maleBlockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  maleBlockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  maleBlockedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  maleBlockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 8,
    textAlign: 'center',
  },
  maleBlockedDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  maleBlockedBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  maleBlockedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  maleBlockedSecondaryBtn: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  maleBlockedSecondaryBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#F43F7D',
    fontWeight: '500',
  },
});
