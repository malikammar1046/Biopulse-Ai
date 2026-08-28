import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BorderRadius, Spacing, TouchTarget } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  leftAccessory,
  rightAccessory,
  disabled = false,
  secureTextEntry = false,
  showPasswordToggle = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const theme = useThemeColor();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const hasError = Boolean(errorText);

  const getBorderColor = (): string => {
    if (disabled) return theme.borderSubtle;
    if (hasError) return theme.error;
    if (isFocused) return theme.borderFocus;
    return theme.border;
  };

  const getBackgroundColor = (): string => {
    if (disabled) return theme.surfaceSubtle;
    return theme.surface;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          accessibilityRole="text"
          style={[
            styles.label,
            { color: hasError ? theme.error : theme.textPrimary },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: isFocused || hasError ? 1.5 : 1,
          },
        ]}
      >
        {leftAccessory ? (
          <View style={styles.leftAccessory}>{leftAccessory}</View>
        ) : null}

        <TextInput
          editable={!disabled}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={showPasswordToggle ? isSecure : secureTextEntry}
          accessibilityLabel={label || props.placeholder}
          accessibilityHint={hasError ? errorText : undefined}
          accessibilityState={{ disabled }}
          aria-invalid={hasError}
          style={[
            styles.input,
            {
              color: disabled ? theme.textMuted : theme.textPrimary,
            },
            inputStyle,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {showPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            onPress={() => setIsSecure(!isSecure)}
            style={styles.toggleButton}
          >
            <Text style={[styles.toggleText, { color: theme.primary }]}>
              {isSecure ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        ) : rightAccessory ? (
          <View style={styles.rightAccessory}>{rightAccessory}</View>
        ) : null}
      </View>

      {hasError ? (
        <Text
          accessibilityRole="alert"
          style={[styles.helperText, { color: theme.error }]}
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: TypoTokens.fontSize.label,
    lineHeight: TypoTokens.lineHeight.label,
    fontWeight: TypoTokens.fontWeight.medium,
    marginBottom: Spacing.xs,
    letterSpacing: TypoTokens.letterSpacing.wide,
  },
  inputContainer: {
    minHeight: TouchTarget.min + 4,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: TypoTokens.fontSize.body,
    paddingVertical: Spacing.sm + 2,
  },
  leftAccessory: {
    marginRight: Spacing.sm,
  },
  rightAccessory: {
    marginLeft: Spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  toggleText: {
    fontSize: TypoTokens.fontSize.bodySmall,
    fontWeight: TypoTokens.fontWeight.semibold,
  },
  helperText: {
    fontSize: TypoTokens.fontSize.caption,
    lineHeight: TypoTokens.lineHeight.caption,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
});
