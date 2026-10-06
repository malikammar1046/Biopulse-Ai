import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../constants/Colors';
import { BioPulseBackground } from '../components/common/BioPulseBackground';
import { BioPulseButton } from '../components/common/BioPulseButton';
import { FemaleOnboardingHeader } from '../components/onboarding/FemaleOnboardingHeader';
import { DatePickerModal } from '../components/onboarding/DatePickerModal';
import {
  useFemaleOnboarding,
  CycleRegularity,
  MissedPeriodsRange,
  FlowIntensity,
} from '../features/onboarding';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatReadableDate(dateIso: string): string {
  if (!dateIso) return '12 Mar 2025';
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3) return dateIso;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * SCREEN 7: FEMALE CYCLE HEALTH (Step 2 of 5)
 *
 * Matches Screenshot 7:
 * - Header: Step 2 of 5 with 5 segmented progress pills
 * - Title: "Cycle Health" with pink calendar icon
 * - Cycle regularity: Regular | Irregular | Not sure
 * - Average cycle length stepper (days)
 * - Last period start date card & inline interactive calendar
 * - Missed periods (last 6 months): 0 | 1–2 | 3+
 * - Typical flow: Light | Moderate | Heavy
 * - Additional notes (optional) with 0/200 counter
 * - Primary "Continue →" pink CTA
 */
