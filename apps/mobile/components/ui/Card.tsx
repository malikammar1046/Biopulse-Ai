import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { useThemeColor } from '../../hooks/useThemeColor';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  padded = true,
  style,
  children,
  ...props
}) => {
  const theme = useThemeColor();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.surfaceElevated : theme.surface,
          borderColor: theme.cardBorder,
        },
        padded && { padding: Spacing.lg },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});
