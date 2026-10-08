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

  const { confirmVerifiedLabs } = useHealthStore();

  const [hormoneValues, setHormoneValues] = useState<ExtractedLabField[]>([
    { id: 'fsh', name: 'FSH', value: '6.2', unit: 'mIU/mL', refRange: '3.5 – 12.5' },
    { id: 'lh', name: 'LH', value: '8.1', unit: 'mIU/mL', refRange: '2.4 – 12.6' },
    { id: 'amh', name: 'AMH', value: '4.3', unit: 'ng/mL', refRange: '1.0 – 10.0' },
    { id: 'prolactin', name: 'Prolactin', value: '18.5', unit: 'ng/mL', refRange: '4.8 – 23.3' },
    { id: 'tsh', name: 'TSH', value: '2.1', unit: 'μIU/mL', refRange: '0.4 – 4.0' },
    { id: 'progesterone', name: 'Progesterone', value: '0.6', unit: 'ng/mL', refRange: '0.2 – 1.4' },
  ]);

  const [activeAccordion, setActiveAccordion] = useState<string | null>('hormones');

  const handleUpdateField = (id: string, newVal: string) => {
    setHormoneValues((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newVal } : f))
    );
  };

  const handleConfirmSave = useCallback(() => {
    const mappedRows: ClinicalLabRow[] = hormoneValues.map((h) => ({
      id: `ocr-verified-${h.id}-${Date.now()}`,
      testName: h.name,
      category: 'Hormones',
      value: h.value,
      unit: h.unit,
      referenceRange: h.refRange,
      status: 'Normal',
    }));

    confirmVerifiedLabs(mappedRows);
    Alert.alert(
      'Labs Verified',
      'Your extracted clinical lab values have been saved to your health profile.',
      [
        {
          text: 'Continue',
          onPress: () => router.push('/(app)/tier-progress'),
        },
      ]
    );
  }, [hormoneValues, confirmVerifiedLabs, router]);

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
            {/* 1. HORMONE TESTS (EXPANDED) */}
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
                            onChangeText={(val) => handleUpdateField(item.id, val)}
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

            {/* 2. METABOLIC TESTS (COLLAPSED) */}
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
            </View>

            {/* 3. NUTRITIONAL TESTS (COLLAPSED) */}
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
            </View>

            {/* 4. CBC (COLLAPSED) */}
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
