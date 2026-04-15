// Shared theme context — single source of truth for dark/light mode.
//
// Wrap the app in <ThemeProvider> (done in _layout.tsx).
// Any component reads the theme via useThemeContext() or useThemeColors().
//
// useThemeContext()  → { isDark, toggleTheme }
// useThemeColors()   → the active color set (colors or darkColors from tokens.ts)

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '../constants/tokens';

const STORAGE_KEY = '@amanda_dark_theme';

type ThemeContextValue = {
  isDark:      boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark:      false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Restore saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(val => { if (val === 'true') setIsDark(true); })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Returns { isDark, toggleTheme } */
export function useThemeContext() {
  return useContext(ThemeContext);
}

/** Returns the active color palette — swap-in for the hardcoded `colors` import. */
export function useThemeColors() {
  const { isDark } = useContext(ThemeContext);
  return isDark ? darkColors : colors;
}
