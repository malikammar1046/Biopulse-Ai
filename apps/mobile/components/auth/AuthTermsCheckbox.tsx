import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

interface AuthTermsCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  onPressTerms: () => void;
  onPressPrivacy: () => void;
  errorText?: string | null;
  disabled?: boolean;
}

/**
 * BioPulse Terms of Service & Privacy Policy Agreement Checkbox.
 *
 * Implements:
 * - Real interactive checkbox control with accessible state
 * - Distinct interactive touch targets for "Terms of Service" and "Privacy Policy"
 * - Clear validation error feedback if left unchecked
 */
export const AuthTermsCheckbox: React.FC<AuthTermsCheckboxProps> = ({
  checked,
  onToggle,
  onPressTerms,
  onPressPrivacy,
  errorText,
  disabled = false,
}) => {
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Real Checkbox Button */}
        <Pressable
          onPress={onToggle}
          disabled={disabled}
          hitSlop={8}
          style={({ pressed }) => [
            styles.checkboxBase,
            checked && styles.checkboxChecked,
            hasError && !checked && styles.checkboxError,
            pressed && { opacity: 0.75 },
            disabled && { opacity: 0.5 },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked, disabled }}
          accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
        >
          {checked && (
            <Ionicons name="checkmark" size={15} color="#FFFFFF" accessible={false} />
          )}
        </Pressable>

        {/* Text with Interactive Links */}
        <View style={styles.textContainer}>
          <Text style={styles.labelBody}>
            <Text onPress={onToggle}>I agree to the </Text>
            <Text
              style={styles.linkText}
              onPress={onPressTerms}
              accessibilityRole="link"
              accessibilityLabel="View Terms of Service"
            >
              Terms of Service
            </Text>
            <Text onPress={onToggle}> and </Text>
            <Text
              style={styles.linkText}
              onPress={onPressPrivacy}
              accessibilityRole="link"
              accessibilityLabel="View Privacy Policy"
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      {/* Error message */}
      {hasError ? (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBase: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: BioPulseColors.femaleAccent,
    borderColor: BioPulseColors.femaleAccent,
  },
  checkboxError: {
    borderColor: '#E11D48',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    fontWeight: '400',
  },
  linkText: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '600',
  },
  errorText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 32,
  },
});
