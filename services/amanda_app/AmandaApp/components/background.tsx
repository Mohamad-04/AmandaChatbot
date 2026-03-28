import { View, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface BackgroundProps {
  children: React.ReactNode;
}

// Use this to wrap any screen that should have the flat warm base colour.
// For the landing screen the gradient is used instead (see theme.colors.gradient).
export default function Background({ children }: BackgroundProps) {
  return (
    <View style={styles.bg}>
      <View style={styles.overlay} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,   // ← from theme, not hardcoded
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgTint,   // ← from theme, not hardcoded
  },
});