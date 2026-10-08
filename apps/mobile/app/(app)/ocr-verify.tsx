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
import { useAuth } from '../../features/authentication';
import { useHealthStore, ClinicalLabRow } from '../../store';

interface ExtractedLabField {
  id: string;
  name: string;
  value: string;
  unit: string;
  refRange: string;
}

/**
 * SCREEN 22: OCR VERIFICATION
 *
 * Strict visual match to Screenshot 22:
 * - Top Header: Back chevron (<), centered "Verify Extracted Values"
 * - Subtitle: "Please review the extracted values and make any corrections before saving. Values are not saved until you confirm."
 * - Warning Info Box: Pink info icon, "Review all values carefully. You can edit any field if needed."
 * - Expanded Section: "Hormone Tests" with chevron ^
 *   - FSH: 6.2 mIU/mL (3.5 – 12.5) with pencil icon
 *   - LH: 8.1 mIU/mL (2.4 – 12.6) with pencil icon
 *   - AMH: 4.3 ng/mL (1.0 – 10.0) with pencil icon
 *   - Prolactin: 18.5 ng/mL (4.8 – 23.3) with pencil icon
 *   - TSH: 2.1 μIU/mL (0.4 – 4.0) with pencil icon
 *   - Progesterone: 0.6 ng/mL (0.2 – 1.4) with pencil icon
 * - Collapsed Accordion Sections:
 *   - Metabolic Tests v
 *   - Nutritional Tests v
 *   - CBC v
 * - Bottom CTA: Solid pink "Confirm & Save" button
 */
