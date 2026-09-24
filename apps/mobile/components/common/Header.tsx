import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Spacing } from '../../constants/Layout';
import { useThemeColor } from '../../hooks/useThemeColor';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightAction }) => {
  const theme = useThemeColor();

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Typography variant="h2" color={theme.textPrimary}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color={theme.textMuted} style={styles.subtitle}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {rightAction ? <View style={styles.actionContainer}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  actionContainer: {
    marginLeft: Spacing.md,
  },
});
