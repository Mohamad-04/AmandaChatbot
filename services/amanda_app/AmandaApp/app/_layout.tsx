import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '../contexts/theme-context';
import * as SplashScreen from 'expo-splash-screen';
import { splashColors } from '../constants/tokens';

SplashScreen.preventAutoHideAsync();

// Stored locally on the device via AsyncStorage - not in the database.
// This means it resets if the user reinstalls the app or gets a new phone,
// which is intentional (they should see onboarding again in that case).
const ONBOARDED_KEY = '@amanda_onboarded';

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then(val => {
      if (!val) router.replace('/about');
    }).catch(() => {}).finally(() => {
      SplashScreen.hideAsync();
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={s.splash}>
        <Text style={s.title}>Amanda</Text>
        <Text style={s.subtitle}>AI Therapist</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="about" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="personalisation" />
      </Stack>
    </ThemeProvider>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: splashColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: splashColors.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: splashColors.textSub,
    letterSpacing: 0.5,
  },
});