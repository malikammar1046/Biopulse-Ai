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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { AuthInput } from '../../components/auth/AuthInput';
import { resetUserPassword } from '../../features/authentication';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Retrieve tokens from deep link params if present
  const params = useLocalSearchParams<{
    access_token?: string;
    token?: string;
    type?: string;
  }>();
  const recoveryToken = params.access_token || params.token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (generalError) setGeneralError(null);
  }, [passwordError, generalError]);

  const handleConfirmChange = useCallback((text: string) => {
    setConfirmPassword(text);
    if (confirmError) setConfirmError(null);
    if (generalError) setGeneralError(null);
  }, [confirmError, generalError]);

  const handleResetSubmit = async () => {
    Keyboard.dismiss();
    setGeneralError(null);

    let hasError = false;
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      hasError = true;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match. Please re-enter.');
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);
    try {
      const res = await resetUserPassword(password, recoveryToken);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setGeneralError(res.message);
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'Network error occurred while updating your password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AuthBackgroundFoliage />

        {/* Top Navigation */}
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
                  <Text style={styles.badgeText}>ACCOUNT SECURITY</Text>
                </View>
                <Text style={styles.title}>Set New Password</Text>
                <Text style={styles.subtitle}>
                  Create a strong new password for your BioPulse AI account (minimum 6 characters).
                </Text>
              </View>

              {generalError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              )}

              {isSuccess ? (
                <View style={styles.successBlock}>
                  <View style={styles.successIconCircle}>
                    <Text style={styles.successIconCheck}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Password Updated</Text>
                  <Text style={styles.successBody}>
                    Your password has been successfully updated. You can now log in with your new credentials.
                  </Text>
                  <Pressable
                    onPress={handleBackToLogin}
                    style={styles.submitBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Return to Login"
                  >
                    <Text style={styles.submitBtnText}>Log In Now</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.formBlock}>
                  <AuthInput
                    label="New Password"
                    placeholder="Enter new password"
                    value={password}
                    onChangeText={handlePasswordChange}
                    isPassword
                    errorText={passwordError}
                    iconName="lock-closed-outline"
                    autoCapitalize="none"
                  />

                  <AuthInput
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={handleConfirmChange}
                    isPassword
                    errorText={confirmError}
                    iconName="lock-closed-outline"
                    autoCapitalize="none"
                  />

                  <Pressable
                    onPress={handleResetSubmit}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      pressed && styles.submitBtnPressed,
                      isLoading && styles.submitBtnDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Update Password"
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Update Password</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleBackToLogin}
                    style={styles.cancelBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel and return to login"
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: '#090D16',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  backBtnArrow: {
    fontSize: 16,
    color: '#16B8C4',
    marginRight: 6,
    fontWeight: '700',
  },
  backBtnText: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tabletCard: {
    width: 480,
  },
  headerBlock: {
    marginBottom: 20,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22, 184, 196, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 196, 0.25)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16B8C4',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: 13,
    lineHeight: 18,
  },
  formBlock: {
    gap: 16,
  },
  submitBtn: {
    backgroundColor: '#16B8C4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIconCheck: {
    fontSize: 28,
    color: '#10B981',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successBody: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
