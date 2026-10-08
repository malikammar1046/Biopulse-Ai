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
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../common/BioPulseBackground';
import { BioPulseButton } from '../common/BioPulseButton';
import { BioPulseInput } from '../common/BioPulseInput';
import { SocialAuthRow } from '../common/SocialAuthRow';
import { TrustBadgeRow } from '../common/TrustBadgeRow';
import { Logo } from '../brand/Logo';
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
 * Screen 3: Login Screen
 *
 * Rebuilt to match Screenshot 3:
 * - BioPulse AI logo at top
 * - "Welcome back" / "Sign in to continue your health journey."
 * - Email field with mail icon
 * - Password field with lock icon and visibility toggle
 * - "Forgot password?" right aligned
 * - "Login  →" primary teal gradient button
 * - "─── OR ───" divider
 * - Social login: Google & Apple
 * - "Don't have an account? Sign Up"
 * - Bottom trust indicators: Secure | Private | Evidence-based
 * - Full Supabase authentication & validation preserved
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

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 16 : 12);
  const bottomPad = Math.max(insets.bottom, 16);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (generalError) setGeneralError(null);
  }, [emailError, generalError]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (generalError) setGeneralError(null);
  }, [passwordError, generalError]);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setGeneralError(null);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    if (eErr || pErr) {
      setEmailError(eErr);
      setPasswordError(pErr);
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithEmailAndPassword(email.trim(), password);

      if (!result.success || !result.user) {
        setGeneralError(result.errorMessage || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      setIsLoading(false);
      setGeneralError(err?.message || 'A network error occurred. Please try again.');
    }
  };

  const handleGooglePress = useCallback(() => {
    if (onGoogleLogin) {
      onGoogleLogin();
    } else {
      Alert.alert(
        'Google Sign-In',
        'Google OAuth is available via our Supabase backend. On mobile, please sign in with your registered email and password.',
        [{ text: 'OK' }]
      );
    }
  }, [onGoogleLogin]);

  const handleApplePress = useCallback(() => {
    if (onAppleLogin) {
      onAppleLogin();
    } else {
      Alert.alert(
        'Apple Sign-In',
        'Apple Sign-In is configured for iOS production builds. Please sign in with your BioPulse email and password.',
        [{ text: 'OK' }]
      );
    }
  }, [onAppleLogin]);

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
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue your health journey.
                </Text>
              </View>

              {/* 3. General Error Message */}
              {generalError ? (
                <View style={styles.generalErrorBox}>
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

              {/* 4. Inputs */}
              <View style={styles.inputsSection}>
                <BioPulseInput
                  placeholder="Email"
                  leftIcon="mail-outline"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={emailError}
                />

                <BioPulseInput
                  placeholder="Password"
                  leftIcon="lock-closed-outline"
                  value={password}
                  onChangeText={handlePasswordChange}
                  isPassword
                  autoCapitalize="none"
                  error={passwordError}
                />

                <Pressable
                  onPress={() => onForgotPassword && onForgotPassword()}
                  style={styles.forgotPasswordButton}
                  hitSlop={8}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </Pressable>
              </View>

              {/* 5. Primary CTA */}
              <View style={styles.actionSection}>
                <BioPulseButton
                  title="Login"
                  variant="primary"
                  showArrow
                  loading={isLoading}
                  onPress={handleLogin}
                />
              </View>

              {/* 6. Social Buttons */}
              <SocialAuthRow
                dividerText="OR"
                onGooglePress={handleGooglePress}
                onApplePress={handleApplePress}
              />

              {/* 7. Sign Up Switcher */}
              <View style={styles.switchAuthRow}>
                <Text style={styles.switchAuthText}>
                  Don't have an account?{' '}
                  <Text
                    style={styles.switchAuthLink}
                    onPress={() => onSignUp && onSignUp()}
                  >
                    Sign Up
                  </Text>
                </Text>
              </View>

              {/* 8. Trust Badges */}
              <View style={styles.trustSection}>
                <TrustBadgeRow variant="security" />
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
    marginTop: 18,
    marginBottom: 20,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.teal,
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
  trustSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});
