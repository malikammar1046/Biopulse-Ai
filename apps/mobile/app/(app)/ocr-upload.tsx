import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function OcrUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';

  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<number>(0);

  const stages = [
    'Document uploaded successfully',
    'Binarizing & preprocessing image...',
    'Running vision OCR test extraction...',
    'Validating normal reference intervals...',
  ];

  const handleSimulateScan = useCallback((_source: 'camera' | 'file') => {
    setProcessing(true);
    setStage(0);

    const timer1 = setTimeout(() => setStage(1), 400);
    const timer2 = setTimeout(() => setStage(2), 900);
    const timer3 = setTimeout(() => setStage(3), 1400);
    const timer4 = setTimeout(() => {
      setProcessing(false);
      router.push('/(app)/ocr-verify');
    }, 1900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Smart Report OCR</Text>
          <Text style={styles.headerSub}>AI Vision Document Extraction</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View
        style={[
          styles.container,
          isTablet && styles.tabletContainer,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
        ]}
      >
        {processing ? (
          <View style={styles.processingCard}>
            <View style={[styles.scanIconBox, { backgroundColor: themeSoftBg }]}>
              <ActivityIndicator size="large" color={themeAccent} />
            </View>
            <Text style={styles.processingTitle}>Extracting Biomarkers with OCR</Text>
            <Text style={styles.processingDesc}>
              Analyzing laboratory document layout, endocrine markers, and quantitative test units.
            </Text>

            {/* Stepped progress indicators */}
            <View style={styles.stagesList}>
              {stages.map((stg, idx) => {
                const isCompleted = idx < stage;
                const isCurrent = idx === stage;
                return (
                  <View key={idx} style={styles.stageItem}>
                    <View
                      style={[
                        styles.stageDot,
                        isCompleted && { backgroundColor: '#10B981', borderColor: '#10B981' },
                        isCurrent && { backgroundColor: themeAccent, borderColor: themeAccent },
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.stageDotNum}>{idx + 1}</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stageLabel,
                        (isCompleted || isCurrent) && styles.stageLabelActive,
                      ]}
                    >
                      {stg}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.introCard}>
              <View style={[styles.introBadge, { backgroundColor: themeSoftBg }]}>
                <Ionicons name="sparkles" size={18} color={themeAccent} />
              </View>
              <Text style={styles.introTitle}>Scan or Upload Lab Report</Text>
              <Text style={styles.introSub}>
                BioPulse AI reads hormone and metabolic blood test reports directly from printed pages or digital PDF documents.
              </Text>
            </View>

            {/* Upload Options */}
            <View style={styles.optionsWrap}>
              <Pressable
                onPress={() => handleSimulateScan('camera')}
                style={({ pressed }) => [styles.uploadOption, pressed && styles.uploadOptionPressed]}
              >
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="camera-outline" size={26} color={BioPulseColors.malePrimary} />
                </View>
                <View style={styles.optionTextContent}>
                  <Text style={styles.optionTitle}>Take Photo of Physical Report</Text>
                  <Text style={styles.optionDesc}>Capture printed page in bright, even lighting</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>

              <Pressable
                onPress={() => handleSimulateScan('file')}
                style={({ pressed }) => [styles.uploadOption, pressed && styles.uploadOptionPressed]}
              >
                <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="document-text-outline" size={26} color="#16A34A" />
                </View>
                <View style={styles.optionTextContent}>
                  <Text style={styles.optionTitle}>Upload Digital PDF or Image</Text>
                  <Text style={styles.optionDesc}>Select test results from file storage or gallery</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Formats Card */}
            <View style={styles.formatCard}>
              <Text style={styles.formatTitle}>ACCEPTED DOCUMENT FORMATS</Text>
              <View style={styles.formatRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.formatText}>PDF, PNG, JPG, or HEIC formats up to 15 MB</Text>
              </View>
              <View style={styles.formatRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.formatText}>Ensure reference range intervals and test units are visible</Text>
              </View>
              <View style={styles.formatRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.formatText}>Supports Chughtai Lab, Essa, IDC, and international lab formats</Text>
              </View>
            </View>

            {/* Privacy Note */}
            <View style={styles.privacyBanner}>
              <Ionicons name="lock-closed" size={16} color="#0E9EAA" />
              <Text style={styles.privacyText}>
                Reports are encrypted in transit and analyzed on private secure HIPAA-compliant infrastructure.
              </Text>
            </View>
          </>
        )}
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
    textAlign: 'center',
  },
  introBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  introSub: {
    fontSize: 13,
    color: BioPulseColors.secondaryText,
    lineHeight: 18,
    textAlign: 'center',
  },
  optionsWrap: {
    gap: 12,
    marginBottom: 16,
  },
  uploadOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  uploadOptionPressed: {
    borderColor: BioPulseColors.malePrimary,
    backgroundColor: '#F8FAFC',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 3,
  },
  optionDesc: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
  },
  formatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  formatTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formatText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  privacyBanner: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyText: {
    fontSize: 12,
    color: '#0F766E',
    flex: 1,
    lineHeight: 16,
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
  },
  scanIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BioPulseColors.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  processingDesc: {
    fontSize: 13,
    color: BioPulseColors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  stagesList: {
    width: '100%',
    gap: 12,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stageLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  stageLabelActive: {
    fontWeight: '600',
    color: BioPulseColors.navy,
  },
});
