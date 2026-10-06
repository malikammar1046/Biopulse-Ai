import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

const GOOGLE_ICON = require('../../assets/google_logo.png');

export interface SocialAuthRowProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  dividerText?: string;
}

export const SocialAuthRow: React.FC<SocialAuthRowProps> = ({
  onGooglePress,
  onApplePress,
  dividerText = 'OR',
}) => {
  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{dividerText}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Button */}
      <Pressable
        onPress={onGooglePress}
        style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        <Image source={GOOGLE_ICON} style={styles.googleIcon} resizeMode="contain" />
        <Text style={styles.socialText}>Continue with Google</Text>
      </Pressable>

      {/* Apple Button */}
      <Pressable
        onPress={onApplePress}
        style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Continue with Apple"
      >
        <Ionicons name="logo-apple" size={20} color="#000000" style={styles.appleIcon} />
        <Text style={styles.socialText}>Continue with Apple</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    gap: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BioPulseColors.border,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: '#FAFDFF',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  appleIcon: {
    marginRight: 10,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
    letterSpacing: -0.1,
  },
});
