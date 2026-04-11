import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '../contexts/theme-context';

// Stored locally on the device via AsyncStorage — not in the database.
// This means it resets if the user reinstalls the app or gets a new phone,
// which is intentional (they should see onboarding again in that case).
const ONBOARDED_KEY = '@amanda_onboarded';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // On every app open, check if this device has completed onboarding.
    // If not, redirect to the about/onboarding screen before anything else loads.
    AsyncStorage.getItem(ONBOARDED_KEY).then(val => {
      if (!val) router.replace('/about');
    }).catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="about" />
        <Stack.Screen name="profile-setup" />
      </Stack>
    </ThemeProvider>
  );
}