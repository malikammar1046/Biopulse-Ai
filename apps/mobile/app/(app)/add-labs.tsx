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

interface LabField {
  key: string;
  name: string;
  unit: string;
  refRange: string;
  category: 'Hormones' | 'Metabolic' | 'Other';
}

export default function AddClinicalLabsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';

  const { verifiedLabs, confirmVerifiedLabs } = useHealthStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hormones: true,
    metabolic: true,
    other: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const femaleLabs: LabField[] = [
    { key: 'total_testosterone', name: 'Total Testosterone', unit: 'ng/dL', refRange: '15 - 70', category: 'Hormones' },
    { key: 'free_testosterone', name: 'Free Testosterone', unit: 'pg/mL', refRange: '0.6 - 3.8', category: 'Hormones' },
    { key: 'lh', name: 'Luteinizing Hormone (LH)', unit: 'mIU/mL', refRange: '2.4 - 12.6', category: 'Hormones' },
    { key: 'fsh', name: 'Follicle-Stimulating Hormone (FSH)', unit: 'mIU/mL', refRange: '3.5 - 12.5', category: 'Hormones' },
    { key: 'amh', name: 'Anti-Müllerian Hormone (AMH)', unit: 'ng/mL', refRange: '1.0 - 4.0', category: 'Hormones' },
    { key: 'fasting_glucose', name: 'Fasting Blood Glucose', unit: 'mg/dL', refRange: '70 - 99', category: 'Metabolic' },
    { key: 'fasting_insulin', name: 'Fasting Serum Insulin', unit: 'μIU/mL', refRange: '2.6 - 24.9', category: 'Metabolic' },
    { key: 'hba1c', name: 'Glycated Hemoglobin (HbA1c)', unit: '%', refRange: '< 5.7', category: 'Metabolic' },
    { key: 'tsh', name: 'Thyroid-Stimulating Hormone (TSH)', unit: 'μIU/mL', refRange: '0.4 - 4.0', category: 'Other' },
    { key: 'prolactin', name: 'Serum Prolactin', unit: 'ng/mL', refRange: '4.8 - 23.3', category: 'Other' },
  ];

  const maleLabs: LabField[] = [
    { key: 'total_testosterone', name: 'Total Testosterone (Morning 8 AM)', unit: 'ng/dL', refRange: '300 - 1,000', category: 'Hormones' },
    { key: 'free_testosterone', name: 'Free Testosterone', unit: 'pg/mL', refRange: '35 - 155', category: 'Hormones' },
    { key: 'shbg', name: 'Sex Hormone-Binding Globulin (SHBG)', unit: 'nmol/L', refRange: '10 - 57', category: 'Hormones' },
    { key: 'lh', name: 'Luteinizing Hormone (LH)', unit: 'mIU/mL', refRange: '1.7 - 8.6', category: 'Hormones' },
    { key: 'fasting_glucose', name: 'Fasting Blood Glucose', unit: 'mg/dL', refRange: '70 - 99', category: 'Metabolic' },
    { key: 'hba1c', name: 'Glycated Hemoglobin (HbA1c)', unit: '%', refRange: '< 5.7', category: 'Metabolic' },
    { key: 'tsh', name: 'Thyroid-Stimulating Hormone (TSH)', unit: 'μIU/mL', refRange: '0.4 - 4.0', category: 'Other' },
    { key: 'hematocrit', name: 'Hematocrit (CBC)', unit: '%', refRange: '41 - 50', category: 'Other' },
  ];

  const labs = isFemale ? femaleLabs : maleLabs;

  // Initialize input state with any existing verified labs
  const [labValues, setLabValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    verifiedLabs.forEach((v) => {
      const match = labs.find(
        (l) => l.name.toLowerCase().includes(v.testName.toLowerCase().slice(0, 4))
      );
      if (match) {
        initial[match.key] = v.value;
      }
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);

  const hormoneLabs = labs.filter((l) => l.category === 'Hormones');
  const metabolicLabs = labs.filter((l) => l.category === 'Metabolic');
  const otherLabs = labs.filter((l) => l.category === 'Other');

  const handleValueChange = (key: string, val: string) => {
    setLabValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveLabs = useCallback(() => {
    setSaving(true);

    // Convert values to store ClinicalLabRow items
    const rowsToCommit: ClinicalLabRow[] = [];
    labs.forEach((field, idx) => {
      const val = labValues[field.key];
      if (val && val.trim().length > 0) {
        const numVal = parseFloat(val);
        let status: 'Normal' | 'High' | 'Low' = 'Normal';
        if (field.key === 'total_testosterone') {
          if (isFemale && numVal > 70) status = 'High';
          if (!isFemale && numVal < 300) status = 'Low';
        } else if (field.key === 'hba1c' && numVal >= 5.7) {
          status = 'High';
        } else if (field.key === 'fasting_glucose' && numVal >= 100) {
          status = 'High';
        }

        rowsToCommit.push({
          id: `lab-${field.key}-${Date.now() + idx}`,
          testName: field.name,
          category: field.category,
          value: val.trim(),
          unit: field.unit,
          referenceRange: field.refRange,
          status,
        });
      }
    });

    if (rowsToCommit.length === 0) {
      setSaving(false);
      Alert.alert('No Values Entered', 'Please enter at least one clinical biomarker value before saving.');
      return;
    }

    confirmVerifiedLabs(rowsToCommit);

    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        'Biomarkers Saved',
        `Successfully logged ${rowsToCommit.length} clinical biomarker(s) to your longitudinal record. Tier 2 screening risk assessment is now active.`,
        [
          {
            text: 'View Tier Progress',
            onPress: () => router.push('/(app)/tier-progress'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 400);
  }, [labs, labValues, isFemale, confirmVerifiedLabs, router]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Add Clinical Labs</Text>
          <Text style={styles.headerSub}>Tier 2 Biomarker Entry</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Method Switcher Cards */}
      <View style={styles.switcherContainer}>
        <View style={[styles.methodCard, styles.methodCardActive, { borderColor: themeAccent }]}>
          <View style={[styles.methodIconBox, { backgroundColor: themeSoftBg }]}>
            <Ionicons name="create-outline" size={20} color={themeAccent} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={[styles.methodTitle, { color: themeAccent }]}>Enter Manually</Text>
            <Text style={styles.methodSub}>Type values from your lab test printout</Text>
          </View>
          <Ionicons name="radio-button-on" size={18} color={themeAccent} />
        </View>

        <Pressable
          onPress={() => router.push('/(app)/ocr-upload')}
          style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
        >
          <View style={[styles.methodIconBox, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="scan-outline" size={20} color={BioPulseColors.navy} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>Upload Report (OCR)</Text>
            <Text style={styles.methodSub}>Scan paper or PDF with AI document vision</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Hormones */}
        <View style={styles.sectionCard}>
          <Pressable
            onPress={() => toggleSection('hormones')}
            style={styles.sectionHeaderBtn}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionBadge, { backgroundColor: themeSoftBg }]}>
                <Ionicons name="pulse" size={16} color={themeAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Hormonal Panel</Text>
                <Text style={styles.sectionSub}>Targeted endocrine biomarkers for {isFemale ? 'PCOS' : 'Hypogonadism'}</Text>
              </View>
              <Ionicons
                name={expandedSections.hormones ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </View>
          </Pressable>

          {expandedSections.hormones && (
            <View style={styles.fieldsList}>
              {hormoneLabs.map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    <Text style={styles.fieldRef}>Ref: {field.refRange} {field.unit}</Text>
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={labValues[field.key] || ''}
                      onChangeText={(val) => handleValueChange(field.key, val)}
                      placeholder="0.0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      style={styles.inputField}
                    />
                    <Text style={styles.unitTag}>{field.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 2: Metabolic */}
        <View style={styles.sectionCard}>
          <Pressable
            onPress={() => toggleSection('metabolic')}
            style={styles.sectionHeaderBtn}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionBadge, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="nutrition" size={16} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Metabolic & Glycemic Markers</Text>
                <Text style={styles.sectionSub}>Evaluates insulin resistance and lipid homeostasis</Text>
              </View>
              <Ionicons
                name={expandedSections.metabolic ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </View>
          </Pressable>

          {expandedSections.metabolic && (
            <View style={styles.fieldsList}>
              {metabolicLabs.map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    <Text style={styles.fieldRef}>Ref: {field.refRange} {field.unit}</Text>
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={labValues[field.key] || ''}
                      onChangeText={(val) => handleValueChange(field.key, val)}
                      placeholder="0.0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      style={styles.inputField}
                    />
                    <Text style={styles.unitTag}>{field.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 3: Other Biomarkers */}
        <View style={styles.sectionCard}>
          <Pressable
            onPress={() => toggleSection('other')}
            style={styles.sectionHeaderBtn}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionBadge, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="medical" size={16} color="#0E9EAA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Differential Diagnostics</Text>
                <Text style={styles.sectionSub}>Rules out thyroid or secondary endocrinopathies</Text>
              </View>
              <Ionicons
                name={expandedSections.other ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </View>
          </Pressable>

          {expandedSections.other && (
            <View style={styles.fieldsList}>
              {otherLabs.map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    <Text style={styles.fieldRef}>Ref: {field.refRange} {field.unit}</Text>
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={labValues[field.key] || ''}
                      onChangeText={(val) => handleValueChange(field.key, val)}
                      placeholder="0.0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      style={styles.inputField}
                    />
                    <Text style={styles.unitTag}>{field.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Save Action */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleSaveLabs}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: themeAccent },
            pressed && styles.saveBtnPressed,
            saving && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving Lab Values...' : 'Save & Update Tier 2 Screening'}
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
  headerTextWrap: {
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
  switcherContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodCardActive: {
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  methodCardPressed: {
    backgroundColor: '#F8FAFC',
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  methodSub: {
    fontSize: 11,
    color: BioPulseColors.secondaryText,
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionHeaderBtn: {
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  sectionSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginTop: 1,
  },
  fieldsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  fieldInfo: {
    flex: 1,
    paddingRight: 12,
  },
  fieldName: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  fieldRef: {
    fontSize: 11,
    color: '#94A3B8',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    width: 120,
    height: 38,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    paddingVertical: 0,
  },
  unitTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 4,
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