export default function FemaleCycleHealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { cycleHealth, updateCycleHealth } = useFemaleOnboarding();

  // Local form state
  const [regularity, setRegularity] = useState<CycleRegularity>(
    cycleHealth.regularity || 'irregular'
  );
  const [cycleLength, setCycleLength] = useState<number>(cycleHealth.cycleLength || 32);
  const [lastPeriodDate, setLastPeriodDate] = useState<string>(
    cycleHealth.lastPeriodDate || '2025-03-12'
  );
  const [missedPeriods, setMissedPeriods] = useState<MissedPeriodsRange>(
    cycleHealth.missedPeriodsYear || '0'
  );
  const [flow, setFlow] = useState<FlowIntensity>(cycleHealth.flowPattern || 'moderate');
  const [notes, setNotes] = useState<string>(cycleHealth.additionalNotes || '');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Calendar month state
  const [calendarYear, setCalendarYear] = useState<number>(2025);
  const [calendarMonth, setCalendarMonth] = useState<number>(2); // 0-indexed, 2 = March

  const bottomPad = Math.max(insets.bottom, 20);

  // Selected date components
  const selectedPeriodDay = useMemo(() => {
    if (!lastPeriodDate) return 12;
    const parts = lastPeriodDate.split('-').map(Number);
    if (parts.length === 3 && parts[0] === calendarYear && parts[1] - 1 === calendarMonth) {
      return parts[2];
    }
    return null;
  }, [lastPeriodDate, calendarYear, calendarMonth]);

  // Calendar grid generator
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    const cells: { day: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, isCurrentMonth: true });
    }
    // Next month padding to fill rows
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, isCurrentMonth: false });
    }

    return cells;
  }, [calendarYear, calendarMonth]);

  const monthName = useMemo(() => {
    const d = new Date(calendarYear, calendarMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [calendarYear, calendarMonth]);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(calendarMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    setLastPeriodDate(`${calendarYear}-${mStr}-${dStr}`);
  };

  const handleContinue = useCallback(() => {
    updateCycleHealth({
      regularity,
      cycleLength,
      lastPeriodDate,
      missedPeriodsYear: missedPeriods,
      flowPattern: flow,
      additionalNotes: notes,
    });
    router.push('/female-symptoms');
  }, [regularity, cycleLength, lastPeriodDate, missedPeriods, flow, notes, updateCycleHealth, router]);

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Top Navigation Bar with Step 2 of 5 */}
      <FemaleOnboardingHeader
        step={2}
        totalSteps={5}
        onBack={() => router.back()}
        accentColor="#F43F7D"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
          {/* Header Title with Pink Icon */}
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <Ionicons name="calendar" size={24} color="#F43F7D" />
            </View>
            <View style={styles.headerTitleTextCol}>
              <Text style={styles.screenTitle}>Cycle Health</Text>
              <Text style={styles.screenSubtitle}>
                Help us understand your menstrual cycle. This helps assess PCOS risk.
              </Text>
            </View>
          </View>

          {/* 1. Cycle Regularity */}
          <View style={styles.sectionBox}>
            <View style={styles.labelWithInfo}>
              <Text style={styles.sectionLabel}>Cycle regularity</Text>
              <Ionicons name="information-circle-outline" size={16} color={BioPulseColors.textSecondary} />
            </View>

            <View style={styles.pillRow}>
              {(['regular', 'irregular', 'not_sure'] as CycleRegularity[]).map((val) => {
                const label = val === 'regular' ? 'Regular' : val === 'irregular' ? 'Irregular' : 'Not sure';
                const isSelected = regularity === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => setRegularity(val)}
                    style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                  >
                    <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 2. Average Cycle Length (Days) */}
          <View style={styles.sectionBox}>
            <View style={styles.stepperRow}>
              <Text style={styles.sectionLabel}>Average cycle length (days)</Text>
              <View style={styles.stepperControls}>
                <Pressable
                  onPress={() => setCycleLength((c) => Math.max(20, c - 1))}
                  style={styles.stepperBtn}
                  hitSlop={8}
                >
                  <Ionicons name="remove" size={16} color={BioPulseColors.textPrimary} />
                </Pressable>
                <Text style={styles.stepperValue}>{cycleLength}</Text>
                <Pressable
                  onPress={() => setCycleLength((c) => Math.min(60, c + 1))}
                  style={styles.stepperBtn}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={16} color={BioPulseColors.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* 3. Last Period Start Date Card */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionLabel}>Last period start date</Text>
            <Pressable
              onPress={() => setIsDatePickerOpen(true)}
              style={styles.dateSelectorCard}
            >
              <View style={styles.dateSelectorLeft}>
                <Ionicons name="calendar-outline" size={18} color="#F43F7D" style={{ marginRight: 8 }} />
                <Text style={styles.dateSelectorText}>{formatReadableDate(lastPeriodDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={BioPulseColors.textMuted} />
            </Pressable>
          </View>

          {/* 4. Interactive Cycle Calendar */}
          <View style={[styles.sectionBox, styles.calendarCard]}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Cycle calendar</Text>
              <View style={styles.monthNavRow}>
                <Pressable onPress={handlePrevMonth} hitSlop={10} style={styles.monthNavBtn}>
                  <Ionicons name="chevron-back" size={16} color={BioPulseColors.textPrimary} />
                </Pressable>
                <Text style={styles.monthNavLabel}>{monthName}</Text>
                <Pressable onPress={handleNextMonth} hitSlop={10} style={styles.monthNavBtn}>
                  <Ionicons name="chevron-forward" size={16} color={BioPulseColors.textPrimary} />
                </Pressable>
              </View>
            </View>

            {/* Day of Week Row */}
            <View style={styles.weekDaysRow}>
              {DAYS_OF_WEEK.map((d) => (
                <Text key={d} style={styles.weekDayText}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.daysGrid}>
              {calendarGrid.map((item, idx) => {
                const isSelected = item.isCurrentMonth && item.day === selectedPeriodDay;
                return (
                  <Pressable
                    key={`day-${idx}`}
                    onPress={() => item.isCurrentMonth && handleSelectDay(item.day)}
                    style={styles.dayCell}
                    disabled={!item.isCurrentMonth}
                  >
                    <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                      <Text
                        style={[
                          styles.dayText,
                          !item.isCurrentMonth && styles.dayTextDisabled,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Missed Periods */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionLabel}>Missed periods (in last 6 months)</Text>
            <View style={styles.pillRow}>
              {(['0', '1-2', '3+'] as MissedPeriodsRange[]).map((val) => {
                const isSelected = missedPeriods === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => setMissedPeriods(val)}
                    style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                  >
                    <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                      {val}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6. Typical Flow */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionLabel}>Typical flow</Text>
            <View style={styles.flowRow}>
              {(['light', 'moderate', 'heavy'] as FlowIntensity[]).map((val) => {
                const label = val.charAt(0).toUpperCase() + val.slice(1);
                const isSelected = flow === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => setFlow(val)}
                    style={[styles.flowPill, isSelected && styles.flowPillSelected]}
                  >
                    <Ionicons
                      name="water"
                      size={14}
                      color={isSelected ? '#F43F7D' : '#F472B6'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.flowPillText, isSelected && styles.flowPillTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 7. Additional Notes */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionLabel}>Additional notes (optional)</Text>
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="E.g. painful periods, clotting, etc."
                placeholderTextColor={BioPulseColors.textMuted}
                value={notes}
                onChangeText={(t) => setNotes(t.slice(0, 200))}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{notes.length}/200</Text>
            </View>
          </View>

          {/* Continue CTA */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Continue"
              variant="female"
              showArrow
              onPress={handleContinue}
              style={{ backgroundColor: '#F43F7D', borderColor: '#E11D48' }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={isDatePickerOpen}
        initialDateIso={lastPeriodDate}
        onConfirm={(newIsoDate) => {
          setLastPeriodDate(newIsoDate);
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </BioPulseBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  mainWrapper: {
    width: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FDECF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleTextCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: BioPulseColors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionBox: {
    marginBottom: 16,
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionPill: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPillSelected: {
    backgroundColor: '#F43F7D',
    borderColor: '#F43F7D',
  },
  optionPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
  },
  optionPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FBFC',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  dateSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthNavBtn: {
    padding: 4,
  },
  monthNavLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.textPrimary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: BioPulseColors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#F43F7D',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
  },
  dayTextDisabled: {
    color: '#CBD5E1',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  flowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flowPill: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowPillSelected: {
    backgroundColor: '#FDF2F6',
    borderColor: '#F43F7D',
  },
  flowPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
  },
  flowPillTextSelected: {
    color: '#F43F7D',
    fontWeight: '700',
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    padding: 12,
  },
  notesInput: {
    minHeight: 60,
    fontSize: 14,
    color: BioPulseColors.textPrimary,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: BioPulseColors.textMuted,
    marginTop: 4,
  },
  ctaWrapper: {
    marginTop: 8,
  },
});
