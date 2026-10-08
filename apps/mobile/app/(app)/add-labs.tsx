import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
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

interface LabField {
  key: string;
  name: string;
  unit: string;
  refRange: string;
}

interface LabCategorySection {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  fields: LabField[];
}

/**
 * SCREEN 20: ADD CLINICAL LABS
 *
 * Strict visual match to Screenshot 20:
 * - Top Header: Back chevron (<), centered "Add Clinical Labs"
 * - Subtitle: "Add your lab results to improve the accuracy of your assessment."
 * - Two Mode Cards:
 *   - [ Enter Manually ] (selected by default with pink outline & soft pink bg)
 *   - [ Upload Report ] (tapping routes to /ocr-upload)
 * - Accordion Sections:
 *   1. Hormone Tests (FSH, LH, AMH, Prolactin, TSH, Progesterone)
 *   2. Metabolic Tests (FBS/RBS, HbA1c, Lipid Panel)
 *   3. Nutritional Tests (Vitamin D3, Ferritin)
 *   4. CBC (Hemoglobin (Hb))
 *   5. Liver & Renal Tests (ALT, AST, ALP, Creatinine)
 *   6. Thyroid Tests (TSH, FT3, FT4)
 * - Bottom CTA: Solid pink "Continue" button
 */
export default function AddClinicalLabsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? '#F43F7D' : '#0284C7';

  const { verifiedLabs, confirmVerifiedLabs } = useHealthStore();

  const [activeMode, setActiveMode] = useState<'manual' | 'upload'>('manual');
  const [expandedSection, setExpandedSection] = useState<string | null>('hormones');

  // Categories matching Screenshot 20
  const sections: LabCategorySection[] = [
    {
      id: 'hormones',
      title: 'Hormone Tests',
      subtitle: 'FSH, LH, AMH, Prolactin, TSH, Progesterone',
      icon: 'water-outline',
      fields: [
        { key: 'fsh', name: 'FSH', unit: 'mIU/mL', refRange: '3.5 – 12.5' },
        { key: 'lh', name: 'LH', unit: 'mIU/mL', refRange: '2.4 – 12.6' },
        { key: 'amh', name: 'AMH', unit: 'ng/mL', refRange: '1.0 – 10.0' },
        { key: 'prolactin', name: 'Prolactin', unit: 'ng/mL', refRange: '4.8 – 23.3' },
        { key: 'tsh', name: 'TSH', unit: 'μIU/mL', refRange: '0.4 – 4.0' },
        { key: 'progesterone', name: 'Progesterone', unit: 'ng/mL', refRange: '0.2 – 1.4' },
      ],
    },
    {
      id: 'metabolic',
      title: 'Metabolic Tests',
      subtitle: 'FBS/RBS, HbA1c, Lipid Panel',
      icon: 'bar-chart-outline',
      fields: [
        { key: 'fasting_glucose', name: 'Fasting Blood Glucose', unit: 'mg/dL', refRange: '70 – 99' },
        { key: 'hba1c', name: 'HbA1c', unit: '%', refRange: '< 5.7' },
        { key: 'cholesterol', name: 'Total Cholesterol', unit: 'mg/dL', refRange: '< 200' },
        { key: 'triglycerides', name: 'Triglycerides', unit: 'mg/dL', refRange: '< 150' },
      ],
    },
    {
      id: 'nutritional',
      title: 'Nutritional Tests',
      subtitle: 'Vitamin D3, Ferritin',
      icon: 'leaf-outline',
      fields: [
        { key: 'vit_d', name: 'Vitamin D3 (25-OH)', unit: 'ng/mL', refRange: '30 – 100' },
        { key: 'ferritin', name: 'Serum Ferritin', unit: 'ng/mL', refRange: '13 – 150' },
      ],
    },
    {
      id: 'cbc',
      title: 'CBC',
      subtitle: 'Hemoglobin (Hb)',
      icon: 'fitness-outline',
      fields: [
        { key: 'hb', name: 'Hemoglobin (Hb)', unit: 'g/dL', refRange: '12.0 – 15.5' },
      ],
    },
    {
      id: 'liver_renal',
      title: 'Liver & Renal Tests',
      subtitle: 'ALT, AST, ALP, Creatinine',
      icon: 'medkit-outline',
      fields: [
        { key: 'alt', name: 'ALT (SGPT)', unit: 'U/L', refRange: '7 – 56' },
        { key: 'ast', name: 'AST (SGOT)', unit: 'U/L', refRange: '10 – 40' },
        { key: 'creatinine', name: 'Serum Creatinine', unit: 'mg/dL', refRange: '0.6 – 1.2' },
      ],
    },
    {
      id: 'thyroid',
      title: 'Thyroid Tests',
      subtitle: 'TSH, FT3, FT4',
      icon: 'pulse-outline',
      fields: [
        { key: 'ft3', name: 'Free T3', unit: 'pg/mL', refRange: '2.0 – 4.4' },
        { key: 'ft4', name: 'Free T4', unit: 'ng/dL', refRange: '0.8 – 1.8' },
      ],
    },
  ];

  // Initial values populated strictly from existing verified labs in store
  const [labValues, setLabValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    verifiedLabs.forEach((v) => {
      const lower = v.testName.toLowerCase();
      if (lower.includes('fsh')) init.fsh = v.value;
      if (lower.includes('lh') && !lower.includes('fsh')) init.lh = v.value;
      if (lower.includes('amh')) init.amh = v.value;
      if (lower.includes('prolactin')) init.prolactin = v.value;
      if (lower.includes('tsh')) init.tsh = v.value;
      if (lower.includes('progesterone')) init.progesterone = v.value;
    });
    return init;
  });

  const handleValueChange = (key: string, val: string) => {
    setLabValues((prev) => ({ ...prev, [key]: val }));
  };

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const handleContinue = useCallback(() => {
    const rows: ClinicalLabRow[] = [];
    sections.forEach((sec) => {
      sec.fields.forEach((field) => {
        const val = labValues[field.key];
        if (val && val.trim().length > 0) {
          rows.push({
            id: `manual-lab-${field.key}-${Date.now()}`,
            testName: field.name,
            category: sec.title.includes('Hormone') ? 'Hormones' : sec.title.includes('Metabolic') ? 'Metabolic' : 'Other',
            value: val.trim(),
            unit: field.unit,
            referenceRange: field.refRange,
            status: 'Normal',
          });
        }
      });
    });

    if (rows.length > 0) {
      confirmVerifiedLabs(rows);
    }
    router.push('/(app)/ocr-verify');
  }, [sections, labValues, confirmVerifiedLabs, router]);

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

        <Text style={styles.headerTitle}>Add Clinical Labs</Text>

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
              Add your lab results to improve the accuracy of your assessment.
            </Text>
          </View>

          {/* TWO MODE CARDS */}
          <View style={styles.modesRow}>
            {/* Card 1: Enter Manually */}
            <Pressable
              onPress={() => setActiveMode('manual')}
              style={[
                styles.modeCard,
                activeMode === 'manual' && {
                  borderColor: themeAccent,
                  backgroundColor: '#FDF2F8',
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: activeMode === 'manual' }}
            >
              <View style={[styles.modeIconBox, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="document-text-outline" size={22} color={themeAccent} />
              </View>
              <Text
                style={[
                  styles.modeTitle,
                  activeMode === 'manual' && { color: themeAccent, fontWeight: '700' },
                ]}
              >
                Enter{'\n'}Manually
              </Text>
              <Text style={styles.modeSub}>Add your lab values yourself.</Text>
            </Pressable>

            {/* Card 2: Upload Report */}
            <Pressable
              onPress={() => {
                setActiveMode('upload');
                router.push('/(app)/ocr-upload');
              }}
              style={[
                styles.modeCard,
                activeMode === 'upload' && {
                  borderColor: '#0284C7',
                  backgroundColor: '#EFF6FF',
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: activeMode === 'upload' }}
            >
              <View style={[styles.modeIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="cloud-upload-outline" size={22} color="#0284C7" />
              </View>
              <Text style={styles.modeTitle}>Upload{'\n'}Report</Text>
              <Text style={styles.modeSub}>Upload a photo or PDF of your lab report.</Text>
            </Pressable>
          </View>

          {/* ACCORDION LAB SECTIONS */}
          <View style={styles.accordionContainer}>
            {sections.map((section) => {
              const isExpanded = expandedSection === section.id;
              return (
                <View key={section.id} style={styles.sectionCard}>
                  {/* Section Header Row */}
                  <Pressable
                    onPress={() => toggleSection(section.id)}
                    style={styles.sectionHeaderRow}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[styles.sectionIconBox, { backgroundColor: '#FDF2F8' }]}>
                        <Ionicons name={section.icon} size={18} color={themeAccent} />
                      </View>
                      <View style={styles.sectionTitlesCol}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#94A3B8"
                    />
                  </Pressable>

                  {/* Section Expanded Inputs */}
                  {isExpanded && (
                    <View style={styles.sectionBody}>
                      {section.fields.map((field) => (
                        <View key={field.key} style={styles.fieldRow}>
                          <View style={styles.fieldLabelCol}>
                            <Text style={styles.fieldName}>{field.name}</Text>
                            <Text style={styles.fieldRefRange}>{field.refRange}</Text>
                          </View>

                          <View style={styles.fieldInputWrapper}>
                            <TextInput
                              style={styles.textInput}
                              keyboardType="numeric"
                              value={labValues[field.key] || ''}
                              onChangeText={(val) => handleValueChange(field.key, val)}
                              placeholder="0.0"
                              placeholderTextColor="#94A3B8"
                            />
                            <Text style={styles.unitText}>{field.unit}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Primary Action Button */}
          <View style={styles.ctaWrapper}>
            <BioPulseButton
              title="Continue"
              onPress={handleContinue}
              style={[styles.continueButton, { backgroundColor: themeAccent }]}
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
    marginBottom: 16,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    minHeight: 125,
  },
  modeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#073B72',
    lineHeight: 18,
    marginBottom: 4,
  },
  modeSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
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
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitlesCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fieldLabelCol: {
    flex: 1,
    marginRight: 12,
  },
  fieldName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  fieldRefRange: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  textInput: {
    width: 50,
    fontSize: 13,
    fontWeight: '600',
    color: '#073B72',
    textAlign: 'right',
    padding: 0,
    marginRight: 6,
  },
  unitText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  ctaWrapper: {
    marginTop: 8,
    marginBottom: 10,
  },
  continueButton: {
    height: 52,
    borderRadius: 14,
  },
});
