import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface DatePickerModalProps {
  visible: boolean;
  initialDateIso: string; // 'YYYY-MM-DD'
  onClose: () => void;
  onConfirm: (dateIso: string) => void;
  title?: string;
  minAge?: number; // e.g. 12
  maxAge?: number; // e.g. 65
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  initialDateIso,
  onClose,
  onConfirm,
  title = 'Select Date of Birth',
  minAge = 12,
  maxAge = 65,
}) => {
  const { width } = useWindowDimensions();
  const currentYear = new Date().getFullYear();

  // Parse initial date
  const parsed = useMemo(() => {
    const parts = initialDateIso ? initialDateIso.split('-').map(Number) : [];
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return { year: 2002, month: 3, day: 15 };
  }, [initialDateIso]);

  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(parsed.month); // 1-12
  const [selectedDay, setSelectedDay] = useState<number>(parsed.day); // 1-31

  // Compute days in the selected month/year
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Generate selectable years: from (currentYear - minAge) down to (currentYear - maxAge)
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear - minAge; y >= currentYear - maxAge; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear, minAge, maxAge]);

  const handleConfirm = () => {
    const validDay = Math.min(selectedDay, daysInMonth);
    const dateIso = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
    onConfirm(dateIso);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Ionicons name="calendar-outline" size={20} color={BioPulseColors.femaleAccent} />
              <Text style={styles.titleText}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close date picker">
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Date Selector Columns (Day, Month, Year) */}
          <View style={styles.selectorColumnsRow}>
            {/* 1. Day Column */}
            <View style={styles.columnWrap}>
              <Text style={styles.columnLabel}>Day</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isSelected = d === selectedDay;
                  return (
                    <Pressable
                      key={`day-${d}`}
                      onPress={() => setSelectedDay(d)}
                      style={[styles.itemPill, isSelected && styles.itemPillSelected]}
                    >
                      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Month Column */}
            <View style={styles.columnWrap}>
              <Text style={styles.columnLabel}>Month</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, idx) => {
                  const mNum = idx + 1;
                  const isSelected = mNum === selectedMonth;
                  return (
                    <Pressable
                      key={`mon-${m}`}
                      onPress={() => setSelectedMonth(mNum)}
                      style={[styles.itemPill, isSelected && styles.itemPillSelected]}
                    >
                      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                        {m}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Year Column */}
            <View style={styles.columnWrap}>
              <Text style={styles.columnLabel}>Year</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {years.map((y) => {
                  const isSelected = y === selectedYear;
                  return (
                    <Pressable
                      key={`yr-${y}`}
                      onPress={() => setSelectedYear(y)}
                      style={[styles.itemPill, isSelected && styles.itemPillSelected]}
                    >
                      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                        {y}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 59, 114, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8DCE5',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  closeBtn: {
    padding: 4,
  },
  selectorColumnsRow: {
    flexDirection: 'row',
    gap: 10,
    height: 180,
    marginBottom: 18,
  },
  columnWrap: {
    flex: 1,
    backgroundColor: '#FAFCFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  scrollList: {
    width: '100%',
  },
  itemPill: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  itemPillSelected: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: BioPulseColors.femaleAccent,
  },
  itemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  itemTextSelected: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: BioPulseColors.femaleAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
