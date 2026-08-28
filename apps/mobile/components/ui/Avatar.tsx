import React, { useState } from 'react';
import {
  View,
  Image,
  ImageSourcePropType,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'organic';
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline' | 'primary';

export interface AvatarProps {
  source?: ImageSourcePropType | { uri: string };
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  shape = 'circle',
  status,
  style,
}) => {
  const theme = useThemeColor();
  const [imageError, setImageError] = useState(false);

  const getDimension = (): number => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 72;
      case 'md':
      default:
        return 44;
    }
  };

  const dimension = getDimension();

  const getBorderRadius = (): number => {
    if (shape === 'circle') return BorderRadius.full;
    switch (size) {
      case 'xs':
      case 'sm':
        return BorderRadius.sm;
      case 'lg':
      case 'xl':
        return BorderRadius.xl;
      case 'md':
      default:
        return BorderRadius.lg;
    }
  };

  const getInitials = (): string => {
    if (!name) return '•';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'xs':
        return 10;
      case 'sm':
        return 12;
      case 'lg':
        return 20;
      case 'xl':
        return 26;
      case 'md':
      default:
        return 16;
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'online':
        return theme.success;
      case 'busy':
        return theme.error;
      case 'away':
        return theme.warning;
      case 'primary':
        return theme.primary;
      case 'offline':
      default:
        return theme.textMuted;
    }
  };

  const renderContent = () => {
    if (source && !imageError) {
      return (
        <Image
          source={source}
          style={[
            styles.image,
            { width: dimension, height: dimension, borderRadius: getBorderRadius() },
          ]}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <Text
        style={[
          styles.initials,
          {
            color: theme.primary,
            fontSize: getFontSize(),
          },
        ]}
      >
        {getInitials()}
      </Text>
    );
  };

  const statusDotSize = Math.max(8, Math.round(dimension * 0.25));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar for ${name}` : 'User avatar'}
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: getBorderRadius(),
          backgroundColor: theme.primarySoft,
          borderColor: theme.borderSubtle,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {renderContent()}

      {status ? (
        <View
          style={[
            styles.statusDot,
            {
              width: statusDotSize,
              height: statusDotSize,
              borderRadius: statusDotSize / 2,
              backgroundColor: getStatusColor(),
              borderColor: theme.surface,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: TypoTokens.fontWeight.bold,
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2,
  },
});
