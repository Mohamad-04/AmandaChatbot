// Thin re-export so existing `useTheme()` call sites keep working.
// The actual state now lives in ThemeContext (contexts/theme-context.tsx),
// which means ALL components share the same isDark value and toggling
// in the sidebar immediately affects every screen.

export { useThemeContext as useTheme } from '../contexts/theme-context';
