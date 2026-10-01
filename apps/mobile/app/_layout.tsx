import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { AuthProvider } from '../features/authentication';
import { FemaleOnboardingProvider } from '../features/onboarding';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FemaleOnboardingProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.surface,
            },
            headerTintColor: theme.textPrimary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            contentStyle: {
              backgroundColor: theme.background,
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="pathway-selection"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="design-system"
            options={{
              headerShown: true,
              title: 'BioPulse Design System',
              headerBackTitle: 'Home',
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="female-basic-info"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="female-cycle-health"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="female-symptoms"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="female-lifestyle"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="female-review"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="female-screening-result"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(app)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        </FemaleOnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
