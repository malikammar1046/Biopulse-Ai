import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface BioPulseButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'female' | 'male';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  arrowIcon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const BioPulseButton: React.FC<BioPulseButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  showArrow = false,
  arrowIcon = 'arrow-forward',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isFemale = variant === 'female';
  const isMale = variant === 'male';

  const buttonHeight = size === 'sm' ? 42 : size === 'md' ? 48 : 56;
  const borderRadius = buttonHeight / 2;
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 15 : 16;

  // Background and border style resolution
  let containerStyle: ViewStyle = {
    height: buttonHeight,
    borderRadius,
  };

  if (isPrimary) {
    containerStyle = {
      ...containerStyle,
      backgroundColor: BioPulseColors.teal,
      borderWidth: 1,
      borderColor: '#14ABB6',
      shadowColor: '#16B8C4',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    };
  } else if (isSecondary) {
    containerStyle = {
      ...containerStyle,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#8AD2DC',
      shadowColor: '#073B72',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    };
  } else if (isFemale) {
    containerStyle = {
      ...containerStyle,
      backgroundColor: BioPulseColors.teal,
      borderWidth: 1,
      borderColor: '#13A3AD',
      shadowColor: '#16B8C4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    };
  } else if (isMale) {
    containerStyle = {
      ...containerStyle,
      backgroundColor: '#1E88E5',
      borderWidth: 1,
      borderColor: '#1976D2',
      shadowColor: '#1E88E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    };
  } else {
    // outline
    containerStyle = {
      ...containerStyle,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: BioPulseColors.border,
    };
  }

  const textColor = isPrimary || isFemale || isMale
    ? '#FFFFFF'
    : isSecondary
    ? BioPulseColors.textPrimary
    : BioPulseColors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={fontSize + 2}
              color={textColor}
              style={styles.leadingIcon}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                fontSize,
                color: textColor,
                fontWeight: isPrimary || isFemale || isMale ? '700' : '600',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {showArrow && (
            <Ionicons
              name={arrowIcon}
              size={fontSize + 2}
              color={textColor}
              style={styles.trailingArrow}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: -0.2,
  },
  leadingIcon: {
    marginRight: 8,
  },
  trailingArrow: {
    marginLeft: 8,
  },
});
