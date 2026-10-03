import React, { useState, useCallback, useMemo } from 'react';
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
import { useHealthStore, ClinicalLabRow } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

interface ExtractedLabItem {
  id: string;
  name: string;
  category: 'Hormones' | 'Metabolic' | 'Other';
  value: string;
  unit: string;
  refRange: string;
  confidence: number;
}

export default function OcrVerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const { confirmVerifiedLabs } = useHealthStore();

  const femaleExtracted: ExtractedLabItem[] = [
    { id: '1', name: 'Total Testosterone', category: 'Hormones', value: '64.2', unit: 'ng/dL', refRange: '15 - 70', confidence: 98 },
    { id: '2', name: 'LH (Luteinizing Hormone)', category: 'Hormones', value: '14.8', unit: 'mIU/mL', refRange: '2.4 - 12.6', confidence: 96 },
    { id: '3', name: 'FSH (Follicle Stimulating)', category: 'Hormones', value: '5.2', unit: 'mIU/mL', refRange: '3.5 - 12.5', confidence: 95 },
    { id: '4', name: 'Fasting Blood Glucose', category: 'Metabolic', value: '102.0', unit: 'mg/dL', refRange: '70 - 99', confidence: 99 },
    { id: '5', name: 'HbA1c', category: 'Metabolic', value: '5.8', unit: '%', refRange: '< 5.7', confidence: 94 },
    { id: '6', name: 'TSH (Thyroid Stimulating)', category: 'Other', value: '2.3', unit: 'μIU/mL', refRange: '0.4 - 4.0', confidence: 97 },
  ];

  const maleExtracted: ExtractedLabItem[] = [
    { id: '1', name: 'Total Testosterone (8 AM)', category: 'Hormones', value: '265.0', unit: 'ng/dL', refRange: '300 - 1,000', confidence: 99 },
    { id: '2', name: 'Free Testosterone', category: 'Hormones', value: '42.5', unit: 'pg/mL', refRange: '35 - 155', confidence: 97 },
    { id: '3', name: 'SHBG', category: 'Hormones', value: '38.2', unit: 'nmol/L', refRange: '10 - 57', confidence: 94 },
    { id: '4', name: 'LH (Luteinizing Hormone)', category: 'Hormones', value: '3.1', unit: 'mIU/mL', refRange: '1.7 - 8.6', confidence: 96 },
    { id: '5', name: 'Fasting Blood Glucose', category: 'Metabolic', value: '98.0', unit: 'mg/dL', refRange: '70 - 99', confidence: 98 },
    { id: '6', name: 'HbA1c', category: 'Metabolic', value: '5.4', unit: '%', refRange: '< 5.7', confidence: 95 },
  ];

  const initialItems = isFemale ? femaleExtracted : maleExtracted;
  const [items, setItems] = useState<ExtractedLabItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUpdateValue = (id: string, newVal: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value: newVal } : item))
    );
  };

  const calculateStatus = (item: ExtractedLabItem): 'Normal' | 'High' | 'Low' => {
    const num = parseFloat(item.value);
    if (isNaN(num)) return 'Normal';

    if (item.name.includes('Testosterone') && !item.name.includes('Free')) {
      if (isFemale && num > 70) return 'High';
      if (!isFemale && num < 300) return 'Low';
    }
    if (item.name.includes('LH') && num > 12.6) return 'High';
    if (item.name.includes('Glucose') && num >= 100) return 'High';
    if (item.name.includes('HbA1c') && num >= 5.7) return 'High';
    return 'Normal';
  };

  const handleConfirmValues = useCallback(() => {
    setSaving(true);

    const mappedRows: ClinicalLabRow[] = items.map((it) => ({
      id: `verified-ocr-${it.id}-${Date.now()}`,
      testName: it.name,
      category: it.category,
      value: it.value,
      unit: it.unit,
      referenceRange: it.refRange,
      status: calculateStatus(it),
    }));

    confirmVerifiedLabs(mappedRows);

    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        'Biomarkers Confirmed',
        'Verified clinical lab values have been saved to your longitudinal record. Tier 2 screening assessment is now updated.',
        [
          {
            text: 'View Tier Progress',
            onPress: () => router.push('/(app)/tier-progress'),
          },
          {
            text: 'View Screening',
            onPress: () => router.push('/(app)/screening'),
          },
        ]
      );
    }, 400);
  }, [items, isFemale, confirmVerifiedLabs, router]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Verify Extracted Labs</Text>
          <Text style={styles.headerSub}>AI OCR Review & Correction</Text>
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
        {/* Warning / Confirmation Banner */}
        <View style={styles.reviewBanner}>
          <Ionicons name="alert-circle" size={22} color="#D97706" />
          <View style={styles.reviewBannerText}>
            <Text style={styles.reviewTitle}>Not saved yet — review and confirm</Text>
            <Text style={styles.reviewSub}>
              BioPulse extracted these values from your document. Please verify each line against your physical lab report before saving.
            </Text>
          </View>
        </View>

        {/* Extracted Tests List */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Detected Biomarkers ({items.length})</Text>
            <Text style={styles.cardSubCount}>Tap any value to edit</Text>
          </View>

          <View style={styles.testsList}>
            {items.map((test) => {
              const isEditing = editingId === test.id;
              const status = calculateStatus(test);

              return (
                <View key={test.id} style={styles.testItem}>
                  <View style={styles.testTopRow}>
                    <View style={styles.testNameCol}>
                      <Text style={styles.testName}>{test.name}</Text>
                      <Text style={styles.testRef}>Ref: {test.refRange} {test.unit}</Text>
                    </View>

                    <View style={styles.badgesRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          status === 'High' && styles.statusBadgeHigh,
                          status === 'Low' && styles.statusBadgeLow,
                          status === 'Normal' && styles.statusBadgeNormal,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            status === 'High' && styles.statusTextHigh,
                            status === 'Low' && styles.statusTextLow,
                            status === 'Normal' && styles.statusTextNormal,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>

                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>{test.confidence}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* Value Row */}
                  <View style={styles.valueRow}>
                    <View
                      style={[
                        styles.inputContainer,
                        isEditing && { borderColor: themeAccent },
                      ]}
                    >
                      <TextInput
                        value={test.value}
                        onChangeText={(val) => handleUpdateValue(test.id, val)}
                        keyboardType="decimal-pad"
                        style={styles.textInput}
                        onFocus={() => setEditingId(test.id)}
                        onBlur={() => setEditingId(null)}
                      />
                      <Text style={styles.unitText}>{test.unit}</Text>
                    </View>

                    <Pressable
                      onPress={() => setEditingId(isEditing ? null : test.id)}
                      style={[styles.editBtn, isEditing && { backgroundColor: '#F1F5F9' }]}
                    >
                      <Ionicons
                        name={isEditing ? 'checkmark' : 'pencil'}
                        size={14}
                        color={themeAccent}
                      />
                      <Text style={[styles.editBtnText, { color: themeAccent }]}>
                        {isEditing ? 'Done' : 'Edit'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Confirm Button */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleConfirmValues}
          disabled={saving}
          style={({ pressed }) => [
            styles.confirmBtn,
            { backgroundColor: themeAccent },
            pressed && styles.confirmBtnPressed,
            saving && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>
            {saving ? 'Saving...' : 'Confirm & Commit to Health Record'}
          </Text>
        </Pressable>
      </View>

      {/* Permanent Fixed Bottom Nav */}
      <BioPulseBottomNav activeTab="screening" />
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
    paddingTop: 14,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  reviewBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  reviewBannerText: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 3,
  },
  reviewSub: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  cardSubCount: {
    fontSize: 12,
    color: '#64748B',
  },
  testsList: {
    gap: 12,
  },
  testItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  testTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  testNameCol: {
    flex: 1,
    paddingRight: 8,
  },
  testName: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  testRef: {
    fontSize: 11,
    color: '#64748B',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeNormal: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeHigh: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeLow: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextNormal: {
    color: '#15803D',
  },
  statusTextHigh: {
    color: '#B91C1C',
  },
  statusTextLow: {
    color: '#B45309',
  },
  confidenceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    paddingVertical: 0,
  },
  unitText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 6,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  confirmBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnPressed: {
    opacity: 0.85,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
