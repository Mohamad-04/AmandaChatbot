// App-wide configuration values.
// All environment-specific settings live here so they're easy to find and change.

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically resolves the backend IP from Expo's dev server host.
// This avoids hardcoding an IP that changes between networks/machines.
const resolveBackendUrl = (): string => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  let localIp = debuggerHost ? debuggerHost.split(':')[0] : '10.58.83.240'; // update to your own IP.

  // Android emulators can't use localhost — they need this special alias
  // that points to the host machine running the emulator.
  if (localIp === 'localhost' && Platform.OS === 'android') {
    localIp = '10.0.2.2';
  }

  return `http://${localIp}:5000`;
};

export const BACKEND_URL = resolveBackendUrl();
// Voice service runs on a different port than the main Flask backend
export const VOICE_SERVER_URL = BACKEND_URL.replace(':5000', ':8080');

// Voice activity detection tuning values
export const VAD_THRESHOLD    = 0.15;  // volume level that counts as speech
export const SILENCE_DURATION = 1500;  // ms of silence before recording stops
export const MIN_SPEECH_MS    = 500;   // minimum ms to count as a real utterance



