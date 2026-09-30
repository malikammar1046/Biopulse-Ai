import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  errorText?: string | null;
  helperText?: string | null;
  containerStyle?: ViewStyle;
}

/**
 * BioPulse Custom Authentication Input.
 *
 * Implements:
 * - Crisp white surface with delicate pink border (#F8DCE5)
 * - BioPulse pink left icon (#F43F7D)
 * - Deep navy input text (#073B72) and soft placeholder (#94A3B8)
 * - Dynamic focus accent state (BioPulse teal / pink)
 * - Interactive, accessible eye/eye-off visibility toggle for password fields
 * - Clear, concise error state and helper messaging
 */
export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  iconName,
  isPassword = false,
  errorText,
  helperText,
  containerStyle,
  onFocus,
  onBlur,
  editable = true,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = Boolean(errorText);

  // Border color transitions: error > focused > default
  const borderColor = hasError
    ? '#F43F5E'
    : isFocused
    ? BioPulseColors.femaleAccent
    : '#F8DCE5';

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Field Label */}
      <Text
        style={[
          styles.label,
          hasError && styles.labelError,
        ]}
        accessibilityRole="text"
      >
        {label}
      </Text>

      {/* Input Surface */}
      <View
        style={[
          styles.inputSurface,
          {
            borderColor,
            borderWidth: isFocused || hasError ? 1.5 : 1,
            backgroundColor: editable ? '#FFFFFF' : '#F8FAFC',
          },
        ]}
      >
        {/* Left Icon (BioPulse Pink) */}
        <View style={styles.leftIconContainer}>
          <Ionicons
            name={iconName}
            size={19}
            color={BioPulseColors.femaleAccent}
            accessible={false}
          />
        </View>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !isPasswordVisible}
          editable={editable}
          accessibilityLabel={label}
          accessibilityHint={errorText || undefined}
          accessibilityState={{ disabled: !editable }}
          aria-invalid={hasError}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...textInputProps}
        />

        {/* Password Visibility Toggle */}
        {isPassword && (
          <Pressable
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.eyeButton,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            accessibilityHint="Toggles password visibility between obscured and plain text"
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#8BA1B7"
            />
          </Pressable>
        )}
      </View>

      {/* Error or Helper Message */}
      {hasError ? (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 7,
    letterSpacing: -0.1,
  },
  labelError: {
    color: '#E11D48',
  },
  inputSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#073B72',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
    marginLeft: 4,
  },
  helperText: {
    color: '#8BA1B7',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 5,
    marginLeft: 4,
    lineHeight: 16,
  },
});
