import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { formatFrequencyLabel, MedicationFrequency } from '../../services/medicationService';

interface MedScheduleItem {
  id: string;
  name: string;
  dosage: string;
  dose?: string;
  unit?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string | null;
  instructions: string;
  notes?: string;
  scheduledTime: string;
  status: 'taken' | 'pending' | 'skipped' | 'snoozed';
  isDueNow?: boolean;
}

/**
 * SCREEN 30: MEDICATION SCREEN
 *
 * Strict visual match to Screenshot 30:
 * - Header: Back chevron (<), centered "Medications", right (+) icon
 * - Segmented Tabs: [ Today ] (active light-blue pill), [ Schedule ], [ History ]
 * - Date display: "Today, 14 Sep 2026"
 * - Primary Due Now Card:
 *   - Pink capsule icon box with angled pill icon
 *   - Middle: "Metformin 500 mg" & "Take 1 tablet with food"
 *   - Right: "Due now" rose badge above "8:00 PM" bold text
 *   - Action Buttons: [ ✓ Taken ] (solid green), [ ✕ Skip ], [ 🕒 Snooze ]
 * - Scheduled list items in individual clean cards:
 *   - [✓] Vitamin D3 1000 IU (1 tablet after breakfast, 9:00 AM)
 *   - [○] Omega-3 500 mg (1 capsule with lunch, 1:00 PM)
 *   - [○] Iron Supplement (1 tablet with food, 8:00 PM)
 * - Bottom CTA: Solid blue "+ Add Medication" button
 */
