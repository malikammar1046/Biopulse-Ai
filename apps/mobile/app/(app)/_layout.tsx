import React from 'react';
import { Stack } from 'expo-router';
import { BioPulseColors } from '../../constants/Colors';

export default function AppGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: BioPulseColors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
