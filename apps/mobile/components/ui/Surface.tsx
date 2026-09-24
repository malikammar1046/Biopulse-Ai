import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { useThemeColor } from '../../hooks/useThemeColor';

export type SurfaceLevel = 'default' | 'subtle' | 'elevated' | 'primarySoft' | 'translucent';

export interface SurfaceProps extends ViewProps {
  level?: SurfaceLevel;
  rounded?: keyof typeof BorderRadius;
  bordered?: boolean;
  padding?: keyof typeof Spacing;
  children: React.ReactNode;
}

export const Surface: React.FC<SurfaceProps> = ({
  level = 'default',
  rounded = 'lg',
  bordered = false,
  padding,
  style,
  children,
  ...props
}) => {
  const theme = useThemeColor();

  const getBackgroundColor = (): string => {
    switch (level) {
      case 'subtle':
        return theme.surfaceSubtle;
      case 'elevated':
        return theme.surfaceElevated;
      case 'primarySoft':
        return theme.primarySoft;
      case 'translucent':
        return theme.glowOrbPrimary;
      case 'default':
      default:
        return theme.surface;
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: BorderRadius[rounded],
    borderColor: bordered ? theme.border : 'transparent',
    borderWidth: bordered ? 1 : 0,
    padding: padding !== undefined ? Spacing[padding] : undefined,
  };

  return (
    <View style={[styles.base, containerStyle, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
