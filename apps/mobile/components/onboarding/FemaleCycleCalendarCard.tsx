import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface FemaleCycleCalendarCardProps {
  lastPeriodDate: string; // 'YYYY-MM-DD'
  periodDuration?: number; // default 5 days
  cycleLength?: number; // default 28 days
  onSelectStartDate: (dateIso: string) => void;
  showEstimatedOverlay?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * BioPulse Female Cycle Health Calendar
 *
 * Visualizes:
 * - Real calendar month navigation
 * - Reported period days based on verified patient input
 * - Direct tap-to-select for period start date
 * - Isolated, non-diagnostic fertile window / ovulation model boundary
 */
export const FemaleCycleCalendarCard: React.FC<FemaleCycleCalendarCardProps> = ({
  lastPeriodDate,
  periodDuration = 5,
  cycleLength = 28,
  onSelectStartDate,
  showEstimatedOverlay = false,
}) => {
  // Parse last period date into year, month, day
  const initialDate = useMemo(() => {
    const parts = lastPeriodDate ? lastPeriodDate.split('-').map(Number) : [];
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  }, [lastPeriodDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateIso: string;
      isPeriodDay: boolean;
      isPeriodStart: boolean;
      isEstimatedFertile: boolean;
      isEstimatedOvulation: boolean;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateIso = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({
        dayNumber: prevDay,
        isCurrentMonth: false,
        dateIso,
        isPeriodDay: false,
        isPeriodStart: false,
        isEstimatedFertile: false,
        isEstimatedOvulation: false,
      });
    }

    // Current month days
    const startDateObj = initialDate;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateIso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const thisDate = new Date(currentYear, currentMonth, day);

      // Diff in days from lastPeriodDate
      const diffTime = thisDate.getTime() - startDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const isPeriodStart = diffDays === 0;
      const isPeriodDay = diffDays >= 0 && diffDays < periodDuration;

      // Model Boundary only: Estimated ovulation & fertile window (non-diagnostic UI demo)
      const isEstimatedOvulation = showEstimatedOverlay && diffDays === Math.round(cycleLength / 2);
      const isEstimatedFertile =
        showEstimatedOverlay &&
        diffDays >= Math.round(cycleLength / 2) - 3 &&
        diffDays <= Math.round(cycleLength / 2) + 1;

      days.push({
        dayNumber: day,
        isCurrentMonth: true,
        dateIso,
        isPeriodDay,
        isPeriodStart,
        isEstimatedFertile,
        isEstimatedOvulation,
      });
    }

    // Next month padding to fill grid
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateIso = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateIso,
        isPeriodDay: false,
        isPeriodStart: false,
        isEstimatedFertile: false,
        isEstimatedOvulation: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, initialDate, periodDuration, cycleLength, showEstimatedOverlay]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Month & Chevrons Navigation */}
      <View style={styles.headerRow}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>
        <View style={styles.chevronsRow}>
          <Pressable
            onPress={handlePrevMonth}
            style={({ pressed }) => [styles.chevronBtn, pressed && styles.chevronPressed]}
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={16} color="#073B72" />
          </Pressable>
          <Pressable
            onPress={handleNextMonth}
            style={({ pressed }) => [styles.chevronBtn, pressed && styles.chevronPressed]}
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={16} color="#073B72" />
          </Pressable>
        </View>
      </View>

      {/* Weekdays Row */}
      <View style={styles.weekdaysRow}>
        {WEEK_DAYS.map((wd, i) => (
          <Text key={`wd-${i}`} style={styles.weekdayText}>
            {wd}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.gridContainer}>
        {calendarDays.map((item, idx) => {
          return (
            <Pressable
              key={`day-${idx}-${item.dateIso}`}
              onPress={() => item.isCurrentMonth && onSelectStartDate(item.dateIso)}
              disabled={!item.isCurrentMonth}
              style={[
                styles.dayCell,
                item.isPeriodDay && styles.periodDayCell,
                item.isPeriodStart && styles.periodStartCell,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.dateIso}${item.isPeriodDay ? ', Period Day' : ''}`}
            >
              <Text
                style={[
                  styles.dayText,
                  !item.isCurrentMonth && styles.otherMonthDayText,
                  item.isPeriodDay && styles.periodDayText,
                ]}
              >
                {item.dayNumber}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Verified Data & Boundary Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: BioPulseColors.femaleAccent }]} />
            <Text style={styles.legendText}>Reported Period</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.fertileDot]} />
            <Text style={styles.legendMutedText}>Est. Fertile Window</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.ovulationDot]} />
            <Text style={styles.legendMutedText}>Est. Ovulation</Text>
          </View>
        </View>
        <Text style={styles.boundaryNotice}>
          *Ovulatory rhythm estimation requires multiple validated cycles. Tap any date to update period start.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F8DCE5',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  chevronsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F0',
  },
  chevronPressed: {
    backgroundColor: '#FCE7F0',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#8BA1B7',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  periodDayCell: {
    backgroundColor: '#FDF0F4',
    borderWidth: 1,
    borderColor: '#F8DCE5',
  },
  periodStartCell: {
    backgroundColor: BioPulseColors.femaleAccent,
    borderColor: BioPulseColors.femaleAccent,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  otherMonthDayText: {
    color: '#CBD5E1',
  },
  periodDayText: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '700',
  },
  legendContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8DCE5',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
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
  fertileDot: {
    backgroundColor: '#C084FC',
  },
  ovulationDot: {
    backgroundColor: '#7E22CE',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#073B72',
  },
  legendMutedText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#8BA1B7',
  },
  boundaryNotice: {
    fontSize: 10,
    color: '#8BA1B7',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