export default function OcrVerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? '#F43F7D' : '#0284C7';

  const { pendingOcrReport, confirmVerifiedLabs } = useHealthStore();

  // Populate from pending report if available, else standard baseline defaults
  const [hormoneValues, setHormoneValues] = useState<ExtractedLabField[]>(() => {
    const defaults = [
      { id: 'fsh', name: 'FSH', value: '6.2', unit: 'mIU/mL', refRange: '3.5 – 12.5' },
      { id: 'lh', name: 'LH', value: '8.1', unit: 'mIU/mL', refRange: '2.4 – 12.6' },
      { id: 'amh', name: 'AMH', value: '4.3', unit: 'ng/mL', refRange: '1.0 – 10.0' },
      { id: 'prolactin', name: 'Prolactin', value: '18.5', unit: 'ng/mL', refRange: '4.8 – 23.3' },
      { id: 'tsh', name: 'TSH', value: '2.1', unit: 'μIU/mL', refRange: '0.4 – 4.0' },
      { id: 'progesterone', name: 'Progesterone', value: '0.6', unit: 'ng/mL', refRange: '0.2 – 1.4' },
    ];

    if (!pendingOcrReport?.results) return defaults;

    const matched = pendingOcrReport.results.filter(
      (r) => r.category === 'Hormones' || (!r.category && defaults.some((d) => r.testName.toLowerCase().includes(d.id)))
    );

    if (matched.length === 0) return defaults;

    return matched.map((m, idx) => ({
      id: m.id || `h_${idx}`,
      name: m.testName,
      value: m.value,
      unit: m.unit || 'mIU/mL',
      refRange: m.referenceRange || 'Reference Lab Norm',
    }));
  });

  const [metabolicValues, setMetabolicValues] = useState<ExtractedLabField[]>(() => {
    const defaults = [
      { id: 'glucose', name: 'Fasting Blood Glucose', value: '92.0', unit: 'mg/dL', refRange: '70 – 99' },
      { id: 'hba1c', name: 'HbA1c', value: '5.3', unit: '%', refRange: '< 5.7' },
      { id: 'cholesterol', name: 'Total Cholesterol', value: '178.0', unit: 'mg/dL', refRange: '< 200' },
      { id: 'triglycerides', name: 'Triglycerides', value: '135.0', unit: 'mg/dL', refRange: '< 150' },
    ];

    if (!pendingOcrReport?.results) return defaults;

    const matched = pendingOcrReport.results.filter((r) => r.category === 'Metabolic');
    if (matched.length === 0) return defaults;

    return matched.map((m, idx) => ({
      id: m.id || `m_${idx}`,
      name: m.testName,
      value: m.value,
      unit: m.unit || 'mg/dL',
      refRange: m.referenceRange || 'Reference Lab Norm',
    }));
  });

  const [nutritionalValues, setNutritionalValues] = useState<ExtractedLabField[]>(() => {
    const defaults = [
      { id: 'vit_d', name: 'Vitamin D3 (25-OH)', value: '28.4', unit: 'ng/mL', refRange: '30 – 100' },
      { id: 'ferritin', name: 'Serum Ferritin', value: '45.0', unit: 'ng/mL', refRange: '13 – 150' },
    ];

    if (!pendingOcrReport?.results) return defaults;

    const matched = pendingOcrReport.results.filter((r) => r.category === 'Nutritional');
    if (matched.length === 0) return defaults;

    return matched.map((m, idx) => ({
      id: m.id || `n_${idx}`,
      name: m.testName,
      value: m.value,
      unit: m.unit || 'ng/mL',
      refRange: m.referenceRange || 'Reference Lab Norm',
    }));
  });

  const [cbcValues, setCbcValues] = useState<ExtractedLabField[]>(() => {
    const defaults = [
      { id: 'hb', name: 'Hemoglobin (Hb)', value: '13.2', unit: 'g/dL', refRange: '12.0 – 15.5' },
    ];

    if (!pendingOcrReport?.results) return defaults;

    const matched = pendingOcrReport.results.filter((r) => r.category === 'CBC');
    if (matched.length === 0) return defaults;

    return matched.map((m, idx) => ({
      id: m.id || `cbc_${idx}`,
      name: m.testName,
      value: m.value,
      unit: m.unit || 'g/dL',
      refRange: m.referenceRange || 'Reference Lab Norm',
    }));
  });

  const [activeAccordion, setActiveAccordion] = useState<string | null>('hormones');

  const handleUpdateHormone = (id: string, newVal: string) => {
    setHormoneValues((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newVal } : f))
    );
  };

  const handleUpdateMetabolic = (id: string, newVal: string) => {
    setMetabolicValues((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newVal } : f))
    );
  };

  const handleUpdateNutritional = (id: string, newVal: string) => {
    setNutritionalValues((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newVal } : f))
    );
  };

  const handleUpdateCbc = (id: string, newVal: string) => {
    setCbcValues((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newVal } : f))
    );
  };

  const handleConfirmSave = useCallback(async () => {
    const allRows: ClinicalLabRow[] = [];

    hormoneValues.forEach((h) => {
      if (h.value.trim().length > 0) {
        allRows.push({
          id: `ocr-verified-${h.id}-${Date.now()}`,
          testName: h.name,
          category: 'Hormones',
          value: h.value.trim(),
          unit: h.unit,
          referenceRange: h.refRange,
          status: 'Normal',
        });
      }
    });

    metabolicValues.forEach((m) => {
      if (m.value.trim().length > 0) {
        allRows.push({
          id: `ocr-verified-${m.id}-${Date.now()}`,
          testName: m.name,
          category: 'Metabolic',
          value: m.value.trim(),
          unit: m.unit,
          referenceRange: m.refRange,
          status: 'Normal',
        });
      }
    });

    nutritionalValues.forEach((n) => {
      if (n.value.trim().length > 0) {
        allRows.push({
          id: `ocr-verified-${n.id}-${Date.now()}`,
          testName: n.name,
          category: 'Other',
          value: n.value.trim(),
          unit: n.unit,
          referenceRange: n.refRange,
          status: 'Normal',
        });
      }
    });

    cbcValues.forEach((c) => {
      if (c.value.trim().length > 0) {
        allRows.push({
          id: `ocr-verified-${c.id}-${Date.now()}`,
          testName: c.name,
          category: 'Other',
          value: c.value.trim(),
          unit: c.unit,
          referenceRange: c.refRange,
          status: 'Normal',
        });
      }
    });

    await confirmVerifiedLabs(allRows, pendingOcrReport?.id);
    Alert.alert(
      'Labs Verified',
      'Your extracted clinical lab values have been confirmed and saved to your health profile.',
      [
        {
          text: 'Continue',
          onPress: () => router.push('/(app)/tier-progress'),
        },
      ]
    );
  }, [hormoneValues, metabolicValues, nutritionalValues, cbcValues, confirmVerifiedLabs, pendingOcrReport?.id, router]);

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

        <Text style={styles.headerTitle}>Verify Extracted Values</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.subtitleText}>
              Please review the extracted values and make any corrections before saving. Values are not saved until you confirm.
            </Text>
          </View>

          {/* WARNING INFO CALLOUT */}
          <View style={styles.warningCallout}>
            <Ionicons name="information-circle" size={20} color="#F43F7D" style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Review all values carefully. You can edit any field if needed.
            </Text>
          </View>

          {/* ACCORDION SECTIONS */}
          <View style={styles.accordionContainer}>
            {/* 1. HORMONE TESTS */}
            <View style={styles.sectionCard}>
              <Pressable
                onPress={() =>
                  setActiveAccordion((prev) => (prev === 'hormones' ? null : 'hormones'))
                }
                style={styles.sectionHeaderRow}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#FDF2F8' }]}>
                    <Ionicons name="water-outline" size={18} color={themeAccent} />
                  </View>
                  <Text style={styles.sectionTitle}>Hormone Tests</Text>
                </View>
                <Ionicons
                  name={activeAccordion === 'hormones' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </Pressable>

              {activeAccordion === 'hormones' && (
                <View style={styles.sectionBody}>
                  {hormoneValues.map((item) => (
                    <View key={item.id} style={styles.testRow}>
                      <View style={styles.testLabelCol}>
                        <Text style={styles.testNameText}>{item.name}</Text>
                        <Text style={styles.testRefRange}>{item.refRange}</Text>
                      </View>

                      <View style={styles.testInputRow}>
                        <View style={styles.testInputWrapper}>
                          <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            value={item.value}
                            onChangeText={(val) => handleUpdateHormone(item.id, val)}
                          />
                        </View>
                        <Text style={styles.testUnitText}>{item.unit}</Text>
                        <Pressable hitSlop={6} style={styles.editPencilBtn}>
                          <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 2. METABOLIC TESTS */}
            <View style={styles.sectionCard}>
              <Pressable
                onPress={() =>
                  setActiveAccordion((prev) => (prev === 'metabolic' ? null : 'metabolic'))
                }
                style={styles.sectionHeaderRow}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="bar-chart-outline" size={18} color="#EA580C" />
                  </View>
                  <Text style={styles.sectionTitle}>Metabolic Tests</Text>
                </View>
                <Ionicons
                  name={activeAccordion === 'metabolic' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </Pressable>

              {activeAccordion === 'metabolic' && (
                <View style={styles.sectionBody}>
                  {metabolicValues.map((item) => (
                    <View key={item.id} style={styles.testRow}>
                      <View style={styles.testLabelCol}>
                        <Text style={styles.testNameText}>{item.name}</Text>
                        <Text style={styles.testRefRange}>{item.refRange}</Text>
                      </View>

                      <View style={styles.testInputRow}>
                        <View style={styles.testInputWrapper}>
                          <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            value={item.value}
                            onChangeText={(val) => handleUpdateMetabolic(item.id, val)}
                          />
                        </View>
                        <Text style={styles.testUnitText}>{item.unit}</Text>
                        <Pressable hitSlop={6} style={styles.editPencilBtn}>
                          <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 3. NUTRITIONAL TESTS */}
            <View style={styles.sectionCard}>
              <Pressable
                onPress={() =>
                  setActiveAccordion((prev) => (prev === 'nutritional' ? null : 'nutritional'))
                }
                style={styles.sectionHeaderRow}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="leaf-outline" size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.sectionTitle}>Nutritional Tests</Text>
                </View>
                <Ionicons
                  name={activeAccordion === 'nutritional' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </Pressable>

              {activeAccordion === 'nutritional' && (
                <View style={styles.sectionBody}>
                  {nutritionalValues.map((item) => (
                    <View key={item.id} style={styles.testRow}>
                      <View style={styles.testLabelCol}>
                        <Text style={styles.testNameText}>{item.name}</Text>
                        <Text style={styles.testRefRange}>{item.refRange}</Text>
                      </View>

                      <View style={styles.testInputRow}>
                        <View style={styles.testInputWrapper}>
                          <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            value={item.value}
                            onChangeText={(val) => handleUpdateNutritional(item.id, val)}
                          />
                        </View>
                        <Text style={styles.testUnitText}>{item.unit}</Text>
                        <Pressable hitSlop={6} style={styles.editPencilBtn}>
                          <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 4. CBC */}
            <View style={styles.sectionCard}>
              <Pressable
                onPress={() =>
                  setActiveAccordion((prev) => (prev === 'cbc' ? null : 'cbc'))
                }
                style={styles.sectionHeaderRow}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="fitness-outline" size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.sectionTitle}>CBC</Text>
                </View>
                <Ionicons
                  name={activeAccordion === 'cbc' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </Pressable>

              {activeAccordion === 'cbc' && (
                <View style={styles.sectionBody}>
                  {cbcValues.map((item) => (
                    <View key={item.id} style={styles.testRow}>
                      <View style={styles.testLabelCol}>
                        <Text style={styles.testNameText}>{item.name}</Text>
                        <Text style={styles.testRefRange}>{item.refRange}</Text>
                      </View>

                      <View style={styles.testInputRow}>
                        <View style={styles.testInputWrapper}>
                          <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            value={item.value}
                            onChangeText={(val) => handleUpdateCbc(item.id, val)}
                          />
                        </View>
                        <Text style={styles.testUnitText}>{item.unit}</Text>
                        <Pressable hitSlop={6} style={styles.editPencilBtn}>
                          <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>


          {/* CONFIRM & SAVE CTA */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Confirm & Save"
              onPress={handleConfirmSave}
              style={[styles.confirmBtn, { backgroundColor: themeAccent }]}
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
    marginBottom: 14,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  warningCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 18,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#9F1239',
    lineHeight: 16,
    fontWeight: '500',
  },
  accordionContainer: {
    gap: 10,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 10,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  testLabelCol: {
    flex: 1,
    marginRight: 8,
  },
  testNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  testRefRange: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  testInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 34,
    minWidth: 50,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
    textAlign: 'center',
    padding: 0,
  },
  testUnitText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    minWidth: 42,
  },
  editPencilBtn: {
    padding: 4,
  },
  ctaWrapper: {
    marginTop: 8,
    marginBottom: 10,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 14,
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});
