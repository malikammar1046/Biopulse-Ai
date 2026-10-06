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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../common/BioPulseBackground';
import { BioPulseButton } from '../common/BioPulseButton';
import { BioPulseInput } from '../common/BioPulseInput';
import { SocialAuthRow } from '../common/SocialAuthRow';
import { Logo } from '../brand/Logo';
import {
  validateFullName,
  validateEmail,
  validateRegistrationPassword,
  validateConfirmPassword,
  validateTermsAgreement,
  registerWithEmailAndPassword,
  UserProfile,
} from '../../features/authentication';

export interface BioPulseSignupScreenProps {
  onBack?: () => void;
  onSignupSuccess?: (user: UserProfile) => void;
  onLoginPress?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  onGoogleSignup?: () => void;
  onAppleSignup?: () => void;
}

/**
 * Screen 4: Sign Up Screen
 *
 * Rebuilt to match Screenshot 4:
 * - BioPulse AI logo at top
 * - "Create your account" / "Start your journey to better understanding your health."
 * - Full Name, Email, Password, Confirm Password fields
 * - Interactive Terms of Service & Privacy Policy checkbox
 * - Primary "Create Account  →" button
 * - "Or continue with" divider
 * - Google & Apple social sign-in buttons
 * - "Already have an account? Log In"
 * - Preserves all authentication & registration logic
 */
export const BioPulseSignupScreen: React.FC<BioPulseSignupScreenProps> = ({
  onSignupSuccess,
  onLoginPress,
  onTermsPress,
  onPrivacyPress,
  onGoogleSignup,
  onAppleSignup,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Errors & Loading
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 16 : 12);
  const bottomPad = Math.max(insets.bottom, 16);

  const handleSignup = async () => {
    Keyboard.dismiss();
    setGeneralError(null);

    const nErr = validateFullName(fullName);
    const eErr = validateEmail(email);
    const pErr = validateRegistrationPassword(password);
    const cErr = validateConfirmPassword(password, confirmPassword);
    const tErr = validateTermsAgreement(termsAgreed);

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cErr);
    setTermsError(tErr);

    if (nErr || eErr || pErr || cErr || tErr) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerWithEmailAndPassword({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        termsAgreed,
      });

      if (!result.success || !result.user) {
        setGeneralError(result.errorMessage || 'Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      if (onSignupSuccess) {
        onSignupSuccess(result.user);
      }
    } catch (err: any) {
      setIsLoading(false);
      setGeneralError(err?.message || 'A network error occurred. Please try again.');
    }
  };

  const handleGooglePress = useCallback(() => {
    if (onGoogleSignup) {
      onGoogleSignup();
    } else {
      Alert.alert(
        'Google Sign-Up',
        'Google OAuth is available via our Supabase backend. On mobile, please register with your email and password.',
        [{ text: 'OK' }]
      );
    }
  }, [onGoogleSignup]);

  const handleApplePress = useCallback(() => {
    if (onAppleSignup) {
      onAppleSignup();
    } else {
      Alert.alert(
        'Apple Sign-Up',
        'Apple Sign-In is configured for iOS production builds. Please register with your email and password.',
        [{ text: 'OK' }]
      );
    }
  }, [onAppleSignup]);

  return (
    <BioPulseBackground style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: topPad + 8,
                paddingBottom: bottomPad + 8,
                minHeight: height,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.mainWrapper, { maxWidth: Math.min(width, 460) }]}>
              {/* 1. Header Logo */}
              <View style={styles.logoSection}>
                <Logo size="sm" layout="vertical" showTagline={false} />
              </View>

              {/* 2. Titles */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>
                  Start your journey to better understanding your health.
                </Text>
              </View>

              {/* 3. General Error Box */}
              {generalError ? (
                <View style={styles.generalErrorBox}>
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

              {/* 4. Form Inputs */}
              <View style={styles.inputsSection}>
                <BioPulseInput
                  placeholder="Full Name"
                  leftIcon="person-outline"
                  value={fullName}
                  onChangeText={(t) => {
                    setFullName(t);
                    if (nameError) setNameError(null);
                  }}
                  autoCapitalize="words"
                  error={nameError}
                />

                <BioPulseInput
                  placeholder="Email"
                  leftIcon="mail-outline"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={emailError}
                />

                <BioPulseInput
                  placeholder="Password"
                  leftIcon="lock-closed-outline"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError(null);
                  }}
                  isPassword
                  autoCapitalize="none"
                  error={passwordError}
                />

                <BioPulseInput
                  placeholder="Confirm Password"
                  leftIcon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (confirmPasswordError) setConfirmPasswordError(null);
                  }}
                  isPassword
                  autoCapitalize="none"
                  error={confirmPasswordError}
                />

                {/* Terms Checkbox */}
                <Pressable
                  onPress={() => {
                    setTermsAgreed((prev) => !prev);
                    if (termsError) setTermsError(null);
                  }}
                  style={styles.checkboxRow}
                  hitSlop={6}
                >
                  <View
                    style={[
                      styles.checkbox,
                      termsAgreed && styles.checkboxActive,
                      termsError ? styles.checkboxError : null,
                    ]}
                  >
                    {termsAgreed && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>

                  <Text style={styles.checkboxLabel}>
                    I agree to the{' '}
                    <Text
                      style={styles.legalLink}
                      onPress={onTermsPress}
                    >
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text
                      style={styles.legalLink}
                      onPress={onPrivacyPress}
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </Pressable>

                {termsError ? (
                  <Text style={styles.termsErrorText}>{termsError}</Text>
                ) : null}
              </View>

              {/* 5. Primary CTA */}
              <View style={styles.actionSection}>
                <BioPulseButton
                  title="Create Account"
                  variant="primary"
                  showArrow
                  loading={isLoading}
                  onPress={handleSignup}
                />
              </View>

              {/* 6. Social Sign Up */}
              <SocialAuthRow
                dividerText="Or continue with"
                onGooglePress={handleGooglePress}
                onApplePress={handleApplePress}
              />

              {/* 7. Footer Login Switch */}
              <View style={styles.switchAuthRow}>
                <Text style={styles.switchAuthText}>
                  Already have an account?{' '}
                  <Text
                    style={styles.switchAuthLink}
                    onPress={() => onLoginPress && onLoginPress()}
                  >
                    Log In
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </BioPulseBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: BioPulseColors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  generalErrorBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  generalErrorText: {
    color: BioPulseColors.error,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputsSection: {
    width: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BioPulseColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: BioPulseColors.teal,
    borderColor: BioPulseColors.teal,
  },
  checkboxError: {
    borderColor: BioPulseColors.error,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: BioPulseColors.textSecondary,
    lineHeight: 18,
  },
  legalLink: {
    color: BioPulseColors.teal,
    fontWeight: '600',
  },
  termsErrorText: {
    color: BioPulseColors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  actionSection: {
    width: '100%',
  },
  switchAuthRow: {
    marginVertical: 12,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 14,
    color: BioPulseColors.textSecondary,
  },
  switchAuthLink: {
    color: BioPulseColors.teal,
    fontWeight: '700',
  },
});
