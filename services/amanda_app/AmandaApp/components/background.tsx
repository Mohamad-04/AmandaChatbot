// Auth screen background — always uses the light gradient regardless of theme.
// The chat screen manages its own dark background via tc.bgBase in chat.tsx.
// Website: linear-gradient(145deg, #DDD0C4 0%, #C8A9A4 50%, #A87A74 100%)

import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../constants/tokens';

interface BackgroundProps {
  children: React.ReactNode;
}

export default function Background({ children }: BackgroundProps) {
  return (
    <LinearGradient
      colors={gradients.backgroundShort}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
