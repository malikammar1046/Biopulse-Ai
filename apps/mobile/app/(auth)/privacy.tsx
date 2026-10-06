import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/register');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <AuthBackgroundFoliage />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backBtnArrow}>←</Text>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isTablet && styles.tabletCard]}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>DATA PROTECTION & PRIVACY</Text>
          </View>

          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Effective Date: September 2026</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Our Zero-Ad / Zero-Sale Health Privacy Pledge</Text>
            <Text style={styles.paragraph}>
              BioPulse AI never sells, rents, or monetizes personal health telemetry, hormonal profiles, or biometric logs to data brokers, insurers, or advertising networks.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Military-Grade Encryption</Text>
            <Text style={styles.paragraph}>
              All transmitted clinical records, symptom diaries, and laboratory values are secured in transit via TLS 1.3 and at rest with AES-256 cryptographic encryption protocols.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Machine Learning & Anonymization</Text>
            <Text style={styles.paragraph}>
              All machine-learning risk evaluations (such as PCOS SHAP explainability models and male hypogonadism screening algorithms) are processed strictly under anonymized identifiers with clinical state isolation.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Right to Erasure (GDPR / HIPAA)</Text>
            <Text style={styles.paragraph}>
              You have the unconditional right to purge your entire dataset. Deleting your BioPulse AI account triggers an immediate, permanent cascade removal of all your stored health metrics and sessions.
            </Text>
          </View>

          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
          >
            <Text style={styles.doneBtnText}>Back to Registration</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BioPulseColors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backBtnPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  backBtnArrow: {
    fontSize: 18,
    color: '#0284C7',
    fontWeight: '700',
  },
  backBtnText: {
    fontSize: 14,
    color: '#0284C7',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  tabletCard: {
    width: 600,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B1E38',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  doneBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnPressed: {
    opacity: 0.9,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
