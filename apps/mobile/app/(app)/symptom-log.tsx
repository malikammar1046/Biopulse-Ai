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
  Modal,
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
  isCustom?: boolean;
}

/**
 * SCREEN 25: SYMPTOM LOG
 *
 * Strict visual match to Screenshot 25:
 * - Top Header: Back chevron (<), centered "Symptom Log"
 * - Title: "How are you feeling today?"
 * - Subtitle: "Select the symptoms you're experiencing." (with Cycle Day relationship badge where supported)
 * - 3x3 Grid of 9 Selectable Symptom Cards:
 *   - Acne, Hair growth, Hair loss, Bloating, Mood, Cramps, Fatigue, Skin darkening, Irregular periods
 *   - Plus dynamic support for custom symptoms
 *   - Selected cards styled in pink border, soft pink background (#FDF2F8), pink icon & text
 * - Intensity Section:
 *   - Subtitle: "How severe are these symptoms today?"
 *   - 3 segmented pill buttons: [ Mild ], [ Moderate ], [ Severe ]
 * - Additional Notes (Optional) input
 * - Bottom CTA: Solid pink "Save Check-in" button
 * - Persistent Backend Check-in History with Delete action
 * - Loading, Empty, Error, and Retry handling
 */
export default function SymptomLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    symptoms,
    symptomHistory,
    isLoadingSymptoms,
    symptomError,
    loadSymptoms,
    toggleSymptom,
    setSymptomIntensity,
    addCustomSymptom,
    saveSymptomCheckIn,
    deleteSymptomLog,
    cycle,
    isFemale,
  } = useHealthStore();

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return symptoms.symptoms.filter((s) => s.selected).map((s) => s.id);
  });

  const [intensity, setIntensity] = useState<'Mild' | 'Moderate' | 'Severe'>(
    (symptoms.intensity as any) || 'Moderate'
  );
  const [notes, setNotes] = useState(symptoms.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Custom symptom modal
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customSymptomInput, setCustomSymptomInput] = useState('');

  // Sync symptoms from persistent backend store on mount
  useEffect(() => {
    loadSymptoms();
  }, [loadSymptoms]);

  // Synchronize state when store data resolves
  useEffect(() => {
    const selectedFromStore = symptoms.symptoms.filter((s) => s.selected).map((s) => s.id);
    if (selectedFromStore.length > 0) {
      setSelectedIds(selectedFromStore);
    }
    if (symptoms.intensity) {
      setIntensity(symptoms.intensity as any);
    }
    if (symptoms.notes) {
      setNotes(symptoms.notes);
    }
  }, [symptoms.symptoms, symptoms.intensity, symptoms.notes]);

  const BASE_SYMPTOM_DEFS: SymptomItemDef[] = useMemo(() => [
    { id: 'acne', name: 'Acne', icon: 'sparkles-outline' },
    { id: 'hair_growth', name: 'Hair growth', icon: 'cut-outline' },
    { id: 'hair_loss', name: 'Hair loss', icon: 'fitness-outline' },
    { id: 'bloating', name: 'Bloating', icon: 'medical-outline' },
    { id: 'mood', name: 'Mood', icon: 'happy-outline' },
    { id: 'cramps', name: 'Cramps', icon: 'pulse-outline' },
    { id: 'fatigue', name: 'Fatigue', icon: 'battery-dead-outline' },
    { id: 'skin_darkening', name: 'Skin darkening', icon: 'color-palette-outline' },
    { id: 'irregular_periods', name: 'Irregular periods', icon: 'calendar-outline' },
  ], []);

  // Merge store's custom symptoms
  const allSymptomDefs = useMemo(() => {
    const baseMap = new Set(BASE_SYMPTOM_DEFS.map((b) => b.id));
    const extraCustom: SymptomItemDef[] = symptoms.symptoms
      .filter((s) => !baseMap.has(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        icon: 'medkit-outline' as const,
        isCustom: true,
      }));
    return [...BASE_SYMPTOM_DEFS, ...extraCustom];
  }, [BASE_SYMPTOM_DEFS, symptoms.symptoms]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    toggleSymptom(id);
  };

  const handleAddCustom = () => {
    if (!customSymptomInput.trim()) return;
    const cleanName = customSymptomInput.trim();
    addCustomSymptom(cleanName);
    const slug = cleanName.toLowerCase().replace(/\s+/g, '_');
    setSelectedIds((prev) => [...prev, slug]);
    setCustomSymptomInput('');
    setCustomModalVisible(false);
  };

  const handleSave = useCallback(async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one symptom to save your daily check-in.');
      return;
    }

    setIsSaving(true);
    setSymptomIntensity(intensity);

    const success = await saveSymptomCheckIn({
      notes,
      intensity,
      symptomIds: selectedIds,
      cycleDay: isFemale && cycle.currentCycleDay > 0 ? cycle.currentCycleDay : undefined,
    });

    setIsSaving(false);

    if (success) {
      setSaveSuccessMsg(`Successfully logged ${selectedIds.length} symptom(s) with ${intensity} intensity.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      Alert.alert(
        'Check-in Saved',
        `Recorded ${selectedIds.length} symptom(s) with ${intensity} intensity for today.${
          isFemale && cycle.currentCycleDay > 0 ? ` (Cycle Day: ${cycle.currentCycleDay})` : ''
        }`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Save Failed', symptomError || 'Failed to save symptom check-in to server. Please try again.');
    }
  }, [selectedIds, intensity, notes, setSymptomIntensity, saveSymptomCheckIn, isFemale, cycle.currentCycleDay, symptomError]);

  const handleDeleteHistoryItem = useCallback((recordId: string, symptomName: string) => {
    Alert.alert(
      'Delete Symptom Entry',
      `Are you sure you want to delete this recorded log for "${symptomName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteSymptomLog(recordId);
            if (!ok) {
              Alert.alert('Error', 'Could not delete symptom record from server.');
            }
          },
        },
      ]
    );
  }, [deleteSymptomLog]);

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

        <Pressable
          onPress={() => setCustomModalVisible(true)}
          style={styles.addCustomHeaderBtn}
          hitSlop={8}
          accessibilityLabel="Add custom symptom"
        >
          <Ionicons name="add-circle-outline" size={24} color="#F43F7D" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingSymptoms}
            onRefresh={loadSymptoms}
            tintColor="#F43F7D"
            colors={['#F43F7D']}
          />
        }
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* TITLE & SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>How are you feeling today?</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.screenSubtitle}>Select the symptoms you're experiencing.</Text>
              {isFemale && cycle.currentCycleDay > 0 && (
                <View style={styles.cycleDayBadge}>
                  <Ionicons name="sparkles" size={12} color="#F43F7D" style={{ marginRight: 4 }} />
                  <Text style={styles.cycleDayBadgeText}>Cycle Day {cycle.currentCycleDay}</Text>
                </View>
              )}
            </View>
          </View>

          {/* SAVE CONFIRMATION BANNER */}
          {saveSuccessMsg && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successBannerText}>{saveSuccessMsg}</Text>
            </View>
          )}

          {/* ERROR & RETRY BANNER */}
          {symptomError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.errorBannerText}>{symptomError}</Text>
              <Pressable onPress={() => loadSymptoms()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* LOADING INDICATOR */}
          {isLoadingSymptoms && symptomHistory.length === 0 && selectedIds.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F43F7D" />
              <Text style={styles.loadingText}>Syncing symptom records...</Text>
            </View>
          )}

          {/* 3x3 SYMPTOM CARDS GRID */}
          <View style={styles.gridContainer}>
            {allSymptomDefs.map((item) => {
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

          {/* ADD CUSTOM SYMPTOM BUTTON */}
          <Pressable
            onPress={() => setCustomModalVisible(true)}
            style={styles.addCustomPillBtn}
          >
            <Ionicons name="add" size={16} color="#F43F7D" />
            <Text style={styles.addCustomPillText}>Add Custom Symptom</Text>
          </Pressable>

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
              title={isSaving ? "Saving Check-in..." : "Save Check-in"}
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveBtn}
            />
          </View>

          {/* RECENT CHECK-IN HISTORY (PERSISTENT LOGS) */}
          <View style={styles.historySection}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyHeading}>Recent Check-in History</Text>
              {isLoadingSymptoms && <ActivityIndicator size="small" color="#F43F7D" />}
            </View>

            {symptomHistory.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <Ionicons name="document-text-outline" size={28} color="#94A3B8" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyHistoryText}>No symptoms recorded yet.</Text>
                <Text style={styles.emptyHistorySubText}>Your saved daily check-ins will appear here.</Text>
              </View>
            ) : (
              symptomHistory.slice(0, 10).map((record) => {
                const symptomTitle = record.symptomType
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const isRecent = record.occurredAt === new Date().toISOString().split('T')[0];

                return (
                  <View key={record.id} style={styles.historyCard}>
                    <View style={styles.historyCardLeft}>
                      <View style={styles.historyBadgeRow}>
                        <Text style={styles.historySymptomName}>{symptomTitle}</Text>
                        <View
                          style={[
                            styles.severityBadge,
                            record.severity === 'Severe'
                              ? styles.badgeSevere
                              : record.severity === 'Moderate'
                              ? styles.badgeModerate
                              : styles.badgeMild,
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityBadgeText,
                              record.severity === 'Severe'
                                ? styles.badgeTextSevere
                                : record.severity === 'Moderate'
                                ? styles.badgeTextModerate
                                : styles.badgeTextMild,
                            ]}
                          >
                            {record.severity}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.historyMetaRow}>
                        <Text style={styles.historyDateText}>
                          {isRecent ? 'Today' : record.occurredAt}
                        </Text>
                        {record.cycleDay && (
                          <Text style={styles.historyCycleDayText}>
                            • Cycle Day {record.cycleDay}
                          </Text>
                        )}
                        {record.notes ? (
                          <Text style={styles.historyNoteText} numberOfLines={1}>
                            • {record.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleDeleteHistoryItem(record.id, symptomTitle)}
                      style={styles.deleteHistoryBtn}
                      hitSlop={8}
                      accessibilityLabel="Delete symptom log"
                    >
                      <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* CUSTOM SYMPTOM MODAL */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Symptom</Text>
            <Text style={styles.modalSubtitle}>
              Enter a custom symptom you want to track in your daily health record.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Brain fog, Joint pain, Headaches"
              placeholderTextColor="#94A3B8"
              value={customSymptomInput}
              onChangeText={setCustomSymptomInput}
              autoFocus
            />

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => {
                  setCustomSymptomInput('');
                  setCustomModalVisible(false);
                }}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddCustom}
                style={[
                  styles.modalAddBtn,
                  !customSymptomInput.trim() && { opacity: 0.5 },
                ]}
                disabled={!customSymptomInput.trim()}
              >
                <Text style={styles.modalAddText}>Add & Select</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  addCustomHeaderBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#073B72',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  cycleDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  cycleDayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F43F7D',
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
    marginBottom: 14,
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
    marginBottom: 14,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
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
  addCustomPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 18,
    gap: 4,
  },
  addCustomPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F43F7D',
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
    marginBottom: 24,
  },
  saveBtn: {
    backgroundColor: '#F43F7D',
    height: 52,
    borderRadius: 14,
  },
  historySection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 18,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#073B72',
  },
  emptyHistoryBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  emptyHistorySubText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCardLeft: {
    flex: 1,
    marginRight: 10,
  },
  historyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  historySymptomName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeMild: {
    backgroundColor: '#EFF6FF',
  },
  badgeModerate: {
    backgroundColor: '#FEF3C7',
  },
  badgeSevere: {
    backgroundColor: '#FEE2E2',
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextMild: {
    color: '#0284C7',
  },
  badgeTextModerate: {
    color: '#D97706',
  },
  badgeTextSevere: {
    color: '#DC2626',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  historyDateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  historyCycleDayText: {
    fontSize: 12,
    color: '#F43F7D',
    fontWeight: '600',
  },
  historyNoteText: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  deleteHistoryBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalAddBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F43F7D',
  },
  modalAddText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
