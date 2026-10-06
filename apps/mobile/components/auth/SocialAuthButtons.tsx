import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

const GOOGLE_LOGO = require('../../assets/google_logo.png');

interface SocialAuthButtonsProps {
  onGooglePress?: () => void;
  onApplePress?: () => void;
  disabled?: boolean;
  mode?: 'login' | 'signup';
}

/**
 * Social authentication buttons matching the BioPulse design specification.
 *
 * Implements:
 * - "OR" divider with soft horizontal rules
 * - "Continue with Google" / "Sign up with Google" button with official multi-color branding
 * - "Continue with Apple" / "Sign up with Apple" button with black Apple glyph
 * - Clean integration boundaries: avoids fake authentication when SDKs are not configured
 */
export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onGooglePress,
  onApplePress,
  disabled = false,
  mode = 'login',
}) => {
  const isSignUp = mode === 'signup';
  const googleLabel = isSignUp ? 'Sign up with Google' : 'Continue with Google';
  const appleLabel = isSignUp ? 'Sign up with Apple' : 'Continue with Apple';

  const handleGooglePress = () => {
    if (disabled) return;
    if (onGooglePress) {
      onGooglePress();
    } else {
      Alert.alert(
        'Google Authentication',
        `Google Authentication is not configured in this development environment. Please use email and password to ${isSignUp ? 'create an account' : 'log in'}.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleApplePress = () => {
    if (disabled) return;
    if (onApplePress) {
      onApplePress();
    } else {
      Alert.alert(
        'Apple Authentication',
        `Apple Authentication is not configured in this development environment. Please use email and password to ${isSignUp ? 'create an account' : 'log in'}.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* OR Separator */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Buttons Stack */}
      <View style={styles.buttonsStack}>
        {/* Continue with Google */}
        <Pressable
          onPress={handleGooglePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.socialButton,
            pressed && styles.socialButtonPressed,
            disabled && styles.socialButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={googleLabel}
        >
          <View style={styles.iconSlot}>
            <Image
              source={GOOGLE_LOGO}
              style={styles.googleIcon}
              resizeMode="contain"
              accessible={false}
            />
          </View>
          <Text style={styles.socialButtonText}>{googleLabel}</Text>
        </Pressable>

        {/* Continue / Sign up with Apple */}
        <Pressable
          onPress={handleApplePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.socialButton,
            pressed && styles.socialButtonPressed,
            disabled && styles.socialButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={appleLabel}
        >
          <View style={styles.iconSlot}>
            <Ionicons name="logo-apple" size={20} color="#000000" accessible={false} />
          </View>
          <Text style={styles.socialButtonText}>{appleLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  buttonsStack: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  iconSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    color: BioPulseColors.navy,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
