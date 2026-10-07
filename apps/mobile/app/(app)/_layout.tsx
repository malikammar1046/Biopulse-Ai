import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { BioPulseColors } from '../../constants/Colors';
import { useAuth } from '../../features/authentication';

export default function AppGroupLayout() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
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
  );
}
