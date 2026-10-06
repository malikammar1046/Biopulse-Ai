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
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function SymptomLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';

  const { symptoms, toggleSymptom, setSymptomIntensity, saveSymptomCheckIn } = useHealthStore();

  const [intensity, setIntensity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reportedSymptoms = symptoms.symptoms.filter((s) => s.selected);

  const handleSaveCheckIn = useCallback(() => {
    if (reportedSymptoms.length === 0) {
      Alert.alert('No Symptoms Selected', 'Please tap at least one symptom to record your daily check-in.');
      return;
    }

    setSaving(true);
    setSymptomIntensity(intensity);
    saveSymptomCheckIn(notes);

    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        'Check-in Saved',
        `Successfully logged ${reportedSymptoms.length} symptom(s) with ${intensity} baseline intensity to your longitudinal trend.`,
        [
          {
            text: 'View Trends',
            onPress: () => router.push('/(app)/progress'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 400);
  }, [reportedSymptoms.length, intensity, notes, setSymptomIntensity, saveSymptomCheckIn, router]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Daily Symptom Check-in</Text>
          <Text style={styles.headerSub}>
            {isFemale ? 'PCOS Endocrine Pattern' : 'ADAM Androgen Vitality'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Banner */}
        <View style={[styles.introBanner, { backgroundColor: themeSoftBg }]}>
          <Ionicons name="pulse" size={20} color={themeAccent} />
          <Text style={[styles.introText, { color: BioPulseColors.navy }]}>
            {isFemale
              ? 'Select today’s symptoms to map cyclical hormonal fluctuations against your menstrual phases.'
              : 'Select today’s symptoms to assess androgen deficiency progression and response to intervention.'}
          </Text>
        </View>

        {/* Symptoms Grid */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Reported Today ({reportedSymptoms.length})</Text>
            <Text style={styles.cardSub}>Tap to toggle</Text>
          </View>

          <View style={styles.symptomsGrid}>
            {symptoms.symptoms.map((sym) => {
              const isSelected = sym.selected;
              return (
                <Pressable
                  key={sym.id}
                  onPress={() => toggleSymptom(sym.id)}
                  style={[
                    styles.symptomChip,
                    isSelected && {
                      borderColor: themeAccent,
                      backgroundColor: themeSoftBg,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.chipCheckbox,
                      isSelected && { backgroundColor: themeAccent, borderColor: themeAccent },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  </View>
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && { color: themeAccent, fontWeight: '700' },
                    ]}
                  >
                    {sym.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Intensity Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overall Symptom Intensity</Text>
          <View style={styles.intensityRow}>
            {(['Mild', 'Moderate', 'Severe'] as const).map((lvl) => {
              const isChosen = intensity === lvl;
              return (
                <Pressable
                  key={lvl}
                  onPress={() => {
                    setIntensity(lvl);
                    setSymptomIntensity(lvl);
                  }}
                  style={[
                    styles.intensityBtn,
                    isChosen && { borderColor: themeAccent, backgroundColor: themeSoftBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      isChosen && { color: themeAccent, fontWeight: '800' },
                    ]}
                  >
                    {lvl.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Optional Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Notes & Triggers (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Higher stress today, slept 6 hours, post-dinner fatigue..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleSaveCheckIn}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: themeAccent },
            pressed && styles.saveBtnPressed,
            saving && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving Check-in...' : 'Save Today’s Check-in'}
          </Text>
        </Pressable>
      </View>

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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  introBanner: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  introText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
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
    marginBottom: 10,
  },
  cardSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    width: '48%',
  },
  chipCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 12,
    color: BioPulseColors.navy,
    fontWeight: '600',
    flex: 1,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 13,
    color: BioPulseColors.navy,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  bottomBar: {
    position: 'absolute',
    bottom: BOTTOM_NAV_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
