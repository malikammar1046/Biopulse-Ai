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
import { AuthHeader } from './AuthHeader';
import { AuthInput } from './AuthInput';
import { SocialAuthButtons } from './SocialAuthButtons';
import { AuthTrustPanel } from './AuthTrustPanel';
import {
  validateEmail,
  validatePassword,
  loginWithEmailAndPassword,
  UserProfile,
} from '../../features/authentication';

export interface BioPulseLoginScreenProps {
  onLoginSuccess?: (user: UserProfile) => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
}

/**
 * BioPulse AI Mobile Login Screen (Screen 3)
 *
 * Implements:
 * - Dual-pathway inclusivity (PCOS female & Hypogonadism male health pathways)
 * - Pathway-neutral health copy: "Log in to continue your personalized health journey."
 * - Exact visual reproduction of the reference design system
 * - Responsive layout supporting small phones (320px) up to tablets (1180px)
 * - Safe keyboard evasion and tap-to-dismiss behavior
 * - Robust input validation and empathetic error presentation
 */
export const BioPulseLoginScreen: React.FC<BioPulseLoginScreenProps> = ({
  onLoginSuccess,
  onForgotPassword,
  onSignUp,
  onGoogleLogin,
  onAppleLogin,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Responsive adaptivity
  const isCompact = height < 700 || width < 360;
  const isTablet = width >= 768;

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email change handler
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (generalError) setGeneralError(null);
  }, [emailError, generalError]);

  // Password change handler
  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (generalError) setGeneralError(null);
  }, [passwordError, generalError]);

  // Email field blur validation
  const handleEmailBlur = useCallback(() => {
    if (email.trim().length > 0) {
      setEmailError(validateEmail(email));
    }
  }, [email]);

  // Primary Login Submission
  const handleLogin = async () => {
    Keyboard.dismiss();
    setGeneralError(null);

    // Validate inputs
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithEmailAndPassword(email, password);

      if (result.success && result.user) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        } else {
          Alert.alert('Welcome Back', `Logged in as ${result.user.email}`);
        }
      } else {
        setGeneralError(
          result.errorMessage || 'Unable to sign in. Please verify your credentials.'
        );
      }
    } catch {
      setGeneralError('A network error occurred. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password handler
  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      Alert.alert(
        'Password Reset',
        'Password reset integration boundary. A reset link will be sent to your registered email.',
        [{ text: 'OK' }]
      );
    }
  };

  // Sign Up handler
  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      Alert.alert(
        'Create Account',
        'Account registration screen integration boundary.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Decorative Botanical Foliage & Dual-Pathway Ambient Accents */}
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
                paddingTop: Math.max(insets.top + 8, 20),
                paddingBottom: Math.max(insets.bottom + 16, 28),
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
              {/* 1. Header / Branding Lockup */}
              <AuthHeader isCompact={isCompact} />

              {/* 2. Welcome Headline & Neutral Subtitle */}
              <View style={styles.headingSection}>
                <Text style={[styles.mainHeading, isCompact && styles.mainHeadingCompact]}>
                  Welcome Back <Text style={styles.waveEmoji}>👋</Text>
                </Text>
                <Text style={[styles.subHeading, isCompact && styles.subHeadingCompact]}>
                  Log in to continue your personalized health journey.
                </Text>
              </View>

              {/* General Error Banner (if authentication failed) */}
              {generalError ? (
                <View
                  style={styles.generalErrorBanner}
                  accessible
                  accessibilityRole="alert"
                >
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

              {/* 3. Login Form */}
              <View style={styles.formContainer}>
                {/* Email Address Field */}
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

                {/* Password Field */}
                <AuthInput
                  label="Password"
                  iconName="lock-closed-outline"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  errorText={passwordError}
                  isPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                {/* Forgot Password Link */}
                <View style={styles.forgotPasswordRow}>
                  <Pressable
                    onPress={handleForgotPassword}
                    hitSlop={10}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Forgot password"
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </Pressable>
                </View>

                {/* Primary Log In Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && styles.loginButtonPressed,
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Log In"
                  accessibilityState={{ busy: isLoading }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Log In  →</Text>
                  )}
                </Pressable>

                {/* Social Login Section */}
                <SocialAuthButtons
                  onGooglePress={onGoogleLogin}
                  onApplePress={onAppleLogin}
                  disabled={isLoading}
                />

                {/* Sign Up Link */}
                <View style={styles.signUpRow}>
                  <Text style={styles.signUpTextPrompt}>
                    Don’t have an account?{' '}
                  </Text>
                  <Pressable
                    onPress={handleSignUp}
                    hitSlop={10}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Sign Up for a new BioPulse account"
                  >
                    <Text style={styles.signUpTextLink}>Sign Up</Text>
                  </Pressable>
                </View>
              </View>

              {/* 4. Lower Trust & Clinical Safety Panel */}
              <AuthTrustPanel isCompact={isCompact} />
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
    justifyContent: 'space-between',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  tabletContainer: {
    paddingVertical: 16,
  },
  headingSection: {
    marginTop: 18,
    marginBottom: 20,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: BioPulseColors.navy,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  mainHeadingCompact: {
    fontSize: 24,
    marginBottom: 4,
  },
  waveEmoji: {
    fontSize: 26,
  },
  subHeading: {
    fontSize: 14.5,
    lineHeight: 21,
    color: BioPulseColors.secondaryText,
    fontWeight: '400',
  },
  subHeadingCompact: {
    fontSize: 13.5,
    lineHeight: 19,
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
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: BioPulseColors.femaleAccent,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  loginButton: {
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
  },
  loginButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  signUpTextPrompt: {
    color: BioPulseColors.secondaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  signUpTextLink: {
    color: BioPulseColors.femaleAccent,
    fontSize: 14,
    fontWeight: '700',
  },
});
