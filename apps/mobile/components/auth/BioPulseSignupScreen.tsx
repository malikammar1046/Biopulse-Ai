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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from './AuthBackgroundFoliage';
import { SignupTopBar } from './SignupTopBar';
import { SignupHeroIllustration } from './SignupHeroIllustration';
import { AuthInput } from './AuthInput';
import { AuthTermsCheckbox } from './AuthTermsCheckbox';
import { SocialAuthButtons } from './SocialAuthButtons';
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
 * BioPulse AI Mobile Create Account / Sign Up Screen (Screen 4)
 *
 * Implements:
 * - Dual-pathway inclusivity: visually represents female (PCOS) & male (hypogonadism) users
 * - Full Name, Email, Password, and Confirm Password fields with active validation
 * - Real interactive Terms of Service & Privacy Policy agreement checkbox
 * - Upper-right dual-character vector illustration (paired female & male health motifs)
 * - Safe keyboard handling and responsive layout across phones and tablets
 */
export const BioPulseSignupScreen: React.FC<BioPulseSignupScreenProps> = ({
  onBack,
  onSignupSuccess,
  onLoginPress,
  onTermsPress,
  onPrivacyPress,
  onGoogleSignup,
  onAppleSignup,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Responsive breakpoints
  const isCompact = height < 720 || width < 360;
  const isTablet = width >= 768;

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Error States
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Field change handlers
  const handleNameChange = useCallback((text: string) => {
    setFullName(text);
    if (nameError) setNameError(null);
    if (generalError) setGeneralError(null);
  }, [nameError, generalError]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (generalError) setGeneralError(null);
  }, [emailError, generalError]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (generalError) setGeneralError(null);
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else if (confirmPassword && text === confirmPassword) {
      setConfirmPasswordError(null);
    }
  }, [passwordError, generalError, confirmPassword]);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) setConfirmPasswordError(null);
    if (generalError) setGeneralError(null);
  }, [confirmPasswordError, generalError]);

  const handleToggleTerms = useCallback(() => {
    setTermsAgreed((prev) => {
      const next = !prev;
      if (next && termsError) setTermsError(null);
      return next;
    });
    if (generalError) setGeneralError(null);
  }, [termsError, generalError]);

  // Blur validation handlers
  const handleNameBlur = useCallback(() => {
    if (fullName.trim().length > 0) {
      setNameError(validateFullName(fullName));
    }
  }, [fullName]);

  const handleEmailBlur = useCallback(() => {
    if (email.trim().length > 0) {
      setEmailError(validateEmail(email));
    }
  }, [email]);

  const handlePasswordBlur = useCallback(() => {
    if (password.length > 0) {
      setPasswordError(validateRegistrationPassword(password));
    }
  }, [password]);

  const handleConfirmPasswordBlur = useCallback(() => {
    if (confirmPassword.length > 0) {
      setConfirmPasswordError(validateConfirmPassword(password, confirmPassword));
    }
  }, [password, confirmPassword]);

  // Submit Handler
  const handleCreateAccount = async () => {
    Keyboard.dismiss();
    setGeneralError(null);

    // Validate all fields
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
        fullName,
        email,
        password,
        confirmPassword,
        termsAgreed,
      });

      if (result.success && result.user) {
        if (onSignupSuccess) {
          onSignupSuccess(result.user);
        } else {
          Alert.alert(
            'Account Created',
            `Welcome to BioPulse AI, ${result.user.fullName || 'Member'}!`,
            [{ text: 'Continue' }]
          );
        }
      } else {
        setGeneralError(
          result.errorMessage || 'Registration could not be completed. Please try again.'
        );
      }
    } catch {
      setGeneralError(
        'A network connection issue occurred. Please check your network and retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Terms and Privacy handlers with clean integration boundaries
  const handlePressTerms = () => {
    if (onTermsPress) {
      onTermsPress();
    } else {
      Alert.alert(
        'Terms of Service',
        'BioPulse AI is a personalized health screening intelligence platform. It provides non-diagnostic risk assessments and longitudinal wellness tracking. By using this service, you acknowledge that assessments do not replace professional medical diagnosis.\n\n(Full Terms of Service route boundary).',
        [{ text: 'Close' }]
      );
    }
  };

  const handlePressPrivacy = () => {
    if (onPrivacyPress) {
      onPrivacyPress();
    } else {
      Alert.alert(
        'Privacy Policy',
        'Your health and biometric data are encrypted at rest and in transit. BioPulse AI adheres to strict data privacy principles and never sells personal health telemetry to third parties.\n\n(Full Privacy Policy route boundary).',
        [{ text: 'Close' }]
      );
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleLogin = () => {
    if (onLoginPress) {
      onLoginPress();
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Decorative Botanical Foliage & Dual-Pathway Ambient Glows */}
      <AuthBackgroundFoliage topOffset={insets.top} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top + 6, 16),
                paddingBottom: Math.max(insets.bottom + 20, 32),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Constrained Centered Column for Phone/Tablet Responsiveness */}
            <View
              style={[
                styles.contentContainer,
                isTablet && styles.tabletContainer,
              ]}
            >
              {/* 1. Top Navigation Bar (Back Button + Centered Brand Lockup) */}
              <SignupTopBar onBack={handleBack} isCompact={isCompact} />

              {/* 2. Header Row with Title, Copy, and Upper-Right Dual-Hero Illustration */}
              <View style={styles.headerHeroRow}>
                {/* Text Column */}
                <View style={styles.titleColumn}>
                  <Text
                    style={[
                      styles.mainHeading,
                      isCompact && styles.mainHeadingCompact,
                    ]}
                  >
                    Create Your Account
                  </Text>
                  <Text
                    style={[
                      styles.subHeading,
                      isCompact && styles.subHeadingCompact,
                    ]}
                  >
                    Join BioPulse AI and take the first step towards a healthier you.
                  </Text>
                </View>

                {/* Upper-Right Dual-Pathway Vignette Hero Artwork */}
                <SignupHeroIllustration isCompact={isCompact} />
              </View>

              {/* General Error Banner */}
              {generalError ? (
                <View
                  style={styles.generalErrorBanner}
                  accessible
                  accessibilityRole="alert"
                >
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

              {/* 3. Form Fields */}
              <View style={styles.formContainer}>
                {/* Full Name */}
                <AuthInput
                  label="Full Name"
                  iconName="person-outline"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={handleNameChange}
                  onBlur={handleNameBlur}
                  errorText={nameError}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  editable={!isLoading}
                  returnKeyType="next"
                />

                {/* Email Address */}
                <AuthInput
                  label="Email Address"
                  iconName="mail-outline"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  errorText={emailError}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!isLoading}
                  returnKeyType="next"
                />

                {/* Password */}
                <AuthInput
                  label="Password"
                  iconName="lock-closed-outline"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  errorText={passwordError}
                  helperText="At least 8 characters with a mix of letters, numbers and symbols."
                  isPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  editable={!isLoading}
                  returnKeyType="next"
                />

                {/* Confirm Password */}
                <AuthInput
                  label="Confirm Password"
                  iconName="lock-closed-outline"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  errorText={confirmPasswordError}
                  isPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateAccount}
                />

                {/* Terms of Service & Privacy Policy Checkbox */}
                <AuthTermsCheckbox
                  checked={termsAgreed}
                  onToggle={handleToggleTerms}
                  onPressTerms={handlePressTerms}
                  onPressPrivacy={handlePressPrivacy}
                  errorText={termsError}
                  disabled={isLoading}
                />

                {/* Primary Create Account Button */}
                <Pressable
                  onPress={handleCreateAccount}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.submitButtonPressed,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Create Account"
                  accessibilityState={{ busy: isLoading }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Account  →</Text>
                  )}
                </Pressable>

                {/* Social Sign Up Section */}
                <SocialAuthButtons
                  mode="signup"
                  onGooglePress={onGoogleSignup}
                  onApplePress={onAppleSignup}
                  disabled={isLoading}
                />

                {/* Existing Account Link */}
                <View style={styles.loginRow}>
                  <Text style={styles.loginPromptText}>
                    Already have an account?{' '}
                  </Text>
                  <Pressable
                    onPress={handleLogin}
                    hitSlop={10}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Log in to existing account"
                  >
                    <Text style={styles.loginLinkText}>Log In</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: BioPulseColors.background,
  },
  keyboardAvoider: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  tabletContainer: {
    paddingVertical: 18,
  },
  headerHeroRow: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 18,
    minHeight: 105,
    justifyContent: 'center',
  },
  titleColumn: {
    width: '68%',
    paddingRight: 8,
    zIndex: 2,
  },
  mainHeading: {
    fontSize: 27,
    fontWeight: '800',
    color: BioPulseColors.navy,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  mainHeadingCompact: {
    fontSize: 23,
    marginBottom: 5,
  },
  subHeading: {
    fontSize: 14,
    lineHeight: 20,
    color: BioPulseColors.secondaryText,
    fontWeight: '400',
  },
  subHeadingCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  generalErrorBanner: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#9F1239',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  submitButton: {
    width: '100%',
    height: 52,
    backgroundColor: BioPulseColors.femaleAccent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BioPulseColors.femaleAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 4,
  },
  submitButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  loginPromptText: {
    color: BioPulseColors.secondaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkText: {
    color: BioPulseColors.femaleAccent,
    fontSize: 14,
    fontWeight: '700',
  },
});
