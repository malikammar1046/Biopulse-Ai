import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface BioPulseInputProps extends TextInputProps {
  label?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const BioPulseInput: React.FC<BioPulseInputProps> = ({
  label,
  leftIcon,
  error,
  isPassword = false,
  containerStyle,
  secureTextEntry,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecured = isPassword && !showPassword;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? BioPulseColors.teal : BioPulseColors.textSecondary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={styles.textInput}
          placeholderTextColor={BioPulseColors.textMuted}
          secureTextEntry={isSecured}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={BioPulseColors.teal}
          {...rest}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.rightAction}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={BioPulseColors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: BioPulseColors.textPrimary,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: BioPulseColors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputFocused: {
    borderColor: BioPulseColors.teal,
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  inputError: {
    borderColor: BioPulseColors.error,
  },
  leftIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: BioPulseColors.textPrimary,
    height: '100%',
  },
  rightAction: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: BioPulseColors.error,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '500',
  },
});
