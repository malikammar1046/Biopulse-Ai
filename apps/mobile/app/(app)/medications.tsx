import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
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

export default function MedicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';

  const { medications, markMedicationStatus, addMedication } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'adherence'>('today');
  const [showAddForm, setShowAddForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('8:00 AM');
  const [medInstruction, setMedInstruction] = useState('Take with meal');

  const takenCount = medications.filter((m) => m.status === 'taken').length;
  const adherencePercent = medications.length > 0 ? Math.round((takenCount / medications.length) * 100) : 100;

  const handleAddNewMedication = useCallback(() => {
    if (!medName.trim() || !medDosage.trim()) {
      Alert.alert('Required Fields', 'Please enter both the medication name and dosage.');
      return;
    }

    addMedication({
      name: medName.trim(),
      dosage: medDosage.trim(),
      scheduledTime: medTime,
      instructions: medInstruction,
      status: 'pending',
      pathway: isFemale ? 'female' : 'male',
    });

    setMedName('');
    setMedDosage('');
    setShowAddForm(false);
    Alert.alert('Prescription Saved', `"${medName.trim()}" added to your daily schedule.`);
  }, [medName, medDosage, medTime, medInstruction, isFemale, addMedication]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Medications & Protocol</Text>
          <Text style={styles.headerSub}>
            {isFemale ? 'Endocrine & Metabolic Pharmacotherapy' : 'Androgen Replacement & Micronutrients'}
          </Text>
        </View>
        <Pressable onPress={() => setShowAddForm(true)} style={styles.addNavBtn}>
          <Ionicons name="add" size={20} color={themeAccent} />
        </Pressable>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab('today')}
          style={[styles.tabBtn, activeTab === 'today' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'today' && { color: themeAccent, fontWeight: '700' }]}>
            Today's Doses
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('schedule')}
          style={[styles.tabBtn, activeTab === 'schedule' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'schedule' && { color: themeAccent, fontWeight: '700' }]}>
            Schedule
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('adherence')}
          style={[styles.tabBtn, activeTab === 'adherence' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'adherence' && { color: themeAccent, fontWeight: '700' }]}>
            Adherence
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Adherence Card */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceLeft}>
            <Text style={styles.adherenceTitle}>Today's Adherence</Text>
            <Text style={styles.adherenceSub}>
              {takenCount} of {medications.length} doses taken
            </Text>
          </View>
          <View style={[styles.adherencePill, { backgroundColor: themeSoftBg }]}>
            <Text style={[styles.adherencePercent, { color: themeAccent }]}>{adherencePercent}%</Text>
          </View>
        </View>

        {/* Add Form Modal/Card */}
        {showAddForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Add Medication or Supplement</Text>
              <Pressable onPress={() => setShowAddForm(false)}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <TextInput
              value={medName}
              onChangeText={setMedName}
              placeholder="Medication name (e.g. Inositol or Metformin)"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />

            <View style={styles.formRow}>
              <TextInput
                value={medDosage}
                onChangeText={setMedDosage}
                placeholder="Dosage (e.g. 500 mg)"
                placeholderTextColor="#94A3B8"
                style={[styles.textInput, { flex: 1 }]}
              />
              <TextInput
                value={medTime}
                onChangeText={setMedTime}
                placeholder="Time (e.g. 8:00 AM)"
                placeholderTextColor="#94A3B8"
                style={[styles.textInput, { flex: 1 }]}
              />
            </View>

            <TextInput
              value={medInstruction}
              onChangeText={setMedInstruction}
              placeholder="Instructions (e.g. Take with lunch)"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />

            <Pressable
              onPress={handleAddNewMedication}
              style={[styles.saveMedBtn, { backgroundColor: themeAccent }]}
            >
              <Text style={styles.saveMedBtnText}>Save to Daily Schedule</Text>
            </Pressable>
          </View>
        )}

        {/* Medication Cards List */}
        <View style={styles.medsList}>
          {medications.map((med) => {
            return (
              <View key={med.id} style={styles.medCard}>
                <View style={styles.medTopRow}>
                  <View style={styles.medInfo}>
                    <Text style={[styles.medName, med.status === 'taken' && styles.medNameTaken]}>
                      {med.name}
                    </Text>
                    <Text style={styles.medDosage}>{med.dosage} • {med.scheduledTime}</Text>
                    <Text style={styles.medInstruction}>{med.instructions}</Text>
                  </View>

                  <Pressable
                    onPress={() => markMedicationStatus(med.id, 'skipped')}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="close" size={16} color="#CBD5E1" />
                  </Pressable>
                </View>

                {/* Actions Row */}
                <View style={styles.medActionsRow}>
                  <Pressable
                    onPress={() => markMedicationStatus(med.id, med.status === 'taken' ? 'pending' : 'taken')}
                    style={[
                      styles.actionBtn,
                      med.status === 'taken' ? styles.actionBtnDone : styles.actionBtnPending,
                    ]}
                  >
                    <Ionicons
                      name={med.status === 'taken' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={16}
                      color={med.status === 'taken' ? '#FFFFFF' : '#10B981'}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        med.status === 'taken' ? { color: '#FFFFFF' } : { color: '#10B981' },
                      ]}
                    >
                      {med.status === 'taken' ? 'Taken' : 'Mark as Taken'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => markMedicationStatus(med.id, 'snoozed')}
                    style={styles.snoozeBtn}
                  >
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.snoozeBtnText}>Snooze 30m</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Protocol Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#0E9EAA" />
          <Text style={styles.disclaimerText}>
            Always review pharmacotherapy and supplement dosages with your prescribing physician. BioPulse provides medication adherence tracking and reminders.
          </Text>
        </View>
      </ScrollView>

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
  addNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: BioPulseColors.navy,
  },
  tabBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
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
  adherenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adherenceLeft: {
    flex: 1,
  },
  adherenceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  adherenceSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
  },
  adherencePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  adherencePercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: BioPulseColors.navy,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveMedBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveMedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  medsList: {
    gap: 12,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  medTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  medNameTaken: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  medDosage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
    marginBottom: 2,
  },
  medInstruction: {
    fontSize: 11,
    color: '#64748B',
  },
  deleteBtn: {
    padding: 4,
  },
  medActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnPending: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnDone: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  snoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  snoozeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  disclaimerCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#0F766E',
    lineHeight: 16,
    flex: 1,
  },
});
