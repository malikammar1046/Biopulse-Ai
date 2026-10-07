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

interface MedScheduleItem {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
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

  const { medications, markMedicationStatus, addMedication } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'history'>('today');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new medication
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('8:00 PM');
  const [newMedInstruction, setNewMedInstruction] = useState('Take with food');

  // Real authenticated medication items from health store
  const items: MedScheduleItem[] = useMemo(() => {
    return medications.map((m, index) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      instructions: m.instructions || 'Take as prescribed',
      scheduledTime: m.scheduledTime || '8:00 PM',
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
    (id: string, newStatus: 'taken' | 'skipped' | 'snoozed') => {
      markMedicationStatus(id, newStatus);
      const actionName =
        newStatus === 'taken' ? 'Taken' : newStatus === 'skipped' ? 'Skipped' : 'Snoozed for 30 min';
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

  const handleAddSubmit = useCallback(() => {
    if (!newMedName.trim()) {
      Alert.alert('Missing Name', 'Please enter a medication name.');
      return;
    }
    const name = newMedName.trim();
    const dosage = newMedDosage.trim() || 'Standard Dose';
    const instructions = newMedInstruction.trim() || 'Take with food';
    const scheduledTime = newMedTime.trim() || '8:00 PM';

    addMedication({
      name,
      dosage,
      scheduledTime,
      instructions,
      status: 'pending',
      pathway: isFemale ? 'female' : 'male',
    });
    setShowAddModal(false);
    setNewMedName('');
    setNewMedDosage('');
    Alert.alert('Medication Added', `"${name}" added to your daily schedule.`);
  }, [newMedName, newMedDosage, newMedInstruction, newMedTime, addMedication, isFemale]);


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
      >
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

        {/* Date Display */}
        <Text style={styles.dateText}>Today, 14 Sep 2026</Text>

        {/* Empty State when no medications */}
        {items.length === 0 && (
          <View style={styles.dueCard}>
            <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
              <MaterialCommunityIcons name="pill" size={40} color="#94A3B8" />
              <Text style={[styles.dueTitle, { marginTop: 12, textAlign: 'center' }]}>No medications scheduled</Text>
              <Text style={[styles.dueSub, { textAlign: 'center', marginTop: 6 }]}>
                Tap &apos;Add Medication&apos; or the &apos;+&apos; button above to track your prescriptions and supplements.
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
                <Text style={styles.dueSub}>{dueNowItem.instructions}</Text>
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
                    <Text style={styles.listSub}>{med.instructions}</Text>
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

            <Text style={styles.inputLabel}>Medication Name & Strength</Text>
            <TextInput
              style={styles.input}
              value={newMedName}
              onChangeText={setNewMedName}
              placeholder="e.g. Inositol 2000 mg"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  value={newMedDosage}
                  onChangeText={setNewMedDosage}
                  placeholder="e.g. 1 tablet"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.input}
                  value={newMedTime}
                  onChangeText={setNewMedTime}
                  placeholder="8:00 PM"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Instructions</Text>
            <TextInput
              style={styles.input}
              value={newMedInstruction}
              onChangeText={setNewMedInstruction}
              placeholder="e.g. Take with dinner"
              placeholderTextColor="#94A3B8"
            />

            <Pressable
              onPress={handleAddSubmit}
              style={({ pressed }) => [styles.modalSaveBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.modalSaveText}>Save Medication</Text>
            </Pressable>
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

  // Segmented Tabs
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 3,
    marginBottom: 14,
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
    marginBottom: 16,
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
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
  },
  modalSaveBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
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
