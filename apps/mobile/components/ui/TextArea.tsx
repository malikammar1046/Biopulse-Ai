import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export interface TextAreaProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  minHeight?: number;
  showCharacterCount?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  helperText,
  errorText,
  disabled = false,
  minHeight = 100,
  showCharacterCount = false,
  maxLength,
  containerStyle,
  inputStyle,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}) => {
  const theme = useThemeColor();
  const [isFocused, setIsFocused] = useState(false);
  const [textLength, setTextLength] = useState(value?.length || 0);

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

  const handleTextChange = (text: string) => {
    setTextLength(text.length);
    onChangeText?.(text);
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
          styles.container,
          {
            minHeight,
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: isFocused || hasError ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          multiline
          textAlignVertical="top"
          editable={!disabled}
          maxLength={maxLength}
          placeholderTextColor={theme.textMuted}
          accessibilityLabel={label || props.placeholder}
          accessibilityHint={hasError ? errorText : undefined}
          accessibilityState={{ disabled }}
          aria-invalid={hasError}
          style={[
            styles.input,
            {
              color: disabled ? theme.textMuted : theme.textPrimary,
              minHeight: minHeight - Spacing.lg * 2,
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={handleTextChange}
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
      </View>

      <View style={styles.footerRow}>
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
        ) : (
          <View style={styles.flexOne} />
        )}

        {showCharacterCount && maxLength ? (
          <Text style={[styles.counterText, { color: theme.textMuted }]}>
            {textLength} / {maxLength}
          </Text>
        ) : null}
      </View>
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
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  input: {
    fontSize: TypoTokens.fontSize.body,
    lineHeight: TypoTokens.lineHeight.body,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  flexOne: {
    flex: 1,
  },
  helperText: {
    flex: 1,
    fontSize: TypoTokens.fontSize.caption,
    lineHeight: TypoTokens.lineHeight.caption,
  },
  counterText: {
    fontSize: TypoTokens.fontSize.caption,
    lineHeight: TypoTokens.lineHeight.caption,
    marginLeft: Spacing.sm,
  },
});
