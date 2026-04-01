// Shared password rules used for validation and the live requirements UI.
// Imported by signup, reset-password, and the useAuth hook.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export const PASSWORD_RULES = [
  { label: 'At least 8 characters',       test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',   test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',             test: (p: string) => /\d/.test(p) },
  { label: 'One special character (!@#…)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>\[\]\\/_ \-+=~`';]/.test(p) },
];

// Returns the first failing rule's label, or null if all pass.
export function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return `Password must contain: ${rule.label.toLowerCase()}`;
  }
  return null;
}

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Password must contain:</Text>
      {PASSWORD_RULES.map(rule => {
        const met = rule.test(password);
        return (
          <View key={rule.label} style={styles.row}>
            <Text style={[styles.dot, met && styles.dotMet]}>{met ? '✓' : '–'}</Text>
            <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 4,
  },
  heading: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    fontSize: 12,
    width: 14,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  dotMet: {
    color: theme.colors.success,
  },
  ruleText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  ruleTextMet: {
    color: theme.colors.success,
  },
});