export default function MedicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const {
    medications,
    medicationHistory,
    isLoadingMedications,
    medicationError,
    loadMedications,
    markMedicationStatus,
    addMedication,
    deleteMedication,
  } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'history'>('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new medication
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedUnit, setNewMedUnit] = useState('mg');
  const [newMedFrequency, setNewMedFrequency] = useState<MedicationFrequency>('once_daily');
  const [newMedTime, setNewMedTime] = useState('08:00 PM');
  const [newMedStartDate, setNewMedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMedEndDate, setNewMedEndDate] = useState('');
  const [newMedInstruction, setNewMedInstruction] = useState('Take with food');

  // Real authenticated medication items from health store
  const items: MedScheduleItem[] = useMemo(() => {
    return medications.map((m, index) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      dose: m.dose,
      unit: m.unit,
      frequency: m.frequency,
      startDate: m.startDate,
      endDate: m.endDate,
      instructions: m.instructions || m.notes || 'Take as prescribed',
      notes: m.notes,
      scheduledTime: m.scheduledTime || '08:00 PM',
      status: m.status,
      isDueNow: index === 0 && m.status === 'pending',
    }));
  }, [medications]);

  // Primary due medication
  const dueNowItem = useMemo(() => {
    return items.find((m) => m.isDueNow) || (items.length > 0 ? items[0] : null);
  }, [items]);

  // Other medications
  const otherItems = useMemo(() => {
    return items.filter((m) => m.id !== dueNowItem?.id);
  }, [items, dueNowItem]);

  const handleAction = useCallback(
    async (id: string, newStatus: 'taken' | 'skipped' | 'snoozed') => {
      const actionName =
        newStatus === 'taken' ? 'Taken' : newStatus === 'skipped' ? 'Skipped' : 'Snoozed for 30 min';
      await markMedicationStatus(id, newStatus);
      Alert.alert('Medication Updated', `Marked dose as ${actionName}.`);
    },
    [markMedicationStatus]
  );

  const handleToggleCheck = useCallback(
    (id: string) => {
      const target = items.find((m) => m.id === id);
      if (target) {
        const nextStatus = target.status === 'taken' ? 'pending' : 'taken';
        markMedicationStatus(id, nextStatus);
      }
    },
    [items, markMedicationStatus]
  );

  const handleDeleteMedication = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Delete Medication',
        `Are you sure you want to delete "${name}" from your active schedule?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteMedication(id);
              if (success) {
                Alert.alert('Medication Deleted', `"${name}" removed from your schedule.`);
              } else {
                Alert.alert('Error', 'Unable to delete medication. Please try again.');
              }
            },
          },
        ]
      );
    },
    [deleteMedication]
  );

  const handleAddSubmit = useCallback(async () => {
    if (!newMedName.trim()) {
      Alert.alert('Missing Name', 'Please enter a medication name.');
      return;
    }
    const name = newMedName.trim();
    const doseVal = newMedDose.trim() || '1';
    const unitVal = newMedUnit.trim() || 'mg';
    const dosage = `${doseVal} ${unitVal}`.trim();
    const instructions = newMedInstruction.trim() || 'Take with food';
    const scheduledTime = newMedTime.trim() || '08:00 PM';
    const startDate = newMedStartDate.trim() || new Date().toISOString().split('T')[0];
    const endDate = newMedEndDate.trim() || null;

    setIsSubmitting(true);
    try {
      const success = await addMedication({
        name,
        dosage,
        dose: doseVal,
        unit: unitVal,
        frequency: newMedFrequency,
        scheduledTime,
        scheduledTimes: [scheduledTime],
        startDate,
        endDate,
        instructions,
        notes: instructions,
        status: 'pending',
        pathway: isFemale ? 'female' : 'male',
      });

      if (success) {
        setShowAddModal(false);
        setNewMedName('');
        setNewMedDose('');
        setNewMedEndDate('');
        Alert.alert('Medication Added', `"${name}" added to your schedule.`);
      } else {
        Alert.alert('Saved Locally', `"${name}" added to your schedule.`);
        setShowAddModal(false);
      }
    } catch {
      Alert.alert('Error', 'Could not save medication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    newMedName,
    newMedDose,
    newMedUnit,
    newMedFrequency,
    newMedInstruction,
    newMedTime,
    newMedStartDate,
    newMedEndDate,
    addMedication,
    isFemale,
  ]);

  const todayDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <Text style={styles.headerTitle}>Medications</Text>

        <Pressable
          onPress={() => setShowAddModal(true)}
          style={styles.headerBtn}
          accessibilityLabel="Add Medication"
          hitSlop={8}
        >
          <Ionicons name="add" size={24} color="#0F172A" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingMedications}
            onRefresh={() => loadMedications()}
            tintColor={isFemale ? '#F43F7D' : '#0284C7'}
          />
        }
      >
        {/* Initial Loading Indicator */}
        {isLoadingMedications && items.length === 0 && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={isFemale ? '#F43F7D' : '#0284C7'} />
            <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>Loading medications...</Text>
          </View>
        )}

        {/* Error Banner */}
        {medicationError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{medicationError}</Text>
            <Pressable onPress={() => loadMedications()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('today')}
            style={[styles.tabPill, activeTab === 'today' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
              Today
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('schedule')}
            style={[styles.tabPill, activeTab === 'schedule' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
              Schedule
            </Text>
          </Pressable>

          <View style={styles.tabDivider} />

          <Pressable
            onPress={() => setActiveTab('history')}
            style={[styles.tabPill, activeTab === 'history' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </Pressable>
        </View>

        {/* Clinical Disclaimer Notice */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={15} color="#0284C7" />
          <Text style={styles.disclaimerText}>
            BioPulse records user-provided medication info only. We do not prescribe or recommend medications.
          </Text>
        </View>

        {/* Loading Spinner */}
        {isLoadingMedications && items.length === 0 && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0284C7" />
            <Text style={{ marginTop: 8, fontSize: 13, color: '#64748B' }}>Loading medications...</Text>
          </View>
        )}

        {/* =================================================================== */}
        {/* TAB 1: TODAY VIEW */}
        {/* =================================================================== */}
        {activeTab === 'today' && (
          <>
            {/* Date Display */}
            <Text style={styles.dateText}>{todayDateFormatted}</Text>

            {/* Empty State when no medications */}
            {items.length === 0 && !isLoadingMedications && (
              <View style={styles.dueCard}>
                <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
                  <MaterialCommunityIcons name="pill" size={40} color="#94A3B8" />
                  <Text style={[styles.dueTitle, { marginTop: 12, textAlign: 'center' }]}>No medications scheduled</Text>
                  <Text style={[styles.dueSub, { textAlign: 'center', marginTop: 6 }]}>
                    Tap &apos;Add Medication&apos; or the &apos;+&apos; button above to record your prescriptions and supplements.
                  </Text>
                </View>
              </View>
            )}

            {/* Primary Due Now Card */}
            {dueNowItem && (
              <View style={styles.dueCard}>
                <View style={styles.dueTopRow}>
                  {/* Pink Capsule Icon Box */}
                  <View style={styles.dueIconBox}>
                    <MaterialCommunityIcons name="pill" size={24} color="#F43F7D" style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>

                  {/* Medication Title and Instructions */}
                  <View style={styles.dueMeta}>
                    <Text style={styles.dueTitle}>{dueNowItem.name}</Text>
                    <Text style={styles.dueSub}>
                      {dueNowItem.dosage ? `${dueNowItem.dosage} • ` : ''}{dueNowItem.instructions}
                    </Text>
                  </View>

                  {/* Due Now Badge and Scheduled Time */}
                  <View style={styles.dueRightCol}>
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>Due now</Text>
                    </View>
                    <Text style={styles.dueTime}>{dueNowItem.scheduledTime}</Text>
                  </View>
                </View>

                {/* Actions: Taken, Skip, Snooze */}
                <View style={styles.dueActionsRow}>
                  <Pressable
                    onPress={() => handleAction(dueNowItem.id, 'taken')}
                    style={({ pressed }) => [
                      styles.takenBtn,
                      dueNowItem.status === 'taken' && styles.takenBtnActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.takenBtnText}>Taken</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleAction(dueNowItem.id, 'skipped')}
                    style={({ pressed }) => [
                      styles.outlineBtn,
                      dueNowItem.status === 'skipped' && styles.outlineBtnActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Ionicons name="close" size={15} color="#475569" />
                    <Text style={styles.outlineBtnText}>Skip</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleAction(dueNowItem.id, 'snoozed')}
                    style={({ pressed }) => [
                      styles.outlineBtn,
                      dueNowItem.status === 'snoozed' && styles.outlineBtnActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Ionicons name="time-outline" size={15} color="#475569" />
                    <Text style={styles.outlineBtnText}>Snooze</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Other Medications List */}
            <View style={styles.listContainer}>
              {otherItems.map((med) => {
                const isTaken = med.status === 'taken';
                return (
                  <Pressable
                    key={med.id}
                    onPress={() => handleToggleCheck(med.id)}
                    style={({ pressed }) => [
                      styles.listItemCard,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.listLeft}>
                      {isTaken ? (
                        <View style={styles.checkCircleFilled}>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.checkCircleEmpty} />
                      )}

                      <View style={styles.listMeta}>
                        <Text style={styles.listName}>{med.name}</Text>
                        <Text style={styles.listSub}>
                          {med.dosage ? `${med.dosage} • ` : ''}{med.instructions}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.listRight}>
                      <Text style={styles.listTime}>{med.scheduledTime}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* =================================================================== */}
        {/* TAB 2: SCHEDULE VIEW */}
        {/* =================================================================== */}
        {activeTab === 'schedule' && (
          <View style={styles.listContainer}>
            {items.length === 0 && !isLoadingMedications && (
              <View style={styles.dueCard}>
                <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
                  <MaterialCommunityIcons name="calendar-clock" size={40} color="#94A3B8" />
                  <Text style={[styles.dueTitle, { marginTop: 12, textAlign: 'center' }]}>No active prescriptions</Text>
                  <Text style={[styles.dueSub, { textAlign: 'center', marginTop: 6 }]}>
                    Your scheduled medications, dosages, and recurring times will appear here.
                  </Text>
                </View>
              </View>
            )}

            {items.map((med) => (
              <View key={med.id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeaderRow}>
                  <View style={styles.scheduleIconBox}>
                    <MaterialCommunityIcons name="pill" size={20} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleName}>{med.name}</Text>
                    <Text style={styles.scheduleDosage}>{med.dosage || 'Standard Dose'}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteMedication(med.id, med.name)}
                    hitSlop={8}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>

                <View style={styles.scheduleDetailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Frequency:</Text>
                    <Text style={styles.detailValue}>{formatFrequencyLabel(med.frequency)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Scheduled Time:</Text>
                    <Text style={styles.detailValue}>{med.scheduledTime}</Text>
                  </View>

                  {med.startDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Start Date:</Text>
                      <Text style={styles.detailValue}>{med.startDate}</Text>
                    </View>
                  )}

                  {med.endDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>End Date:</Text>
                      <Text style={styles.detailValue}>{med.endDate}</Text>
                    </View>
                  )}

                  {med.instructions && (
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.detailLabel}>Notes:</Text>
                      <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{med.instructions}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* =================================================================== */}
        {/* TAB 3: HISTORY VIEW */}
        {/* =================================================================== */}
        {activeTab === 'history' && (
          <View style={styles.listContainer}>
            {medicationHistory.length === 0 ? (
              <View style={styles.dueCard}>
                <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
                  <MaterialCommunityIcons name="history" size={40} color="#94A3B8" />
                  <Text style={[styles.dueTitle, { marginTop: 12, textAlign: 'center' }]}>No dose history yet</Text>
                  <Text style={[styles.dueSub, { textAlign: 'center', marginTop: 6 }]}>
                    When you mark medications as taken or skipped, your adherence logs will appear here.
                  </Text>
                </View>
              </View>
            ) : (
              medicationHistory.map((log) => {
                const isTaken = log.status === 'taken';
                const isSkipped = log.status === 'skipped';
                return (
                  <View key={log.id} style={styles.historyCard}>
                    <View style={styles.historyLeft}>
                      <View style={[
                        styles.historyStatusBadge,
                        isTaken && styles.badgeTaken,
                        isSkipped && styles.badgeSkipped,
                      ]}>
                        <Ionicons
                          name={isTaken ? 'checkmark' : 'close'}
                          size={14}
                          color={isTaken ? '#10B981' : '#64748B'}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>{log.medicationName || 'Medication'}</Text>
                        <Text style={styles.historySub}>
                          {log.dosage ? `${log.dosage} • ` : ''}
                          {log.scheduledFor ? `Scheduled: ${log.scheduledFor} ${log.scheduledTime}` : log.scheduledTime}
                        </Text>
                        {log.notes ? (
                          <Text style={styles.historyNote}>{log.notes}</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.historyRight}>
                      <Text style={[
                        styles.historyStatusText,
                        isTaken && { color: '#10B981' },
                        isSkipped && { color: '#64748B' },
                      ]}>
                        {isTaken ? 'Taken' : isSkipped ? 'Skipped' : log.status}
                      </Text>
                      {log.takenAt ? (
                        <Text style={styles.historyTime}>
                          {new Date(log.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={({ pressed }) => [styles.addCtaBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addCtaText}>Add Medication</Text>
        </Pressable>
      </View>

      {/* Add Medication Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={BioPulseColors.navy} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={styles.inputLabel}>Medication Name *</Text>
              <TextInput
                style={styles.input}
                value={newMedName}
                onChangeText={setNewMedName}
                placeholder="e.g. Inositol, Metformin, Vitamin D"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.inputLabel}>Dose / Strength</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedDose}
                    onChangeText={setNewMedDose}
                    placeholder="e.g. 500"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ width: 10 }} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedUnit}
                    onChangeText={setNewMedUnit}
                    placeholder="mg / ml"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Frequency Selector */}
              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencyRow}>
                {(['once_daily', 'twice_daily', 'three_times_daily', 'as_needed'] as MedicationFrequency[]).map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => setNewMedFrequency(freq)}
                    style={[
                      styles.freqPill,
                      newMedFrequency === freq && styles.freqPillActive,
                    ]}
                  >
                    <Text style={[
                      styles.freqText,
                      newMedFrequency === freq && styles.freqTextActive,
                    ]}>
                      {formatFrequencyLabel(freq)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Scheduled Time</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedTime}
                    onChangeText={setNewMedTime}
                    placeholder="08:00 PM"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ width: 10 }} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedStartDate}
                    onChangeText={setNewMedStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>End Date (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newMedEndDate}
                onChangeText={setNewMedEndDate}
                placeholder="YYYY-MM-DD (Leave empty if ongoing)"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Notes & Instructions</Text>
              <TextInput
                style={styles.input}
                value={newMedInstruction}
                onChangeText={setNewMedInstruction}
                placeholder="e.g. Take with dinner after food"
                placeholderTextColor="#94A3B8"
              />

              <Pressable
                onPress={handleAddSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => [styles.modalSaveBtn, pressed && styles.btnPressed]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Medication</Text>
                )}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 15,
  },

  // Segmented Tabs
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 3,
    marginBottom: 10,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: '#BAE6FD',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  tabDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },

  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 14,
  },

  // Primary Due Now Card
  dueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 14,
  },
  dueTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dueIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dueMeta: {
    flex: 1,
    paddingTop: 1,
  },
  dueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  dueSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  dueRightCol: {
    alignItems: 'flex-end',
  },
  dueBadge: {
    backgroundColor: '#FFE4E6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  dueTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 5,
  },

  // Action Buttons
  dueActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  takenBtn: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  takenBtnActive: {
    backgroundColor: '#059669',
  },
  takenBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  outlineBtnActive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#94A3B8',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  // Other Medications List
  listContainer: {
    gap: 10,
  },
  listItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkCircleFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkCircleEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  listMeta: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  listSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  listTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Schedule View Cards
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  scheduleName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  scheduleDosage: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  scheduleDetailsGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },

  // History View Cards
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  historyStatusBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  badgeTaken: {
    backgroundColor: '#D1FAE5',
  },
  badgeSkipped: {
    backgroundColor: '#F1F5F9',
  },
  historyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  historySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  historyNote: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
    fontStyle: 'italic',
  },
  historyRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Bottom CTA Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  addCtaBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  freqPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  freqPillActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  freqText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  freqTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  modalSaveBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    opacity: 0.9,
  },
});
