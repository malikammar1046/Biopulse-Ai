import React, { useState, useCallback } from 'react';
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

interface SymptomItemDef {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * SCREEN 25: SYMPTOM LOG
 *
 * Strict visual match to Screenshot 25:
 * - Top Header: Back chevron (<), centered "Symptom Log"
 * - Title: "How are you feeling today?"
 * - Subtitle: "Select the symptoms you're experiencing."
 * - 3x3 Grid of 9 Selectable Symptom Cards:
 *   - Acne, Hair growth, Hair loss, Bloating, Mood, Cramps, Fatigue, Skin darkening, Irregular periods
 *   - Selected cards styled in pink border, soft pink background (#FDF2F8), pink icon & text
 * - Intensity Section:
 *   - Subtitle: "How severe are these symptoms today?"
 *   - 3 segmented pill buttons: [ Mild ], [ Moderate ] (selected), [ Severe ]
 * - Additional Notes (Optional) input
 * - Bottom CTA: Solid pink "Save Check-in" button
 */
export default function SymptomLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { symptoms, toggleSymptom, setSymptomIntensity, saveSymptomCheckIn } = useHealthStore();

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const init = symptoms.symptoms.filter((s) => s.selected).map((s) => s.id);
    return init.length > 0 ? init : ['acne', 'mood', 'fatigue'];
  });

  const [intensity, setIntensity] = useState<'Mild' | 'Moderate' | 'Severe'>(
    (symptoms.intensity as any) || 'Moderate'
  );
  const [notes, setNotes] = useState(symptoms.notes || '');

  const SYMPTOM_DEFS: SymptomItemDef[] = [
    { id: 'acne', name: 'Acne', icon: 'sparkles-outline' },
    { id: 'hair_growth', name: 'Hair growth', icon: 'cut-outline' },
    { id: 'hair_loss', name: 'Hair loss', icon: 'fitness-outline' },
    { id: 'bloating', name: 'Bloating', icon: 'medical-outline' },
    { id: 'mood', name: 'Mood', icon: 'happy-outline' },
    { id: 'cramps', name: 'Cramps', icon: 'pulse-outline' },
    { id: 'fatigue', name: 'Fatigue', icon: 'battery-dead-outline' },
    { id: 'skin_darkening', name: 'Skin darkening', icon: 'color-palette-outline' },
    { id: 'irregular_periods', name: 'Irregular periods', icon: 'calendar-outline' },
  ];

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    toggleSymptom(id);
  };

  const handleSave = useCallback(() => {
    setSymptomIntensity(intensity);
    saveSymptomCheckIn(notes);
    Alert.alert(
      'Check-in Saved',
      `Recorded ${selectedIds.length} symptom(s) with ${intensity} intensity for today.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }, [intensity, notes, selectedIds.length, setSymptomIntensity, saveSymptomCheckIn, router]);

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

        <Text style={styles.headerTitle}>Symptom Log</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* TITLE & SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>How are you feeling today?</Text>
            <Text style={styles.screenSubtitle}>Select the symptoms you're experiencing.</Text>
          </View>

          {/* 3x3 SYMPTOM CARDS GRID */}
          <View style={styles.gridContainer}>
            {SYMPTOM_DEFS.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleToggle(item.id)}
                  style={[
                    styles.symptomCard,
                    isSelected && styles.symptomCardSelected,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={item.name}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected && styles.iconCircleSelected,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isSelected ? '#F43F7D' : '#64748B'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.symptomName,
                      isSelected && styles.symptomNameSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* INTENSITY SECTION */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Intensity</Text>
            <Text style={styles.sectionSub}>How severe are these symptoms today?</Text>
            <View style={styles.intensityRow}>
              {(['Mild', 'Moderate', 'Severe'] as const).map((lvl) => {
                const isSelected = intensity === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => setIntensity(lvl)}
                    style={[
                      styles.intensityChip,
                      isSelected && styles.intensityChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.intensityChipText,
                        isSelected && styles.intensityChipTextSelected,
                      ]}
                    >
                      {lvl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ADDITIONAL NOTES (OPTIONAL) */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Additional Notes (Optional)</Text>
            <View style={styles.notesBox}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any additional notes about your symptoms today..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Primary CTA */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Save Check-in"
              onPress={handleSave}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 460,
  },
  tabletWrapper: {
    maxWidth: 580,
  },
  titleSection: {
    marginBottom: 18,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#073B72',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  symptomCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  symptomCardSelected: {
    borderColor: '#F43F7D',
    backgroundColor: '#FDF2F8',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconCircleSelected: {
    backgroundColor: '#FCE7F3',
  },
  symptomName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  symptomNameSelected: {
    color: '#F43F7D',
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityChipSelected: {
    borderColor: '#F43F7D',
    backgroundColor: '#FDF2F8',
  },
  intensityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  intensityChipTextSelected: {
    color: '#F43F7D',
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notesInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  ctaWrapper: {
    marginTop: 6,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#F43F7D',
    height: 52,
    borderRadius: 14,
  },
});
