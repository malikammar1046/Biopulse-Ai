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

export default function TermsOfServiceScreen() {
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
            <Text style={styles.badgeText}>CLINICAL & LEGAL TERMS</Text>
          </View>

          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>Effective Date: September 2026</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Purpose & Medical Disclaimer</Text>
            <Text style={styles.paragraph}>
              BioPulse AI provides personalized health intelligence, cycle tracking, and machine-learning assisted risk assessments for hormonal and endocrine health (including Polycystic Ovary Syndrome and Male Hypogonadism).
            </Text>
            <Text style={styles.paragraphHighlight}>
              Important: BioPulse AI is not an acute emergency medical service or definitive standalone diagnostic device. Always consult with a licensed healthcare provider before initiating medical therapies or altering prescribed treatments.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Account Security & Verification</Text>
            <Text style={styles.paragraph}>
              You are responsible for maintaining the confidentiality of your login credentials. You agree to provide accurate health metrics, symptoms, and lab values to ensure analytical fidelity.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Telehealth & Care Circle Sharing</Text>
            <Text style={styles.paragraph}>
              Sharing your health reports or care circle records with physicians or specialists is entirely voluntary and revocable at any time within your account privacy settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Ownership</Text>
            <Text style={styles.paragraph}>
              You retain full ownership of your personal health data. You may export or permanently delete your account and all associated biological telemetry at any time.
            </Text>
          </View>

          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
          >
            <Text style={styles.doneBtnText}>I Understand and Agree</Text>
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
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
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
  paragraphHighlight: {
    fontSize: 13,
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    lineHeight: 19,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  doneBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0284C7',
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
