import React from 'react';
import { Stack, Redirect, useRouter, usePathname } from 'expo-router';
import { View, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { useAuth } from '../../features/authentication';

export default function AppGroupLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, pathway } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: BioPulseColors.background,
        }}
      >
        <ActivityIndicator size="large" color={BioPulseColors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const isCompanionOpen = pathname ? pathname.includes('ai-companion') : false;
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const accentColor = isFemale ? '#F43F7D' : '#0284C7';

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: BioPulseColors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="track" options={{ headerShown: false }} />
        <Stack.Screen name="guidance" options={{ headerShown: false }} />
        <Stack.Screen name="more" options={{ headerShown: false }} />
      </Stack>

      {/* Floating Circular AI Companion Launcher */}
      {!isCompanionOpen && (
        <Pressable
          onPress={() => router.push('/(app)/ai-companion')}
          style={[styles.floatingLauncher, { backgroundColor: accentColor }]}
          accessibilityRole="button"
          accessibilityLabel="Open BioPulse AI Companion"
          hitSlop={8}
        >
          <MaterialCommunityIcons name="robot-outline" size={26} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingLauncher: {
    position: 'absolute',
    bottom: 84,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 9999,
  },
});
