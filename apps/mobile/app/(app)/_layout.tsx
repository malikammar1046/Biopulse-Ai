import { Stack } from 'expo-router';

export default function AppGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#f8fafc',
        contentStyle: {
          backgroundColor: '#090d16',
        },
      }}
    />
  );
}
