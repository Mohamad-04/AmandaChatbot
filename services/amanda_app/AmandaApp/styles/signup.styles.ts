import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({

  screen: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  // ── Layout ────────────────────────────────────────────────────────────
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Hero text ─────────────────────────────────────────────────────────
  heroText: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },

  heroGreeting: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 34,
  },

  heroTitleAccent: {
    color: theme.colors.primary,
  },

  // ── Card ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    gap: 18,
  },

  // ── Form ──────────────────────────────────────────────────────────────
  formGroup: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 227, 211, 0.55)',
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },

  inputWrapperFocused: {
    borderColor: 'rgba(168, 122, 116, 0.55)',
    backgroundColor: theme.colors.glassStrong,
  },

  inputIcon: {
    fontSize: 16,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
  },

  // ── Messages ──────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(192, 57, 43, 0.30)',
    borderRadius: 10,
    padding: 12,
  },

  errorIcon: {
    fontSize: 14,
  },

  errorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 13,
  },

  // ── Button ────────────────────────────────────────────────────────────
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  btnDisabled: {
    opacity: 0.5,
  },

  btnText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Divider ───────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },

  dividerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  footerText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },

  footerLink: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});