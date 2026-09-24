import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Spacing } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: keyof typeof Spacing | 'none';
  label?: string;
  subtle?: boolean;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing = 'md',
  label,
  subtle = false,
  style,
}) => {
  const theme = useThemeColor();
  const borderColor = subtle ? theme.borderSubtle : theme.border;
  const marginValue = spacing === 'none' ? 0 : Spacing[spacing];

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            backgroundColor: borderColor,
            marginHorizontal: marginValue,
          },
          style,
        ]}
      />
    );
  }

  if (label) {
    return (
      <View
        style={[
          styles.labeledContainer,
          { marginVertical: marginValue },
          style,
        ]}
      >
        <View style={[styles.line, { backgroundColor: borderColor }]} />
        <Text style={[styles.labelText, { color: theme.textMuted }]}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: borderColor }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: borderColor,
          marginVertical: marginValue,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
    alignSelf: 'stretch',
  },
  labeledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  labelText: {
    paddingHorizontal: Spacing.md,
    fontSize: TypoTokens.fontSize.caption,
    fontWeight: TypoTokens.fontWeight.medium,
    letterSpacing: TypoTokens.letterSpacing.wide,
  },
});
