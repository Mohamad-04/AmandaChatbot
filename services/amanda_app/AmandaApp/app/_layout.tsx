import { Stack } from 'expo-router';
import { ThemeProvider } from '../contexts/theme-context';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="about" />
      </Stack>
    </ThemeProvider>
  );
}