import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { ocrService, reportService } from '../../services';

/**
 * SCREEN 21: OCR UPLOAD
 *
 * Strict visual match to Screenshot 21:
 * - Top Header: Back chevron (<)
 * - Title: "Upload Lab Report"
 * - Subtitle: "Upload a clear photo or PDF of your lab report and we'll automatically extract your test results."
 * - Center Illustration: Medical lab document report artwork with sparkle accents
 * - Primary Action Buttons:
 *   - [ Take a Photo ] (solid pink/magenta button with camera icon)
 *   - [ Upload File ] (white button with pink outline and upload icon)
 * - Format information: "Supported formats: PDF, JPG, PNG\nMax file size: 10 MB"
 * - Privacy Notice: Blue shield icon, "Your data is private and secure..."
 * - Processing Stepper State:
 *   - "Processing your report..."
 *   - [✓] Uploading document
 *   - [○] Reading and extracting text
 *   - [○] Identifying lab results
 *   - [○] Preparing summary
 */
export default function OcrUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, pathway } = useAuth();
  const { setPendingOcrReport } = useHealthStore();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? '#F43F7D' : '#0284C7';

  const [processing, setProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const stages = [
    'Uploading document',
    'Reading and extracting text',
    'Identifying lab results',
    'Preparing summary',
  ];

  const handleStartProcessing = useCallback(async (mode: 'camera' | 'file' = 'file') => {
    if (!user?.accessToken || !user?.id) {
      setOcrError('Authentication required. Please sign in to upload and extract medical reports.');
      return;
    }

    setProcessing(true);
    setOcrError(null);
    setCurrentStage(0);

    const isCamera = mode === 'camera';
    const sampleFileName = isCamera ? 'clinical_scan.jpg' : 'hormone_lab_report.pdf';
    const sampleMimeType = isCamera ? 'image/jpeg' : 'application/pdf';
    const sampleFileUri = `file:///documents/${sampleFileName}`;

    const t1 = setTimeout(() => setCurrentStage(1), 400);
    const t2 = setTimeout(() => setCurrentStage(2), 900);
    const t3 = setTimeout(() => setCurrentStage(3), 1400);

    try {
      // 1. Call real backend PaddleOCR pipeline
      const ocrRes = await ocrService.uploadDocument(
        user.accessToken,
        sampleFileUri,
        sampleFileName,
        sampleMimeType
      );

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (ocrRes.error || !ocrRes.data || !ocrRes.data.success) {
        setProcessing(false);
        setOcrError(
          ocrRes.error ||
          'The OCR engine was unable to extract structured test data from this document.'
        );
        return;
      }

      setCurrentStage(3);

      const data = ocrRes.data;
      const cleanTitle = sampleFileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      // 2. Persist as an UNVERIFIED report draft in database with status: 'needs_verification'
      // Safety Invariant: Raw OCR is quarantined and NOT trusted medical data
      let createdReportId: string | undefined;
      const unverifiedDraftRes = await reportService.createUnverifiedReport(
        user.id,
        user.accessToken,
        {
          title: cleanTitle,
          reportType: 'lab',
          reportDate: new Date().toISOString().split('T')[0],
          fileName: sampleFileName,
          mimeType: sampleMimeType,
          status: 'needs_verification',
          tests: data.results.map((r) => ({
            testName: r.test_name,
            category: r.category,
            value: r.value,
            resultNumeric: r.result_numeric,
            unit: r.unit,
            referenceRange: r.reference_range,
            status: r.status,
            ocrConfidence: r.confidence,
            userVerified: false,
            explanation: r.explanation,
          })),
        }
      );

      if (unverifiedDraftRes.data?.id) {
        createdReportId = unverifiedDraftRes.data.id;
      }

      // 3. Store pending unverified report in store for user review on Screen 22
      setPendingOcrReport({
        id: createdReportId,
        title: cleanTitle,
        fileName: sampleFileName,
        fileUri: sampleFileUri,
        mimeType: sampleMimeType,
        results: data.results.map((r, idx) => ({
          id: `field_${idx}`,
          testName: r.test_name,
          category: r.category,
          value: r.value,
          unit: r.unit,
          referenceRange: r.reference_range,
          status: r.status,
          confidence: r.confidence,
          requiresReview: r.requires_review,
        })),
        rawSnippet: data.raw_text_snippet,
        requiresReview: data.requires_review,
        disclaimer: data.disclaimer,
      });

      // Brief transition before navigating to review screen
      setTimeout(() => {
        setProcessing(false);
        router.push('/(app)/ocr-verify');
      }, 300);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setProcessing(false);
      setOcrError(err.message || 'Failed to process document.');
    }
  }, [user?.accessToken, user?.id, setPendingOcrReport, router]);

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
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* TITLE & SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Upload Lab Report</Text>
            <Text style={styles.screenSubtitle}>
              Upload a clear photo or PDF of your lab report and we'll automatically extract your test results.
            </Text>
          </View>

          {/* REPORT DOCUMENT ARTWORK */}
          <View style={styles.illustrationContainer}>
            <View style={styles.documentCard}>
              <View style={styles.documentHeaderBar}>
                <Ionicons name="medkit" size={20} color={themeAccent} />
              </View>
              <View style={styles.documentLine1} />
              <View style={styles.documentLine2} />
              <View style={styles.documentLine3} />
              <View style={styles.documentLine4} />
            </View>

            {/* Sparkles */}
            <Ionicons
              name="sparkles"
              size={18}
              color={themeAccent}
              style={styles.sparkleTopRight}
            />
            <Ionicons
              name="sparkles"
              size={14}
              color="#F59E0B"
              style={styles.sparkleBottomLeft}
            />
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionButtonsContainer}>
            {/* Take a Photo */}
            <Pressable
              onPress={() => handleStartProcessing('camera')}
              disabled={processing}
              style={({ pressed }) => [
                styles.takePhotoBtn,
                { backgroundColor: themeAccent },
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Take a Photo"
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.takePhotoBtnText}>Take a Photo</Text>
            </Pressable>

            {/* Upload File */}
            <Pressable
              onPress={() => handleStartProcessing('file')}
              disabled={processing}
              style={({ pressed }) => [
                styles.uploadFileBtn,
                { borderColor: themeAccent },
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Upload File"
            >
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={themeAccent}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.uploadFileBtnText, { color: themeAccent }]}>Upload File</Text>
            </Pressable>
          </View>

          {/* FORMATS SUBTEXT */}
          <Text style={styles.formatsText}>
            Supported formats: PDF, JPG, PNG{'\n'}Max file size: 10 MB
          </Text>

          {/* ERROR BOX (IF FAILED) */}
          {ocrError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#E11D48" style={{ marginTop: 2 }} />
              <View style={styles.errorContentCol}>
                <Text style={styles.errorTitle}>Document Processing Notice</Text>
                <Text style={styles.errorSub}>{ocrError}</Text>
                <Pressable
                  onPress={() => handleStartProcessing('file')}
                  style={[styles.retryBtn, { borderColor: themeAccent }]}
                >
                  <Text style={[styles.retryBtnText, { color: themeAccent }]}>Retry Extraction</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* PRIVACY BOX */}
          <View style={styles.privacyBox}>
            <View style={styles.privacyIconBox}>
              <Ionicons name="shield-checkmark" size={18} color="#0284C7" />
            </View>
            <View style={styles.privacyContentCol}>
              <Text style={styles.privacyTitle}>Your data is private and secure.</Text>
              <Text style={styles.privacySub}>
                We use encrypted processing to extract your lab results. Your files are not shared with third parties.
              </Text>
            </View>
          </View>

          {/* PROCESSING STATUS STEPPER */}
          <View style={styles.processingSection}>
            <Text style={styles.processingHeading}>Processing your report...</Text>
            <View style={styles.processingList}>
              {stages.map((label, idx) => {
                const isPassed = processing ? idx < currentStage : idx === 0;
                const isCurrent = processing && idx === currentStage;

                return (
                  <View key={idx} style={styles.processStepRow}>
                    <View
                      style={[
                        styles.processStepCircle,
                        isPassed && { backgroundColor: themeAccent, borderColor: themeAccent },
                        isCurrent && { borderColor: themeAccent, backgroundColor: '#FFFFFF' },
                      ]}
                    >
                      {isPassed ? (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      ) : isCurrent ? (
                        <ActivityIndicator size="small" color={themeAccent} />
                      ) : (
                        <View style={styles.processStepInnerDot} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.processStepLabel,
                        (isPassed || isCurrent) && styles.processStepLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
    marginBottom: 18,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#073B72',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
    height: 140,
  },
  documentCard: {
    width: 110,
    height: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  documentHeaderBar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  documentLine1: {
    width: '80%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 6,
  },
  documentLine2: {
    width: '65%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 6,
  },
  documentLine3: {
    width: '75%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 6,
  },
  documentLine4: {
    width: '50%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 10,
    right: 80,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 80,
  },
  actionButtonsContainer: {
    gap: 10,
    marginBottom: 14,
  },
  takePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  takePhotoBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  uploadFileBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  formatsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 18,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
    marginBottom: 20,
  },
  privacyIconBox: {
    marginTop: 2,
  },
  privacyContentCol: {
    flex: 1,
    gap: 2,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  privacySub: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 16,
  },
  processingSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  processingHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 12,
  },
  processingList: {
    gap: 12,
  },
  processStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processStepInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  processStepLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  processStepLabelActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  errorContentCol: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
    marginBottom: 2,
  },
  errorSub: {
    fontSize: 12,
    color: '#BE123C',
    lineHeight: 16,
    marginBottom: 8,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

