// Background — matches the website auth page background (auth.css).
// Website: linear-gradient(145deg, #DDD0C4 0%, #C8A9A4 50%, #A87A74 100%)
// The two radial glows on the website fade to transparent — not possible in
// React Native without Skia, so the linear gradient alone gives the closest match.

import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../contexts/theme-context';

interface BackgroundProps {
  children: React.ReactNode;
}

const LIGHT_GRADIENT = ['#DDD0C4', '#C8A9A4', '#A87A74'] as const;
// Dark: near-black with subtle warm tint, same direction as light gradient
const DARK_GRADIENT  = ['#2A2320', '#1E1A18', '#1C1917'] as const;

export default function Background({ children }: BackgroundProps) {
  const { isDark } = useThemeContext();
  return (
    <LinearGradient
      colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
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