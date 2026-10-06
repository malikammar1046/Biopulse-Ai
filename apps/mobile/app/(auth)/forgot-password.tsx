import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { AuthInput } from '../../components/auth/AuthInput';
import { validateEmail, sendPasswordResetEmail } from '../../features/authentication';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (generalError) setGeneralError(null);
  }, [emailError, generalError]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setGeneralError(null);

    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsLoading(true);
    try {
      const res = await sendPasswordResetEmail(email);
      if (res.success) {
        setIsSubmitted(true);
      } else {
        setGeneralError(res.message);
      }
    } catch {
      setGeneralError('Network error occurred. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AuthBackgroundFoliage />

        {/* Top Bar with Back Button */}
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBackToLogin}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Back to Login"
          >
            <Text style={styles.backBtnArrow}>←</Text>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.card, isTablet && styles.tabletCard]}>
              {/* Header */}
              <View style={styles.headerBlock}>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>ACCOUNT RECOVERY</Text>
                </View>
                <Text style={styles.title}>Reset Your Password</Text>
                <Text style={styles.subtitle}>
                  Enter the email address associated with your BioPulse AI account and we'll send you secure recovery instructions.
                </Text>
              </View>

              {generalError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              )}

              {isSubmitted ? (
                <View style={styles.successBlock}>
                  <View style={styles.successIconCircle}>
                    <Text style={styles.successIconCheck}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Recovery Instructions Sent</Text>
                  <Text style={styles.successMessage}>
                    If an account exists for <Text style={styles.boldEmail}>{email.trim()}</Text>, an email has been dispatched with a link to reset your credentials.
                  </Text>
                  <Pressable
                    onPress={handleBackToLogin}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                  >
                    <Text style={styles.primaryBtnText}>Return to Log In</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.formBlock}>
                  <AuthInput
                    label="Email Address"
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="Enter your registered email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    errorText={emailError}
                    iconName="mail-outline"
                  />

                  <Pressable
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      isLoading && styles.primaryBtnDisabled,
                      pressed && styles.primaryBtnPressed,
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleBackToLogin}
                    style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                  >
                    <Text style={styles.cancelBtnText}>Cancel and return to sign in</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    justifyContent: 'center',
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
    width: 480,
  },
  headerBlock: {
    marginBottom: 20,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  formBlock: {
    gap: 16,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 2,
  },
  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnPressed: {
    opacity: 0.6,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successIconCheck: {
    fontSize: 26,
    color: '#10B981',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B1E38',
  },
  successMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  boldEmail: {
    color: '#0B1E38',
    fontWeight: '700',
  },
});
