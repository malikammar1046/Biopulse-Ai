import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../hooks/useThemeColor';
import { Spacing } from '../../constants/Layout';

export interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  safeArea = true,
}) => {
  const theme = useThemeColor();

  const content = (
    <View style={[styles.content, { backgroundColor: theme.background }, contentContainerStyle]}>
      {children}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }, style]}>
        {content}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
});
